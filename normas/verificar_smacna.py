"""verificar_smacna.py — comprueba las tablas SMACNA de ducto redondo transcritas a JSON.

Uso:  python normas/verificar_smacna.py [--suite]

También comprueba las tablas de ducto rectangular TABLES 1-3 a 1-9 y 1-24 (ver rectangulares()).

Norma: SMACNA HVAC Duct Construction Standards, Metal and Flexible, 2nd Ed. 1995, Addendum No. 1 (1997);
TABLE 3-2A (pág. 3.3), TABLE 3-2B (pág. 3.5), TABLE 3-3 (pág. 3.7).

Comprobaciones:
  1. Estructura: campos obligatorios; hash del archivo fuente igual al citado en el JSON.
  2. Diámetros: máximo estrictamente creciente; donde el original imprime rango (mín-máx), el mínimo es el máximo anterior
     + 1 in (continuidad en pulgadas enteras) y no traslapa.
  3. Tipos: calibres enteros o null (3-2A, 3-2B); espesores decimales o null (3-3).
  4. Monotonía por columna: a mayor diámetro el calibre no es más delgado (número de calibre no crece; espesor no baja).
     Si el original lo contradice, se REPORTA, no se corrige.
  5. Cotejo celda por celda contra la tabla del HTML (normas/smacna.duct.1995.html). Diferencias ya documentadas en
     «observaciones» del JSON se marcan como documentadas.
  6. (--suite) Compara la tabla ROUND_G de index.html (motor de ductos) contra TABLE 3-2A.

Supuestos (propios, no de la norma): la continuidad de rangos se evalúa en pulgadas enteras, porque la tabla imprime
diámetros nominales enteros; el signo y la costura de cada columna salen del encabezado impreso.
"""
import hashlib
import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
TABLAS = {"3-2A": "smacna1995_tabla3-2A.json", "3-2B": "smacna1995_tabla3-2B.json", "3-3": "smacna1995_tabla3-3.json"}
CAPTION = {"3-2A": "TABLE 3-2A ROUND DUCT GAGE UNREINFORCED POSITIVE PRESSURE",
           "3-2B": "TABLE 3-2B ROUND DUCT GAGE NEGATIVE PRESSURE",
           "3-3": "TABLE 3-3 ALUMINUM ROUND DUCT GAGE SCHEDULE"}
errores, avisos = [], []


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


class Tablas(HTMLParser):
    """Recoge cada <table> con su <caption> y sus celdas <td> por renglón."""
    def __init__(self):
        super().__init__(); self.tablas = []; self._t = None; self._fila = None; self._celda = None; self._cap = None
    def handle_starttag(self, tag, attrs):
        if tag == "table": self._t = {"caption": "", "filas": []}
        elif tag == "caption" and self._t is not None: self._cap = []
        elif tag == "tr" and self._t is not None: self._fila = []
        elif tag == "td" and self._fila is not None: self._celda = []
    def handle_endtag(self, tag):
        if tag == "caption" and self._cap is not None: self._t["caption"] = " ".join("".join(self._cap).split()); self._cap = None
        elif tag == "td" and self._celda is not None: self._fila.append(" ".join("".join(self._celda).split())); self._celda = None
        elif tag == "tr" and self._fila is not None:
            if self._fila: self._t["filas"].append(self._fila)
            self._fila = None
        elif tag == "table" and self._t is not None: self.tablas.append(self._t); self._t = None
    def handle_data(self, d):
        if self._cap is not None: self._cap.append(d)
        if self._celda is not None: self._celda.append(d)


def norm(s):
    s = html.unescape(s or "").replace(" ", " ").replace("″", '"').replace("×", "x")
    return " ".join(s.split())


def celda_json(t, r, cid):
    if t == "3-3":
        return r["texto_celdas"][cid]
    g = r["calibres"][cid]
    if g is None: return ""
    ref = (r.get("refuerzo") or {}).get(cid)
    return f"{g} {ref}" if ref else str(g)


def main():
    print("Unidades: diámetro en in; presión en in w.g.; 3-2A/3-2B en número de calibre; 3-3 en espesor (in).")
    print("Supuesto propio: continuidad de rangos en pulgadas enteras (diámetros nominales enteros en la tabla).\n")
    fuente = {"pdf": RAIZ / "smacna.duct.1995.pdf", "html": RAIZ / "smacna.duct.1995.html"}
    hashes = {k: sha256(p) if p.exists() else None for k, p in fuente.items()}
    parser = Tablas(); parser.feed(fuente["html"].read_text(encoding="utf-8"))
    html_tab = {c["caption"]: c for c in parser.tablas}
    resumen = {}
    for t, nombre in TABLAS.items():
        J = json.loads((RAIZ / nombre).read_text(encoding="utf-8"))
        print(f"== TABLE {t} ({J['titulo']}), pág. {J['pagina']}")
        # 1. estructura y hash
        for campo in ("norma", "tabla", "titulo", "pagina", "fuente", "unidades", "columnas", "renglones", "notas"):
            if campo not in J: errores.append(f"{t}: falta el campo {campo}")
        for k, h in hashes.items():
            if h and h not in J["fuente"]: errores.append(f"{t}: el hash del {k} ({h[:12]}…) no está citado en «fuente»")
        cols = [c["id"] for c in J["columnas"]]
        R = J["renglones"]
        # 2. diámetros
        prev = None
        for r in R:
            mx, mn = r["diametro_max_in"], r["diametro_min_in"]
            if prev is not None and not (mx > prev): errores.append(f"{t} {r['diametro_texto']}: máximo no creciente")
            if mn is not None:
                if mn > mx: errores.append(f"{t} {r['diametro_texto']}: mínimo > máximo")
                if prev is not None and mn <= prev: errores.append(f"{t} {r['diametro_texto']}: traslapa con el renglón anterior")
                if prev is not None and mn != prev + 1: avisos.append(f"{t} {r['diametro_texto']}: hueco o salto de {prev} a {mn} in")
            prev = mx
        # 3. tipos y 4. monotonía
        nulls = 0
        for c in cols:
            ult = None
            for r in R:
                v = (r["espesores_in"] if t == "3-3" else r["calibres"])[c]
                if v is None: nulls += 1; continue
                if t == "3-3":
                    if not isinstance(v, float): errores.append(f"{t} {r['diametro_texto']} {c}: espesor no decimal ({v!r})")
                    if ult is not None and v < ult: avisos.append(f"{t} {c} {r['diametro_texto']}: espesor {v} menor que el anterior {ult} (original)")
                else:
                    if not isinstance(v, int) or isinstance(v, bool): errores.append(f"{t} {r['diametro_texto']} {c}: calibre no entero ({v!r})")
                    if ult is not None and v > ult:
                        ref = (r.get("refuerzo") or {}).get(c)
                        avisos.append(f"{t} {c} {r['diametro_texto']}: calibre {v} más delgado que el anterior {ult}"
                                      + (f" (el original lo acompaña de refuerzo {ref})" if ref else " (sin refuerzo: revisar)"))
                ult = v
        # 5. cotejo contra el HTML
        H = html_tab.get(CAPTION[t])
        dif = []
        if not H: errores.append(f"{t}: no se encontró la tabla en el HTML")
        else:
            filas = [f for f in H["filas"] if len(f) == len(cols) + 1]
            if len(filas) != len(R): errores.append(f"{t}: el HTML tiene {len(filas)} renglones y el JSON {len(R)}")
            obs = " ".join(J.get("observaciones", []) + [r.get("nota") or "" for r in R])
            for r, f in zip(R, filas):
                if norm(f[0]) != norm(r["diametro_texto"]): dif.append((r["diametro_texto"], "diámetro", norm(f[0]), r["diametro_texto"]))
                for c, txt in zip(cols, f[1:]):
                    a, b = norm(txt), norm(celda_json(t, r, c))
                    if a != b: dif.append((r["diametro_texto"], c, a, b))
            for d in dif:
                doc = f"«{d[2]}»" in obs or (d[2] in obs and d[3] in obs)
                (avisos if doc else errores).append(f"{t} {d[0]} {d[1]}: HTML «{d[2]}» · JSON «{d[3]}»" + (" (documentada)" if doc else " (NO documentada)"))
        n = len(R) * len(cols)
        resumen[t] = (len(R), len(cols), n, nulls, len(dif))
        print(f"   renglones {len(R)} · columnas {len(cols)} · celdas {n} · null {nulls} · difieren del HTML {len(dif)}")
    rectangulares(hashes)
    if "--suite" in sys.argv: suite(json.loads((RAIZ / TABLAS["3-2A"]).read_text(encoding="utf-8")))
    print("\nAVISOS (se reportan, no se corrigen):"); [print("  -", a) for a in avisos] or print("  (ninguno)")
    print("ERRORES:"); [print("  -", e) for e in errores] or print("  (ninguno)")
    return 1 if errores else 0


def suite(A):
    """Compara ROUND_G de index.html (clases 2, 4 y 10 in w.g.) contra TABLE 3-2A, por diámetro nominal entero."""
    ix = RAIZ.parent / "index.html"
    src = ix.read_text(encoding="utf-8")
    m = re.search(r"const ROUND_G = \[(.*?)\];", src, re.S)
    if not m: print("\n--suite: no se encontró ROUND_G en index.html"); return
    linea = src[:m.start()].count("\n") + 1
    bandas = {c: [tuple(map(int, x)) for x in re.findall(r"\[(\d+), (\d+)\]", b)] for c, b in re.findall(r'c: "([\d.]+)", b: \[(.*?)\], j:', m.group(1))}
    print(f"\n== Suite: ROUND_G (index.html:{linea}) contra TABLE 3-2A (positiva; ROUND_G no distingue signo ni costura)")
    print("   diámetro · clase · suite · SMACNA spiral / long · diferencia (en números de calibre; + = suite más gruesa)")
    for clase, col in (("2", "p2"), ("4", "p4"), ("10", "p10")):
        for r in A["renglones"]:
            d = r["diametro_max_in"]
            g = next((g for mx, g in bandas[clase] if d <= mx), bandas[clase][-1][1])
            s, l = r["calibres"][f"{col}_spiral"], r["calibres"][f"{col}_long"]
            print(f"   {r['diametro_texto']:>7} · {clase:>2}\" · {g:>2} · {s:>2} / {l:>2} · spiral {s - g:+d}, long {l - g:+d}")
    print(f"   Clases de ROUND_G sin tabla en SMACNA 3-2A/3-2B: {[c for c in bandas if c not in ('2', '4', '10')]}")
    print(f"   Diámetro máximo de TABLE 3-2A: 84 in; ROUND_G extiende su última banda hasta 999 in.")


RECT = {"1-3": 0.5, "1-4": 1, "1-5": 2, "1-6": 3, "1-7": 4, "1-8": 6, "1-9": 10}
COL_1_24 = {0.5: "p0_5", 1: "p1", 2: "p2", 3: "p3", 4: "p4", 6: "p6", 10: "p10"}
CALIBRES = {28, 26, 24, 22, 20, 18, 16, 14, 12, 10}
ESTADOS = {"valor", "no_requerido", "no_disenado", "en_blanco", "flecha"}


def rectangulares(hashes):
    """TABLES 1-3 a 1-9 (pág. 1.18-1.30) y 1-24 (pág. 1.69), ducto rectangular. El cotejo celda por celda contra el HTML
    se hizo al transcribir (diferencias en «observaciones»); aquí se comprueba la coherencia interna:
      R1 estructura y hash citado; R2 dimensiones crecientes y continuas (pulgadas enteras, supuesto propio);
      R3 estados válidos, calibre entero de la serie y clase de refuerzo A-L sólo en celdas «valor»;
      R4 «texto» coincide con calibre, clase, tirante y clase alterna (nota al pie de cada tabla);
      R5 la columna «sin refuerzo» de cada tabla coincide con su clase en la TABLE 1-24 (§1.8.2: la 1-24 la resume)."""
    print("\n== Ducto rectangular: TABLES 1-3 a 1-9 y 1-24 (unidades: lado mayor en in; espaciado en ft; calibre gage)")
    T24 = json.loads((RAIZ / "smacna1995_tabla1-24.json").read_text(encoding="utf-8"))
    def en_24(clase, x):
        for r in T24["renglones"]:
            if (r["dim_min_in"] or 0) <= x <= r["dim_max_in"] or (r["dim_min_in"] is None and x <= r["dim_max_in"]):
                c = r["celdas"][COL_1_24[clase]]
                return c["calibre"] if c["estado"] == "valor" else None
        return None
    for t, clase in RECT.items():
        J = json.loads((RAIZ / f"smacna1995_tabla{t}.json").read_text(encoding="utf-8"))
        for k, h in hashes.items():
            if h and h not in J["fuente"]: errores.append(f"{t}: el hash del {k} no está citado en «fuente»")
        if J.get("clase_presion_inwg") != clase: errores.append(f"{t}: clase {J.get('clase_presion_inwg')} ≠ {clase}")
        cols = [c["id"] for c in J["columnas"]]
        prev, n, dif24 = None, 0, 0
        for r in J["renglones"]:
            mx, mn = r["dim_max_in"], r["dim_min_in"]
            if prev is not None and not mx > prev: errores.append(f"{t} {r['dimension_texto']}: dimensión no creciente")
            if prev is not None and mn is not None and mn != prev + 1: avisos.append(f"{t} {r['dimension_texto']}: salto de {prev} a {mn} in")
            for cid in cols:
                c = r["celdas"][cid]; n += 1
                if c["estado"] not in ESTADOS: errores.append(f"{t} {r['dimension_texto']} {cid}: estado {c['estado']!r}")
                if c["estado"] == "valor":
                    if c["calibre"] not in CALIBRES: errores.append(f"{t} {r['dimension_texto']} {cid}: calibre {c['calibre']!r}")
                    if cid == "sin_refuerzo":
                        if not re.fullmatch(rf"{c['calibre']} ga\.", c["texto"]): errores.append(f"{t} {r['dimension_texto']} {cid}: texto {c['texto']!r}")
                    else:
                        m = re.fullmatch(r"([A-L])(t?)-(\d+)([A-L]?)", c["texto"])
                        if not m or m[1] != c["clase_refuerzo"] or int(m[3]) != c["calibre"] or (m[4] or None) != c.get("clase_alterna_tirante")                                 or bool(m[2]) != c.get("tirante_obligatorio") or c["tirante"] != bool(m[2] or m[4]):
                            errores.append(f"{t} {r['dimension_texto']} {cid}: «{c['texto']}» no coincide con sus campos")
                elif c.get("calibre") is not None: errores.append(f"{t} {r['dimension_texto']} {cid}: calibre en celda {c['estado']}")
            for x in range((mn or (prev or 0) + 1), mx + 1):
                c = r["celdas"]["sin_refuerzo"]; v = c["calibre"] if c["estado"] == "valor" else None
                if v != en_24(clase, x): dif24 += 1; errores.append(f"{t} {x} in: sin refuerzo {v} ≠ TABLE 1-24 {en_24(clase, x)}")
            prev = mx
        print(f"   TABLE {t} ({clase}\" w.g., pág. {J['pagina']}): renglones {len(J['renglones'])} · celdas {n} · difieren de la 1-24 {dif24}")


if __name__ == "__main__":
    sys.exit(main())
