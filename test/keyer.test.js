import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Keyer } from '../keyer.js'

// --- Keyer.Encode ---

test('Encode: single letter', () => {
    assert.strictEqual(Keyer.Encode('e'), '.~')
    assert.strictEqual(Keyer.Encode('t'), '-~')
    assert.strictEqual(Keyer.Encode('a'), '.-~')
})

// Encode produces: letters separated by ' ', ends with '~' replacing trailing ' '
test('Encode: SOS produces correct Morse', () => {
    const result = Keyer.Encode('sos')
    // s=... o=--- s=...  -> '... --- ...~'
    assert.strictEqual(result, '... --- ...~')
})

test('Encode: single letter has no trailing space before tilde', () => {
    const r = Keyer.Encode('a')
    assert.ok(r.endsWith('~'), 'must end with ~')
    assert.ok(!r.includes(' ~'), 'no space before ~ for single char')
})

test('Encode: word space produces space token', () => {
    const r = Keyer.Encode('a b')
    assert.ok(r.includes(' '), 'space token present')
    // a=.- then word-space=' ' then b=-... then '~'
    assert.strictEqual(r, '.-  -...~')
})

test('Encode: empty string returns empty string', () => {
    assert.strictEqual(Keyer.Encode(''), '')
})

test('Encode: number 5 encodes correctly', () => {
    assert.strictEqual(Keyer.Encode('5'), '.....~')
})

test('Encode: zero encodes correctly', () => {
    assert.strictEqual(Keyer.Encode('0'), '-----~')
})

// --- GetEnvelope: basic structure ---

test('GetEnvelope: returns Float32Array', () => {
    const k = new Keyer()
    k.MorseMsg = Keyer.Encode('e')
    const env = k.GetEnvelope()
    assert.ok(env instanceof Float32Array, 'result must be Float32Array')
})

test('GetEnvelope: length is multiple of BufSize', () => {
    const k = new Keyer()
    k.MorseMsg = Keyer.Encode('a')
    const env = k.GetEnvelope()
    assert.strictEqual(env.length % k.BufSize, 0, 'length must be multiple of BufSize')
})

test('GetEnvelope: longer message produces longer envelope', () => {
    const k = new Keyer()
    k.MorseMsg = Keyer.Encode('e')
    const shortEnv = k.GetEnvelope()
    k.MorseMsg = Keyer.Encode('sos')
    const longEnv = k.GetEnvelope()
    assert.ok(longEnv.length > shortEnv.length, 'longer message -> longer envelope')
})

test('GetEnvelope: higher WPM produces shorter envelope', () => {
    const k = new Keyer()
    k.MorseMsg = Keyer.Encode('paris')
    k.Wpm = 20
    const slow = k.GetEnvelope()
    k.Wpm = 40
    k.MorseMsg = Keyer.Encode('paris')
    const fast = k.GetEnvelope()
    assert.ok(fast.length < slow.length, 'faster speed -> shorter envelope')
})

test('GetEnvelope: values are in [0, 1]', () => {
    const k = new Keyer()
    k.MorseMsg = Keyer.Encode('cq')
    const env = k.GetEnvelope()
    for (let i = 0; i < env.length; i++) {
        assert.ok(env[i] >= 0 && env[i] <= 1, `sample ${i} out of range: ${env[i]}`)
    }
})

// --- Farnsworth timing ---

test('Farnsworth off: envelope length matches standard timing', () => {
    const k = new Keyer()
    k.Wpm = 20
    k.FarnsworthEffWpm = 0  // disabled
    k.MorseMsg = Keyer.Encode('cq de')
    const standard = k.GetEnvelope()

    const k2 = new Keyer()
    k2.Wpm = 20
    k2.FarnsworthEffWpm = 0
    k2.MorseMsg = Keyer.Encode('cq de')
    const again = k2.GetEnvelope()

    assert.strictEqual(standard.length, again.length, 'same settings -> same length')
})

test('Farnsworth on: envelope is longer than standard at same char WPM', () => {
    const k = new Keyer()
    k.Wpm = 20
    k.FarnsworthEffWpm = 0
    k.MorseMsg = Keyer.Encode('cq de')
    const standard = k.GetEnvelope()

    const kf = new Keyer()
    kf.Wpm = 20
    kf.FarnsworthEffWpm = 10  // slower effective speed
    kf.MorseMsg = Keyer.Encode('cq de')
    const farnsworth = kf.GetEnvelope()

    assert.ok(farnsworth.length > standard.length,
        `Farnsworth envelope (${farnsworth.length}) must be longer than standard (${standard.length})`)
})

test('Farnsworth: eff WPM equal to char WPM acts like standard', () => {
    const k = new Keyer()
    k.Wpm = 20
    k.FarnsworthEffWpm = 0
    k.MorseMsg = Keyer.Encode('test')
    const standard = k.GetEnvelope()

    const kf = new Keyer()
    kf.Wpm = 20
    kf.FarnsworthEffWpm = 20  // same as char WPM -> condition not triggered
    kf.MorseMsg = Keyer.Encode('test')
    const same = kf.GetEnvelope()

    assert.strictEqual(standard.length, same.length,
        'eff WPM == char WPM must produce same envelope as standard')
})

test('Farnsworth: eff WPM greater than char WPM acts like standard', () => {
    const k = new Keyer()
    k.Wpm = 20
    k.FarnsworthEffWpm = 0
    k.MorseMsg = Keyer.Encode('test')
    const standard = k.GetEnvelope()

    const kf = new Keyer()
    kf.Wpm = 20
    kf.FarnsworthEffWpm = 25  // higher than char WPM -> condition not triggered
    kf.MorseMsg = Keyer.Encode('test')
    const same = kf.GetEnvelope()

    assert.strictEqual(standard.length, same.length,
        'eff WPM > char WPM must produce same envelope as standard')
})

test('Farnsworth: slower eff WPM produces proportionally longer gaps', () => {
    // A message with more spaces benefits more from Farnsworth
    const msg = Keyer.Encode('e e e e e')  // many inter-char gaps
    const k1 = new Keyer()
    k1.Wpm = 20
    k1.FarnsworthEffWpm = 10
    k1.MorseMsg = msg
    const len10 = k1.GetEnvelope().length

    const k2 = new Keyer()
    k2.Wpm = 20
    k2.FarnsworthEffWpm = 8
    k2.MorseMsg = msg
    const len8 = k2.GetEnvelope().length

    assert.ok(len8 > len10, 'slower eff WPM must produce longer envelope')
})
