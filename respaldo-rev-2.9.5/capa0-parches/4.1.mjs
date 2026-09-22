// Caso 4.1 · Un respaldo con el cuarto limpio en el formato viejo (un solo
// cuarto, sin rooms[]) pierde lo capturado al abrirse: sanearEstado lo
// reemplaza por defaultRoom() antes de que cleanRooms() lo migre.
// Uso: node casos/4.1.mjs <html>
import { cargar, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);

/* Cuarto capturado con el formato viejo, el mismo que declara defaultState().clean. */
const cuartoViejo = { name: "Sala de llenado", iso: "iso6", level: "max", area: 120, height: 3, dp: 15, crackLen: 10, oaFrac: 0.15, occ: 8, procW: 40 };
const respaldo = { ...JSON.parse(JSON.stringify(G("defaultState")())), meta: { name: "Respaldo viejo", client: "", location: "", engineer: "", date: "2026-01-01" }, clean: cuartoViejo, pid: null, linaje: null };

/* 1) El saneador directo (lo usan abrir, importar, duplicar, plantilla, referencia). */
const s = G("sanearEstado")(JSON.parse(JSON.stringify(respaldo)));
const r0 = (s.clean && Array.isArray(s.clean.rooms) && s.clean.rooms[0]) || {};

/* 2) El camino real del usuario: importar el respaldo .json. */
G("importarRespaldo")(JSON.stringify(respaldo));
G("recompute")();
const S = G("S");
const c0 = S.clean.rooms[0];
const CL = G("CLEAN");

/* Referencia: lo que la migración propia del código (cleanRooms) produce con el mismo cuarto. */
const migrado = { ...G("defaultRoom")(cuartoViejo.name), ...cuartoViejo };
const ref = G("computeClean")(migrado);

imprime({
  caso: "4.1",
  valor: c0.area,
  detalle: {
    saneado: { name: r0.name, iso: r0.iso, level: r0.level, area: r0.area, height: r0.height, dp: r0.dp, occ: r0.occ, procW: r0.procW },
    importado: { cuartos: S.clean.rooms.length, name: c0.name, iso: c0.iso, level: c0.level, area: c0.area, height: c0.height, dp: c0.dp, occ: c0.occ, procW: c0.procW },
    CLEAN_sum: { area: CL.sum.area, vol: +CL.sum.vol.toFixed(3), supply: +CL.sum.supply.toFixed(3), ffu: CL.sum.ffu },
    esperado_por_migracion: { area: ref.area, vol: +ref.vol.toFixed(3), supply: +ref.supply.toFixed(3), ffu: ref.ffu },
    errores: w.__errs,
  },
});
process.exit(0);
