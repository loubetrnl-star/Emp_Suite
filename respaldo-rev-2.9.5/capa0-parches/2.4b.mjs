import { cargar, proyectoBase, imprime } from "./_carga.mjs";
const w = await cargar(process.argv[2]); const G = (e) => w.eval(e); const S = proyectoBase(w);
const out = {};
for (const fuente of ["cisterna", "municipal"]) {
  S.fuego.riesgo = "extra1"; S.fuego.fuente = fuente; S.fuego.presFuente = 90; G("recompute")();
  const F = G("FUEGO");
  const av = F.avisos.filter((a) => /bomba mayor|5,000 L\/min/.test(a.msg));
  out[fuente] = { qTotal: Math.round(F.qTotal), qBomba: F.qBomba, hp: F.hpBomba, alcanza: F.alcanza, aviso: av.map((a) => a.lvl + ": " + a.msg) , mencionaHP: av.some((a) => /HP/.test(a.msg)), mencionaPartida: av.some((a) => /partida/.test(a.msg)) };
}
imprime({ caso: "2.4b", valor: { municipal_menciona_HP_o_partida: out.municipal.mencionaHP || out.municipal.mencionaPartida }, detalle: out });
process.exit(0);
