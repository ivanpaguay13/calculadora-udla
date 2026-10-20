# Guía para Codex — Calculadora de notas UDLA

- Lee `ESPECIFICACION_CALCULADORA.md` y `evaluaciones_5to_semestre.json` al empezar.
- **No cambies** los porcentajes, créditos ni actividades del catálogo por inferencia propia. Ante una discrepancia consulta el PDF fuente y la página indicada en JSON; pide confirmación si persiste.
- La lógica de las calificaciones va en funciones puras y debe tener tests antes de añadir complejidad a la interfaz.
- Usa pesos en porcentaje dentro de cada progreso; el progreso se pondera después en la nota de la materia, y los créditos después en el promedio semestral.
- Trata toda nota faltante como `null`, nunca como una nota cero real.
- Usa cálculo decimal fiable o enteros escalados, y no redondees resultados intermedios.
- Comprueba que los 24 progresos suman exactamente 100 % y que los créditos suman 20.00.
- Mantén una escala 0–10 y una **meta configurable**; no presentes 7/10 como exigencia institucional confirmada.
- No implementes un backend, sincronización en la nube ni autenticación para el MVP, salvo nueva instrucción.
- Usa interfaz en español; preferir accesibilidad, controles numéricos y diseño adaptable.
- No almacenes datos personales en el catálogo oficial. Persistir notas del usuario por separado y permitir exportar/importar.
- Cuando implementes una funcionalidad, escribe o actualiza pruebas y resume brevemente qué cambió y cómo ejecutarlo.
