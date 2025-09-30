// Catálogos de errores para transcripción y síntesis
// Este archivo contiene las definiciones de todos los tipos de errores
// que se pueden anotar en el auditor

// Catálogo de errores para TRANSCRIPCIÓN
export const ERROR_CATALOG_T = [
  { key: 'orador',        label: 'Err. orador',          desc: 'Hablante asignado ≠ real' },
  { key: 'cambio',        label: 'Err. cambio habl.',     desc: 'Se omitió cambio de hablante' },
  { key: 'termino',       label: 'Err. término',          desc: 'Palabra mal transcrita' },
  { key: 'precision',     label: 'Err. precisión',        desc: 'Información mal recogida' },
  { key: 'omision',       label: 'Err. omisión',          desc: 'Falta info que sí se dijo' },
  { key: 'anadido',       label: 'Err. añadido',          desc: 'Se añadió contenido no dicho' },
  { key: 'colapso',       label: 'Err. colapso',          desc: 'Voces simultáneas mal tratadas' },
  { key: 'ortografia',    label: 'Err. ortografía',       desc: 'Ortografía/puntuación pobre' },
  { key: 'estilo',        label: 'Err. estilo',           desc: 'Ruido excesivo / muletillas' },
  { key: 'fragmentacion', label: 'Err. fragmentación',    desc: 'Bloques separados de un mismo orador' }
];

// Catálogo de errores para SÍNTESIS
export const ERROR_CATALOG_S = [
  { key: 'coherencia',    label: 'Coherencia',     desc: 'Ideas conectadas y ordenadas' },
  { key: 'completitud',   label: 'Completitud',    desc: 'Cubre todos los puntos clave' },
  { key: 'relevancia',    label: 'Relevancia',     desc: 'Evita ruido y relleno' },
  { key: 'redundancia',   label: 'Redundancia',    desc: 'Repeticiones innecesarias' },
  { key: 'estructura',    label: 'Estructura',     desc: 'Titulado y secciones claras' },
  { key: 'segmentacion',  label: 'Segmentación',   desc: 'Exceso de conceptos en mismo bloque' }
];

// Exponer catálogos globalmente
window.ERROR_CATALOG_T = ERROR_CATALOG_T;
window.ERROR_CATALOG_S = ERROR_CATALOG_S;
