import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { download } from '../dist/app/components/dom.js';

const assets = new URL('../android/app/build/generated/webAssets/web/', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
for (const file of ['grades.wasm', 'catalog.json', 'app/main.js', 'app/appearance.js', 'app/components/appearance-panel.js', 'styles.css']) {
  assert.deepEqual(await readFile(new URL(file, assets)), await readFile(new URL(file, dist)));
}
const html = await readFile(new URL('index.html', assets), 'utf8');
assert.ok(!html.includes('./offline.js'), 'El APK no debe registrar el service worker web');
assert.ok(html.includes('./app/main.js'));
assert.ok((await readFile(new URL('index.html', dist), 'utf8')).includes('./offline.js'),
  'Preparar Android debe conservar la versión web');
for (const file of ['sw.js', 'offline.js']) {
  await assert.rejects(access(new URL(file, assets)), { code: 'ENOENT' });
}

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalTimeout = globalThis.setTimeout;
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
try {
  let exported;
  globalThis.window = { AndroidBackup: { postMessage: message => { exported = JSON.parse(message); } } };
  // No DOM or blob APIs: Android must route the exact backup to the native picker.
  download('{"nota":"8.25","texto":"Medicina · Ñ"}', 'mis-notas.json');
  assert.deepEqual(exported, {
    text: '{"nota":"8.25","texto":"Medicina · Ñ"}', name: 'mis-notas.json',
  });
  globalThis.window = {};
  let clicked = false, revoked;
  const anchor = { click() { clicked = true; } };
  globalThis.document = { createElement: tag => { assert.equal(tag, 'a'); return anchor; } };
  URL.createObjectURL = blob => { assert.equal(blob.type, 'application/json'); return 'blob:test'; };
  URL.revokeObjectURL = url => { revoked = url; };
  globalThis.setTimeout = callback => { callback(); return 0; };
  download('{}', 'web.json');
  assert.ok(clicked);
  assert.equal(anchor.href, 'blob:test');
  assert.equal(anchor.download, 'web.json');
  assert.equal(revoked, 'blob:test');
} finally {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  globalThis.setTimeout = originalTimeout;
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
}
console.log('Android: recursos íntegros, sin caché web y exportación nativa verificados.');
