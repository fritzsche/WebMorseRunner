import { test } from 'node:test'
import assert from 'node:assert/strict'
import { float32ToInt16, buildWavBuffer, recFilename, formatRecStatus } from '../recording.js'

// --- float32ToInt16 ---

test('float32ToInt16: zero input produces all zeros', () => {
    const result = float32ToInt16(new Float32Array([0, 0, 0]))
    assert.strictEqual(result[0], 0)
    assert.strictEqual(result[1], 0)
    assert.strictEqual(result[2], 0)
})

test('float32ToInt16: +1.0 maps to 32767', () => {
    const result = float32ToInt16(new Float32Array([1.0]))
    assert.strictEqual(result[0], 32767)
})

test('float32ToInt16: -1.0 maps to -32767', () => {
    const result = float32ToInt16(new Float32Array([-1.0]))
    assert.strictEqual(result[0], -32767)
})

test('float32ToInt16: +2.0 is clamped to 32767', () => {
    const result = float32ToInt16(new Float32Array([2.0]))
    assert.strictEqual(result[0], 32767)
})

test('float32ToInt16: -2.0 is clamped to -32768', () => {
    const result = float32ToInt16(new Float32Array([-2.0]))
    assert.strictEqual(result[0], -32768)
})

test('float32ToInt16: output length matches input length', () => {
    const input = new Float32Array(512)
    const result = float32ToInt16(input)
    assert.strictEqual(result.length, 512)
    assert.ok(result instanceof Int16Array)
})

test('float32ToInt16: mixed values convert and round correctly', () => {
    const input = new Float32Array([0.5, -0.5, 0.25])
    const result = float32ToInt16(input)
    assert.strictEqual(result[0], Math.round(0.5 * 32767))
    assert.strictEqual(result[1], Math.round(-0.5 * 32767))
    assert.strictEqual(result[2], Math.round(0.25 * 32767))
})

// --- buildWavBuffer ---

test('buildWavBuffer: output has correct total size', () => {
    const totalSamples = 100
    const chunk = new Int16Array(totalSamples)
    const buf = buildWavBuffer([chunk], totalSamples)
    assert.strictEqual(buf.byteLength, 44 + totalSamples * 2)
})

test('buildWavBuffer: zero samples produces valid 44-byte header', () => {
    const buf = buildWavBuffer([], 0)
    assert.strictEqual(buf.byteLength, 44)
})

test('buildWavBuffer: RIFF magic bytes correct', () => {
    const buf = buildWavBuffer([], 0)
    const view = new DataView(buf)
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
    assert.strictEqual(riff, 'RIFF')
})

test('buildWavBuffer: WAVE magic bytes correct', () => {
    const buf = buildWavBuffer([], 0)
    const view = new DataView(buf)
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
    assert.strictEqual(wave, 'WAVE')
})

test('buildWavBuffer: fmt magic bytes correct', () => {
    const buf = buildWavBuffer([], 0)
    const view = new DataView(buf)
    const fmt = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15))
    assert.strictEqual(fmt, 'fmt ')
})

test('buildWavBuffer: data magic bytes correct', () => {
    const buf = buildWavBuffer([], 0)
    const view = new DataView(buf)
    const data = String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39))
    assert.strictEqual(data, 'data')
})

test('buildWavBuffer: sample rate at offset 24 is 11025', () => {
    const buf = buildWavBuffer([], 0)
    const view = new DataView(buf)
    assert.strictEqual(view.getUint32(24, true), 11025)
})

test('buildWavBuffer: custom sample rate is stored correctly', () => {
    const buf = buildWavBuffer([], 0, 22050)
    const view = new DataView(buf)
    assert.strictEqual(view.getUint32(24, true), 22050)
})

test('buildWavBuffer: mono channel (offset 22 = 1)', () => {
    const buf = buildWavBuffer([], 0)
    const view = new DataView(buf)
    assert.strictEqual(view.getUint16(22, true), 1)
})

test('buildWavBuffer: 16 bits per sample (offset 34 = 16)', () => {
    const buf = buildWavBuffer([], 0)
    const view = new DataView(buf)
    assert.strictEqual(view.getUint16(34, true), 16)
})

test('buildWavBuffer: PCM format (offset 20 = 1)', () => {
    const buf = buildWavBuffer([], 0)
    const view = new DataView(buf)
    assert.strictEqual(view.getUint16(20, true), 1)
})

test('buildWavBuffer: PCM data matches input Int16 values', () => {
    const chunk = new Int16Array([100, -200, 32767, -32768, 0])
    const buf = buildWavBuffer([chunk], chunk.length)
    const pcm = new Int16Array(buf, 44)
    for (let i = 0; i < chunk.length; i++) {
        assert.strictEqual(pcm[i], chunk[i])
    }
})

test('buildWavBuffer: multiple chunks are concatenated correctly', () => {
    const c1 = new Int16Array([1, 2, 3])
    const c2 = new Int16Array([4, 5, 6])
    const buf = buildWavBuffer([c1, c2], 6)
    const pcm = new Int16Array(buf, 44)
    assert.strictEqual(pcm[0], 1)
    assert.strictEqual(pcm[2], 3)
    assert.strictEqual(pcm[3], 4)
    assert.strictEqual(pcm[5], 6)
})

// --- recFilename ---

test('recFilename: matches expected pattern', () => {
    const name = recFilename('DJ1TF', new Date('2026-06-09T14:30:22Z'))
    assert.match(name, /^morse_.*_\d{8}_\d{6}Z\.wav$/)
})

test('recFilename: contains call sign', () => {
    const name = recFilename('DJ1TF', new Date('2026-06-09T14:30:22Z'))
    assert.ok(name.includes('DJ1TF'), `filename "${name}" should include call sign`)
})

test('recFilename: slashes in call sign replaced with dashes', () => {
    const name = recFilename('VK2/DJ1TF', new Date('2026-06-09T00:00:00Z'))
    assert.ok(!name.includes('/'), `filename "${name}" should not contain slashes`)
    assert.ok(name.includes('-'), `filename "${name}" should contain dashes`)
})

test('recFilename: UTC date and time match the now argument', () => {
    const now = new Date('2026-06-09T14:30:22Z')
    const name = recFilename('TEST', now)
    assert.ok(name.includes('20260609'), `"${name}" should contain date 20260609`)
    assert.ok(name.includes('143022'), `"${name}" should contain time 143022`)
})

test('recFilename: fallback call sign when empty', () => {
    const name = recFilename('', new Date('2026-01-01T00:00:00Z'))
    assert.ok(name.startsWith('morse_REC_'), `"${name}" should use REC fallback`)
})

// --- formatRecStatus ---

test('formatRecStatus: zero samples', () => {
    assert.strictEqual(formatRecStatus(0), 'REC 00:00 (0.0 MB)')
})

test('formatRecStatus: one second (11025 samples)', () => {
    assert.strictEqual(formatRecStatus(11025), 'REC 00:01 (0.0 MB)')
})

test('formatRecStatus: one minute (11025 * 60 samples)', () => {
    const result = formatRecStatus(11025 * 60)
    assert.strictEqual(result, 'REC 01:00 (1.3 MB)')
})

test('formatRecStatus: 90 seconds (11025 * 90 samples)', () => {
    const result = formatRecStatus(11025 * 90)
    assert.strictEqual(result, 'REC 01:30 (1.9 MB)')
})

test('formatRecStatus: displays minutes and seconds with zero-padding', () => {
    const result = formatRecStatus(11025 * 65)
    assert.strictEqual(result, 'REC 01:05 (1.4 MB)')
})
