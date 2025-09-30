import '../css/styles.scss';
import './utils.js';
import './storage.js';
import './filters.js';
import './render.js';
import './export.js';
import './synth.js';
import './jsonSource.js';
import { ERROR_CATALOG_T, ERROR_CATALOG_S } from './errorCatalogs.js';

// Estado global y catálogos
let activeTab = 'T'; // 'T' transcripción, 'S' síntesis, 'H' ayuda
let stateT = { items: [], annotations: {}, enabledErrors: new Set(ERROR_CATALOG_T.map(e=>e.key)), filter: '' };
let stateS = { items: [], annotations: {}, enabledErrors: new Set(ERROR_CATALOG_S.map(e=>e.key)), filter: '', globalSynthText: '' };

// Variable global para el título de la reunión
let meetingTitle = '';

// Exponer variables y funciones globalmente
window.ERROR_CATALOG_T = ERROR_CATALOG_T;
window.ERROR_CATALOG_S = ERROR_CATALOG_S;
window.stateT = stateT;
window.stateS = stateS;
window.activeTab = activeTab;
window.meetingTitle = meetingTitle;

// Funciones de anotación y edición
function setItems(json){
  if (activeTab==='S'){
    stateS.items = json.items || [];
    stateS.annotations = {}; stateS.items.forEach((_,i)=> stateS.annotations[i]={counts:{}, note:'', open:false});
  } else if (activeTab==='T') {
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
  // Asegurar que tenemos un activeTab válido
  if (!activeTab) {
    activeTab = 'T'; // Default fallback
  }

  let items = (activeTab === 'T') ? (stateT?.items || []) : (stateS?.items || []);

  // Si no hay items, retornar null
  if (!items || items.length === 0) {
    return null;
  }

  for (let i = 0; i < items.length; i++) {
    const dateValue = items[i].date;
    if (dateValue && dateValue !== 'undefined' && dateValue !== '') {
      return dateValue;
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

// Funciones para manejar el título de la reunión
function setMeetingTitle(title) {
  meetingTitle = title || '';
  window.meetingTitle = meetingTitle;
  updateHeaderTitle();
}

function updateHeaderTitle() {
  const headerTitle = document.querySelector('h1');
  if (headerTitle) {
    if (meetingTitle) {
      headerTitle.textContent = `Auditor - ${meetingTitle}`;
    } else {
      headerTitle.textContent = 'Auditor';
    }
  }
}

function getMeetingTitle() {
  return meetingTitle;
}

window.setMeetingTitle = setMeetingTitle;
window.updateHeaderTitle = updateHeaderTitle;
window.getMeetingTitle = getMeetingTitle;

// Funciones para manejar la persistencia de tabs en URL
function setActiveTab(tab) {
  activeTab = tab;
  window.activeTab = activeTab;

  // Actualizar URL hash
  const hashMap = { 'T': 'transcripcion', 'S': 'sintesis', 'H': 'ayuda' };
  window.location.hash = hashMap[tab] || 'transcripcion';
}

function getTabFromHash() {
  const hash = window.location.hash.substring(1); // Quitar el #
  const tabMap = { 'transcripcion': 'T', 'sintesis': 'S', 'ayuda': 'H' };
  return tabMap[hash] || 'T'; // Default a transcripción
}

function switchToTab(tab) {
  setActiveTab(tab);

  // Actualizar UI de tabs
  document.getElementById('tabTrans').setAttribute('aria-selected', tab === 'T' ? 'true' : 'false');
  document.getElementById('tabSynth').setAttribute('aria-selected', tab === 'S' ? 'true' : 'false');
  document.getElementById('tabHelp').setAttribute('aria-selected', tab === 'H' ? 'true' : 'false');

  // Mostrar/ocultar contenido
  document.getElementById('tabTransWrap').classList.toggle('hidden', tab !== 'T');
  document.getElementById('tabSynthWrap').classList.toggle('hidden', tab !== 'S');
  document.getElementById('tabHelpWrap').classList.toggle('hidden', tab !== 'H');

  // Manejar sidebar
  if (tab === 'H') {
    document.getElementById('sidebar-legend').style.display = 'none';
  } else {
    renderSidebarLegend(tab);
  }
}

window.setActiveTab = setActiveTab;
window.getTabFromHash = getTabFromHash;
window.switchToTab = switchToTab;

// Función para renderizar la leyenda de la sidebar
function renderSidebarLegend(tab) {
  const legendDiv = document.getElementById('sidebar-legend-content');
  const sidebarLegend = document.getElementById('sidebar-legend');

  // Mostrar la sidebar si estaba oculta
  sidebarLegend.style.display = 'block';

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

window.renderSidebarLegend = renderSidebarLegend;

// Inicialización y listeners principales
document.addEventListener('DOMContentLoaded', () => {
  // Mostrar versión de la app
  const versionElement = document.getElementById('app-version');
  if (versionElement) {
    try {
      // Intentar usar la variable inyectada por Webpack
      const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0';
      versionElement.textContent = `v${version}`;
      console.log('App version loaded:', version);
    } catch (error) {
      // Fallback si hay error
      versionElement.textContent = 'error';
      console.warn('Version injection failed, using fallback:', error);
    }
  }

  // Cargar estado local
  loadFromLocal();

  // Configurar validación de JSON source
  setupJsonSourceValidation();

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
    // Guardar datos mock en localStorage
    saveToLocal();
  }


  // Inicializar tab desde URL o default
  switchToTab(getTabFromHash());

  // Renderizar todo después de cargar/inicializar datos
  renderAll();
  renderFooterTotals();

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
  $('#reset').addEventListener('click', ()=>{
    if (confirm('¿Borrar todo el estado guardado (transcripción y síntesis)?')){
      localStorage.removeItem(LS_T);
      localStorage.removeItem(LS_S);
      localStorage.removeItem(LS_TITLE);
      location.reload();
    }
  });

  // Filtros
  $('#qT').addEventListener('input', e=>{ stateT.filter = e.target.value.trim(); render('T'); });
  $('#qT').addEventListener('keydown', e=>{ if (e.key==='Enter' && e.target.value===''){ stateT.filter=''; e.target.value=''; render('T'); }});
  $('#qS').addEventListener('input', e=>{ stateS.filter = e.target.value.trim(); render('S'); });
  $('#qS').addEventListener('keydown', e=>{ if (e.key==='Enter' && e.target.value===''){ stateS.filter=''; e.target.value=''; render('S'); }});

  // Tabs
  $('#tabTrans').addEventListener('click', ()=>{
    switchToTab('T');
  });

  $('#tabSynth').addEventListener('click', ()=>{
    switchToTab('S');
  });

  $('#tabHelp').addEventListener('click', ()=>{
    switchToTab('H');
  });

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
});

// Listener para cambios en el hash (navegación del navegador)
window.addEventListener('hashchange', () => {
  const tabFromHash = getTabFromHash();
  if (tabFromHash !== activeTab) {
    switchToTab(tabFromHash);
  }
});
