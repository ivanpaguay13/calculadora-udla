//! Pure academic calculations. All arithmetic uses scaled integers; rounding is presentation-only.
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

pub const SOURCE: &str = include_str!("../../../instrucciones/evaluaciones_5to_semestre.json");
const FULL: i64 = 100_000_000; // activity basis points × progress basis points

#[derive(Clone, Deserialize, Serialize)]
pub struct Catalog {
    pub version: u32,
    pub periodo: String,
    pub nota_objetivo_inicial: String,
    pub pesos_progresos_pct: BTreeMap<String, i64>,
    pub creditos_totales: String,
    pub materias: Vec<Subject>,
}
#[derive(Clone, Deserialize, Serialize)]
pub struct Subject {
    pub codigo: String,
    pub nombre: String,
    pub creditos: String,
    pub silabo: String,
    pub progresos: BTreeMap<String, Vec<Activity>>,
    pub observacion: Option<String>,
}
#[derive(Clone, Deserialize, Serialize)]
pub struct Activity {
    pub id: String,
    pub nombre: String,
    pub peso_pct: i64,
    pub pagina_silabo: u32,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct State {
    pub schema_version: u32,
    pub catalog_version: u32,
    pub periodo: String,
    pub updated_at: String,
    pub grades: BTreeMap<String, Option<String>>,
    pub targets: BTreeMap<String, String>,
    pub weights: BTreeMap<String, String>,
}

pub fn key(subject: &str, progress: &str, activity: &str) -> String {
    format!("{subject}/{progress}/{activity}")
}

/// Parse a nonnegative decimal with at most two places, without passing through float.
pub fn decimal(value: &str, max: i64) -> Result<i64, String> {
    let parts: Vec<_> = value.split('.').collect();
    if parts.len() > 2
        || parts[0].is_empty()
        || parts[0].len() > 3
        || !parts[0].bytes().all(|x| x.is_ascii_digit())
        || (parts.len() == 2
            && (parts[1].is_empty()
                || parts[1].len() > 2
                || !parts[1].bytes().all(|x| x.is_ascii_digit())))
    {
        return Err("Usa un número con hasta dos decimales.".into());
    }
    let whole: i64 = parts[0].parse().map_err(|_| "Número inválido.")?;
    let fraction = if parts.len() == 1 {
        0
    } else {
        parts[1].parse::<i64>().map_err(|_| "Número inválido.")?
            * if parts[1].len() == 1 { 10 } else { 1 }
    };
    let result = whole * 100 + fraction;
    if result > max {
        return Err(format!("El valor debe estar entre 0 y {}.", max / 100));
    }
    Ok(result)
}

fn fixed(cents: i64) -> String {
    format!("{}.{:02}", cents / 100, cents % 100)
}
fn display(n: i64, d: i64) -> String {
    fixed((n * 100 + d / 2) / d)
}

pub fn catalog() -> Result<Catalog, String> {
    let c: Catalog = serde_json::from_str(SOURCE).map_err(|e| e.to_string())?;
    if c.materias.len() != 8
        || c.pesos_progresos_pct.len() != 3
        || c.pesos_progresos_pct.values().sum::<i64>() != 100
        || decimal(&c.creditos_totales, 100_000)? != 2000
    {
        return Err("Catálogo: estructura o créditos incorrectos.".into());
    }
    let mut credits = 0;
    let mut codes = BTreeSet::new();
    for m in &c.materias {
        if !codes.insert(&m.codigo) || m.progresos.len() != 3 {
            return Err("Materia duplicada o incompleta.".into());
        }
        credits += decimal(&m.creditos, 100_000)?;
        for p in ["P1", "P2", "P3"] {
            let a = m.progresos.get(p).ok_or("Falta un progreso.")?;
            if !c.pesos_progresos_pct.contains_key(p)
                || a.is_empty()
                || a.iter().map(|x| x.peso_pct).sum::<i64>() != 100
                || a.iter().any(|x| x.peso_pct <= 0)
                || a.iter().map(|x| &x.id).collect::<BTreeSet<_>>().len() != a.len()
            {
                return Err(format!("Catálogo inválido: {} {p}.", m.codigo));
            }
        }
    }
    if credits != 2000 {
        return Err("Los créditos deben sumar 20.00.".into());
    }
    Ok(c)
}

fn valid_timestamp(value: &str) -> bool {
    // Backups use Date.toISOString(): UTC with exactly three millisecond places.
    let bytes = value.as_bytes();
    if bytes.len() != 24 {
        return false;
    }
    for (i, byte) in bytes.iter().enumerate() {
        let expected = match i {
            4 | 7 => Some(b'-'),
            10 => Some(b'T'),
            13 | 16 => Some(b':'),
            19 => Some(b'.'),
            23 => Some(b'Z'),
            _ => None,
        };
        if let Some(expected) = expected {
            if *byte != expected {
                return false;
            }
        } else if !byte.is_ascii_digit() {
            return false;
        }
    }
    let part = |start: usize, end: usize| value[start..end].parse::<u32>().unwrap_or(u32::MAX);
    let (year, month, day) = (part(0, 4), part(5, 7), part(8, 10));
    let leap = year.is_multiple_of(4) && (!year.is_multiple_of(100) || year.is_multiple_of(400));
    let max_day = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap => 29,
        2 => 28,
        _ => 0,
    };
    day >= 1 && day <= max_day && part(11, 13) < 24 && part(14, 16) < 60 && part(17, 19) < 60
}

pub fn validate(c: &Catalog, s: &State) -> Result<(), String> {
    if s.schema_version != 1 || s.catalog_version != c.version || s.periodo != c.periodo {
        return Err("El respaldo no corresponde a esta versión y período.".into());
    }
    if !valid_timestamp(&s.updated_at) {
        return Err(
            "La fecha del respaldo debe ser una fecha UTC válida (ISO 8601 con milisegundos)."
                .into(),
        );
    }
    let valid_keys: BTreeSet<_> = c
        .materias
        .iter()
        .flat_map(|m| {
            m.progresos
                .iter()
                .flat_map(move |(p, aa)| aa.iter().map(move |a| key(&m.codigo, p, &a.id)))
        })
        .collect();
    for (k, value) in &s.grades {
        if !valid_keys.contains(k) {
            return Err(format!("Evaluación desconocida: {k}."));
        }
        if let Some(v) = value {
            decimal(v, 1000)?;
        }
    }
    for (k, v) in &s.targets {
        if !c.materias.iter().any(|m| &m.codigo == k) {
            return Err("Meta de materia desconocida.".into());
        }
        decimal(v, 1000)?;
    }
    for (k, v) in &s.weights {
        if !valid_keys.contains(k) {
            return Err("Ponderación de actividad desconocida.".into());
        }
        if decimal(v, 10_000)? == 0 {
            return Err("Los pesos deben ser mayores que cero.".into());
        }
    }
    for m in &c.materias {
        for (p, aa) in &m.progresos {
            let mut total = 0;
            for a in aa {
                total += weight(s, &m.codigo, p, a)?;
            }
            if total != 10_000 {
                return Err(format!("{} {p}: los pesos deben sumar 100 %.", m.nombre));
            }
        }
    }
    Ok(())
}

fn weight(s: &State, m: &str, p: &str, a: &Activity) -> Result<i64, String> {
    s.weights
        .get(&key(m, p, &a.id))
        .map_or(Ok(a.peso_pct * 100), |v| decimal(v, 10_000))
}

#[derive(Serialize, Debug)]
pub struct Summary {
    pub accumulated: String,
    pub partial: Option<String>,
    pub final_grade: Option<String>,
    pub maximum: String,
    pub pending_pct: String,
    pub evaluated: usize,
    pub total: usize,
}
fn summary(acc: i64, known: i64, full: i64, evaluated: usize, total: usize) -> Summary {
    Summary {
        accumulated: display(acc, 100 * full),
        partial: (known > 0).then(|| display(acc, 100 * known)),
        final_grade: (evaluated == total).then(|| display(acc, 100 * full)),
        maximum: display(acc + 1000 * (full - known), 100 * full),
        pending_pct: display(100 * (full - known), full),
        evaluated,
        total,
    }
}

#[derive(Serialize, Debug)]
pub struct ProgressReport {
    #[serde(flatten)]
    pub summary: Summary,
    pub contribution: String,
    pub weights: BTreeMap<String, String>,
    pub effective_weights: BTreeMap<String, String>,
}
#[derive(Serialize, Debug)]
pub struct Simulation {
    pub status: String,
    pub required: Option<String>,
    pub target: String,
}
#[derive(Serialize, Debug)]
pub struct SubjectReport {
    #[serde(flatten)]
    pub summary: Summary,
    pub progresses: BTreeMap<String, ProgressReport>,
    pub simulation: Simulation,
    pub custom: bool,
}
#[derive(Serialize, Debug)]
pub struct Report {
    pub semester: Summary,
    pub subjects: BTreeMap<String, SubjectReport>,
}

pub fn calculate(c: &Catalog, s: &State) -> Result<Report, String> {
    validate(c, s)?;
    let (mut semester_acc, mut semester_known, mut semester_full) = (0, 0, 0);
    let (mut evaluated, mut total) = (0, 0);
    let mut subjects = BTreeMap::new();
    for m in &c.materias {
        let (mut acc, mut known) = (0, 0);
        let (mut count, mut size) = (0, 0);
        let mut progresses = BTreeMap::new();
        for (p, aa) in &m.progresos {
            let pw = c.pesos_progresos_pct[p] * 100;
            let (mut pa, mut pk, mut pc) = (0, 0, 0);
            let mut weights = BTreeMap::new();
            let mut effective_weights = BTreeMap::new();
            for a in aa {
                let w = weight(s, &m.codigo, p, a)?;
                weights.insert(a.id.clone(), fixed(w));
                effective_weights.insert(a.id.clone(), display(w * pw, 1_000_000));
                if let Some(Some(v)) = s.grades.get(&key(&m.codigo, p, &a.id)) {
                    pa += decimal(v, 1000)? * w;
                    pk += w;
                    pc += 1;
                }
            }
            acc += pa * pw;
            known += pk * pw;
            count += pc;
            size += aa.len();
            progresses.insert(
                p.clone(),
                ProgressReport {
                    summary: summary(pa, pk, 10_000, pc, aa.len()),
                    contribution: display(pa * pw, 100 * FULL),
                    weights,
                    effective_weights,
                },
            );
        }
        let target = s
            .targets
            .get(&m.codigo)
            .unwrap_or(&c.nota_objetivo_inicial)
            .clone();
        let deficit = decimal(&target, 1000)? * FULL - acc;
        let pending = FULL - known;
        let status = if count == size {
            "complete"
        } else if deficit <= 0 {
            "achieved"
        } else if deficit > 1000 * pending {
            "impossible"
        } else {
            "reachable"
        };
        let required = if pending > 0 && deficit > 0 {
            Some(fixed((deficit + pending - 1) / pending))
        } else {
            None
        };
        let credits = decimal(&m.creditos, 100_000)?;
        semester_acc += acc * credits;
        semester_known += known * credits;
        semester_full += FULL * credits;
        evaluated += count;
        total += size;
        subjects.insert(
            m.codigo.clone(),
            SubjectReport {
                summary: summary(acc, known, FULL, count, size),
                progresses,
                simulation: Simulation {
                    status: status.into(),
                    required,
                    target,
                },
                custom: s
                    .weights
                    .keys()
                    .any(|k| k.starts_with(&format!("{}/", m.codigo))),
            },
        );
    }
    Ok(Report {
        semester: summary(
            semester_acc,
            semester_known,
            semester_full,
            evaluated,
            total,
        ),
        subjects,
    })
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Request {
    pub state: State,
}

/// JSON boundary shared by native tests and WebAssembly.
pub fn evaluate_json(input: &str) -> String {
    let result = (|| {
        let req: Request =
            serde_json::from_str(input).map_err(|_| "Formato de respaldo inválido.".to_string())?;
        calculate(&catalog()?, &req.state)
    })();
    match result {
        Ok(report) => serde_json::json!({"ok": true, "report": report}).to_string(),
        Err(error) => serde_json::json!({"ok": false, "error": error}).to_string(),
    }
}

// Minimal synchronous WASM ABI. Rust owns both allocations; JS copies the response before freeing.
// Callers must pass only pointers returned by allocate and their original lengths.
#[cfg(target_arch = "wasm32")]
mod wasm {
    #[no_mangle]
    pub extern "C" fn allocate(len: usize) -> *mut u8 {
        Box::into_raw(vec![0u8; len].into_boxed_slice()) as *mut u8
    }
    #[no_mangle]
    pub unsafe extern "C" fn deallocate(ptr: *mut u8, len: usize) {
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, len)));
    }
    #[no_mangle]
    pub unsafe extern "C" fn evaluate(ptr: *const u8, len: usize) -> u64 {
        let input = std::str::from_utf8(std::slice::from_raw_parts(ptr, len)).unwrap_or("");
        let output = super::evaluate_json(input).into_bytes().into_boxed_slice();
        let size = output.len();
        let address = Box::into_raw(output) as *mut u8;
        ((size as u64) << 32) | address as u64
    }
}

#[cfg(test)]
mod tests;
