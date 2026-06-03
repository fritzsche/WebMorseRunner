import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT, OperatorState, RunMode, StationMessage } from '../defaults.js'
import { _setContestRef } from '../station.js'
import { Station } from '../station.js'
import { DxStation } from '../dxstation.js'
import { QrmStation } from '../qrmstation.js'
import { QrnStation } from '../qrnstation.js'

// Set stable defaults before tests run
DEFAULT.RUNMODE = RunMode.Single
DEFAULT.WPM = 20
DEFAULT.QSB = false
DEFAULT.FLUTTER = false
DEFAULT.LIDS = false
DEFAULT.CONTEST_START_OFFSET_MIN = 0
DEFAULT.DX_WPM_TYPE = 'standard'

// Minimal contest stub so station constructors that call SendMsg/getExchange don't crash
const _stubConf = {
    active_contest: {
        exchange: [{ id: 'rst' }, { id: 'nr' }],
        exchange_msg: '<rst><nr>',
    },
}
class _StubContest {
    constructor() { this._conf = _stubConf }
}
const _stubTst = { post: () => {} }
_setContestRef(_StubContest, _stubTst)

// ── Station base class ────────────────────────────────────────────────────────

test('Station: static constants are defined', () => {
    assert.ok(Station.NEVER === Number.MAX_VALUE)
    assert.strictEqual(Station.State.Listening, 1)
    assert.strictEqual(Station.State.Sending, 4)
    assert.strictEqual(Station.Event.MsgSent, 2)
    assert.strictEqual(Station.Event.Timeout, 1)
})

test('Station: NrAsText formats RST and NR together', () => {
    const result = Station.NrAsText(599, 1)
    // 5NN replaces 599; 0s become T or O; result has digits/letters
    assert.ok(typeof result === 'string' && result.length > 0)
})

test('Station: NrAsText for 3-digit NR produces 6-char base (before substitutions)', () => {
    // RST=599 (3 chars) + NR=001 (3 chars) → base "599001" before CW substitution
    // After substitution 599→5NN, 0→T/O — length stays 6
    const result = Station.NrAsText(599, 1)
    assert.strictEqual(result.length, 6, `expected 6 chars, got "${result}"`)
})

test('Station: NrAsText for 4-digit NR produces 7-char base', () => {
    // RST=599 (3) + NR=1000 (4) → base length 7
    const result = Station.NrAsText(599, 1000)
    assert.strictEqual(result.length, 7, `expected 7 chars for 4-digit NR, got "${result}"`)
})

test('Station: RstAsText replaces 599 with 5NN', () => {
    const result = Station.RstAsText(599)
    assert.strictEqual(result, '5NN')
})

test('Station: RstAsText formats other RST values', () => {
    const result = Station.RstAsText(559)
    assert.strictEqual(result, '559')
})

// ── DxStation ─────────────────────────────────────────────────────────────────

test('DxStation: constructs from call array', () => {
    const stn = new DxStation(['W1AW'])
    assert.strictEqual(stn.MyCall, 'W1AW')
    assert.strictEqual(stn.HisCall, DEFAULT.CALL)
})

test('DxStation: Skills is 1, 2, or 3', () => {
    for (let i = 0; i < 20; i++) {
        const stn = new DxStation(['W1AW'])
        assert.ok([1, 2, 3].includes(stn.Oper.Skills), `Skills ${stn.Oper.Skills} not in [1,2,3]`)
    }
})

test('DxStation: RST is 599 when LIDS is false', () => {
    DEFAULT.LIDS = false
    const stn = new DxStation(['W1AW'])
    assert.strictEqual(stn.RST, 599)
})

test('DxStation: NR is >= 1', () => {
    const stn = new DxStation(['W1AW'])
    assert.ok(stn.NR >= 1, `NR ${stn.NR} must be >= 1`)
})

test('DxStation: Wpm is a positive integer', () => {
    for (let i = 0; i < 10; i++) {
        const stn = new DxStation(['W1AW'])
        assert.ok(Number.isInteger(stn.Wpm) && stn.Wpm > 0, `Wpm ${stn.Wpm} invalid`)
    }
})

test('DxStation: Amplitude is within valid range', () => {
    // 9000 + 18000 * (1 + RndUShaped()), RndUShaped in [0,1] → max 45000
    for (let i = 0; i < 20; i++) {
        const stn = new DxStation(['W1AW'])
        assert.ok(stn.Amplitude >= 9000 && stn.Amplitude <= 45000, `Amplitude ${stn.Amplitude} out of range`)
    }
})

test('DxStation: exchange1 set when call array has second element', () => {
    const stn = new DxStation(['DJ1TF', 'DOK123'])
    assert.strictEqual(stn.exchange1, 'DOK123')
})

test('DxStation: isDone is false on fresh construction', () => {
    const stn = new DxStation(['W1AW'])
    assert.strictEqual(stn.isDone(), false)
})

test('DxStation: no Qsb when QSB and FLUTTER are false', () => {
    DEFAULT.QSB = false
    DEFAULT.FLUTTER = false
    const stn = new DxStation(['W1AW'])
    assert.ok(!stn.Qsb, 'Qsb should not be initialised when both QSB and FLUTTER are off')
})

test('DxStation: Qsb is present when QSB is true', () => {
    DEFAULT.QSB = true
    DEFAULT.FLUTTER = false
    const stn = new DxStation(['W1AW'])
    assert.ok(stn.Qsb, 'Qsb should be initialised when QSB is on')
    DEFAULT.QSB = false  // restore
})

test('DxStation: operator state is NeedPrevEnd after construction', () => {
    const stn = new DxStation(['W1AW'])
    assert.strictEqual(stn.Oper.State, OperatorState.NeedPrevEnd)
})

// ── QrmStation ────────────────────────────────────────────────────────────────

test('QrmStation: constructs with a call', () => {
    const stn = new QrmStation('DX0ABC')
    assert.strictEqual(stn.MyCall, 'DX0ABC')
})

test('QrmStation: Patience is in [1, 5]', () => {
    for (let i = 0; i < 30; i++) {
        const stn = new QrmStation('DX0ABC')
        assert.ok(stn.Patience >= 1 && stn.Patience <= 5, `Patience ${stn.Patience} out of [1,5]`)
    }
})

test('QrmStation: Amplitude is > 0', () => {
    for (let i = 0; i < 10; i++) {
        const stn = new QrmStation('DX0ABC')
        assert.ok(stn.Amplitude > 0, `Amplitude ${stn.Amplitude} must be > 0`)
    }
})

test('QrmStation: Wpm is in [30, 49]', () => {
    for (let i = 0; i < 30; i++) {
        const stn = new QrmStation('DX0ABC')
        assert.ok(stn.Wpm >= 30 && stn.Wpm < 50, `Wpm ${stn.Wpm} out of [30,49]`)
    }
})

test('QrmStation: ProcessEvent MsgSent decrements Patience', () => {
    const stn = new QrmStation('DX0ABC')
    stn.Patience = 3
    stn.done = false
    stn.ProcessEvent(Station.Event.MsgSent)
    assert.strictEqual(stn.Patience, 2)
})

test('QrmStation: ProcessEvent MsgSent sets done when Patience reaches 0', () => {
    const stn = new QrmStation('DX0ABC')
    stn.Patience = 1
    stn.done = false
    stn.ProcessEvent(Station.Event.MsgSent)
    assert.strictEqual(stn.done, true)
})

// ── QrnStation ────────────────────────────────────────────────────────────────

test('QrnStation: constructs with pre-filled envelope', () => {
    const stn = new QrnStation()
    assert.ok(stn._Envelope instanceof Float32Array)
    assert.ok(stn._Envelope.length > 0)
})

test('QrnStation: Amplitude is positive and capped at 3000', () => {
    for (let i = 0; i < 10; i++) {
        const stn = new QrnStation()
        assert.ok(stn.Amplitude > 0 && stn.Amplitude <= 3000, `Amplitude ${stn.Amplitude} out of range`)
    }
})

test('QrnStation: ProcessEvent MsgSent sets done=true', () => {
    const stn = new QrnStation()
    stn.ProcessEvent(Station.Event.MsgSent)
    assert.strictEqual(stn.done, true)
})

test('QrnStation: ProcessEvent Timeout does not set done', () => {
    const stn = new QrnStation()
    stn.ProcessEvent(Station.Event.Timeout)
    assert.ok(!stn.done, 'done should remain falsy for Timeout event')
})

test('QrnStation: starts in Sending state', () => {
    const stn = new QrnStation()
    assert.strictEqual(stn.State, Station.State.Sending)
})
