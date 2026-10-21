import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const source = new URL('dist/', root);
const destination = new URL('android/app/build/generated/webAssets/web/', root);
// Require a complete build before replacing any generated assets.
await Promise.all(['index.html', 'grades.wasm', 'catalog.json', 'app/main.js'].map(
  file => readFile(new URL(file, source)),
));
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
let html = await readFile(new URL('index.html', destination), 'utf8');
// APK updates replace all assets together; a service worker would retain old code.
html = html.replace('<script type="module" src="./offline.js"></script>', '');
await writeFile(new URL('index.html', destination), html);
await Promise.all(['offline.js', 'sw.js'].map(file => rm(new URL(file, destination), { force: true })));
console.log(`Recursos Android preparados en ${fileURLToPath(destination)}`);
