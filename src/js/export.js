// Exportación CSV y helpers relacionados
function errorPercentage(totalErrors, totalWords) {
  if (!totalWords) return '0%';
  return ((totalErrors / totalWords) * 100).toFixed(2) + '%';
}

function buildCSV_T() {
  const meetingDate = getMeetingDate();
  const title = getMeetingTitle();
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

  // Construir CSV con título como primera línea si existe
  const csvLines = [];
  if (title) {
    csvLines.push(csvEscape(title));
    csvLines.push(''); // Línea vacía después del título
  }
  csvLines.push(headers.join(','));
  csvLines.push(...rows.map(r => r.map(csvEscape).join(',')));
  csvLines.push('');
  csvLines.push(trow.map(csvEscape).join(','));

  return csvLines.join('\n');
}

function buildCSV_S() {
  const title = getMeetingTitle();
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
  
  let csvOut = [];
  if (title) {
    csvOut.push(csvEscape(title));
    csvOut.push(''); // Línea vacía después del título
  }
  csvOut.push(headers.join(','));
  csvOut.push(...rows.map(r => r.map(csvEscape).join(',')));
  csvOut.push('');
  csvOut.push(trow.map(csvEscape).join(','));
  
  if (stateS.globalSynthText && stateS.globalSynthText.trim()) {
    csvOut.push('');
    csvOut.push(['', 'Síntesis humana', stateS.globalSynthText.replace(/\n/g, ' '), '', ...Array(ERROR_CATALOG_S.length + 3).fill(''), ''].map(csvEscape).join(','));
  }
  return csvOut.join('\n');
}

function exportCSV() {
  const partT = buildCSV_T();
  const partS = buildCSV_S();
  const title = getMeetingTitle();
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
  
  // Generar nombre de archivo usando el título si existe
  let fileName = 'auditoria_transcripcion_sintesis';
  if (title) {
    // Limpiar el título para usar como nombre de archivo
    const cleanTitle = title.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    fileName = `auditoria_${cleanTitle}`;
  }
  
  a.href = url; 
  a.download = `${fileName}.csv`; 
  a.click();
  URL.revokeObjectURL(url);
}

// Funciones de backup completo
function exportBackup() {
  const title = getMeetingTitle();
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    meetingTitle: title,
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
  
  // Generar nombre de archivo usando el título si existe
  let fileName = `auditor-backup-${dateStr}-${timeStr}`;
  if (title) {
    // Limpiar el título para usar como nombre de archivo
    const cleanTitle = title.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_').substring(0, 30);
    fileName = `auditor-backup-${cleanTitle}-${dateStr}-${timeStr}`;
  }
  
  a.href = url;
  a.download = `${fileName}.json`;
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
    
    // Restaurar título de la reunión
    if (backup.meetingTitle) {
      setMeetingTitle(backup.meetingTitle);
    } else {
      setMeetingTitle(''); // Limpiar título si no existe en el backup
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
    
    const titleInfo = backup.meetingTitle ? `\nTítulo: ${backup.meetingTitle}` : '';
    alert(`Backup restaurado exitosamente.${titleInfo}\nFecha: ${backup.timestamp ? new Date(backup.timestamp).toLocaleString() : 'Desconocida'}`);
    
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
