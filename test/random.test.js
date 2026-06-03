import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
    RndNormal, RndGaussLim, RndUShaped, RndRayleigh,
    RndIntInclusive, RndUniform, SecondsToBlocks, BlocksToSeconds
} from '../random.js'

const SAMPLES = 5000

// --- RndIntInclusive ---

test('RndIntInclusive: always within [min, max]', () => {
    for (let i = 0; i < SAMPLES; i++) {
        const v = RndIntInclusive(5, 10)
        assert.ok(v >= 5 && v <= 10, `value ${v} out of [5, 10]`)
    }
})

test('RndIntInclusive: both endpoints reachable', () => {
    const seen = new Set()
    for (let i = 0; i < SAMPLES; i++) seen.add(RndIntInclusive(1, 3))
    assert.ok(seen.has(1) && seen.has(2) && seen.has(3), 'all values in [1,3] must appear')
})

test('RndIntInclusive: returns integer', () => {
    for (let i = 0; i < 100; i++) {
        const v = RndIntInclusive(0, 100)
        assert.strictEqual(v, Math.floor(v), `${v} is not an integer`)
    }
})

test('RndIntInclusive: min == max returns that value', () => {
    for (let i = 0; i < 10; i++) {
        assert.strictEqual(RndIntInclusive(7, 7), 7)
    }
})

// --- RndUniform ---

test('RndUniform: values in [-1, 1]', () => {
    for (let i = 0; i < SAMPLES; i++) {
        const v = RndUniform()
        assert.ok(v >= -1 && v <= 1, `value ${v} out of [-1, 1]`)
    }
})

test('RndUniform: produces both positive and negative values', () => {
    let hasPos = false, hasNeg = false
    for (let i = 0; i < SAMPLES; i++) {
        const v = RndUniform()
        if (v > 0) hasPos = true
        if (v < 0) hasNeg = true
    }
    assert.ok(hasPos && hasNeg, 'must produce both positive and negative values')
})

// --- RndNormal ---

test('RndNormal: mean close to 0 over many samples', () => {
    let sum = 0
    for (let i = 0; i < SAMPLES; i++) sum += RndNormal()
    const mean = sum / SAMPLES
    assert.ok(Math.abs(mean) < 0.1, `mean ${mean} too far from 0`)
})

// --- RndGaussLim ---

test('RndGaussLim: result within [mean-lim, mean+lim]', () => {
    const mean = 10, lim = 4
    for (let i = 0; i < SAMPLES; i++) {
        const v = RndGaussLim(mean, lim)
        assert.ok(v >= mean - lim && v <= mean + lim, `${v} outside clamped range`)
    }
})

test('RndGaussLim: mean within result range', () => {
    let sum = 0
    for (let i = 0; i < SAMPLES; i++) sum += RndGaussLim(20, 5)
    const mean = sum / SAMPLES
    assert.ok(Math.abs(mean - 20) < 1, `mean ${mean} too far from 20`)
})

// --- RndRayleigh ---

test('RndRayleigh: always positive', () => {
    for (let i = 0; i < SAMPLES; i++) {
        assert.ok(RndRayleigh(3) > 0, 'Rayleigh must be positive')
    }
})

// --- SecondsToBlocks / BlocksToSeconds ---

test('SecondsToBlocks: 1 second maps to RATE/BUFSIZE blocks', () => {
    // DEFAULT.RATE = 11025, DEFAULT.BUFSIZE = 512
    const expected = Math.round(11025 / 512 * 1)  // = 22
    assert.strictEqual(SecondsToBlocks(1), expected)
})

test('SecondsToBlocks and BlocksToSeconds are approximate inverses', () => {
    const sec = 2.5
    const blocks = SecondsToBlocks(sec)
    const roundtrip = BlocksToSeconds(blocks)
    // rounding in SecondsToBlocks means we won't get exact equality
    assert.ok(Math.abs(roundtrip - sec) < 0.05, `roundtrip error too large: ${roundtrip} vs ${sec}`)
})

test('BlocksToSeconds: 0 blocks is 0 seconds', () => {
    assert.strictEqual(BlocksToSeconds(0), 0)
})

test('SecondsToBlocks: 0 seconds is 0 blocks', () => {
    assert.strictEqual(SecondsToBlocks(0), 0)
})
