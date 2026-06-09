export const limpiarAccionesPendientes = (): void => {
  console.debug('[Tutorial Pacientes] Limpiando contexto de acciones');
};

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
    const eventos: Array<[string, MouseEventInit | PointerEventInit]> = [
      ['pointerdown', { bubbles: true } as PointerEventInit],
      ['mousedown', { bubbles: true } as MouseEventInit],
      ['pointerup', { bubbles: true } as PointerEventInit],
      ['mouseup', { bubbles: true } as MouseEventInit],
      ['click', { bubbles: true } as MouseEventInit],
    ];

    try {
      (elemento as HTMLElement).focus?.();
    } catch {
    }

    for (const [tipo, init] of eventos) {
      try {
        if (tipo.startsWith('pointer')) {
          elemento.dispatchEvent(new PointerEvent(tipo, init as PointerEventInit));
        } else {
          elemento.dispatchEvent(new MouseEvent(tipo, init as MouseEventInit));
        }
      } catch {
      }
    }
    elemento.click();
    await new Promise(resolve => setTimeout(resolve, esperaMilisegundos));
  } catch (error) {
    console.warn(`No se pudo hacer click en ${selector}:`, error);
  }
};

const clickNodo = async (elemento: HTMLElement, esperaMilisegundos = 300): Promise<void> => {
  try {
    const eventos: Array<[string, MouseEventInit | PointerEventInit]> = [
      ['pointerdown', { bubbles: true } as PointerEventInit],
      ['mousedown', { bubbles: true } as MouseEventInit],
      ['pointerup', { bubbles: true } as PointerEventInit],
      ['mouseup', { bubbles: true } as MouseEventInit],
      ['click', { bubbles: true } as MouseEventInit],
    ];

    try {
      elemento.focus?.();
    } catch {
    }

    for (const [tipo, init] of eventos) {
      try {
        if (tipo.startsWith('pointer')) {
          elemento.dispatchEvent(new PointerEvent(tipo, init as PointerEventInit));
        } else {
          elemento.dispatchEvent(new MouseEvent(tipo, init as MouseEventInit));
        }
      } catch {
      }
    }

    elemento.click();
    await new Promise(resolve => setTimeout(resolve, esperaMilisegundos));
  } catch (error) {
    console.warn('No se pudo hacer click en nodo:', error);
  }
};

const esScrollContenedor = (el: HTMLElement): boolean => {
  const estilo = window.getComputedStyle(el);
  const overflowY = estilo.overflowY;
  const overflowX = estilo.overflowX;
  const overflow = estilo.overflow;

  const puedeScrollY = ['auto', 'scroll', 'overlay'].includes(overflowY);
  const puedeScrollX = ['auto', 'scroll', 'overlay'].includes(overflowX);
  const puedeScroll = ['auto', 'scroll', 'overlay'].includes(overflow);

  const hayOverflowY = el.scrollHeight > el.clientHeight + 4;
  const hayOverflowX = el.scrollWidth > el.clientWidth + 4;

  return (puedeScrollY && hayOverflowY) || (puedeScrollX && hayOverflowX) || (puedeScroll && (hayOverflowY || hayOverflowX));
};

const encontrarScrollPadre = (el: HTMLElement): HTMLElement | null => {
  let actual: HTMLElement | null = el.parentElement;
  while (actual && actual !== document.body) {
    if (esScrollContenedor(actual)) return actual;
    actual = actual.parentElement;
  }
  return null;
};

const scrollEnContenedor = async (contenedor: HTMLElement, elemento: HTMLElement): Promise<void> => {
  const rectContenedor = contenedor.getBoundingClientRect();
  const rectElemento = elemento.getBoundingClientRect();

  const objetivo = rectElemento.top - rectContenedor.top + contenedor.scrollTop - contenedor.clientHeight / 2 + rectElemento.height / 2;

  contenedor.scrollTo({
    top: Math.max(0, objetivo),
    behavior: 'smooth',
  });
  await new Promise(resolve => setTimeout(resolve, 350));
  contenedor.scrollTo({
    top: Math.max(0, objetivo),
    behavior: 'auto',
  });
  await new Promise(resolve => setTimeout(resolve, 50));
};

export const scrollAElemento = async (selector: string): Promise<void> => {
  try {
    const elemento = await esperarElemento(selector);
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    await new Promise(resolve => setTimeout(resolve, 150));
    const contenedor = encontrarScrollPadre(elemento);
    if (contenedor) {
      await scrollEnContenedor(contenedor, elemento);
    } else {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  } catch (error) {
    console.warn(`No se pudo hacer scroll a ${selector}:`, error);
  }
};

export const abrirDialogoNuevoPaciente = async (): Promise<void> => {
  await clickElemento('#btn-pacientes-nuevo', 500);
};

export const prepararDialogoPacienteParaTutorial = async (): Promise<void> => {
  await esperarElemento('#dialog-pacientes-form');
  await clickElemento('#paciente-tab-datos-generales', 200);
  try {
    const contenedor = await esperarElemento('#dialog-paciente-scroll');
    contenedor.scrollTop = 0;
    await new Promise(resolve => setTimeout(resolve, 80));
  } catch {
  }
};

export const enfocarNombrePaciente = async (): Promise<void> => {
  await clickElemento('#paciente-nombre', 150);
};

export const scrollANotasGenerales = async (): Promise<void> => {
  await scrollAElemento('#paciente-notas-generales');
};

export const scrollAColores = async (): Promise<void> => {
  await scrollAElemento('#paciente-colores-container');
};

export const irATabInformacionMedica = async (): Promise<void> => {
  await clickElemento('#paciente-tab-info-medica', 250);
  try {
    await esperarElemento('#paciente-alergias', 2500);
    await scrollAElemento('#paciente-alergias');
  } catch {
  }
};

export const cerrarDialogoPaciente = async (): Promise<void> => {
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

export const presionarEscape = async (): Promise<void> => {
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

export const abrirEdicionPrimerPaciente = async (): Promise<void> => {
  await clickElemento('#btn-pacientes-editar-primer', 600);
  await esperarElemento('#dialog-pacientes-form', 12000);
};

export const irATabHistoriaClinica = async (): Promise<void> => {
  await clickElemento('#paciente-tab-info-medica', 250);
  try {
    await esperarElemento('#paciente-historia', 8000);
  } catch {
  }
  await scrollAElemento('#paciente-historia');
};

export const asegurarVersionHistoriaClinica = async (): Promise<void> => {
  const btnCrearPrimera = document.querySelector('#btn-historia-crear-primera') as HTMLElement | null;
  if (btnCrearPrimera) {
    await clickElemento('#btn-historia-crear-primera', 800);
  }
  await esperarElemento('#historia-combobox-version', 6000);
  await scrollAElemento('#historia-combobox-version');
};

export const abrirOdontogramaPrimerPaciente = async (): Promise<void> => {
  await clickElemento('#btn-pacientes-odontograma-primer', 600);
  try {
    await Promise.race([
      esperarElemento('#dialog-odontograma-inicial', 7000),
      esperarElemento('#dialog-odontograma', 7000),
    ]);
  } catch {
  }
};

export const prepararOdontogramaParaTutorial = async (): Promise<void> => {
  await esperarElemento('#dialog-odontograma', 12000);
  await clickElemento('#odontograma-btn-vista', 250);
};

export const cambiarOdontogramaAModoEdicion = async (): Promise<void> => {
  await esperarElemento('#dialog-odontograma', 12000);
  await clickElemento('#odontograma-btn-editar', 300);
};

export const abrirSelectorSimbologiaOdontograma = async (): Promise<void> => {
  await esperarElemento('#dialog-odontograma', 12000);
  await clickElemento('#odontograma-btn-agregar-simbologia', 400);
  await esperarElemento('#dialog-selector-simbologia', 12000);
};

export const cerrarSelectorSimbologiaOdontograma = async (): Promise<void> => {
  await presionarEscape();
};

export const irATabHerramientasOdontograma = async (): Promise<void> => {
  await esperarElemento('#dialog-odontograma', 12000);
  await clickElemento('#odontograma-tab-herramientas', 300);
};

export const abrirDetallePrimerPaciente = async (): Promise<void> => {
  await clickElemento('#btn-pacientes-ver-primer', 600);
  await esperarElemento('#dialog-pacientes-ver', 12000);
};

export const prepararDialogoVerPacienteParaTutorial = async (): Promise<void> => {
  await esperarElemento('#dialog-pacientes-ver');
  try {
    await esperarElemento('#paciente-ver-tabs', 12000);
  } catch {
  }
  await clickElemento('#paciente-ver-tab-contacto', 200);
};

export const irATabVerContacto = async (): Promise<void> => {
  await clickElemento('#paciente-ver-tab-contacto', 200);
  await new Promise(resolve => setTimeout(resolve, 150));
};

export const irATabVerMedico = async (): Promise<void> => {
  await clickElemento('#paciente-ver-tab-medico', 250);
  try {
    await esperarElemento('#paciente-ver-medico-seccion', 6000);
    await scrollAElemento('#paciente-ver-medico-seccion');
  } catch {
  }
};

export const irATabVerArchivos = async (): Promise<void> => {
  await clickElemento('#paciente-ver-tab-archivos', 250);
  try {
    await esperarElemento('#btn-gestor-archivos-subir', 6000);
  } catch {
  }
};

export const abrirDialogoSubirArchivo = async (): Promise<void> => {
  await clickElemento('#btn-gestor-archivos-subir', 350);
  try {
    await esperarElemento('#archivo', 6000);
  } catch {
  }
};

export const abrirDialogoConsentimientoPrimerPaciente = async (): Promise<void> => {
  await abrirDetallePrimerPaciente();
  await prepararDialogoVerPacienteParaTutorial();
  await irATabVerArchivos();

  await clickElemento('#btn-gestor-archivos-consentimiento', 400);
  try {
    await esperarElemento('#dialog-consentimiento-generar', 12000);
    await esperarElemento('#consentimiento-buscar-plantilla', 8000);
  } catch {
  }
};

export const abrirDialogoConsentimiento = async (): Promise<void> => {
  await clickElemento('#btn-gestor-archivos-consentimiento', 400);
  try {
    await esperarElemento('#dialog-consentimiento-generar', 12000);
  } catch {
  }
};

export const abrirDialogoRecetaPrimerPaciente = async (): Promise<void> => {
  await abrirDetallePrimerPaciente();
  await prepararDialogoVerPacienteParaTutorial();
  await irATabVerArchivos();

  await clickElemento('#btn-gestor-archivos-recetar', 400);
  try {
    await esperarElemento('#dialog-receta-generar', 12000);
    await esperarElemento('#receta-buscar-plantilla', 8000);
  } catch {
  }
};

export const abrirDialogoReceta = async (): Promise<void> => {
  await clickElemento('#btn-gestor-archivos-recetar', 400);
  try {
    await esperarElemento('#dialog-receta-generar', 12000);
  } catch {
  }
};

export const seleccionarPrimeraPlantillaConsentimiento = async (): Promise<void> => {
  try {
    await esperarElemento('#consentimiento-lista-plantillas', 12000);
    const lista = document.querySelector('#consentimiento-lista-plantillas') as HTMLElement | null;
    const boton = (lista?.querySelector('button') ?? null) as HTMLElement | null;
    if (!boton) {
      await saltarAlFinalTutorial();
      return;
    }

    try {
      boton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } catch {
    }
    await clickNodo(boton, 350);
    await esperarElemento('#consentimiento-btn-cambiar-plantilla', 12000);
  } catch {
    await saltarAlFinalTutorial();
  }
};

export const seleccionarPrimeraPlantillaReceta = async (): Promise<void> => {
  try {
    await esperarElemento('#receta-lista-plantillas', 12000);

    const lista = document.querySelector('#receta-lista-plantillas') as HTMLElement | null;
    const boton = (lista?.querySelector('button') ?? null) as HTMLElement | null;

    if (!boton) {
      await saltarAlFinalTutorial();
      return;
    }

    try {
      boton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } catch {
    }
    await clickNodo(boton, 350);
    await esperarElemento('#receta-medicamentos', 12000);
  } catch {
    await saltarAlFinalTutorial();
  }
};

export const cerrarDialogoSuperior = async (): Promise<void> => {
  const evento = new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(evento);
  await new Promise(resolve => setTimeout(resolve, 250));
};

const obtenerDriverTutorial = (): any => {
  try {
    return (window as any).__tutorialDriverInstance;
  } catch {
    return null;
  }
};

const obtenerUltimoPasoIndex = (): number | null => {
  try {
    const idx = (window as any).__tutorialLastStepIndex;
    return typeof idx === 'number' ? idx : null;
  } catch {
    return null;
  }
};

export const saltarAlFinalTutorial = async (): Promise<void> => {
  const driver = obtenerDriverTutorial();
  const last = obtenerUltimoPasoIndex();
  if (!driver || last === null) return;

  try {
    if (typeof driver.moveTo === 'function') {
      driver.moveTo(last);
      return;
    }
    if (typeof driver.moveNext === 'function') {
      for (let i = 0; i < 30; i++) {
        driver.moveNext();
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  } catch {
  }
};

export const siNoSeleccionoArchivoSaltarAlFinal = async (): Promise<void> => {
  try {
    const input = document.querySelector('#archivo') as HTMLInputElement | null;
    const tieneArchivo = Boolean(input?.files && input.files.length > 0);
    if (!tieneArchivo) {
      await saltarAlFinalTutorial();
    }
  } catch {
  }
};

export const siNoSeleccionoPlantillaConsentimientoSaltarAlFinal = async (): Promise<void> => {
  try {
    const btnCambiar = document.querySelector('#consentimiento-btn-cambiar-plantilla') as HTMLElement | null;
    if (!btnCambiar) {
      await saltarAlFinalTutorial();
    }
  } catch {
  }
};

export const siNoSeleccionoPlantillaRecetaSaltarAlFinal = async (): Promise<void> => {
  try {
    const btnGenerar = document.querySelector('#receta-btn-generar-y-guardar') as HTMLElement | null;
    if (!btnGenerar) {
      await saltarAlFinalTutorial();
    }
  } catch {
  }
};
