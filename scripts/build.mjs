import { spawn } from 'node:child_process';
import { cp, mkdir, rm, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${command} falló. Revisa el mensaje anterior.`)));
  });
}
await run('cargo', ['build', '--locked', '--release', '--target', 'wasm32-unknown-unknown', '-p', 'grades']);
await rm('dist', { recursive: true, force: true });
await run(process.execPath, ['node_modules/typescript/bin/tsc']);
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('instrucciones/evaluaciones_5to_semestre.json', 'dist/catalog.json');
await cp('target/wasm32-unknown-unknown/release/grades.wasm', 'dist/grades.wasm');

// Build an atomic, versioned offline shell. No user grades are cached by the service worker.
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await files(path)); else result.push(path);
  }
  return result.sort();
}
await writeFile('dist/manifest.webmanifest', JSON.stringify({
  name: 'Mis notas · Medicina', short_name: 'Mis notas', lang: 'es', start_url: './', scope: './',
  display: 'standalone', background_color: '#f7f8f4', theme_color: '#164b45',
  icons: [{ src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
}));
let html = await readFile('dist/index.html', 'utf8');
html = html.replace('</head>', '<link rel="manifest" href="./manifest.webmanifest">\n</head>');
html = html.replace('</body>', '<script type="module" src="./offline.js"></script>\n</body>');
await writeFile('dist/index.html', html);
await writeFile('dist/offline.js', `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(registration => {
    const offer = () => {
      if (!registration.waiting || !navigator.serviceWorker.controller) return;
      const banner = document.createElement('div'); banner.className = 'update-banner';
      banner.append('Hay una nueva versión disponible. ');
      const button = document.createElement('button'); button.className = 'button secondary';
      button.textContent = 'Actualizar';
      button.onclick = () => { button.disabled = true; registration.waiting?.postMessage('activate'); };
      banner.append(button); document.body.append(banner);
    };
    offer(); registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', offer);
    });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return; reloading = true; location.reload();
    });
  }).catch(() => { /* Online use remains available when offline caching is unsupported. */ });
}
`);
const assets = await files('dist');
const hash = createHash('sha256');
for (const path of assets) hash.update(await readFile(path));
const version = hash.digest('hex').slice(0, 16);
const urls = assets.map(path => `./${path.slice(5)}`);
urls.push('./');
await writeFile('dist/sw.js', `
const PREFIX = 'mis-notas-' + self.registration.scope + '-';
const CACHE = PREFIX + '${version}';
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('message', event => { if (event.data === 'activate') self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    if (event.request.mode === 'navigate') return (await cache.match('./index.html')) || fetch(event.request);
    return fetch(event.request);
  }));
});
`);
console.log(`Aplicación construida en dist/ · versión de caché ${version}`);
