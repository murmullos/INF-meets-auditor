// Filtros de búsqueda
function blockMatchesFilterT(b, f) {
  if (!f) return true;
  const k = f.toLowerCase();
  return (b.speaker || '').toLowerCase().includes(k) || (b.text || '').toLowerCase().includes(k);
}
function blockMatchesFilterS(b, f) {
  if (!f) return true;
  const k = f.toLowerCase();
  return (b.title || '').toLowerCase().includes(k) || (b.text || '').toLowerCase().includes(k);
}

// Exponer funciones globalmente
window.blockMatchesFilterT = blockMatchesFilterT;
window.blockMatchesFilterS = blockMatchesFilterS;
