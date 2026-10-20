# elec · mutantes no concluyentes corridos uno a uno (`--solo`)

Corridas del 18 y 19-oct-2026 sobre `master` en 55e62a4 (árbol limpio, igual a `origin/master`; elec con 155 mutantes tras
retirar m100, m101 y m127), con `node parches/mutantes/mutantes.mjs elec --solo <id> --dir %TEMP%\emp-mut\solo-elec`, un
mutante a la vez, desde un guion temporal (`%TEMP%\emp-mut\uno.sh`, fuera del repo). Antes de cada mutante se midió la
memoria libre y no se lanzaba el banco con menos de 4,096 MB (umbral del dueño). Un MUERTO sin conteo «N/622» no vale y se
repite hasta 3 veces. Sólo se corrieron mutantes de elec; no se tocó código ni pruebas.

**Estado: completo.** Los 20 murieron con conteo y con pruebas nombradas, al primer intento. Ninguno quedó sin concluir.

| Mutante | Resultado | Pruebas que lo matan | Intentos |
|---|---|---|---|
| elec.m82 | MUERTO 621/622 | S.50 | 1 |
| elec.m129 | MUERTO 621/622 | S.52 | 1 |
| elec.m141 | MUERTO 619/622 | S.103, S.186, S.199 | 1 |
| elec.m142 | MUERTO 621/622 | S.150 | 1 |
| elec.m143 | MUERTO 621/622 | S.151 | 1 |
| elec.m144 | MUERTO 621/622 | S.152 | 1 |
| elec.m145 | MUERTO 621/622 | S.152 | 1 |
| elec.m146 | MUERTO 621/622 | S.153 | 1 |
| elec.m147 | MUERTO 621/622 | S.153 | 1 |
| elec.m148 | MUERTO 621/622 | S.154 | 1 |
| elec.m149 | MUERTO 621/622 | S.154 | 1 |
| elec.m150 | MUERTO 621/622 | S.200 | 1 |
| elec.m151 | MUERTO 619/622 | S.45 y dos más (la salida se recortó a 230 caracteres; no se volvió a correr porque había 3,628 MB libres) | 1 |
| elec.m152 | MUERTO 620/622 | S.238, S.240 | 1 |
| elec.m153 | MUERTO 620/622 | S.238, S.240 | 1 |
| elec.m154 | MUERTO 620/622 | S.238, S.240 | 1 |
| elec.m155 | MUERTO 621/622 | S.240 | 1 |
| elec.m156 | MUERTO 621/622 | S.240 | 1 |
| elec.m157 | MUERTO 621/622 | S.240 | 1 |
| elec.m158 | MUERTO 621/622 | S.240 | 1 |

## Los otros cuatro no concluyentes de la corrida completa (18-oct-2026, mismo método)

| Mutante | Resultado | Pruebas que lo matan | Intentos |
|---|---|---|---|
| elec.m26 | MUERTO 620/622 | R.4, CM.elec.8 | 1 |
| elec.m36 | MUERTO 618/622 | S.46, S.194, R.4, CM.elec.5 | 1 |
| elec.m68 | MUERTO 616/622 | S.50, 22.4, R.1, R.4, CM.elec.3, CM.elec.14 | 1 |
| elec.m73 | MUERTO 620/622 | S.50, S.52 | 1 |

## Compuerta de elec
- Corrida completa del 12/13-oct-2026 (158 mutantes): 131 muertos con conteo; 3 vivos (m100, m101 y m127, retirados el
  18-oct-2026 por inalcanzables desde H-306, ver `parches/mutantes/LEEME.md`); 24 «MUERTO» sin conteo por presión de memoria.
- Los 24 se repitieron con `--solo` (las dos tablas de arriba): todos muertos con conteo.
- Resultado: 155 mutantes, 0 vivos, 0 no concluyentes. Compuerta de elec en verde.
- `mutantes.mjs` lista como máximo 6 pruebas por mutante; las listas de arriba son las que imprimió.
- Memoria libre al cierre: 3,678 MB.
