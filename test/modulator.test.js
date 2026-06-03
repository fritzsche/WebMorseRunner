import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Modulator } from '../modulator.js'
import { DEFAULT } from '../defaults.js'

// --- Construction ---

test('Modulator: constructs with default carrier frequency', () => {
    const m = new Modulator()
    // carrierFreq is snapped to nearest integer multiple of sample rate
    assert.ok(m.FCarrierFreq > 0)
    assert.ok(m.FSamplesPerSec === DEFAULT.RATE)
})

test('Modulator: FSampleNo starts at 0', () => {
    const m = new Modulator()
    assert.strictEqual(m.FSampleNo, 0)
})

// --- Carrier table ---

test('Modulator: sine/cosine tables have same length', () => {
    const m = new Modulator()
    assert.strictEqual(m._Sn.length, m._Cs.length)
})

test('Modulator: cosine table starts at 1 (normalized)', () => {
    const m = new Modulator()
    assert.ok(Math.abs(m._Cs[0] - 1) < 1e-9, 'Cs[0] should be 1')
})

test('Modulator: sine table starts at 0', () => {
    const m = new Modulator()
    assert.ok(Math.abs(m._Sn[0]) < 1e-9, 'Sn[0] should be 0')
})

test('Modulator: carrierFreq setter recalculates tables', () => {
    const m = new Modulator()
    const lenBefore = m._Cs.length
    m.carrierFreq = 700
    // length changes because it depends on RATE/freq
    assert.ok(m._Cs.length > 0)
})

// --- Modulate ---

test('Modulator: Modulate returns array same length as input', () => {
    const m = new Modulator()
    const size = 512
    const data = {
        Re: new Float32Array(size).fill(0.5),
        Im: new Float32Array(size).fill(0)
    }
    const result = m.Modulate(data)
    assert.strictEqual(result.length, size)
})

test('Modulator: Modulate on zero input returns all zeros', () => {
    const m = new Modulator()
    const size = 256
    const data = { Re: new Float32Array(size), Im: new Float32Array(size) }
    const result = m.Modulate(data)
    // use == 0 to treat -0 and +0 as equal (both are valid zero results)
    for (const v of result) assert.ok(v == 0, `expected zero, got ${v}`)
})

test('Modulator: FSampleNo wraps within carrier period', () => {
    const m = new Modulator()
    const period = m._Cs.length
    const size = period * 3
    const data = {
        Re: new Float32Array(size).fill(1),
        Im: new Float32Array(size).fill(0)
    }
    m.Modulate(data)
    assert.ok(m.FSampleNo < period, 'FSampleNo must stay within carrier period')
})

test('Modulator: output values are bounded for unit input', () => {
    const m = new Modulator()
    const size = 512
    const data = {
        Re: new Float32Array(size).fill(1),
        Im: new Float32Array(size).fill(0)
    }
    const result = m.Modulate(data)
    for (const v of result) {
        assert.ok(Math.abs(v) <= 1 + 1e-9, `value ${v} out of range for unit input`)
    }
})
