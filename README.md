# Mis notas · Medicina

Calculadora personal del quinto semestre de Medicina UDLA, período `202710`.
Incluye ocho materias, 103 evaluaciones, tres progresos y 20.00 créditos.

## Usar la calculadora en la web

### [Abrir Calculadora UDLA](https://ivanpaguay13.github.io/calculadora-udla/)

Abre el enlace desde el navegador de tu celular o computadora. Para usarla,
solo necesitas un navegador compatible con WebAssembly; no tienes que instalar
Rust, Node.js ni descargar el proyecto. Tampoco necesitas una cuenta.

1. Selecciona una materia en el resumen del semestre.
2. Introduce las calificaciones que ya tienes, de **0 a 10**. Deja vacías las
   actividades pendientes; registra `0` solo cuando esa sea tu calificación real.
3. Ajusta **Mi meta para esta materia** para ver qué necesitas obtener en las
   actividades restantes.
4. Revisa tus resultados por progreso, materia y semestre.
5. En **Respaldos y ajustes**, usa **Exportar respaldo** para guardar una copia
   de tus notas. Puedes recuperarla o trasladarla con **Importar respaldo**.

**Tus notas se guardan en ese navegador y dispositivo.** No se sincronizan
entre el celular y la computadora. Exporta un respaldo antes de borrar los
datos del sitio o cambiar de equipo.

Si tu docente cambia los porcentajes, usa **Ajustar ponderaciones** dentro de
la materia para crear una configuración local.

Puedes compartir el enlace web con tus compañeros: cada persona registra y
conserva sus propias notas. Después de una primera carga completa, la
calculadora puede funcionar sin conexión en navegadores compatibles. Si tu
navegador ofrece instalarla o añadirla a la pantalla de inicio, también puedes
abrirla desde allí.

## Funciones

- Resumen de semestre ponderado por créditos y detalle de cada materia.
- Registro en escala 0–10 con hasta dos decimales, pendiente como `null`.
- Aporte acumulado, promedio de lo evaluado, máximo alcanzable y nota definitiva.
- Meta editable por materia y nota uniforme necesaria en las pendientes.
- Guardado local por cada cambio válido; errores visibles si no puede guardarse.
- Exportación e importación JSON con versión, fecha y validación completa.
- Confirmación antes de reemplazar notas mediante una importación.
- Ponderaciones personalizadas locales, siempre con 100 % por progreso.
- Diseño adaptable, etiquetas accesibles, teclado y campos numéricos.
- Caché sin conexión y manifiesto PWA. La instalación depende del navegador.

La meta inicial `7.00` es personal y editable: no confirma el umbral institucional.
Un resultado incompleto nunca se presenta como definitivo. El promedio de lo
evaluado normaliza los pesos que tienen nota; el semestral incluye los créditos.
El acumulado cuenta solo los puntos registrados y las pendientes aportan cero
únicamente a ese indicador. El máximo supone 10 en todas las pendientes.

## Datos y uso sin conexión

Las notas pertenecen al navegador y al origen donde se abrió la aplicación.
No se sincronizan entre dispositivos. Exporta un respaldo antes de borrar datos
del sitio, usar navegación privada, cambiar de dominio o trasladarte de equipo.
El respaldo guarda notas, `null`, metas, pesos locales y sus identificadores.
No almacenes información personal en el catálogo.

Si el almacenamiento está corrupto, no se reemplaza automáticamente: se ofrece
descargar el contenido original y continuar temporalmente. Si otra pestaña
cambia las notas, la pestaña actual pasa a modo temporal para evitar sobrescribirlas.
Si no se puede guardar por falta de espacio, el cambio se rechaza con un aviso;
puedes exportar lo guardado y activar el modo temporal en ajustes.

El service worker almacena solo los archivos de la aplicación y el catálogo.
Tras una primera carga completa, puede funcionar sin conexión en navegadores
compatibles y mediante HTTPS o localhost. Una actualización ofrece un botón
para recargar; no borra las notas. Nunca publiques notas personales en `public/`.

## Desarrollo local

El motor de cálculo y la validación están escritos en **Rust**, compilados a
**WebAssembly**. La interfaz usa TypeScript, HTML y CSS, sin dependencias de
ejecución ni servidor de datos. Se publica como un sitio estático.

Esta sección es para ejecutar o modificar el proyecto en tu equipo. Para
registrar tus notas, utiliza el [enlace web](https://ivanpaguay13.github.io/calculadora-udla/).

### Requisitos de desarrollo

- Rust estable instalado con rustup.
- Node.js 22 y npm.
- Acceso a Internet para descargar las herramientas y dependencias iniciales.

```sh
rustup target add wasm32-unknown-unknown
npm ci
npm test
npm run dev
```

Abre `http://127.0.0.1:4173`. El comando compila Rust y TypeScript antes de
iniciar el servidor local; después de editar el código, vuelve a ejecutarlo.
No abras `index.html` directamente: WebAssembly necesita servirse por HTTP.

```sh
npm run build       # Genera dist/ con Rust WASM y la interfaz
npm run preview     # Sirve una compilación existente
npm run test:wasm   # Compara WASM con Rust nativo y comprueba el puente de memoria
```

## Estructura

```text
crates/grades/   Motor Rust, validación y pruebas; reutilizable en Tauri
src/grades/     Puente WebAssembly, sin duplicar fórmulas en JavaScript
src/storage/    Persistencia y respaldos
src/components/ Controles DOM accesibles
src/main.ts     Vistas y navegación por fragmentos
public/         HTML, CSS e icono
scripts/        Compilación, caché sin conexión y servidor de desarrollo
tests/          Persistencia e integración WASM contra Rust nativo
instrucciones/  Requisitos y catálogo original, fuente única de verdad
```

Se eligió una interfaz TypeScript sin framework para mantener el MVP pequeño y
reducir dependencias; la separación del motor permite cambiar la interfaz después.
La compilación copia el catálogo original directamente a `dist/catalog.json` y
Rust lo incluye desde ese mismo archivo. No hay una segunda copia editable.

## Precisión

Las notas se convierten desde texto a centésimas, los porcentajes a centésimas de
porcentaje y los créditos a centésimas. Las sumas y productos usan enteros de
64 bits. Los cocientes se conservan como numerador y denominador hasta la
presentación. La nota necesaria redondea hacia arriba a centésimas; los demás
resultados usan redondeo convencional a dos decimales exclusivamente al mostrar.
Las pruebas incluyen `7.95`, el aporte exacto `1.9875` y `6.375 → 6.38`.

El puente WASM usa una ABI síncrona mínima con JSON: asignar, evaluar y liberar.
Rust es dueño de los buffers, TypeScript copia la respuesta antes de liberarlos.
No requiere wasm-bindgen ni wasm-pack. El catálogo y los datos importados son
validados por el mismo motor que calcula los resultados.

## GitHub y publicación automática

La calculadora está publicada en
[GitHub Pages](https://ivanpaguay13.github.io/calculadora-udla/).
El código fuente está en
[ivanpaguay13/calculadora-udla](https://github.com/ivanpaguay13/calculadora-udla).

El flujo de GitHub Actions en [`pages.yml`](.github/workflows/pages.yml)
ejecuta las pruebas, construye el sitio y lo publica con cada cambio subido a
`main`. Las solicitudes de cambio ejecutan las mismas comprobaciones sin publicar.

Los recursos usan rutas relativas para funcionar en el subdirectorio del
repositorio. Para publicar una copia del proyecto en otro repositorio,
selecciona **GitHub Actions** en **Settings → Pages → Build and deployment**.
Las notas de los usuarios permanecen en sus navegadores; no se suben al repositorio.

## Comprobaciones

```sh
cargo test --locked
cargo fmt --all -- --check
cargo clippy --locked --all-targets -- -D warnings
npm run check
npm run test:web
npm run build
npm run test:wasm
```

Los PDF fuente no estaban incluidos en el repositorio inicial. Se conserva el
catálogo proporcionado sin alterar porcentajes, créditos o actividades; las
referencias de página permiten contrastarlo cuando se disponga de los sílabos.

### Estado del proyecto

Primera versión funcional, con uso local confirmado por el usuario. El
objetivo `wasm32-unknown-unknown` ya está instalado en el entorno de desarrollo.
La compilación web y las dos pruebas de integración WebAssembly pasaron:
el motor WASM produce los mismos resultados que Rust nativo y libera sus
asignaciones de memoria incluso después de rechazar datos inválidos. También
se comprobaron previamente 11 pruebas de Rust, 6 de persistencia, los tipos de
TypeScript, rustfmt y Clippy.

El flujo de GitHub Actions instala el objetivo WASM antes de compilar y
comprobar la integración. La instalación como PWA y las actualizaciones sin
conexión deben comprobarse en los navegadores que utilicen los estudiantes.

## Licencia

El código del proyecto se distribuye bajo la **GNU Affero General Public License,
versión 3 (AGPL-3.0-only)**. Consulta el texto completo en [LICENSE](LICENSE).
Las dependencias mantienen sus respectivas licencias. Los nombres de materias
y los datos transcritos de los sílabos no implican titularidad sobre documentos
o marcas de la universidad.
