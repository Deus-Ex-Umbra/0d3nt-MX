import { TutorialDefinicion } from '@/contextos/tutoriales/tipos-tutoriales';

export const IDS_ELEMENTOS_AGENDA = {
  TITULO_PAGINA: 'titulo-pagina-agenda',
  BTN_NUEVA_CITA: 'btn-agenda-nueva-cita',
  BTN_FILTROS: 'btn-agenda-filtros',
  BTN_MES_ANTERIOR: 'agenda-btn-mes-anterior',
  BTN_HOY: 'agenda-btn-hoy',
  BTN_MES_SIGUIENTE: 'agenda-btn-mes-siguiente',
  BTN_DIA_ANTERIOR: 'agenda-btn-dia-anterior',
  BTN_DIA_SIGUIENTE: 'agenda-btn-dia-siguiente',
  BTN_AGREGAR_CITA_DIA: 'agenda-btn-agregar-cita-dia',
  COMBOBOX_MES_TRIGGER: 'agenda-combobox-mes',
  COMBOBOX_ANO_TRIGGER: 'agenda-combobox-ano',
  CALENDARIO: 'agenda-calendario',
  DIA_HOY: 'agenda-dia-hoy',
  LISTA_ELEMENTOS: 'agenda-lista-elementos',
  DIALOGO_LISTA_ELEMENTOS: 'agenda-dialogo-lista-elementos',
  SWITCH_HORAS_LIBRES: 'mostrar-horas-libres',
  DIALOG_CITA: 'dialog-gestion-cita',
  INPUT_PACIENTE: 'cita-input-paciente',
  INPUT_FECHA: 'cita-input-fecha',
  INPUT_DESCRIPCION: 'cita-input-descripcion',
  INPUT_HORAS: 'cita-input-horas',
  INPUT_MINUTOS: 'cita-input-minutos',
  BTN_GUARDAR: 'cita-btn-guardar',
  BTN_CANCELAR: 'cita-btn-cancelar',
  TAB_DATOS: 'cita-tab-datos',
  TAB_RECURSOS: 'cita-tab-recursos',
  WIZARD_BTN_AGREGAR_MATERIAL: 'wizard-consumibles-btn-agregar',
  WIZARD_LISTA_INVENTARIOS: 'wizard-consumibles-inventarios',
  WIZARD_LISTA_PRODUCTOS: 'wizard-consumibles-productos',
  WIZARD_LISTA_MATERIALES: 'wizard-consumibles-materiales',
  WIZARD_BTN_AGREGAR_A_LISTA: 'wizard-consumibles-btn-agregar-a-lista',
  WIZARD_LISTA_SELECCIONADOS: 'wizard-consumibles-lista-materiales',
  DIALOG_CONFIRMACION: 'dialog-confirmacion-cita',
  CONFIRM_TAB_DATOS: 'confirmacion-tab-datos',
  CONFIRM_TAB_RECURSOS: 'confirmacion-tab-recursos',
  CONFIRM_INPUT_ESTADO_PAGO: 'confirmacion-input-estado-pago',
  CONFIRM_INPUT_MONTO: 'confirmacion-input-monto',
  CONFIRM_WIZARD: 'confirmacion-wizard-consumibles',
  CONFIRM_BTN_CANCELAR: 'confirmacion-btn-cancelar',
  CONFIRM_BTN_CONFIRMAR: 'confirmacion-btn-confirmar',
  INPUT_ESTADO_PAGO: 'cita-input-estado-pago',
  INPUT_MONTO: 'cita-input-monto',
  TRIGGER_PACIENTE: 'cita-combo-paciente-trigger',
  DIALOG_FILTROS: 'agenda-dialog-filtros',
  FILTRO_BUSQUEDA: 'agenda-filtro-busqueda',
  FILTRO_PACIENTE: 'agenda-filtro-paciente',
  FILTRO_ESTADO_PAGO: 'agenda-filtro-estado-pago',
  FILTRO_FECHA_INICIO: 'agenda-filtro-fecha-inicio',
  FILTRO_FECHA_FIN: 'agenda-filtro-fecha-fin',
  BTN_LIMPIAR_FILTROS_DIALOGO: 'agenda-btn-limpiar-filtros-dialogo',
  BTN_APLICAR_FILTROS_DIALOGO: 'agenda-btn-aplicar-filtros-dialogo',
} as const;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const esElementoVisible = (el: HTMLElement | null): boolean => {
  if (!el) return false;
  if ((el as unknown as { hidden?: boolean }).hidden) return false;
  if (el.closest('[hidden]')) return false;

  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const clickReal = async (elemento: HTMLElement, esperaMilisegundos = 250): Promise<void> => {
  const eventos: Array<[string, MouseEventInit | PointerEventInit]> = [
    ['pointerdown', { bubbles: true, cancelable: true, view: window } as PointerEventInit],
    ['mousedown', { bubbles: true, cancelable: true, view: window } as MouseEventInit],
    ['pointerup', { bubbles: true, cancelable: true, view: window } as PointerEventInit],
    ['mouseup', { bubbles: true, cancelable: true, view: window } as MouseEventInit],
    ['click', { bubbles: true, cancelable: true, view: window } as MouseEventInit],
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

  try {
    elemento.click();
  } catch {
  }

  await sleep(esperaMilisegundos);
};

const setNativeValue = (input: HTMLInputElement, value: string) => {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

const intentarCerrarDialogos = async () => {
  try {
    const ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
    document.dispatchEvent(ev);
  } catch {
  }
  await sleep(250);
};

const seleccionarOpcionCombobox = async (triggerId: string, etiqueta: string) => {
  const trigger = document.getElementById(triggerId) as HTMLElement | null;
  if (!trigger) return;

  for (let intento = 0; intento < 3; intento++) {
    await clickReal(trigger, 150);
    await sleep(150);

    const items = Array.from(document.querySelectorAll('[cmdk-item]')) as HTMLElement[];
    const buscada = etiqueta.trim().toLowerCase();
    const item = items.find(el => (el.textContent || '').trim().toLowerCase() === buscada);
    if (item) {
      await clickReal(item, 250);
      return;
    }

    await sleep(200);
  }
};

const asegurarMesYAnoDeHoy = async () => {
  const hoy = new Date();
  const anio = String(hoy.getFullYear());
  const mesEtiqueta = MESES_ES[hoy.getMonth()] || 'Enero';

  await seleccionarOpcionCombobox(IDS_ELEMENTOS_AGENDA.COMBOBOX_ANO_TRIGGER, anio);
  await sleep(150);
  await seleccionarOpcionCombobox(IDS_ELEMENTOS_AGENDA.COMBOBOX_MES_TRIGGER, mesEtiqueta);
  await sleep(250);
};

const esperarYObtenerElemento = async (getEl: () => HTMLElement | null, intentos = 20, esperaMs = 150) => {
  for (let i = 0; i < intentos; i++) {
    const el = getEl();
    if (el && esElementoVisible(el)) return el;
    await sleep(esperaMs);
  }
  return null;
};

const obtenerBotonDiaHoy = () => {
  const porId = document.getElementById(IDS_ELEMENTOS_AGENDA.DIA_HOY) as HTMLElement | null;
  if (porId) return porId;

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  const clave = `${anio}-${mes}-${dia}`;

  return document.querySelector(`[data-day="${clave}"]`) as HTMLElement | null;
};

const obtenerPrimerDiaVisible = () => {
  const cont = document.getElementById(IDS_ELEMENTOS_AGENDA.CALENDARIO) as HTMLElement | null;
  if (!cont) return null;

  const candidatos = Array.from(cont.querySelectorAll('button[data-day]')) as HTMLElement[];
  const primerVisible = candidatos.find(el => esElementoVisible(el));
  return primerVisible ?? null;
};

const abrirDialogoDeUnDiaVisible = async () => {
  await intentarCerrarDialogos();

  const calendario = document.getElementById(IDS_ELEMENTOS_AGENDA.CALENDARIO);
  calendario?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(200);

  const btn = await esperarYObtenerElemento(() => obtenerBotonDiaHoy() ?? obtenerPrimerDiaVisible(), 25, 150);
  if (btn) {
    await clickReal(btn, 450);
  }
};

const dialogoDiaEstaAbierto = () => {
  return !!(
    document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_AGREGAR_CITA_DIA) ||
    document.getElementById(IDS_ELEMENTOS_AGENDA.DIALOGO_LISTA_ELEMENTOS) ||
    document.getElementById(IDS_ELEMENTOS_AGENDA.SWITCH_HORAS_LIBRES)
  );
};

const asegurarDialogoDiaAbierto = async () => {
  if (dialogoDiaEstaAbierto()) return;
  await abrirDialogoDeUnDiaVisible();
  await sleep(350);
};

export const TUTORIALES_AGENDA: TutorialDefinicion[] = [
  {
    nombre: 'agenda-usar-calendario',
    titulo: '🗓️ Usar el Calendario',
    descripcion: 'Aprende a elegir fechas, navegar días/meses y crear citas desde el calendario.',
    icono: '🗓️',
    pagina: '/agenda',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.CALENDARIO,
        titulo: 'Calendario',
        descripcion: 'Este calendario muestra la ocupación del mes. Puedes hacer clic en un día para abrir el detalle (citas u horas libres).',
        bloquearAtras: true,
        accionPrevia: async () => {
          await intentarCerrarDialogos();
          const el = document.getElementById(IDS_ELEMENTOS_AGENDA.CALENDARIO);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(200);
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.COMBOBOX_ANO_TRIGGER,
        titulo: 'Ir A (Mes / Año)',
        descripcion: 'En “Ir A” puedes saltar a cualquier mes y a cualquier año sin usar las flechas del calendario.',
        accionPrevia: async () => {
          await intentarCerrarDialogos();
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.DIA_HOY,
        titulo: 'Entrar a la fecha de hoy',
        descripcion: 'Este es el día de hoy. Al tocarlo, se abre el detalle del día para ver citas u horas libres.',
        esperarElemento: true,
        accionPrevia: async () => {
          await asegurarMesYAnoDeHoy();
          const el = await esperarYObtenerElemento(() => obtenerBotonDiaHoy(), 25, 150);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(150);
        },
        accionPosterior: async () => {
          const btn = obtenerBotonDiaHoy();
          if (btn) {
            await clickReal(btn, 500);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_AGREGAR_CITA_DIA,
        titulo: 'Crear cita desde el día',
        descripcion: 'Desde el detalle del día puedes crear una cita para esa fecha con “Agregar cita”.',
        esperarElemento: true,
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_DIA_ANTERIOR,
        titulo: 'Navegar entre fechas',
        descripcion: 'Usa estas flechas para moverte al día anterior o siguiente sin cerrar el detalle.',
        esperarElemento: true,
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_DIA_SIGUIENTE,
        titulo: 'Día siguiente',
        descripcion: 'Esto es útil para revisar varios días seguidos rápidamente.',
        esperarElemento: true,
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_HOY,
        titulo: 'Volver a hoy (en el detalle)',
        descripcion: 'Si navegaste varios días, “Hoy” te devuelve al día actual dentro del detalle.',
        esperarElemento: true,
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_MES_SIGUIENTE,
        titulo: 'Navegar entre meses',
        descripcion: 'Estas flechas cambian el mes visible en el calendario para planificar hacia adelante o revisar meses anteriores.',
        accionPrevia: async () => {
          await intentarCerrarDialogos();
          const el = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_MES_SIGUIENTE);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(150);
        },
        accionPosterior: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_MES_SIGUIENTE) as HTMLElement | null;
          if (btn) {
            await clickReal(btn, 450);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_MES_ANTERIOR,
        titulo: 'Volver al mes anterior',
        descripcion: 'Puedes volver al mes anterior con esta flecha. (El tutorial lo hará para regresar al mes original).',
        accionPrevia: async () => {
          await intentarCerrarDialogos();
          await sleep(150);
        },
        accionPosterior: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_MES_ANTERIOR) as HTMLElement | null;
          if (btn) {
            await clickReal(btn, 450);
          }
        },
      },
    ],
  },
  {
    nombre: 'agenda-crear-cita-sin-paciente',
    titulo: '📅 Crear Cita (Evento)',
    descripcion: 'Aprende a crear una cita simple o evento sin paciente asignado.',
    icono: '📅',
    pagina: '/agenda',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_NUEVA_CITA,
        titulo: 'Nueva Cita',
        descripcion: 'Para comenzar, presiona el botón "Nueva Cita". Esto abrirá el formulario de creación.',
        bloquearAtras: true,
        accionPrevia: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_NUEVA_CITA);
          if (btn) {
            btn.click();
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.INPUT_FECHA,
        titulo: 'Fecha y Hora',
        descripcion: 'Selecciona cuándo ocurrirá el evento. Por defecto te sugerimos la hora actual redondeada.',
        esperarElemento: true,
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.INPUT_DESCRIPCION,
        titulo: 'Descripción',
        descripcion: 'Escribe un detalle breve de la cita. Ej: "Reunión de personal" o "Limpieza general".',
      },
      {
        ruta: '/agenda',
        elementoId: 'cita-input-horas-container',
        titulo: 'Duración',
        descripcion: 'Especifica la estimación en horas y minutos. Puedes definir cualquier duración que necesites para visualizar el bloque en la agenda.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_GUARDAR,
        titulo: 'Guardar',
        descripcion: 'Una vez completados los datos, presiona "Crear" para guardar tu cita en el calendario.',
      },
    ],
  },
  {
    nombre: 'agenda-crear-cita-con-paciente',
    titulo: '👤 Crear Cita con Paciente',
    descripcion: 'Programa una cita vinculada a un paciente y gestiona pagos.',
    icono: '👤',
    pagina: '/agenda',
    condicionBloqueo: {
      tipo: 'requiere_datos',
      mensaje: 'Requiere crear un paciente',
      condicionesPrevias: [
        {
          id: 'tiene-pacientes',
          descripcion: 'Crear al menos un paciente',
          completada: false,
        },
      ],
    },
    pasos: [
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_NUEVA_CITA,
        titulo: 'Nueva Cita',
        descripcion: 'Presiona "Nueva Cita" para abrir el formulario de creación.',
        bloquearAtras: true,
        accionPrevia: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_NUEVA_CITA);
          if (btn) {
            btn.click();
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.TRIGGER_PACIENTE,
        titulo: 'Seleccionar Paciente',
        descripcion: 'Selecciona el paciente para vincular la cita. Al avanzar, elegiré automáticamente el primer paciente para que veas el flujo completo.',
        esperarElemento: true,
        accionPrevia: async () => {
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          await sleep(300);
          const trigger = document.getElementById(IDS_ELEMENTOS_AGENDA.TRIGGER_PACIENTE) as HTMLElement | null;
          if (!trigger) return;
          for (let intento = 0; intento < 8; intento++) {
            trigger.click();
            await sleep(250);

            const items = Array.from(document.querySelectorAll('[cmdk-item]')) as HTMLElement[];
            const primerPaciente = items.find(el => {
              const txt = (el.textContent || '').trim().toLowerCase();
              return txt.length > 0 && !txt.includes('evento general');
            });

            if (primerPaciente) {
              primerPaciente.click();
              await sleep(350);
              return;
            }
            await sleep(400);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: 'cita-grupo-campos-basicos',
        titulo: 'Detalles (Fecha → Duración)',
        descripcion: 'Aquí defines la Fecha y Hora, la Descripción y la Duración (horas y minutos). Ajusta la duración que necesites según el tipo de atención.',
        accionPrevia: async () => {
          const el = document.getElementById('cita-grupo-campos-basicos');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.INPUT_ESTADO_PAGO,
        titulo: 'Estado de Pago',
        descripcion: 'Por defecto es "Pendiente". Solo modificable en "Edición Histórica" (para registrar citas pasadas).',
        accionPrevia: async () => {
          const el = document.getElementById(IDS_ELEMENTOS_AGENDA.INPUT_ESTADO_PAGO);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.INPUT_MONTO,
        titulo: 'Monto y Conversión',
        descripcion: 'Define el monto. Se convertirá automáticamente a la otra moneda según el cambio del día.',
        accionPrevia: async () => {
          const el = document.getElementById(IDS_ELEMENTOS_AGENDA.INPUT_MONTO);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_GUARDAR,
        titulo: 'Finalizar',
        descripcion: 'Guarda la cita para agendarla vinculada al paciente.',
      },
    ],
  },

  {
    nombre: 'agenda-crear-cita-con-recursos',
    titulo: '📦 Crear Cita con Recursos',
    descripcion: 'Asigna consumibles a una cita para reservarlos y luego confirmarlos (descuento automático).',
    icono: '📦',
    pagina: '/agenda',
    condicionBloqueo: {
      tipo: 'requiere_datos',
      mensaje: 'Requiere pacientes e inventario con consumibles y stock',
      condicionesPrevias: [
        { id: 'tiene-pacientes', descripcion: 'Crear al menos un paciente', completada: false },
        { id: 'tiene-inventarios', descripcion: 'Crear al menos un inventario', completada: false },
        { id: 'tiene-producto-consumible', descripcion: 'Crear un Producto Consumible', completada: false },
        { id: 'tiene-stock-consumible', descripcion: 'Tener stock en un producto consumible', completada: false },
      ],
    },
    pasos: [
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_NUEVA_CITA,
        titulo: 'Abrir Nueva Cita',
        descripcion: 'Abriré el formulario de creación para asignar recursos desde la pestaña “Recursos”.',
        bloquearAtras: true,
        accionPrevia: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_NUEVA_CITA);
          if (btn) {
            btn.click();
            await sleep(800);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.TRIGGER_PACIENTE,
        titulo: 'Seleccionar Paciente',
        descripcion: 'Para poder asignar recursos, la cita debe tener un paciente. Seleccionaré automáticamente el primero.',
        esperarElemento: true,
        accionPrevia: async () => {
          await sleep(250);
          const trigger = document.getElementById(IDS_ELEMENTOS_AGENDA.TRIGGER_PACIENTE) as HTMLElement | null;
          if (!trigger) return;

          for (let intento = 0; intento < 8; intento++) {
            trigger.click();
            await sleep(250);

            const items = Array.from(document.querySelectorAll('[cmdk-item]')) as HTMLElement[];
            const primerPaciente = items.find(el => {
              const txt = (el.textContent || '').trim().toLowerCase();
              return txt.length > 0 && !txt.includes('evento general');
            });

            if (primerPaciente) {
              primerPaciente.click();
              await sleep(350);
              return;
            }

            await sleep(400);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.TAB_RECURSOS,
        titulo: 'Ir a Recursos',
        descripcion: 'Ahora iré a la pestaña “Recursos”. Aquí puedes agregar consumibles (materiales) que la cita va a utilizar.',
        esperarElemento: true,
        accionPrevia: async () => {
          for (let i = 0; i < 12; i++) {
            const dialogo = document.getElementById(IDS_ELEMENTOS_AGENDA.DIALOG_CITA);
            if (dialogo) break;
            await sleep(150);
          }

          const tab = document.getElementById(IDS_ELEMENTOS_AGENDA.TAB_RECURSOS) as HTMLElement | null;
          if (!tab) return;

          tab.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(150);

          for (let intento = 0; intento < 6; intento++) {
            await clickReal(tab, 250);

            const cont = document.getElementById('cita-recursos-contenido') as HTMLElement | null;
            if (cont && esElementoVisible(cont)) {
              cont.scrollIntoView({ behavior: 'smooth', block: 'start' });
              await sleep(200);
              return;
            }
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.WIZARD_BTN_AGREGAR_MATERIAL,
        titulo: 'Agregar Material',
        descripcion: 'Presiona “Agregar Material” para elegir: Inventario → Producto → Lote/Serie. El tutorial lo hará automáticamente para que veas el flujo.',
        accionPrevia: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.WIZARD_BTN_AGREGAR_MATERIAL) as HTMLElement | null;
          if (btn) {
            btn.click();
            await sleep(350);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.WIZARD_LISTA_INVENTARIOS,
        titulo: 'Seleccionar Inventario',
        descripcion: 'Aquí eliges el inventario desde el que saldrán los consumibles. Seleccionaré el primero disponible.',
        esperarElemento: true,
        accionPrevia: async () => {
          await sleep(250);
          const cont = document.getElementById(IDS_ELEMENTOS_AGENDA.WIZARD_LISTA_INVENTARIOS);
          const primer = cont?.querySelector('[data-wizard-inventario-card="true"]') as HTMLElement | null;
          if (primer) {
            primer.click();
            await sleep(650);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.WIZARD_LISTA_PRODUCTOS,
        titulo: 'Seleccionar Producto Consumible',
        descripcion: 'Ahora eliges el producto consumible (ej. guantes, anestesia, resina…). Seleccionaré el primero.',
        esperarElemento: true,
        accionPrevia: async () => {
          await sleep(250);
          const cont = document.getElementById(IDS_ELEMENTOS_AGENDA.WIZARD_LISTA_PRODUCTOS);
          const primer = cont?.querySelector('[data-wizard-producto-card="true"]') as HTMLElement | null;
          if (primer) {
            primer.click();
            await sleep(450);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.WIZARD_LISTA_MATERIALES,
        titulo: 'Seleccionar Lote/Serie',
        descripcion: 'Cada “material” suele representar un lote/serie. Seleccionaré uno con stock y lo agregaré a la lista.',
        esperarElemento: true,
        accionPrevia: async () => {
          await sleep(250);
          const cont = document.getElementById(IDS_ELEMENTOS_AGENDA.WIZARD_LISTA_MATERIALES);
          if (!cont) return;

          const candidatos = Array.from(cont.querySelectorAll('[data-wizard-material-card="true"]')) as HTMLElement[];
          const primeroConStock = candidatos.find(el => {
            const stock = Number(el.getAttribute('data-wizard-material-stock') || '0');
            const disabled = (el.getAttribute('data-wizard-material-disabled') || 'false') === 'true';
            return !disabled && stock > 0;
          });

          if (primeroConStock) {
            primeroConStock.click();
            await sleep(350);
          }

          const btnAgregar = document.getElementById(IDS_ELEMENTOS_AGENDA.WIZARD_BTN_AGREGAR_A_LISTA) as HTMLElement | null;
          if (btnAgregar) {
            btnAgregar.click();
            await sleep(450);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.WIZARD_LISTA_SELECCIONADOS,
        titulo: 'Ajustar cantidades',
        descripcion: 'En la lista puedes ajustar la cantidad usada/planeada y ver advertencias si excede el stock.',
        esperarElemento: true,
        accionPrevia: async () => {
          await sleep(250);
          const cont = document.getElementById(IDS_ELEMENTOS_AGENDA.WIZARD_LISTA_SELECCIONADOS);
          const input = cont?.querySelector('input[type="number"][data-wizard-cantidad-input="true"]') as HTMLInputElement | null;
          if (input) {
            setNativeValue(input, '2');
            await sleep(250);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_GUARDAR,
        titulo: 'Guardar (reserva) y confirmación posterior',
        descripcion: 'Al guardar, dejas los recursos asociados a la cita. Luego, cuando la cita finaliza, podrás “Confirmar” para descontar automáticamente del inventario y ajustar lo que realmente se usó.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_CANCELAR,
        titulo: 'Cerrar',
        descripcion: 'Cerraré el formulario (sin guardar) para no crear datos de prueba durante el tutorial.',
        accionPosterior: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_CANCELAR) as HTMLElement | null;
          if (btn) {
            btn.click();
            await sleep(450);
          }
        },
      },
    ],
  },

  {
    nombre: 'agenda-usar-filtros-navegar',
    titulo: '🔎 Usar Filtros y Navegar',
    descripcion: 'Aprende a filtrar la lista y moverte entre meses (y cómo quitar filtros).',
    icono: '🔎',
    pagina: '/agenda',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_FILTROS,
        titulo: 'Abrir Filtros',
        descripcion: 'Usa “Filtros” para buscar por texto, paciente, estado de pago o por un intervalo de fecha y hora.',
        bloquearAtras: true,
        accionPrevia: async () => {
          const sw = document.getElementById(IDS_ELEMENTOS_AGENDA.SWITCH_HORAS_LIBRES);
          if (sw && sw.getAttribute('data-state') === 'checked') {
            (sw as HTMLElement).click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_FILTROS);
          if (btn) {
            btn.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.FILTRO_BUSQUEDA,
        titulo: 'Búsqueda por texto',
        descripcion: 'Escribe una palabra para buscar en la descripción de tus citas (ej: “control”, “limpieza”, “revisión”).',
        esperarElemento: true,
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.FILTRO_PACIENTE,
        titulo: 'Filtrar por paciente',
        descripcion: 'Selecciona un paciente específico para ver solo sus citas.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.FILTRO_ESTADO_PAGO,
        titulo: 'Filtrar por estado',
        descripcion: 'También puedes filtrar por “Pendiente / Pagado / Cancelado”.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.FILTRO_FECHA_INICIO,
        titulo: 'Intervalo: inicio',
        descripcion: 'Define el inicio del rango. Al usar intervalo de fecha/hora, la navegación por mes se deshabilita para evitar inconsistencias.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.FILTRO_FECHA_FIN,
        titulo: 'Intervalo: fin',
        descripcion: 'Define el fin del rango. Útil para ver citas (o horas libres) de un periodo exacto.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_APLICAR_FILTROS_DIALOGO,
        titulo: 'Aplicar',
        descripcion: 'Presiona “Aplicar Filtros” para ver la lista filtrada.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_FILTROS,
        titulo: 'Quitar filtros',
        descripcion: 'Si quieres volver a ver todo, abre filtros nuevamente y usa “Limpiar”.',
        bloquearAtras: true,
        accionPrevia: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_FILTROS);
          if (btn) {
            btn.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_LIMPIAR_FILTROS_DIALOGO,
        titulo: 'Limpiar',
        descripcion: '“Limpiar” borra todos los filtros y vuelve al estado normal de navegación.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_MES_ANTERIOR,
        titulo: 'Mes anterior',
        descripcion: 'Para navegar al pasado, este botón puede estar bloqueado cuando estás en el mes actual y NO tienes filtros activos. Si necesitas ver citas pasadas, aplica un intervalo de fecha/hora desde “Filtros”.',
        accionPrevia: async () => {
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          const dialogMarker = document.getElementById(IDS_ELEMENTOS_AGENDA.DIALOG_FILTROS);
          if (dialogMarker) {
            const ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
            document.dispatchEvent(ev);
            await sleep(450);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.COMBOBOX_MES_TRIGGER,
        titulo: 'Volver al mes actual',
        descripcion: 'Si necesitas saltar rápido, usa “Ir A” para escoger el mes/año actual (o cualquier otro).',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_MES_SIGUIENTE,
        titulo: 'Mes siguiente',
        descripcion: 'Navega al mes siguiente para planificar hacia adelante.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.LISTA_ELEMENTOS,
        titulo: 'Resultado en la lista',
        descripcion: 'La lista refleja los filtros aplicados y/o el mes que estás visualizando.',
      },
    ],
  },

  {
    nombre: 'agenda-usar-horas-libres',
    titulo: '🟩 Usar Horas Libres',
    descripcion: 'Visualiza espacios libres y crea una cita desde una perspectiva de tiempos disponibles/ocupados.',
    icono: '🟩',
    pagina: '/agenda',
    condicionBloqueo: {
      tipo: 'requiere_datos',
      mensaje: 'Requiere crear una cita',
      condicionesPrevias: [
        {
          id: 'tiene-citas',
          descripcion: 'Crear al menos una cita',
          completada: false,
        },
      ],
    },
    pasos: [
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.CALENDARIO,
        titulo: 'Abrir un día (detalle)',
        descripcion: 'Primero abriré el detalle de un día desde el calendario. A partir de aquí, todo lo haremos dentro del diálogo del día.',
        bloquearAtras: true,
        accionPrevia: async () => {
          await intentarCerrarDialogos();
          const el = document.getElementById(IDS_ELEMENTOS_AGENDA.CALENDARIO);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(200);
        },
        accionPosterior: async () => {
          await abrirDialogoDeUnDiaVisible();
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.SWITCH_HORAS_LIBRES,
        titulo: 'Cambiar la perspectiva: Horas Libres ↔ Citas',
        descripcion: 'Este switch alterna entre “Ver Citas” y “Ver Horas Libres”. Actívalo para ver espacios disponibles; si lo vuelves a presionar, regresas a la vista de citas.',
        esperarElemento: true,
        accionPrevia: async () => {
          await asegurarDialogoDiaAbierto();
          const sw = document.getElementById(IDS_ELEMENTOS_AGENDA.SWITCH_HORAS_LIBRES);
          if (sw && sw.getAttribute('data-state') !== 'checked') {
            (sw as HTMLElement).click();
            await sleep(850);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.DIALOGO_LISTA_ELEMENTOS,
        titulo: 'Ver horas libres',
        descripcion: 'Aquí verás bloques “Hora libre - Clic para agendar”. Cada bloque representa un inicio posible y una duración máxima disponible según tus citas/bloqueos.',
        esperarElemento: true,
        accionPrevia: async () => {
          await asegurarDialogoDiaAbierto();
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.DIALOGO_LISTA_ELEMENTOS,
        titulo: 'Abrir una hora libre',
        descripcion: 'Las horas libres son clickeables. Para que veas el flujo sin depender de un clic manual, en este paso el tutorial abrirá una hora libre automáticamente y te llevará al formulario de creación.',
        accionPrevia: async () => {
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          await asegurarDialogoDiaAbierto();
          const sw = document.getElementById(IDS_ELEMENTOS_AGENDA.SWITCH_HORAS_LIBRES);
          if (sw && sw.getAttribute('data-state') !== 'checked') {
            (sw as HTMLElement).click();
            await sleep(850);
          }
          const yaExisteDialogo = !!document.getElementById(IDS_ELEMENTOS_AGENDA.DIALOG_CITA);
          if (yaExisteDialogo) return;

          for (let i = 0; i < 14; i++) {
            const existe = document.querySelector('[data-agenda-hora-libre="true"]') as HTMLElement | null;
            if (existe) break;
            await sleep(250);
          }

          const primerLibre = document.querySelector('[data-agenda-hora-libre="true"]') as HTMLElement | null;
          if (primerLibre) {
            primerLibre.click();
            await sleep(850);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: 'cita-input-horas-container',
        titulo: 'Enfoque del formulario: horas y minutos',
        descripcion: 'Este diálogo es el mismo de “Crear Cita”, pero abierto desde una hora libre. El inicio se establece según la hora que clickeaste y, por defecto, la duración comienza en 30 minutos. Puedes aumentar horas/minutos hasta el máximo disponible o dejarlo en 30 min si solo necesitas un espacio corto.',
        accionPrevia: async () => {
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          const yaExisteDialogo = !!document.getElementById(IDS_ELEMENTOS_AGENDA.DIALOG_CITA);
          if (!yaExisteDialogo) {
            const primerLibre = document.querySelector('[data-agenda-hora-libre="true"]') as HTMLElement | null;
            if (primerLibre) {
              primerLibre.click();
              await sleep(850);
            }
          }
          const el = document.getElementById('cita-input-horas-container');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        },
        esperarElemento: true,
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.BTN_CANCELAR,
        titulo: 'Cerrar el diálogo',
        descripcion: 'Cuando termines de revisar o ajustar la duración, puedes cerrar el formulario con “Cancelar” (no guarda cambios).',
        accionPosterior: async () => {
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.BTN_CANCELAR) as HTMLElement | null;
          if (btn) {
            btn.click();
            await sleep(500);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.SWITCH_HORAS_LIBRES,
        titulo: 'Conclusión',
        descripcion: '“Horas libres” es otra forma de crear una cita: en vez de partir de la lista de citas, partes de los espacios disponibles. Puedes volver a “Ver Citas” con este switch cuando quieras (y si necesitas acotar periodos, puedes usar “Filtros” también en esta vista).',
        accionPrevia: async () => {
          await asegurarDialogoDiaAbierto();
        },
      },
    ],
  },

  {
    nombre: 'agenda-confirmar-cerrar-cita',
    titulo: '✅ Cerrar/Confirmar Cita',
    descripcion: 'Cuando una cita con paciente finaliza, puedes cerrarla: estado de pago, monto final y consumibles usados.',
    icono: '✅',
    pagina: '/agenda',
    condicionBloqueo: {
      tipo: 'requiere_datos',
      mensaje: 'Requiere una cita con paciente que ya haya concluido',
      condicionesPrevias: [
        { id: 'tiene-cita-con-paciente', descripcion: 'Crear una cita con paciente', completada: false },
        { id: 'tiene-cita-concluida', descripcion: 'Que una cita ya haya concluido', completada: false },
      ],
    },
    pasos: [
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.LISTA_ELEMENTOS,
        titulo: 'Botón de confirmación',
        descripcion: 'Cuando una cita con paciente ya finalizó, verás un botón de confirmación (✅). Abriré el cierre automáticamente para que veas el diálogo.',
        bloquearAtras: true,
        accionPrevia: async () => {
          const tryOpen = async () => {
            const btn = document.querySelector('button[title^="Confirmar Cita"]') as HTMLElement | null;
            if (btn) {
              btn.click();
              await sleep(700);
              return true;
            }
            return false;
          };

          for (let i = 0; i < 8; i++) {
            const ok = await tryOpen();
            if (ok) return;
            await sleep(350);
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.CONFIRM_INPUT_ESTADO_PAGO,
        titulo: 'Estado de pago',
        descripcion: 'Define si quedó “Pagado”, “Pendiente” o “Cancelado”. Esto impacta el estado final registrado de la cita (y puede disparar acciones sobre el pago si aplica).',
        esperarElemento: true,
        accionPrevia: async () => {
          for (let i = 0; i < 12; i++) {
            const dialogo = document.getElementById(IDS_ELEMENTOS_AGENDA.DIALOG_CONFIRMACION);
            if (dialogo) break;
            await sleep(150);
          }

          const tabDatos = document.getElementById(IDS_ELEMENTOS_AGENDA.CONFIRM_TAB_DATOS) as HTMLElement | null;
          if (tabDatos) {
            await clickReal(tabDatos, 250);
          }

          const el = document.getElementById(IDS_ELEMENTOS_AGENDA.CONFIRM_INPUT_ESTADO_PAGO);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(200);
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.CONFIRM_INPUT_MONTO,
        titulo: 'Monto final',
        descripcion: 'Registra el monto final realmente cobrado (o 0 si no aplica). Es útil cuando el monto esperado cambió.',
        accionPrevia: async () => {
          const el = document.getElementById(IDS_ELEMENTOS_AGENDA.CONFIRM_INPUT_MONTO);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(200);
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.CONFIRM_TAB_RECURSOS,
        titulo: 'Agregar recursos usados al cierre',
        descripcion: 'Si durante la cita usaste consumibles no planificados, aquí puedes agregarlos antes de confirmar. Iré a la pestaña de recursos.',
        esperarElemento: true,
        accionPrevia: async () => {
          const tab = document.getElementById(IDS_ELEMENTOS_AGENDA.CONFIRM_TAB_RECURSOS) as HTMLElement | null;
          if (!tab) return;

          tab.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(150);

          for (let intento = 0; intento < 6; intento++) {
            await clickReal(tab, 250);

            const wizard = document.getElementById(IDS_ELEMENTOS_AGENDA.CONFIRM_WIZARD) as HTMLElement | null;
            if (wizard && esElementoVisible(wizard)) {
              wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
              await sleep(200);
              return;
            }
          }
        },
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.CONFIRM_WIZARD,
        titulo: 'Consumibles utilizados',
        descripcion: 'Este wizard funciona igual que en “Recursos”: puedes agregar, quitar y ajustar cantidades. Al confirmar, se actualiza el inventario automáticamente.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.CONFIRM_BTN_CONFIRMAR,
        titulo: 'Confirmar (sin ejecutarlo en el tutorial)',
        descripcion: 'Este botón confirma el cierre y descuenta materiales. En este tutorial NO lo presionaré para no modificar inventarios; solo es para que entiendas el flujo.',
      },
      {
        ruta: '/agenda',
        elementoId: IDS_ELEMENTOS_AGENDA.CONFIRM_BTN_CANCELAR,
        titulo: 'Cerrar diálogo',
        descripcion: 'Cerraré el diálogo de cierre.',
        accionPosterior: async () => {
          const btn = document.getElementById(IDS_ELEMENTOS_AGENDA.CONFIRM_BTN_CANCELAR) as HTMLElement | null;
          if (btn) {
            btn.click();
            await sleep(450);
          }
        },
      },
    ],
  },
];
