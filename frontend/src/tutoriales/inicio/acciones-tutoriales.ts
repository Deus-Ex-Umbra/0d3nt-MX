export const limpiarAccionesPendientes = (): void => {
  console.debug('[Tutorial] Limpiando contexto de acciones');
};

type TabInicio = 'dashboard' | 'reportes' | 'plantillas';
type SubtabPlantillas = 'consentimientos' | 'recetas';

const emitirNavegacionInicio = (detalle: { tab?: TabInicio; subtabPlantillas?: SubtabPlantillas }) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('tutorial:navegar-inicio', { detail: detalle }));
};

export const esperarElemento = (selector: string, timeout = 5000): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const elemento = document.querySelector(selector) as HTMLElement;
    if (elemento) {
      resolve(elemento);
      return;
    }

    const observer = new MutationObserver(() => {
      const elemento = document.querySelector(selector) as HTMLElement;
      if (elemento) {
        observer.disconnect();
        resolve(elemento);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} no encontrado después de ${timeout}ms`));
    }, timeout);
  });
};

export const clickElemento = async (selector: string, esperaMilisegundos = 300): Promise<void> => {
  try {
    const elemento = await esperarElemento(selector);
    elemento.click();
    await new Promise(resolve => setTimeout(resolve, esperaMilisegundos));
  } catch (error) {
    console.warn(`No se pudo hacer click en ${selector}:`, error);
  }
};


export const scrollAElemento = async (selector: string): Promise<void> => {
  try {
    const elemento = await esperarElemento(selector);
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch (error) {
    console.warn(`No se pudo hacer scroll a ${selector}:`, error);
  }
};

export const clickTab = async (tabId: string): Promise<void> => {
  await clickElemento(`#${tabId}`, 500);
};

export const clickBoton = async (botonId: string): Promise<void> => {
  await clickElemento(`#${botonId}`, 500);
};

export const irATabDashboard = async (): Promise<void> => {
  emitirNavegacionInicio({ tab: 'dashboard' });
  await clickTab('tab-inicio-dashboard');
};

export const irATabReportes = async (): Promise<void> => {
  emitirNavegacionInicio({ tab: 'reportes' });
  await clickTab('tab-inicio-reportes');
};

export const irATabPlantillas = async (): Promise<void> => {
  emitirNavegacionInicio({ tab: 'plantillas' });
  await clickTab('tab-inicio-plantillas');
};

export const irASubtabConsentimientos = async (): Promise<void> => {
  emitirNavegacionInicio({ tab: 'plantillas', subtabPlantillas: 'consentimientos' });
  await clickTab('subtab-consentimientos');
};

export const irASubtabRecetas = async (): Promise<void> => {
  emitirNavegacionInicio({ tab: 'plantillas', subtabPlantillas: 'recetas' });
  await clickTab('subtab-recetas');
};

export const abrirModalConsentimiento = async (): Promise<void> => {
  await clickBoton('btn-nueva-plantilla-consentimiento');
};

export const abrirModalReceta = async (): Promise<void> => {
  await clickBoton('btn-nueva-plantilla-receta');
};

export const abrirGenerarReporte = async (): Promise<void> => {
  await clickBoton('btn-generar-reporte');
};

export const abrirVisualizadorPrimerReporte = async (): Promise<void> => {
  await clickElemento('#btn-ver-reporte-primero', 600);
};

export const scrollAConfiguracionHojaConsentimiento = async (): Promise<void> => {
  await scrollAElemento('#consentimiento-configuracion-hoja');
};

export const scrollAEtiquetasConsentimiento = async (): Promise<void> => {
  await scrollAElemento('#consentimiento-etiquetas-container');
};

export const scrollAEditorConsentimiento = async (): Promise<void> => {
  await scrollAElemento('#consentimiento-editor-container');
};

export const scrollAConfiguracionHojaReceta = async (): Promise<void> => {
  await scrollAElemento('#receta-configuracion-hoja');
};

export const scrollAMedicamentosReceta = async (): Promise<void> => {
  await scrollAElemento('#receta-medicamentos-container');
};

export const scrollAEditorReceta = async (): Promise<void> => {
  await scrollAElemento('#receta-editor-container');
};

export const cerrarModal = async (): Promise<void> => {
  limpiarAccionesPendientes();
  
  const evento = new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(evento);
  await new Promise(resolve => setTimeout(resolve, 300));
};

export const cerrarModalConBoton = async (botonSelector = 'button:contains("Cancelar")'): Promise<void> => {
  limpiarAccionesPendientes();
  try {
    await clickElemento(botonSelector, 300);
  } catch (error) {
    await cerrarModal();
  }
};

export const navegarAConsentimientos = async (): Promise<void> => {
  await irATabPlantillas();
  await irASubtabConsentimientos();
};

export const navegarARecetas = async (): Promise<void> => {
  await irATabPlantillas();
  await irASubtabRecetas();
};

export const abrirCrearConsentimiento = async (): Promise<void> => {
  await navegarAConsentimientos();
  await abrirModalConsentimiento();
};

export const abrirCrearReceta = async (): Promise<void> => {
  await navegarARecetas();
  await abrirModalReceta();
};

export const cambiarADashboard = irATabDashboard;
export const cambiarAReportes = irATabReportes;
export const cambiarAPlantillas = irATabPlantillas;
export const cambiarAConsentimientos = navegarAConsentimientos;
export const cambiarARecetas = navegarARecetas;



