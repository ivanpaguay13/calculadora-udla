# Especificación del proyecto — Calculadora académica (5.º semestre de Medicina)

> **Versión:** 1.0 · **Origen:** 8 sílabos de la UDLA, período `202710` · **Estado:** especificación para desarrollo con Codex (no es código de la aplicación).

## 1. Objetivo

Construir una calculadora personal de calificaciones que permita introducir **la nota de cada actividad evaluada**, calcular automáticamente los resultados de los tres progresos de cada materia, proyectar el resultado final y estimar las notas mínimas necesarias para alcanzar una meta configurable. Debe calcular también el promedio semestral **ponderado por créditos**.

**Alcance del MVP:** ocho materias, tres progresos, escala de 0 a 10, registro de notas incompletas, guardado local, simulaciones de metas y copia de seguridad/exportación. No requiere servidor, cuentas ni acceso al campus.

## 2. Fuente de verdad: archivos de datos y PDFs

- `evaluaciones_5to_semestre.json`: catálogo estructurado de materias, créditos, progresos, actividades, porcentajes y página de respaldo del sílabo. **Usar este JSON como fuente de verdad para el programa**, en lugar de duplicar los porcentajes dentro del código.
- `Syllabus_MEDZ4396_202710.pdf` a `Syllabus_MEDZ4403_202710.pdf`: fuentes oficiales adjuntas. La columna pertinente es **Evaluaciones** de la sección **F. Planificación y Evaluación**.
- Este documento: requisitos funcionales, comprobaciones y desglose legible por humanos. Si hay una discrepancia entre este Markdown y el JSON, contrastar primero con el PDF, corregir los dos y añadir prueba de validación.

## 3. Reglas de calificación

| Progreso | Peso en la nota final de cada materia |
|---|---:|
| P1 | 25 % |
| P2 | 35 % |
| P3 | 40 % |

- **Dentro de cada progreso**, las actividades tienen sus propios pesos, cuya suma debe ser exactamente **100 %**.
- La escala prevista para registrar notas es **0–10**. No se establece como hecho que 7/10 sea el umbral oficial para aprobar: `7.00` es solo una meta inicial **editable**.
- Promedio de un progreso: `Σ(nota_actividad × peso_actividad / 100)`.
- Nota final de una materia: `P1 × 0.25 + P2 × 0.35 + P3 × 0.40`. Calcular una nota definitiva solo cuando estén completos todos los progresos; si faltan notas, indicar "pendiente" y mostrar por separado lo acumulado y proyecciones.
- Nota semestral definitiva: `Σ(nota_final_materia × créditos_materia) / 20.00` (solo cuando estén completas las ocho materias).
- Para **notas pendientes**, conservar `null` / vacío, nunca transformarlas silenciosamente en cero. Al presentar el aporte acumulado, las pendientes aportan temporalmente 0 **solo a ese indicador**, sin considerarse calificadas.
- Evitar redondeos intermedios; calcular con decimal exacto o enteros escalados. Redondear únicamente para presentar (normalmente dos decimales). En la nota mínima a conseguir, redondear **hacia arriba** a la precisión admitida.

## 4. Asignaturas y créditos

| Código | Asignatura | Créditos |
|---|---|---:|
| MEDZ4396 | Farmacología I | 5.00 |
| MEDZ4397 | Nutrición | 1.66 |
| MEDZ4398 | Genética | 2.50 |
| MEDZ4399 | Diagnóstico por Imagen I | 1.67 |
| MEDZ4400 | Psicopatología Descriptiva I | 1.67 |
| MEDZ4401 | Propedéutica Clínica II | 5.00 |
| MEDZ4402 | Promoción de la Salud | 0.83 |
| MEDZ4403 | Bioética y Legislación Médica | 1.67 |
| **Total** | **8 materias** | **20.00** |

## 5. Catálogo verificado de evaluaciones

**Cómo leer las tablas:** los porcentajes están **dentro del progreso** indicado. La columna "PDF" es la página del sílabo donde aparece la evaluación (la actividad puede empezar en una página y terminar en la siguiente). Los nombres aclaratorios añadidos para desambiguar se señalan en las observaciones de cada asignatura.

### Farmacología I — MEDZ4396 · 5.00 créditos
**Fuente:** `Syllabus_MEDZ4396_202710.pdf`

**Progreso 1** — 25 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Infografía sobre el desarrollo de un nuevo fármaco | 6 % | p. 6 |
| Paso 1: Diagnóstico | 6 % | p. 7 |
| Evaluación parcial 1 | 35 % | p. 7 |
| Paso 2: Objetivo terapéutico | 6 % | p. 8 |
| Evaluación parcial 2 | 35 % | p. 9 |
| Paso 3: Inventario de grupos de fármacos efectivos | 12 % | p. 9 |
| **Total del progreso** | **100 %** | |

**Progreso 2** — 35 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Integración de los pasos 1, 2 y 3 | 6 % | p. 11 |
| Paso 4: Análisis de seguridad | 6 % | p. 13 |
| Paso 4: Conveniencia | 6 % | p. 14 |
| Evaluación parcial 3 | 35 % | p. 14 |
| Paso 4: Eficiencia | 6 % | p. 15 |
| Evaluación parcial 4 | 35 % | p. 16 |
| Paso 5: Consolidación de los cinco productos finales | 6 % | p. 17 |
| **Total del progreso** | **100 %** | |

**Progreso 3** — 40 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Presentación de estrategia de selección de fármacos | 20 % | p. 21 |
| Evaluación parcial 5 | 20 % | p. 21 |
| Examen final | 30 % | p. 24 |
| Examen integrador | 30 % | p. 24 |
| **Total del progreso** | **100 %** | |

### Nutrición — MEDZ4397 · 1.66 créditos
**Fuente:** `Syllabus_MEDZ4397_202710.pdf`

**Progreso 1** — 25 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Examen parcial 1 | 30 % | p. 4 |
| Examen parcial 2 | 30 % | p. 6 |
| Examen parcial 3 | 40 % | p. 8 |
| **Total del progreso** | **100 %** | |

**Progreso 2** — 35 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Examen parcial 4 | 35 % | p. 10 |
| Examen parcial 5 | 35 % | p. 11 |
| Examen parcial 6 | 30 % | p. 12 |
| **Total del progreso** | **100 %** | |

**Progreso 3** — 40 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Examen parcial 7 | 30 % | p. 14 |
| Examen final | 40 % | p. 16 |
| Examen integrador | 30 % | p. 17 |
| **Total del progreso** | **100 %** | |

### Genética — MEDZ4398 · 2.50 créditos
**Fuente:** `Syllabus_MEDZ4398_202710.pdf`

**Progreso 1** — 25 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Evaluación parcial teórica 1 | 35 % | p. 4 |
| Evaluación parcial práctica 1 | 30 % | p. 6 |
| Evaluación parcial teórica 2 | 35 % | p. 6 |
| **Total del progreso** | **100 %** | |

**Progreso 2** — 35 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Evaluación parcial teórica 3 | 35 % | p. 8 |
| Evaluación práctica 2 | 30 % | p. 10 |
| Evaluación parcial teórica 4 | 35 % | p. 10 |
| **Total del progreso** | **100 %** | |

**Progreso 3** — 40 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Evaluación parcial 5 | 20 % | p. 12 |
| Examen acumulativo de práctica | 20 % | p. 14 |
| Examen acumulativo final | 30 % | p. 14 |
| Examen integrador | 30 % | p. 14 |
| **Total del progreso** | **100 %** | |

### Diagnóstico por Imagen I — MEDZ4399 · 1.67 créditos
**Fuente:** `Syllabus_MEDZ4399_202710.pdf`

**Progreso 1** — 25 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Primer examen teórico (PG1) | 35 % | p. 5 |
| Aplicación práctica 1 | 30 % | p. 6 |
| Parcial 2 | 35 % | p. 6 |
| **Total del progreso** | **100 %** | |

**Progreso 2** — 35 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Parcial 3 | 35 % | p. 9 |
| Aplicación práctica 2 | 30 % | p. 10 |
| Parcial 4 | 35 % | p. 11 |
| **Total del progreso** | **100 %** | |

**Progreso 3** — 40 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Aplicación práctica 3 | 10 % | p. 16 |
| Examen final acumulativo | 20 % | p. 16 |
| Examen integrador | 30 % | p. 16 |
| Examen de externado | 40 % | p. 16 |
| **Total del progreso** | **100 %** | |

### Psicopatología Descriptiva I — MEDZ4400 · 1.67 créditos
**Fuente:** `Syllabus_MEDZ4400_202710.pdf`

**Progreso 1** — 25 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Prueba parcial 1 | 30 % | p. 4 |
| Prueba parcial 2 | 35 % | p. 5 |
| Prueba parcial 3 | 35 % | p. 5 |
| **Total del progreso** | **100 %** | |

**Progreso 2** — 35 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Prueba parcial 4 | 30 % | p. 6 |
| Prueba parcial 5 | 35 % | p. 7 |
| Prueba parcial 6 | 35 % | p. 8 |
| **Total del progreso** | **100 %** | |

**Progreso 3** — 40 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Prueba parcial 7 | 20 % | p. 10 |
| Evaluación de la actividad práctica | 20 % | p. 11 |
| Examen final | 30 % | p. 11 |
| Examen integrador | 30 % | p. 12 |
| **Total del progreso** | **100 %** | |

### Propedéutica Clínica II — MEDZ4401 · 5.00 créditos
**Fuente:** `Syllabus_MEDZ4401_202710.pdf`

**Progreso 1** — 25 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Primera evaluación sumativa del progreso 1 | 20 % | p. 6 |
| Habilidades prácticas en aula | 5 % | p. 8 |
| Razonamiento clínico | 5 % | p. 9 |
| Actividad integradora con paciente simulado | 20 % | p. 10 |
| Segunda evaluación sumativa del progreso 1 | 20 % | p. 10 |
| Examen físico de piel, pelo, uñas y mucosas | 10 % | p. 11 |
| Evaluación práctica sumativa del progreso 1 | 20 % | p. 13 |
| **Total del progreso** | **100 %** | |

**Progreso 2** — 35 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Actividad integradora con paciente simulado (primera) | 10 % | p. 13 |
| Primera evaluación sumativa del progreso 2 | 20 % | p. 17 |
| Razonamiento clínico | 5 % | p. 19 |
| Habilidades prácticas en aula | 5 % | p. 19 |
| Examen físico de garganta y cavidad bucal | 10 % | p. 20 |
| Actividad integradora con paciente simulado (segunda) | 10 % | p. 20 |
| Segunda evaluación sumativa del progreso 2 | 20 % | p. 21 |
| Evaluación práctica sumativa del progreso 2 | 20 % | p. 22 |
| **Total del progreso** | **100 %** | |

**Progreso 3** — 40 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Primera evaluación sumativa del progreso 3 | 15 % | p. 25 |
| Examen físico cardiovascular: auscultación | 5 % | p. 29 |
| Habilidades prácticas en aula | 5 % | p. 29 |
| Razonamiento clínico | 5 % | p. 29 |
| Actividad integradora con paciente simulado | 10 % | p. 30 |
| Evaluación práctica sumativa del progreso 3 | 10 % | p. 30 |
| Evaluación final unificada acumulativa | 20 % | p. 32 |
| Examen integrador | 30 % | p. 33 |
| **Total del progreso** | **100 %** | |

**Nota de identificación:** Las etiquetas primera/segunda de las actividades con paciente simulado del progreso 2 son identificadores internos añadidos para distinguir evaluaciones homónimas; ambas se denominan actividad integradora con paciente simulado en el sílabo.

### Promoción de la Salud — MEDZ4402 · 0.83 créditos
**Fuente:** `Syllabus_MEDZ4402_202710.pdf`

**Progreso 1** — 25 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Tarea grupal: atención primaria y enfoque familiar | 15 % | p. 3 |
| Tarea grupal: niñez y adolescencia | 15 % | p. 3 |
| Tarea grupal: adulto y salud de la mujer | 15 % | p. 4 |
| Evaluación parcial 1 | 30 % | p. 4 |
| Tarea grupal: línea de curso de vida | 25 % | p. 4 |
| **Total del progreso** | **100 %** | |

**Progreso 2** — 35 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Tarea grupal: salud reproductiva | 15 % | p. 5 |
| Entrega de cronograma para ciclos de intervención comunitaria | 20 % | p. 5 |
| Tarea grupal: alimentación y dietas terapéuticas | 15 % | p. 5 |
| Evaluación parcial 2 | 30 % | p. 6 |
| Tarea grupal: obesidad y diabetes mellitus | 20 % | p. 6 |
| **Total del progreso** | **100 %** | |

**Progreso 3** — 40 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Tarea grupal: salud mental | 5 % | p. 7 |
| Tarea grupal: tabaquismo y otras dependencias | 5 % | p. 7 |
| Exposición grupal: socialización de resultados | 20 % | p. 8 |
| Examen final | 30 % | p. 9 |
| Examen integrador | 40 % | p. 9 |
| **Total del progreso** | **100 %** | |

**Nota de identificación:** Los temas tras «Tarea grupal» se añaden a modo de identificador basándose en la sesión del sílabo. La columna de evaluación denomina genéricamente «Tarea grupal» a varias actividades.

### Bioética y Legislación Médica — MEDZ4403 · 1.67 créditos
**Fuente:** `Syllabus_MEDZ4403_202710.pdf`

**Progreso 1** — 25 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Análisis de la película Patch Adams: trabajo presencial de aplicación de conocimiento | 30 % | p. 4 |
| Informe grupal de resolución de caso clínico | 30 % | p. 5 |
| Prueba parcial del progreso 1 | 40 % | p. 5 |
| **Total del progreso** | **100 %** | |

**Progreso 2** — 35 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Informe grupal de resolución de caso clínico | 35 % | p. 7 |
| Role playing: comunicación de malas noticias | 35 % | p. 8 |
| Prueba parcial del progreso 2 | 30 % | p. 8 |
| **Total del progreso** | **100 %** | |

**Progreso 3** — 40 % de la nota final

| Actividad | Peso dentro del progreso | PDF |
|---|---:|---:|
| Debate sobre IA y otros recursos tecnológicos en salud | 30 % | p. 11 |
| Examen final acumulativo | 40 % | p. 12 |
| Examen integrador | 30 % | p. 12 |
| **Total del progreso** | **100 %** | |

## 6. Comportamiento esperado (MVP)

1. **Vista de semestre:** ocho tarjetas con materia, código, créditos, estado de progreso y nota/proyección si existe. Resumen ponderado por créditos que distinga "completo" de "parcial".
2. **Vista de materia:** tres paneles (P1, P2, P3), cada uno con sus evaluaciones y pesos precargados desde JSON. Campo de nota 0–10 o vacío, visualización de promedio del progreso, aporte al total de la materia y peso aún pendiente.
3. **Simulaciones:** meta de materia configurable, cálculo de la misma nota necesaria en las evaluaciones pendientes; manejo explícito de "meta ya alcanzada", "meta alcanzable" y "meta imposible aun obteniendo 10".
4. **Persistencia local:** guardar cada nota sin necesidad de una cuenta; exportar/importar un respaldo JSON con fechas y versión de esquema. Al importar, validar datos y advertir antes de reemplazar notas actuales.
5. **Edición de ponderaciones:** pesos oficiales precargados e inmutables por defecto. Si un docente cambia el esquema, permitir crear una **configuración personalizada local** sin alterar el JSON original, comprobando 100 % en cada progreso.
6. **Usabilidad:** diseño en español, responsive para móvil y escritorio; formularios numéricos, navegación por teclado, estados vacíos y errores visibles. No confundir el peso de la actividad en su progreso con el peso efectivo en la nota final.

## 7. Cálculos y ejemplos que deben pasar pruebas

### Ejemplo: Diagnóstico por Imagen I, progreso 1

Con notas `8.00`, `9.00` y `7.00` en actividades de `35 %`, `30 %`, `35 %`:

```text
P1 = 8 × 0.35 + 9 × 0.30 + 7 × 0.35 = 7.95
Aporte de P1 a la materia = 7.95 × 0.25 = 1.9875 puntos (visualizar 1.99)
```

### Ejemplo: nota necesaria

Si P1 = 8.00, P2 = 7.00, la meta es 7.00 y falta P3 completo:

```text
P3_requerido = (7.00 - 8.00 × 0.25 - 7.00 × 0.35) / 0.40
             = 6.375 → 6.38 (si se admiten dos decimales)
```

### Pruebas automatizadas obligatorias

- Son exactamente 8 materias, 3 progresos por materia y 20.00 créditos totales.
- El total de actividades de **cada uno de los 24 progresos** suma exactamente 100 %.
- Cada actividad tiene `id` único **dentro de su progreso** y peso estrictamente positivo.
- No se permite nota menor que 0, mayor que 10, `NaN`, `Infinity` ni texto no numérico; vacío es "pendiente".
- La nota de una actividad impacta solo su progreso y su materia, y el promedio de semestre cambia en proporción a créditos.
- Un progreso incompleto no aparece como una nota definitiva; el usuario puede distinguir **aporte acumulado** y **promedio parcial entre lo evaluado**.
- Proyecciones imposibles (>10), ya conseguidas (≤0 requeridos), todas notas completas y ningún dato introducido se representan correctamente.
- No redondear intermedios: la prueba `6.375 -> 6.38` debe pasar para notas expresadas en centésimas.
- Exportar/importar y recargar la aplicación conserva íntegramente las notas y sus identificadores.

## 8. Arquitectura recomendada para Codex

**Camino más eficiente para un MVP en móvil y computadora:** aplicación web local con **TypeScript + React + Vite**, catálogo JSON importado, persistencia en `localStorage` (o IndexedDB si se amplía) y pruebas con **Vitest**. No requiere Rust, backend ni base de datos remota. Puede evolucionar a **PWA** para instalación y acceso sin conexión; si más adelante se desea escritorio nativo, evaluar **Tauri + Rust** sin rehacer el catálogo ni la lógica de cálculos.

Organizar el proyecto separando:

```text
src/grades/       # funciones puras de cálculo, validación, simulación
src/data/         # catálogo oficial importado desde JSON
src/components/   # interfaz
src/storage/      # persistencia, exportación/importación
tests/            # pruebas de datos y de cálculos
```

**No usar IA para resolver o producir actividades evaluadas.** La aplicación sirve exclusivamente para organización de calificaciones y cálculos. Varios sílabos restringen expresamente el uso de IA en las evaluaciones sumativas.

## 9. Decisiones que el usuario podrá confirmar más adelante

- Nota mínima oficial para aprobar y cualquier regla de redondeo normativa (por ahora, meta libre editable).
- Si la prioridad es instalarse en Android, abrirse desde navegador, distribuirse como `.exe` o funcionar como PWA; el MVP web cubre el uso multiplataforma con menos trabajo.
- Si se necesita un registro para **otros semestres** o únicamente el período `202710`.
- Si los docentes cambiaron actividades/porcentajes respecto de los sílabos cargados.

## 10. Prompt inicial para Codex

> Lee `ESPECIFICACION_CALCULADORA.md`, `evaluaciones_5to_semestre.json` y `AGENTS.md` antes de modificar archivos. Primero valida automáticamente los pesos de los 24 progresos y crea pruebas para los cálculos. Después construye un MVP web responsive en TypeScript + React + Vite, sin servidor, que registre notas pendientes, calcule promedios y metas y persista datos localmente. No alteres ni inventes porcentajes del catálogo. Muéstrame un plan breve, implementa por etapas y ejecuta las pruebas al terminar.

