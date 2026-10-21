import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPEARANCE_KEY, DEFAULT_APPEARANCE, PRESETS, parseAppearance, loadAppearance,
  saveAppearance, appearanceVariables, applyAppearance, contrast,
} from '../dist/app/appearance.js';
import { STORAGE_KEY } from '../dist/app/storage/state.js';
import { appearancePanel } from '../dist/app/components/appearance-panel.js';

test('colors persist independently without modifying grades or their backups', () => {
  const grades = '{"grades":{"MEDZ4399/P1/p1_e01":"8.25"}}';
  const values = new Map([[STORAGE_KEY, grades]]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.deepEqual(loadAppearance(storage), DEFAULT_APPEARANCE);
  saveAppearance(storage, PRESETS[2]);
  assert.deepEqual(loadAppearance(storage), { primary: PRESETS[2].primary, accent: PRESETS[2].accent });
  assert.equal(values.get(STORAGE_KEY), grades);
  assert.equal(values.size, 2);
  saveAppearance(storage, DEFAULT_APPEARANCE);
  assert.deepEqual(loadAppearance(storage), DEFAULT_APPEARANCE);
});

test('invalid preferences and blocked storage cannot prevent application startup', () => {
  for (const raw of ['{', 'null', '[]', '{}', '{"primary":"red","accent":"#123456"}',
    '{"primary":"#123456","accent":"url(https://example.com)"}']) {
    assert.deepEqual(loadAppearance({ getItem: () => raw }), DEFAULT_APPEARANCE);
  }
  assert.deepEqual(loadAppearance({ getItem() { throw new Error('blocked'); } }), DEFAULT_APPEARANCE);
  assert.throws(() => saveAppearance({ setItem() { throw new Error('quota'); } }, PRESETS[1]), /quota/);
  assert.throws(() => appearanceVariables({ primary: '#fff', accent: '#000000' }));
  assert.deepEqual(parseAppearance({ primary: '#ABCDEF', accent: '#AABBCC' }), { primary: '#abcdef', accent: '#aabbcc' });
});

test('all presets and extreme custom colors have readable text on themed surfaces', () => {
  const colors = ['#ffffff', '#000000', '#ffff00', '#ff00ff', '#00ffff', '#00ff00', '#ff0000', '#0000ff', '#777777'];
  const themes = [...PRESETS, ...colors.flatMap(primary => colors.map(accent => ({ primary, accent })))];
  for (const theme of themes) {
    const v = appearanceVariables(theme);
    for (const [background, foreground] of [
      ['--green', '--theme-on-primary'], ['--green', '--theme-on-primary-soft'],
      ['--lime', '--theme-on-accent'], ['--theme-accent-soft', '--theme-on-accent-soft'],
      ['--theme-canvas', '--theme-text'], ['--theme-canvas', '--muted'],
      ['--theme-chrome', '--muted'], ['--theme-soft', '--theme-text'],
      ['--theme-primary-hover', '--theme-on-primary'],
    ]) {
      assert.ok(contrast(v[background], v[foreground]) >= 4.5,
        `${theme.primary}/${theme.accent}: ${background} and ${foreground}`);
    }
  }
});

test('applying a palette changes CSS variables and browser theme color', () => {
  const properties = new Map(); let metaColor;
  const page = {
    documentElement: { style: { setProperty: (key, value) => properties.set(key, value) }, dataset: {} },
    querySelector: selector => {
      assert.equal(selector, 'meta[name="theme-color"]');
      return { setAttribute: (name, value) => { assert.equal(name, 'content'); metaColor = value; } };
    },
  };
  applyAppearance(PRESETS[1], page);
  assert.equal(properties.get('--green'), PRESETS[1].primary);
  assert.equal(properties.get('--lime'), PRESETS[1].accent);
  assert.equal(page.documentElement.dataset.appearance, 'custom');
  assert.equal(metaColor, PRESETS[1].primary);
  assert.notEqual(APPEARANCE_KEY, STORAGE_KEY);
});

test('settings controls preview, save, reset and report storage failures', () => {
  class Element extends EventTarget {
    children = []; attributes = new Map(); style = { setProperty() {} }; dataset = {};
    append(...children) { this.children.push(...children); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    getAttribute(name) { return this.attributes.get(name); }
  }
  const previousDocument = globalThis.document, previousWindow = globalThis.window;
  try {
    const values = new Map();
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    globalThis.document = { createElement: () => new Element(), documentElement: new Element(), querySelector: () => null };
    globalThis.window = { localStorage: storage };
    let appearance;
    const panel = appearancePanel(DEFAULT_APPEARANCE, value => { appearance = value; });
    const flatten = node => [node, ...node.children.flatMap(flatten)];
    const nodes = flatten(panel);
    const presets = nodes.filter(node => node.className?.includes('palette-button'));
    presets[1].dispatchEvent(new Event('click'));
    assert.deepEqual(appearance, { primary: PRESETS[1].primary, accent: PRESETS[1].accent });
    assert.equal(presets[1].getAttribute('aria-pressed'), 'true');
    const input = nodes.find(node => node.type === 'color');
    input.value = '#ee11aa'; input.dispatchEvent(new Event('input'));
    assert.equal(appearance.primary, '#ee11aa');
    assert.equal(presets[1].getAttribute('aria-pressed'), 'false');
    input.dispatchEvent(new Event('change'));
    assert.equal(loadAppearance(storage).primary, '#ee11aa');
    nodes.find(node => node.textContent === 'Restaurar colores originales').dispatchEvent(new Event('click'));
    assert.deepEqual(loadAppearance(storage), DEFAULT_APPEARANCE);
    storage.setItem = () => { throw new Error('quota'); };
    presets[2].dispatchEvent(new Event('click'));
    assert.equal(appearance.primary, PRESETS[2].primary, 'Preview remains usable when saving fails');
    assert.deepEqual(loadAppearance(storage), DEFAULT_APPEARANCE);
    const status = nodes.find(node => node.getAttribute('role') === 'status');
    assert.match(status.textContent, /No se pudieron guardar/);
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
});
