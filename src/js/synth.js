// Lógica específica de síntesis global
document.addEventListener('DOMContentLoaded', () => {
  const synthTextarea = document.getElementById('global-synth-textarea');
  if (!synthTextarea) return;

  // Guardar automáticamente en el estado unificado
  synthTextarea.addEventListener('input', () => {
    if (stateS) {
      stateS.globalSynthText = synthTextarea.value;
      saveToLocal();
    }
  });

  function restoreGlobalSynthText() {
    if (stateS && synthTextarea) {
      synthTextarea.value = stateS.globalSynthText || '';
    }
  }

  // Cambiar de tab mantiene el valor
  restoreGlobalSynthText();
  
  const tabSynth = document.getElementById('tabSynth');
  if (tabSynth) tabSynth.addEventListener('click', restoreGlobalSynthText);
  if (synthTextarea && !synthTextarea.value) synthTextarea.value = '';
});
