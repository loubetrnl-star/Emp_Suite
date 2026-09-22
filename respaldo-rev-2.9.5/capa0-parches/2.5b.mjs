import { cargar, proyectoBase, imprime } from "./_carga.mjs";
const w = await cargar(process.argv[2]); const G = (e) => w.eval(e); const S = proyectoBase(w);
const sn = G("snapshotSoporte")();
const acero = { ...sn, hidroMat: "acero" }, cobre = { ...sn, hidroMat: "cobre" };
const ra = G("resumenSnapSoporte")(acero), rc = G("resumenSnapSoporte")(cobre);
imprime({ caso: "2.5b", valor: { distinguen_material: ra !== rc }, detalle: { acero: ra, cobre: rc, snapHidroMat: sn.hidroMat } });
process.exit(0);
