import '../css/styles.scss';
import './utils.js';
import './storage.js';
import './filters.js';
import './render.js';
import './export.js';
import './synth.js';

// Estado global y catálogos
const ERROR_CATALOG_T = [
  { key:'orador',   label:'Err. orador',      desc:'Hablante asignado ≠ real' },
  { key:'cambio',     label:'Err. cambio habl.',  desc:'Se omitió cambio de hablante' },
  { key:'termino',    label:'Err. término',       desc:'Palabra mal transcrita' },
  { key:'precision',  label:'Err. precisión',     desc:'Información mal recogida' },
  { key:'omision',    label:'Err. omisión',       desc:'Falta info que sí se dijo' },
  { key:'anadido',    label:'Err. añadido',       desc:'Se añadió contenido no dicho' },
  { key:'colapso',    label:'Err. colapso',       desc:'Voces simultáneas mal tratadas' },
  { key:'ortografia', label:'Err. ortografía',    desc:'Ortografía/puntuación pobre' },
  { key:'estilo',     label:'Err. estilo',        desc:'Ruido excesivo / muletillas' },
  { key:'fragmentacion', label:'Err. fragmentación', desc:'Bloques separados de un mismo orador' }
];
const ERROR_CATALOG_S = [
  { key:'coherencia',   label:'Coherencia',     desc:'Ideas conectadas y ordenadas' },
  { key:'completitud',  label:'Completitud',    desc:'Cubre todos los puntos clave' },
  { key:'relevancia',   label:'Relevancia',     desc:'Evita ruido y relleno' },
  { key:'redundancia',  label:'Redundancia',    desc:'Repeticiones innecesarias' },
  { key:'estructura',   label:'Estructura',     desc:'Titulado y secciones claras' },
  { key:'segmentacion',   label:'Segmentación',     desc:'Exceso de conceptos en mismo bloque' }
];

const stateT = { items: [], annotations: {}, enabledErrors: new Set(ERROR_CATALOG_T.map(e=>e.key)), filter:'' };
const stateS = { items: [], annotations: {}, enabledErrors: new Set(ERROR_CATALOG_S.map(e=>e.key)), filter:'', globalSynthText: '' };
let activeTab = 'T'; // 'T' transcripción, 'S' síntesis

// Exponer variables y funciones globalmente
window.ERROR_CATALOG_T = ERROR_CATALOG_T;
window.ERROR_CATALOG_S = ERROR_CATALOG_S;
window.stateT = stateT;
window.stateS = stateS;
window.activeTab = activeTab;

// Funciones de anotación y edición
function setItems(json){
  if (activeTab==='S'){
    stateS.items = json.items || [];
    stateS.annotations = {}; stateS.items.forEach((_,i)=> stateS.annotations[i]={counts:{}, note:'', open:false});
  } else {
    stateT.items = json.items || [];
    stateT.annotations = {}; stateT.items.forEach((_,i)=> stateT.annotations[i]={counts:{}, note:'', open:false});
    if (json.date) {
      stateT.meetingDate = json.date;
      window.lastMeetingDate = json.date;
    }
    window.lastMeetingJson = json;
  }
  renderAll();
  saveToLocal();
}
window.setItems = setItems;

function toggleErrorType(tab,key){
  const st = tab==='S'?stateS:stateT;
  if (st.enabledErrors.has(key)) st.enabledErrors.delete(key);
  else st.enabledErrors.add(key);
  render(tab); saveToLocal();
}
window.toggleErrorType = toggleErrorType;

function incrementError(tab,index,key,delta){
  const st = tab==='S'?stateS:stateT;
  const ann = st.annotations[index] ||= {counts:{}, note:'', open:false};
  ann.counts[key]=(ann.counts[key]||0)+delta;
  if (ann.counts[key]<0) ann.counts[key]=0;
  render(tab); renderFooterTotals(); saveToLocal();
}
window.incrementError = incrementError;

function toggleNote(tab,index){
  const st = tab==='S'?stateS:stateT;
  const ann = st.annotations[index] ||= {counts:{}, note:'', open:false};
  ann.open=!ann.open;
  render(tab); saveToLocal();
}
window.toggleNote = toggleNote;

function setNote(tab,index,text){
  const st = tab==='S'?stateS:stateT;
  const ann = st.annotations[index] ||= {counts:{}, note:'', open:false};
  ann.note=text; saveToLocal();
}
window.setNote = setNote;

function getMeetingDate() {
  let items = (activeTab === 'T') ? (stateT?.items || []) : (stateS?.items || []);
  for (let i = 0; i < items.length; i++) {
    if (items[i].start || items[i].start_date_time) {
      return items[i].start || items[i].start_date_time;
    }
  }
  return null;
}
window.getMeetingDate = getMeetingDate;

function getBiteOffsetSeconds(biteDate, meetingDate) {
  if (!biteDate || !meetingDate) return 0;
  const diffMs = new Date(biteDate).getTime() - new Date(meetingDate).getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}
window.getBiteOffsetSeconds = getBiteOffsetSeconds;

// Inicialización y listeners principales
document.addEventListener('DOMContentLoaded', () => {
  // Cargar estado local
  loadFromLocal();
  // Demo si vacío
  if (stateT.items.length===0 && stateS.items.length===0){
    stateT.items = [
      { speaker:'Ana', start:'00:00:05.000', end:'00:00:14.000', text:'INFO EJEMPLO Bienvenidos a la reunión. Hoy vemos el roadmap del Q4.' },
      { speaker:'Luis', start:'00:00:14.100', end:'00:00:26.000', text:'INFO EJEMPLO Tenemos tres objetivos: ventas, soporte y lanzamiento de la app.' }
    ];
    stateT.annotations = {0:{counts:{},note:'',open:false},1:{counts:{},note:'',open:false}};
    stateS.items = [
      { title:'Objetivos Q4', text:'INFO EJEMPLO Ventas, soporte y lanzamiento de app.' },
      { title:'Bloqueadores', text:'INFO EJEMPLO Validación de seguridad pendiente.' }
    ];
    stateS.annotations = {0:{counts:{},note:'',open:false},1:{counts:{},note:'',open:false}};
    saveToLocal();
  }
  renderAll();

  // Eventos de archivo, exportar, reset
  $('#file').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const json = JSON.parse(r.result);
        
        // Detectar si es un backup completo o datos del tab activo
        if (json.version && json.transcripcion && json.sintesis) {
          // Es un backup completo
          if (confirm('¿Deseas restaurar este backup completo? Esto sobrescribirá todos los datos actuales.')) {
            importBackup(r.result);
          }
        } else {
          // Es un JSON del tab activo (comportamiento original)
          setItems(json);
        }
      } catch (error) {
        console.error('Error al procesar archivo:', error);
        alert('Error al procesar el archivo JSON: ' + error.message);
      }
    };
    r.readAsText(f);
  });
  
  $('#saveBackup').addEventListener('click', exportBackup);
  $('#exportCsv').addEventListener('click', exportCSV);
  $('#reset').addEventListener('click', ()=>{ if (confirm('¿Borrar todo el estado guardado (transcripción y síntesis)?')){ localStorage.removeItem(LS_T); localStorage.removeItem(LS_S); location.reload(); } });

  // Filtros
  $('#qT').addEventListener('input', e=>{ stateT.filter = e.target.value.trim(); render('T'); });
  $('#qT').addEventListener('keydown', e=>{ if (e.key==='Enter' && e.target.value===''){ stateT.filter=''; e.target.value=''; render('T'); }});
  $('#qS').addEventListener('input', e=>{ stateS.filter = e.target.value.trim(); render('S'); });
  $('#qS').addEventListener('keydown', e=>{ if (e.key==='Enter' && e.target.value===''){ stateS.filter=''; e.target.value=''; render('S'); }});

  // Tabs
  $('#tabTrans').addEventListener('click', ()=>{ activeTab='T'; $('#tabTrans').setAttribute('aria-selected','true'); $('#tabSynth').setAttribute('aria-selected','false'); $('#tabTransWrap').classList.remove('hidden'); $('#tabSynthWrap').classList.add('hidden'); renderSidebarLegend('T'); });
  $('#tabSynth').addEventListener('click', ()=>{ activeTab='S'; $('#tabTrans').setAttribute('aria-selected','false'); $('#tabSynth').setAttribute('aria-selected','true'); $('#tabTransWrap').classList.add('hidden'); $('#tabSynthWrap').classList.remove('hidden'); renderSidebarLegend('S'); });

  // Footer toggle
  $('#toggleFooter').addEventListener('click', ()=>{ $('#footerTotals').classList.toggle('open'); });

  // Leyenda toggle
  const legendToggleBtn = document.getElementById('legend-toggle-btn');
  const legendChevron = document.getElementById('legend-chevron');
  const legendContent = document.getElementById('sidebar-legend-content');
  legendToggleBtn.addEventListener('click', function() {
    legendContent.classList.toggle('open');
    legendChevron.classList.toggle('open');
  });
  legendContent.classList.remove('open');
  legendChevron.classList.remove('open');

  // Leyenda inicial
  function renderSidebarLegend(tab) {
    const legendDiv = document.getElementById('sidebar-legend-content');
    let html = '';
    if (tab === 'T') {
      html += '<div class="legend-block"><b>Leyenda errores transcripción:</b><ul style="margin:0.5em 0 0 1em;padding:0;">';
      ERROR_CATALOG_T.forEach(e => {
        html += `<li><b>${e.label}:</b> <span style='color:#444'>${e.desc}</span></li>`;
      });
      html += '</ul></div>';
    } else if (tab === 'S') {
      html += '<div class="legend-block"><b>Leyenda errores síntesis:</b><ul style="margin:0.5em 0 0 1em;padding:0;">';
      ERROR_CATALOG_S.forEach(e => {
        html += `<li><b>${e.label}:</b> <span style='color:#444'>${e.desc}</span></li>`;
      });
      html += '</ul></div>';
    }
    legendDiv.innerHTML = html;
  }
  renderSidebarLegend('T');
});
