import { applyAppearance, DEFAULT_APPEARANCE, PRESETS, saveAppearance } from '../appearance.js';
import type { Appearance } from '../appearance.js';
import { button, el } from './dom.js';

export function appearancePanel(initial: Appearance, changed: (value: Appearance) => void): HTMLElement {
  let current = { ...initial };
  const panel = el('section', 'settings-panel appearance-panel');
  const heading = el('h2', '', 'Colores de la aplicación'); heading.id = 'appearance-title';
  panel.setAttribute('aria-labelledby', heading.id);
  panel.append(heading, el('p', '', 'Elige una paleta o combina tus propios colores. Verás el resultado al instante.'));
  const palettes = el('div', 'appearance-presets'); palettes.setAttribute('role', 'group');
  palettes.setAttribute('aria-label', 'Paletas de colores');
  const inputs: HTMLInputElement[] = [];
  const codes: HTMLElement[] = [];
  const presets: HTMLButtonElement[] = [];
  const status = el('p', 'appearance-status muted'); status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const refresh = () => {
    presets.forEach((node, i) => node.setAttribute('aria-pressed', String(
      PRESETS[i]!.primary === current.primary && PRESETS[i]!.accent === current.accent)));
    [current.primary, current.accent].forEach((color, i) => {
      inputs[i]!.value = color; codes[i]!.textContent = color.toUpperCase();
    });
  };
  const select = (value: Appearance) => {
    current = { ...value }; applyAppearance(current); changed(current); refresh();
    try {
      saveAppearance(window.localStorage, current);
      status.textContent = 'Colores guardados en este dispositivo.';
      status.className = 'appearance-status muted';
    } catch {
      status.textContent = 'Vista previa activa. No se pudieron guardar los colores; se perderán al cerrar.';
      status.className = 'appearance-status field-error';
    }
  };
  for (const preset of PRESETS) {
    const node = button('', () => select({ primary: preset.primary, accent: preset.accent }), 'button secondary palette-button');
    const swatches = el('span', 'palette-swatches'); swatches.setAttribute('aria-hidden', 'true');
    for (const color of [preset.primary, preset.accent]) {
      const swatch = el('span', 'palette-swatch'); swatch.style.backgroundColor = color; swatches.append(swatch);
    }
    node.append(swatches, el('span', '', preset.name)); palettes.append(node); presets.push(node);
  }
  panel.append(palettes);
  const controls = el('div', 'appearance-controls');
  for (const [key, labelText, help] of [
    ['primary', 'Color principal', 'Encabezado, botones y navegación.'],
    ['accent', 'Color de acento', 'Detalles y secciones destacadas.'],
  ] as const) {
    const label = el('label', 'appearance-control');
    const input = el('input', 'color-input'); input.type = 'color'; input.value = current[key];
    input.setAttribute('aria-label', labelText);
    const code = el('span', 'color-code'); code.setAttribute('aria-hidden', 'true');
    input.addEventListener('input', () => {
      current = { ...current, [key]: input.value }; applyAppearance(current); changed(current);
      refresh();
    });
    input.addEventListener('change', () => select({ ...current, [key]: input.value }));
    label.append(el('strong', '', labelText), el('span', 'muted', help), input, code);
    controls.append(label); inputs.push(input); codes.push(code);
  }
  panel.append(controls, button('Restaurar colores originales', () => select(DEFAULT_APPEARANCE), 'button secondary'), status,
    el('p', 'muted', 'La apariencia se guarda por separado de tus notas y no se incluye en los respaldos JSON. El color del texto se ajusta para mantenerlo legible.'));
  refresh(); return panel;
}
