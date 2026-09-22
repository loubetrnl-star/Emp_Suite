// Caso 2.1 · Alimentador general con 125 % aplicado dos veces.
// kVAdemanda ya trae el 25 % del motor mayor (430-24) y luego el alimentador
// se dimensiona con continua:true (x1.25) y el principal con Itab x 1.25.
// Uso: node casos/2.1.mjs <archivo.html>
import { cargar, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = G("S");

/* Entradas explícitas. 30 °C y 3 portadores para que los factores sean 1.00;
   5 m de alimentador para que rija ampacidad y no caída de tensión. */
S.elec = {
  ...G("defaultElec")(),
  sistema: "3F4H-220", material: "cobre", tempAmb: 30, nCond: 3,
  dvRamal: 3, dvTotal: 5, trafoKVA: 150, trafoZ: 4, Ltablero: 5, fpObjetivo: .95,
  tomarHVAC: false,
  cargas: [
    { id: "m1", nombre: "Motor mayor 15 kW", tipo: "motor", kW: 15, V: 220, ph: 3, cant: 1, L: 20, fp: .85, fija: false },
    { id: "m2", nombre: "Motores 7.5 kW", tipo: "motor", kW: 7.5, V: 220, ph: 3, cant: 2, L: 20, fp: .85, fija: false },
    { id: "a1", nombre: "Alumbrado", tipo: "alumbrado", kW: 9.5, V: 220, ph: 3, cant: 1, L: 20, fp: .95, fija: false },
    { id: "c1", nombre: "Contactos", tipo: "contactos", kW: 9, V: 220, ph: 3, cant: 1, L: 20, fp: .90, fija: false },
  ],
};
G("recompute")();
const R = G("ELEC");
const r2 = (x) => Math.round(x * 100) / 100;

/* Lo que entrega el documento: renglones del PDF del cuadro de cargas. */
let pdf = null;
try {
  const b = G("buildElecPdf")();
  const txt = Buffer.from(b).toString("latin1");
  /* Mismo método que el banco: el PDF se lee como latin1. Cada renglón es
     (etiqueta) Tj ET seguido del bloque BT del valor. */
  const fila = (lbl) => {
    const m = txt.match(new RegExp("\\(" + lbl + "\\) Tj ET\\s*BT[^\\n]*?Tm \\(((?:\\\\.|[^\\\\)])*)\\) Tj"));
    return m ? m[1].replace(/\\([()])/g, "$1") : null;
  };
  pdf = { corrienteDemanda: fila("Corriente de demanda"), alimentador: fila("Alimentador"),
    interruptorPrincipal: fila("Interruptor principal") };
} catch (e) { pdf = { error: String(e.message || e) }; }

/* Referencia independiente del motor (430-24 + 215-2(a)(1) con la clasificación
   de TIPO_CARGA): motores al 100 % + 25 % del mayor, continuas no motor al 125 %,
   no continuas al 100 %, contactos con 220-44. */
const V = 220, k3 = Math.sqrt(3) * V;
const kVAmot = 15 / .85 + 2 * 7.5 / .85, mayor = 15 / .85;
const kVAalum = 9.5 / .95, kVAcont = 9 / .90;
const demCont = Math.min(10, kVAcont) + Math.max(0, kVAcont - 10) * .5;
const kVAdis = kVAmot + .25 * mayor + 1.25 * kVAalum + 1.00 * demCont;
const Iesp = kVAdis * 1000 / k3;
const OCPD = G("OCPD_STD"), AMP = G("AMP75").cobre, ORD = G("AWG_ORD");
const awgEsp = ORD.find((a) => AMP[a] >= Iesp);
const principal215 = OCPD.find((x) => x >= Iesp - 1e-9);
/* 430-62(a)/430-63: tope = protección del ramal del motor mayor + FLC de los
   demás motores + las otras cargas (continuas al 125 %). Solo informativo. */
const mMayor = R.calc.find((c) => c.id === "m1"), mOtro = R.calc.find((c) => c.id === "m2");
const tope430_62 = mMayor.cond.ocpd + mOtro.I * 2 + (1.25 * kVAalum + demCont) * 1000 / k3;

imprime({
  caso: "2.1",
  valor: { IdisAlim_A: r2(R.alim.Idis), awgAlim: R.alim.awg, principal_A: R.principal },
  detalle: {
    kVAdemanda: r2(R.kVAdemanda), extraMotor: r2(R.extraMotor), Itab_A: r2(R.Itab),
    factorSobreItab: r2(R.alim.Idis / R.Itab), ocpdAlim_A: R.alim.ocpd, rige: R.alim.rige,
    ocpdRamalMotorMayor_A: mMayor.cond.ocpd, pdf,
    referencia_430_24_215_2: { kVAdiseno: r2(kVAdis), Idis_A: r2(Iesp), awg: awgEsp, principal_215_3_A: principal215,
      tope_430_62_A: r2(tope430_62) },
    errores: w.__errs,
  },
});
