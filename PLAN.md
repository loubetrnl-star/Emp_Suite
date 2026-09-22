# PLAN · Fuente única de precios de referencia (California, USD) para el Budget Proposal

Estado: **APROBADO por el dueño el 22-sep-2026** (fuente A + Terra Universal sólo cuarto limpio). No se ha cargado ningún precio: se espera el PDF/acceso a los libros. Reglas añadidas por el dueño: sólo costo de material (mano de obra propia; combinados → Por cotizar); etiqueta exactamente como la describe la fuente (lo que no diga: «no especificado»); IUSA fuera (archivado en Bitacora-rev-2.9.23.md §9); flete/aduana/importación en renglón propio siempre Por cotizar hasta capturarlo. Modelo y pruebas listos en la suite (S.41).

## 1. Lo que pediste
- Una sola fuente, con sede en California, para **todos** los componentes (no sólo cobre).
- Precios en USD tal como vienen; conversión a MXN sólo con tipo de cambio que tú capturas con fecha (ya implementado en la suite, rev 2.9.23: sin fecha, el precio en USD sale «Por cotizar» y bloquea la formal).
- Cada precio etiquetado con fuente, ubicación, fecha, impuestos incluidos o no, lista bruta o neta (ya implementado en el modelo de renglón).
- Nunca estimar ni rellenar: lo que la fuente no tenga sale «Por cotizar» en el Budget y bloquea la cotización formal.
- Son referencia para el Budget; la formal usa costos capturados de proveedor.

## 2. Candidatos

| # | Fuente | Sede | Edición / vigencia | Cobertura por disciplina | Acceso | Huecos |
|---|---|---|---|---|---|---|
| A (recomendada) | **Craftsman Book Company** · *National Construction Estimator*, *National Plumbing & HVAC Estimator*, *National Electrical Estimator* | Carlsbad, California | Edición anual; la 2026 es la vigente (confirmar en craftsman-book.com al comprar). Precios nacionales USD con **factor de ajuste por área** (tabla por ciudad/ZIP; usar San Diego) | Hidráulico (tubería por material y diámetro, con mano de obra separada), HVAC (ductos, aislamiento, equipo unitario), eléctrico (conductores, canalización, tableros), civil (firmes, muros, puertas), contra incendio (rociadores, tubería) | Libro impreso o suscripción en línea (de pago; ~100–130 USD por título). No se puede descargar gratis: **tú compras o me pasas el PDF/acceso** | Cuarto limpio (FFU, HEPA, paneles, puertas limpias), equipo de proceso, soportería sísmica específica, transporte/aduana a México. Salen «Por cotizar» |
| B | **RSMeans Data (Gordian)** · Building Construction Costs / Mechanical / Electrical, con City Cost Index San Diego | Greenville, SC (la sede **no** es California; sólo el índice de ciudad lo es) | Anual (2026); índice de ciudad trimestral | Muy amplia, similar a A, más ítems de mecánica industrial | Suscripción en línea (más cara que A) | Igual que A en cuarto limpio; incumple «sede en California» |
| C | **Caltrans Contract Cost Data** (precios de licitación reales) | Sacramento, California (público, gratuito) | Publicación anual con precios de contratos adjudicados; consultar la última | Sólo civil/obra exterior (concreto, acero, demolición, tubería enterrada) | Gratis en dot.ca.gov | Todo lo que no es obra civil |
| D | Distribuidores con sede en California: **Terra Universal** (Fullerton; cuarto limpio: FFU, HEPA, paneles, pass-through, con precios públicos en su sitio), **Slakey Brothers** (Sacramento; HVAC/plomería), **OneSource Distributors** (Oceanside; eléctrico), **US Air Conditioning Distributors** (City of Industry; HVAC) | California | Precio web del día (fecha de consulta) | Cada uno cubre su rubro | Terra Universal público; los demás requieren cuenta o cotización | Fragmenta la «fuente única»; sólo Terra Universal publica precios sin cuenta |

## 3. Recomendación
**A (Craftsman, Carlsbad CA) como fuente única de referencia**, con factor de área San Diego, precios en USD, «lista bruta» (precio de libro, sin impuestos: en California el sales tax se aplica aparte), etiqueta: `Craftsman National … Estimator 2026, Carlsbad CA, factor San Diego, consultado AAAA-MM-DD, antes de impuestos, lista bruta`.

Complemento propuesto **sólo si lo apruebas**: Terra Universal (Fullerton, CA) para el rubro de cuarto limpio, que Craftsman no cubre; se etiqueta con su propia fuente y fecha. Si prefieres fuente única estricta, ese rubro queda «Por cotizar».

Alternativas que no recomiendo: B por sede fuera de California; C sólo como complemento civil; D solo, porque fragmenta la fuente.

## 4. Lo que haría al aprobar (no antes)
1. Cargar únicamente lo que la fuente tenga, ítem por ítem, con página/código de la fuente en `fuente`; el resto queda «Por cotizar».
2. Extender el modelo de precio de referencia (hoy sólo tubería hidráulica) a las demás secciones del catálogo (A–G): mismo renglón `{precio USD, moneda, iva, porTramo/unidad, origen, fuente, ubicación, lista, url, fecha}` y misma regla Budget/formal.
3. Retirar las referencias IUSA (MXN) del cobre al cargar las de la fuente aprobada, con antes/después en bitácora.
4. Pruebas por sección (referencia → Budget; proveedor → sustituye; USD → sólo con tipo de cambio fechado), banco en verde, commit y tag nuevo.

## 5. Lo que necesito de ti
- Aprobar A (y decir sí/no al complemento Terra Universal para cuarto limpio).
- Darme acceso a los libros/costbook 2026 (PDF o suscripción). No puedo comprarlos ni descargarlos por mi cuenta.
- Confirmar el factor de área: San Diego (o Tijuana-equivalente = San Diego).
