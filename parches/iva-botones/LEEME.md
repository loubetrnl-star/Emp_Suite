# Parche · botones de IVA de la cotización

Aplicado el 14-sep-2026 sobre la 2.9.6.1, que queda como **rev 2.9.6.2**.
Respaldo previo: `respaldo-rev-2.9.6/index-2.9.6.1-con-iva-mal-etiquetada-20260914-235941.html`.

## Defecto
Los tres chips de IVA en la pantalla de cotización ("8 % franja fronteriza", "16 % nacional", "Exento") guardaban su valor en el atributo `data-val`. El manejador `setnum` (compartido con otros botones de la app) lee `data-v`. Al hacer clic en cualquiera de los tres, `parseFloat(undefined)` daba `NaN`, que se escribía en `S.quote.iva`. El total quedaba mal y, al autoguardar (que convierte `NaN` a `null`), el rótulo terminaba imprimiendo "IVA 0 %".

## Arreglo
- Los tres chips ahora usan `data-v`, igual que el resto de los botones `setnum` de la suite.
- El manejador `setnum` ignora cualquier clic cuyo valor no sea un número finito — no vuelve a poder escribir `NaN` en ningún campo, aunque algún botón futuro se declare sin valor por error.

## Reaplicar
```
node iva-botones.mjs index.html index-nuevo.html
node iva-botones.mjs --banco pruebas.mjs pruebas-nuevo.mjs
```
Bump automático de `REV` (x.y.z(.n) → x.y.z.(n+1)) y de `REV_NOTA`. Probado limpio sobre la 2.9.6.1 y sobre una copia de la 2.9.7.

## Verificación
- Prueba nueva **I.1**: pulsa los tres botones en secuencia (incluida una vuelta a 8 %), confirma que `S.quote.iva` queda en el número exacto, que `QUOTE.iva` se recalcula con ese valor, que solo un botón queda marcado "on", y que un botón `setnum` sin valor no toca nada.
- Control: el banco nuevo corrido contra el índice sin el arreglo falla en I.1 (guardaba `null` en vez de `0.08`), confirmando que la prueba detecta el defecto real.
- Banco completo en la 2.9.6.2: 230 de 230 (las 229 anteriores + I.1).
- Copia de la 2.9.7 con este parche y el de contingencia: 288 de 296 — mismos 8 pendientes de la contingencia (líneas base y fixture del caso, ver `parches/contingencia/LEEME.md`), ninguno nuevo.
