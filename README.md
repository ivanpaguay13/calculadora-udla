# Mis notas · Medicina

Calculadora personal del quinto semestre de Medicina UDLA, período `202710`.
Incluye ocho materias, 103 evaluaciones, tres progresos y 20.00 créditos.

## Usar la calculadora en la web

### [Abrir Calculadora UDLA](https://ivanpaguay13.github.io/calculadora-udla/)

Abre el enlace desde el navegador de tu celular o computadora. Para usarla,
solo necesitas un navegador compatible con WebAssembly; no tienes que instalar
Rust, Node.js ni descargar el proyecto. Tampoco necesitas una cuenta.

1. Selecciona una materia en el resumen del semestre.
2. Introduce las calificaciones que ya tienes, de **0 a 10**, con hasta dos
   decimales. Puedes escribir **8,25** o **8.25**, también desde el teclado de
   un iPhone. Deja vacías las actividades pendientes; registra `0` solo cuando
   esa sea tu calificación real.
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
- Colores personalizables: cuatro paletas, color principal y acento propios.

En **Respaldos y ajustes → Colores de la aplicación** puedes elegir verde,
azul, lavanda o terracota, o seleccionar tus propios colores. Los cambios se
ven al instante y se conservan al volver a abrir la aplicación. El texto se
ajusta al fondo para mantenerlo legible; puedes restaurar los colores originales
con un botón. La opción funciona en Android y en la web.

La apariencia se guarda por dispositivo, separada de las notas, y no se incluye
en los respaldos JSON. Cambiar colores o restaurarlos conserva las calificaciones.

## Aplicación Android (APK personal)

El proyecto incluye una app Android en `android/` que empaqueta la misma
interfaz, el catálogo y el motor Rust/WebAssembly. Los recursos se cargan
localmente con [WebViewAssetLoader](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content):
funciona sin conexión desde el primer inicio, sin servidor ni cuenta.
Requiere Android 8 o posterior y **Android System WebView actualizado**.

Las notas se guardan dentro de la app, separadas de las del navegador.
Para trasladarlas, exporta un respaldo JSON desde la web e impórtalo en
**Respaldos y ajustes** de la app. La exportación Android abre el selector del
sistema para elegir dónde guardar el JSON. No requiere permisos generales
de almacenamiento. Desinstalar la app o borrar sus datos elimina las notas;
exporta antes un respaldo.

### Obtener el APK desde GitHub

Después de subir estos archivos al repositorio:

1. Abre **Actions → Generar APK personal → Run workflow**, o sube un cambio a `main`.
2. Espera a que terminen las pruebas y la compilación.
3. Descarga **mis-notas-apk-debug** en **Artifacts** de esa ejecución
   (necesitas iniciar sesión en GitHub; el archivo se conserva 30 días).
4. Descomprime el ZIP, lleva `app-debug.apk` a tu teléfono y ábrelo.
   Android te pedirá permitir instalaciones desde la aplicación que lo abre.

Es un APK de depuración para uso personal. El flujo no publica una Release
ni lo distribuye en Google Play. Tampoco incluye notas personales.

**Firma para futuras actualizaciones:** Android exige la misma firma para
actualizar una app conservando sus datos. Sin configuración adicional, cada
ejecución de GitHub genera una clave de depuración distinta y el APK siguiente
puede requerir desinstalar el anterior. Para evitarlo, crea una clave local
una sola vez, usando un archivo que todavía no exista:

```sh
keytool -genkeypair -keystore mis-notas-debug.keystore -storepass android \
  -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 \
  -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
base64 -w 0 mis-notas-debug.keystore
```

Guarda la salida Base64 como secreto **ANDROID_DEBUG_KEYSTORE_BASE64** en
**Settings → Secrets and variables → Actions** antes de generar el primer APK
que vayas a utilizar. Conserva una copia privada de la clave; los archivos
`*.keystore` y `*.jks` están excluidos de Git. Esta firma sigue siendo de
depuración y se usa únicamente para esta distribución personal.

### Compilar Android en tu equipo

Además de Rust, el objetivo WASM y Node.js, instala **JDK 17**, **Gradle 8.11.1**
y el SDK de Android con plataforma 35 y Build Tools 35.0.0. Configura
`ANDROID_HOME` o `android/local.properties` con la ruta del SDK.

```sh
npm ci
npm run android:prepare
npm run test:android
gradle -p android assembleDebug lintDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.
Ejecuta de nuevo `npm run android:prepare` después de cambiar la web o de
limpiar la compilación Android. Los recursos generados no se versionan.
Antes de confiar tus notas a la app, comprueba en tu teléfono que una nota
persiste al cerrar y abrir, que inicia en modo avión y que puedes exportar e
importar un respaldo. La preparación de recursos y el puente de exportación
tienen pruebas automatizadas; estas no sustituyen la comprobación en Android.

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
La compilación web y las pruebas de integración WebAssembly pasaron:
el motor WASM produce los mismos resultados que Rust nativo y libera sus
asignaciones de memoria incluso después de rechazar datos inválidos. También
se comprobaron las pruebas de Rust y persistencia, los tipos de TypeScript,
rustfmt y Clippy. Las pruebas de entrada cubren coma y punto decimal, escritura
por pasos, notas pendientes y conservación de la última nota válida ante errores.

El flujo de GitHub Actions instala el objetivo WASM antes de compilar y
comprobar la integración. La instalación como PWA y las actualizaciones sin
conexión deben comprobarse en los navegadores que utilicen los estudiantes.

## Licencia

El código del proyecto se distribuye bajo la **GNU Affero General Public License,
versión 3 (AGPL-3.0-only)**. Consulta el texto completo en [LICENSE](LICENSE).
Las dependencias mantienen sus respectivas licencias. Los nombres de materias
y los datos transcritos de los sílabos no implican titularidad sobre documentos
o marcas de la universidad.
