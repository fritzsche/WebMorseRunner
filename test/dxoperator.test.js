import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DxOperator } from '../dxoperator.js'

const { Yes, No, Almost } = DxOperator.CallCheckResult

// --- DxOperator.IsMyCall (Levenshtein-based call matching) ---

test('IsMyCall: exact match returns Yes', () => {
    assert.strictEqual(DxOperator.IsMyCall('DJ1TF', 'DJ1TF'), Yes)
})

test('IsMyCall: completely different call returns No', () => {
    assert.strictEqual(DxOperator.IsMyCall('DJ1TF', 'W1AW'), No)
})

test('IsMyCall: one character off returns Almost', () => {
    assert.strictEqual(DxOperator.IsMyCall('DJ1TF', 'DJ1TG'), Almost)
})

test('IsMyCall: two characters off returns Almost', () => {
    assert.strictEqual(DxOperator.IsMyCall('DJ1TF', 'DK1TF'), Almost)
})

test('IsMyCall: comparison is case-sensitive (app always sends uppercase)', () => {
    // The app always passes uppercase strings to IsMyCall, so this documents
    // that lowercase input does NOT match — callers must normalise to uppercase.
    assert.strictEqual(DxOperator.IsMyCall('DJ1TF', 'dj1tf'), No)
})

test('IsMyCall: wildcard ? matches any single character', () => {
    assert.strictEqual(DxOperator.IsMyCall('DJ1TF', 'DJ1T?'), Almost)
})

test('IsMyCall: empty received call returns No', () => {
    const result = DxOperator.IsMyCall('DJ1TF', '')
    assert.strictEqual(result, No)
})

test('IsMyCall: partial call (prefix only) returns Almost', () => {
    assert.strictEqual(DxOperator.IsMyCall('DJ1TF', 'DJ1'), Almost)
})

test('IsMyCall: call with extra characters returns No or Almost', () => {
    // 'DJ1TFX' differs from 'DJ1TF' by one insertion
    const result = DxOperator.IsMyCall('DJ1TF', 'DJ1TFX')
    assert.ok(result === No || result === Almost,
        `extra char should be No or Almost, got ${result}`)
})

test('IsMyCall: well-known common callsign pairs', () => {
    assert.strictEqual(DxOperator.IsMyCall('W1AW', 'W1AW'), Yes)
    assert.strictEqual(DxOperator.IsMyCall('VK2ABC', 'VK2ABC'), Yes)
})

test('IsMyCall: single char received call returns No (too short)', () => {
    const result = DxOperator.IsMyCall('DJ1TF', 'D')
    assert.strictEqual(result, No)
})

test('IsMyCall: ? only call returns No (too short after stripping)', () => {
    const result = DxOperator.IsMyCall('DJ1TF', '?')
    assert.strictEqual(result, No)
})
