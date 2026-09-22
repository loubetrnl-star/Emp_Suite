# comparar15.mjs · comparador de estados de los 15 motores

Regla permanente del dueño: **ningún número de los motores ni de las cotizaciones puede moverse** entre una
revisión y otra. Este script carga dos archivos `index.html` de SuiteEmp en jsdom, les aplica **exactamente
los mismos 46 escenarios**, serializa toda la salida numérica de los motores y la compara con **igualdad
exacta** (`Object.is` en números, cero tolerancia; un solo ulp de diferencia se detecta).

No edita ningún archivo, no usa red y no genera PDF. Sólo lee.

## Cómo correrlo

Requiere Node 20 o más y `jsdom`. El script lo busca solo, en este orden: `JSDOM_DIR=<carpeta con node_modules>`,
la carpeta del script y la de arriba, la carpeta de trabajo, `C:\Users\ASUS\Desktop\Emp_Suite` y la carpeta
`tests2` del arnés. Si no lo encuentra, dice cuál variable fijar.

```powershell
# desde cualquier carpeta; base = rev 2.9.12 (antes del ciclo actual), nuevo = el index.html de trabajo
node comparar15.mjs "C:\Users\ASUS\Desktop\Emp_Suite\respaldo-rev-2.9.8\index-2.9.12-antes-de-barra-acciones-20260919-040903.html" "C:\Users\ASUS\Desktop\Emp_Suite\index.html"

# al terminar la revisión, con el informe a un archivo y la comparación de código
node comparar15.mjs <base.html> <nuevo.html> --codigo --json=resultado.json > informe.txt
```

Tarda unos 50 segundos con 4 hilos (46 escenarios × 2 versiones × 2 modos = 184 cargas). Con `--hilos=1` corre
en un solo hilo y es más fácil de depurar.

### Opciones

| opción | qué hace |
|---|---|
| `--escenarios=a,b` | sólo esos escenarios; cada nombre es un id exacto o un prefijo (`sys-` corre los cuatro `sys-*`) |
| `--lista` | imprime los escenarios y sale |
| `--sin-guardado` | omite el modo «guardado» y la comprobación de ida y vuelta (la mitad del tiempo) |
| `--sin-xlsx` | omite los libros de Excel de la propuesta |
| `--sin-pdf` | omite los PDF (memorias, cotizaciones, propuesta y licitación) |
| `--hilos=N` | hilos de trabajo (por omisión `min(4, núcleos-1)`) |
| `--max=N` | diferencias que se imprimen por celda (por omisión 5) |
| `--max-familias=N` | grupos de diferencias que se imprimen (por omisión 60) |
| `--ver-texto` | en el detalle por celda también imprime las diferencias de texto |
| `--json=ruta` | vuelca todo el resultado (hasta 400 diferencias por celda) |
| `--ignorar-texto` | las diferencias que sólo son de texto no cuentan para el código de salida |
| `--codigo[=regex]` | además compara el código de los dos archivos (ver abajo) |
| `--solo-codigo` | únicamente la comparación de código, sin cargar nada en jsdom (1 segundo) |
| `--con-css` | deja el CSS al cargar (por omisión se quita: no afecta ningún cálculo y acorta cada carga) |
| `--autoprueba <nuevo.html>` | comprueba el propio comparador: ver «Autoprueba» |

### Código de salida

| código | significa |
|---|---|
| **0** | cero diferencias |
| **1** | alguna diferencia numérica o estructural (una hoja que existe sólo en un lado cuenta), o un escenario que falla en una sola de las dos versiones |
| **2** | cero diferencias numéricas; sólo cambió texto |
| **3** | error de ejecución en las dos versiones |

## Qué compara

Por escenario, después de `recompute()` con `S.tab = "tablero"` (las mismas condiciones en los dos archivos):

- **load**: `LOADS`, `totals()` · **clean**: `CLEAN` · **equip**: `SYS` · **duct**: `DUCT` · **vent**: `VENT`
- **quote**: `QUOTE` y `catalogoConceptos()` completo (secciones, partidas, subtotales)
- **valor**: `VALOR` de `recompute` y el que sale de llamar `computeIngValor()` explícitamente
- **kaizen**: `KAIZEN` de `recompute` y el que sale de llamar `computeKaizen()` explícitamente
- **elec, hidro, fuego, aire, civil, soporte**: `ELEC`, `HIDRO`, `FUEGO`, `AIRE`, `CIVIL`, `SOPORTE` (y las filas de propuesta eléctrica)
- **estr**: externo (StructCalc, archivo aparte): sale «no aplica» (`-`); se comprueba que sigue declarado `externo`
- **cotizacionDeMotor(mot)** de cada uno de los 15 motores, con sus partidas (cuelga de la fila de cada motor)
- **estado** de cada motor: la porción de `S` que lo alimenta, ya con la herencia aplicada por `recompute`
- **valid**: `VALID` (la validación cruzada, que no es un motor)
- **xlsx es / xlsx en**: los libros de la propuesta (`buildPropuestaXlsx`, español en pesos e inglés en USD): cada celda
  numérica y cada fórmula, hoja por hoja. Si una celda cambia de lugar pero el conjunto de valores de la hoja es el
  mismo, se marca `r` (reubicada, maquetación) y no cuenta como número movido
- **pdf (números)** (rev 2.9.15): cada PDF que emite la suite —memoria y cotización de cada motor (`MOTOR_ACC`),
  memoria integral, memoria general, cédula de equipos, propuesta en español y en inglés, y licitación—. La suite
  escribe sus PDF sin comprimir, así que el texto se lee del archivo (operador `Tj`). Se comparan los **números en
  orden**, con igualdad exacta de su escritura: un número movido o redondeado distinto cuenta como diferencia
  numérica, con su contexto. Antes se quita el pie «Página i de n» (un texto corregido puede recorrer la paginación
  sin mover un cálculo) y se normaliza la marca de revisión. El texto que cambia sin números se muestra como
  diferencia de texto (primer renglón que cambió) y no cuenta como número movido
- **semáforo (info)**: `semaforoSuite()`. Es informativo: no cuenta para el código de salida

### Cómo se vuelve estable y comparable

- Claves ordenadas; funciones y `undefined` fuera; ciclos marcados.
- `Math.random` determinista y `Date` congelada en las dos ventanas. Los ids que la aplicación fabrica con
  `Math.random` (`"s"+…`, `"c"+…`, `"h"+…`) se registran y se reemplazan por `<rnd>` en textos y claves.
- El número de revisión de cada archivo (`2.9.12`, `2.9.14`) se reemplaza por `<REV>` dentro de los textos: es lo
  único que se espera que cambie (la memoria de la casa guarda la revisión en cada desviación). Se informa cuántas veces.
- Una función que no existe en una de las versiones (`typeof`) no rompe nada: esa parte se marca «no existe» y sale de la
  comparación en las dos.

### Clases de diferencia (con ruta y ambos valores)

`numerica` (dos números distintos) · `cero-con-signo` (`0` contra `-0`) · `tipo` (número contra texto, etc.) ·
`solo-base` / `solo-nuevo` (una hoja que sólo existe en un lado) · `texto` · en Excel también `formula` y `reubicado`.
Cuentan como numéricas/estructurales todas menos `texto` y `reubicado`.

## Los dos modos y los controles

1. **nativo**: cada archivo arma el escenario con sus propias funciones de arranque (`defaultZone`, `defaultCarga`…).
   Prueba también que los valores de arranque no se movieron.
2. **guardado**: la **base** guarda el proyecto (`projSave`) y **los dos** lo abren (`projOpen`). Es lo que le pasa a un
   usuario al actualizar la suite: un proyecto guardado con la versión anterior, sin los campos nuevos, debe abrir sin
   error y dar los mismos números.
3. **ida y vuelta**: en un mismo archivo, armar el escenario contra reabrir el proyecto que él mismo guardó. Sirve para
   probar que el modo «guardado» de verdad cargó el proyecto (si los dos abrieran un proyecto vacío todo «empataría») y
   que guardar y abrir no mueve un número. Una diferencia que aparece igual en las dos versiones es propia del escenario
   (p. ej. la memoria de la casa vive en `localStorage`, no en el proyecto; un proyecto sin zonas recibe una zona al
   abrirse; reabrir reinicia el cuarto limpio seleccionado). Sólo cuenta lo que aparece **sólo en la nueva**.
4. **cobertura**: el informe imprime, por escenario, lo que de verdad calcula (arquitectura elegida, TR, tramos, FFU,
   kVA, L/s, rociadores, HP, directo, partidas, civil, soporte, oportunidades de Kaizen, tecnología por zona) para que se
   vea que ningún escenario «empata» por estar vacío.

### Autoprueba

`node comparar15.mjs --autoprueba <nuevo.html>` comprueba al comparador mismo, en tres pasos:
1. el archivo nuevo contra sí mismo, en 14 escenarios (debe dar cero diferencias: prueba que la carga es determinista);
2. una copia con un precio movido (`ductKg` 165→166) y un coeficiente de accesorio (0.28→0.29): debe detectarlos;
3. una copia con `iva` 0.16→0.16000000000000003 (un solo ulp): debe detectarlo (cero tolerancia de verdad).

## Los 46 escenarios

Vacío recién abierto · proyecto de prueba del arnés · **lleno** (4 zonas con producción, oficinas, sala limpia ISO 7 y
site; 6 cargas eléctricas de los 6 tipos; muebles y tramos hidráulicos; 3 consumos de aire; 5 tramos de ducto con
accesorios; 3 cuartos limpios; partidas de 4 familias del catálogo) · lleno con todos los cruces sin autorizar · con
cruces parciales · zonas con `oaFixed` y `lightType: fluorescent` · `sysForce` = chiller, vrf, rooftop, split ·
`forceTech` = VRF, DX_split, paquete, chiller_fancoil, AHU, PTAC · envolvente con otros muros/techos/vidrios ·
`peakScan` false · diversidad 0.8 · cotización en USD · sin partidas de equipo · plaza y sitio Mexicali · plaza «otra»
con factor manual · sitio personalizado · licitación con base CMIC e IVA 8 % · ductos con los 15 accesorios, métodos y
candados · soportería sísmica sobre viga de acero, sin sísmico con metros capturados y sobre losa f'c 300 · obra civil con
demolición y con geometría manual · ventilación en modo cocina, industrial, persiana y reposición · cuartos limpios ISO 5–8 ·
instalaciones en variantes (440 V aluminio, hidráulica privada, fuego extra 1 con red, aire ISO 1.2.1 inox N+1) · todas las
propuestas aceptadas · todas «capturo lo mío» · campos heredables capturados a mano · ingeniería de valor con una medida
aceptada y otra descartada · Kaizen con mejoras en las cuatro etapas del PDCA · unidades imperiales · sin zonas.

`--lista` los imprime con su id. Dos de ellos son **sólo de la versión nueva** (`barra-calcular-todos`,
`barra-calcular-vacio`): usan `accCalcular`, que la base no tiene. La base corre la variante sin el botón y la nueva
pulsa Calcular en cada motor; deben dar los mismos números. Se reportan aparte, en «escenarios que sólo existen en la
versión nueva». Para agregar otro, se declara con `esc(id, titulo, build, { requiere: "nombreDeFuncion", buildBase })`.

### Cómo agregar un escenario

En `comparar15.mjs`, junto a los demás `esc(...)`:

```js
esc("mi-caso", "Descripción corta", (c) => {
  llenar(c);                       // proyecto lleno; o parte de cero
  const S = c.S();                 // estado vivo de ESA ventana
  S.quote.currency = "USD";        // …lo que haga falta; c.G("expr") evalúa en la ventana
});
```

El escenario se aplica igual a los dos archivos. No hay que llamar `recompute()`: lo hace el recolector.

## Cómo investigar una diferencia (sin corregirla)

1. El informe agrupa las diferencias por `(fila, modo, ruta con [*], clase)` y da un ejemplo con ambos valores; el detalle
   por escenario y motor lista las primeras `--max` rutas exactas.
2. Con `--escenarios=<id>` se repite sólo ese caso en segundos; con `--hilos=1` se depura.
3. Con `--codigo` se compara el texto de las **funciones y constantes de primer nivel** de los dos archivos, sin
   comentarios ni espacios: lista las cambiadas con las diferencias por tramos (`«…»` marca lo que cambió), las añadidas y
   las quitadas, y para cada cosa quitada con nombre dice si otra sentencia la usaba («código muerto, quitarlo no mueve
   nada» o «REFERENCIADO por …»). `--codigo=regex` cambia qué nombres se consideran «de cálculo»; el resto se lista sólo por nombre.
4. `--json=ruta` guarda todo para revisarlo con calma.

## Resultado de referencia (19-sep-2026)

Base: `index-2.9.12-antes-de-barra-acciones-20260919-040903.html` (rev 2.9.12). Nuevo: `index.html` de trabajo (rev 2.9.14,
copia de las 19:42).

- 46 escenarios × 2 modos, 1,036,113 hojas comparadas → **0 diferencias numéricas o estructurales**, 0 de texto, código de salida 0.
- Ida y vuelta: 0 diferencias que aparezcan sólo en la nueva.
- Los dos escenarios que sólo existen en la nueva (botón Calcular): 0 diferencias.
- Autoprueba: correcta en sus tres pasos.
- Cambios de código que pasaron por la comparación y no movieron un número: `computeQuote` perdió una constante local sin uso
  (`fPlaza`); `semaforoDisciplina` ahora exige captura real (`capturaReal`); `sanearEstado` guarda `formato`/`sellos`; se
  quitaron 13 constantes y funciones sin ninguna referencia (`KW_ES_TERMICO`, `transfer`, `LAMINA_DECL`…).
- Informativo (no numérico): el semáforo de completitud cambió a propósito en un proyecto vacío o sin cuartos —cuartos
  limpios, equipo, contra incendio y civil pasan de «Con datos» a «Sin datos»—; 22 diferencias de texto (nivel y texto de
  estado) en 5 casos escenario×modo (`prueba` nativo y guardado; `vacio`, `barra-calcular-vacio` y `sin-zonas-con-datos`
  en guardado, donde abrir el proyecto lo vuelve «proyecto abierto»).

## Límites

- Compara el estado JavaScript de los motores, las celdas del Excel y los números de los PDF. De los PDF no compara
  la maquetación (posiciones, colores, tipografía) ni las imágenes; los submittals y hojas técnicas por modelo no se
  generan (son fichas de catálogo, no cálculo).
- En el modo nativo las DOS versiones guardan el proyecto antes de leer el Excel y los PDF (rev 2.9.15): guardar sólo en
  la base cambiaba el texto «sin proyecto abierto» de la memoria integral y parecía una diferencia.
- Las fórmulas de Excel se comparan como texto; no se evalúan.
- jsdom no dibuja: lo que sólo cambia en pantalla (colores, foco, disposición) no lo ve este comparador.
- La memoria de la casa (`localStorage`) arranca vacía en cada ventana; sus efectos se prueban con el escenario
  `valor-decisiones`.
