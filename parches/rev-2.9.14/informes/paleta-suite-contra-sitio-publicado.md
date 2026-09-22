# Informe de paleta: suite (rev 2.9.14) contra el sitio publicado

Consulta del sitio: https://emdelpacifico.netlify.app · 19-sep-2026, 19:32 (hora local, UTC-7), que es `Date: Sun, 20 Sep 2026 02:32:45 GMT` en la respuesta HTTP 200 (ETag `"962040e5da4adfd8f57fa67708ce4493-ssl"`).
Estado de la suite comparado: copia de trabajo de `index.html` tomada el 19-sep-2026 a las 19:32 (sha256 `c5c35ad00bb45686…`, REV 2.9.14). Al terminar (19:54) se volvió a leer el archivo real (solo lectura; para entonces ya se había editado otras veces): su :root, PDF_MARCA/PDF_SENAL, los arreglos de color de los PDF y los colores de XLSX_STYLES eran idénticos a los de la copia.
**No se cambió nada** en la suite, en `pruebas.mjs` ni en ningún documento. Este informe es solo lectura.

---

## 1. Conclusión (una línea por color)

**Grafito: DERIVADO. Arcilla: NO.**

- **Grafito (rampa `--gr-1..--gr-9` y superficies translúcidas): DERIVADO del sitio, no idéntico.** Ninguno de los 9 pasos coincide bit a bit con un token `:root` del sitio, pero los 9 caen sobre el mismo eje azul-acero de sus neutros (h* 264–270° frente a 259–271° del sitio), 7 de los 9 están a ΔE00 ≤ 3 de un token `:root` y ninguno pasa de ΔE00 6.5 (`--gr-8`). El sitio llama "acero" a esa familia; no existe un token "grafito". Las superficies translúcidas usan la misma técnica del sitio (blanco a baja opacidad): de sus 28 valores rgba, 6 son idénticos a valores del sitio y 22 son derivados (el mismo color, o una base de acero equivalente, con otra opacidad); ninguno queda fuera de la familia del sitio.
- **Arcilla (`--marca #C8643F`, `--marca-2 #A4502F`, `--marca-claro #F2DDCE`; identidad de PDF y Excel): NO está en el sitio.** Ninguno de los tres valores aparece en el sitio publicado, ni como token ni como literal, en ninguna de sus 6 páginas. El más cercano es el naranja de señal `--senal #F0561D` (ΔE00 7.9 para `#C8643F`): mismo matiz (HSL 16.2° contra 16.2°; LCH h* 46.4° contra 46.6°) pero con 35 % menos croma, es decir una versión atenuada y no una variante de luminosidad. La marca del sitio es azul (`--marca #1F4FD8`, ΔE00 47.2 respecto de la arcilla). Según la propia REV_NOTA de la suite (rev 2.9.12), la arcilla entró con el rediseño "como Claude", no con el sitio.

Reportado sin cambiar nada, como pidió el dueño.

Hallazgos adicionales que el dueño debe conocer (detalle en las secciones 6, 9, 11 y 12):

1. **El sitio actual no usa el índigo `#312E65` ni ningún valor cercano.** Su `--marca` hoy es azul `#1F4FD8`; `#312E65` (y los otros dos índigos del respaldo) no aparecen en ninguna de las 6 páginas del sitio. El comentario del respaldo 2.9.11 decía que su :root era "copiado literal" del sitio, pero hoy solo 11 de las 32 variables de color del sitio coinciden con ese :root (cambian `--acero-0..3`, `--papel*`, `--tinta*`, `--marca*`, `--plano`, `--p-el` y `--linea-*`, y el sitio agregó 5 variables). O el sitio cambió después de esa copia o la copia nunca fue literal en esos tokens; con una sola consulta y sin archivo histórico (sección 13) no se puede distinguir cuál.
2. **Los neutros de los PDF y del Excel no son los del sitio.** Son neutros cálidos (crema y café-carbón, h* 65–100°) de la rev 2.9.12; los neutros del sitio son fríos (h* 259–272°). En pantalla la suite es grafito frío (derivado del sitio); en los documentos es crema/arcilla (fuera del sitio): dos familias de color distintas. Los únicos colores de los documentos que sí están en el sitio son `#F0561D` (señal), `#FFFFFF` y `#000000`.
3. **Colisión de nombres:** la suite usa `--marca`, `--marca-2` y `--marca-claro` con valores de arcilla; el sitio usa esos mismos nombres con azules. Quien "vuelva a copiar el :root del sitio" (como pedía el comentario antiguo de la suite) pisaría la arcilla en pantalla.
4. **`--p-el`:** el valor de la suite (`#D7A8FF`) es idéntico al `--p-bt` del sitio; el `--p-el` del sitio hoy vale `#A96BFF` (igual que su `--p-mt`). Solo se reporta; `--p-el` no se toca por regla.

---

## 2. Método y evidencia

### 2.1 Obtención del sitio
- `WebFetch` a la URL devolvió solo texto limpio (sin `<style>` ni `<link>`), inservible para extraer colores. Se descargó entonces el HTML servido con `curl` (GET, `--ssl-no-revoke` porque el comprobador de revocación de Windows fallaba con CRYPT_E_NO_REVOCATION_CHECK; el certificado sí se validó): 190426 bytes, sha256 `2ddcbd73b4db1fbc…`, HTTP 200.
- **No hay hojas de estilo enlazadas.** Los únicos recursos son fuentes `woff2` (`fonts/plex-*.woff2`), `favicon.svg`, `apple-touch-icon.png`, `manifest.webmanifest` y un script de Netlify. Todo el CSS está en un único `<style>` (líneas 97–750 del HTML servido) más atributos SVG en línea. También se leyeron `favicon.svg` (colores `#171D26`, `#7A93BD`, `#AFC0DC`, `#F0561D`) y `manifest.webmanifest` (`background_color` y `theme_color` `#111417`; el HTML declara `<meta name="theme-color" content="#111417">`).
- Se descargaron y compararon las otras cinco páginas del mismo despliegue (`electromecanica-del-pacifico-en/fr/de/zh.html` y `aviso-de-privacidad.html`): las cinco llevan el mismo :root (comparación de texto sin espacios) y no agregan ningún color fuera de la paleta extraída (comprobado con un `assert` en `compone_informe.py`).
- `https://emdelpacifico.com/` (el dominio canónico que declara el HTML) responde con una página genérica "EMP Instalaciones is coming soon" (fondo `#222222`) sin paleta de marca; por eso la referencia es el sitio de Netlify que indicó el dueño.
- Archivos guardados en `paleta/sitio/`: `index_sitio.html`, `headers.txt`, `fecha_consulta.txt`, `favicon.svg`, `manifest.webmanifest` y las otras páginas (`x_*.html`).

### 2.2 Criterios de clasificación (CIELAB D65, distancia ΔE 2000)
- **IDÉNTICO:** mismo `#RRGGBB` que algún color del sitio (se indica si es token `:root` o literal de CSS/SVG). Para rgba: mismo rgb y mismo alfa.
- **DERIVADO:** no idéntico, pero existe un color del sitio con el mismo tono y otra luminosidad: |Δh*| ≤ 10° y |ΔC*| ≤ 10 (cromáticos); |Δh*| ≤ 15° y |ΔC*| ≤ 5 (neutros con C* < 15). Blanco y negro puros no cuentan como "origen" de un derivado. Para rgba: mismo rgb con otro alfa, o base equivalente (mismo matiz, ΔE00 ≤ 8).
- **NO ESTÁ EN EL SITIO:** todo lo demás. Cuando hay un color del mismo matiz pero con croma distinto se dice explícitamente (no cuenta como derivado porque no es "otra luminosidad").
- La implementación de ΔE00 se validó contra los vectores de referencia de Sharma, Wu y Dalal (2005): los cinco ensayados coinciden a 4 decimales.
- Referencia de ΔE00: ≤ 1 imperceptible; 1–2 perceptible solo con comparación directa; 2–10 perceptible a simple vista; > 10 colores distintos.

### 2.3 Citas del CSS del sitio (HTML servido, consulta del 19-sep-2026)
`:root` completo (líneas 106–119):
```css
:root{
  --acero-0:#0B0D10; --acero-1:#111417; --acero-2:#191E24; --acero-3:#2A3038;
  --papel:#F6F7F9; --papel-2:#E5E8EC; --blanco:#FFFFFF;
  --tinta:#111417; --tinta-2:#4B5563; --tinta-3:#6B7480;
  --claro:#E5E8EC; --claro-2:#A8B0BA;
  --marca:#1F4FD8; --marca-2:#17399E; --marca-claro:#9FB6FF;
  --senal:#F0561D; --plano:#A8B0BA;
  --azul-claro:#7B9BFF; --azul-suave:#E3E9FB; --azul-fondo:#16357F;
  --p-fire:#F0561D; --p-cw:#5B85FF; --p-air:#F2C230; --p-vac:#9AA4B0;
  --p-pot:#3FD1B0; --p-san:#FFFFFF; --p-plu:#7CC8F7;
  --p-mt:#A96BFF; --p-bt:#D7A8FF; --p-el:#A96BFF;
  --linea-d:rgba(255,255,255,.20); --linea-l:rgba(17,20,23,.13);
```
Uso de la marca azul y de la señal naranja (líneas 132, 153 y 188):
```css
:focus-visible{outline:3px solid var(--senal);outline-offset:3px}
.btn-marca{background:var(--marca);color:#fff}
.iso .pipe-fire{stroke:var(--senal);stroke-width:1.5}
```
Superficies translúcidas, el único desenfoque del sitio y el único negro translúcido (líneas 139, 381, 710, 711 y la regla `.iso .fgl,.iso .fgr`):
```css
.nav.solid{background:rgba(23,29,38,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);...}
.field input,...{border:1px solid rgba(122,147,189,.4);background:rgba(255,255,255,.04);color:#fff;...}
.s-disc .tipos ul li{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.22);color:#fff}
.iso-disc{...background:rgba(122,128,136,.16);border:1px solid rgba(255,255,255,.10);...}
.iso .fgl,.iso .fgr{fill:#000;fill-opacity:.4}
```
Favicon: `<rect ... fill="#171D26"/>` con trazo `#7A93BD`, relleno `#AFC0DC` y una franja `#F0561D`. Solo hay dos apariciones de `backdrop-filter` en todo el CSS (la estándar y la `-webkit-`, ambas en la barra fija).

### 2.4 Lo que dice la suite sobre el origen de la arcilla (REV_NOTA, `index.html`)
> Rev 2.9.12 (rediseno "como Claude", decision del dueno 19-sep-2026, pantalla y documentos). COLOR: la suite pasa de tema oscuro (fondo acero casi negro, marca indigo #312E65) a tema CLARO calido: fondo crema #F7F5EF, superficies blancas, tinta cafe-carbon #3A3529, acento arcilla #C8643F.

Y el comentario del :root de la rev 2.9.13: "NO SE TOCAN, a propósito: --senal y los colores de capa … ni --marca, --marca-2 y --marca-claro, que son la identidad de los PDF y del Excel."

---

## 3. Paleta del sitio (todo color hallado)
66 valores distintos en la página principal, el favicon y el manifest (las otras 5 páginas no agregan ninguno); 24 son valores de tokens `:root` (30 tokens de color con hex, más `--linea-d` y `--linea-l` en rgba). `#333333` solo aparece dentro de `@media print`.

| Valor | Dónde vive en el sitio | L* | C* | h* | Usos |
|---|---|---:|---:|---:|---:|
| `#0B0D10` | --acero-0 (:root) | 3.6 | 1.6 | 268 | 3 |
| `#111417` | --acero-1 / --tinta (:root) | 6.2 | 2.4 | 259 | 14 |
| `#191E24` | --acero-2 (:root) | 11.0 | 4.9 | 264 | 2 |
| `#2A3038` | --acero-3 (:root) | 19.6 | 6.0 | 266 | 5 |
| `#F6F7F9` | --papel (:root) | 97.2 | 1.1 | 271 | 2 |
| `#E5E8EC` | --papel-2 / --claro (:root) | 91.9 | 2.3 | 263 | 4 |
| `#FFFFFF` | --blanco / --p-san (:root) | 100.0 | 0.0 | n/a | 57 |
| `#4B5563` | --tinta-2 (:root) | 35.8 | 9.4 | 267 | 6 |
| `#6B7480` | --tinta-3 (:root) | 48.5 | 7.8 | 265 | 2 |
| `#A8B0BA` | --claro-2 / --plano (:root) | 71.5 | 6.1 | 262 | 11 |
| `#1F4FD8` | --marca (:root) | 39.3 | 82.5 | 296 | 2 |
| `#17399E` | --marca-2 (:root) | 28.3 | 64.3 | 296 | 2 |
| `#9FB6FF` | --marca-claro (:root) | 74.9 | 39.7 | 284 | 2 |
| `#F0561D` | --senal / --p-fire (:root) | 57.3 | 82.9 | 47 | 36 |
| `#7B9BFF` | --azul-claro (:root) | 65.6 | 55.6 | 287 | 2 |
| `#E3E9FB` | --azul-suave (:root) | 92.4 | 9.5 | 278 | 2 |
| `#16357F` | --azul-fondo (:root) | 24.5 | 48.6 | 292 | 2 |
| `#5B85FF` | --p-cw (:root) | 58.2 | 69.1 | 290 | 9 |
| `#F2C230` | --p-air (:root) | 80.6 | 73.6 | 87 | 3 |
| `#9AA4B0` | --p-vac (:root) | 66.9 | 7.5 | 262 | 20 |
| `#3FD1B0` | --p-pot (:root) | 75.9 | 46.3 | 173 | 2 |
| `#7CC8F7` | --p-plu (:root) | 77.5 | 32.3 | 250 | 2 |
| `#A96BFF` | --p-mt / --p-el (:root) | 58.2 | 84.3 | 310 | 12 |
| `#D7A8FF` | --p-bt (:root) | 75.9 | 49.4 | 312 | 3 |
| `#F5F7FA` | literal de HTML/SVG en linea | 97.2 | 1.7 | 266 | 21 |
| `#98A6BA` | literal de HTML/SVG en linea | 67.6 | 11.9 | 267 | 29 |
| `#EDEFF2` | literal de HTML/SVG en linea | 94.4 | 1.7 | 266 | 5 |
| `#7A93BD` | literal de HTML/SVG en linea/favicon.svg | 60.5 | 24.7 | 274 | 2 |
| `#FFB3A3` | literal de HTML/SVG en linea | 79.7 | 32.1 | 37 | 2 |
| `#B9E4C9` | literal de HTML/SVG en linea | 87.0 | 21.0 | 156 | 1 |
| `#2A323E` | literal de CSS | 20.5 | 8.7 | 270 | 2 |
| `#222A35` | literal de CSS | 16.8 | 8.2 | 268 | 2 |
| `#1D242E` | literal de CSS | 13.9 | 7.6 | 269 | 2 |
| `#1A2029` | literal de CSS | 12.0 | 6.9 | 270 | 1 |
| `#161B23` | literal de CSS | 9.6 | 6.3 | 271 | 1 |
| `#242C37` | literal de CSS | 17.7 | 8.2 | 268 | 1 |
| `#2D3644` | literal de CSS | 22.3 | 9.9 | 271 | 3 |
| `#1F2732` | literal de CSS | 15.3 | 8.3 | 269 | 2 |
| `#3A4556` | literal de CSS | 29.0 | 11.6 | 271 | 2 |
| `#303947` | literal de CSS | 23.7 | 9.8 | 271 | 2 |
| `#29313D` | literal de CSS | 20.1 | 8.7 | 270 | 2 |
| `#3F4A5C` | literal de CSS | 31.2 | 12.0 | 272 | 2 |
| `#36404F` | literal de CSS | 26.8 | 10.4 | 270 | 2 |
| `#AFC0DC` | literal de CSS/favicon.svg | 77.3 | 15.9 | 270 | 9 |
| `#DCE5F5` | literal de CSS | 90.7 | 8.8 | 270 | 3 |
| `#171D26` | literal de CSS/favicon.svg | 10.6 | 7.0 | 270 | 5 |
| `#8FD0C8` | literal de CSS | 79.1 | 22.4 | 187 | 2 |
| `#6FA7E6` | literal de CSS | 67.1 | 37.3 | 269 | 3 |
| `#F0C24A` | literal de CSS | 80.5 | 64.1 | 86 | 3 |
| `#F4F6F9` | literal de CSS | 96.8 | 1.7 | 266 | 5 |
| `#A7B1C2` | literal de CSS | 71.9 | 9.8 | 270 | 2 |
| `#1C222C` | literal de CSS | 13.1 | 7.5 | 272 | 2 |
| `#252D39` | literal de CSS | 18.2 | 8.8 | 270 | 1 |
| `#B4BDCB` | literal de CSS | 76.3 | 8.1 | 268 | 1 |
| `#8C97A8` | literal de CSS | 62.1 | 10.2 | 268 | 1 |
| `#FF6A33` | literal de CSS | 63.2 | 78.7 | 47 | 1 |
| `#FFF0C4` | literal de CSS | 95.0 | 23.2 | 94 | 1 |
| `#15191F` | literal de CSS | 8.6 | 4.8 | 269 | 2 |
| `#20262D` | literal de CSS | 14.9 | 5.5 | 263 | 1 |
| `#1F252D` | literal de CSS | 14.4 | 6.2 | 267 | 2 |
| `#262E38` | literal de CSS | 18.6 | 7.5 | 265 | 1 |
| `#1E252F` | literal de CSS | 14.4 | 7.6 | 269 | 1 |
| `#1A2129` | literal de CSS | 12.4 | 6.4 | 264 | 2 |
| `#283039` | literal de CSS | 19.5 | 6.9 | 262 | 1 |
| `#000000` | literal de CSS | 0.0 | 0.0 | n/a | 3 |
| `#333333` | literal de CSS (solo en @media print) | 21.2 | 0.0 | n/a | 1 |

Sobre esta tabla: los neutros del sitio forman una sola familia fría (h* 259–272°, C* 1–12) desde `#0B0D10` hasta `#F6F7F9`; los cromáticos son el azul de marca (h* 296°), la señal naranja `#F0561D` / `#FF6A33` (h* 47°), el amarillo de aire, el turquesa de potable y los lilas de media y baja tensión. **No hay ningún color terracota, tierra, arcilla ni café** (lo más parecido a "tierra" son `#FFB3A3`, un salmón claro del mensaje de error del formulario, y los ámbares `#F0C24A`/`#F2C230` de las capas eléctrica y de aire).

---

## 4. Grafito

| Paso | Valor | L* | C* | h* | Token :root del sitio más cercano (ΔE00) | Color más cercano en todo el sitio (ΔE00) | Clase |
|---|---|---:|---:|---:|---|---|---|
| `--gr-1` | `#0D0F12` | 4.3 | 1.8 | 268 | `#0B0D10` --acero-0 (0.4) | `#0B0D10` token (0.4) | **DERIVADO** |
| `--gr-2` | `#13161A` | 7.1 | 3.3 | 266 | `#111417` --acero-1/--tinta (1.0) | `#111417` token (1.0) | **DERIVADO** |
| `--gr-3` | `#1A1D22` | 10.7 | 3.9 | 270 | `#191E24` --acero-2 (1.1) | `#191E24` token (1.1) | **DERIVADO** |
| `--gr-4` | `#23272D` | 15.5 | 4.5 | 268 | `#191E24` --acero-2 (2.9) | `#20262D` literal (1.1) | **DERIVADO** |
| `--gr-5` | `#313740` | 22.8 | 6.4 | 268 | `#2A3038` --acero-3 (2.3) | `#2A3038` token (2.3) | **DERIVADO** |
| `--gr-6` | `#5A626D` | 41.2 | 7.3 | 266 | `#4B5563` --tinta-2 (5.0) | `#4B5563` token (5.0) | **DERIVADO** |
| `--gr-7` | `#A5ADB8` | 70.4 | 6.6 | 265 | `#A8B0BA` --claro-2/--plano (1.0) | `#A8B0BA` token (1.0) | **DERIVADO** |
| `--gr-8` | `#C2C8D0` | 80.4 | 4.7 | 264 | `#A8B0BA` --claro-2/--plano (6.5) | `#B4BDCB` literal (3.9) | **DERIVADO** |
| `--gr-9` | `#EEF0F3` | 94.7 | 1.7 | 266 | `#F6F7F9` --papel (1.6) | `#EDEFF2` literal (0.2) | **DERIVADO** |

Lectura:
- Sobre el eje de matiz no hay diferencia: los 9 pasos tienen h* entre 264° y 270° y saturación HSL entre 10 % y 17 %; los neutros `:root` del sitio tienen h* entre 259° y 271° y saturación HSL entre 9 % y 20 %.
- Los tres pasos más oscuros (`--gr-1..--gr-3`) y `--gr-7` están a ΔE00 ≤ 1.1 de `--acero-0`, `--acero-1`, `--acero-2` y `--claro-2`/`--plano` (no distinguibles a simple vista). `--gr-1 #0D0F12` es exactamente el `--acero-0` que la suite copió del sitio antes de la rev 2.9.12 (sección 11); hoy el sitio dice `#0B0D10`.
- `--gr-6` (ΔE00 5.0 de `--tinta-2`) y `--gr-8` (6.5 de `--claro-2`) son pasos de luminosidad intermedia que la escala del sitio no tiene; `--gr-8` sí queda a 3.9 de un literal de ilustración del sitio (`#B4BDCB`).
- `--gr-9 #EEF0F3` está a ΔE00 0.2 de `#EDEFF2` (literal del SVG del sitio, un nivel por canal) y a 1.6 del token `--papel`.
- En rigor: la rampa es una escala propia de 9 pasos construida sobre la familia "acero" del sitio, no una copia de sus tokens. Por eso la etiqueta correcta es DERIVADO y no IDÉNTICO.
- Nombres: la suite reasigna las variables del sitio a la rampa (por ejemplo `--tinta` vale `#EEF0F3` en la suite y `#111417` en el sitio, porque la suite es toda oscura y el sitio usa tinta oscura sobre `--papel` claro). Por nombre los valores no coinciden (sección 7); por color, sí (sección 6).

---

## 5. Arcilla

| Color de la suite | L* | C* | h* (LCH) | h (HSL) | 1.º más cercano en el sitio | 2.º | 3.º | Clase |
|---|---:|---:|---:|---:|---|---|---|---|
| `#C8643F` --marca (PDF_MARCA, Excel) | 53.8 | 53.6 | 46 | 16.2 | `#F0561D` --senal/--p-fire (ΔE00 7.9) | `#FF6A33` literal (ΔE00 10.6) | `#FFB3A3` literal (ΔE00 22.6) | **NO ESTÁ** |
| `#A4502F` --marca-2 | 44.0 | 47.5 | 47 | 16.9 | `#F0561D` --senal/--p-fire (ΔE00 16.1) | `#FF6A33` literal (ΔE00 20.3) | `#6B7480` --tinta-3 (ΔE00 29.9) | **NO ESTÁ** |
| `#F2DDCE` --marca-claro | 89.4 | 11.1 | 64 | 25.0 | `#F6F7F9` --papel (ΔE00 11.5) | `#FFFFFF` --blanco/--p-san (ΔE00 11.5) | `#EDEFF2` literal (ΔE00 11.5) | **NO ESTÁ** |
| `#F0561D` --senal (referencia del sitio) | 57.3 | 82.9 | 47 | 16.2 | (es un color del sitio) | | | **IDÉNTICO** |

Lectura:
- Ni `#C8643F`, ni `#A4502F`, ni `#F2DDCE` existen en el sitio. La distancia al color más cercano es ΔE00 7.9, 16.1 y 11.5 respectivamente: colores distintos a simple vista.
- `#C8643F` comparte matiz con la señal (HSL 16.2° y 16.2°; LCH h* 46.4° y 46.6°) y tiene casi la misma luminosidad (L* 53.8 contra 57.3), pero su croma es 53.6 contra 82.9 (−35 %). Es una versión "apagada" de la señal, no una variante de luminosidad; por eso queda como NO ESTÁ y no como DERIVADO. `#A4502F` es la misma familia, más oscura (L* 44.0). `#F2DDCE` es un crema rosado (C* 11, h* 64°) sin equivalente: los claros del sitio son grises fríos o azules.
- Los tres nombres (`--marca`, `--marca-2`, `--marca-claro`) sí existen en el sitio, con valores azules `#1F4FD8`, `#17399E` y `#9FB6FF`. Distancias respecto de la arcilla: ΔE00 47.2, 44.0 y 30.5.
- El propio historial de la suite atribuye la arcilla al rediseño "como Claude" (sección 2.4), no al sitio.
- Si el dueño quisiera que la identidad de los documentos salga de la paleta del sitio, los dos candidatos reales son `--marca #1F4FD8` (el token de marca del sitio) o `--senal #F0561D` (que ya es el acento de los documentos). Es decisión suya; no se cambió nada.

---

## 6. Todos los tokens de color del :root de la suite, agrupados por valor
26 valores distintos (incluye el respaldo `@supports` de `--card`): 10 idénticos, 12 derivados, 4 no están (`#C8643F`, `#A4502F`, `#F2DDCE` y `#FF8A5C`).

| Valor | Variables de la suite que lo llevan | Clase | Más cercano en el sitio (cualquiera) | ΔE00 | ΔL* | ΔC* | Δh° | Token :root más cercano (ΔE00) |
|---|---|---|---|---:|---:|---:|---:|---|
| `#0D0F12` | `--gr-1`, `--acero-0`, `--bg`, `--sobre-accion` | **DERIVADO** | `#0B0D10` = --acero-0 (:root) | 0.4 | 0.7 | 0.2 | 0 | `#0B0D10` --acero-0 (0.4) |
| `#13161A` | `--gr-2`, `--acero-1`, `--bg2` | **DERIVADO** | `#111417` = --acero-1 / --tinta (:root) | 1.0 | 1.0 | 0.8 | 7 | `#111417` --acero-1/--tinta (1.0) |
| `#1A1D22` | `--gr-3`, `--acero-2`, `--capsula` | **DERIVADO** | `#191E24` = --acero-2 (:root) | 1.1 | −0.4 | −1.0 | 6 | `#191E24` --acero-2 (1.1) |
| `#23272D` | `--gr-4`, `--acero-3`, `--card2`, `--panel2` | **DERIVADO** | `#20262D` = literal de CSS | 1.1 | 0.6 | −1.0 | 5 | `#191E24` --acero-2 (2.9) |
| `#313740` | `--gr-5`, `--navy` | **DERIVADO** | `#2A3038` = --acero-3 (:root) | 2.3 | 3.2 | 0.5 | 3 | `#2A3038` --acero-3 (2.3) |
| `#5A626D` | `--gr-6`, `--azul-hondo` | **DERIVADO** | `#4B5563` = --tinta-2 (:root) | 5.0 | 5.5 | −2.1 | 1 | `#4B5563` --tinta-2 (5.0) |
| `#A5ADB8` | `--gr-7`, `--papel-2`, `--tinta-3`, `--cota`, `--plata` | **DERIVADO** | `#A8B0BA` = --claro-2 / --plano (:root) | 1.0 | −1.1 | 0.5 | 2 | `#A8B0BA` --claro-2/--plano (1.0) |
| `#C2C8D0` | `--gr-8`, `--papel`, `--tinta-2`, `--claro-2`, `--p-hepa`, `--muted`, `--orange`, `--ok` | **DERIVADO** | `#B4BDCB` = literal de CSS | 3.9 | 4.0 | −3.4 | 4 | `#A8B0BA` --claro-2/--plano (6.5) |
| `#EEF0F3` | `--gr-9`, `--blanco`, `--tinta`, `--claro`, `--fg`, `--text`, `--orange-soft`, `--warn` | **DERIVADO** | `#EDEFF2` = literal de HTML/SVG en linea | 0.2 | 0.3 | −0.0 | 0 | `#F6F7F9` --papel (1.6) |
| `#C8643F` | `--marca` | **NO ESTÁ** | `#F0561D` = --senal / --p-fire (:root) | 7.9 | −3.6 | −29.3 | 0 | `#F0561D` --senal/--p-fire (7.9) |
| `#A4502F` | `--marca-2` | **NO ESTÁ** | `#F0561D` = --senal / --p-fire (:root) | 16.1 | −13.3 | −35.4 | 1 | `#F0561D` --senal/--p-fire (16.1) |
| `#F2DDCE` | `--marca-claro` | **NO ESTÁ** | `#F6F7F9` = --papel (:root) | 11.5 | −7.8 | 10.0 | 153 | `#F6F7F9` --papel (11.5) |
| `#F0561D` | `--senal`, `--p-fire`, `--accion`, `--alerta` | **IDÉNTICO** | `#F0561D` = --senal / --p-fire (:root) | 0.0 | 0 | 0 | 0 | `#F0561D` --senal/--p-fire (0.0) |
| `#86AEEF` | `--plano`, `--azul`, `--dato` | **DERIVADO** | `#6FA7E6` = literal de CSS | 4.2 | 3.5 | −0.5 | 6 | `#9FB6FF` --marca-claro (5.0) |
| `#93A2B5` | `--p-hvac-2` | **DERIVADO** | `#98A6BA` = literal de HTML/SVG en linea | 1.5 | −1.6 | −0.3 | 3 | `#9AA4B0` --p-vac (3.0) |
| `#4B5563` | `--p-hvac` | **IDÉNTICO** | `#4B5563` = --tinta-2 (:root) | 0.0 | 0 | 0 | 0 | `#4B5563` --tinta-2 (0.0) |
| `#5B85FF` | `--p-cw` | **IDÉNTICO** | `#5B85FF` = --p-cw (:root) | 0.0 | 0 | 0 | 0 | `#5B85FF` --p-cw (0.0) |
| `#D7A8FF` | `--p-el` | **IDÉNTICO** | `#D7A8FF` = --p-bt (:root) | 0.0 | 0 | 0 | 0 | `#D7A8FF` --p-bt (0.0) |
| `#F2C230` | `--p-air` | **IDÉNTICO** | `#F2C230` = --p-air (:root) | 0.0 | 0 | 0 | 0 | `#F2C230` --p-air (0.0) |
| `#A96BFF` | `--p-mt` | **IDÉNTICO** | `#A96BFF` = --p-mt / --p-el (:root) | 0.0 | 0 | 0 | 0 | `#A96BFF` --p-mt/--p-el (0.0) |
| `#3FD1B0` | `--p-pot` | **IDÉNTICO** | `#3FD1B0` = --p-pot (:root) | 0.0 | 0 | 0 | 0 | `#3FD1B0` --p-pot (0.0) |
| `#7CC8F7` | `--p-plu` | **IDÉNTICO** | `#7CC8F7` = --p-plu (:root) | 0.0 | 0 | 0 | 0 | `#7CC8F7` --p-plu (0.0) |
| `#9AA4B0` | `--p-vac` | **IDÉNTICO** | `#9AA4B0` = --p-vac (:root) | 0.0 | 0 | 0 | 0 | `#9AA4B0` --p-vac (0.0) |
| `#FFFFFF` | `--p-drain` | **IDÉNTICO** | `#FFFFFF` = --blanco / --p-san (:root) | 0.0 | 0 | 0 | 0 | `#FFFFFF` --blanco/--p-san (0.0) |
| `#1B1E23` | `--card` | **DERIVADO** | `#191E24` = --acero-2 (:root) | 1.1 | 0.1 | −1.0 | 6 | `#191E24` --acero-2 (1.1) |
| `#FF8A5C` | `--accion-txt`, `--alerta-txt`, `--bad` | **NO ESTÁ** | `#FF6A33` = literal de CSS | 6.9 | 6.4 | −18.8 | 1 | `#F0561D` --senal/--p-fire (11.7) |

Notas:
- `#FF8A5C` (`--accion-txt`, `--alerta-txt`, `--bad`: el texto del naranja crítico) es la señal aclarada y atenuada (mismo matiz que `#FF6A33` del sitio, croma −19): tampoco está en el sitio.
- `#86AEEF` (`--plano`, `--azul`, `--dato`) es DERIVADO del azul de ilustración `#6FA7E6` (ΔE00 4.2, Δh 6°), pero no es el `--plano` del sitio, que hoy vale `#A8B0BA` (ΔE00 14.6). El comentario de la suite ("cifras en azul de plano… es la regla del sitio") apuntaba al `--plano #7A93BD` de la copia antigua; ese valor sigue en el sitio como trazo del favicon y de una trama SVG (y como `rgba(122,147,189,·)` en cuadrículas y bordes), pero ya no es el token `--plano` (ΔE00 9.4 respecto de `#86AEEF`).
- `--p-hvac #4B5563` es idéntico a `--tinta-2` del sitio (el sitio no tiene un token de capa para el ducto).

---

## 7. Comparación por nombre de variable (token contra token)
De las 30 variables de color con valor hex que declara el sitio: 8 tienen el mismo valor en la suite, 17 tienen otro valor y 5 no existen en la suite. Las dos variables en rgba (`--linea-d`, `--linea-l`) tampoco coinciden.

| Variable | Sitio publicado (hoy) | Suite (copia 2.9.14) | ¿Mismo valor? | ΔE00 |
|---|---|---|---|---:|
| `--acero-0` | `#0B0D10` | `#0D0F12` (vía `var(--gr-1)`) | no | 0.4 |
| `--acero-1` | `#111417` | `#13161A` (vía `var(--gr-2)`) | no | 1.0 |
| `--acero-2` | `#191E24` | `#1A1D22` (vía `var(--gr-3)`) | no | 1.1 |
| `--acero-3` | `#2A3038` | `#23272D` (vía `var(--gr-4)`) | no | 3.0 |
| `--papel` | `#F6F7F9` | `#C2C8D0` (vía `var(--gr-8)`) | no | 11.2 |
| `--papel-2` | `#E5E8EC` | `#A5ADB8` (vía `var(--gr-7)`) | no | 15.1 |
| `--blanco` | `#FFFFFF` | `#EEF0F3` (vía `var(--gr-9)`) | no | 3.5 |
| `--tinta` | `#111417` | `#EEF0F3` (vía `var(--gr-9)`) | no | 88.5 |
| `--tinta-2` | `#4B5563` | `#C2C8D0` (vía `var(--gr-8)`) | no | 40.5 |
| `--tinta-3` | `#6B7480` | `#A5ADB8` (vía `var(--gr-7)`) | no | 19.5 |
| `--claro` | `#E5E8EC` | `#EEF0F3` (vía `var(--gr-9)`) | no | 1.8 |
| `--claro-2` | `#A8B0BA` | `#C2C8D0` (vía `var(--gr-8)`) | no | 6.5 |
| `--marca` | `#1F4FD8` | `#C8643F` | no | 47.2 |
| `--marca-2` | `#17399E` | `#A4502F` | no | 44.0 |
| `--marca-claro` | `#9FB6FF` | `#F2DDCE` | no | 30.5 |
| `--senal` | `#F0561D` | `#F0561D` | SÍ | 0.0 |
| `--plano` | `#A8B0BA` | `#86AEEF` | no | 14.6 |
| `--azul-claro` | `#7B9BFF` | (no existe en la suite) | — | — |
| `--azul-suave` | `#E3E9FB` | (no existe en la suite) | — | — |
| `--azul-fondo` | `#16357F` | (no existe en la suite) | — | — |
| `--p-fire` | `#F0561D` | `#F0561D` (vía `var(--senal)`) | SÍ | 0.0 |
| `--p-cw` | `#5B85FF` | `#5B85FF` | SÍ | 0.0 |
| `--p-air` | `#F2C230` | `#F2C230` | SÍ | 0.0 |
| `--p-vac` | `#9AA4B0` | `#9AA4B0` | SÍ | 0.0 |
| `--p-pot` | `#3FD1B0` | `#3FD1B0` | SÍ | 0.0 |
| `--p-san` | `#FFFFFF` | (no existe en la suite) | — | — |
| `--p-plu` | `#7CC8F7` | `#7CC8F7` | SÍ | 0.0 |
| `--p-mt` | `#A96BFF` | `#A96BFF` | SÍ | 0.0 |
| `--p-bt` | `#D7A8FF` | (no existe en la suite) | — | — |
| `--p-el` | `#A96BFF` | `#D7A8FF` | no | 16.8 |
| `--linea-d` | `rgba(255,255,255,.20)` | `rgba(255,255,255,.10)` | no (mismo rgb base, otro alfa) | — |
| `--linea-l` | `rgba(17,20,23,.13)` | `rgba(255,255,255,.06)` | no | — |

Las 8 variables que coinciden son la señal y las capas medidas del isométrico (`--senal`, `--p-fire`, `--p-cw`, `--p-air`, `--p-vac`, `--p-pot`, `--p-plu`, `--p-mt`). Todo lo demás cambia de valor por diseño (tema oscuro de la suite) o por diferencia de identidad (`--marca*`).

---

## 8. Superficies translúcidas (rgba)
52 usos, 28 valores distintos (CSS y JS de la suite): 6 idénticos, 22 derivados, 0 no están. Referencia del sitio: blanco a alfa 0.024, 0.04, 0.055, 0.06, 0.07, 0.1, 0.2, 0.22, 0.28, 0.5, 0.55, 0.6, 0.82, 0.85, 0.88; negro solo a .4 y solo como relleno SVG.

| Valor en la suite | Usos (CSS+JS) | Clase | Comparación con el sitio |
|---|---:|---|---|
| `rgba(0,0,0,0.35)` | 2 | **DERIVADO** | negro a otra opacidad; el sitio solo lo usa como relleno SVG a .4 (fill-opacity), no como sombra ni velo |
| `rgba(0,0,0,0.4)` | 1 | **IDÉNTICO** | negro a 0.4: el sitio lo usa solo como relleno SVG (fill:#000;fill-opacity:0.4), no como sombra ni velo |
| `rgba(0,0,0,0.45)` | 1 | **DERIVADO** | negro a otra opacidad; el sitio solo lo usa como relleno SVG a .4 (fill-opacity), no como sombra ni velo |
| `rgba(0,0,0,0.5)` | 1 | **DERIVADO** | negro a otra opacidad; el sitio solo lo usa como relleno SVG a .4 (fill-opacity), no como sombra ni velo |
| `rgba(0,0,0,0.6)` | 2 | **DERIVADO** | negro a otra opacidad; el sitio solo lo usa como relleno SVG a .4 (fill-opacity), no como sombra ni velo |
| `rgba(6,7,9,0.62)` | 1 | **DERIVADO** | base acero equivalente a la del sitio rgba(11,13,16,·) (ΔE00 de la base 1.2); el alfa es propio de la suite |
| `rgba(13,15,18,0.72)` | 1 | **DERIVADO** | base acero equivalente a la del sitio rgba(11,13,16,·) (ΔE00 de la base 0.4); el alfa es propio de la suite |
| `rgba(24,27,32,0.86)` | 1 | **DERIVADO** | base acero equivalente a la del sitio rgba(18,24,32,·) (ΔE00 de la base 2.3); el alfa es propio de la suite |
| `rgba(24,27,32,0.94)` | 1 | **DERIVADO** | base acero equivalente a la del sitio rgba(18,24,32,·) (ΔE00 de la base 2.3); el alfa es propio de la suite |
| `rgba(26,29,34,0.96)` | 1 | **DERIVADO** | base acero equivalente a la del sitio rgba(23,29,38,·) (ΔE00 de la base 2.5); el alfa es propio de la suite |
| `rgba(30,34,40,0.92)` | 1 | **DERIVADO** | base acero equivalente a la del sitio rgba(23,29,38,·) (ΔE00 de la base 2.5); el alfa es propio de la suite |
| `rgba(255,255,255,0.012)` | 1 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.024 (Δα=0.012) |
| `rgba(255,255,255,0.02)` | 1 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.024 (Δα=0.004) |
| `rgba(255,255,255,0.025)` | 1 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.024 (Δα=0.001) |
| `rgba(255,255,255,0.03)` | 2 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.024 (Δα=0.006) |
| `rgba(255,255,255,0.04)` | 5 | **IDÉNTICO** | rgba(255,255,255,0.04) presente en el sitio (2 usos) |
| `rgba(255,255,255,0.045)` | 2 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.04 (Δα=0.005) |
| `rgba(255,255,255,0.05)` | 4 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.055 (Δα=0.005) |
| `rgba(255,255,255,0.06)` | 7 | **IDÉNTICO** | rgba(255,255,255,0.06) presente en el sitio (2 usos) |
| `rgba(255,255,255,0.07)` | 2 | **IDÉNTICO** | rgba(255,255,255,0.07) presente en el sitio (2 usos) |
| `rgba(255,255,255,0.075)` | 1 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.07 (Δα=0.005) |
| `rgba(255,255,255,0.08)` | 2 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.07 (Δα=0.010) |
| `rgba(255,255,255,0.09)` | 4 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.1 (Δα=0.010) |
| `rgba(255,255,255,0.1)` | 2 | **IDÉNTICO** | rgba(255,255,255,0.1) presente en el sitio (62 usos) |
| `rgba(255,255,255,0.11)` | 1 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.1 (Δα=0.010) |
| `rgba(255,255,255,0.12)` | 1 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.1 (Δα=0.020) |
| `rgba(255,255,255,0.28)` | 2 | **IDÉNTICO** | rgba(255,255,255,0.28) presente en el sitio (5 usos) |
| `rgba(255,255,255,0.38)` | 1 | **DERIVADO** | blanco translúcido; alfa más cercano del sitio 0.28 (Δα=0.100) (el sitio usa rgba(122,147,189,.4), azul-gris, para el borde de campos) |

Lectura: la técnica "blanco a baja opacidad sobre acero" es del sitio (campos `.04`, rellenos `.06`, visores `.07`, filete `.10`). Las tarjetas de la suite usan `--card` `.045` y `--card2` `.075`, a media centésima de los valores del sitio; el borde `--border` `.10` y `--linea-l` `.06` sí son idénticos. Lo que **no** viene del sitio: (a) el vidrio de las tarjetas, menús y modales (`backdrop-filter:saturate(140%) blur(14px)`): el sitio solo desenfoca su barra fija (`blur(10px)`); (b) las sombras y velos de negro (`rgba(0,0,0,·)` a .35–.6): el sitio usa negro a .4 únicamente como relleno de un volumen SVG, nunca como sombra ni velo; (c) el borde de campo `.38`, donde el sitio usa un azul-gris (`rgba(122,147,189,.4)`).

---

## 9. PDF y Excel

| Documento | Constante / uso | Valor | Clase | Más cercano en el sitio | ΔE00 | Nota |
|---|---|---|---|---|---:|---|
| PDF | PDF_MARCA: membrete (banda superior de cada página), cabecera de tabla, encabezados y título de portada | `#C8643F` | **NO ESTÁ** | `#F0561D` = --senal / --p-fire (:root) | 7.9 |  |
| PDF | PDF_SENAL: línea de acento bajo el membrete, reglas y barrita de encabezado | `#F0561D` | **IDÉNTICO** | `#F0561D` = --senal / --p-fire (:root) | 0.0 |  |
| PDF | texto principal: valores y títulos de sección (tinta café-carbón) | `#3B3629` | **NO ESTÁ** | `#333333` = literal de CSS (solo en @media print) | 7.6 | neutro CÁLIDO (h* 92°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | texto secundario: subtítulos, etiquetas | `#6E6654` | **NO ESTÁ** | `#6B7480` = --tinta-3 (:root) | 17.2 | neutro CÁLIDO (h* 90°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | texto de párrafo: párrafos y sujeto de portada | `#4A4536` | **NO ESTÁ** | `#333333` = literal de CSS (solo en @media print) | 10.0 | neutro CÁLIDO (h* 94°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | etiqueta de fila: etiquetas en negritas de fichas | `#544C3D` | **NO ESTÁ** | `#333333` = literal de CSS (solo en @media print) | 11.9 | neutro CÁLIDO (h* 87°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | texto tenue: kicker, pie de página, "Revisado por" | `#7D7561` | **NO ESTÁ** | `#6B7480` = --tinta-3 (:root) | 17.2 | neutro CÁLIDO (h* 92°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | línea de firma: líneas de firma | `#8F8773` | **NO ESTÁ** | `#6B7480` = --tinta-3 (:root) | 18.7 | neutro CÁLIDO (h* 92°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | línea por defecto: regla fina por defecto | `#D6CFBF` | **NO ESTÁ** | `#FFF0C4` = literal de CSS | 11.2 | neutro CÁLIDO (h* 92°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | cebra: renglón alterno de tablas y fichas (crema) | `#F7F5EF` | **NO ESTÁ** | `#FFFFFF` = --blanco / --p-san (:root) | 3.6 | neutro CÁLIDO (h* 97°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | título sobre banda: título del documento sobre la banda de membrete | `#FAE8DB` | **NO ESTÁ** | `#FFFFFF` = --blanco / --p-san (:root) | 9.4 | neutro CÁLIDO (h* 65°); los neutros del sitio son fríos (h* 259–272°) |
| PDF | aviso: párrafos de aviso (disciplinas incompletas) | `#8C331A` | **NO ESTÁ** | `#F0561D` = --senal / --p-fire (:root) | 23.9 |  |
| PDF | blanco: texto sobre banda | `#FFFFFF` | **IDÉNTICO** | `#FFFFFF` = --blanco / --p-san (:root) | 0.0 |  |
| PDF | negro (defecto de texto): color por defecto de d.text | `#000000` | **IDÉNTICO** | `#000000` = literal de CSS | 0.0 |  |
| Excel | fuente base, sumas oscuras y fondo del total (tinta café-carbón) | `#3A3529` | **NO ESTÁ** | `#333333` = literal de CSS (solo en @media print) | 7.1 | neutro CÁLIDO (h* 91°); los neutros del sitio son fríos (h* 259–272°) |
| Excel | título de hoja, fondo de cabeceras (arcilla) | `#C8643F` | **NO ESTÁ** | `#F0561D` = --senal / --p-fire (:root) | 7.9 |  |
| Excel | notas (gris cálido) | `#6E6754` | **NO ESTÁ** | `#6B7480` = --tinta-3 (:root) | 17.5 | neutro CÁLIDO (h* 93°); los neutros del sitio son fríos (h* 259–272°) |
| Excel | texto sobre cabecera | `#FFFFFF` | **IDÉNTICO** | `#FFFFFF` = --blanco / --p-san (:root) | 0.0 |  |
| Excel | texto y fondo de la marca de señal | `#F0561D` | **IDÉNTICO** | `#F0561D` = --senal / --p-fire (:root) | 0.0 |  |
| Excel | fondo de subtotal (crema) | `#EFEAE0` | **NO ESTÁ** | `#FFFFFF` = --blanco / --p-san (:root) | 6.4 | neutro CÁLIDO (h* 90°); los neutros del sitio son fríos (h* 259–272°) |
| Excel | fondo de fila de énfasis (crema claro) | `#FBFAF6` | **NO ESTÁ** | `#FFFFFF` = --blanco / --p-san (:root) | 2.2 | neutro CÁLIDO (h* 100°); los neutros del sitio son fríos (h* 259–272°) |
| Excel | bordes de celda | `#E1DACB` | **NO ESTÁ** | `#E5E8EC` = --papel-2 / --claro (:root) | 9.8 | neutro CÁLIDO (h* 91°); los neutros del sitio son fríos (h* 259–272°) |

Lectura:
- Identidad del documento (`PDF_MARCA`, y en el Excel títulos y cabeceras): arcilla `#C8643F`, **NO está en el sitio**. Acento (`PDF_SENAL`, franja y reglas): `#F0561D`, **idéntico al `--senal` del sitio**.
- Los 9 neutros de los PDF (texto, líneas, cebra y título sobre la banda) y los 5 del Excel son neutros cálidos (crema y café-carbón, h* 65–100°); ninguno está en el sitio, cuyos neutros son fríos (h* 259–272°). Los que casi coinciden son los blancos: `#F7F5EF` y `#FBFAF6` a ΔE00 3.6 y 2.2 de `#FFFFFF`, pero son cremas (b* positivo), no el blanco del sitio. El `#8C331A` de los avisos (rojo pardo) tampoco está: el más cercano es la señal, a ΔE00 23.9.
- Los PDF y el Excel usan constantes propias (`PDF_MARCA`, `PDF_SENAL`, `XLSX_STYLES`), no leen el :root; por eso el grafito de pantalla no los afecta.
- Nota de mantenimiento menor: los comentarios de `pdfPortadaCasa` siguen hablando de "banda morada"/"morado de marca" (herencia del índigo de antes de la 2.9.12); el color real es arcilla.

---

## 10. Colores literales de JavaScript (gráficas de pantalla)

| Uso en el JS | Valor | Clase | Más cercano en el sitio | ΔE00 |
|---|---|---|---|---:|
| CLR.or / dato | `#86AEEF` | **DERIVADO** | `#6FA7E6` = literal de CSS | 4.2 |
| CLR.orS | `#B4CCF4` | **DERIVADO** | `#AFC0DC` = literal de CSS/favicon.svg | 4.5 |
| CLR.bl | `#5F86C9` | **DERIVADO** | `#5B85FF` = --p-cw (:root) | 5.8 |
| CLR.blD | `#456CAA` | **DERIVADO** | `#1F4FD8` = --marca (:root) | 10.7 |
| CLR.mut | `#A5ADB8` | **DERIVADO** | `#A8B0BA` = --claro-2 / --plano (:root) | 1.0 |
| CLR.pk | `#EEF0F3` | **DERIVADO** | `#EDEFF2` = literal de HTML/SVG en linea | 0.2 |
| CLR.alerta | `#F0561D` | **IDÉNTICO** | `#F0561D` = --senal / --p-fire (:root) | 0.0 |
| Composición del precio: Equipo | `#86AEEF` | **DERIVADO** | `#6FA7E6` = literal de CSS | 4.2 |
| … Instalación y aire | `#6F97DA` | **DERIVADO** | `#7B9BFF` = --azul-claro (:root) | 4.6 |
| … Indirectos | `#B9C0CA` | **DERIVADO** | `#B4BDCB` = literal de CSS | 1.9 |
| … Utilidad | `#8D96A3` | **DERIVADO** | `#8C97A8` = literal de CSS | 1.7 |
| … Contingencia | `#D3D8DF` | **DERIVADO** | `#E5E8EC` = --papel-2 / --claro (:root) | 3.9 |
| … IVA | `#EEF0F3` | **DERIVADO** | `#EDEFF2` = literal de HTML/SVG en linea | 0.2 |

Todos son DERIVADOS del azul de ilustración o de los neutros fríos del sitio, salvo `CLR.alerta #F0561D` (idéntico a la señal).

---

## 11. Deriva entre el :root "copiado literal" del respaldo y el sitio de hoy
Respaldo: `respaldo-rev-2.9.8/index-2.9.11-antes-de-rediseno-claude-20260919-033234.html`. Su comentario dice: "son el :root del sitio corporativo, copiado literal". Hoy coinciden 11 de 32 variables de color.

| Variable | :root que la suite declaraba "copiado literal del sitio" (respaldo 2.9.11) | :root del sitio consultado el 19-sep-2026 | ¿Coincide? |
|---|---|---|---|
| `--acero-0` | `#0D0F12` | `#0B0D10` | **NO** |
| `--acero-1` | `#0F1114` | `#111417` | **NO** |
| `--acero-2` | `#111417` | `#191E24` | **NO** |
| `--acero-3` | `#14171A` | `#2A3038` | **NO** |
| `--papel` | `#F1F3F6` | `#F6F7F9` | **NO** |
| `--papel-2` | `#E6E9EE` | `#E5E8EC` | **NO** |
| `--blanco` | `#FFFFFF` | `#FFFFFF` | sí |
| `--tinta` | `#121820` | `#111417` | **NO** |
| `--tinta-2` | `#48525F` | `#4B5563` | **NO** |
| `--tinta-3` | `#68727F` | `#6B7480` | **NO** |
| `--claro` | `#E5E8EC` | `#E5E8EC` | sí |
| `--claro-2` | `#A8B0BA` | `#A8B0BA` | sí |
| `--marca` | `#312E65` | `#1F4FD8` | **NO** |
| `--marca-2` | `#262352` | `#17399E` | **NO** |
| `--marca-claro` | `#C9C6E6` | `#9FB6FF` | **NO** |
| `--senal` | `#F0561D` | `#F0561D` | sí |
| `--plano` | `#7A93BD` | `#A8B0BA` | **NO** |
| `--azul-claro` | `(no estaba)` | `#7B9BFF` | **NO** |
| `--azul-suave` | `(no estaba)` | `#E3E9FB` | **NO** |
| `--azul-fondo` | `(no estaba)` | `#16357F` | **NO** |
| `--p-fire` | `#F0561D` | `#F0561D` | sí |
| `--p-cw` | `#5B85FF` | `#5B85FF` | sí |
| `--p-air` | `#F2C230` | `#F2C230` | sí |
| `--p-vac` | `#9AA4B0` | `#9AA4B0` | sí |
| `--p-pot` | `#3FD1B0` | `#3FD1B0` | sí |
| `--p-san` | `(no estaba)` | `#FFFFFF` | **NO** |
| `--p-plu` | `#7CC8F7` | `#7CC8F7` | sí |
| `--p-mt` | `#A96BFF` | `#A96BFF` | sí |
| `--p-bt` | `(no estaba)` | `#D7A8FF` | **NO** |
| `--p-el` | `#D7A8FF` | `#A96BFF` | **NO** |
| `--linea-d` | `rgba(255,255,255,.10)` | `rgba(255,255,255,.20)` | **NO** |
| `--linea-l` | `rgba(18,24,32,.16)` | `rgba(17,20,23,.13)` | **NO** |

Lectura:
- El sitio de hoy no contiene `#312E65`, `#262352` ni `#C9C6E6` (los índigos de `--marca*` del respaldo) en ninguna de sus 6 páginas, ni en el favicon ni en el manifest. Sus `--marca*` son azules vivos (`#1F4FD8`, `#17399E`, `#9FB6FF`).
- Cambiaron también `--acero-0..3` (el sitio de hoy es más claro en los pasos 2 y 3: `#191E24` y `#2A3038` contra `#111417` y `#14171A`), `--papel`, `--papel-2`, `--tinta*`, `--plano`, `--p-el` y `--linea-*`. `--blanco`, `--claro`, `--claro-2`, `--senal` y las capas `--p-cw`, `--p-air`, `--p-vac`, `--p-pot`, `--p-plu`, `--p-mt` sí coinciden (esas capas son las que la suite protege con la prueba 10.1). El sitio agregó `--azul-claro`, `--azul-suave`, `--azul-fondo`, `--p-san` y `--p-bt`.
- Esto explica por qué el grafito de la suite queda "derivado" y no idéntico: sus pasos oscuros conservan valores muy cercanos a los del sitio de entonces (`#0D0F12` = `--acero-0` antiguo), no a los de hoy.
- No hay forma de fechar el cambio con lo que existe: el respaldo no guarda fecha del sitio, el repositorio de la suite no contiene ninguna copia del HTML del sitio y no hay captura pública en el archivo web (la consulta CDX de `emdelpacifico.netlify.app` devolvió una lista vacía; la API de disponibilidad respondió 429).

---

## 12. Otras observaciones
1. **Variables del sitio que la suite no tiene:** `--azul-claro #7B9BFF`, `--azul-suave #E3E9FB`, `--azul-fondo #16357F`, `--p-san #FFFFFF`, `--p-bt #D7A8FF`.
2. **Azul de cifras:** el sitio pinta sus cifras grandes con `--marca` (`.disc .cod`, `.linea b`); la suite las pinta con `#86AEEF` (más claro, sección 6). Es una decisión de contraste sobre fondo oscuro, pero no es un token del sitio.
3. **Nombre `--orange` y afines:** en la suite ya no son naranja (el comentario lo dice); el naranja real es `--accion`/`--alerta` (= `--senal`, idéntico al sitio).
4. **Semáforo:** `--ok`, `--warn` y `--bad` resuelven a `#C2C8D0`, `#EEF0F3` y `#FF8A5C`; solo el último es cromático y no está en el sitio (sección 6).

---

## 13. Limitaciones
- Una sola consulta (19-sep-2026 19:32). No se pudo comprobar el estado anterior del sitio (sin archivo histórico y sin copia del HTML en el repositorio).
- Se midieron los valores declarados en el HTML/CSS/SVG servido; no se midieron píxeles renderizados y no se calculó la composición de las capas translúcidas sobre el fondo.
- ΔE00 se calculó en sRGB → CIELAB D65; los umbrales de "derivado" son de este informe (sección 2.2) y son discutibles en los bordes (por ejemplo `--gr-6` y `--gr-8` entran por matiz y croma aunque su luminosidad no tiene equivalente en el sitio).
- `WebFetch` devolvió solo texto; la evidencia de CSS sale de la descarga directa (`curl`) del mismo URL. No se envió ningún dato al sitio, solo solicitudes GET.
- El archivo real de la suite se estaba editando durante la consulta; la comparación es contra la copia de las 19:32 y se verificó al final que sus colores no habían cambiado.

---

## 14. Reproducción
Carpeta: `C:\Users\ASUS\AppData\Local\Temp\claude\C--Users-ASUS-Desktop-Emp-Suite\b4428ace-b83f-495d-86b6-f21ed3c3bbb8\scratchpad\w14\paleta\`
- `sitio\` instantáneas del sitio (HTML de las 6 páginas, favicon, manifest, cabeceras HTTP, fecha).
- `color.py` (sRGB, CIELAB, ΔE2000), `datos_paleta.py` (extracción y clasificación), `genera_tablas.py` (tablas), `plantilla_informe.md` + `compone_informe.py` (este informe y `tabla_suite_vs_sitio.csv`), `deriva_real.py` (comparación de solo lectura del archivo real contra la copia).
- Reproducir: `python compone_informe.py` desde esa carpeta (Python 3, sin dependencias).
