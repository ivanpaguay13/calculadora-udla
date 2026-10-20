export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function button(text: string, action: () => void, className = 'button'): HTMLButtonElement {
  const node = el('button', className, text);
  node.type = 'button'; node.addEventListener('click', action); return node;
}
export function metric(label: string, value: string, detail?: string): HTMLElement {
  const node = el('div', 'metric');
  node.append(el('span', 'metric-label', label), el('strong', 'metric-value', value));
  if (detail) node.append(el('span', 'metric-detail', detail));
  return node;
}
export function meter(evaluated: number, total: number, label: string): HTMLElement {
  const group = el('div', 'meter-wrap');
  const progress = el('progress', 'meter'); progress.max = total; progress.value = evaluated;
  progress.setAttribute('aria-label', label);
  group.append(progress, el('span', 'muted', `${evaluated} de ${total} actividades registradas`)); return group;
}
export function download(text: string, name: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = el('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function numericInput(value: string | null, label: string): HTMLInputElement {
  // Keep the raw comma/point, including intermediate "8,". Number inputs can
  // sanitize these to an empty string on iOS before our input handler sees them.
  const input = el('input', 'number-input'); input.type = 'text'; input.inputMode = 'decimal';
  input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = 16; input.enterKeyHint = 'done';
  input.value = value ?? ''; input.placeholder = '—';
  input.setAttribute('aria-label', label); return input;
}
