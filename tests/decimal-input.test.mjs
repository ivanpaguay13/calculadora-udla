import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDecimalInput } from '../dist/app/grades/input.js';
import { bindDecimalField } from '../dist/app/components/decimal-field.js';

test('comma and point normalize identically, including leading decimals and zero', () => {
  for (const [raw, value, cents] of [['8,25', '8.25', 825], ['8.25', '8.25', 825], ['7,5', '7.5', 750],
    [',5', '0.5', 50], ['.5', '0.5', 50], ['0,00', '0.00', 0], ['10,00', '10.00', 1000], ['008,25', '8.25', 825]]) {
    assert.deepEqual(parseDecimalInput(raw), { kind: 'valid', value, cents }, raw);
  }
});
test('intermediate decimal separators stay drafts until completed or blurred', () => {
  for (const raw of ['8,', '8.', ',', '.']) assert.equal(parseDecimalInput(raw).kind, 'draft', raw);
  for (const raw of ['8,', '8.']) assert.deepEqual(parseDecimalInput(raw, { finish: true }), { kind: 'valid', value: '8', cents: 800 });
  for (const raw of [',', '.']) assert.equal(parseDecimalInput(raw, { finish: true }).kind, 'invalid');
  assert.equal(parseDecimalInput('').kind, 'empty');
});
test('rejects extra decimals, mixed separators, negatives, exponent notation and out-of-range notes', () => {
  for (const raw of ['8,125', '8.125', '10,01', '-1', 'NaN', 'Infinity', '1e1', '1,2.3', '1,,2', 'texto', '11,']) {
    assert.equal(parseDecimalInput(raw).kind, 'invalid', raw);
  }
});
test('custom weights accept comma decimals with exact hundredths and positive range', () => {
  const options = { minCents: 1, maxCents: 10000 };
  assert.deepEqual(parseDecimalInput('33,33', options), { kind: 'valid', value: '33.33', cents: 3333 });
  assert.equal(parseDecimalInput('100,00', options).kind, 'valid');
  for (const raw of ['0', '100,01', '33,333']) assert.equal(parseDecimalInput(raw, options).kind, 'invalid');
});

// Event-level regression coverage of the real handler; physical iOS keyboard QA is separate.
class Field extends EventTarget {
  value = ''; validityMessage = ''; attributes = new Map();
  setCustomValidity(message) { this.validityMessage = message; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  enter(value) { this.value = value; this.dispatchEvent(new Event('input')); }
  blur() { this.dispatchEvent(new Event('blur')); }
}
test('typing 8,25 never clears an existing grade or rewrites the field mid-entry', () => {
  const input = new Field(); const error = { textContent: '' }; const saved = [];
  bindDecimalField(input, error, value => { saved.push(value); return true; });
  input.enter('8'); assert.equal(saved.at(-1), '8');
  input.enter('8,'); assert.equal(saved.length, 1); assert.equal(input.value, '8,'); assert.equal(error.textContent, '');
  input.enter('8,2'); assert.equal(saved.at(-1), '8.2'); assert.equal(input.value, '8,2');
  input.enter('8,25'); assert.equal(saved.at(-1), '8.25'); assert.equal(input.value, '8,25');
  assert.ok(!saved.includes(null)); input.blur(); assert.equal(input.value, '8.25');
  input.enter(''); assert.equal(saved.at(-1), null);
});
test('invalid entry preserves the last valid grade and errors clear when corrected', () => {
  const input = new Field(); const error = { textContent: '' }; let grade = '7';
  bindDecimalField(input, error, value => { grade = value; return true; });
  input.enter('8,125'); assert.equal(grade, '7'); assert.ok(error.textContent); assert.equal(input.attributes.get('aria-invalid'), 'true');
  input.enter('8,12'); assert.equal(grade, '8.12'); assert.equal(error.textContent, ''); assert.equal(input.attributes.get('aria-invalid'), 'false');
  input.enter(','); input.blur(); assert.equal(grade, '8.12'); assert.ok(error.textContent);
});
test('required targets and failed saves preserve input and report an error', () => {
  const input = new Field(); const error = { textContent: '' }; let calls = 0;
  bindDecimalField(input, error, () => { calls++; return false; }, true);
  input.enter(''); assert.equal(calls, 0); assert.ok(error.textContent);
  input.enter('8,25'); input.blur(); assert.equal(input.value, '8,25'); assert.ok(error.textContent); assert.equal(input.attributes.get('aria-invalid'), 'true');
});
