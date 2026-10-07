"""Calibre de ducto redondo: ROUND_G actual de index.html contra SMACNA HVAC-DCS 1995, TABLE 3-2A.

Uso:  python scripts/calibres_redondo_smacna.py [ruta/index.html]

Imprime, para cada diámetro de la serie STD_ROUND del motor de ductos y cada clase de presión de la suite, el calibre
que da hoy ROUND_G y el que da la TABLE 3-2A en sus dos columnas de costura (espiral y longitudinal).

Supuestos (se imprimen también en la salida):
  S1  Norma: SMACNA HVAC Duct Construction Standards, Metal and Flexible, 2nd Ed. 1995 + Addendum No. 1 (1997),
      TABLE 3-2A «Round duct gage unreinforced positive pressure», pág. 3.3 (normas/smacna1995_tabla3-2A.json).
  S2  Conversión mm -> in: 1 in = 25.4 mm exactos (NIST SP 811, 2008, App. B.8).
  S3  Renglón: el primero cuyo «MAX. DIA.» sea >= al diámetro en pulgadas (la tabla sólo imprime el máximo).
  S4  Columna de presión: la de menor presión tabulada (+2, +4, +10 in w.g.) que sea >= a la clase de la suite.
      Así ½" y 1" usan +2"; 3" usa +4"; 6" usa +10". Es lectura propia («supuesto propio»): la tabla no trae
      columnas de ½", 1", 3" ni 6".
  S5  Diámetro mayor a 84 in o clase mayor a 10 in w.g.: fuera de tabla (None).
  S6  Sólo presión positiva. La TABLE 3-2B (negativa) no se usa aquí.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MM_POR_IN = 25.4  # S2
COLS_P = [2, 4, 10]  # S4: columnas de presión de la TABLE 3-2A, in w.g.


def leer_suite(ruta):
    html = Path(ruta).read_text(encoding="utf-8")
    m = re.search(r"const ROUND_G = \[(.*?)\];", html, re.S)
    clases = []
    for c, b in re.findall(r'\{ c: "([\d.]+)", b: (\[\[.*?\]\])', m.group(1)):
        clases.append((c, json.loads(b)))
    serie = json.loads(re.search(r"const STD_ROUND = (\[[^\]]*\]);", html).group(1))
    return clases, serie


def gauge_suite(tramos, d_in):
    for mx, g in tramos:
        if d_in <= mx:
            return g
    return tramos[-1][1]


def gauge_3_2a(tabla, d_in, clase, costura):
    col_p = next((p for p in COLS_P if p >= float(clase)), None)
    if col_p is None:
        return None
    col = f"p{col_p}_{costura}"
    for r in tabla["renglones"]:
        if d_in <= r["diametro_max_in"]:
            return r["calibres"][col]
    return None  # S5


def main():
    ruta = sys.argv[1] if len(sys.argv) > 1 else RAIZ / "index.html"
    tabla = json.loads((RAIZ / "normas" / "smacna1995_tabla3-2A.json").read_text(encoding="utf-8"))
    clases, serie = leer_suite(ruta)
    print("Supuestos:" + __doc__.split("Supuestos (se imprimen también en la salida):")[1])
    print("Unidades: diámetro en mm (serie STD_ROUND) y en in; clase en in w.g.; calibre = número de calibre (gage).")
    print("Columnas: suite = ROUND_G hoy · esp = 3-2A costura espiral · lon = 3-2A costura longitudinal.\n")
    cab = "  D mm   D in | " + " | ".join(f'{c:>4}" suite/esp/lon' for c, _ in clases)
    print(cab)
    print("-" * len(cab))
    difs = {"esp": 0, "lon": 0}
    celdas = 0
    for d in serie:
        d_in = d / MM_POR_IN
        fila = []
        for c, tramos in clases:
            s = gauge_suite(tramos, d_in)
            e = gauge_3_2a(tabla, d_in, c, "spiral")
            l = gauge_3_2a(tabla, d_in, c, "long")
            celdas += 1
            difs["esp"] += s != e
            difs["lon"] += s != l
            fila.append(f"{s:>9}/{e if e is not None else '-':>3}/{l if l is not None else '-':>3}")
        print(f"{d:>6} {d_in:6.2f} | " + " | ".join(fila))
    print(f"\nCeldas: {celdas}. Distintas de la suite: espiral {difs['esp']}, longitudinal {difs['lon']}.")


if __name__ == "__main__":
    main()
