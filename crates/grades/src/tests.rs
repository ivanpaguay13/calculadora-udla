use super::*;

fn empty() -> State {
    State {
        schema_version: 1,
        catalog_version: 1,
        periodo: "202710".into(),
        updated_at: "2026-10-20T00:00:00.000Z".into(),
        grades: BTreeMap::new(),
        targets: BTreeMap::new(),
        weights: BTreeMap::new(),
    }
}
fn fill(c: &Catalog, s: &mut State, code: &str, p: &str, grade: &str) {
    for a in &c
        .materias
        .iter()
        .find(|m| m.codigo == code)
        .unwrap()
        .progresos[p]
    {
        s.grades.insert(key(code, p, &a.id), Some(grade.into()));
    }
}
#[test]
fn official_catalog_is_consistent() {
    let c = catalog().unwrap();
    assert_eq!(c.materias.len(), 8);
    assert_eq!(
        c.materias.iter().map(|m| m.progresos.len()).sum::<usize>(),
        24
    );
    assert_eq!(
        c.materias
            .iter()
            .flat_map(|m| m.progresos.values())
            .map(Vec::len)
            .sum::<usize>(),
        103
    );
    validate(&c, &empty()).unwrap();
}
#[test]
fn rejects_invalid_grades_and_precision() {
    for input in [
        "-1",
        "10.01",
        "NaN",
        "Infinity",
        "texto",
        "",
        "1e1",
        "7.001",
        " 8 ",
        "99999999999",
        "1.",
    ] {
        assert!(decimal(input, 1000).is_err(), "{input}");
    }
    for (input, expected) in [("0", 0), ("10.00", 1000), ("7.5", 750)] {
        assert_eq!(decimal(input, 1000).unwrap(), expected);
    }
}
#[test]
fn image_example_and_unrounded_contribution() {
    let c = catalog().unwrap();
    let mut s = empty();
    for (id, g) in [("p1_e01", "8"), ("p1_e02", "9"), ("p1_e03", "7")] {
        s.grades.insert(key("MEDZ4399", "P1", id), Some(g.into()));
    }
    let r = calculate(&c, &s).unwrap();
    let m = &r.subjects["MEDZ4399"];
    assert_eq!(
        m.progresses["P1"].summary.final_grade.as_deref(),
        Some("7.95")
    );
    assert_eq!(m.progresses["P1"].contribution, "1.99");
    assert!(m.summary.final_grade.is_none());
    // Exact 1.9875 * 1.67 / 20 = .16595625; presentation rounds only here.
    assert_eq!(r.semester.accumulated, "0.17");
}
#[test]
fn required_rounds_up_to_hundredth() {
    let c = catalog().unwrap();
    let mut s = empty();
    fill(&c, &mut s, "MEDZ4399", "P1", "8");
    fill(&c, &mut s, "MEDZ4399", "P2", "7");
    let r = calculate(&c, &s).unwrap();
    assert_eq!(
        r.subjects["MEDZ4399"].simulation.required.as_deref(),
        Some("6.38")
    );
}
#[test]
fn pending_is_distinct_from_zero_and_partial_is_normalized() {
    let c = catalog().unwrap();
    let mut s = empty();
    let k = key("MEDZ4399", "P1", "p1_e01");
    s.grades.insert(k.clone(), None);
    let r = calculate(&c, &s).unwrap();
    assert_eq!(r.semester.evaluated, 0);
    assert!(r.semester.partial.is_none());
    s.grades.insert(k.clone(), Some("0".into()));
    assert_eq!(calculate(&c, &s).unwrap().semester.evaluated, 1);
    s.grades.insert(k, Some("8".into()));
    let r = calculate(&c, &s).unwrap();
    let p = &r.subjects["MEDZ4399"].progresses["P1"].summary;
    assert_eq!(p.accumulated, "2.80");
    assert_eq!(p.partial.as_deref(), Some("8.00"));
    assert!(p.final_grade.is_none());
    assert_eq!(r.subjects["MEDZ4398"].summary.evaluated, 0);
    assert_eq!(r.subjects["MEDZ4399"].progresses["P2"].summary.evaluated, 0);
}
#[test]
fn simulations_handle_empty_achieved_impossible_and_complete() {
    let c = catalog().unwrap();
    let mut s = empty();
    assert_eq!(
        calculate(&c, &s).unwrap().subjects["MEDZ4399"]
            .simulation
            .required
            .as_deref(),
        Some("7.00")
    );
    s.targets.insert("MEDZ4399".into(), "0".into());
    assert_eq!(
        calculate(&c, &s).unwrap().subjects["MEDZ4399"]
            .simulation
            .status,
        "achieved"
    );
    s.targets.insert("MEDZ4399".into(), "7".into());
    fill(&c, &mut s, "MEDZ4399", "P1", "0");
    fill(&c, &mut s, "MEDZ4399", "P2", "0");
    assert_eq!(
        calculate(&c, &s).unwrap().subjects["MEDZ4399"]
            .simulation
            .status,
        "impossible"
    );
    fill(&c, &mut s, "MEDZ4399", "P3", "10");
    let r = calculate(&c, &s).unwrap();
    let m = &r.subjects["MEDZ4399"];
    assert_eq!(m.simulation.status, "complete");
    assert!(m.simulation.required.is_none());
    assert_eq!(m.summary.final_grade.as_deref(), Some("4.00"));
}
#[test]
fn semester_uses_credits_and_all_eight_subjects() {
    let c = catalog().unwrap();
    let mut s = empty();
    for m in &c.materias {
        for p in ["P1", "P2", "P3"] {
            fill(&c, &mut s, &m.codigo, p, "8");
        }
    }
    assert_eq!(
        calculate(&c, &s).unwrap().semester.final_grade.as_deref(),
        Some("8.00")
    );
    for p in ["P1", "P2", "P3"] {
        fill(&c, &mut s, "MEDZ4396", p, "10");
    }
    assert_eq!(
        calculate(&c, &s).unwrap().semester.final_grade.as_deref(),
        Some("8.50")
    );
    s.grades.insert(key("MEDZ4396", "P1", "p1_e01"), None);
    assert!(calculate(&c, &s).unwrap().semester.final_grade.is_none());
}
#[test]
fn backup_roundtrip_preserves_ids_nulls_targets_and_overrides() {
    let c = catalog().unwrap();
    let mut s = empty();
    s.grades
        .insert(key("MEDZ4399", "P1", "p1_e01"), Some("8.15".into()));
    s.grades.insert(key("MEDZ4399", "P1", "p1_e02"), None);
    s.targets.insert("MEDZ4399".into(), "8.50".into());
    for (id, w) in [("p1_e01", "40"), ("p1_e02", "30"), ("p1_e03", "30")] {
        s.weights.insert(key("MEDZ4399", "P1", id), w.into());
    }
    let restored: State = serde_json::from_str(&serde_json::to_string(&s).unwrap()).unwrap();
    assert_eq!(s, restored);
    validate(&c, &restored).unwrap();
    assert_eq!(c.materias[3].progresos["P1"][0].peso_pct, 35);
    s.weights
        .insert(key("MEDZ4399", "P1", "p1_e01"), "41".into());
    assert!(validate(&c, &s).is_err());
}
#[test]
fn imports_reject_unknown_keys_versions_and_wrong_types() {
    let c = catalog().unwrap();
    let mut s = empty();
    s.grades.insert("unknown".into(), Some("8".into()));
    assert!(validate(&c, &s).is_err());
    s.grades.clear();
    s.schema_version = 2;
    assert!(validate(&c, &s).is_err());
    assert!(evaluate_json(r#"{"state": {}}"#).contains("\"ok\":false"));
    assert!(evaluate_json("not json").contains("\"ok\":false"));
}

#[test]
fn rounding_a_progress_before_weighting_would_change_the_final_grade() {
    let c = catalog().unwrap();
    let mut s = empty();
    for p in ["P1", "P2", "P3"] {
        fill(&c, &mut s, "MEDZ4399", p, "0");
    }
    s.grades
        .insert(key("MEDZ4399", "P2", "p2_e01"), Some("0.21".into()));
    let r = calculate(&c, &s).unwrap();
    let m = &r.subjects["MEDZ4399"];
    // P2 = .0735 (displays .07). Exact final = .025725 (displays .03).
    // Rounding P2 first would produce .0245 and incorrectly display .02.
    assert_eq!(
        m.progresses["P2"].summary.final_grade.as_deref(),
        Some("0.07")
    );
    assert_eq!(m.summary.final_grade.as_deref(), Some("0.03"));
}

#[test]
fn backup_dates_are_real_utc_dates() {
    for value in ["2024-02-29T23:59:59.999Z", "2026-10-20T00:00:00.000Z"] {
        assert!(valid_timestamp(value));
    }
    for value in [
        "",
        "bad",
        "2026-02-29T00:00:00.000Z",
        "2026-13-01T00:00:00.000Z",
        "2026-01-00T00:00:00.000Z",
        "2026-10-20T24:00:00.000Z",
        "2026-10-20T00:60:00.000Z",
    ] {
        assert!(!valid_timestamp(value), "{value}");
    }
}
