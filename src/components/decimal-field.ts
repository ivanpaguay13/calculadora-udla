import { parseDecimalInput } from '../grades/input.js';

/** Keep editable decimal drafts in the field; commit only valid, normalized values. */
export function bindDecimalField(input: HTMLInputElement, error: HTMLElement, onValue: (value: string | null) => boolean, required = false): void {
  const update = (finish: boolean) => {
    input.setCustomValidity('');
    let message = '';
    const parsed = parseDecimalInput(input.value, { finish });
    if (parsed.kind === 'draft') {
      input.setAttribute('aria-invalid', 'false'); error.textContent = ''; return;
    }
    if (parsed.kind === 'invalid') message = parsed.message;
    else if (parsed.kind === 'empty' && required) message = 'Introduce una meta de 0 a 10.';
    else if (parsed.kind === 'valid' || parsed.kind === 'empty') {
      if (!onValue(parsed.kind === 'valid' ? parsed.value : null)) message = 'El cambio no se guardó. Revisa el aviso superior.';
      else if (finish && parsed.kind === 'valid') input.value = parsed.value;
    }
    input.setCustomValidity(message); input.setAttribute('aria-invalid', String(!!message));
    error.textContent = message;
  };
  input.addEventListener('input', () => update(false));
  input.addEventListener('blur', () => update(true));
}
