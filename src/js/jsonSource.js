// Funciones para validar y cargar JSON source
function validateJsonSource(jsonText, expectedType) {
  try {
    const json = JSON.parse(jsonText);

    // Validar que tenga el array bites
    if (!json.bites || !Array.isArray(json.bites)) {
      return { valid: false, error: 'El JSON no contiene el array "bites" o no es válido.' };
    }

    // Validar que tenga elementos
    if (json.bites.length === 0) {
      return { valid: false, error: 'El JSON no contiene ningún elemento en el array "bites".' };
    }

    // Detectar tipo basado en el primer elemento
    const firstBite = json.bites[0];
    let detectedType = null;

    if ('title' in firstBite && !('speaker' in firstBite)) {
      detectedType = 'sintesis';
    } else if ('speaker' in firstBite) {
      detectedType = 'transcripcion';
    }

    // Validar que coincida con el tipo esperado
    if (!detectedType) {
      return { valid: false, error: 'El JSON no corresponde a un formato de transcripción ni de síntesis soportado.' };
    }

    if (detectedType !== expectedType) {
      return {
        valid: false,
        error: `El JSON corresponde a ${detectedType} pero se esperaba ${expectedType}.`
      };
    }

    return { valid: true, data: json, type: detectedType };

  } catch (error) {
    return { valid: false, error: 'El texto no es un JSON válido.' };
  }
}

function convertJsonSourceToAuditorFormat(jsonData, type) {
  const bites = jsonData.bites;

  if (type === 'transcripcion') {
    // Convertir formato de transcripción
    return bites.map(bite => ({
      speaker: bite.speaker?.name || 'Desconocido',
      text: bite.text || '',
      start: bite.start_date_time || null,
      end: bite.end_date_time || null,
      // Mantener campos adicionales si son necesarios
      date: jsonData.date || null,
    }));
  } else if (type === 'sintesis') {
    // Convertir formato de síntesis
    // Para síntesis, la fecha de la reunión está en meeting.date
    const meetingDate = jsonData.meeting?.date || jsonData.date || null;

    return bites.map(bite => ({
      title: bite.title || 'Sin título',
      text: bite.text || '',
      start: bite.start_date_time || null,
      end: bite.end_date_time || null,
      // Incluir la fecha de la reunión para cálculos de tiempo relativo
      start_date_time: bite.start_date_time || null,
      end_date_time: bite.end_date_time || null,
      // Mantener campos adicionales si son necesarios
      date: meetingDate,
    }));
  }

  return [];
}

function setupJsonSourceValidation() {
  // Validación para transcripción
  const textareaT = document.getElementById('jsonSourceTextT');
  const validationT = document.getElementById('jsonValidationT');
  const buttonT = document.getElementById('loadJsonSourceT');

  if (textareaT && validationT && buttonT) {
    textareaT.addEventListener('input', () => {
      const text = textareaT.value.trim();

      if (!text) {
        validationT.innerHTML = '';
        buttonT.disabled = true;
        return;
      }

      const result = validateJsonSource(text, 'transcripcion');

      if (result.valid) {
        validationT.innerHTML = '<span style="color: #16a34a; font-weight: bold;">✓ JSON de transcripción válido</span> - Listo para cargar.';
        buttonT.disabled = false;
      } else {
        validationT.innerHTML = `<span style="color: #dc2626; font-weight: bold;">✗ Error:</span> ${result.error}`;
        buttonT.disabled = true;
      }
    });

    buttonT.addEventListener('click', () => {
      const text = textareaT.value.trim();
      const result = validateJsonSource(text, 'transcripcion');

      if (result.valid) {
        const convertedData = convertJsonSourceToAuditorFormat(result.data, 'transcripcion');

        // Extraer y guardar el título de la reunión (transcripción: propiedad "title" a primer nivel)
        const title = result.data.title || '';
        setMeetingTitle(title);

        // Cambiar al tab de transcripción y cargar datos
        activeTab = 'T';
        stateT.items = convertedData;
        stateT.annotations = {}; // Reset anotaciones

        // Actualizar UI
        document.getElementById('tabTrans').setAttribute('aria-selected', 'true');
        document.getElementById('tabSynth').setAttribute('aria-selected', 'false');
        document.getElementById('tabTransWrap').classList.remove('hidden');
        document.getElementById('tabSynthWrap').classList.add('hidden');

        renderAll();
        saveToLocal();

        // Cerrar el details y limpiar
        document.getElementById('jsonSourceSectionT').open = false;
        textareaT.value = '';
        validationT.innerHTML = '';
        buttonT.disabled = true;

        alert(`Transcripción cargada exitosamente: ${convertedData.length} bloques procesados.`);
      }
    });
  }

  // Validación para síntesis
  const textareaS = document.getElementById('jsonSourceTextS');
  const validationS = document.getElementById('jsonValidationS');
  const buttonS = document.getElementById('loadJsonSourceS');

  if (textareaS && validationS && buttonS) {
    textareaS.addEventListener('input', () => {
      const text = textareaS.value.trim();

      if (!text) {
        validationS.innerHTML = '';
        buttonS.disabled = true;
        return;
      }

      const result = validateJsonSource(text, 'sintesis');

      if (result.valid) {
        validationS.innerHTML = '<span style="color: #16a34a; font-weight: bold;">✓ JSON de síntesis válido</span> - Listo para cargar.';
        buttonS.disabled = false;
      } else {
        validationS.innerHTML = `<span style="color: #dc2626; font-weight: bold;">✗ Error:</span> ${result.error}`;
        buttonS.disabled = true;
      }
    });

    buttonS.addEventListener('click', () => {
      const text = textareaS.value.trim();
      const result = validateJsonSource(text, 'sintesis');

      if (result.valid) {
        const convertedData = convertJsonSourceToAuditorFormat(result.data, 'sintesis');

        // Extraer y guardar el título de la reunión (síntesis: propiedad "title" en meeting)
        const title = result.data.meeting?.title || '';
        setMeetingTitle(title);

        // Cambiar al tab de síntesis y cargar datos
        activeTab = 'S';
        stateS.items = convertedData;
        stateS.annotations = {}; // Reset anotaciones

        // Actualizar UI
        document.getElementById('tabTrans').setAttribute('aria-selected', 'false');
        document.getElementById('tabSynth').setAttribute('aria-selected', 'true');
        document.getElementById('tabTransWrap').classList.add('hidden');
        document.getElementById('tabSynthWrap').classList.remove('hidden');

        renderAll();
        saveToLocal();

        // Cerrar el details y limpiar
        document.getElementById('jsonSourceSectionS').open = false;
        textareaS.value = '';
        validationS.innerHTML = '';
        buttonS.disabled = true;

        alert(`Síntesis cargada exitosamente: ${convertedData.length} bloques procesados.`);
      }
    });
  }
}

// Exponer funciones globalmente
window.validateJsonSource = validateJsonSource;
window.convertJsonSourceToAuditorFormat = convertJsonSourceToAuditorFormat;
window.setupJsonSourceValidation = setupJsonSourceValidation;
