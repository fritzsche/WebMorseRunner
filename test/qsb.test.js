import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Qsb } from '../qsb.js'
import { DEFAULT } from '../defaults.js'

// --- Construction ---

test('Qsb: constructs without error', () => {
    const q = new Qsb()
    assert.ok(q.QsbLevel === 1)
    assert.ok(q.FGain > 0)
})

test('Qsb: Filter is a QuickAvg instance with passes=3', () => {
    const q = new Qsb()
    assert.strictEqual(q.Filter.FPasses, 3)
})

// --- NewGain ---

test('Qsb: NewGain returns a positive finite number', () => {
    const q = new Qsb()
    for (let i = 0; i < 20; i++) {
        const g = q.NewGain()
        assert.ok(isFinite(g), `NewGain returned non-finite: ${g}`)
        assert.ok(g >= 0, `NewGain returned negative: ${g}`)
    }
})

test('Qsb: QsbLevel=0 NewGain always returns 1', () => {
    const q = new Qsb()
    q.QsbLevel = 0
    // result = x * 0 + (1 - 0) = 1
    for (let i = 0; i < 10; i++) {
        assert.strictEqual(q.NewGain(), 1)
    }
})

// --- ApplyTo ---

test('Qsb: ApplyTo does not change array length', () => {
    const q = new Qsb()
    const arr = new Float32Array(DEFAULT.BUFSIZE).fill(1000)
    q.ApplyTo(arr)
    assert.strictEqual(arr.length, DEFAULT.BUFSIZE)
})

test('Qsb: ApplyTo with QsbLevel=0 leaves values unchanged (gain=1)', () => {
    const q = new Qsb()
    q.QsbLevel = 0
    // warm up gain to 1
    const arr = new Float32Array(DEFAULT.BUFSIZE).fill(1.0)
    q.ApplyTo(arr)
    // all values should still be 1.0 since NewGain returns 1 when QsbLevel=0
    for (const v of arr) {
        assert.ok(Math.abs(v - 1.0) < 1e-6, `value ${v} should be ~1.0`)
    }
})

test('Qsb: Bandwidth setter does not throw', () => {
    const q = new Qsb()
    q.Bandwidth = 0.2
    q.Bandwidth = 0.5
    assert.ok(true)
})
