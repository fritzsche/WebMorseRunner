import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MovAvg } from '../movavg.js'

// --- Construction ---

test('MovAvg: constructs with default parameters', () => {
    const f = new MovAvg()
    assert.strictEqual(f.FPasses, 3)
    assert.strictEqual(f.FPoints, 129)
    assert.strictEqual(f.FSamplesInInput, 512)
})

// --- Setters trigger _Reset ---

test('MovAvg: points setter updates FPoints', () => {
    const f = new MovAvg()
    f.points = 64
    assert.strictEqual(f.points, 64)
})

test('MovAvg: passes setter updates FPasses', () => {
    const f = new MovAvg()
    f.passes = 2
    assert.strictEqual(f.FPasses, 2)
})

test('MovAvg: gainDb setter updates FNorm', () => {
    const f = new MovAvg()
    const normBefore = f.FNorm
    f.gainDb = 6
    assert.notStrictEqual(f.FNorm, normBefore)
})

// --- Buffer dimensions after reset ---

test('MovAvg: BufRe has passes+1 arrays after construction', () => {
    const f = new MovAvg()
    assert.strictEqual(f.BufRe.length, f.FPasses + 1)
})

test('MovAvg: each buffer has FSamplesInInput+FPoints elements', () => {
    const f = new MovAvg()
    const expectedLen = f.FSamplesInInput + f.FPoints
    for (const buf of f.BufRe) {
        assert.strictEqual(buf.length, expectedLen)
    }
})

// --- Filter: output same length as input ---

test('MovAvg: Filter preserves input array length', () => {
    const f = new MovAvg()
    f.points = 5
    f.passes = 1
    const size = 512
    const data = { Re: new Float32Array(size), Im: new Float32Array(size) }
    f.Filter(data)
    assert.strictEqual(data.Re.length, size)
    assert.strictEqual(data.Im.length, size)
})

test('MovAvg: Filter zeroes settle to zero on constant zero input', () => {
    const f = new MovAvg()
    f.points = 5
    f.passes = 1
    const size = 512
    // feed many blocks of zeros; output should also be zero
    for (let round = 0; round < 10; round++) {
        const data = { Re: new Float32Array(size), Im: new Float32Array(size) }
        f.Filter(data)
        if (round === 9) {
            for (let i = 0; i < size; i++) {
                assert.strictEqual(data.Re[i], 0)
                assert.strictEqual(data.Im[i], 0)
            }
        }
    }
})
