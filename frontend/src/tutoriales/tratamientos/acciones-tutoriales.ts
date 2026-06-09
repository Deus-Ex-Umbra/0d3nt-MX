export const limpiarAccionesPendientes = (): void => {
  console.debug('[Tutorial Tratamientos] Limpiando contexto de acciones');
};

type TabTratamientos = 'planes' | 'plantillas';

const emitirNavegacionTratamientos = (detalle: { tab?: TabTratamientos }) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('tutorial:navegar-tratamientos', { detail: detalle }));
};

export const esperarElemento = (selector: string, timeout = 6000): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const elemento = document.querySelector(selector) as HTMLElement | null;
    if (elemento) {
      resolve(elemento);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector) as HTMLElement | null;
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

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const setNativeValue = (elemento: HTMLInputElement, valor: string) => {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(elemento), 'value');
  const setter = descriptor?.set;
  if (setter) setter.call(elemento, valor);
  else elemento.value = valor;
};

export const escribirEnInput = async (selector: string, valor: string, esperaMilisegundos = 250): Promise<void> => {
  try {
    const elemento = await esperarElemento(selector);
    const input = elemento as HTMLInputElement;
    input.focus?.();
    setNativeValue(input, valor);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(esperaMilisegundos);
  } catch (error) {
    console.warn(`[Tutorial Tratamientos] No se pudo escribir en ${selector}:`, error);
  }
};

export const escribirEnInputPorId = async (elementoId: string, valor: string, esperaMilisegundos = 250): Promise<void> => {
  await escribirEnInput(`#${elementoId}`, valor, esperaMilisegundos);
};

export const esperarElementoDesaparezca = (selector: string, timeout = 8000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(selector);
    if (!existente) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (!el) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} no desapareció después de ${timeout}ms`));
    }, timeout);
  });
};

export const clickElemento = async (selector: string, esperaMilisegundos = 400): Promise<void> => {
  try {
    const elemento = await esperarElemento(selector);
    try {
      elemento.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    } catch {
    }
    const opciones = { bubbles: true, cancelable: true, view: window } as any;
    try {
      elemento.dispatchEvent(new MouseEvent('pointerdown', opciones));
      elemento.dispatchEvent(new MouseEvent('mousedown', opciones));
      elemento.dispatchEvent(new MouseEvent('mouseup', opciones));
      elemento.dispatchEvent(new MouseEvent('click', opciones));
    } catch {
      (elemento as HTMLElement).click();
    }
    await sleep(esperaMilisegundos);
  } catch (error) {
    console.warn(`[Tutorial Tratamientos] No se pudo hacer click en ${selector}:`, error);
  }
};

export const scrollAElemento = async (selector: string): Promise<void> => {
  try {
    const elemento = await esperarElemento(selector);
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(350);
  } catch (error) {
    console.warn(`[Tutorial Tratamientos] No se pudo hacer scroll a ${selector}:`, error);
  }
};

export const clickPorId = async (elementoId: string): Promise<void> => {
  await clickElemento(`#${elementoId}`, 500);
};

export const enfocarPorId = async (elementoId: string): Promise<void> => {
  try {
    const elemento = await esperarElemento(`#${elementoId}`);
    (elemento as HTMLElement).focus?.();
    await sleep(200);
  } catch {
  }
};

export const irATabPlanesTratamientos = async (): Promise<void> => {
  emitirNavegacionTratamientos({ tab: 'planes' });
  await clickPorId('tab-tratamientos-planes');
};

export const irATabPlantillasTratamientos = async (): Promise<void> => {
  emitirNavegacionTratamientos({ tab: 'plantillas' });
  await clickPorId('tab-tratamientos-plantillas');
};

export const abrirDialogoNuevaPlantillaDesdeArriba = async (): Promise<void> => {
  await clickPorId('btn-tratamientos-accion-superior');
};

export const asegurarDialogoPlantillaAbierto = async (): Promise<void> => {
  await irATabPlantillasTratamientos();
  await abrirDialogoNuevaPlantillaDesdeArriba();
  try {
    await esperarElemento('#dialog-tratamientos-plantilla', 8000);
    await sleep(250);
  } catch {
  }
};

export const abrirDialogoAsignarDesdeArriba = async (): Promise<void> => {
  await clickPorId('btn-tratamientos-accion-superior');
};

export const abrirDialogoAsignarDesdePrimeraPlantilla = async (): Promise<void> => {
  await clickPorId('btn-tratamientos-asignar-primera-plantilla');
};

export const irATabPlantillaDatos = async (): Promise<void> => {
  await clickPorId('tab-tratamientos-plantilla-datos');
};

export const irATabPlantillaRecursos = async (): Promise<void> => {
  await clickPorId('tab-tratamientos-plantilla-recursos');
};

export const abrirDetallePrimerPlan = async (): Promise<void> => {
  await clickPorId('card-tratamientos-primer-plan');
};

export const irATabDetallePlanCitas = async (): Promise<void> => {
  await clickPorId('tab-tratamientos-detalle-plan-citas');
};

export const irATabDetallePlanPagos = async (): Promise<void> => {
  await clickPorId('tab-tratamientos-detalle-plan-pagos');
};

export const cerrarDialogoConEscape = async (): Promise<void> => {
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
  await sleep(350);
};
