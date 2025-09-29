// Exportación CSV y helpers relacionados
function errorPercentage(totalErrors, totalWords) {
  if (!totalWords) return '0%';
  return ((totalErrors / totalWords) * 100).toFixed(2) + '%';
}
function buildCSV_T() {
  const meetingDate = getMeetingDate();
  const headers = ['index', 'speaker', 'start', 'end', 'text', 'totalErrors', ...ERROR_CATALOG_T.map(e => `err_${e.key}`), 'palabras', 'porcentajeError', 'note'];
  const rows = stateT.items.map((b, i) => {
    const counts = stateT.annotations[i]?.counts || {};
    const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
    const words = (b.text || '').trim().split(/\s+/).filter(Boolean).length;
    const porcentajeError = errorPercentage(total, words);
    let start = b.start || b.start_date_time;
    let end = b.end || b.end_date_time;
    if (meetingDate && start) start = secondsToTimestamp(getBiteOffsetSeconds(start, meetingDate));
    if (meetingDate && end) end = secondsToTimestamp(getBiteOffsetSeconds(end, meetingDate));
    return [i + 1, safe(b.speaker), start, end, safe(b.text).replace(/\n/g, ' '), total, ...ERROR_CATALOG_T.map(e => counts[e.key] || 0), words, porcentajeError, safe(stateT.annotations[i]?.note || '').replace(/\n/g, ' ')];
  });
  const totals = totalsByType('T');
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  const totalWords = countWordsInTranscription(stateT.items);
  const trow = ['TOTAL', '', '', '', '', grand, ...ERROR_CATALOG_T.map(e => totals[e.key] || 0), totalWords, errorPercentage(grand, totalWords), ''];
  return [headers.join(','), ...rows.map(r => r.map(csvEscape).join(',')), '', trow.map(csvEscape).join(',')].join('\n');
}
function buildCSV_S() {
  const headers = ['index', 'title', 'text', 'totalErrors', ...ERROR_CATALOG_S.map(e => `err_${e.key}`), 'palabras', 'porcentajeError', 'note'];
  const rows = stateS.items.map((b, i) => {
    const counts = stateS.annotations[i]?.counts || {};
    const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
    const words = (b.text || '').trim().split(/\s+/).filter(Boolean).length;
    const porcentajeError = errorPercentage(total, words);
    return [i + 1, safe(b.title), safe(b.text).replace(/\n/g, ' '), total, ...ERROR_CATALOG_S.map(e => counts[e.key] || 0), words, porcentajeError, safe(stateS.annotations[i]?.note || '').replace(/\n/g, ' ')];
  });
  const totals = totalsByType('S');
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  const totalWords = countWordsInTranscription(stateS.items);
  const trow = ['TOTAL', '', '', grand, ...ERROR_CATALOG_S.map(e => totals[e.key] || 0), totalWords, errorPercentage(grand, totalWords), '', ''];
  let csvOut = [headers.join(','), ...rows.map(r => r.map(csvEscape).join(',')), '', trow.map(csvEscape).join(',')];
  if (globalSynthText && globalSynthText.trim()) {
    csvOut.push('');
    csvOut.push(['', 'Síntesis humana', globalSynthText.replace(/\n/g, ' '), '', ...Array(ERROR_CATALOG_S.length + 3).fill(''), ''].map(csvEscape).join(','));
  }
  return csvOut.join('\n');
}
function exportCSV() {
  const partT = buildCSV_T();
  const partS = buildCSV_S();
  const sep = '\n\n';
  const csv = [
    '### SINTESIS',
    partS,
    sep,
    '### Enlace síntesis',
    sep,
    '### TRANSCRIPCION',
    partT,
    sep,
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'auditoria_transcripcion_sintesis.csv'; a.click();
  URL.revokeObjectURL(url);
}

// Funciones de backup completo
function exportBackup() {
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    transcripcion: {
      items: stateT.items,
      annotations: stateT.annotations,
      enabledErrors: [...stateT.enabledErrors],
      filter: stateT.filter
    },
    sintesis: {
      items: stateS.items,
      annotations: stateS.annotations,
      enabledErrors: [...stateS.enabledErrors],
      filter: stateS.filter,
      globalSynthText: stateS.globalSynthText || ''
    }
  };
  
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  
  a.href = url;
  a.download = `auditor-backup-${dateStr}-${timeStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(jsonData) {
  try {
    const backup = JSON.parse(jsonData);
    
    // Validar estructura básica
    if (!backup.version || !backup.transcripcion || !backup.sintesis) {
      throw new Error('Formato de backup inválido');
    }
    
    // Restaurar estado de transcripción
    if (backup.transcripcion) {
      stateT.items = backup.transcripcion.items || [];
      stateT.annotations = backup.transcripcion.annotations || {};
      stateT.enabledErrors = new Set(backup.transcripcion.enabledErrors || ERROR_CATALOG_T.map(e => e.key));
      stateT.filter = backup.transcripcion.filter || '';
    }
    
    // Restaurar estado de síntesis
    if (backup.sintesis) {
      stateS.items = backup.sintesis.items || [];
      stateS.annotations = backup.sintesis.annotations || {};
      stateS.enabledErrors = new Set(backup.sintesis.enabledErrors || ERROR_CATALOG_S.map(e => e.key));
      stateS.filter = backup.sintesis.filter || '';
      stateS.globalSynthText = backup.sintesis.globalSynthText || '';
      
      // Actualizar el textarea de síntesis global si existe
      const synthTextarea = document.getElementById('global-synth-textarea');
      if (synthTextarea) {
        synthTextarea.value = stateS.globalSynthText;
      }
    }
    
    // Guardar en localStorage y re-renderizar
    saveToLocal();
    renderAll();
    renderFooterTotals();
    
    alert(`Backup restaurado exitosamente.\nFecha: ${backup.timestamp ? new Date(backup.timestamp).toLocaleString() : 'Desconocida'}`);
    
  } catch (error) {
    console.error('Error al importar backup:', error);
    alert('Error al importar el backup: ' + error.message);
  }
}

// Exponer funciones globalmente
window.errorPercentage = errorPercentage;
window.buildCSV_T = buildCSV_T;
window.buildCSV_S = buildCSV_S;
window.exportCSV = exportCSV;
window.exportBackup = exportBackup;
window.importBackup = importBackup;
