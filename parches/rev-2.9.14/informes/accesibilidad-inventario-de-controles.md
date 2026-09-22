# Inventario de controles accionables y accesibilidad de teclado

SuiteEmp · rev 2.9.14 (en curso) · 19-sep-2026 · decisión del dueño: todo control hecho con `span`, `div`, `li`, `td` u otro elemento no nativo que funcione como botón pasa a `<button>` (o `role="button"` + `tabindex="0"` con Enter y Espacio) y tiene foco visible.

Las líneas citadas son las de la copia de trabajo `index.orig.html` (el `index.html` de las 19:28). Los parches **no dependen de números de línea**: cada reemplazo es por texto con coincidencia única.

## 1. Resumen

| Dato | Valor |
|---|---|
| Plantillas con `data-act` / `data-tab` / `data-units` / `data-live` (HTML estático + plantillas del script) | **199** |
| Nativas (`button`, `select`, `input`, `summary`) | 188 |
| No nativas | **11** (10 por convertir + `div.cxz-drop`, que ya tenía `role="button"` y `tabindex="0"`) |
| Otros elementos no nativos que respondan a clic (`li`, `td`, `p`, `a` sin `href`, `onclick` en línea, `createElement` de controles) | **ninguno** |
| No nativos sin `role` + `tabindex="0"` antes del parche (recorrida en vivo: 19 pantallas, las 9 familias de Selección, catálogo en malla y en árbol abierto, 8 ventanas) | **6 grupos** (36 avisos en la prueba) |
| Después del parche | **0** |
| Estilos que anulaban el anillo de foco (`outline:none`) | 1 (`.cxz-drop:focus-visible`) → corregido |
| Controles interactivos anidados dentro de otro interactivo | 4 grupos antes, 6 después (ver riesgos, §8) |
| Banco completo sobre el `index.html` y el `pruebas.mjs` reales de las 19:42 / 19:43 | 309/309 antes → **315/315** con los dos parches (309 + 6 comprobaciones S.A11Y). Sobre mi copia de las 19:28: 305/305 → 311/311 |
| Sonda de los 15 motores (`sonda-motores.mjs`, con y sin cruces autorizados), antes y después | JSON **idénticos byte a byte**: cero diferencias numéricas |

## 2. Método

1. **Estático.** Una expresión regular sobre todo el archivo (incluye plantillas de varias líneas y `${...}` anidados) recorre cada etiqueta que lleva `data-act`, `data-tab`, `data-units` o `data-live` y ubica la función que la pinta. Además se buscaron los oyentes de clic y de teclado, los `onclick`, los `createElement`, los `.dataset.x =` y los `setAttribute("role"/"tabindex")`.
2. **En vivo.** Con jsdom y datos de prueba llenos (zonas, cargas eléctricas, consumos de aire, tramos de ducto, muebles, un cuarto limpio y una partida de equipo en la cotización) se renderizó cada pantalla de `tabsDeVista()` (19, ya incluidas Tablero, Proyecto, Catálogo y Comparativo); cada una de las 9 familias de la pantalla de Selección; el Catálogo en malla y en árbol abierto hasta las hojas; y las ventanas (Mis proyectos, detalle Carrier y Greenheck, ficha de equipo, tramo de ducto, origen de los datos, cruce entre disciplinas y confirmación). Por cada elemento se anotó tag, clase, acción, `role`, `tabindex`, nombre accesible y su ancestro interactivo más cercano (`w14_a11y_inv.mjs`).
3. **En un Chromium real** (panel del navegador, servidor local sobre la copia parchada): Enter sobre el PDF anidado de una tarjeta y estilos de foco calculados (§6).

El estático coincide con el vivo: la recorrida en vivo no encontró ningún control no nativo que el estático no hubiera listado.

## 3. Tabla A · los 11 controles no nativos (uno por plantilla)

| Línea | Elemento | Acción | En qué pantalla | Dentro de otro interactivo | Decisión |
|---|---|---|---|---|---|
| 14554 | `div.cxz-drop` (ya con `role="button"` `tabindex="0"` `aria-label`) | `cxz-elegir` | Tablero · zona «Arrastra aquí el proyecto ejecutivo» | No, pero **contiene** dos `<button>` nativos («Elegir archivos», «Elegir carpeta») | Se conserva. Enter/Espacio pasan del caso particular al manejador delegado; se le quita el `outline:none`. |
| 15253 | `span.minipdf` «PDF» | `pdf-sub` | HVAC · Carga térmica · candidatos Carrier | **Sí**: dentro de `button.pick` | `span role="button" tabindex="0" aria-label="PDF del submittal de <modelo>"` |
| 18178 | `span.qchip` «8 % franja fronteriza» | `setnum` (`quote.iva`) | Cotización · IVA | No (`div.row`) | `<button type="button" aria-pressed>` |
| 18179 | `span.qchip` «16 % nacional» | `setnum` | Cotización · IVA | No | `<button type="button" aria-pressed>` |
| 18180 | `span.qchip` «Exento» | `setnum` | Cotización · IVA | No | `<button type="button" aria-pressed>` |
| 18243 | `div.pick` (lista de modelos) | `detail` | HVAC · Selección de equipo (una lista por cada una de las 9 familias) | No, pero **contiene** los dos `.minipdf` | `role="button" tabindex="0" aria-label="Abrir submittal y ficha de <modelo>"`. No puede ser `<button>`: contiene botones. Con `cursor:pointer`. |
| 18254 | `span.minipdf` «PDF» | `pdf-sub` | Selección de equipo | Sí: dentro de `div.pick` (que ahora es `role="button"`) | `<button type="button" class="minipdf" aria-label="PDF del submittal de <modelo>">` |
| 18255 | `span.minipdf` «Seleccionar» | `sel-modelo` | Selección de equipo | Sí: dentro de `div.pick` | `<button type="button" class="minipdf" aria-label="Seleccionar <modelo>">` |
| 18440 | `span.minipdf` «PDF» | `pdf-sub` | HVAC · Ventilación · candidatos Greenheck | **Sí**: dentro de `button.pick` | `span role="button" tabindex="0" aria-label` |
| 18859 | `span.minipdf` «Submittal PDF» | `pdf-sub` | Catálogo · árbol (hoja) | **Sí**: dentro de `button.cat-card` | `span role="button" tabindex="0" aria-label="Submittal PDF de <título>"` |
| 18994 | `span.minipdf` «Submittal PDF» | `pdf-sub` | Catálogo · malla | **Sí**: dentro de `button.cat-card` | `span role="button" tabindex="0" aria-label` |

Regla aplicada: `<button type="button">` cuando el control **no** está dentro de un `<button>` (el analizador HTML rompe un `<button>` dentro de otro); `role="button"` + `tabindex="0"` + `aria-label` cuando está anidado en un `<button>` o cuando el contenedor es él mismo el control y contiene botones.

Comprobado: en los anidados el clic **y** el teclado actúan sobre el control interno y no sobre el contenedor (S.A11Y.2 y S.A11Y.3; en Chromium real, Enter sobre el PDF de la tarjeta emite un solo PDF y no abre el detalle).

## 4. Tabla B · los 188 controles nativos (agrupados por la función que los pinta)

Todos son `<button>` (salvo un `<select data-act="q-cmp-sel">` y un `<input data-live>`), con el reset global `button{font:inherit;color:inherit;cursor:pointer}` y el anillo global `:focus-visible`. El apéndice (§11) los da uno por uno.

| Función que pinta | Pantalla / ventana | Plantillas | Líneas | Elementos | Acciones distintas |
|---|---|---|---|---|---|
| `(HTML estático)` | cabecera (Deshacer/Rehacer, unidades) | 4 | 812–816 | button ×4 | `deshacer`, `rehacer`, `units:IP`, `units:SI` |
| `linkModal` | ventana de cruce entre disciplinas | 4 | 4273–4286 | button ×4 | `close`, `link-deny`, `link-grant`, `link-once` |
| `tarjetaCosto` | Cotización | 1 | 6215 | button ×1 | `ask-link` |
| `cxPanelCargaHtml` | todas las pantallas de motor (recuadro de carga) | 2 | 12704–12705 | button ×2 | `cx-cargar`, `cx-origen` |
| `cxModalHtml` | ventana de hallazgos de archivos | 4 | 13444–13465 | button ×4 | `cx-aplicar`, `cx-cambiar`, `cx-descartar`, `cx-nuevo` |
| `cxOrigenHtml` | ventana de origen de datos | 1 | 13475 | button ×1 | `close` |
| `cxzCambiarProyecto` | ventana cambiar de proyecto | 3 | 14369–14373 | button ×3 | `close`, `cxz-cambiar-guardar`, `cxz-cambiar-sin` |
| `cxzRenombrarModal` | ventana renombrar | 3 | 14378–14381 | button ×3 | `close`, `cxz-renombrar-ok` |
| `cxzSelectorHtml` | Tablero (selector de proyecto) | 7 | 14543–14549 | button ×7 | `cxz-archivar`, `cxz-duplicar`, `cxz-exportar`, `cxz-importar`, `cxz-renombrar`, `proj-modal`, `proj-new` |
| `cxzZonaCargaHtml` | Tablero (zona de carga) | 2 | 14558 | button ×2 | `cxz-carpeta`, `cxz-elegir` |
| `cxzTablaHtml` | Tablero (archivos cargados) | 4 | 14576 | button ×4 | `cxz-abrir`, `cxz-quitar`, `cxz-revisar` |
| `cxzRecientesHtml` | Tablero (recientes) | 1 | 14603 | button ×1 | `cxz-abrir-proyecto` |
| `viewProyecto` | Proyecto | 2 | 14811–14813 | button ×2 | `chain-duct`, `chain-vent` |
| `recChips` | HVAC · Carga térmica | 1 | 15006 | button ×1 | `setnum` |
| `viewCarga` | HVAC · Carga térmica | 11 | 15128–15249 | button ×11 | `autoenv`, `carrier`, `go-sys`, `pdf-sub`, `preset`, `tech`, `zone`, `zone-add`, `zone-del` |
| `sysCardHtml` | HVAC · Selección / Proyecto | 9 | 15292–15440 | button ×9 | `ask-link`, `diag-run`, `pdf-sub`, `perm-revoke`, `perms-ninguno`, `perms-todos`, `sys-pdf`, `sys-tech` |
| `viewKaizen` | Kaizen | 6 | 15843–15915 | button ×6 | `ask-link`, `kz-add`, `kz-adopt`, `kz-del`, `kz-state` |
| `herenciaHtml` | pantallas con datos heredados | 1 | 16258 | button ×1 | `her-volver` |
| `propuestaHtml` | Cotización (propuesta) | 10 | 16465–16484 | button ×10 | `prop-aceptar`, `prop-conservar`, `prop-propio` |
| `menuDisciplinasHtml` | columna de disciplinas | 1 | 16770 | button ×1 | `data-tab` |
| `columnaPantallasHtml` | segunda columna (pantallas) | 1 | 16779 | button ×1 | `data-tab` |
| `barraAccionesHtml` | todas las pantallas de motor (barra de acciones) | 2 | 16949–16951 | button ×2 | `${act}`, `ask-link` |
| `viewTablero` | Tablero | 6 | 17056–17092 | button ×6 | `go-tab`, `open-projects`, `pdf-integral` |
| `diagramaPartes` | Tablero (diagrama) | 1 | 17375 | button ×1 | `go-tab` |
| `viewDiagrama` | Tablero (diagrama) | 1 | 17418 | button ×1 | `go-tab` |
| `viewValor` | Ingeniería de valor | 5 | 17774–17801 | button ×5 | `ask-link`, `ve-aceptar`, `ve-descartar`, `ve-reabrir` |
| `kaizenDesvHtml` | Kaizen | 1 | 17865 | button ×1 | `kb-borrar` |
| `viewCotizacion` | Cotización | 19 | 18004–18176 | button ×17, input ×1, select ×1 | `ask-link`, `go-sel`, `go-tab`, `live`, `pdf-licitacion`, `q-clear`, `q-cmp-sel`, `q-del`, `q-fromsys`, `q-pdf-espejo`, `q-xlsx`, `q-xlsx-espejo` |
| `viewSeleccion` | HVAC · Selección de equipo | 4 | 18217–18276 | button ×4 | `ask-link`, `go-quote`, `q-fromsys`, `qfam` |
| `viewLimpio` | HVAC · Cuartos limpios | 7 | 18317–18351 | button ×7 | `cl-add`, `cl-del`, `cl-handoff`, `cl-sel`, `clean-pdf`, `clean-to-zone` |
| `viewVent` | HVAC · Ventilación | 3 | 18413–18436 | button ×3 | `green`, `pdf-sub`, `vmode` |
| `viewDuct` | HVAC · Ductos y calibres | 3 | 18467–18492 | button ×3 | `seg`, `seg-add`, `seg-del` |
| `viewComparativo` | HVAC · Comparativo de zonas | 1 | 18633 | button ×1 | `go-zona` |
| `segmentSheet` | ventana de tramo de ducto | 3 | 18693–18724 | button ×3 | `close`, `fit-add`, `fit-del` |
| `pintaHoja` | Catálogo (hoja del árbol) | 1 | 18855 | button ×1 | `detail` |
| `pintaArbol` | Catálogo (árbol) | 4 | 18875–18896 | button ×4 | `cat-nodo` |
| `viewCatalogo` | Catálogo | 7 | 18984–19004 | button ×7 | `cat-abrir`, `cat-cerrar`, `cat-src`, `cat-tech`, `cat-vista`, `detail` |
| `equipSheet` | ventana ficha de equipo | 5 | 19080–19089 | button ×5 | `close`, `det-tab`, `pdf-spec`, `pdf-sub` |
| `sheetWrap` | ventanas (cierre) | 1 | 19097 | button ×1 | `close` |
| `viewElec` | Eléctrico | 2 | 19117–19141 | button ×2 | `ec-add`, `ec-del` |
| `viewHidro` | Hidrosanitario | 2 | 19232–19235 | button ×2 | `ht-add`, `ht-del` |
| `viewAire` | Aire comprimido | 2 | 19293–19351 | button ×2 | `aire-add`, `aire-del` |
| `pedirConfirmacion` | ventana de confirmación | 3 | 19693–19701 | button ×3 | `close`, `confirmar-si` |
| `guiaHtml` | todas las pantallas (guía) | 2 | 19777–19785 | button ×2 | `guia-off`, `guia-on` |
| `enlazarRevisionAnterior` | ventana de revisión anterior | 3 | 20908–20912 | button ×3 | `close`, `confirmar-si` |
| `projConvertirReferencia` | ventana de referencia | 3 | 21084–21090 | button ×3 | `close`, `confirmar-si` |
| `projectsModal` | ventana Mis proyectos | 15 | 21125–21156 | button ×15 | `close`, `cxz-archivar-id`, `cxz-desarchivar`, `proj-del`, `proj-dup`, `proj-new`, `proj-open`, `proj-ref`, `proj-rev`, `proj-save`, `proj-zones` |
| `projCardHtml` | ventana Mis proyectos | 2 | 21177–21178 | button ×2 | `proj-modal`, `proj-save` |
| `installModal` | ventana de instalación | 2 | 21336–21345 | button ×2 | `close`, `sw-reset` |

## 5. Otros mecanismos que responden a clic o a teclado (no son `data-*`)

| Línea | Mecanismo | Sobre qué actúa | Estado |
|---|---|---|---|
| 13596 | `click` delegado | `[data-act^='cx-']` | Sólo controles de las tablas A y B. OK |
| 14300 | `click` en captura | `cx-aplicar`, `cx-nuevo` (bitácora de la fila) | Sólo `<button>`. OK |
| 14625 | `click` delegado | `[data-act^='cxz-']` | Incluye `div.cxz-drop` (ver §6). OK |
| 20058 | `click` delegado principal | `[data-act],[data-tab],[data-units]`; además el clic en el fondo de `#modal` cierra la ventana | Fondo del modal: sólo ratón, pero **Escape** cierra (línea 21216). No es un control. |
| 21185, 21186, 21194, 21208, 21320 | `onclick` por id | `#btn-projects`, `#btn-export`, `#btn-import`, `#btn-print`, `#btn-install` | Los cinco son `<button>` nativos del HTML estático. OK |
| 13622–13629, 14666–14672 | `dragover` / `drop` | `.cx-panel`, `.cxz-drop` | Arrastrar es sólo de ratón por naturaleza; el equivalente por teclado son los botones `cx-cargar`, «Elegir archivos» y «Elegir carpeta». OK |
| 14646 | `keydown` | Enter en `#cxz-nombre` (campo) y, hasta este parche, Enter/Espacio en `.cxz-drop` | El caso de `.cxz-drop` se retira (lo cubre el delegado; dejarlo lo dispararía dos veces). |
| 21216, 21238 | `keydown` | Escape (cierra ventana o vuelve al Tablero); Ctrl+Z / Ctrl+Y | Atajos globales; no chocan con el manejador nuevo (§7). |
| 20431 | `toggle` | `<details data-adv>` | Nativo (`<summary>`). OK |

No hay `onclick=` en línea, ni `.onkeydown`, ni controles creados con `createElement` que lleven `data-act` (los `createElement("a")` son de descarga y el `createElement("input")` es el `<input type="file">` oculto).

## 6. `cxz-drop` y el foco visible

**¿Responde a Enter y Espacio?** Sí, antes del parche: el `keydown` de la línea 14646 abría el selector de archivos con Enter o con Espacio cuando el destino era la propia zona (`preventDefault` incluido). La prueba S.A11Y.4 corrida contra el archivo sin parchar pasa (una apertura por tecla). Al añadir el manejador delegado habría dos aperturas por tecla, así que el caso particular se elimina y S.A11Y.4 exige **una sola**.

**Hallazgos de foco visible** (regla global: `:focus-visible{outline:2px solid var(--gr-9);outline-offset:2px}`):

| # | Hallazgo | Corrección |
|---|---|---|
| 1 | `.cxz-drop:hover,.cxz-drop:focus-visible,.cxz-drop.cxz-sobre{…;outline:none}` (línea 714): **la única** regla que anula el anillo. El cambio de borde punteado (gris 6 a gris 8) y de fondo no basta como indicador. | Se separa: hover y arrastre conservan borde y fondo; `:focus-visible` lleva `outline:2px solid var(--gr-9);outline-offset:3px`. |
| 2 | `.unit-toggle button:focus-visible{outline-offset:-2px}` dibuja el anillo **hacia adentro**; el botón pulsado tiene fondo `--gr-9`, el mismo color del anillo: contraste **1.00:1**, anillo invisible. | `.unit-toggle button[aria-pressed="true"]:focus-visible{outline-color:var(--gr-1)}` → 16.81:1. |
| 3 | `.tree{overflow:hidden}` con los `.nodo` del árbol del catálogo a todo el ancho: el anillo exterior queda recortado por los lados. | `.tree .nodo:focus-visible{outline-offset:-3px}` (hacia adentro). |
| 4 | `.zone-tab{overflow-x:auto}` sin relleno arriba ni a los lados: el anillo de los botones de zona se recorta arriba y a los lados. | `padding:4px 4px 8px;margin:-4px -4px 8px`: la posición de los botones no cambia (relleno y margen se cancelan) y hay 4 px para el anillo. |

**Contraste del anillo** (WCAG 1.4.11, mínimo 3:1), `--gr-9` (#EEF0F3) contra: `--gr-1` 16.81 · `--gr-2` 15.89 · `--gr-3` 14.80 · `--gr-4` 13.14 · `--gr-5` 10.50 · `--gr-6` 5.41 · tarjeta elevada dentro de otra tarjeta 10.61. Alcanza con margen. Ninguna otra regla usa `outline:none`, `outline:0` ni `outline-style:none` (S.A11Y.5 lo exige sobre todo el CSS).

**No se tocó** (se anota): `.dwrap{overflow-x:auto;overflow-y:hidden}` puede recortar el anillo de los nodos del borde del diagrama del Tablero; los nodos ya cambian de borde, se elevan y proyectan sombra al recibir foco (`.dnodo:focus-visible`), así que el foco no depende sólo del anillo.

**Medido en Chromium real** (con las transiciones desactivadas para leer el estilo final; `getComputedStyle` tras `focus()` con foco por teclado): `span.minipdf[role=button]`, `div.pick[role=button]`, `button.minipdf`, `button.pick`, `button.qchip` (encendido y apagado), botón de unidades no pulsado y zona de carga: `outline: solid 2px rgb(238,240,243)`; botón de unidades pulsado: `solid 2px rgb(13,15,18)` con desplazamiento de −2 px; nodo del árbol: desplazamiento hacia adentro. Con las transiciones activas y la ventana sin repintar, el valor leído es intermedio (los `.qchip`, `.tree .nodo` y otros llevan `transition` sobre todas las propiedades, incluido el anillo).

## 7. El manejador de teclado delegado

Vive junto al despachador de clics (antes del oyente `toggle`), en `index.html`:

* `esBotonAria(el)`: `role="button"` y etiqueta que **no** sea `BUTTON`, `A`, `INPUT`, `SELECT`, `TEXTAREA` ni `SUMMARY`.
* `teclaBotonAria(e)`, registrado para `keydown` **y** `keyup` (una función, dos eventos):
  * sólo Enter, Espacio (`" "`) o `"Spacebar"`; se ignora con Ctrl, Alt o Meta;
  * sólo si el **destino exacto** del evento (`e.target`, no un ancestro con `closest`) es un `role="button"` no nativo: un control anidado actúa por sí solo y el contenedor no se entera; un `<button>` nativo (por ejemplo «Elegir archivos» dentro de la zona de carga) no se toca;
  * `preventDefault()` en Enter y en Espacio (evita el desplazamiento de página con Espacio y que un `<button>` contenedor active además su propia acción, según el navegador; por eso también se cancela el `keyup` de Espacio);
  * en `keydown`, sin repetición (`e.repeat`) y si no tiene `aria-disabled="true"`, hace `e.target.click()`: el mismo clic que despacha el ratón, así que **no hay un segundo camino de acción**.
* Espacio dispara en `keydown` (como pidió el dueño); un `<button>` nativo lo dispara al soltar. Diferencia menor, documentada.

## 8. Riesgos y pendientes (nada de esto está en el parche)

1. **Control interactivo dentro de otro interactivo.** Lo que deja el parche por el criterio del dueño: `span[role=button]` dentro de `button.pick` y `button.cat-card` (3 plantillas), `button.minipdf` dentro de `div.pick[role=button]` (2) y los dos `<button>` dentro de `div.cxz-drop[role=button]`. Cumple teclado y foco, pero herramientas como axe lo marcan como *nested-interactive* y un lector de pantalla puede no anunciar el control interno (los hijos de un `role="button"` se tratan como presentacionales). El arreglo estructural es hermanar tarjeta y botones: contenedor no interactivo + un botón de «zona de clic» que cubre la tarjeta (posición absoluta) + los botones PDF y Seleccionar por encima. Toca cinco plantillas y algo de CSS y cambia la zona clicable del ratón; requiere visto bueno del dueño. Para `cxz-drop` la alternativa es quitar `role` y `tabindex` de la caja (los dos botones internos ya cubren el teclado) y dejarla sólo como destino de clic y arrastre.
2. **El foco se pierde tras `render()`.** Casi toda acción reconstruye `#view` y el elemento que tenía el foco desaparece (le pasa a los 188 nativos, no sólo a los convertidos): tras activar «16 %» con el teclado el foco vuelve al inicio del documento. Sugerencia: restablecer el foco por `data-act` + `data-id`/`data-i` después de la acción cuando el clic vino del teclado. No se hizo: cambia el comportamiento de todo el despachador.
3. **`role="tab"` sin patrón de pestañas.** Las disciplinas y subpantallas son `<button role="tab">` dentro de `nav role="tablist"`, todos en el orden de Tab, sin flechas ni `aria-controls`. Son navegación, no pestañas; lo natural sería una lista de botones con `aria-current`. Fuera de alcance.
4. **Ventanas (`#modal`).** Sin `role="dialog"` ni `aria-modal`, sin trampa de foco ni retorno del foco al cerrar. Escape sí cierra. Fuera de alcance.
5. **Espacio en el navegador real no se pudo ejercitar** con la herramienta del panel (su evento de tecla llega sin valor `key`); Enter sí. Espacio y `keyup` quedan cubiertos por las pruebas en jsdom (`preventDefault`, un solo disparo, sin repetición). Conviene una pasada manual con Tab, Enter y Espacio sobre: el PDF de una tarjeta de Carga térmica, PDF y «Seleccionar» de Selección de equipo, la tarjeta de modelo, los tres IVA y la zona de carga.
6. **`aria-label` en `div.pick[role=button]`** sustituye el texto del contenido como nombre («Abrir submittal y ficha de <modelo>»); contiene el nombre visible del modelo (WCAG 2.5.3).
7. **El archivo real cambia mientras se trabaja.** Ambos parches se probaron contra el `index.html` de las 19:42 y el `pruebas.mjs` de las 19:43 (todas las anclas únicas, 315/315). Si las anclas dejan de ser únicas, el script aborta **antes de escribir**.
8. `pruebas.mjs` (real) carga su fixture de formato desde `./parches/fixtures-formato/` relativo a su propia carpeta: hay que correrlo desde `Emp_Suite` (o copiar la carpeta junto al script) o S.20 falla por ruta, no por el parche.

## 9. Qué añade la comprobación S.A11Y (`parche_pruebas_a11y.py`)

Se inserta antes del marcador `resultado`; usa `w`, `G`, `S`, `t`, `eq`, `contiene`, `llenarTodoS`, `clicS`, `conPdfCapturado` y `textoPdf`. Restaura el estado al terminar (partidas, catálogo, familia, pestaña, ventana).

| Prueba | Qué exige |
|---|---|
| S.A11Y.1 | Recorre `tabsDeVista()` + tablero, proyecto, catálogo y comparativo con datos llenos, cada familia de Selección, catálogo en malla y en árbol abierto, cotización con partida y 8 ventanas. Falla si algún `[data-act],[data-tab],[data-units]` no es `button`, `a[href]`, `input`, `select`, `textarea`, `summary` ni `role` (button, link, tab, …) + `tabindex="0"`, o si un `role` no tiene nombre accesible. Además exige haber visto `span.minipdf`, `div.pick` y `div.cxz-drop`, y más de 300 controles (no pasa en vacío). |
| S.A11Y.2 | En Carga térmica y en Ventilación, sobre el PDF anidado (`span` dentro de `button.pick`): Enter y Espacio emiten un PDF cada uno y cancelan el default; `keyup` de Espacio cancelado; sin repetición; Tab, `a`, flechas, Shift y Home no se secuestran; Ctrl+Enter no dispara; la ventana de detalle del contenedor no se abre; el clic del ratón hace lo mismo; el clic sobre la tarjeta sí abre el detalle y no emite PDF. |
| S.A11Y.3 | `div.pick[role=button]`: Enter y Espacio abren el detalle sin PDF; PDF y «Seleccionar» son `<button type="button">`, el delegado no secuestra sus teclas y su clic actúa sobre ellos y no sobre la tarjeta (Seleccionar registra el modelo). |
| S.A11Y.4 | `div.cxz-drop`: Enter y Espacio abren el selector **una sola vez** cada uno; los botones internos no los maneja el delegado y su clic abre una sola vez. |
| S.A11Y.5 | Ninguna regla CSS con `outline:none`, `outline:0` ni `outline-style:none`; la regla global existe, mide 2 px o más y da ≥ 3:1 contra `--gr-1` a `--gr-5`; el anillo del botón de unidades pulsado da ≥ 3:1 contra su fondo; anillo propio en `.cxz-drop`, árbol hacia adentro y relleno en `.zone-tab`. |
| S.A11Y.6 | Los tres IVA: `<button type="button">`, `aria-pressed` que sigue a la marca `.on`, dentro de un grupo `role="group" aria-label="IVA"`. |

**¿Detectan algo?** Contra el `index.html` **sin parchar**: S.A11Y.1 (36 avisos), 2, 3, 5 y 6 fallan; S.A11Y.4 pasa (la zona de carga ya funcionaba). Tres mutaciones del parche, cada una atrapada por una prueba: dejar el caso viejo de `.cxz-drop` (doble apertura, S.A11Y.4), quitar el `keyup` (S.A11Y.2) y usar `closest` en el delegado (secuestra los botones nativos, S.A11Y.3 y S.A11Y.4).

## 10. Cómo aplicar

```
python parche_a11y.py          C:\Users\ASUS\Desktop\Emp_Suite\index.html
python parche_pruebas_a11y.py  C:\Users\ASUS\Desktop\Emp_Suite\pruebas.mjs
cd C:\Users\ASUS\Desktop\Emp_Suite
node pruebas.mjs index.html --base <base-pre.html>     # esperado: 315/315 sobre el estado de las 19:43
```

Ambos son idempotentes (segunda aplicación: aviso y sin cambios), conservan los finales de línea (CRLF) y aceptan un segundo argumento con la ruta de salida para ensayar sin tocar el original. No suben `REV` ni tocan ningún motor, PDF, Excel, `--senal` ni las capas `--p-*`.

## 11. Apéndice · las 199 plantillas una por una

| Línea | Elemento | Acción | Función |
|---|---|---|---|
| 812 | `button.toolbtn` | `deshacer` | `(HTML estático)` |
| 813 | `button.toolbtn` | `rehacer` | `(HTML estático)` |
| 815 | `button` | `units:SI` | `(HTML estático)` |
| 816 | `button` | `units:IP` | `(HTML estático)` |
| 4273 | `button.toolbtn` | `close` | `linkModal` |
| 4284 | `button.btn-primary` | `link-grant` | `linkModal` |
| 4285 | `button.btn-ghost` | `link-once` | `linkModal` |
| 4286 | `button.btn-ghost` | `link-deny` | `linkModal` |
| 6215 | `button.toolbtn` | `ask-link` | `tarjetaCosto` |
| 12704 | `button.toolbtn` | `cx-cargar` | `cxPanelCargaHtml` |
| 12705 | `button.toolbtn` | `cx-origen` | `cxPanelCargaHtml` |
| 13444 | `button.toolbtn` | `cx-descartar` | `cxModalHtml` |
| 13462 | `button.toolbtn` | `cx-cambiar` | `cxModalHtml` |
| 13464 | `button.btn-primary` | `cx-nuevo` | `cxModalHtml` |
| 13465 | `button.btn-ghost` | `cx-aplicar` | `cxModalHtml` |
| 13475 | `button.toolbtn` | `close` | `cxOrigenHtml` |
| 14369 | `button.toolbtn` | `close` | `cxzCambiarProyecto` |
| 14372 | `button.btn-primary` | `cxz-cambiar-guardar` | `cxzCambiarProyecto` |
| 14373 | `button.btn-ghost` | `cxz-cambiar-sin` | `cxzCambiarProyecto` |
| 14378 | `button.toolbtn` | `close` | `cxzRenombrarModal` |
| 14381 | `button.btn-primary` | `cxz-renombrar-ok` | `cxzRenombrarModal` |
| 14381 | `button.btn-ghost` | `close` | `cxzRenombrarModal` |
| 14543 | `button.toolbtn` | `proj-new` | `cxzSelectorHtml` |
| 14544 | `button.toolbtn` | `cxz-renombrar` | `cxzSelectorHtml` |
| 14545 | `button.toolbtn` | `cxz-duplicar` | `cxzSelectorHtml` |
| 14546 | `button.toolbtn` | `cxz-archivar` | `cxzSelectorHtml` |
| 14547 | `button.toolbtn` | `cxz-exportar` | `cxzSelectorHtml` |
| 14548 | `button.toolbtn` | `cxz-importar` | `cxzSelectorHtml` |
| 14549 | `button.toolbtn` | `proj-modal` | `cxzSelectorHtml` |
| 14554 | `div.cxz-drop` | `cxz-elegir` | `cxzZonaCargaHtml` |
| 14558 | `button.btn-primary` | `cxz-elegir` | `cxzZonaCargaHtml` |
| 14558 | `button.btn-ghost` | `cxz-carpeta` | `cxzZonaCargaHtml` |
| 14576 | `button.toolbtn` | `cxz-abrir` | `cxzTablaHtml` |
| 14576 | `button.toolbtn` | `cxz-revisar` | `cxzTablaHtml` |
| 14576 | `button.toolbtn` | `cxz-revisar` | `cxzTablaHtml` |
| 14576 | `button.toolbtn` | `cxz-quitar` | `cxzTablaHtml` |
| 14603 | `button.toolbtn` | `cxz-abrir-proyecto` | `cxzRecientesHtml` |
| 14811 | `button.btn-primary` | `chain-duct` | `viewProyecto` |
| 14813 | `button.btn-ghost` | `chain-vent` | `viewProyecto` |
| 15006 | `button.chip` | `setnum` | `recChips` |
| 15128 | `button.btn-primary` | `zone-add` | `viewCarga` |
| 15147 | `button` | `zone` | `viewCarga` |
| 15149 | `button` | `zone-add` | `viewCarga` |
| 15162 | `button.btn-primary` | `preset` | `viewCarga` |
| 15163 | `button.btn-ghost` | `autoenv` | `viewCarga` |
| 15197 | `button.btn-ghost` | `zone-del` | `viewCarga` |
| 15241 | `button.btn-ghost` | `go-sys` | `viewCarga` |
| 15243 | `button` | `tech` | `viewCarga` |
| 15244 | `button` | `tech` | `viewCarga` |
| 15247 | `button.btn-primary` | `pdf-sub` | `viewCarga` |
| 15249 | `button.pick` | `carrier` | `viewCarga` |
| 15253 | `span.minipdf` | `pdf-sub` | `viewCarga` |
| 15292 | `button.toolbtn` | `perm-revoke` | `sysCardHtml` |
| 15293 | `button.toolbtn` | `ask-link` | `sysCardHtml` |
| 15306 | `button.btn-ghost` | `diag-run` | `sysCardHtml` |
| 15309 | `button.btn-accion` | `diag-run` | `sysCardHtml` |
| 15317 | `button.btn-primary` | `perms-todos` | `sysCardHtml` |
| 15318 | `button.toolbtn` | `perms-ninguno` | `sysCardHtml` |
| 15378 | `button.segbtn` | `sys-tech` | `sysCardHtml` |
| 15439 | `button.btn-primary` | `sys-pdf` | `sysCardHtml` |
| 15440 | `button.btn-ghost` | `pdf-sub` | `sysCardHtml` |
| 15843 | `button.toolbtn` | `ask-link` | `viewKaizen` |
| 15859 | `button.qchip` | `ask-link` | `viewKaizen` |
| 15883 | `button.toolbtn` | `kz-adopt` | `viewKaizen` |
| 15902 | `button.toolbtn` | `kz-del` | `viewKaizen` |
| 15905 | `button.segbtn` | `kz-state` | `viewKaizen` |
| 15915 | `button.btn-ghost` | `kz-add` | `viewKaizen` |
| 16258 | `button.toolbtn` | `her-volver` | `herenciaHtml` |
| 16465 | `button.btn-primary` | `prop-aceptar` | `propuestaHtml` |
| 16465 | `button.btn-ghost` | `prop-propio` | `propuestaHtml` |
| 16470 | `button.btn-primary` | `prop-aceptar` | `propuestaHtml` |
| 16470 | `button.btn-ghost` | `prop-propio` | `propuestaHtml` |
| 16474 | `button.btn-ghost` | `prop-aceptar` | `propuestaHtml` |
| 16474 | `button.btn-ghost` | `prop-propio` | `propuestaHtml` |
| 16480 | `button.btn-primary` | `prop-aceptar` | `propuestaHtml` |
| 16480 | `button.btn-ghost` | `prop-conservar` | `propuestaHtml` |
| 16480 | `button.btn-ghost` | `prop-propio` | `propuestaHtml` |
| 16484 | `button.btn-ghost` | `prop-aceptar` | `propuestaHtml` |
| 16770 | `button.lati` | `tab:${id}` | `menuDisciplinasHtml` |
| 16779 | `button.subtab` | `tab:${id}` | `columnaPantallasHtml` |
| 16949 | `button.acclink` | `ask-link` | `barraAccionesHtml` |
| 16951 | `button.acc` | `${act}` | `barraAccionesHtml` |
| 17056 | `button.tfila` | `go-tab` | `viewTablero` |
| 17076 | `button.btn-accion` | `go-tab` | `viewTablero` |
| 17077 | `button.btn-ghost` | `pdf-integral` | `viewTablero` |
| 17083 | `button.btn-accion` | `open-projects` | `viewTablero` |
| 17084 | `button.btn-ghost` | `go-tab` | `viewTablero` |
| 17092 | `button.toolbtn` | `go-tab` | `viewTablero` |
| 17375 | `button.dnodo` | `go-tab` | `diagramaPartes` |
| 17418 | `button.ptab` | `go-tab` | `viewDiagrama` |
| 17774 | `button.toolbtn` | `ve-reabrir` | `viewValor` |
| 17775 | `button.btn-primary` | `ve-aceptar` | `viewValor` |
| 17776 | `button.btn-ghost` | `ve-descartar` | `viewValor` |
| 17790 | `button.toolbtn` | `ask-link` | `viewValor` |
| 17801 | `button.toolbtn` | `ask-link` | `viewValor` |
| 17865 | `button.toolbtn` | `kb-borrar` | `kaizenDesvHtml` |
| 18004 | `button.btn-primary` | `q-fromsys` | `viewCotizacion` |
| 18005 | `button.btn-ghost` | `go-sel` | `viewCotizacion` |
| 18024 | `input` | `live` | `viewCotizacion` |
| 18041 | `button.qchip` | `ask-link` | `viewCotizacion` |
| 18059 | `button.btn-primary` | `q-fromsys` | `viewCotizacion` |
| 18060 | `button.btn-ghost` | `go-sel` | `viewCotizacion` |
| 18061 | `button.btn-ghost` | `q-clear` | `viewCotizacion` |
| 18073 | `button.toolbtn` | `q-del` | `viewCotizacion` |
| 18124 | `button.btn-primary` | `pdf-licitacion` | `viewCotizacion` |
| 18146 | `select` | `q-cmp-sel` | `viewCotizacion` |
| 18152 | `button.btn-primary` | `q-xlsx-espejo` | `viewCotizacion` |
| 18153 | `button.btn-primary` | `q-pdf-espejo` | `viewCotizacion` |
| 18156 | `button.toolbtn` | `q-xlsx` | `viewCotizacion` |
| 18157 | `button.toolbtn` | `go-tab` | `viewCotizacion` |
| 18172 | `button.toolbtn` | `ask-link` | `viewCotizacion` |
| 18173 | `button.toolbtn` | `ask-link` | `viewCotizacion` |
| 18174 | `button.toolbtn` | `ask-link` | `viewCotizacion` |
| 18175 | `button.toolbtn` | `ask-link` | `viewCotizacion` |
| 18176 | `button.toolbtn` | `ask-link` | `viewCotizacion` |
| 18178 | `span.qchip` | `setnum` | `viewCotizacion` |
| 18179 | `span.qchip` | `setnum` | `viewCotizacion` |
| 18180 | `span.qchip` | `setnum` | `viewCotizacion` |
| 18217 | `button.fam` | `qfam` | `viewSeleccion` |
| 18235 | `button.toolbtn` | `ask-link` | `viewSeleccion` |
| 18243 | `div.pick` | `detail` | `viewSeleccion` |
| 18254 | `span.minipdf` | `pdf-sub` | `viewSeleccion` |
| 18255 | `span.minipdf` | `sel-modelo` | `viewSeleccion` |
| 18275 | `button.btn-primary` | `q-fromsys` | `viewSeleccion` |
| 18276 | `button.btn-ghost` | `go-quote` | `viewSeleccion` |
| 18317 | `button.segbtn` | `cl-sel` | `viewLimpio` |
| 18318 | `button.segbtn` | `cl-add` | `viewLimpio` |
| 18331 | `button.btn-primary` | `clean-pdf` | `viewLimpio` |
| 18333 | `button.btn-ghost` | `clean-to-zone` | `viewLimpio` |
| 18335 | `button.btn-ghost` | `cl-handoff` | `viewLimpio` |
| 18336 | `button.btn-ghost` | `cl-del` | `viewLimpio` |
| 18351 | `button.pick` | `cl-sel` | `viewLimpio` |
| 18413 | `button` | `vmode` | `viewVent` |
| 18420 | `button.btn-primary` | `pdf-sub` | `viewVent` |
| 18436 | `button.pick` | `green` | `viewVent` |
| 18440 | `span.minipdf` | `pdf-sub` | `viewVent` |
| 18467 | `button.pick` | `seg` | `viewDuct` |
| 18478 | `button.icon-btn` | `seg-del` | `viewDuct` |
| 18492 | `button.btn-primary` | `seg-add` | `viewDuct` |
| 18633 | `button.pick` | `go-zona` | `viewComparativo` |
| 18693 | `button.toolbtn` | `close` | `segmentSheet` |
| 18722 | `button.icon-btn` | `fit-del` | `segmentSheet` |
| 18724 | `button.btn-ghost` | `fit-add` | `segmentSheet` |
| 18855 | `button.cat-card` | `detail` | `pintaHoja` |
| 18859 | `span.minipdf` | `pdf-sub` | `pintaHoja` |
| 18875 | `button.nodo` | `cat-nodo` | `pintaArbol` |
| 18882 | `button.nodo` | `cat-nodo` | `pintaArbol` |
| 18889 | `button.nodo` | `cat-nodo` | `pintaArbol` |
| 18896 | `button.nodo` | `cat-nodo` | `pintaArbol` |
| 18984 | `button` | `cat-vista` | `viewCatalogo` |
| 18987 | `button` | `cat-src` | `viewCatalogo` |
| 18988 | `button` | `cat-tech` | `viewCatalogo` |
| 18990 | `button.cat-card` | `detail` | `viewCatalogo` |
| 18994 | `span.minipdf` | `pdf-sub` | `viewCatalogo` |
| 19002 | `button` | `cat-abrir` | `viewCatalogo` |
| 19003 | `button` | `cat-cerrar` | `viewCatalogo` |
| 19004 | `button` | `cat-vista` | `viewCatalogo` |
| 19080 | `button.toolbtn` | `close` | `equipSheet` |
| 19083 | `button` | `det-tab` | `equipSheet` |
| 19084 | `button` | `det-tab` | `equipSheet` |
| 19088 | `button.btn-primary` | `pdf-sub` | `equipSheet` |
| 19089 | `button.btn-ghost` | `pdf-spec` | `equipSheet` |
| 19097 | `button.toolbtn` | `close` | `sheetWrap` |
| 19117 | `button.icon-btn` | `ec-del` | `viewElec` |
| 19141 | `button.btn-primary` | `ec-add` | `viewElec` |
| 19232 | `button.icon-btn` | `ht-del` | `viewHidro` |
| 19235 | `button.btn-ghost` | `ht-add` | `viewHidro` |
| 19293 | `button.toolbtn` | `aire-del` | `viewAire` |
| 19351 | `button.toolbtn` | `aire-add` | `viewAire` |
| 19693 | `button.toolbtn` | `close` | `pedirConfirmacion` |
| 19700 | `button.btn-primary` | `confirmar-si` | `pedirConfirmacion` |
| 19701 | `button.btn-ghost` | `close` | `pedirConfirmacion` |
| 19777 | `button.toolbtn` | `guia-on` | `guiaHtml` |
| 19785 | `button.toolbtn` | `guia-off` | `guiaHtml` |
| 20908 | `button.toolbtn` | `close` | `enlazarRevisionAnterior` |
| 20911 | `button.btn-primary` | `confirmar-si` | `enlazarRevisionAnterior` |
| 20912 | `button.btn-ghost` | `close` | `enlazarRevisionAnterior` |
| 21084 | `button.toolbtn` | `close` | `projConvertirReferencia` |
| 21089 | `button.btn-primary` | `confirmar-si` | `projConvertirReferencia` |
| 21090 | `button.btn-ghost` | `close` | `projConvertirReferencia` |
| 21125 | `button.toolbtn` | `close` | `projectsModal` |
| 21128 | `button.btn-primary` | `proj-save` | `projectsModal` |
| 21129 | `button.btn-ghost` | `proj-new` | `projectsModal` |
| 21134 | `button.toolbtn` | `proj-open` | `projectsModal` |
| 21135 | `button.toolbtn` | `proj-rev` | `projectsModal` |
| 21136 | `button.toolbtn` | `proj-dup` | `projectsModal` |
| 21137 | `button.toolbtn` | `proj-zones` | `projectsModal` |
| 21138 | `button.toolbtn` | `proj-ref` | `projectsModal` |
| 21139 | `button.toolbtn` | `cxz-archivar-id` | `projectsModal` |
| 21140 | `button.toolbtn` | `proj-del` | `projectsModal` |
| 21146 | `button.toolbtn` | `cxz-desarchivar` | `projectsModal` |
| 21147 | `button.toolbtn` | `proj-del` | `projectsModal` |
| 21154 | `button.toolbtn` | `proj-dup` | `projectsModal` |
| 21155 | `button.toolbtn` | `proj-zones` | `projectsModal` |
| 21156 | `button.toolbtn` | `proj-del` | `projectsModal` |
| 21177 | `button.btn-primary` | `proj-save` | `projCardHtml` |
| 21178 | `button.btn-ghost` | `proj-modal` | `projCardHtml` |
| 21336 | `button.toolbtn` | `close` | `installModal` |
| 21345 | `button.btn-ghost` | `sw-reset` | `installModal` |
