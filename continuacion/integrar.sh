#!/bin/bash
# Uso: integrar.sh <rama>  — fusiona la rama en claude/pausa-desarrollo-7tz93x (sin ff), corre ambos bancos y muestra el resumen.
set -u
R="$1"; cd /home/user/emp_suite || exit 1
git rev-parse --verify "$R" >/dev/null || { echo "no existe $R"; exit 1; }
echo "== commits de $R:"; git log --oneline claude/pausa-desarrollo-7tz93x.."$R" | cat
git merge --no-ff --no-edit "$R" || { echo "== CONFLICTO"; git status --short | head; exit 2; }
[ -f respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html ] || { mkdir -p respaldo-rev-2.9.8; git show 7d7c2d0:index.html > respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html; }
echo "== banco:"; node pruebas.mjs index.html 2>&1 | tail -3
echo "== banco --base:"; node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html 2>&1 | tail -3
echo "== regresión:"; cd parches/regresion-motores && node genera.mjs >/dev/null 2>&1; cd ../..; git status --short parches/regresion-motores | cat
