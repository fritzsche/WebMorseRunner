import { test } from 'node:test'
import assert from 'node:assert/strict'

// NR padding helper — mirrors the logic used throughout the app:
// 3 digits normally, 4 digits only when NR > 999
const padNr = (nr) => String(nr).padStart(nr > 999 ? 4 : 3, '0')

// --- NR padding logic ---

test('padNr: single digit pads to 3', () => {
    assert.strictEqual(padNr(1), '001')
    assert.strictEqual(padNr(7), '007')
})

test('padNr: two digit pads to 3', () => {
    assert.strictEqual(padNr(42), '042')
    assert.strictEqual(padNr(99), '099')
})

test('padNr: three digit keeps 3 digits', () => {
    assert.strictEqual(padNr(100), '100')
    assert.strictEqual(padNr(999), '999')
})

test('padNr: 1000 uses 4 digits', () => {
    assert.strictEqual(padNr(1000), '1000')
})

test('padNr: four digit number keeps 4 digits', () => {
    assert.strictEqual(padNr(1234), '1234')
    assert.strictEqual(padNr(9999), '9999')
})

test('padNr: 999 stays 3 digits (boundary)', () => {
    assert.strictEqual(padNr(999).length, 3)
})

test('padNr: 1000 uses 4 digits (boundary)', () => {
    assert.strictEqual(padNr(1000).length, 4)
})

// --- Contest start offset effect on NR range ---
// Models the dxoperator NR formula:
//   1 + Math.round(Math.random() * (Tst.Minute + offsetMin) * Skills)

const computeMaxNr = (elapsedMin, offsetMin, skills) =>
    1 + Math.round(1.0 * (elapsedMin + offsetMin) * skills)  // worst case: random = 1.0

const computeMinNr = () => 1  // worst case: random = 0

test('Contest offset 0: NR at start of contest is 1', () => {
    assert.strictEqual(computeMaxNr(0, 0, 5), 1,
        'at minute 0 with no offset NR must be 1')
})

test('Contest offset 0: formula identical to original when offset is 0', () => {
    const originalMaxAtMin10 = 1 + Math.round(1.0 * 10 * 3)
    const offsetMaxAtMin10 = computeMaxNr(10, 0, 3)
    assert.strictEqual(offsetMaxAtMin10, originalMaxAtMin10)
})

test('Contest offset 120 min (2h): NR immediately in hundreds range', () => {
    const maxNr = computeMaxNr(0, 120, 3)  // 2h offset, skills=3
    assert.ok(maxNr > 100, `NR ${maxNr} should be > 100 with 2h offset`)
})

test('Contest offset 240 min (4h): NR can exceed 999 with high skills', () => {
    const maxNr = computeMaxNr(0, 240, 5)  // 4h offset, skills=5
    assert.ok(maxNr > 999, `NR ${maxNr} should exceed 999 with 4h offset and skills=5`)
})

test('Contest offset 240 min (4h): NR requires 4-digit padding', () => {
    const maxNr = computeMaxNr(0, 240, 5)
    const padded = padNr(maxNr)
    assert.strictEqual(padded.length, 4, `NR ${maxNr} should pad to 4 digits`)
})

test('Contest offset result always >= 1', () => {
    assert.strictEqual(computeMinNr(), 1)
})

test('Contest offset increases monotonically with offset hours', () => {
    const nr1h = computeMaxNr(0, 60, 3)
    const nr2h = computeMaxNr(0, 120, 3)
    const nr4h = computeMaxNr(0, 240, 3)
    assert.ok(nr1h < nr2h, '2h offset > 1h offset')
    assert.ok(nr2h < nr4h, '4h offset > 2h offset')
})

// --- View save-guard: zero NR check ---
// The view.js guard `recNr !== '000'` prevents saving QSOs with NR=0.
// With dynamic padding, Nr=0 produces '000', not '0000'.

test('Nr=0 produces guard value 000', () => {
    const Nr = 0
    const recNr = String(Nr).padStart(Nr > 999 ? 4 : 3, "0")
    assert.strictEqual(recNr, '000')
})

test('Nr=1 does not trigger guard', () => {
    const Nr = 1
    const recNr = String(Nr).padStart(Nr > 999 ? 4 : 3, "0")
    assert.notStrictEqual(recNr, '000')
})
