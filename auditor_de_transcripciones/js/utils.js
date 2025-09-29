// Utilidades generales
const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => n.dataset[dk] = dv);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'html') n.innerHTML = v; else n.setAttribute(k, v);
  });
  children.flat().forEach(c => n.append(c instanceof Node ? c : document.createTextNode(c)));
  return n;
};
const safe = v => (v == null ? '' : String(v));
function csvEscape(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function secondsToTimestamp(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return (h > 0 ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// Exponer funciones globalmente
window.$ = $;
window.el = el;
window.safe = safe;
window.csvEscape = csvEscape;
window.secondsToTimestamp = secondsToTimestamp;
