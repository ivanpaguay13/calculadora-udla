import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialState, restore, commit, parseBackup, exportBackup, normalizeDecimal, STORAGE_KEY } from '../dist/app/storage/state.js';

const catalog = JSON.parse(readFileSync(new URL('../instrucciones/evaluaciones_5to_semestre.json', import.meta.url), 'utf8'));
function memory() {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
}
// Storage tests inject a validator spy. Domain validation is tested in Rust and WASM separately.
const report = { semester: { evaluated: 0 } };
const accept = () => report;
test('reload/export/import preserves zero, pending notes, identifiers, targets and customized weights', () => {
  const storage = memory(); const state = initialState(catalog);
  state.grades['MEDZ4399/P1/p1_e01'] = '0';
  state.grades['MEDZ4399/P1/p1_e02'] = null;
  state.grades['MEDZ4399/P1/p1_e03'] = '8.15';
  state.targets.MEDZ4399 = '8.50';
  state.weights = { 'MEDZ4399/P1/p1_e01': '40', 'MEDZ4399/P1/p1_e02': '30', 'MEDZ4399/P1/p1_e03': '30' };
  const validate = actual => { assert.deepEqual(actual.grades, state.grades); return report; };
  const saved = commit(storage, state, validate);
  const reloaded = restore(storage, catalog, validate);
  assert.deepEqual(saved.state, reloaded);
  const otherDevice = memory(); const imported = parseBackup(exportBackup(reloaded), validate);
  commit(otherDevice, imported, validate); const again = restore(otherDevice, catalog, validate);
  assert.deepEqual(again.grades, state.grades);
  assert.deepEqual(again.weights, state.weights);
  assert.deepEqual(again.targets, state.targets);
  assert.equal(again.schema_version, 1); assert.equal(again.catalog_version, 1);
  assert.ok(!Number.isNaN(Date.parse(again.updated_at)));
});
test('validator rejection cannot overwrite current data', () => {
  const storage = memory(); const state = initialState(catalog);
  commit(storage, state, accept); const original = storage.getItem(STORAGE_KEY);
  const reject = actual => { assert.equal(actual.schema_version, 999); throw new Error('Versión inválida'); };
  const invalid = { ...state, schema_version: 999 };
  assert.throws(() => parseBackup(JSON.stringify(invalid), reject), /Versión/);
  assert.throws(() => commit(storage, invalid, reject), /Versión/);
  assert.equal(storage.getItem(STORAGE_KEY), original);
});
test('malformed or oversized JSON is rejected before invoking the engine', () => {
  const validate = () => { throw new Error('Validator should not be called'); };
  assert.throws(() => parseBackup('broken', validate), /JSON válido/);
  assert.throws(() => parseBackup(' '.repeat(1_000_001), validate), /1 MB/);
});
test('a quota failure leaves previously saved data intact', () => {
  const state = initialState(catalog); const raw = JSON.stringify(state);
  const storage = { getItem: () => raw, setItem: () => { throw new Error('QuotaExceededError'); } };
  const candidate = { ...state, grades: { 'MEDZ4399/P1/p1_e01': '9' } };
  assert.throws(() => commit(storage, candidate, accept), /Quota/);
  assert.equal(storage.getItem(STORAGE_KEY), raw); assert.deepEqual(state.grades, {});
});
test('corrupt local data remains available for recovery', () => {
  const storage = memory(); storage.setItem(STORAGE_KEY, 'broken');
  assert.throws(() => restore(storage, catalog, accept)); assert.equal(storage.getItem(STORAGE_KEY), 'broken');
});
test('empty storage, temporary mode and input normalization', () => {
  const s = restore(memory(), catalog, accept); assert.deepEqual(s.grades, {});
  assert.equal(commit(null, s, accept).report, report);
  assert.equal(normalizeDecimal(' 8,25 '), '8.25'); assert.equal(normalizeDecimal(''), null); assert.equal(normalizeDecimal('0'), '0');
});
