import { TutorialDefinicion } from '@/contextos/tutoriales/tipos-tutoriales';
import {
  abrirDialogoEgreso,
  abrirDialogoIngreso,
  asegurarDialogoEgresoAbierto,
  asegurarDialogoIngresoAbierto,
  enfocarPorId,
  irAResumenAnual,
  irASeccionGrafico,
  irAMovimientosHoy,
  irATabMovimientos,
  irATabAnalisis,
  irAFiltrosAnalisis,
  abrirFiltrosAdicionalesAnalisis,
  irAGraficoAnalisis,
  irAResultadosAnalisis,
  seleccionarGraficoPorAno,
  seleccionarGraficoPorDia,
  seleccionarGraficoPorMes,
  seleccionarModoBalance,
  seleccionarModoIngresosEgresos,
  scrollAElemento,
} from './acciones-tutoriales';

export const IDS_ELEMENTOS_FINANZAS = {
  TITULO_PAGINA: 'titulo-pagina-finanzas',
  TAB_MOVIMIENTOS: 'tab-finanzas-movimientos',
  TAB_ANALISIS: 'tab-finanzas-analisis',

  RESUMEN_ANUAL: 'finanzas-resumen-ano',
  CARD_INGRESOS_ANUAL: 'finanzas-card-ingresos-ano',
  CARD_EGRESOS_ANUAL: 'finanzas-card-egresos-ano',
  CARD_BALANCE_ANUAL: 'finanzas-card-balance-ano',

  SECCION_GRAFICO: 'finanzas-seccion-grafico',
  GRAFICO_NAVEGACION: 'finanzas-grafico-navegacion',
  GRAFICO_NAV_ANTERIOR: 'finanzas-grafico-anterior',
  GRAFICO_NAV_HOY: 'finanzas-grafico-hoy',
  GRAFICO_NAV_SIGUIENTE: 'finanzas-grafico-siguiente',
  GRAFICO_MODO_INGRESOS_EGRESOS: 'finanzas-grafico-modo-ingresos-egresos',
  GRAFICO_MODO_BALANCE: 'finanzas-grafico-modo-balance',
  GRAFICO_TAB_DIA: 'finanzas-grafico-tab-dia',
  GRAFICO_TAB_MES: 'finanzas-grafico-tab-mes',
  GRAFICO_TAB_ANO: 'finanzas-grafico-tab-ano',
  GRAFICO_TIPO_VISUALIZACION: 'finanzas-grafico-tipo-visualizacion',
  GRAFICO_VISTA_BARRAS: 'finanzas-grafico-vista-barras',
  GRAFICO_VISTA_LINEAS: 'finanzas-grafico-vista-lineas',
  BALANCE_VISTA_SIMPLE: 'finanzas-balance-vista-simple',
  BALANCE_VISTA_AREA: 'finanzas-balance-vista-area',
  SECCION_MOVIMIENTOS_HOY: 'finanzas-movimientos-hoy',
  INPUT_BUSCAR_MOVIMIENTOS_HOY: 'finanzas-movimientos-hoy-buscar',
  LISTA_MOVIMIENTOS_HOY: 'finanzas-movimientos-hoy-lista',
  SECCION_ANALISIS_FILTROS: 'finanzas-analisis-filtros',
  ANALISIS_FECHA_INICIO: 'finanzas-analisis-fecha-inicio',
  ANALISIS_FECHA_FIN: 'finanzas-analisis-fecha-fin',
  ANALISIS_FILTRAR_CONCEPTO: 'finanzas-analisis-filtrar-concepto',
  ANALISIS_SENSIBLE_MAYUSCULAS: 'finanzas-analisis-sensible-mayusculas',
  ANALISIS_FILTROS_ADICIONALES: 'finanzas-analisis-filtros-adicionales',
  ANALISIS_ESTADO_REGISTROS: 'finanzas-analisis-estado-registros',
  ANALISIS_FECHAS_SISTEMA: 'finanzas-analisis-fechas-sistema',
  ANALISIS_BTN_ANALIZAR: 'finanzas-analisis-btn-analizar',
  ANALISIS_GRAFICO: 'finanzas-analisis-grafico',
  ANALISIS_RESULTADOS: 'finanzas-analisis-resultados',
  ANALISIS_LISTA_REGISTROS: 'finanzas-analisis-lista-registros',

  BTN_REGISTRAR_INGRESO: 'btn-finanzas-registrar-ingreso',
  BTN_REGISTRAR_EGRESO: 'btn-finanzas-registrar-egreso',

  DIALOG_INGRESO: 'dialog-finanzas-ingreso',
  INPUT_INGRESO_CONCEPTO: 'concepto_ingreso',
  TRIGGER_INGRESO_CITA: 'finanzas-ingreso-cita-trigger',
  SECCION_INGRESO_FECHA: 'finanzas-ingreso-fecha',
  SECCION_INGRESO_MONTO: 'finanzas-ingreso-monto',
  BTN_INGRESO_CANCELAR: 'btn-finanzas-ingreso-cancelar',
  BTN_INGRESO_GUARDAR: 'btn-finanzas-ingreso-guardar',

  DIALOG_EGRESO: 'dialog-finanzas-egreso',
  INPUT_EGRESO_CONCEPTO: 'concepto_egreso',
  SECCION_EGRESO_FECHA: 'finanzas-egreso-fecha',
  SECCION_EGRESO_MONTO: 'finanzas-egreso-monto',
  BTN_EGRESO_CANCELAR: 'btn-finanzas-egreso-cancelar',
  BTN_EGRESO_GUARDAR: 'btn-finanzas-egreso-guardar',
} as const;

export const TUTORIALES_FINANZAS: TutorialDefinicion[] = [
  {
    nombre: 'finanzas-crear-ingreso',
    titulo: '💰 Crear un Ingreso',
    descripcion: 'Registra un ingreso manual o asociado a una cita.',
    icono: '💰',
    pagina: '/finanzas',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/finanzas',
        elementoId: null,
        titulo: '💰 Crear un Ingreso',
        descripcion:
          'Un ingreso representa dinero que entra a tu consultorio (pagos de citas, ingresos extras, etc.). Puedes asociarlo a una cita (opcional) o registrarlo sin cita.',
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.TAB_MOVIMIENTOS,
        titulo: '1) Ir a Movimientos',
        descripcion:
          'Aquí es donde se registran y listan los ingresos y egresos. Me aseguro de estar en esta pestaña antes de continuar.',
        accionPrevia: irATabMovimientos,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.BTN_REGISTRAR_INGRESO,
        titulo: '2) Registrar Ingreso',
        descripcion:
          'Este botón abre el formulario para crear un ingreso. En el siguiente paso lo abriré automáticamente.',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_FINANZAS.BTN_REGISTRAR_INGRESO}`),
        accionPosterior: abrirDialogoIngreso,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.DIALOG_INGRESO,
        titulo: '3) Formulario de Ingreso',
        descripcion:
          'Aquí completas concepto, (opcional) cita, fecha/hora y monto. Concepto, fecha y monto son obligatorios.',
        accionPrevia: asegurarDialogoIngresoAbierto,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.INPUT_INGRESO_CONCEPTO,
        titulo: '4) Concepto (obligatorio)',
        descripcion:
          'Describe el motivo del ingreso. Ej: “Pago de consulta”, “Pago de tratamiento”, “Ingreso extra”.',
        accionPrevia: () => enfocarPorId(IDS_ELEMENTOS_FINANZAS.INPUT_INGRESO_CONCEPTO),
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.TRIGGER_INGRESO_CITA,
        titulo: '5) Cita (opcional)',
        descripcion:
          'Si este ingreso corresponde a una cita pendiente de pago, selecciónala aquí. Si no aplica, puedes dejarlo vacío.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.SECCION_INGRESO_FECHA,
        titulo: '6) Fecha y hora (obligatorio)',
        descripcion:
          'Define cuándo se registró el ingreso. Útil para reportes y análisis por períodos.',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_FINANZAS.SECCION_INGRESO_FECHA}`),
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.SECCION_INGRESO_MONTO,
        titulo: '7) Monto (obligatorio)',
        descripcion:
          'Ingresa el monto. El sistema mostrará el equivalente según tu configuración (moneda local/USD).',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_FINANZAS.SECCION_INGRESO_MONTO}`),
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.BTN_INGRESO_GUARDAR,
        titulo: '8) Registrar',
        descripcion:
          'Cuando esté listo, presiona “Registrar” para guardar el ingreso. Este tutorial no guardará nada automáticamente.',
      },
    ],
  },
  {
    nombre: 'finanzas-crear-egreso',
    titulo: '💸 Crear un Egreso',
    descripcion: 'Registra un gasto del consultorio (sin cita asociada).',
    icono: '💸',
    pagina: '/finanzas',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/finanzas',
        elementoId: null,
        titulo: '💸 Crear un Egreso',
        descripcion:
          'Un egreso representa dinero que sale del consultorio (materiales, servicios, pagos, etc.). A diferencia del ingreso, aquí NO se asocia a una cita.',
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.TAB_MOVIMIENTOS,
        titulo: '1) Ir a Movimientos',
        descripcion:
          'Los egresos se registran desde la pestaña “Movimientos”.',
        accionPrevia: irATabMovimientos,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.BTN_REGISTRAR_EGRESO,
        titulo: '2) Registrar Egreso',
        descripcion:
          'Este botón abre el formulario para registrar un gasto. En el siguiente paso lo abriré automáticamente.',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_FINANZAS.BTN_REGISTRAR_EGRESO}`),
        accionPosterior: abrirDialogoEgreso,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.DIALOG_EGRESO,
        titulo: '3) Formulario de Egreso',
        descripcion:
          'Completa concepto, fecha/hora y monto. Todos los campos son obligatorios.',
        accionPrevia: asegurarDialogoEgresoAbierto,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.INPUT_EGRESO_CONCEPTO,
        titulo: '4) Concepto (obligatorio)',
        descripcion:
          'Describe el gasto. Ej: “Compra de materiales”, “Laboratorio”, “Servicios”.',
        accionPrevia: () => enfocarPorId(IDS_ELEMENTOS_FINANZAS.INPUT_EGRESO_CONCEPTO),
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.SECCION_EGRESO_FECHA,
        titulo: '5) Fecha y hora (obligatorio)',
        descripcion:
          'Define cuándo ocurrió el egreso.',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_FINANZAS.SECCION_EGRESO_FECHA}`),
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.SECCION_EGRESO_MONTO,
        titulo: '6) Monto (obligatorio)',
        descripcion:
          'Registra el monto del gasto. El equivalente se calcula según tu configuración.',
        accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_FINANZAS.SECCION_EGRESO_MONTO}`),
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.BTN_EGRESO_GUARDAR,
        titulo: '7) Registrar',
        descripcion:
          'Presiona “Registrar” para guardar el egreso. Este tutorial no guardará nada automáticamente.',
      },
    ],
  },
  {
    nombre: 'finanzas-entender-mis-movimientos',
    titulo: '📊 Entender mis Movimientos',
    descripcion: 'Aprende a leer el resumen anual, gráficos y el historial de hoy.',
    icono: '📊',
    pagina: '/finanzas',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/finanzas',
        elementoId: null,
        titulo: '📊 Entender mis Movimientos',
        descripcion:
          'Verás: (1) resumen anual, (2) gráficos (día/mes/año + navegación) y (3) movimientos de hoy. Para otras fechas/rangos, consulta el tutorial de Análisis.',
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.TAB_MOVIMIENTOS,
        titulo: '1) Ir a Movimientos',
        descripcion:
          'Esta información se encuentra en la pestaña “Movimientos”. Me aseguro de estar aquí antes de continuar.',
        accionPrevia: irATabMovimientos,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.RESUMEN_ANUAL,
        titulo: '2) Cuadros superiores (Este Año)',
        descripcion:
          'Estos 3 cuadros son un resumen del año en curso: Total de Ingresos, Total de Egresos y Balance (Ingresos - Egresos). Si registras movimientos durante el año, estos números se actualizan.',
        accionPrevia: irAResumenAnual,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.CARD_INGRESOS_ANUAL,
        titulo: '3) Total Ingresos (Este Año)',
        descripcion:
          'Suma de todo el dinero que entró en el año actual. Útil para medir crecimiento y comparar períodos.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.CARD_EGRESOS_ANUAL,
        titulo: '4) Total Egresos (Este Año)',
        descripcion:
          'Suma de todo el dinero que salió en el año actual. Útil para controlar gastos del consultorio.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.CARD_BALANCE_ANUAL,
        titulo: '5) Balance Total (Este Año)',
        descripcion:
          'Diferencia entre ingresos y egresos del año. Si es positivo, estás por encima de tus gastos; si es negativo, conviene revisar egresos o ajustar ingresos.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.SECCION_GRAFICO,
        titulo: '6) Sección de gráficos',
        descripcion:
          'Aquí puedes visualizar tendencias. Puedes agrupar por Día, Mes o Año, y también navegar a períodos pasados o futuros para comparar. Esto es ideal para “ver el comportamiento” en el tiempo.',
        accionPrevia: irASeccionGrafico,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_NAVEGACION,
        titulo: '7) Botones para moverte en el gráfico',
        descripcion:
          'Estos tres botones controlan la fecha del gráfico: Atrás (período anterior), Hoy (regresa al actual) y Adelante (período siguiente).',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_TIPO_VISUALIZACION,
        titulo: '8) Tipo de visualización',
        descripcion:
          'Puedes elegir cómo se dibuja el gráfico. En Ingresos/Egresos puedes usar barras o líneas; y en Balance puedes usar barras (simple) o área. Esto no cambia los datos, solo la forma de verlos.',
        accionPrevia: seleccionarModoIngresosEgresos,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_TAB_MES,
        titulo: '9) Ver por Mes (por defecto)',
        descripcion:
          'Por defecto el gráfico inicia “Por Mes”. Esta vista es ideal para ver tendencias y comparar meses del año.',
        accionPrevia: seleccionarGraficoPorMes,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_TAB_DIA,
        titulo: '10) Ver por Día',
        descripcion:
          'Cambia el gráfico a vista diaria. Si necesitas ver días pasados o futuros, usa las flechas de navegación.',
        accionPrevia: seleccionarGraficoPorDia,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_TAB_ANO,
        titulo: '11) Ver por Año',
        descripcion:
          'Cambia el gráfico a vista anual. Útil para comparar años completos y ver evolución general.',
        accionPrevia: seleccionarGraficoPorAno,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_MODO_BALANCE,
        titulo: '12) Cambiar a Balance',
        descripcion:
          'Ahora verás el balance (Ingresos - Egresos) a través del tiempo. Esto ayuda a identificar rápidamente períodos donde ganaste más o donde los egresos superaron ingresos.',
        accionPrevia: seleccionarModoBalance,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_TAB_MES,
        titulo: '13) Balance por Mes',
        descripcion:
          'En Balance, revisa el resultado mes a mes. Si un mes sale negativo, normalmente conviene revisar egresos y/o ingresos de ese período.',
        accionPrevia: seleccionarGraficoPorMes,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_TAB_DIA,
        titulo: '14) Balance por Día',
        descripcion:
          'Igual que antes: puedes ver el balance día por día y navegar al pasado/futuro con las flechas.',
        accionPrevia: seleccionarGraficoPorDia,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.GRAFICO_TAB_ANO,
        titulo: '15) Balance por Año',
        descripcion:
          'Te da una vista general de cada año. Es útil para comparar crecimiento anual o detectar un año atípico.',
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.SECCION_MOVIMIENTOS_HOY,
        titulo: '16) Movimientos de Hoy',
        descripcion:
          'Esta sección lista únicamente los movimientos registrados HOY. Si quieres conocer movimientos de otras fechas (o rangos), consulta el tutorial de Análisis.',
        accionPrevia: irAMovimientosHoy,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.INPUT_BUSCAR_MOVIMIENTOS_HOY,
        titulo: '17) Buscar en movimientos de hoy',
        descripcion:
          'Usa el buscador para filtrar los movimientos de hoy por concepto (por ejemplo: “consulta”, “material”, “laboratorio”, etc.).',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.LISTA_MOVIMIENTOS_HOY,
        titulo: '18) Lista de movimientos',
        descripcion:
          'Aquí verás cada movimiento de hoy con su tipo (ingreso/egreso), hora y monto. Puedes editar o eliminar desde los botones de acción.',
      },
    ],
  },
  {
    nombre: 'finanzas-realizar-analisis',
    titulo: '📈 Realizar un Análisis',
    descripcion: 'Analiza movimientos por rango de fechas, filtros y revisa gráficos/resultados.',
    icono: '📈',
    pagina: '/finanzas',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/finanzas',
        elementoId: null,
        titulo: '📈 Realizar un Análisis',
        descripcion:
          'Aquí aprenderás a usar la pestaña “Análisis”: configurar el formulario (fechas, concepto y opciones), ejecutar el análisis, ver el gráfico y revisar los registros financieros encontrados.',
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.TAB_ANALISIS,
        titulo: '1) Entrar a Análisis',
        descripcion:
          'En esta pestaña puedes consultar movimientos de otras fechas (no solo los de hoy) y obtener resultados filtrados.',
        accionPrevia: irATabAnalisis,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.SECCION_ANALISIS_FILTROS,
        titulo: '2) Formulario de análisis',
        descripcion:
          'Este formulario define qué información se analizará. Cambia aquí fechas, concepto y opciones antes de ejecutar.',
        accionPrevia: irAFiltrosAnalisis,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_FECHA_INICIO,
        titulo: '3) Fecha inicio',
        descripcion:
          'Selecciona desde qué fecha/hora empieza el análisis. Ideal para rangos como “esta semana”, “este mes” o un período personalizado.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_FECHA_FIN,
        titulo: '4) Fecha fin',
        descripcion:
          'Selecciona hasta qué fecha/hora se analizarán los movimientos. El análisis tomará todo el rango entre inicio y fin.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_FILTRAR_CONCEPTO,
        titulo: '5) Filtrar por concepto',
        descripcion:
          'Si escribes un concepto (por ejemplo: “consulta”, “material”), el análisis buscará movimientos que lo contengan.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_SENSIBLE_MAYUSCULAS,
        titulo: '6) Mayúsculas vs minúsculas',
        descripcion:
          'Si esta opción está desactivada, la búsqueda NO distingue mayúsculas/minúsculas (ej: “Consulta” y “consulta” se consideran igual). Si la activas, la búsqueda se vuelve más estricta.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_FILTROS_ADICIONALES,
        titulo: '7) Otras opciones',
        descripcion:
          'Aquí puedes desplegar filtros adicionales para refinar el análisis.',
        accionPrevia: abrirFiltrosAdicionalesAnalisis,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_ESTADO_REGISTROS,
        titulo: '8) Disponibles / Borrados / Todos',
        descripcion:
          'Esto define qué registros incluir: solo disponibles (activos), solo borrados (eliminados) o todos (para auditoría y revisión).',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_FECHAS_SISTEMA,
        titulo: '9) Fechas de sistema (creado/editado/eliminado)',
        descripcion:
          'Activa “Mostrar fechas de sistema” para ver cuándo se creó, cuándo se editó y cuándo se eliminó (si aplica) cada registro financiero. Útil para auditoría.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_BTN_ANALIZAR,
        titulo: '10) Ejecutar análisis',
        descripcion:
          'Cuando el rango y filtros estén listos, presiona “Analizar Periodo” para cargar resultados. Este tutorial no cambia tus datos, solo consulta.',
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_GRAFICO,
        titulo: '11) Gráficos del análisis',
        descripcion:
          'Esta sección funciona igual que en Movimientos (modo Ingresos/Egresos vs Balance, granularidad y tipo de visualización). Aquí solo la usamos para interpretar tendencias, sin repetir toda la explicación.',
        accionPrevia: irAGraficoAnalisis,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_RESULTADOS,
        titulo: '12) Registros encontrados',
        descripcion:
          'Aquí verás los registros financieros resultantes del análisis. Puedes paginar, buscar dentro de lo cargado y (si corresponde) ver fechas de sistema.',
        accionPrevia: irAResultadosAnalisis,
        bloquearAtras: true,
      },
      {
        ruta: '/finanzas',
        elementoId: IDS_ELEMENTOS_FINANZAS.ANALISIS_LISTA_REGISTROS,
        titulo: '13) Lista de registros',
        descripcion:
          'Esta es la lista final de movimientos. Si filtraste por borrados/todos, aquí también podrás ver registros eliminados (si existen).',
      },
    ],
  },
];
