const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const esperarElemento = (selector: string, timeout = 5000): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const elemento = document.querySelector(selector) as HTMLElement;
    if (elemento) {
      resolve(elemento);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector) as HTMLElement;
      if (el) {
        observer.disconnect();
        resolve(el);
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
    try {
      (elemento as HTMLElement).focus?.();
    } catch {
    }

    try {
      elemento.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      elemento.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      elemento.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } catch {
    }

    try {
      (elemento as HTMLElement).click();
    } catch {
    }

    await sleep(esperaMilisegundos);
  } catch (error) {
    console.warn(`[Tutorial Finanzas] No se pudo hacer click en ${selector}:`, error);
  }
};

export const scrollAElemento = async (selector: string): Promise<void> => {
  try {
    const elemento = await esperarElemento(selector);
    elemento.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
    await sleep(80);
  } catch {
  }
};

export const irATabMovimientos = async (): Promise<void> => {
  await clickElemento('#tab-finanzas-movimientos', 250);
};

export const irATabAnalisis = async (): Promise<void> => {
  await clickElemento('#tab-finanzas-analisis', 250);
};

export const abrirDialogoIngreso = async (): Promise<void> => {
  await irATabMovimientos();
  await scrollAElemento('#btn-finanzas-registrar-ingreso');
  await clickElemento('#btn-finanzas-registrar-ingreso', 500);
  await esperarElemento('#dialog-finanzas-ingreso', 5000);
};

export const abrirDialogoEgreso = async (): Promise<void> => {
  await irATabMovimientos();
  await scrollAElemento('#btn-finanzas-registrar-egreso');
  await clickElemento('#btn-finanzas-registrar-egreso', 500);
  await esperarElemento('#dialog-finanzas-egreso', 5000);
};

export const asegurarDialogoIngresoAbierto = async (): Promise<void> => {
  await esperarElemento('#dialog-finanzas-ingreso', 5000);
};

export const asegurarDialogoEgresoAbierto = async (): Promise<void> => {
  await esperarElemento('#dialog-finanzas-egreso', 5000);
};

export const enfocarPorId = async (id: string): Promise<void> => {
  await clickElemento(`#${id}`, 150);
};

export const irAResumenAnual = async (): Promise<void> => {
  await irATabMovimientos();
  await scrollAElemento('#finanzas-resumen-ano');
};

export const irASeccionGrafico = async (): Promise<void> => {
  await irATabMovimientos();
  await scrollAElemento('#finanzas-seccion-grafico');
};

export const seleccionarGraficoPorDia = async (): Promise<void> => {
  await irASeccionGrafico();
  await clickElemento('#finanzas-grafico-tab-dia', 300);
};

export const seleccionarGraficoPorMes = async (): Promise<void> => {
  await irASeccionGrafico();
  await clickElemento('#finanzas-grafico-tab-mes', 300);
};

export const seleccionarGraficoPorAno = async (): Promise<void> => {
  await irASeccionGrafico();
  await clickElemento('#finanzas-grafico-tab-ano', 300);
};

export const seleccionarModoBalance = async (): Promise<void> => {
  await irASeccionGrafico();
  await clickElemento('#finanzas-grafico-modo-balance', 300);
};

export const seleccionarModoIngresosEgresos = async (): Promise<void> => {
  await irASeccionGrafico();
  await clickElemento('#finanzas-grafico-modo-ingresos-egresos', 300);
};

export const irAMovimientosHoy = async (): Promise<void> => {
  await irATabMovimientos();
  await scrollAElemento('#finanzas-movimientos-hoy');
};

export const irAFiltrosAnalisis = async (): Promise<void> => {
  await irATabAnalisis();
  await scrollAElemento('#finanzas-analisis-filtros');
};

export const abrirFiltrosAdicionalesAnalisis = async (): Promise<void> => {
  await irAFiltrosAnalisis();
  await clickElemento('#finanzas-analisis-filtros-adicionales', 350);
};

export const irAGraficoAnalisis = async (): Promise<void> => {
  await irATabAnalisis();
  await scrollAElemento('#finanzas-analisis-grafico');
};

export const irAResultadosAnalisis = async (): Promise<void> => {
  await irATabAnalisis();
  await scrollAElemento('#finanzas-analisis-resultados');
};
