# Fuente de las tablas SMACNA de ducto redondo

| Campo | Valor |
|---|---|
| Norma | SMACNA, *HVAC Duct Construction Standards — Metal and Flexible*, Second Edition, 1995, with Addendum No. 1, November 1997 |
| Impresión | Fourth Printing, November 1998 (página legal del documento) |
| Publicación | Public.Resource.Org, material incorporado por referencia (IBR) en el CFR de EE. UU. |
| Descarga | 2026-09-29 06:17 UTC, con Python `requests` 2.32.3 |

## Archivos

| Archivo | URL | Tamaño (bytes) | SHA-256 |
|---|---|---|---|
| `normas/smacna.duct.1995.pdf` | https://law.resource.org/pub/us/cfr/ibr/005/smacna.duct.1995.pdf | 11,080,905 | `074d19f86c65d819d9a2e97c9e954af81c79dfac157572593c70ce352f97a5b5` |
| `normas/smacna.duct.1995.html` | https://law.resource.org/pub/us/cfr/ibr/005/smacna.duct.1995.html | 1,196,032 | `0bab514ac5fa5e50d623c650f4153218c094fda8e797657d3e316c9bccc0db68` |

## Cuál manda

- **El PDF es un escaneo del impreso:** 307 de sus 308 páginas no traen capa de texto. Las tablas se transcribieron de la imagen
  renderizada con `pypdfium2` 4.30.0, a 144 ppp y a 288 ppp en los acercamientos.
- **El HTML es una transcripción de Public.Resource.Org** y se usó como segunda fuente independiente para cotejar celda por
  celda. Cuando las dos fuentes difieren, manda la imagen del PDF. Cada diferencia queda en `observaciones` del JSON.
- **Los marcadores de página del HTML van al pie de cada página.** Por ejemplo, `<span class="page">3.2</span>` cierra la
  página 3.2. Se confirmó contra el pie de página impreso en el PDF.

| Tabla | Página impresa | Página del archivo PDF | JSON |
|---|---|---|---|
| TABLE 3-2A ROUND DUCT GAGE UNREINFORCED POSITIVE PRESSURE | 3.3 | 139 | `smacna1995_tabla3-2A.json` |
| TABLE 3-2B ROUND DUCT GAGE NEGATIVE PRESSURE | 3.5 | 141 | `smacna1995_tabla3-2B.json` |
| TABLE 3-3 ALUMINUM ROUND DUCT GAGE SCHEDULE | 3.7 | 143 | `smacna1995_tabla3-3.json` |
| TABLE 1-3 RECTANGULAR DUCT REINFORCEMENT (½" w.g. static pos. or neg.) | 1.18 | 38 | `smacna1995_tabla1-3.json` |
| TABLE 1-4 RECTANGULAR DUCT REINFORCEMENT (1" w.g. static pos. or neg.) | 1.20 | 40 | `smacna1995_tabla1-4.json` |
| TABLE 1-5 RECTANGULAR DUCT REINFORCEMENT (2" w.g. static pos. or neg.) | 1.22 | 42 | `smacna1995_tabla1-5.json` |
| TABLE 1-6 RECTANGULAR DUCT REINFORCEMENT (3" w.g. static pos. or neg.) | 1.24 | 44 | `smacna1995_tabla1-6.json` |
| TABLE 1-7 RECTANGULAR DUCT REINFORCEMENT (4" w.g. static pos. or neg.) | 1.26 | 46 | `smacna1995_tabla1-7.json` |
| TABLE 1-8 RECTANGULAR DUCT REINFORCEMENT (6" w.g. static pos. or neg.) | 1.28 | 48 | `smacna1995_tabla1-8.json` |
| TABLE 1-9 RECTANGULAR DUCT REINFORCEMENT (10" w.g. static pos. or neg.) | 1.30 | 50 | `smacna1995_tabla1-9.json` |
| TABLE 1-24 UNREINFORCED DUCT (WALL THICKNESS) | 1.69 | 89 | `smacna1995_tabla1-24.json` |

**Capítulo 1 (ducto rectangular, transcrito el 2026-10-07):** página impresa 1.n = página n + 20 del archivo (comprobado con el
pie impreso en 1.16–1.30, 1.67 y 1.69). El índice impreso del propio libro dice «TABLE 1-9 … 1.23»; es errata del original
(el pie de la página y el HTML dicen 1.30). Cada celda trae `estado` (valor, no_requerido, no_disenado, en_blanco, flecha),
calibre, clase de refuerzo (A–L), tirante, clase alterna con tirante y si el tirante es obligatorio («t»), con el texto tal
como se imprime. El HTML no distingue los recuadros «NOT REQUIRED», «NOT DESIGNED» y las celdas en blanco: se asignaron por
las líneas del escaneo. El OCR del HTML escribe el dígito «1» en lugar de la letra «I» de la clase de refuerzo (1-3: 6 celdas;
1-9: 1 celda); manda la imagen. Celdas revisadas por el principal sobre el escaneo: 1-9, 13-14″ / 10′ queda dentro del
recuadro «NOT REQUIRED» aunque la columna 2 del mismo renglón está en «NOT DESIGNED» (se transcribe tal cual); 1-5, 10′ en
11-14″ igual. Las tablas métricas 1-3M a 1-9M y 1-24M no se transcribieron. **Pendiente:** el Addendum No. 1 trata de los
tirantes a medio panel (MPT) del capítulo 1; falta revisar en el escaneo si modifica alguna celda de las tablas 1-3 a 1-9.

En esta edición no existe una «Table 3-2» a secas. Las tablas métricas, TABLE 3-2AM (pág. 3.4) y 3-2BM (pág. 3.6), dan
espesores en mm y no se transcribieron en este paso.

## Addendum No. 1

El Addendum No. 1 (nov 1997) trata de los tirantes a medio panel (MPT) del capítulo 1. Una búsqueda de texto en su sección
del HTML no encuentra mención de las tablas 3-2A, 3-2B ni 3-3. Confianza media-alta: la búsqueda se hizo sobre la
transcripción, no sobre el escaneo del addendum.

## Verificación

```
python normas/verificar_smacna.py
```

El script comprueba estructura, continuidad de diámetros, tipos y monotonía, y coteja cada celda contra la tabla del HTML.
Con `--suite` compara además con `ROUND_G` de `index.html`. Para las tablas rectangulares comprueba estructura, hash citado, estados, calibres y clases válidos, que el texto
de cada celda coincida con sus campos y que la columna «sin refuerzo» de 1-3 a 1-9 coincida con la TABLE 1-24.
