import { loadEngine } from './grades/engine.js';
import { parseDecimalInput } from './grades/input.js';
import { bindDecimalField } from './components/decimal-field.js';
import { button, download, el, meter, metric, numericInput } from './components/dom.js';
import { commit, exportBackup, initialState, MAX_BACKUP_BYTES, parseBackup, restore, STORAGE_KEY } from './storage/state.js';
import { gradeKey, PROGRESSES } from './types.js';
import type { Catalog, Evaluate, Progress, Report, State, Subject, SubjectReport } from './types.js';

const root = document.querySelector<HTMLElement>('#app')!;
let catalog: Catalog, evaluate: Evaluate, state: State, report: Report;
let storage: Storage | null = null;
let liveUpdates: (() => void)[] = [];
let saved = false;
let notice: HTMLElement;
let saveLabel: HTMLElement;
const date = (value: string) => new Date(value).toLocaleString('es-EC');
const current = () => {
  try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
};

function announce(message: string, error = false): void {
  notice.textContent = message; notice.className = `notice ${error ? 'error' : 'success'}`;
  notice.hidden = false;
}
function updateSaveLabel(): void {
  saveLabel.textContent = storage ? (saved ? 'Guardado en este navegador' : 'Guardado local activado') : 'Modo temporal · exporta tus notas';
  saveLabel.classList.toggle('temporary', !storage);
}
function change(candidate: State): boolean {
  try {
    const result = commit(storage, candidate, evaluate);
    state = result.state; report = result.report; saved = true;
    notice.hidden = true; updateSaveLabel(); liveUpdates.forEach(fn => fn()); return true;
  } catch (error) {
    announce(error instanceof Error ? error.message : 'No se pudo guardar. Exporta una copia de tus notas.', true);
    return false;
  }
}
function live(parent: HTMLElement, render: () => HTMLElement[]): void {
  const node = el('div', 'live-region'); parent.append(node);
  const update = () => node.replaceChildren(...render()); liveUpdates.push(update); update();
}
function shell(): HTMLElement {
  liveUpdates = [];
  root.replaceChildren();
  const side = el('aside', 'sidebar');
  const brand = el('a', 'brand'); brand.href = '#';
  brand.append(el('span', 'brand-mark', 'n.'), el('span', '', 'Mis notas'));
  side.append(brand, el('p', 'eyebrow sidebar-label', 'MI ESPACIO ACADÉMICO'));
  const nav = el('nav', 'navigation'); nav.setAttribute('aria-label', 'Navegación principal');
  const home = el('a', current() === '' ? 'nav-link active' : 'nav-link', '▦  Resumen del semestre'); home.href = '#'; nav.append(home);
  nav.append(el('p', 'eyebrow sidebar-label', 'MIS MATERIAS'));
  catalog.materias.forEach((m, i) => {
    const link = el('a', current() === m.codigo ? 'nav-link subject-link active' : 'nav-link subject-link');
    link.href = `#${m.codigo}`; if (current() === m.codigo) link.setAttribute('aria-current', 'page');
    link.append(el('span', `subject-dot dot-${i % 4}`), el('span', '', m.nombre)); nav.append(link);
  });
  const settings = el('a', current() === 'ajustes' ? 'nav-link active settings-link' : 'nav-link settings-link', '⇄  Respaldos y ajustes');
  settings.href = '#ajustes'; nav.append(settings); side.append(nav);
  const sideFoot = el('div', 'sidebar-footer'); sideFoot.append(el('strong', '', 'Medicina · 5.º semestre'), el('span', '', `Período ${catalog.periodo}`)); side.append(sideFoot);
  const workspace = el('div', 'workspace');
  const top = el('header', 'topbar');
  top.append(el('span', 'topbar-title', 'Tu semestre, con claridad.'));
  saveLabel = el('span', 'save-label'); updateSaveLabel();
  top.append(saveLabel); workspace.append(top);
  notice = el('div', 'notice'); notice.hidden = true; notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
  const main = el('main', 'main'); main.id = 'contenido'; main.tabIndex = -1;
  const skip = el('a', 'skip-link', 'Saltar al contenido'); skip.href = '#contenido';
  skip.addEventListener('click', event => { event.preventDefault(); main.focus(); });
  workspace.append(notice, main); root.append(skip, side, workspace);
  if (!storage) announce('Estás en modo temporal: descarga un respaldo antes de cerrar esta pestaña.', true);
  return main;
}
function title(main: HTMLElement, eyebrow: string, heading: string, description: string): HTMLElement {
  const section = el('div', 'page-heading');
  const text = el('div'); text.append(el('p', 'eyebrow', eyebrow), el('h1', '', heading), el('p', 'intro', description));
  section.append(text); main.append(section); return section;
}
function backupButton(): HTMLButtonElement {
  return button('↓ Exportar respaldo', () => {
    download(exportBackup(state), `mis-notas-${catalog.periodo}-${new Date().toISOString().slice(0, 10)}.json`);
    announce('Respaldo descargado. Guárdalo para recuperar o trasladar tus notas.');
  }, 'button secondary');
}
function summaryStats(s: Report['semester'], semester = false): HTMLElement[] {
  return [
    metric(s.final_grade === null ? 'Nota definitiva' : 'Nota final', s.final_grade ?? 'Pendiente', semester ? 'Ponderada por créditos' : 'Escala de 0 a 10'),
    metric('Aporte acumulado', s.accumulated, 'Puntos ya obtenidos sobre 10'),
    metric('Promedio de lo evaluado', s.partial ?? '—', semester ? 'Según pesos y créditos evaluados' : 'Solo actividades con nota'),
    metric('Máximo alcanzable', s.maximum, 'Si obtienes 10 en todo lo pendiente'),
  ];
}
function overview(main: HTMLElement): void {
  const heading = title(main, `MEDICINA / PERÍODO ${catalog.periodo}`, 'Mi semestre', 'Cada nota cuenta. Registra tus resultados y planea lo que viene.');
  heading.append(backupButton());
  const hero = el('section', 'semester-hero'); hero.setAttribute('aria-label', 'Resumen del semestre');
  const heroText = el('div'); heroText.append(el('p', 'eyebrow', 'UNA VISTA DE TU AVANCE'), el('h2', '', 'Paso a paso, hacia tu meta.'), el('p', '', `${catalog.materias.length} materias · ${catalog.creditos_totales} créditos · tres progresos`));
  live(heroText, () => [meter(report.semester.evaluated, report.semester.total, 'Registro de notas del semestre')]);
  const art = el('div', 'hero-art'); art.setAttribute('aria-hidden', 'true'); art.append(el('span', 'art-orbit'), el('span', 'art-book', '↗'), el('span', 'art-spark', '+'));
  hero.append(heroText, art); main.append(hero);
  const stats = el('section', 'stats'); stats.setAttribute('aria-label', 'Resultados del semestre');
  live(stats, () => summaryStats(report.semester, true)); main.append(stats);
  const sectionHeading = el('div', 'section-heading'); sectionHeading.append(el('h2', '', 'Tus materias'), el('span', 'muted', 'Selecciona una para registrar tus notas')); main.append(sectionHeading);
  const grid = el('section', 'subject-grid'); grid.setAttribute('aria-label', 'Materias');
  catalog.materias.forEach((m, i) => {
    const card = el('a', `subject-card card-${i % 4}`); card.href = `#${m.codigo}`;
    const top = el('div', 'card-top'); top.append(el('span', 'subject-code', m.codigo), el('span', 'credits', `${m.creditos} cr.`));
    card.append(top, el('h3', '', m.nombre));
    live(card, () => {
      const r = report.subjects[m.codigo]!;
      const progress = el('div', 'progress-pills');
      PROGRESSES.forEach(p => progress.append(el('span', r.progresses[p].final_grade === null ? 'pill' : 'pill done', `${p} ${r.progresses[p].final_grade ?? '· pendiente'}`)));
      const bottom = el('div', 'card-bottom'); bottom.append(el('span', '', r.final_grade === null ? 'Máximo alcanzable' : 'Nota final'), el('strong', '', `${r.final_grade ?? r.maximum} / 10`));
      const open = el('span', 'card-open', 'Ver evaluaciones →');
      return [progress, meter(r.evaluated, r.total, `Avance de ${m.nombre}`), bottom, open];
    }); grid.append(card);
  }); main.append(grid);
  main.append(el('p', 'footnote', 'Las notas vacías siguen pendientes. El promedio semestral definitivo estará disponible al completar las ocho materias.'));
}

function simulation(m: Subject, r: SubjectReport): HTMLElement {
  const panel = el('section', `simulation ${r.simulation.status}`);
  const text = el('div'); text.append(el('p', 'eyebrow', 'TU PRÓXIMO OBJETIVO'));
  const messages = {
    complete: ['Todas las notas registradas', `Tu nota final es ${r.final_grade}. Meta configurada: ${r.simulation.target}.`],
    achieved: ['Tu meta ya está alcanzada', 'Tu aporte acumulado alcanza la meta, incluso con 0 en lo pendiente.'],
    impossible: ['Esta meta supera el máximo alcanzable', `Con 10 en todo lo pendiente, llegarías a ${r.maximum}. Puedes ajustar tu meta.`],
    reachable: ['Tu meta está a tu alcance', `Necesitas obtener al menos ${r.simulation.required} en cada actividad pendiente para llegar a ${r.simulation.target}.`],
  } as const;
  const message = messages[r.simulation.status]; text.append(el('h2', '', message[0]), el('p', '', message[1]));
  const figure = el('div', 'simulation-figure'); figure.append(el('strong', '', r.simulation.status === 'reachable' ? r.simulation.required! : r.simulation.status === 'impossible' ? r.maximum : '✓'), el('span', '', r.simulation.status === 'impossible' ? 'máximo posible' : r.simulation.status === 'reachable' ? 'en cada pendiente' : 'registro actualizado'));
  panel.setAttribute('aria-label', `Simulación de ${m.nombre}`); panel.append(text, figure); return panel;
}
function noteField(input: HTMLInputElement, apply: (value: string | null) => State, error: HTMLElement, optional = true): void {
  bindDecimalField(input, error, value => change(apply(value)), !optional);
}
function detail(main: HTMLElement, m: Subject): void {
  const back = el('a', 'back-link', '← Volver al semestre'); back.href = '#'; main.append(back);
  const heading = title(main, `${m.codigo} / ${m.creditos} CRÉDITOS`, m.nombre, 'Registra una nota por actividad, con coma o punto decimal (8,25 o 8.25). Puedes dejar vacías las que todavía no tienes.');
  heading.append(button('Ajustar ponderaciones', () => weightEditor(m), 'button secondary'));
  const stats = el('section', 'stats'); live(stats, () => summaryStats(report.subjects[m.codigo]!)); main.append(stats);
  const goalSection = el('section', 'goal-section');
  const goal = el('label', 'goal-label', 'Mi meta para esta materia');
  const goalInput = numericInput(state.targets[m.codigo] ?? catalog.nota_objetivo_inicial, `Meta de ${m.nombre}`);
  goalInput.required = true; goal.append(goalInput, el('span', 'muted', '/ 10')); goalSection.append(goal);
  const goalError = el('span', 'field-error'); goalError.id = 'goal-error'; goalInput.setAttribute('aria-describedby', 'goal-error');
  goalSection.append(goalError, el('p', 'muted', 'Es una meta personal editable; no confirma el mínimo institucional para aprobar.'));
  noteField(goalInput, value => ({ ...state, targets: { ...state.targets, [m.codigo]: value ?? '' } }), goalError, false);
  main.append(goalSection); live(main, () => [simulation(m, report.subjects[m.codigo]!)]);
  PROGRESSES.forEach(p => {
    const panel = el('section', 'progress-panel');
    const header = el('div', 'progress-heading');
    const label = el('div', 'progress-title'); label.append(el('span', 'progress-number', p.slice(1)), el('h2', '', `Progreso ${p.slice(1)}`), el('span', 'pill', `${catalog.pesos_progresos_pct[p]} % de la materia`));
    header.append(label);
    live(header, () => {
      const r = report.subjects[m.codigo]!.progresses[p];
      return [el('span', 'progress-status', r.final_grade === null ? `${r.evaluated}/${r.total} notas · pendiente` : `Completo · ${r.final_grade}`)];
    }); panel.append(header);
    const table = el('div', 'activity-table');
    const columns = el('div', 'activity-columns'); columns.append(el('span', '', 'ACTIVIDAD'), el('span', '', 'PESO EN PROGRESO'), el('span', '', 'NOTA / 10')); table.append(columns);
    m.progresos[p].forEach(a => {
      const k = gradeKey(m.codigo, p, a.id);
      const row = el('div', 'activity-row');
      const info = el('div', 'activity-info');
      const label = el('label', 'activity-name', a.nombre); label.htmlFor = k;
      info.append(label, el('span', 'activity-source', `Sílabo · página ${a.pagina_silabo}`));
      const weights = el('div', 'activity-weight');
      live(weights, () => {
        const r = report.subjects[m.codigo]!.progresses[p];
        return [el('strong', '', `${r.weights[a.id]} %`), el('span', 'muted', `${r.effective_weights[a.id]} % de materia`)];
      });
      const field = el('div', 'grade-field'); const input = numericInput(state.grades[k] ?? null, `Nota de ${a.nombre}, ${p}`); input.id = k;
      const error = el('span', 'field-error'); error.id = `error-${k}`; input.setAttribute('aria-describedby', error.id);
      noteField(input, value => ({ ...state, grades: { ...state.grades, [k]: value } }), error);
      field.append(input, error); row.append(info, weights, field); table.append(row);
    }); panel.append(table);
    const foot = el('div', 'progress-footer');
    live(foot, () => {
      const r = report.subjects[m.codigo]!.progresses[p];
      return [metric('Promedio definitivo', r.final_grade ?? 'Pendiente'), metric('Promedio de lo evaluado', r.partial ?? '—'), metric('Aporte a la materia', `${r.contribution} pts`), metric('Peso pendiente del progreso', `${r.pending_pct} %`)];
    }); panel.append(foot); main.append(panel);
  });
  if (m.observacion) main.append(el('p', 'footnote', m.observacion));
  live(main, () => [el('p', 'footnote', report.subjects[m.codigo]!.custom ? 'Configuración personalizada local activa. El catálogo original se conserva.' : 'Ponderaciones del catálogo original. Puedes crear una configuración personalizada si tu docente comunica un cambio.')]);
}

function dialog(titleText: string): { dialog: HTMLDialogElement; body: HTMLElement; close: () => void } {
  const d = el('dialog', 'dialog'); const top = el('div', 'dialog-heading');
  const heading = el('h2', '', titleText); heading.id = 'dialog-title'; d.setAttribute('aria-labelledby', heading.id);
  const close = () => { d.close(); d.remove(); };
  top.append(heading, button('Cerrar ×', close, 'button ghost'));
  const body = el('div', 'dialog-body'); d.append(top, body); document.body.append(d);
  d.addEventListener('cancel', event => { event.preventDefault(); close(); });
  d.showModal(); return { dialog: d, body, close };
}
function weightEditor(m: Subject): void {
  const { body, close } = dialog('Ponderaciones personalizadas');
  body.append(el('p', 'intro', 'Crea una copia local para los cambios que comunique tu docente. Cada progreso debe sumar 100 %; las actividades y el catálogo original se conservan.'));
  const form = el('form'); form.noValidate = true; const inputs: [string, HTMLInputElement][] = [];
  PROGRESSES.forEach(p => {
    const fieldset = el('fieldset', 'weight-group'); fieldset.append(el('legend', '', `Progreso ${p.slice(1)}`));
    const sum = el('p', 'weight-total');
    const group: HTMLInputElement[] = [];
    m.progresos[p].forEach(a => {
      const label = el('label', 'weight-row'); label.append(el('span', '', a.nombre));
      const k = gradeKey(m.codigo, p, a.id);
      const input = numericInput(state.weights[k] ?? String(a.peso_pct), `Peso de ${a.nombre} en ${p}`); input.required = true;
      label.append(input, el('span', '', '%')); fieldset.append(label); inputs.push([k, input]); group.push(input);
    });
    const refresh = () => {
      const parsed = group.map(input => parseDecimalInput(input.value, { minCents: 1, maxCents: 10000 }));
      const total = parsed.reduce((sum, value) => sum + (value.kind === 'valid' ? value.cents : 0), 0);
      const complete = parsed.every(value => value.kind === 'valid');
      sum.textContent = complete ? `Total: ${(total / 100).toFixed(2)} % / 100 %` : 'Completa los pesos con números mayores que 0 y hasta 100, con un máximo de dos decimales. Acepta coma o punto.';
      sum.classList.toggle('invalid-total', !complete || total !== 10000);
    };
    group.forEach(input => {
      input.addEventListener('input', () => { input.setCustomValidity(''); input.setAttribute('aria-invalid', 'false'); refresh(); });
      input.addEventListener('blur', () => {
        const parsed = parseDecimalInput(input.value, { minCents: 1, maxCents: 10000, finish: true });
        if (parsed.kind === 'valid') input.value = parsed.value;
        refresh();
      });
    }); refresh(); fieldset.append(sum); form.append(fieldset);
  });
  const error = el('p', 'field-error'); error.setAttribute('role', 'alert');
  const actions = el('div', 'dialog-actions');
  actions.append(button('Usar catálogo original', () => {
    const weights = Object.fromEntries(Object.entries(state.weights).filter(([k]) => !k.startsWith(`${m.codigo}/`)));
    if (change({ ...state, weights })) { close(); render(); announce('Ponderaciones originales restauradas.'); }
  }, 'button secondary'));
  const submit = el('button', 'button primary', 'Guardar configuración'); submit.type = 'submit'; actions.append(submit);
  form.append(error, actions); form.addEventListener('submit', event => {
    event.preventDefault(); const weights = { ...state.weights };
    for (const [k, input] of inputs) {
      const parsed = parseDecimalInput(input.value, { minCents: 1, maxCents: 10000, finish: true });
      if (parsed.kind !== 'valid') {
        const message = parsed.kind === 'invalid' ? parsed.message : 'Introduce un peso mayor que 0 y hasta 100.';
        error.textContent = message; input.setCustomValidity(message); input.setAttribute('aria-invalid', 'true'); input.focus(); return;
      }
      weights[k] = parsed.value;
    }
    const candidate = { ...state, weights };
    try { evaluate(candidate); } catch (e) { error.textContent = e instanceof Error ? e.message : 'Configuración inválida.'; return; }
    if (change(candidate)) { close(); render(); announce('Configuración personalizada guardada en este dispositivo.'); }
  }); body.append(form);
}
function importFile(file: File): void {
  if (file.size > MAX_BACKUP_BYTES) { announce('El respaldo supera 1 MB.', true); return; }
  void file.text().then(raw => {
    const candidate = parseBackup(raw, evaluate);
    const preview = evaluate(candidate);
    const { body, close } = dialog('Revisar respaldo');
    body.append(el('p', 'intro', `Período ${candidate.periodo} · ${preview.semester.evaluated} notas registradas · actualizado el ${date(candidate.updated_at)}.`));
    body.append(el('p', 'import-warning', 'Importar reemplazará tus notas, metas y ponderaciones actuales. Exporta un respaldo antes de continuar si quieres conservarlas.'));
    const actions = el('div', 'dialog-actions'); actions.append(backupButton(), button('Cancelar', close, 'button secondary'), button('Reemplazar e importar', () => {
      if (change(candidate)) { close(); render(); announce('Respaldo importado y validado.'); }
    }, 'button primary')); body.append(actions);
  }).catch(error => announce(error instanceof Error ? error.message : 'No se pudo leer el respaldo.', true));
}
function settings(main: HTMLElement): void {
  title(main, 'TUS DATOS, CONTIGO', 'Respaldos y ajustes', 'Conserva una copia de tus notas o llévalas a otro dispositivo.');
  const panel = el('section', 'settings-panel'); panel.append(el('h2', '', 'Copia de seguridad'), el('p', '', 'Las notas se guardan en este navegador. No se sincronizan entre dispositivos y pueden perderse si borras los datos del sitio.'));
  const actions = el('div', 'dialog-actions'); const file = el('input'); file.type = 'file'; file.accept = '.json,application/json'; file.hidden = true;
  file.addEventListener('change', () => { if (file.files?.[0]) importFile(file.files[0]); file.value = ''; });
  actions.append(backupButton(), button('↑ Importar respaldo', () => file.click(), 'button primary'), file); panel.append(actions);
  panel.append(el('p', 'muted', `Última modificación: ${date(state.updated_at)}. El respaldo incluye notas pendientes, metas y pesos personalizados.`)); main.append(panel);
  const local = el('section', 'settings-panel'); local.append(el('h2', '', 'Almacenamiento'), el('p', '', storage ? 'El guardado local está activo. Si el navegador no permite guardar un cambio, verás un aviso y se conservará la última versión guardada.' : 'Estás en modo temporal. Exporta un respaldo antes de cerrar la pestaña.'));
  if (storage) local.append(button('Continuar en modo temporal', () => {
    const { body, close } = dialog('Usar modo temporal'); body.append(el('p', '', 'Los próximos cambios solo vivirán en esta pestaña. Descarga un respaldo antes de cerrarla. Las notas que ya estaban guardadas se conservan en el navegador.'));
    body.append(button('Activar modo temporal', () => { storage = null; close(); render(); }, 'button primary'));
  }, 'button secondary'));
  main.append(local);
  const help = el('section', 'settings-panel'); help.append(el('h2', '', 'Cómo leer tus resultados'));
  const list = el('dl', 'help-list');
  for (const [term, description] of [
    ['Aporte acumulado', 'Puntos obtenidos sobre la nota final. Las actividades pendientes aún no aportan a este indicador.'],
    ['Promedio de lo evaluado', 'Promedio normalizado según el peso de las actividades con nota. En el semestre también se pondera por créditos.'],
    ['Máximo alcanzable', 'Resultado que obtendrías con 10 en todas las evaluaciones pendientes.'],
    ['Nota definitiva', 'Disponible al completar todas las actividades de la materia; en el semestre, al completar las ocho materias.'],
    ['Meta personal', 'Objetivo editable de 0 a 10. La simulación supone la misma nota en cada evaluación pendiente y redondea la nota requerida hacia arriba a centésimas.'],
  ]) { list.append(el('dt', '', term), el('dd', '', description)); }
  help.append(list); main.append(help);
  const source = el('section', 'settings-panel'); source.append(el('h2', '', 'Catálogo académico'), el('p', '', `Medicina UDLA · 5.º semestre · período ${catalog.periodo}. ${catalog.materias.length} materias y ${catalog.creditos_totales} créditos.`), el('p', 'muted', 'Los nombres y porcentajes proceden del catálogo proporcionado. Cada actividad indica la página de su sílabo. Verifica los cambios que comunique tu docente. Esta herramienta es personal y no está conectada al campus.')); main.append(source);
}

function render(): void {
  const main = shell(); const route = current();
  if (route === 'ajustes') settings(main);
  else { const subject = catalog.materias.find(m => m.codigo === route); if (subject) detail(main, subject); else overview(main); }
  document.title = `${catalog.materias.find(m => m.codigo === current())?.nombre ?? (current() === 'ajustes' ? 'Respaldos y ajustes' : 'Mi semestre')} · Mis notas`;
}
function recovery(raw: string | null, error: unknown): void {
  root.replaceChildren(); const panel = el('main', 'recovery');
  panel.append(el('span', 'brand-mark', 'n.'), el('h1', '', 'Tus datos necesitan revisión'), el('p', '', error instanceof Error ? error.message : 'No se pudo acceder al almacenamiento local.'));
  panel.append(el('p', '', 'No hemos reemplazado tus datos. Puedes descargar el contenido original para revisarlo o continuar en una sesión temporal.'));
  if (raw !== null) panel.append(button('Descargar datos originales', () => download(raw, 'mis-notas-recuperacion.json'), 'button secondary'));
  panel.append(button('Continuar en modo temporal', () => { storage = null; state = initialState(catalog); report = evaluate(state); render(); }, 'button primary'));
  root.append(panel);
}
async function start(): Promise<void> {
  const [engine, response] = await Promise.all([loadEngine(), fetch(new URL('../catalog.json', import.meta.url))]);
  if (!response.ok) throw new Error('No se pudo cargar el catálogo académico.');
  evaluate = engine; catalog = await response.json() as Catalog;
  let raw: string | null = null;
  try {
    storage = window.localStorage; raw = storage.getItem(STORAGE_KEY);
    state = restore(storage, catalog, evaluate); report = evaluate(state);
  } catch (error) { recovery(raw, error); return; }
  render();
}
window.addEventListener('hashchange', () => { if (state) { render(); document.querySelector<HTMLElement>('main')?.focus(); window.scrollTo(0, 0); } });
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY && storage) {
    // Avoid silently overwriting edits from another tab.
    storage = null; updateSaveLabel(); announce('Las notas cambiaron en otra pestaña. Esta pestaña pasa a modo temporal; exporta sus cambios o recarga para abrir la versión guardada.', true);
  }
});
void start().catch(error => {
  root.replaceChildren(); const panel = el('main', 'recovery');
  panel.append(el('h1', '', 'No pudimos iniciar la calculadora'), el('p', '', error instanceof Error ? error.message : 'Error al cargar la aplicación.'), button('Volver a intentar', () => location.reload(), 'button primary'));
  root.append(panel);
});
