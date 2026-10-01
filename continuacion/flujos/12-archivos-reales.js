export const meta = {
  name: 'archivos-reales',
  description: 'Prueba el lector de archivos de EMP Suite con archivos reales del Google Drive del dueño (planos, Excel, PDF, catálogos) y reporta qué metadatos extrae y qué captura alimentaría cada disciplina',
  phases: [{ title: 'Probar', detail: 'descarga muestras del Drive y las pasa por el lector en jsdom' }],
}

const BASE = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). Una sola app en index.html (~22 mil líneas, CRLF,
con líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300).
Banco: pruebas.mjs (jsdom). Tienes Node 22 y Python 3 (biblioteca estándar; para DXF/Excel puedes parsear a mano: xlsx es un zip con
XML; DXF es texto por pares código/valor; DWG es binario propietario y probablemente no se lee: entonces se reporta «pendiente», nunca
se estima). Reglas de la casa: /home/user/emp_suite/CLAUDE.md.
Trabajo de SÓLO LECTURA sobre el repositorio: escribe experimentos y descargas en /home/user/emp_suite/x15/archivos-reales/ (x15 está
en .gitignore). Nada de lo que descargues ni ningún nombre de cliente debe entrar al repositorio ni a pruebas; el informe va al
scratchpad, no al repo.
Mapas de apoyo (léelos completos): /tmp/claude-0/-home-user-H1/8ecf4688-1415-58de-88cd-6505b3ae1775/scratchpad/mapa-archivos-lector.md,
mapa-archivos-destinos.md y mapa-archivos-pruebas.md (misma carpeta). Verifica en el código lo que uses.
Contexto: el dueño confirmó (27-sep-2026) que al cargar archivos (planos, Excel, bases de datos de planos/dibujos, catálogos) se use
su metadata para INICIAR el cálculo de cada disciplina, alimentando la captura propia de cada una (todos los motores son independientes).
`

const informe = await agent(`${BASE}
Eres el probador con archivos reales. Pasos:
1. Carga las herramientas del Drive con ToolSearch (consulta «select:mcp__Google_Drive__search_files,mcp__Google_Drive__get_file_metadata,
   mcp__Google_Drive__download_file_content,mcp__Google_Drive__list_recent_files»). Busca planos (dwg, dxf, pdf de planos), hojas de
   cálculo (xlsx, xls, csv) y catálogos (pdf). Elige hasta 8 archivos representativos y pequeños (< 15 MB) de tipos distintos.
   Si el Drive no está disponible en esta ejecución, dilo y sigue con archivos sintéticos mínimos que tú generes en Python
   (un DXF con capas y bloques, un xlsx con una tabla de equipos, un CSV) marcando claramente que son sintéticos.
2. Descárgalos a x15/archivos-reales/ (nombres neutros: plano-1.dxf, tabla-1.xlsx…, y guarda aparte una tabla de correspondencia
   sólo en el informe del scratchpad).
3. Localiza en index.html el lector de archivos (según mapa-archivos-lector.md: funciones de carga, cx/cxz, qué extensiones acepta,
   cómo reparte a cada disciplina) y escribe un arnés en jsdom (x15/archivos-reales/arnes.mjs, imitando cómo pruebas.mjs carga la app)
   que alimente cada archivo al lector como lo haría el usuario (File/FileReader/DataTransfer según el código) y capture: qué metadatos
   extrae (capas, bloques, textos, cotas, hojas, columnas, tablas, propiedades del PDF), a qué disciplina y campo de captura irían
   según mapa-archivos-destinos.md, qué se marcó «pendiente», y qué falló (excepción, extensión rechazada, archivo binario).
4. Con Python, extrae tú mismo del archivo lo que el lector debería poder sacar (p. ej. capas y bloques del DXF, hojas/columnas del
   xlsx, texto del PDF con zlib de la stdlib) y compáralo con lo que el lector extrajo: la diferencia es la lista de mejoras.
Escribe el informe en /tmp/claude-0/-home-user-H1/8ecf4688-1415-58de-88cd-6505b3ae1775/scratchpad/informe-archivos-reales.md (ese
archivo sí puedes escribirlo): tabla por archivo (tipo, tamaño, qué extrajo el lector, qué había realmente, disciplina/campo destino,
pendiente/falla), hallazgos H-nnn propuestos para el lector (qué, dónde archivo:línea, prueba que fallaría hoy) y la lista de
decisiones del dueño (pocas y concretas). Devuelve el contenido completo del informe.`,
  { label: 'probar:archivos-reales', phase: 'Probar' })
return { informe }