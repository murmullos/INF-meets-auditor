// Almacenamiento local
const LS_T = 'auditor_trans_v1';
const LS_S = 'auditor_synth_v1';
const LS_TITLE = 'auditor_meeting_title_v1';
const LS_SYNTH_GLOBAL_OLD = 'auditor_synth_global_v1'; // Para migración

function loadFromLocal() {
  try {
    const rawT = localStorage.getItem(LS_T);
    if (rawT) {
      const p = JSON.parse(rawT);
      Object.assign(stateT, p, { enabledErrors: new Set(p.enabledErrors) });
    }
    const rawS = localStorage.getItem(LS_S);
    if (rawS) {
      const p = JSON.parse(rawS);
      Object.assign(stateS, p, { enabledErrors: new Set(p.enabledErrors) });
    }
    
    // Cargar título de la reunión
    const savedTitle = localStorage.getItem(LS_TITLE);
    if (savedTitle) {
      setMeetingTitle(savedTitle);
    }
    
    // Migrar globalSynthText desde el localStorage separado (si existe)
    const oldGlobalSynth = localStorage.getItem(LS_SYNTH_GLOBAL_OLD);
    if (oldGlobalSynth && !stateS.globalSynthText) {
      stateS.globalSynthText = oldGlobalSynth;
      // Guardar en el nuevo formato y eliminar el antiguo
      saveToLocal();
      localStorage.removeItem(LS_SYNTH_GLOBAL_OLD);
    }
  } catch (e) { console.warn(e); }
}

function saveToLocal() {
  localStorage.setItem(LS_T, JSON.stringify({ ...stateT, enabledErrors: [...stateT.enabledErrors] }));
  localStorage.setItem(LS_S, JSON.stringify({ ...stateS, enabledErrors: [...stateS.enabledErrors] }));
  localStorage.setItem(LS_TITLE, meetingTitle);
}

// Exponer funciones globalmente
window.LS_T = LS_T;
window.LS_S = LS_S;
window.LS_TITLE = LS_TITLE;
window.loadFromLocal = loadFromLocal;
window.saveToLocal = saveToLocal;
