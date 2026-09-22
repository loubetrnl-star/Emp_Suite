# Textos de norma y fuentes usados en la auditoría (22-sep-2026) y en la corrección de críticos

Regla de la casa (CLAUDE.md §4): nada se corrige de memoria. Lo que está aquí es texto verificable; lo que no está,
se marca «de memoria» o «secundaria» y el hallazgo queda BLOQUEADO hasta recibir el texto.

| Archivo | Qué es | Carácter | Fuente |
|---|---|---|---|
| NOM-001-SEDE-2012_DOF_texto.txt | NOM-001-SEDE-2012 completa, con marcas `=====PAG n=====` (paginación del PDF) | **Primaria** (norma oficial mexicana, DOF 29-nov-2012) | https://tese.edomex.gob.mx/sites/tese.edomex.gob.mx/files/files/Marco%20Juridico/Normas/NOM-001-SEDE-2012,-Instalaciones-Electricas-(utilizacion-).pdf |
| NOM-001-SEDE-2012_Cap10_Tabla5_extracto.txt | Cap. 10 Tabla 5 (áreas de conductores) | Primaria (extracto del anterior) | ídem |
| ISO-7183-2007_muestra-oficial.txt | ISO 7183:2007, muestra oficial: Tabla 1 (condiciones de referencia) y Tabla 2 (opciones A1…) | **Primaria parcial** (muestra oficial iTeh) | https://cdn.standards.iteh.ai/samples/39401/1ed16223576b41ca8192420c27f213e4/ISO-7183-2007.pdf |
| ISO-8573-1-2010_muestra-oficial.txt | ISO 8573-1:2010, muestra oficial (Tabla 1 de clases de partícula) | Primaria parcial | https://cdn.standards.iteh.ai/samples/46418/d8073a270c784349963dbf91a6cde57f/ISO-8573-1-2010.pdf |
| ISO-1217-2009_muestra-oficial.txt | ISO 1217:2009, muestra oficial (§3.4 definiciones de caudal) | Primaria parcial | https://cdn.standards.iteh.ai/samples/44769/35adacca2ae147a693113319bbfdc4fe/ISO-1217-2009.pdf |
| ISO-14644-4-2022_muestra-oficial_solo-prologo-e-indice.txt | ISO 14644-4:2022, muestra oficial (prólogo e índice; sin cuerpo) | Primaria parcial (no sirve para ACH ni presión) | https://cdn.standards.iteh.ai/samples/72379/31c1e8ffa38548d69bc213dc640f147d/ISO-14644-4-2022.pdf |
| EU-GMP-Anexo1-2022.txt | EU GMP Anexo 1, C(2022) 5938, completo (§4.14 presión, §4.30 velocidad, Tabla 1 grados) | **Primaria** | https://health.ec.europa.eu/system/files/2022-08/20220825_gmp-an1_en_0.pdf |
| ASHRAE-62.1-2016_Addendum-s_Tabla-6.2.2.1.txt | Reproduce la Tabla 6.2.2.1 (Rp, Ra por ocupación) de 62.1-2016 | **Primaria** (addendum oficial ASHRAE) | https://www.ashrae.org/File%20Library/Technical%20Resources/Standards%20and%20Guidelines/Standards%20Addenda/62.1-2016/62_1_2016_s_20190726.pdf |
| ASHRAE-62.1-2022_Addendum-b.txt | Numeración de la tabla en 62.1-2022 (Tabla 6-1) | Primaria | https://www.ashrae.org/file%20library/technical%20resources/standards%20and%20guidelines/standards%20addenda/62_1_2022_b_20231031.pdf |
| CKV-Design-Guide-1_campanas.txt | Guía de diseño de campanas (Tabla 1 con IMC/UMC y clasificación de aparatos ASHRAE 154) | Secundaria (fabricante, cita IMC/UMC) | https://www.streivor.com/wp-content/uploads/2020/11/CKV-Design-Guide-1-Selecting-and-Sizing-Exhaust-Hoods.pdf |
| NTC-Proyecto-Arquitectonico_dotaciones.txt | Normas Técnicas Complementarias para el Proyecto Arquitectónico (Tabla 3.1 dotaciones) | Primaria (edición no legible en la copia) | https://aducarte.weebly.com/uploads/5/1/2/7/5127290/normas_complementarias.pdf |
| Carrier-50TC-7-16-03PD_Product-Data.txt | Carrier 50TC Product Data (tablas de capacidad, pesos, refrigerante) | **Primaria** (fabricante) | Carrier Form 50TC-7-16-03PD Rev. A |
| ASHRAE-coeficientes-accesorios_PHVAC9.txt | Coeficientes de pérdida de accesorios (Principles of HVAC 9.ª ed., suplemento) | Primaria (ASHRAE) | https://xp20.ashrae.org/SupplementalFiles/PHVAC9/Fitting_Loss_Coefficients.pdf |
| SMACNA-1995_cuadro-de-contratista_calibres_SECUNDARIO.txt | Cuadro de calibres de un contratista basado en SMACNA 1995 | **Secundaria** (no sustituye a SMACNA) | https://img1.wsimg.com/blobby/go/8db0b6de-19ba-4220-b577-062bfb2b2cfa/downloads/ASM%20Duct%20Standards%20OFFICIAL.pdf |
| ASHRAE-1997_CLTD-correccion_extracto-curso-CED.txt | Fórmula de corrección CLTD (ASHRAE Fundamentals 1997 cap. 28): CLTDc = CLTD + (78 − TR) + (TM − 85), TM = Tmax − DR/2 | **Secundaria** (curso CED que reproduce ASHRAE 1997) | https://www.cedengineering.com (M06-004, A. Bhatia) |

## Fuentes en línea consultadas (no copiadas)
- IPC 2015 y 2024 (up.codes): E103.3(2)/(3), 604.3, 704.1, 709.1, 710.1, 906.2 — texto público en línea, se cita con URL en cada commit.
- MSS SP-58 e IPC 308.5: reproducciones de fabricante (PHD 2018, MCP) — secundarias.
- NFPA 20 §4.9 (up.codes), NYC 1 RCNY §29-09 (tabla CPVC) — secundarias.

## No disponibles (bloquean hallazgos)
SMACNA HVAC DCS (tablas de calibre, colgantes, redondo espiral), NFPA 13 / 20 / 96 (texto), ASCE 7-16/22 cap. 13,
ACI 318-19 cap. 17, ANSI/ISEA Z358.1-2014, Carrier Handbook Parte 1 Tabla 20A.
