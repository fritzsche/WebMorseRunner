import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QuickAvg } from '../quickavg.js'

// --- Construction ---

test('QuickAvg: constructs with defaults', () => {
    const q = new QuickAvg()
    assert.strictEqual(q.FPoints, 128)
    assert.strictEqual(q.FPasses, 4)
    assert.strictEqual(q.Idx, 0)
})

// --- Setters ---

test('QuickAvg: passes setter clamps to [1, 8]', () => {
    const q = new QuickAvg()
    q.passes = 0
    assert.strictEqual(q.FPasses, 1)
    q.passes = 100
    assert.strictEqual(q.FPasses, 8)
    q.passes = 3
    assert.strictEqual(q.FPasses, 3)
})

test('QuickAvg: points setter clamps to min 1', () => {
    const q = new QuickAvg()
    q.points = 0
    assert.strictEqual(q.FPoints, 1)
    q.points = 64
    assert.strictEqual(q.FPoints, 64)
})

test('QuickAvg: points getter returns FPoints', () => {
    const q = new QuickAvg()
    q.points = 50
    assert.strictEqual(q.points, 50)
})

// --- Buffer dimensions ---

test('QuickAvg: ReBufs has FPasses+1 arrays', () => {
    const q = new QuickAvg()
    assert.strictEqual(q.ReBufs.length, q.FPasses + 1)
})

test('QuickAvg: each buffer length equals FPoints', () => {
    const q = new QuickAvg()
    for (const buf of q.ReBufs) {
        assert.strictEqual(buf.length, q.FPoints)
    }
})

// --- Filter behaviour ---

test('QuickAvg: Filter returns Re and Im values', () => {
    const q = new QuickAvg()
    const result = q.Filter(1.0, 0.0)
    assert.ok('Re' in result)
    assert.ok('Im' in result)
})

test('QuickAvg: Filter on constant zero input returns zero', () => {
    const q = new QuickAvg()
    // warm up the filter so internal state stabilises
    for (let i = 0; i < q.FPoints * (q.FPasses + 2); i++) q.Filter(0, 0)
    const { Re, Im } = q.Filter(0, 0)
    assert.strictEqual(Re, 0)
    assert.strictEqual(Im, 0)
})

test('QuickAvg: Filter advances Idx by 1 each call (wraps at FPoints)', () => {
    const q = new QuickAvg()
    q.points = 4
    assert.strictEqual(q.Idx, 0)
    q.Filter(1, 0)
    assert.strictEqual(q.Idx, 1)
    q.Filter(1, 0)
    assert.strictEqual(q.Idx, 2)
})

test('QuickAvg: Reset clears buffers and resets index', () => {
    const q = new QuickAvg()
    for (let i = 0; i < 20; i++) q.Filter(Math.random(), Math.random())
    q.Reset()
    assert.strictEqual(q.Idx, 0)
    for (const buf of q.ReBufs) {
        const allZero = buf.every(v => v === 0)
        assert.ok(allZero, 'buffer should be zero after Reset')
    }
})
