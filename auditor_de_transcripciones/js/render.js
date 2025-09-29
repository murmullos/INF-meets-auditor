// Renderizado de UI y componentes
function getCtx(tab) {
  return tab === 'S' ? {
    state: stateS,
    catalog: ERROR_CATALOG_S,
    q: $('#qS'),
    toggles: $('#errorsTogglesS'),
    list: $('#listS'),
    kpiBlocks: $('#kpiBlocksS'),
    kpiBlocksErr: $('#kpiBlocksErrS'),
    kpiErr: $('#kpiErrS'),
    kpiTypes: $('#kpiTypesS'),
    kpiWords: $('#kpiWordsS'),
    summary: $('#summaryS')
  } : {
    state: stateT,
    catalog: ERROR_CATALOG_T,
    q: $('#qT'),
    toggles: $('#errorsTogglesT'),
    list: $('#listT'),
    kpiBlocks: $('#kpiBlocksT'),
    kpiBlocksErr: $('#kpiBlocksErrT'),
    kpiErr: $('#kpiErrT'),
    kpiTypes: $('#kpiTypesT'),
    kpiWords: $('#kpiWordsT'),
    summary: $('#summaryT')
  };
}
function countWordsInTranscription(data) {
  if (!Array.isArray(data)) return 0;
  return data.reduce((acc, item) => {
    if (typeof item.text === 'string') {
      acc += (item.text.trim().match(/\S+/g) || []).length;
    }
    return acc;
  }, 0);
}
function timePill(start, end) {
  const meetingDate = getMeetingDate();
  let pill = '';
  if (meetingDate && start) {
    const startSecs = getBiteOffsetSeconds(start, meetingDate);
    pill += secondsToTimestamp(startSecs);
  } else {
    pill += start ?? '¿?';
  }
  if (meetingDate && end) {
    const endSecs = getBiteOffsetSeconds(end, meetingDate);
    pill += ' → ' + secondsToTimestamp(endSecs);
  } else if (end) {
    pill += ' → ' + end;
  }
  return el('span', { class: 'tag' }, pill);
}
function render(tab = activeTab) {
  const ctx = getCtx(tab);
  // toggles
  ctx.toggles.innerHTML = '';
  ctx.catalog.forEach(err => {
    const active = (tab === 'S' ? stateS : stateT).enabledErrors.has(err.key);
    const chip = el('span', { class: 'error-chip', title: err.desc, dataset: { active } }, el('b', {}, active ? '✓' : '•'), ' ', err.label);
    chip.addEventListener('click', () => toggleErrorType(tab, err.key));
    ctx.toggles.append(chip);
  });
  ctx.kpiTypes.textContent = (tab === 'S' ? stateS : stateT).enabledErrors.size;
  // lista
  ctx.list.innerHTML = '';
  if (tab === 'S') {
    stateS.items.forEach((b, i) => {
      if (!blockMatchesFilterS(b, stateS.filter)) return;
      const ann = stateS.annotations[i] || { counts: {}, note: '', open: false };
      const chips = el('div', { class: 'error-group' });
      ERROR_CATALOG_S.forEach(err => {
        if (!stateS.enabledErrors.has(err.key)) return;
        const count = ann.counts[err.key] || 0;
        const chip = el('span', { class: 'error-chip', title: err.desc });
        chip.append(el('b', {}, String(count)), ' ', err.label);
        chip.addEventListener('click', (e) => { const alt = e.altKey || e.metaKey; incrementError('S', i, err.key, alt ? -1 : +1); });
        chips.append(chip);
      });
      const noteArea = el('textarea', { class: ann.open ? '' : 'hidden', placeholder: 'Añade una nota para este bloque…' });
      noteArea.value = ann.note || '';
      noteArea.addEventListener('input', () => setNote('S', i, noteArea.value));
      const block = el('li', { class: 'sblock' },
        el('div', { class: 's-title' }, safe(b.title) || 'Sin título'),
        el('div', { class: 's-text' }, safe(b.text) || ''),
        el('div', { class: 'row' }, chips, el('span', { class: 'spacer' }), el('button', { class: 'btn small', onclick: () => toggleNote('S', i) }, ann.open ? 'Ocultar nota' : 'Añadir nota')),
        noteArea
      );
      ctx.list.append(block);
    });
    // KPIs
    let totalErr = 0, blocksErr = 0; stateS.items.forEach((_, i) => { const c = stateS.annotations[i]?.counts || {}; const s = Object.values(c).reduce((a, b) => a + (b || 0), 0); if (s > 0) blocksErr++; totalErr += s; });
    ctx.kpiBlocks.textContent = stateS.items.length; ctx.kpiBlocksErr.textContent = blocksErr; ctx.kpiErr.textContent = totalErr;
    ctx.kpiWords.textContent = countWordsInTranscription(stateS.items);
    // resumen
    ctx.summary.innerHTML = '';
    const tHead = el('div', { class: 'row', style: 'margin:8px 0' }, el('span', { class: 'muted small' }, 'Totales por tipo de error (Síntesis)'));
    ctx.summary.append(tHead);
    const tbl = el('table'); tbl.append(el('thead', {}, el('tr', {}, el('th', {}, 'Tipo'), el('th', {}, 'Total'))));
    const tb = el('tbody'); ERROR_CATALOG_S.forEach(err => { const tot = stateS.items.reduce((acc, _, i) => acc + (stateS.annotations[i]?.counts?.[err.key] || 0), 0); tb.append(el('tr', {}, el('td', {}, err.label), el('td', {}, String(tot)))); });
    tbl.append(tb); ctx.summary.append(tbl);
  } else {
    stateT.items.forEach((b, i) => {
      if (!blockMatchesFilterT(b, stateT.filter)) return;
      const ann = stateT.annotations[i] || { counts: {}, note: '', open: false };
      const chips = el('div', { class: 'error-group' });
      ERROR_CATALOG_T.forEach(err => {
        if (!stateT.enabledErrors.has(err.key)) return;
        const count = ann.counts[err.key] || 0;
        const chip = el('span', { class: 'error-chip', title: err.desc });
        chip.append(el('b', {}, String(count)), ' ', err.label);
        chip.addEventListener('click', (e) => { const alt = e.altKey || e.metaKey; incrementError('T', i, err.key, alt ? -1 : +1); });
        chips.append(chip);
      });
      const noteArea = el('textarea', { class: ann.open ? '' : 'hidden', placeholder: 'Añade una nota para este bloque…' });
      noteArea.value = ann.note || '';
      noteArea.addEventListener('input', () => setNote('T', i, noteArea.value));
      const header = el('div', { class: 'meta' }, el('span', { class: 'tag' }, b.speaker || '¿Hablante?'), timePill(b.start, b.end));
      const block = el('li', { class: 'block' }, header, el('div', { class: 'text' }, b.text || ''), el('div', { class: 'row' }, chips, el('span', { class: 'spacer' }), el('button', { class: 'btn small', onclick: () => toggleNote('T', i) }, ann.open ? 'Ocultar nota' : 'Añadir nota')), noteArea);
      ctx.list.append(block);
    });
    // KPIs
    let totalErr = 0, blocksErr = 0; stateT.items.forEach((_, i) => { const c = stateT.annotations[i]?.counts || {}; const s = Object.values(c).reduce((a, b) => a + (b || 0), 0); if (s > 0) blocksErr++; totalErr += s; });
    ctx.kpiBlocks.textContent = stateT.items.length; ctx.kpiBlocksErr.textContent = blocksErr; ctx.kpiErr.textContent = totalErr;
    ctx.kpiWords.textContent = countWordsInTranscription(stateT.items);
    // resumen
    ctx.summary.innerHTML = '';
    const tHead = el('div', { class: 'row', style: 'margin:8px 0' }, el('span', { class: 'muted small' }, 'Totales por tipo de error (Transcripción)'));
    ctx.summary.append(tHead);
    const tbl = el('table'); tbl.append(el('thead', {}, el('tr', {}, el('th', {}, 'Tipo'), el('th', {}, 'Total'))));
    const tb = el('tbody'); ERROR_CATALOG_T.forEach(err => { const tot = stateT.items.reduce((acc, _, i) => acc + (stateT.annotations[i]?.counts?.[err.key] || 0), 0); tb.append(el('tr', {}, el('td', {}, err.label), el('td', {}, String(tot)))); });
    tbl.append(tb); ctx.summary.append(tbl);
  }
}
function renderAll() { render('T'); render('S'); renderFooterTotals(); }
function totalsByType(tab) {
  const st = tab === 'S' ? stateS : stateT;
  const cat = tab === 'S' ? ERROR_CATALOG_S : ERROR_CATALOG_T;
  const totals = {};
  cat.forEach(e => totals[e.key] = 0);
  st.items.forEach((_, i) => {
    const c = st.annotations[i]?.counts || {};
    Object.entries(c).forEach(([k, v]) => totals[k] = (totals[k] || 0) + (v || 0));
  });
  return totals;
}
function totalsCombined() {
  const tTot = Object.values(totalsByType('T')).reduce((a, b) => a + b, 0);
  const sTot = Object.values(totalsByType('S')).reduce((a, b) => a + b, 0);
  const tBlocks = stateT.items.reduce((acc, _, i) => acc + ((Object.values(stateT.annotations[i]?.counts || {}).reduce((x, y) => x + (y || 0), 0) > 0 ? 1 : 0)), 0);
  const sBlocks = stateS.items.reduce((acc, _, i) => acc + ((Object.values(stateS.annotations[i]?.counts || {}).reduce((x, y) => x + (y || 0), 0) > 0 ? 1 : 0)), 0);
  const tWords = countWordsInTranscription(stateT.items);
  const sWords = countWordsInTranscription(stateS.items);
  return { total: tTot + sTot, blocks: tBlocks + sBlocks, tTot, sTot, tBlocks, sBlocks, tWords, sWords };
}
function renderFooterTotals() {
  const { total, blocks, tTot, sTot, tBlocks, sBlocks, tWords, sWords } = totalsCombined();
  $('#badgeTotals').textContent = `Errores: ${total}`;
  $('#badgeBlocks').textContent = `Bloques con error: ${blocks}`;
  $('#badgeWords').textContent = `Palabras totales: ${tWords + sWords}`;
  const panel = $('#footerPanel'); panel.innerHTML = '';
  panel.append(el('div', {}, el('strong', {}, 'Totales por tab')));
  const small = el('table', { style: 'margin:6px 0; width:100%' });
  small.append(el('thead', {}, el('tr', {}, el('th', {}, 'Tab'), el('th', {}, 'Errores'), el('th', {}, 'Bloques con error'), el('th', {}, 'Palabras'))));
  small.append(el('tbody', {},
    el('tr', {}, el('td', {}, 'Transcripción'), el('td', {}, String(tTot)), el('td', {}, String(tBlocks)), el('td', {}, String(tWords))),
    el('tr', {}, el('td', {}, 'Síntesis'), el('td', {}, String(sTot)), el('td', {}, String(sBlocks)), el('td', {}, String(sWords))),
    el('tr', {}, el('td', {}, 'Total'), el('td', {}, String(total)), el('td', {}, String(blocks)), el('td', {}, String(tWords + sWords)))
  ));
  panel.append(small);
  const tTable = el('table', { style: 'width:100%; margin-top:8px' });
  tTable.append(el('thead', {}, el('tr', {}, el('th', {}, 'Transcripción - Tipo'), el('th', {}, 'Total'))));
  const tTb = el('tbody'); ERROR_CATALOG_T.forEach(err => { const tot = stateT.items.reduce((acc, _, i) => acc + (stateT.annotations[i]?.counts?.[err.key] || 0), 0); tTb.append(el('tr', {}, el('td', {}, err.label), el('td', {}, String(tot)))); });
  tTable.append(tTb); panel.append(tTable);
  const sTable = el('table', { style: 'width:100%; margin-top:8px' });
  sTable.append(el('thead', {}, el('tr', {}, el('th', {}, 'Síntesis - Tipo'), el('th', {}, 'Total'))));
  const sTb = el('tbody'); ERROR_CATALOG_S.forEach(err => { const tot = stateS.items.reduce((acc, _, i) => acc + (stateS.annotations[i]?.counts?.[err.key] || 0), 0); sTb.append(el('tr', {}, el('td', {}, err.label), el('td', {}, String(tot)))); });
  sTable.append(sTb); panel.append(sTable);
}

// Exponer funciones globalmente
window.getCtx = getCtx;
window.countWordsInTranscription = countWordsInTranscription;
window.timePill = timePill;
window.render = render;
window.renderAll = renderAll;
window.totalsByType = totalsByType;
window.totalsCombined = totalsCombined;
window.renderFooterTotals = renderFooterTotals;
