import { TutorialDefinicion } from '@/contextos/tutoriales/tipos-tutoriales';
import {
  abrirDialogoAsignarDesdePrimeraPlantilla,
  abrirDialogoNuevaPlantillaDesdeArriba,
  abrirDetallePrimerPlan,
  asegurarDialogoPlantillaAbierto,
  enfocarPorId,
  irATabDetallePlanPagos,
  irATabPlanesTratamientos,
  irATabPlantillaDatos,
  irATabPlantillaRecursos,
  irATabPlantillasTratamientos,
  sleep,
  scrollAElemento,
  cerrarDialogoConEscape,
} from './acciones-tutoriales';

export const IDS_ELEMENTOS_TRATAMIENTOS = {
  TITULO_PAGINA: 'titulo-pagina-tratamientos',
  TAB_PLANES: 'tab-tratamientos-planes',
  TAB_PLANTILLAS: 'tab-tratamientos-plantillas',
  BTN_ACCION_SUPERIOR: 'btn-tratamientos-accion-superior',
  CARD_PRIMER_PLAN: 'card-tratamientos-primer-plan',
  BTN_ASIGNAR_PRIMERA_PLANTILLA: 'btn-tratamientos-asignar-primera-plantilla',
  LISTA_PLANTILLAS: 'lista-tratamientos-plantillas',
  DIALOG_PLANTILLA: 'dialog-tratamientos-plantilla',
  INPUT_PLANTILLA_NOMBRE: 'tratamientos-plantilla-nombre',
  INPUT_PLANTILLA_NUMERO_CITAS: 'tratamientos-plantilla-numero-citas',
  SECCION_PLANTILLA_INTERVALO: 'tratamientos-plantilla-intervalo',
  SECCION_PLANTILLA_DURACION: 'tratamientos-plantilla-duracion',
  SECCION_PLANTILLA_COSTO: 'tratamientos-plantilla-costo',
  SECCION_PLANTILLA_RECURSOS_WIZARD: 'tratamientos-plantilla-recursos-wizard',
  TAB_PLANTILLA_DATOS: 'tab-tratamientos-plantilla-datos',
  TAB_PLANTILLA_RECURSOS: 'tab-tratamientos-plantilla-recursos',
  BTN_PLANTILLA_CANCELAR: 'btn-tratamientos-plantilla-cancelar',
  BTN_PLANTILLA_GUARDAR: 'btn-tratamientos-plantilla-guardar',
  DIALOG_ASIGNAR: 'dialog-tratamientos-asignar',
  SELECT_ASIGNAR_PLANTILLA: 'tratamientos-asignar-select-plantilla',
  SELECT_ASIGNAR_PACIENTE: 'tratamientos-asignar-select-paciente',
  INPUT_ASIGNAR_FECHA_INICIO: 'tratamientos-asignar-fecha-inicio',
  BTN_ASIGNAR_CANCELAR: 'btn-tratamientos-asignar-cancelar',
  BTN_ASIGNAR_GUARDAR: 'btn-tratamientos-asignar-guardar',
  DIALOG_DETALLE_PLAN: 'dialog-tratamientos-detalle-plan',
  TAB_DETALLE_PLAN_CITAS: 'tab-tratamientos-detalle-plan-citas',
  TAB_DETALLE_PLAN_PAGOS: 'tab-tratamientos-detalle-plan-pagos',
  BTN_DETALLE_PLAN_AGREGAR_CITA: 'btn-tratamientos-detalle-plan-agregar-cita',
  BTN_DETALLE_PLAN_REGISTRAR_PAGO: 'btn-tratamientos-detalle-plan-registrar-pago',
  BTN_DETALLE_PLAN_REGISTRAR_EGRESO: 'btn-tratamientos-detalle-plan-registrar-egreso',
  DIALOG_PAGO_TRATAMIENTO: 'dialog-tratamientos-pago',
  DIALOG_EGRESO_TRATAMIENTO: 'dialog-tratamientos-egreso',
} as const;

export const TUTORIALES_TRATAMIENTOS: TutorialDefinicion[] = [
  {
    nombre: 'tratamientos-crear-plantilla',
    titulo: '🧩 Crear plantilla de tratamiento',
    descripcion: 'Crea una plantilla real (con datos y recursos) para luego asignarla a pacientes.',
    icono: '🧩',
    pagina: '/tratamientos',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANTILLAS,
        titulo: '1) Ir a Plantillas (transporte)',
        descripcion:
          'Te llevo a la sección “Plantillas de Tratamiento”. Aquí es donde se crean tus tratamientos reutilizables, para luego asignarlos a pacientes.',
        accionPrevia: irATabPlantillasTratamientos,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.LISTA_PLANTILLAS,
        titulo: '¿Qué es una plantilla?',
        descripcion:
          'Una plantilla define un tratamiento “tipo” (citas, intervalos, duración, costo y recursos). Cuando la asignes, el sistema creará un plan con todas sus citas. En esta lista verás todas tus plantillas.',
        accionPrevia: irATabPlantillasTratamientos,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.BTN_ACCION_SUPERIOR,
        titulo: 'Nueva Plantilla (botón superior)',
        descripcion:
          'Este botón cambia según la pestaña activa. En “Plantillas” se convierte en “Nueva Plantilla”. Ábrelo para crear una plantilla con sus datos.',
        accionPrevia: irATabPlantillasTratamientos,
        accionPosterior: abrirDialogoNuevaPlantillaDesdeArriba,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_PLANTILLA,
        titulo: 'Formulario de la plantilla',
        descripcion:
          'Aquí defines nombre, número de citas, costo, intervalos y duración. Luego verás “Recursos por Cita”: se replican en todas las citas que se crearán cuando asignes la plantilla.',
        accionPrevia: asegurarDialogoPlantillaAbierto,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANTILLA_DATOS,
        titulo: 'Datos del plan',
        descripcion:
          'Esta pestaña contiene los datos principales. Vamos a completarlos para poder crear la plantilla.',
        accionPrevia: irATabPlantillaDatos,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.INPUT_PLANTILLA_NOMBRE,
        titulo: 'Nombre del tratamiento (obligatorio)',
        descripcion:
          'Usa un nombre claro. Ej: “Endodoncia”, “Ortodoncia”, “Blanqueamiento”.',
        accionPrevia: () => enfocarPorId(IDS_ELEMENTOS_TRATAMIENTOS.INPUT_PLANTILLA_NOMBRE),
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.INPUT_PLANTILLA_NUMERO_CITAS,
        titulo: 'Número de citas (obligatorio)',
        descripcion:
          'Define cuántas citas componen el tratamiento. Al asignarlo, se crearán esas citas automáticamente en base al intervalo.',
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_COSTO,
        titulo: 'Costo total',
        descripcion:
          'Registra el costo total del tratamiento (y opcionalmente el equivalente USD).',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_COSTO}`),
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_INTERVALO,
        titulo: 'Intervalo entre citas',
        descripcion:
          'Define cada cuánto se programarán las citas (meses/semanas/días).',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_INTERVALO}`),
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_DURACION,
        titulo: 'Duración por cita',
        descripcion:
          'Define una duración estimada por cita para ayudar a la agenda y validaciones.',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_DURACION}`),
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANTILLA_RECURSOS,
        titulo: 'Recursos por cita (se replican)',
        descripcion:
          'Los recursos se asignan igual que en el tutorial de “Citas”, pero aquí quedan guardados en la plantilla y se replican automáticamente en todas las citas que se crearán al asignar el tratamiento.',
        accionPrevia: async () => {
          await scrollAElemento(`#${IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANTILLA_RECURSOS}`);
          await irATabPlantillaRecursos();
        },
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_RECURSOS_WIZARD,
        titulo: 'Asistente de materiales',
        descripcion:
          'Selecciona inventario, productos y cantidades. Si agregas recursos, se copiarán a cada cita del plan; si lo dejas vacío, no se asignarán recursos por defecto.',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_TRATAMIENTOS.SECCION_PLANTILLA_RECURSOS_WIZARD}`),
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.BTN_PLANTILLA_GUARDAR,
        titulo: 'Revisar y crear plantilla',
        descripcion:
          'Antes de crearla, revisa que el nombre, número de citas, intervalo, duración, costo y (si aplica) recursos estén correctos. Cuando estés listo, presiona “Crear/Guardar”.\n\nEste tutorial termina aquí y NO cerrará el diálogo automáticamente.',
      },
    ],
  },
  {
    nombre: 'tratamientos-asignar-tratamiento',
    titulo: '👤 Asignar un tratamiento a un paciente',
    descripcion: 'Asigna una plantilla y crea un plan con sus citas.',
    icono: '👤',
    pagina: '/tratamientos',
    condicionBloqueo: {
      tipo: 'requiere_datos',
      mensaje: 'Requiere tener un paciente y una plantilla de tratamiento',
      condicionesPrevias: [
        {
          id: 'tiene-pacientes',
          descripcion: 'Tener al menos un paciente creado',
          completada: false,
        },
        {
          id: 'tiene-plantillas',
          descripcion: 'Tener al menos una plantilla de tratamiento creada',
          completada: false,
        },
      ],
    },
    pasos: [
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANTILLAS,
        titulo: 'Ir a Plantillas',
        descripcion:
          'En este tutorial asignarás el tratamiento DESDE una plantilla ya creada (desde la tabla). Sí: el botón superior cambia según la sección, pero aquí asignaremos desde la plantilla.',
        accionPrevia: irATabPlantillasTratamientos,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.BTN_ASIGNAR_PRIMERA_PLANTILLA,
        titulo: 'Asignar desde una plantilla',
        descripcion:
          'Usa el botón “Asignar a paciente” de la fila de una plantilla. El diálogo se abrirá con esa plantilla preseleccionada.',
        accionPrevia: irATabPlantillasTratamientos,
        accionPosterior: abrirDialogoAsignarDesdePrimeraPlantilla,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_ASIGNAR,
        titulo: 'Diálogo de asignación',
        descripcion:
          'Aquí eliges el paciente y defines la fecha/hora de inicio. Con eso el sistema creará el plan y programará las citas.',
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.SELECT_ASIGNAR_PLANTILLA,
        titulo: 'Plantilla (ya viene preseleccionada)',
        descripcion:
          'La plantilla suele venir preseleccionada porque abriste desde la fila. Verifica que sea la correcta.',
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.SELECT_ASIGNAR_PACIENTE,
        titulo: 'Elegir paciente',
        descripcion: 'Selecciona el paciente al que asignarás el tratamiento.',
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.INPUT_ASIGNAR_FECHA_INICIO,
        titulo: 'Fecha y hora de inicio',
        descripcion:
          'Define el inicio de la primera cita. Las demás se programarán automáticamente considerando el intervalo de la plantilla.',
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.BTN_ASIGNAR_GUARDAR,
        titulo: 'Confirmar asignación',
        descripcion:
          'Presiona “Asignar Tratamiento” para crear el plan. (Si solo estás explorando, puedes cancelar sin guardar).',
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANES,
        titulo: 'Ver el resultado en Planes',
        descripcion:
          'Después de asignar, cambia a “Planes Asignados” para ver el plan creado. Nota: el botón superior cambia según la sección.',
        accionPrevia: irATabPlanesTratamientos,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.BTN_ACCION_SUPERIOR,
        titulo: 'Botón superior cambia (referencia)',
        descripcion:
          'En “Planes Asignados”, el botón superior se convierte en “Asignar Tratamiento”. En este tutorial asignaste desde la plantilla, pero este comportamiento es clave: el botón se adapta a la pestaña activa.',
        accionPrevia: irATabPlanesTratamientos,
      },
    ],
  },
  {
    nombre: 'tratamientos-gestionar-plan',
    titulo: '🛠️ Gestionar un plan de tratamiento',
    descripcion: 'Administra citas, pagos y confirmación de materiales dentro de un plan ya asignado.',
    icono: '🛠️',
    pagina: '/tratamientos',
    condicionBloqueo: {
      tipo: 'requiere_datos',
      mensaje: 'Requiere tener al menos un plan de tratamiento en curso',
      condicionesPrevias: [
        {
          id: 'tiene-planes-en-curso',
          descripcion: 'Tener al menos un plan en curso',
          completada: false,
        },
      ],
    },
    pasos: [
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.TAB_PLANES,
        titulo: 'Ir a Planes Asignados',
        descripcion: 'Aquí se listan los tratamientos ya asignados a pacientes. Abriremos uno para gestionarlo.',
        accionPrevia: irATabPlanesTratamientos,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.CARD_PRIMER_PLAN,
        titulo: 'Costo y estado del plan',
        descripcion:
          'Desde la tarjeta del plan puedes: (1) editar el costo total, (2) cancelarlo, o (3) marcarlo como completado manualmente.\n\nImportante: el plan también se completa automáticamente cuando el progreso de pagos llega al 100%.',
        accionPrevia: irATabPlanesTratamientos,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.CARD_PRIMER_PLAN,
        titulo: 'Abrir un plan',
        descripcion: 'Haz click en un plan para abrir la ventana de gestión (citas y pagos).',
        accionPrevia: irATabPlanesTratamientos,
        accionPosterior: abrirDetallePrimerPlan,
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_DETALLE_PLAN,
        titulo: 'Gestión del Plan',
        descripcion:
          'Aquí puedes ver costos, progreso y saldo; además, administrar citas del plan y revisar pagos. Recuerda: cuando el progreso de pagos llega al 100%, el plan se completa automáticamente.',
        bloquearAtras: true,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.TAB_DETALLE_PLAN_CITAS,
        titulo: 'Pestaña “Citas”',
        descripcion: 'Gestiona las citas: agregar, editar, eliminar o confirmar materiales cuando aplique.',
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_AGREGAR_CITA,
        titulo: 'Agregar cita al plan',
        descripcion: 'Agrega una nueva cita dentro del plan. Si no hay ninguna, verás “Agregar Primera Cita”.',
        accionPrevia: async () => {
          const selector = `#${IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_AGREGAR_CITA}`;
          await scrollAElemento(selector);
          await sleep(250);
          await scrollAElemento(selector);
        },
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.TAB_DETALLE_PLAN_PAGOS,
        titulo: 'Pestaña “Pagos”',
        descripcion:
          'Aquí verás el historial de movimientos del plan (ingresos y egresos), el total abonado y lo pendiente.\n\nNuevo: desde esta sección puedes crear un ingreso (por adelantos u otros abonos) o un egreso (por devoluciones/reembolsos).',
        accionPrevia: irATabDetallePlanPagos,
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_REGISTRAR_PAGO,
        titulo: 'Crear un ingreso (Registrar Pago)',
        descripcion:
          'Usa “Registrar Pago” para crear un INGRESO asociado a este tratamiento (por ejemplo: adelantos/abonos u otros ingresos). El movimiento quedará registrado y se verá en el historial.',
        accionPrevia: async () => {
          await irATabDetallePlanPagos();
          const selector = `#${IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_REGISTRAR_PAGO}`;
          await scrollAElemento(selector);
          await sleep(200);
        },
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_REGISTRAR_EGRESO,
        titulo: 'Crear un egreso (Registrar Egreso)',
        descripcion:
          'Usa “Registrar Egreso” para crear un EGRESO asociado al tratamiento (por ejemplo: devolución o reembolso). También quedará registrado y se verá en el historial.',
        accionPrevia: async () => {
          await irATabDetallePlanPagos();
          const selector = `#${IDS_ELEMENTOS_TRATAMIENTOS.BTN_DETALLE_PLAN_REGISTRAR_EGRESO}`;
          await scrollAElemento(selector);
          await sleep(200);
        },
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_DETALLE_PLAN,
        titulo: 'Recursos y confirmación',
        descripcion: 'Si configuraste recursos en la plantilla, se replican en las citas del plan. La confirmación de materiales se hace como en el tutorial de Citas.',
      },
      {
        ruta: '/tratamientos',
        elementoId: IDS_ELEMENTOS_TRATAMIENTOS.DIALOG_DETALLE_PLAN,
        titulo: 'Cerrar',
        descripcion: 'Cierra la ventana cuando termines de gestionar el plan.',
        accionPosterior: cerrarDialogoConEscape,
      },
    ],
  },
];
