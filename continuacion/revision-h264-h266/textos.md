# Revisión adversarial de H-264…H-266 (sobre 63a2794) · textos

## U12 · SIN VERIFICAR (verificar con prueba primero) · baja · lente codigo
**Quedan textos que dicen que las disciplinas heredan, o que los soportes se cuentan sin autorizar**
Dónde: index.html:19505

Escenario: Con el fixture abierto en 63a2794, el tablero dice en la misma página «cada disciplina calcula con lo que se le captura (ninguna hereda)» (19492) y, en «Instalaciones del edificio», «Heredan la geometría» (19505). El libro de la propuesta, en ES y EN, dice «ninguna hereda de otra» y a la vez «TRAZADO DE ORIGEN DE LOS VALORES HEREDADOS» (5442); en DESGLOSE_AREAS pone «Geometria del proyecto que heredan las demas disciplinas… / Project geometry inherited by the other disciplines» (5507), y en las notas «El trazado de origen de cada valor heredado…» (5910). El diálogo de permiso duct>soporte (4399) dice «Si lo niegas, los soportes de ducto SÍ se siguen contando y cotizando —nunca se bajan a cero—, pero … pendiente de autorizar», y lo mismo hidro, fuego y aire>soporte (4405, 4411, 4417). En realidad, sin instantánea mDucto = 0 y ya no existe esa marca de permiso.

Detalle: Contradice la decisión del dueño del 27-sep y el mensaje de fcda936 («la memoria integral y el libro de la propuesta lo dicen (ES/EN)»). Viola la regla 8 y el espejo ES/EN: en el mismo libro y en el mismo tablero hay dos afirmaciones opuestas. Corrección: reescribir esos textos como «cada disciplina captura su geometría» y los cost de LINKS *>soporte como «los metros entran sólo al aceptar la propuesta». Reproducción: /home/user/wt-lectura/x15/rev/codigo/expJ.mjs.


---

## U18 · SIN VERIFICAR (verificar con prueba primero) · media · lente dueno
**Textos que contradicen la decisión o mandan a otra pestaña (tablero, libro de la propuesta ES/EN, diagrama, civil) y un error de concordancia**
Dónde: index.html:19505

Escenario: En el tablero, el grupo «Instalaciones del edificio» (contra incendio, obra civil, soportería…) dice «Motores autónomos… Heredan la geometría» (19505). El libro de la propuesta que se entrega al cliente, en la hoja de desglose de áreas, dice «Geometria del proyecto que heredan las demas disciplinas: 500 m2…» / «Project geometry inherited by the other disciplines…» (5507), en el mismo libro que afirma «ninguna hereda de otra». El diagrama conserva «proyecto → civil · Alcance de obra y áreas del proyecto» con «Todavía no hay dato que heredar» (19624, 19668). En civil, la lista vacía dice «Sin áreas de obra capturados» (7400; debe ser «capturadas»), y la memoria y los avisos piden «captura el perímetro de tabiquería de cada zona» (7465) y «…de cada cuarto limpio» (7567), cuando esos perímetros se capturan en «Áreas de obra» y «Cuartos clasificados» de la misma pestaña. DOMAINS.fuego.owns no menciona el área ni la altura, y soporte.owns dice «Si cuenta de los motores o a mano» (4207, 4216).

Detalle: H-264/H-265/H-266 actualizaron la «Regla de la casa» del Excel y la portada de la memoria integral, pero no estos textos. Los tres aparecen en pantalla o en entregables al cliente (regla 7 ES/EN, regla 8) y le dicen al usuario que las disciplinas heredan o que tiene que ir a Carga térmica o a Cuartos limpios. No hay «HVAC» fuera de clima ni nombres de clientes en lo agregado.

