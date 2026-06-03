import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DxOperator } from '../dxoperator.js'
import { DEFAULT, OperatorState, StationMessage, RunMode } from '../defaults.js'

const { Yes, No, Almost } = DxOperator.CallCheckResult

// ── IsMyCall (already covered in dxoperator.test.js, brief re-check here) ────

test('IsMyCall: exact match is Yes', () => {
    assert.strictEqual(DxOperator.IsMyCall('DJ1TF', 'DJ1TF'), Yes)
})

// ── Construction ──────────────────────────────────────────────────────────────

test('DxOperator: constructs with Done state', () => {
    const op = new DxOperator('DJ1TF')
    assert.strictEqual(op.State, OperatorState.Done)
    assert.strictEqual(op.Call, 'DJ1TF')
    assert.strictEqual(op.Skills, 0)
})

// ── Wpm getter ────────────────────────────────────────────────────────────────

test('DxOperator Wpm: HST mode always returns DEFAULT.WPM', () => {
    const op = new DxOperator('W1AW')
    op.Skills = 2
    DEFAULT.RUNMODE = RunMode.Hst
    DEFAULT.WPM = 35
    assert.strictEqual(op.Wpm, 35)
    DEFAULT.RUNMODE = RunMode.Single  // restore
})

test('DxOperator Wpm: individual mode returns value within [DX_MIN_WPM, DX_MAX_WPM]', () => {
    const op = new DxOperator('W1AW')
    DEFAULT.RUNMODE = RunMode.Single
    DEFAULT.DX_WPM_TYPE = 'individual'
    DEFAULT.DX_MIN_WPM = 15
    DEFAULT.DX_MAX_WPM = 25
    for (let i = 0; i < 50; i++) {
        const wpm = op.Wpm
        assert.ok(wpm >= 15 && wpm <= 25, `Wpm ${wpm} outside [15, 25]`)
    }
    DEFAULT.DX_WPM_TYPE = 'standard'  // restore
})

test('DxOperator Wpm: standard mode returns value between 50% and 100% of DEFAULT.WPM', () => {
    const op = new DxOperator('W1AW')
    DEFAULT.RUNMODE = RunMode.Single
    DEFAULT.DX_WPM_TYPE = 'standard'
    DEFAULT.WPM = 30
    for (let i = 0; i < 50; i++) {
        const wpm = op.Wpm
        assert.ok(wpm >= 15 && wpm <= 30, `Wpm ${wpm} outside [15, 30]`)
    }
})

// ── NR getter ─────────────────────────────────────────────────────────────────
// NR = 1 + round(random * (Tst.Minute + CONTEST_START_OFFSET_MIN) * Skills)
// Without a running contest Tst.Minute is 0, so NR = 1 when Skills is 0.

test('DxOperator NR: with Skills=0 always returns 1', () => {
    const op = new DxOperator('W1AW')
    op.Skills = 0
    DEFAULT.CONTEST_START_OFFSET_MIN = 0
    for (let i = 0; i < 20; i++) assert.strictEqual(op.NR, 1)
})

test('DxOperator NR: with offset returns value >= 1', () => {
    const op = new DxOperator('W1AW')
    op.Skills = 3
    DEFAULT.CONTEST_START_OFFSET_MIN = 120  // 2h offset
    const nr = op.NR
    assert.ok(nr >= 1, `NR ${nr} must be >= 1`)
    DEFAULT.CONTEST_START_OFFSET_MIN = 0  // restore
})

// ── State machine: MsgReceived ────────────────────────────────────────────────

test('DxOperator: CQ received in Done state stays Done', () => {
    const op = new DxOperator('W1AW')
    op.State = OperatorState.Done
    op.MsgReceived([StationMessage.CQ])
    assert.strictEqual(op.State, OperatorState.Done)
})

test('DxOperator: after _SetState(NeedQso) state is NeedQso', () => {
    const op = new DxOperator('W1AW')
    op._SetState(OperatorState.NeedQso)
    assert.strictEqual(op.State, OperatorState.NeedQso)
})

test('DxOperator: CQ in NeedPrevEnd transitions to NeedQso', () => {
    const op = new DxOperator('W1AW')
    op.State = OperatorState.NeedPrevEnd
    op.MsgReceived([StationMessage.CQ])
    assert.strictEqual(op.State, OperatorState.NeedQso)
})

test('DxOperator: NIL in NeedPrevEnd transitions to NeedQso', () => {
    const op = new DxOperator('W1AW')
    op.State = OperatorState.NeedPrevEnd
    op.MsgReceived([StationMessage.Nil])
    assert.strictEqual(op.State, OperatorState.NeedQso)
})

test('DxOperator: TU in NeedEnd transitions to Done', () => {
    const op = new DxOperator('W1AW')
    op.State = OperatorState.NeedEnd
    op.Patience = 5
    op.MsgReceived([StationMessage.TU])
    assert.strictEqual(op.State, OperatorState.Done)
})

// ── GetSendDelay ──────────────────────────────────────────────────────────────

test('DxOperator: GetSendDelay in NeedPrevEnd returns NEVER', () => {
    const op = new DxOperator('W1AW')
    op.State = OperatorState.NeedPrevEnd
    const delay = op.GetSendDelay()
    assert.strictEqual(delay, Number.MAX_SAFE_INTEGER)
})

test('DxOperator: GetSendDelay in non-NeedPrevEnd state returns positive number', () => {
    const op = new DxOperator('W1AW')
    op._SetState(OperatorState.NeedQso)
    DEFAULT.RUNMODE = RunMode.Single
    DEFAULT.WPM = 20
    const delay = op.GetSendDelay()
    assert.ok(delay > 0, `delay ${delay} should be > 0`)
})

// ── GetReplyTimeout ───────────────────────────────────────────────────────────

test('DxOperator: GetReplyTimeout returns positive number', () => {
    const op = new DxOperator('W1AW')
    op.Skills = 2
    DEFAULT.RUNMODE = RunMode.Single
    const t = op.GetReplyTimeout()
    assert.ok(t > 0, `timeout ${t} should be > 0`)
})

// ── Patience / _DecPatience ───────────────────────────────────────────────────

test('DxOperator: patience exhaustion sets state to Failed', () => {
    const op = new DxOperator('W1AW')
    op._SetState(OperatorState.NeedQso)
    op.Patience = 1
    op._DecPatience()
    assert.strictEqual(op.State, OperatorState.Failed)
})
