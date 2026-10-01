# Revisión adversarial de H-264…H-266 (sobre 63a2794) · soporte

## C2 · CONFIRMADO por refutador · media · lente reglas
**La migración H-266 pasa a «instantánea aceptada» un proyecto a mano guardado con usarMotores:"false" (texto) y cambia sus cifras**
Dónde: index.html:24027

Escenario: Respaldo anterior con soporte {usarMotores:"false", ductoM:30, ductoAnchoMm:400, ductoAltoMm:300}, sin alturaEstructura, y 100 m de ducto en Ductos. En 969f6d9 abre a mano: 30 m, 14 soportes, 34,498 MXN. En 63a2794 abre con usarMotores=true, toma la instantánea y registra el vínculo motores>soporte como «aceptado» con la fecha de apertura: 100 m, 42 soportes, 82,294 MXN.

Razón del refutador: Se reproduce en 63a2794 y ningún commit posterior lo corrigió. index.html:24027 decide la migración con el valor crudo `sopPrevio.usarMotores !== false`. Con el texto "false" esa condición es verdadera, así que pone `usarMotores=true` y `tomarInstantanea=true`. El `boolear(s.soporte,"usarMotores")` de H-42 corre después, en 24118, y ya encuentra un booleano, así que no corrige nada. recompute (11657-11660) toma entonces la instantánea y llama `registrarVinculo("motores>soporte","aceptado")` con Date.now().

Reproducción en x15/rev/verif-reglas/sop-um/repro.mjs, con importarRespaldo, que es el camino real. Respaldo con soporte {usarMotores:"false", ductoM:30, ductoAnchoMm:400, ductoAltoMm:300}, sin alturaEstructura, y un tramo de 100 m en Ductos:
- 969f6d9: usarMotores=false, 30 m, 14 soportes, 25,998 MXN.
- 63a2794: usarMotores=true, con snap y vínculo {estado:"aceptado", ts: fecha de apertura}; 100 m, 42 soportes, 73,794 MXN.
- Control con booleano false en 63a2794: 30 m, 14 soportes, 25,998 MXN, sin vínculo.
Metros y soportes coinciden exactamente con el hallazgo. Los totales difieren por una constante de 8,500 MXN en ambos lados, por el armado del caso; no cambia la conclusión.

La misma causa rompe también la otra rama (repro-bases.mjs). Con "false" en texto, una instantánea vieja guardada y 2 equipos Carrier en la cotización:
- 969f6d9: 2 bases, 62,998 MXN.
- 63a2794: ninguna de las dos ramas aplica (`"false" === false` es falso), no se marca tomarBases y quedan 0 bases, 25,998 MXN.
- El mismo caso con booleano false en 63a2794 da 2 bases.

Con esto se incumplen la decisión del dueño («un proyecto guardado abre con las mismas cifras»; lo de otro motor entra sólo por aceptación) y lo que declara el propio commit H-266 («Abren con las mismas cifras»). El caso está en alcance: la app normaliza a propósito los sí/no guardados como texto (H-42) y 9.1 prueba un «Proyecto rev 2.5» con sismico:"false". H-268 sí lee el texto (index.html:24003, `tomarHVAC === "true"`).

Ninguna prueba cubre el caso. En 9.1 el soporte trae alturaEstructura, porque se arma con defaultState().soporte, así que la migración no llega a correr. S.102 (pruebas.mjs:7760/7800) usa el fixture con usarMotores:true booleano.

Matices. Registrar «aceptado» con Date.now() al migrar es el patrón de la casa (H-267 en 11610, H-268): sólo está mal porque aquí entra por la rama equivocada. La parte de regla 8 (alturas migradas que quedan como captura sin procedencia) es aparte y más débil: el propio commit la declara como migración intencional. No la cuento en este hallazgo.

Severidad media: cambia las cifras en silencio y deja registrada una aceptación que el usuario no hizo, pero sólo le pasa a respaldos anteriores a 2.7.0 o a JSON editados a mano, y no truena nada.

Corrección propuesta: En sanearEstado, dentro del bloque H-266 (index.html:24023-24029), se lee el sí/no guardado de sopPrevio ya normalizado antes de decidir, como hace H-268 con tomarHVAC:
```js
const umPrevio = typeof sopPrevio.usarMotores === "string" ? sopPrevio.usarMotores === "true" : sopPrevio.usarMotores;   /* H-42 */
if (umPrevio !== false && !(sopPrevio.snap && typeof sopPrevio.snap === "object")) { s.soporte.usarMotores = true; s.soporte.tomarInstantanea = true; }
else if (umPrevio === false && !(num(sopPrevio.basesEquipo, 0) > 0)) s.soporte.tomarBases = true;
```
No sirve adelantar boolear sobre s.soporte, porque ahí ya se mezcló el nuevo default false y un proyecto sin la clave (que antes contaba en vivo) se leería como proyecto a mano. Hay que leer el valor de sopPrevio.

Lo probé en una copia parcheada, x15/rev/verif-reglas/sop-um/index-fix.html:
- "false" en texto abre a mano: 30 m, 14 soportes, 25,998 MXN, sin vínculo.
- La variante de bases recupera sus 2 bases (62,998 MXN).
- Sin la clave y con "true" sigue migrando a instantánea.

computeSoporte no cambia y el fixture de regresión (usarMotores:true booleano) no se mueve, así que no hace falta subir MOTOR_VER.soporte ni regenerar esperados. Si el integrador lo considera cambio de motor, que agregue la línea en MOTOR_CAMBIOS y CHANGELOG.

Commit: «H-nnn · soporte · la migración H-266 lee el sí/no guardado como texto (H-42): un proyecto a mano abre a mano». En el cuerpo:
- Norma: decisión del dueño del 27-sep-2026 (abre con las mismas cifras; nada entra sin aceptación).
- Antes → después: 100 m / 42 soportes / 73,794 MXN y vínculo «aceptado» → 30 m / 14 soportes / 25,998 MXN, sin vínculo; bases 0 → 2.
- Prueba S.nn y el resultado de los dos bancos.

Prueba sugerida: Es una prueba pura sobre sanearEstado (no toca S del banco) y hoy falla por la conducta: «el sí/no guardado como texto se respeta: esperado false, salió true». Ya la corrí en x15/rev/verif-reglas/sop-um/prueba-snn.mjs: FALLA en 63a2794 y pasa con index-fix.html. Los dos controles (booleano false, y "true" en texto que sí migra) pasan en ambos.
```js
t("S.nn (H-nnn) un proyecto a mano con el sí/no de soportería guardado como texto abre a mano: no toma instantánea ni registra aceptación", () => {
  const viejo = { zones: [{ ...G("defaultZone")("Nave"), area: 400, height: 6 }],
    soporte: { usarMotores: "false", ductoM: 30, ductoAnchoMm: 400, ductoAltoMm: 300 } };   // sin alturaEstructura: anterior a H-266
  const s = G("sanearEstado")(JSON.parse(JSON.stringify(viejo)));
  eq(s.soporte.usarMotores, false, "el sí/no guardado como texto se respeta:");
  eq(s.soporte.tomarInstantanea, undefined, "no se toma una instantánea que el usuario no aceptó:");
  eq(s.soporte.tomarBases, true, "como todo proyecto a mano sin bases, toma una vez las que contaba:");
  eq(s.soporte.ductoM, 30);
});
```
Opcionalmente se agrega un segundo tramo con importarRespaldo, dentro de try/finally que restaure S con reemplazarEstado. Con un tramo de ducto de 100 m se exige `SOPORTE.mDucto === 30` y que `S.vinculos["motores>soporte"]` sea undefined; hoy da 100 y «aceptado».


---

## U5 · SIN VERIFICAR (verificar con prueba primero) · baja · lente reglas
**Soportería sin altura de la estructura calcula Fp con z/h = 0 y cotiza el anclaje como si estuviera calculado**
Dónde: index.html:8525

Escenario: Hidráulica de acero con la instantánea aceptada, SDS 1.2 con fuente, losa f'c 250 y alturaEstructura sin capturar. La memoria dice «Fp = 41.4 kgf … z/h 0 (rige tope inferior)», anclajePendiente=false, se cotizan 37 anclas M10 (3,515 MXN) y no hay pendiente en la cotización. Con 8 m capturados: Fp 46.0 kgf con z/h 1.

Detalle: Viola la regla 6: la altura que falta se sustituye por 0, que es el lado no conservador que H-50 había corregido; sólo hay un aviso (8574). anclajeCapturado (8523-8525) exige SDS con fuente y estructura, pero no la altura, así que el anclaje sale de «Por cotizar» con un Fp de altura supuesta. Corrección propuesta: sin alturaEstructura, el anclaje queda «Por cotizar» o pendiente, igual que sin SDS.


---

## U8 · SIN VERIFICAR (verificar con prueba primero) · media · lente codigo
**Soportería: la migración acepta una instantánea vacía (la propuesta sale «Desactualizada» y así se imprime) y todo proyecto anterior abre «con cambios sin guardar»**
Dónde: index.html:11657

Escenario: (1) Proyecto guardado con e0e1cf4 en el modo por omisión (usarMotores true, sin instantánea) y sin ductos, agua, incendio ni aire; por ejemplo, sólo con eléctrico. En e0e1cf4 la propuesta motores>soporte está en «sin-datos». En fcda936 y en 63a2794 abre con el vínculo «aceptado» y el nivel «Desactualizada · el origen cambió», y el trazado de origen (memoria integral y libro) imprime «Desactualizada · el origen cambió · 0 m de ducto (0 tramos) · 0 m de tubería hidráulica soportada como cobre · incendio 0 rociador(es)…». (2) Cualquier proyecto anterior en vivo, abierto desde Mis proyectos y sin tocar nada, pide «Hay cambios sin guardar» al cambiar de proyecto; difieren vinculos, soporte.snap y tomarInstantanea, y ya pasa en fcda936.

Detalle: recompute consume tomarInstantanea sin revisar si hay algo que proponer; las migraciones de H-267 y H-268 sí lo revisan (zs.some(tons>0), f.length). Sin captura en los motores de origen (REQUIERE_CAPTURA_PROP), estadoPropuestaCalc da cambio = true, es decir «desactualizado». Además, como la toma ocurre en recompute y no en sanearEstado, cxzSucio compara S contra sanearEstado(rec.data), que trae la marca y no la instantánea, y lo da por sucio. Corrección: tomar la instantánea sólo si PROPUESTAS['motores>soporte'].disponible(); si no, dejar usarMotores=false y capturar las bases del conteo. Además, hacer que la huella de «sucio» ignore las marcas de migración, o guardar en cuanto se consumen. Reproducción: /home/user/wt-lectura/x15/rev/codigo/expBF.mjs (bloque B) y expH.mjs.


---

## U10 · SIN VERIFICAR (verificar con prueba primero) · media · lente codigo
**Lo que la migración copia o supone al abrir queda como captura del usuario, sin origen (reglas 6 y 8)**
Dónde: index.html:24026

Escenario: Fixture anterior abierto con 63a2794: soporte.alturaTrabajo = 7.2 m (zona más alta de 6 m + 1.2 m, supuesto de la casa) y alturaEstructura = 6 m quedan como campos capturados sin ninguna marca. La partida de renta dice «Altura de trabajo 7.2 m» y la memoria «por altura de trabajo de 7.2 m». En el PDF de obra civil, los 5 renglones copiados de las zonas y del cuarto limpio aparecen con origen «capturado a mano».

Detalle: sanearEstado (24025-24026) escribe la altura supuesta en el campo de captura, y migrarCivilAutonoma (7412-7425) no guarda origen; buildCivilPdf (22679) imprime «capturado a mano» en todo renglón que no venga de un archivo. H-266 dice que sin captura no se supone ninguna altura, y el precedente de la casa (H-179, eléctrico) conserva el número pero lo marca «sin confirmar» hasta que el usuario lo capture. Corrección: marcar sinConfirmar/origen, por ejemplo «copiado al abrir (H-265/H-266): zona más alta + 1.2 m, criterio de la casa», y mostrarlo en pantalla, partida, memoria y PDF. Reproducción: /home/user/wt-lectura/x15/rev/codigo/expI.mjs.


---

## U13 · SIN VERIFICAR (verificar con prueba primero) · alta · lente dueno
**La propuesta de soportería no muestra los metros de contra incendio y todo lo atribuye a «Ductos y calibres» (tarjeta, estado desactualizado, memoria integral y cédula)**
Dónde: index.html:18194

Escenario: Contra incendio con cabezal de 30 m y montante de 12 m, sin ductos. La tarjeta dice «Ductos y calibres → Soportería · Propone 0 m de ducto (0 tramos) · 0 m de tubería hidráulica soportada como cobre · incendio 42 rociador(es) · 0 m de red de aire»: los 42 m de red que sí se van a soportar no aparecen. Después de aceptar, si el cabezal pasa a 80 m la tarjeta queda «Desactualizada» con «Se aceptó» y «Hoy propone» idénticos, así que el usuario no ve qué cambió. En la memoria integral, capítulo 5 («De dónde salieron los datos»), el origen dice «Ductos y calibres» y el valor «incendio 42 rociador(es)». La cédula de soportería (22699) no dice que los tramos vienen de una instantánea aceptada ni su fecha; sólo lo capturado a mano lleva marca.

Detalle: resumenSnapSoporte resume contra incendio en rociadores (sn.fuego.nTotal) aunque la firma compara Lram y Lmon. Además PROPUESTAS["motores>soporte"].origen está fijo en "duct" (18435). Desde H-266 esta tarjeta es la única vía para que los metros de otro motor entren a soportería, así que lo que se acepta tiene que verse. Regla 3: la versión desactualizada debe mostrar qué cambió. Regla 8: el trazado debe decir el origen verdadero. Corrección propuesta: dar metros y Ø por red (cabezal, montante, tramos), el origen por motor, y en la cédula anotar «instantánea aceptada el …» contra «capturado a mano».


---

## U14 · SIN VERIFICAR (verificar con prueba primero) · media · lente dueno
**Los permisos duct/hidro/fuego/aire → soportería ya no hacen nada y su texto describe una conducta que H-266 quitó**
Dónde: index.html:4399

Escenario: Con 35 m de ducto capturados en Ductos y calibres, el usuario autoriza «Ductos y calibres → Soportería» en Proyecto → Permisos: soportería sigue en 0 m. Luego acepta la propuesta, que concede los cuatro cruces, y revoca duct>soporte: soportería sigue contando 35 m y 18 soportes, sin ninguna marca. Aun así, el texto del permiso y el toast al negar (23692) dicen «Si lo niegas, los soportes de ducto SÍ se siguen contando y cotizando —nunca se bajan a cero—, pero la sección G queda marcada pendiente de autorizar el cruce». Los otros tres dicen lo mismo (4395-4418). «Autorizar todos los cruces» tampoco cambia nada en soportería.

Detalle: H-266 quitó linkAllowed y los avisos de computeSoporte, pero dejó los cuatro renglones en la pantalla de permisos (17114) con sus textos. Quedan como controles muertos que contradicen el modelo del dueño: «acepta el permiso de ductos y tuberías; eso va en la cuantificación». Hay dos salidas: retirarlos, como se hizo con load>civil y clean>civil, o hacer que autorizar sea aceptar la propuesta y revocar sea volver a lo capturado. En los dos casos hay que reescribir what, why y cost.


---

## U15 · SIN VERIFICAR (verificar con prueba primero) · media · lente dueno
**«Capturo lo mío» borra la instantánea ya cuantificada, sin confirmar y sin que Deshacer la recupere**
Dónde: index.html:18446

Escenario: El usuario acepta la propuesta con cabezal de 30 m (42 m soportados). Contra incendio pasa a 80 m, la tarjeta sale desactualizada y el usuario elige «Conservar lo aceptado». Después hace clic en «Capturo lo mío», el botón de al lado: S.soporte.snap se borra y quedan 0 m. Deshacer regresa a antes de aceptar (sin instantánea, 0 m), porque prop-propio no toma histSnap (23615). Si vuelve a aceptar, entran 92 m: la cantidad que se había conservado se perdió.

Detalle: El dueño decidió que lo ya cuantificado no se mueve solo, y desde H-266 la instantánea es la única vía de los metros de otros motores. H-267 puso histSnap en «prop-aceptar», pero ni «prop-propio» ni «prop-conservar» lo tienen, y propio() hace delete S.soporte.snap. Corrección propuesta: histSnap antes de propPropio y propConservar, y pedir confirmación, o guardar la instantánea anterior en lugar de borrarla.


---

## U16 · SIN VERIFICAR (verificar con prueba primero) · media · lente dueno
**Soportería manda al usuario a capturar en «Ductos y calibres», y la advertencia dice que no hay ductos aunque sí los hay**
Dónde: index.html:19061

Escenario: El usuario sigue la indicación y captura 2 tramos (35 m) en Ductos y calibres. Soportería sigue diciendo «Faltan metros de ducto o tubería que soportar · se captura en Ductos y calibres o las tuberías», con Calcular y Memoria deshabilitados. En Observaciones aparece «No hay soportes que contar: no hay ductos ni tubería calculados en los motores, ni metros capturados a mano» (8561), que es falso: hay 35 m calculados y la propuesta está «disponible».

Detalle: MOTOR_ACC.soporte.donde y el aviso de nSoportes = 0 son anteriores a H-266. Desde H-266, capturar en otro motor ya no alimenta a soportería, así que el mensaje deja al usuario dando vueltas. Debe decir que se acepte la propuesta de los motores (arriba) o que se capturen los metros en esta pestaña, y distinguir «hay metros en los motores sin aceptar» de «no hay nada».

