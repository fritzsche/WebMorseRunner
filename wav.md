# Audio Recording Design for WebMorseRunner

## Background

WebMorseRunner plays CW (Morse code) audio entirely in an `AudioWorkletProcessor`
(audio thread). The audio is generated procedurally in `contest.js` — not streamed
from a file — so recording requires capturing the generated samples directly and
assembling them into a downloadable file after the contest ends.

## Sample Rate and Memory Budget

- **Sample rate:** 11,025 Hz (`DEFAULT.RATE` in `defaults.js`)
- **Sample format on output:** Float32, range ≈ −1.0 … +1.0 (normalized by dividing
  by 32,800 in `contest.js:getBlock()`)
- **Storage format:** Int16 PCM (2 bytes/sample) — standard WAV, half the size of Float32

| Duration | Int16 @ 11,025 Hz mono |
|----------|------------------------|
| 10 min   | 13.3 MB                |
| 30 min   | 39.7 MB                |
| 60 min   | 79.4 MB                |
| 90 min   | 119 MB                 |

A 90-minute hard cap (≈ 119 MB) is well within Chrome/Firefox heap limits (typically
several GB for web apps). The audio thread itself only ever holds one small batch
buffer (32 KB) at any one time — it never accumulates data.

## Chosen Architecture: Batched Transferable Transfer

### Why not MediaRecorder?

`MediaRecorder` could tap `ContestNode` via a `MediaStreamDestination` node and
produce compressed WebM/Opus — much smaller files. However:

1. Opus latency/artefacts are undesirable for CW audio analysis/replay.
2. Safari/iOS codec support for `audio/webm;codecs=opus` is unreliable.
3. Adds an extra audio graph node to every contest session.

WAV (uncompressed PCM) is the right choice for a training tool: bit-perfect, instant
decode, opens in every audio editor.

### Why not SharedArrayBuffer?

Requires `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy:
require-corp` HTTP headers — a deployment constraint that is out of scope.

### Chosen approach: Transferable ArrayBuffer batches

The audio worklet accumulates samples in a pre-allocated `Float32Array(8192)`.
When full (~743 ms of audio), the backing `ArrayBuffer` is *transferred* (zero-copy
pointer swap, not structured-clone) to the main thread via `postMessage`. The worklet
immediately allocates a fresh 32 KB buffer and continues without stalling.

The main thread converts each Float32 batch to Int16 and appends it to a chunk list.
When recording stops (user or contest end), the main thread assembles a WAV blob and
triggers a download.

### Data Flow

```
AUDIO THREAD                              MAIN THREAD
────────────────────────────────          ──────────────────────────────────────
process() every 128 samples (11.6ms)

  getBlock() → this._block[128]           [User clicks Rec button]
                                          → sendMessage({type: start_recording})
  if _recording:
    copy _block into _rec_buf
    _rec_pos += 128
    if _rec_pos == 8192:                  [receives audio_chunk]
      postMessage(audio_chunk,            → Float32→Int16 conversion
        [_rec_buf.buffer])  ──────────►   → push Int16Array to _recChunks[]
      _rec_buf = new Float32Array(8192)   → update duration display
      _rec_pos = 0

  [receives stop_recording]               [Contest ends OR user clicks Rec again]
  → _recording = false                    → sendMessage({type: stop_recording})
  → flush partial buffer                  → wait 200ms for flush to arrive
    postMessage(audio_chunk partial)      → _finalizeRecording()
                                          → assemble WAV blob
                                          → trigger download
```

**Message batch rate:** 8192 / 11025 ≈ 0.743 seconds per batch → ~1.35 messages/sec
to the main thread. This is extremely low overhead.

**ArrayBuffer transfer cost:** A pointer swap in V8's GC metadata — sub-microsecond
in the audio thread. No copy, no GC pressure.

## WAV File Format

44-byte header, mono, 16-bit PCM little-endian:

```
Offset  Bytes  Value          Description
──────  ─────  ─────────────  ──────────────────────────
0       4      "RIFF"         Chunk ID
4       4      36 + dataSize  Total file size - 8
8       4      "WAVE"         Format
12      4      "fmt "         Subchunk1 ID
16      4      16             Subchunk1 size (PCM = 16)
20      2      1              AudioFormat (1 = PCM)
22      2      1              NumChannels (mono)
24      4      11025          SampleRate
28      4      22050          ByteRate = 11025 × 1 × 2
32      2      2              BlockAlign = 1 × 16/8
34      2      16             BitsPerSample
36      4      "data"         Subchunk2 ID
40      4      dataSize       Subchunk2 size (bytes of PCM)
44      …      PCM samples    Int16 little-endian
```

Float32-to-Int16 conversion (with clamp for rare AGC overshoot):
```js
i16[i] = Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32767)))
```

Download filename: `morse_DJ1TF_20260609_143022Z.wav`
(call sign from config + UTC date/time at recording start)

## Files to Modify

### 1. `defaults.js` — Add 3 new AudioMessage constants

Add to the `AudioMessage` object:

```js
start_recording: 'start_recording',
stop_recording:  'stop_recording',
audio_chunk:     'audio_chunk',
```

`audio_chunk` flows audio-thread → main-thread; the other two flow main → audio.

---

### 2. `contest-processor.js` — Accumulate samples, batch-transfer to main thread

**In constructor**, add after `this._start = false`:

```js
this._recording = false
this._rec_buf   = new Float32Array(8192)
this._rec_pos   = 0
```

**Replace the existing `port.onmessage` handler** (currently lines 12-15) with:

```js
this.port.onmessage = (e) => {
  const { type } = e.data
  if (type === AudioMessage.start_recording) {
    this._rec_buf = new Float32Array(8192)
    this._rec_pos = 0
    this._recording = true
    return
  }
  if (type === AudioMessage.stop_recording) {
    this._recording = false
    if (this._rec_pos > 0) {
      const partial = this._rec_buf.slice(0, this._rec_pos)
      this.port.postMessage(
        { type: AudioMessage.audio_chunk, data: partial.buffer },
        [partial.buffer]
      )
    }
    this._rec_pos = 0
    return
  }
  Tst.onmessage(e.data)
  this._start = true
}
```

Recording messages are intercepted before `Tst.onmessage()` so `contest.js` needs
no changes.

**In `process()`, after the channel-copy loop** (after line 31 `}`), add before
`return true`:

```js
if (this._recording) {
  for (let i = 0; i < 128; i++) {
    this._rec_buf[this._rec_pos++] = this._block[i]
    if (this._rec_pos === 8192) {
      this.port.postMessage(
        { type: AudioMessage.audio_chunk, data: this._rec_buf.buffer },
        [this._rec_buf.buffer]
      )
      this._rec_buf = new Float32Array(8192)
      this._rec_pos = 0
    }
  }
}
```

Note: `AudioMessage` must be imported. Since `contest-processor.js` already imports
from `./contest.js`, add a second import:

```js
import { AudioMessage } from "./defaults.js"
```

---

### 3. `index.html` — Add Record button, LED, and status span

In the `<div class="flex_form">` block (lines 155-163), add after the `<label for="time">` line:

```html
<button id="record" class="no_run" title="Record audio to WAV">&#9210; Rec</button>
<div id="rec-indicator" class="led-indicator"></div>
<span id="rec-status" class="rec-status"></span>
```

The `class="no_run"` on the button automatically disables it when no contest is
running (via the existing `toggleNoRunFields()` in `view.js`).

Unicode `&#9210;` is ⏺ (black circle for record).

---

### 4. `style.css` — Recording indicator pulse and status text

Add after the `.tx-active` rule block:

```css
.rec-active {
    background-color: #cc0000;
    box-shadow: 0 0 10px #cc0000, 0 0 20px #cc0000, 0 0 30px #880000;
    animation: rec-pulse 1.2s ease-in-out infinite;
}

@keyframes rec-pulse {
    0%   { opacity: 1.0; }
    50%  { opacity: 0.55; }
    100% { opacity: 1.0; }
}

button#record.recording {
    background-color: #990000;
}

.rec-status {
    font-size: 9pt;
    color: #cc4444;
    min-width: 10em;
    font-family: 'Courier New', monospace;
    line-height: 30px;
    vertical-align: middle;
}
```

The pulsing LED (`.rec-active`) differs from TX indicator (`.tx-active`, solid red)
so the user can distinguish recording from transmitting at a glance.

---

### 5. `view.js` — Recording state, UI wiring, WAV assembly

#### New instance fields (add in constructor near `this.running = false`):

```js
this.recording         = false
this._recChunks        = []       // Array<Int16Array>
this._recTotalSamples  = 0        // for display and cap
this._recTimerId       = null
this._recMaxSamples    = 11025 * 60 * 90  // 90-minute hard cap
```

#### New method: `initRecordButton()`

```js
initRecordButton() {
    this.recordBtn       = document.getElementById('record')
    this.recordIndicator = document.getElementById('rec-indicator')
    this.recordStatus    = document.getElementById('rec-status')
    this.recordBtn.addEventListener('click', () => {
        if (!this.running) return
        if (this.recording) this.stopRecording()
        else this.startRecording()
    })
}
```

Call from `onLoad()` after `this.initRunButton()`:

```js
this.initRecordButton()
```

#### New method: `startRecording()`

```js
startRecording() {
    if (!this.running || this.recording) return
    this.recording = true
    this._recChunks = []
    this._recTotalSamples = 0
    this._recTimerId = window.setInterval(() => this._updateRecordingDisplay(), 1000)
    this._updateRecordingDisplay()
    this.recordBtn.classList.add('recording')
    this.recordIndicator.classList.add('rec-active')
    this.sendMessage({ type: AudioMessage.start_recording })
}
```

#### New method: `stopRecording()`

```js
stopRecording() {
    if (!this.recording) return
    this.recording = false
    if (this._recTimerId) {
        window.clearInterval(this._recTimerId)
        this._recTimerId = null
    }
    this.recordBtn.classList.remove('recording')
    this.recordIndicator.classList.remove('rec-active')
    this.recordStatus.textContent = ''
    this.sendMessage({ type: AudioMessage.stop_recording })
    setTimeout(() => this._finalizeRecording(), 200)
}
```

The 200 ms delay ensures the partial-flush `audio_chunk` message arrives before
`_finalizeRecording()` runs.

#### New method: `_onAudioChunk(buffer)`

```js
_onAudioChunk(buffer) {
    const f32 = new Float32Array(buffer)
    const i16 = new Int16Array(f32.length)
    for (let i = 0; i < f32.length; i++) {
        i16[i] = Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32767)))
    }
    this._recChunks.push(i16)
    this._recTotalSamples += f32.length
    if (this._recTotalSamples >= this._recMaxSamples) {
        this._updateRecordingDisplay()
        this.stopRecording()
    }
}
```

#### New method: `_finalizeRecording()`

```js
_finalizeRecording() {
    if (this._recChunks.length === 0) return
    const dataBytes = this._recTotalSamples * 2
    const buf = new ArrayBuffer(44 + dataBytes)
    const view = new DataView(buf)
    const str = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }
    str(0,  'RIFF')
    view.setUint32(4,  36 + dataBytes, true)
    str(8,  'WAVE')
    str(12, 'fmt ')
    view.setUint32(16, 16,    true)
    view.setUint16(20, 1,     true)  // PCM
    view.setUint16(22, 1,     true)  // mono
    view.setUint32(24, 11025, true)  // sample rate
    view.setUint32(28, 22050, true)  // byte rate
    view.setUint16(32, 2,     true)  // block align
    view.setUint16(34, 16,    true)  // bits per sample
    str(36, 'data')
    view.setUint32(40, dataBytes, true)
    let offset = 44
    for (const chunk of this._recChunks) {
        new Int16Array(buf, offset, chunk.length).set(chunk)
        offset += chunk.byteLength
    }
    this._recChunks = []
    const blob = new Blob([buf], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = this._recFilename()
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
}
```

#### New method: `_recFilename()`

```js
_recFilename() {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const d = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}`
    const t = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
    const call = (this._config._config.my_call || 'REC').replace(/\//g, '-')
    return `morse_${call}_${d}_${t}Z.wav`
}
```

#### New method: `_updateRecordingDisplay()`

```js
_updateRecordingDisplay() {
    if (!this.recordStatus) return
    const secs = Math.round(this._recTotalSamples / 11025)
    const mins = Math.floor(secs / 60)
    const s    = secs % 60
    const mb   = (this._recTotalSamples * 2 / 1048576).toFixed(1)
    const pad  = n => String(n).padStart(2, '0')
    this.recordStatus.textContent = `REC ${pad(mins)}:${pad(s)} (${mb} MB)`
}
```

#### Extend `stopContest()` — auto-stop recording when contest ends

Add as the **first line** of `stopContest()`, before `this.running = false`:

```js
if (this.recording) this.stopRecording()
```

> Important: must come before `this.running = false` because `stopRecording()` calls
> `sendMessage()` which requires the `ContestNode` to still be connected. The worklet
> disconnect happens later in `stopContest()`.

#### Extend `ContestNode.port.onmessage` switch block

Add a new case before `default:`:

```js
case AudioMessage.audio_chunk:
    this._onAudioChunk(e.data.data)
    break
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Rec button clicked when no contest running | Button has `class="no_run"` → disabled; `startRecording()` also guards `!this.running` |
| Contest timer expires while recording | `stopContest()` calls `stopRecording()` first (before disconnect) → WAV download triggered |
| User clicks Stop button while recording | Same path via `stopContest()` |
| User clicks Rec a second time (manual stop) | `stopRecording()` → flush → WAV download; contest continues |
| Zero-length recording | `_finalizeRecording()` returns early if `_recChunks.length === 0` |
| 90-minute cap reached | `_onAudioChunk()` calls `stopRecording()` → auto-download |
| Partial-flush chunk arrives after `recording = false` | `_onAudioChunk()` always pushes to `_recChunks`; safe because array is reset only in `startRecording()` and at end of `_finalizeRecording()` |
| Multiple contest sessions | `startRecording()` resets `_recChunks` and `_recTotalSamples` |
| Browser tab hidden during recording | AudioWorklets continue in background tabs (Chrome/Firefox); no action needed |

---

## Unit Tests

The pure functions (WAV assembly, Float32→Int16 conversion, filename formatting,
display formatting) are extracted into a new standalone module `recording.js` at
the project root. This makes them importable in Node.js tests without a DOM.

### New file: `recording.js`

```js
export function float32ToInt16(f32Array) { ... }
export function buildWavBuffer(chunks, totalSamples, sampleRate = 11025) { ... }
export function recFilename(callSign, now = new Date()) { ... }
export function formatRecStatus(totalSamples, sampleRate = 11025) { ... }
```

`view.js` imports these functions from `recording.js` instead of inlining them.

### `test/recording.test.js`

Uses `node:test` + `assert/strict` (matching all existing test files).

**float32ToInt16:** zero→0, +1.0→32767, −1.0→−32768, +2.0 clamped→32767, −2.0 clamped→−32768

**buildWavBuffer:** header magic bytes ("RIFF", "WAVE", "fmt ", "data"), sample rate at
offset 24, mono/16-bit flags, total buffer size = 44 + totalSamples×2, PCM values match input

**recFilename:** matches `/^morse_.*_\d{8}_\d{6}Z\.wav$/`, call sign slashes replaced with `-`

**formatRecStatus:** 0→`"REC 00:00 (0.0 MB)"`, 11025×60→`"REC 01:00 (1.3 MB)"`

Add `test/recording.test.js` to the `scripts.test` list in `package.json`.

## Implementation Order

1. `defaults.js` — add 3 message constants (prerequisite for everything else)
2. `recording.js` — create pure function module (prerequisite for both view.js and tests)
3. `test/recording.test.js` — write and verify tests pass (`npm test`)
4. `contest-processor.js` — add import + recording fields + updated message handler + accumulation loop
5. `index.html` — add button, LED div, status span
6. `style.css` — add pulse animation and status text rules
7. `view.js` — import from `recording.js`, add all recording methods and wire up hooks
8. `package.json` — add `test/recording.test.js` to test script

## Verification

1. Start contest → click Rec → wait ~30 seconds → click Rec again
   - WAV file downloads automatically
   - Open in any audio editor (e.g. Audacity): should be 11,025 Hz mono 16-bit PCM,
     duration matches what the status counter showed
2. Start contest → click Rec → let contest timer expire
   - WAV downloads automatically when contest ends
3. Start contest → click Rec → click Stop button
   - WAV downloads automatically
4. Try clicking Rec when no contest is running → button must be disabled (grayed out)
5. Record ~1 minute → inspect file size: should be ≈ 1.3 MB/min
6. Confirm audio playback was not affected (no glitches, dropouts, or timing errors
   in CW decoding) during any of the above tests
