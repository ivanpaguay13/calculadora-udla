import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { connectEngine } from '../dist/app/grades/engine.js';
import { initialState } from '../dist/app/storage/state.js';

const bytes = readFileSync(new URL('../dist/grades.wasm', import.meta.url));
const { instance } = await WebAssembly.instantiate(bytes, {});
const evaluate = connectEngine(instance.exports);
const catalog = JSON.parse(readFileSync(new URL('../dist/catalog.json', import.meta.url), 'utf8'));
function run(command, args, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.on('error', reject); child.stdout.on('data', bytes => stdout += bytes); child.stderr.on('data', bytes => stderr += bytes);
    child.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(stderr)));
    child.stdin.end(input);
  });
}
await run('cargo', ['build', '--locked', '-p', 'grades', '--example', 'evaluate']);
const executable = process.platform === 'win32' ? 'target/debug/examples/evaluate.exe' : 'target/debug/examples/evaluate';
async function native(state) {
  return JSON.parse(await run(executable, [], JSON.stringify({ state }))).report;
}
test('WASM and native Rust produce identical complete reports', async () => {
  const state = initialState(catalog);
  assert.deepEqual(evaluate(state), await native(state));
  for (const m of catalog.materias) for (const [p, activities] of Object.entries(m.progresos)) {
    for (const [i, a] of activities.entries()) state.grades[`${m.codigo}/${p}/${a.id}`] = i % 3 === 0 ? null : `${i % 10}.25`;
  }
  assert.deepEqual(evaluate(state), await native(state));
  for (const k of Object.keys(state.grades)) state.grades[k] = '10';
  assert.deepEqual(evaluate(state), await native(state));
  assert.equal(evaluate(state).semester.final_grade, '10.00');
});
test('WASM ABI releases allocations and keeps working after rejected input', () => {
  const state = initialState(catalog);
  for (let i = 0; i < 100; i++) {
    assert.throws(() => evaluate({ ...state, grades: { unknown: '9' } }));
    assert.equal(evaluate(state).semester.evaluated, 0);
  }
  const before = instance.exports.memory.buffer.byteLength;
  for (let i = 0; i < 1000; i++) evaluate(state);
  assert.equal(instance.exports.memory.buffer.byteLength, before);
});
