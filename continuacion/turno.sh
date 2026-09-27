#!/bin/bash
# turno.sh <comando...> — corre el comando con a lo sumo TURNOS bancos a la vez en todo el contenedor (por omisión 3).
# Uso: continuacion/turno.sh node pruebas.mjs index.html   |   continuacion/turno.sh node parches/mutantes/mutantes.mjs vent --solo vent.m10
# Desde el commit «Banco · 18.10, 18.16 y 18.19 …» varios bancos simultáneos ya no dan fallos falsos; el tope sólo reparte CPU
# (deja un núcleo a los agentes). Los candados viven en /tmp/turnos-banco (uno por lugar).
L=/tmp/turnos-banco; mkdir -p "$L"; N=${TURNOS:-3}
while :; do
  for s in $(seq 1 "$N"); do
    exec 9>"$L/lugar$s"
    if flock -n 9; then "$@"; rc=$?; flock -u 9; exec 9>&-; exit $rc; fi
    exec 9>&-
  done
  sleep 3
done
