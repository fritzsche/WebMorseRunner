import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Volume } from '../volume.js'

// --- Construction ---

test('Volume: constructs without error', () => {
    const v = new Volume()
    assert.ok(v._FMaxOut === 20000)
    assert.ok(v._FNoiseIn === 1)
    assert.ok(v._FNoiseOut === 2000)
})

test('Volume: attack shape is pre-allocated Float32Array', () => {
    const v = new Volume()
    assert.ok(v._FAttackShape instanceof Float32Array)
    assert.ok(v._FAttackShape.length > 0)
})

// --- Setters ---

test('Volume: NoiseInDb setter recalculates beta', () => {
    const v = new Volume()
    const betaBefore = v._FBeta
    v.NoiseInDb = 80
    assert.notStrictEqual(v._FBeta, betaBefore)
})

test('Volume: MaxOut setter recalculates beta', () => {
    const v = new Volume()
    const betaBefore = v._FBeta
    v.MaxOut = 30000
    assert.notStrictEqual(v._FBeta, betaBefore)
    assert.strictEqual(v._FMaxOut, 30000)
})

test('Volume: AttackSamples setter clamps to min 1', () => {
    const v = new Volume()
    v.AttackSamples = 0
    assert.strictEqual(v._FAttackSamples, 1)
    v.AttackSamples = 100
    assert.strictEqual(v._FAttackSamples, 100)
})

test('Volume: HoldSamples setter clamps to min 1', () => {
    const v = new Volume()
    v.HoldSamples = -5
    assert.strictEqual(v._FHoldSamples, 1)
    v.HoldSamples = 50
    assert.strictEqual(v._FHoldSamples, 50)
})

// --- Process: default gain (AGC disabled) ---

test('Volume: Process returns array same length as input', () => {
    const v = new Volume()
    const input = new Array(512).fill(100)
    const result = v.Process(input)
    assert.strictEqual(result.length, input.length)
})

test('Volume: Process with AGC disabled applies default gain', () => {
    const v = new Volume()
    // default gain = FNoiseOut / FNoiseIn = 2000 / 1 = 2000
    const input = [1]
    const result = v.Process(input)
    // clamped to FMaxOut = 20000; 1 * 2000 = 2000, well within range
    assert.ok(Math.abs(result[0] - v._FDefaultGain) < 1e-6)
})

test('Volume: Process clamps output to FMaxOut', () => {
    const v = new Volume()
    // large input should be clamped
    const input = new Array(16).fill(1e9)
    const result = v.Process(input)
    for (const val of result) {
        assert.ok(Math.abs(val) <= v._FMaxOut + 1e-9, `${val} exceeds MaxOut`)
    }
})

test('Volume: Process with zero input returns zeros', () => {
    const v = new Volume()
    const result = v.Process(new Array(16).fill(0))
    for (const val of result) assert.strictEqual(val, 0)
})

// --- AGC ---

test('Volume: AGC enable/disable toggle works without error', () => {
    const v = new Volume()
    v.AgcEnabled = true
    v.AgcEnabled = false
    assert.ok(true, 'toggle should not throw')
})

test('Volume: Process with AGC enabled returns finite values', () => {
    const v = new Volume()
    v.AgcEnabled = true
    // warm up
    for (let i = 0; i < 5; i++) v.Process(new Array(512).fill(1000))
    const result = v.Process(new Array(512).fill(1000))
    for (const val of result) {
        assert.ok(isFinite(val), `AGC output ${val} must be finite`)
    }
})
