#!/bin/bash
# Uso: continuacion/integrar.sh <rama> — fusiona la rama en la rama actual (sin ff), corre ambos bancos y muestra el resumen.
# Sin rutas fijas: trabaja en el repositorio y la rama donde se llame. Los bancos pasan por continuacion/turno.sh (semáforo de bancos del
# contenedor, a lo sumo 3 a la vez). El commit de fusión lleva las líneas finales que pide CLAUDE.md; si la sesión tiene
# su propia línea Claude-Session, pásala en la variable CLAUDE_SESSION.
set -u
R="$1"; cd "$(git rev-parse --show-toplevel)" || exit 1
ACT=$(git rev-parse --abbrev-ref HEAD)
git rev-parse --verify "$R" >/dev/null || { echo "no existe $R"; exit 1; }
echo "== commits de $R sobre $ACT:"; git log --oneline "$ACT".."$R" | cat
PIE="Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
[ -n "${CLAUDE_SESSION:-}" ] && PIE="$PIE
Claude-Session: $CLAUDE_SESSION"
git merge --no-ff -m "Merge branch '$R' into $ACT" -m "$PIE" "$R" || { echo "== CONFLICTO"; git status --short | head; exit 2; }
B=respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
[ -f "$B" ] || { mkdir -p respaldo-rev-2.9.8; git show 7d7c2d0:index.html > "$B"; }
T=continuacion/turno.sh
echo "== banco:"; $T node pruebas.mjs index.html 2>&1 | tail -3
echo "== banco --base:"; $T node pruebas.mjs index.html --base "$B" 2>&1 | tail -3
echo "== regresión:"; (cd parches/regresion-motores && node genera.mjs >/dev/null 2>&1); git status --short parches/regresion-motores | cat
echo "(si genera.mjs sólo cambió ids o fechas del fixture: git checkout -- parches/regresion-motores/regresion-motores.emp.json)"
