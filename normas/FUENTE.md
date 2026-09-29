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
Con `--suite` compara además con `ROUND_G` de `index.html`.
