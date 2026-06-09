import { TutorialDefinicion } from '@/contextos/tutoriales/tipos-tutoriales';
import { accionesInventarios } from './acciones-tutoriales';
import { IDS_ELEMENTOS_INVENTARIOS } from './constantes';

export { IDS_ELEMENTOS_INVENTARIOS };

const condicionRequiereInventarios: TutorialDefinicion['condicionBloqueo'] = {
  tipo: 'requiere_datos',
  mensaje: 'Requiere crear al menos un inventario.',
  condicionesPrevias: [
    {
      id: 'tiene-inventarios',
      descripcion: 'Crear al menos un inventario',
      completada: false,
    },
  ],
};

const condicionRequiereMateriales: TutorialDefinicion['condicionBloqueo'] = {
  tipo: 'requiere_datos',
  mensaje: 'Requiere tener un inventario con al menos un material creado.',
  condicionesPrevias: [
    {
      id: 'tiene-inventarios',
      descripcion: 'Crear al menos un inventario',
      completada: false,
    },
    {
      id: 'tiene-material',
      descripcion: 'Tener al menos un producto tipo material',
      completada: false,
    },
  ],
};

const condicionRequiereActivos: TutorialDefinicion['condicionBloqueo'] = {
  tipo: 'requiere_datos',
  mensaje: 'Requiere tener un inventario con al menos un producto de activo fijo creado.',
  condicionesPrevias: [
    {
      id: 'tiene-inventarios',
      descripcion: 'Crear al menos un inventario',
      completada: false,
    },
    {
      id: 'tiene-activo-fijo',
      descripcion: 'Tener al menos un producto tipo activo fijo',
      completada: false,
    },
  ],
};

const condicionRequiereMaterialConEntrada: TutorialDefinicion['condicionBloqueo'] = {
  tipo: 'requiere_datos',
  mensaje: 'Requiere tener un material con al menos una entrada registrada.',
  condicionesPrevias: [
    {
      id: 'tiene-inventarios',
      descripcion: 'Crear al menos un inventario',
      completada: false,
    },
    {
      id: 'tiene-material',
      descripcion: 'Tener al menos un producto tipo material',
      completada: false,
    },
    {
      id: 'tiene-entrada-material',
      descripcion: 'Tener al menos una entrada registrada en un material',
      completada: false,
    },
  ],
};

const condicionRequiereActivoRegistrado: TutorialDefinicion['condicionBloqueo'] = {
  tipo: 'requiere_datos',
  mensaje: 'Requiere tener un activo registrado para poder venderlo.',
  condicionesPrevias: [
    {
      id: 'tiene-inventarios',
      descripcion: 'Crear al menos un inventario',
      completada: false,
    },
    {
      id: 'tiene-activo-fijo',
      descripcion: 'Tener al menos un producto tipo activo fijo',
      completada: false,
    },
    {
      id: 'tiene-activo-registrado',
      descripcion: 'Tener al menos un activo registrado',
      completada: false,
    },
  ],
};

export const TUTORIALES_INVENTARIOS: TutorialDefinicion[] = [
  {
    nombre: 'inventarios-crear-inventario',
    titulo: '📦 Crear un Inventario',
    descripcion: 'Crea un inventario para organizar productos, consumibles y activos.',
    icono: '📦',
    pagina: '/inventarios',
    condicionBloqueo: null,
    pasos: [
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '📦 ¿Qué es un inventario?',
        descripcion: 'Un inventario es un contenedor donde agrupas tus productos (consumibles y activos). Puedes tener uno general o varios por área (por ejemplo: “Clínica”, “Laboratorio”, “Bodega”).',
        accionPrevia: accionesInventarios.asegurarListaInventarios,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_NUEVO_INVENTARIO,
        titulo: 'Nuevo Inventario',
        descripcion: 'Al avanzar abriré el formulario para crear el inventario.',
        accionPosterior: accionesInventarios.abrirDialogoNuevoInventario,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.DIALOGO_INVENTARIO,
        titulo: 'Formulario de inventario',
        descripcion: 'Aquí defines el nombre y configuraciones básicas del inventario.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: 'nombre',
        titulo: 'Nombre del inventario',
        descripcion: 'Escribe un nombre claro. Ejemplos: “Inventario Principal”, “Ortodoncia”, “Cirugía”.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_GUARDAR_INVENTARIO,
        titulo: 'Crear / Guardar',
        descripcion: 'Cuando estés listo, presiona “Crear Inventario”. En este tutorial no lo haré automáticamente para no crear datos de prueba.',
      },
    ],
  },

  {
    nombre: 'inventarios-crear-consumible',
    titulo: '🧴 Crear un Consumible (Material)',
    descripcion: 'Crea un producto tipo material: consumibles que se agotan con entradas/salidas.',
    icono: '🧴',
    pagina: '/inventarios',
    condicionBloqueo: condicionRequiereInventarios,
    pasos: [
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '🧴 Consumibles (Materiales)',
        descripcion: 'Los consumibles son materiales que se consumen: guantes, anestesia, resina, etc. Entraré al inventario y te mostraré el formulario.',
        accionPrevia: accionesInventarios.asegurarDetalleInventario,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS,
        titulo: 'Pestaña Productos',
        descripcion: 'Aquí se listan los productos del inventario. Al avanzar iré a esta pestaña.',
        accionPosterior: accionesInventarios.cambiarTabProductos,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SUBTAB_CONSUMIBLES,
        titulo: 'Subsección: Consumibles',
        descripcion: 'Ahora Productos está dividido en 2 subsecciones. Para crear un material (consumible), primero debes estar en “Consumibles”. Al avanzar la seleccionaré.',
        accionPosterior: accionesInventarios.cambiarSubtabConsumibles,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_NUEVO_PRODUCTO,
        titulo: 'Nuevo Producto',
        descripcion: 'El botón superior cambia según la subsección. En “Consumibles” aparece como “Crear Material”. Al avanzar abriré el formulario.',
        accionPosterior: accionesInventarios.abrirDialogoNuevoProducto,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.DIALOGO_PRODUCTO,
        titulo: 'Formulario de producto',
        descripcion: 'Aquí configuras el consumible: nombre, subtipo, unidad de medida, formato de cantidad (enteros/decimales) y notificaciones de stock bajo.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: 'nombre_producto',
        titulo: 'Nombre del material',
        descripcion: 'Ejemplos: “Guantes”, “Lidocaína”, “Resina A2”, “Algodón”.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SELECT_SUBTIPO_MATERIAL,
        titulo: 'Subtipo del material',
        descripcion: 'Define el “modo” de control del consumible: con lote/vencimiento (medicamentos), con serie (implantes) o sin lote (guantes/papel/etc.). Esto impacta qué campos verás al registrar entradas.',
      },
      {
        ruta: '/inventarios',
        elementoId: 'unidad_medida',
        titulo: 'Unidad de medida',
        descripcion: 'Define cómo contabilizas el consumible. Ejemplos: cajas, frascos, ml, gramos, unidades.',
      },
      {
        ruta: '/inventarios',
        elementoId: 'stock_minimo',
        titulo: 'Stock mínimo y notificación',
        descripcion: 'Activa “Notificar bajo stock” para usar el stock mínimo como alerta. Si lo desactivas, el stock mínimo se deshabilita y no verás avisos de stock bajo para este consumible.',
      },
      {
        ruta: '/inventarios',
        elementoId: 'notificar_stock_bajo',
        titulo: 'Notificar bajo stock',
        descripcion: 'Este switch controla si el sistema te mostrará alertas. Es útil para consumibles críticos (anestesia, resinas) y opcional para los de baja prioridad.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_GUARDAR_PRODUCTO,
        titulo: 'Crear / Guardar',
        descripcion: 'Cuando tengas todo listo, presiona “Crear Producto”. En este tutorial no lo haré automáticamente.',
      },
    ],
  },

  {
    nombre: 'inventarios-crear-activo-fijo',
    titulo: '🧰 Crear un Activo fijo',
    descripcion: 'Crea un producto tipo activo fijo: equipos/instrumentos que se registran como activos individuales.',
    icono: '🧰',
    pagina: '/inventarios',
    condicionBloqueo: condicionRequiereInventarios,
    pasos: [
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '🧰 Activos fijos',
        descripcion: 'Un activo fijo representa equipos o instrumental. El producto sirve como base para luego registrar unidades individuales (con su seguimiento).',
        accionPrevia: accionesInventarios.asegurarDetalleInventario,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS,
        titulo: 'Pestaña Productos',
        descripcion: 'Al avanzar iré a Productos para crear un activo fijo.',
        accionPosterior: accionesInventarios.cambiarTabProductos,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SUBTAB_ACTIVOS_FIJOS,
        titulo: 'Subsección: Activos Fijos',
        descripcion: 'Para crear un producto de activo fijo, primero debes estar en la subsección “Activos Fijos”. Al avanzar la seleccionaré.',
        accionPosterior: accionesInventarios.cambiarSubtabActivosFijos,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_NUEVO_PRODUCTO,
        titulo: 'Nuevo Producto',
        descripcion: 'En “Activos Fijos”, este botón aparece como “Crear Activo Fijo”. Al avanzar abriré el formulario.',
        accionPosterior: accionesInventarios.abrirDialogoNuevoProducto,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.DIALOGO_PRODUCTO,
        titulo: 'Formulario de producto',
        descripcion: 'Aquí defines el producto base del activo fijo: el “tipo” lo determina la subsección. Luego, desde este producto, registrarás unidades individuales (activos).',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: 'nombre_producto',
        titulo: 'Nombre del activo',
        descripcion: 'Ejemplos: “Autoclave”, “Lámpara de fotocurado”, “Sillón dental”, “Pieza de mano”.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SELECT_SUBTIPO_ACTIVO_FIJO,
        titulo: 'Subtipo del activo fijo',
        descripcion: 'Clasifica el activo: “Instrumental” (ciclo de vida rápido) o “Mobiliario/Equipo” (ciclo de vida lento). Esto define estados y campos disponibles al registrar unidades.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_GUARDAR_PRODUCTO,
        titulo: 'Crear / Guardar',
        descripcion: 'Al guardar, tendrás el producto base listo. Luego podrás registrar y gestionar activos desde ese producto.',
      },
    ],
  },

  {
    nombre: 'inventarios-registrar-entrada',
    titulo: '🛒 Registrar una entrada',
    descripcion: 'Registra una entrada de material (compra) para aumentar stock y opcionalmente reflejarlo en finanzas.',
    icono: '🛒',
    pagina: '/inventarios',
    condicionBloqueo: condicionRequiereMateriales,
    pasos: [
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '🛒 Entradas de material',
        descripcion: 'Registrar una entrada sirve para aumentar el stock de un material (por compra o reposición). Entraré al inventario y ubicaré un material.',
        accionPrevia: accionesInventarios.asegurarDetalleInventario,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS,
        titulo: 'Pestaña Productos',
        descripcion: 'Al avanzar iré a Productos para registrar una entrada.',
        accionPrevia: async () => {
          await accionesInventarios.cambiarTabProductos();
          await accionesInventarios.cambiarSubtabConsumibles();
          await accionesInventarios.prepararAnclaRegistrarEntradaMaterial();
        },
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SUBTAB_CONSUMIBLES,
        titulo: 'Subsección: Consumibles',
        descripcion: '“Registrar Entrada” solo aparece en consumibles. Si estabas en “Activos Fijos”, aquí vuelves a “Consumibles”.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ENTRADA_MATERIAL,
        titulo: 'Registrar Entrada',
        descripcion: 'Este botón aparece en productos tipo Material. Al avanzar abriré el formulario.',
        accionPrevia: accionesInventarios.clickRegistrarEntradaMaterial,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.DIALOGO_REGISTRAR_MATERIAL,
        titulo: 'Formulario de entrada',
        descripcion: 'Aquí registras la compra/ingreso del consumible. Algunos campos cambian según el subtipo (lote/serie/vencimiento). En este tutorial no voy a guardar para no crear datos de prueba.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: 'cantidad',
        titulo: 'Cantidad',
        descripcion: 'Ingresa la cantidad comprada/ingresada. El sistema respeta el formato del producto (enteros o decimales) y evita que ingreses valores inválidos.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_COSTO_ENTRADA_MATERIAL,
        titulo: 'Costo total',
        descripcion: 'Registra el costo total de la entrada. Si tu clínica trabaja en USD, verás campos para monto local y equivalente en USD.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_FECHA_COMPRA_MATERIAL,
        titulo: 'Fecha de compra',
        descripcion: 'La fecha/hora afecta el historial (kardex) y la contabilidad si decides reflejarlo en finanzas.',
      },
      {
        ruta: '/inventarios',
        elementoId: 'registrar_egreso_material',
        titulo: 'Finanzas (opcional)',
        descripcion: 'Si lo dejas activo, se registrará un gasto automáticamente en finanzas por esta compra/ingreso.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_CONFIRMAR_REGISTRAR_MATERIAL,
        titulo: 'Registrar Material',
        descripcion: 'Cuando tengas todo listo, presiona para registrar la entrada. En este tutorial no lo haré automáticamente.',
      },
    ],
  },

  {
    nombre: 'inventarios-ajustar-stock',
    titulo: '⚙️ Ajustar stock',
    descripcion: 'Ajusta manualmente el stock de un material (incremento o decremento) y opcionalmente genera movimiento financiero.',
    icono: '⚙️',
    pagina: '/inventarios',
    condicionBloqueo: condicionRequiereMaterialConEntrada,
    pasos: [
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '⚙️ Ajustes de stock',
        descripcion: 'Los ajustes sirven para corregir inventario: diferencias por conteo, pérdidas, devoluciones o correcciones. Entraré al inventario y ubicaré un material con stock.',
        accionPrevia: accionesInventarios.asegurarDetalleInventario,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS,
        titulo: 'Pestaña Productos',
        descripcion: 'Al avanzar iré a Productos y ubicaré el botón de Ajustar Stock en un material.',
        accionPrevia: async () => {
          await accionesInventarios.cambiarTabProductos();
          await accionesInventarios.cambiarSubtabConsumibles();
          await accionesInventarios.prepararAnclaAjustarStock();
        },
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SUBTAB_CONSUMIBLES,
        titulo: 'Subsección: Consumibles',
        descripcion: 'Los ajustes de stock aplican a consumibles (materiales). Aquí confirmas que estás en “Consumibles”.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_AJUSTAR_STOCK,
        titulo: 'Ajustar Stock',
        descripcion: 'Este botón aparece dentro de la tabla de materiales. Al avanzar abriré el formulario de ajuste.',
        accionPrevia: accionesInventarios.clickAjustarStock,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.DIALOGO_AJUSTE_STOCK,
        titulo: 'Formulario de ajuste',
        descripcion: 'Aquí defines si es entrada o salida, la cantidad, monto, fecha y motivo. En este tutorial no guardaré cambios automáticamente.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: 'tipo_ajuste',
        titulo: 'Tipo de ajuste',
        descripcion: 'Alterna entre Entrada (incremento) o Salida (decremento). Nota: al cambiar a salida, por defecto desactiva el movimiento financiero para evitar registrar ingresos por error.',
      },
      {
        ruta: '/inventarios',
        elementoId: 'cantidad_ajuste',
        titulo: 'Cantidad',
        descripcion: 'Ingresa la cantidad a ajustar. El sistema respeta enteros/decimales y te muestra el stock actual como referencia.',
      },
      {
        ruta: '/inventarios',
        elementoId: 'monto_ajuste',
        titulo: 'Monto',
        descripcion: 'El monto se calcula automáticamente según costo unitario × cantidad, pero puedes ajustarlo si corresponde. En entradas es el costo; en salidas es el “monto de salida”.',
      },
      {
        ruta: '/inventarios',
        elementoId: 'motivo_ajuste',
        titulo: 'Motivo',
        descripcion: 'Este campo es obligatorio y explica por qué se está corrigiendo el stock (conteo, merma, reposición, etc.).',
      },
      {
        ruta: '/inventarios',
        elementoId: 'generar_movimiento_ajuste',
        titulo: 'Finanzas (opcional)',
        descripcion: 'Si lo activas, el ajuste generará un movimiento en finanzas. Entrada → gasto; Salida → ingreso (si realmente estás registrando una salida con valor de ingreso).',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_CONFIRMAR_AJUSTE_STOCK,
        titulo: 'Ajustar Stock',
        descripcion: 'Cuando tengas todo listo, presiona para confirmar el ajuste. En este tutorial no lo haré automáticamente.',
      },
    ],
  },

  {
    nombre: 'inventarios-registrar-activo',
    titulo: '🏷️ Registrar un activo',
    descripcion: 'Registra un activo individual (unidad) para un producto de activo fijo y opcionalmente registra el egreso en finanzas.',
    icono: '🏷️',
    pagina: '/inventarios',
    condicionBloqueo: condicionRequiereActivos,
    pasos: [
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '🏷️ Activos individuales',
        descripcion: 'Registrar un activo crea una unidad individual (equipo/instrumental) asociada a un producto de activo fijo. Entraré al inventario y ubicaré un producto de activo fijo.',
        accionPrevia: accionesInventarios.asegurarDetalleInventario,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS,
        titulo: 'Pestaña Productos',
        descripcion: 'Al avanzar iré a Productos para registrar un activo.',
        accionPrevia: async () => {
          await accionesInventarios.cambiarTabProductos();
          await accionesInventarios.cambiarSubtabActivosFijos();
          await accionesInventarios.prepararAnclaRegistrarActivo();
        },
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SUBTAB_ACTIVOS_FIJOS,
        titulo: 'Subsección: Activos Fijos',
        descripcion: '“Registrar Activo” aparece dentro de productos de Activo Fijo. Aquí confirmas que estás en la subsección correcta.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_REGISTRAR_ACTIVO,
        titulo: 'Registrar Activo',
        descripcion: 'Este botón aparece en productos tipo Activo fijo. Al avanzar abriré el formulario.',
        accionPrevia: accionesInventarios.clickRegistrarActivo,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.DIALOGO_REGISTRAR_ACTIVO,
        titulo: 'Formulario de activo',
        descripcion: 'Aquí registras una unidad individual del activo fijo: datos opcionales para identificarla, costo/fecha de compra y si debe impactar finanzas. En este tutorial no voy a guardar.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: 'nombre_asignado',
        titulo: 'Nombre asignado',
        descripcion: 'Opcional, útil para identificar: “Equipo Sala 1”, “Autoclave Principal”.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_COSTO_COMPRA_ACTIVO,
        titulo: 'Costo de compra',
        descripcion: 'Registra el costo de compra (monto local y, si aplica, USD). Esto alimenta reportes y te permite comparar luego con el monto de venta.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_FECHA_COMPRA_ACTIVO,
        titulo: 'Fecha de compra',
        descripcion: 'Define cuándo se adquirió el activo. Esta fecha se usa en historial y reportes.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SELECT_ESTADO_ACTIVO,
        titulo: 'Estado',
        descripcion: 'Al registrar un activo nuevo, el estado inicial se guarda como “disponible”. El cambio de estado se gestiona posteriormente desde la lista (con motivo).',
      },
      {
        ruta: '/inventarios',
        elementoId: 'registrar_egreso_activo',
        titulo: 'Finanzas (egreso)',
        descripcion: 'Si lo activas, se registra el egreso (gasto) automáticamente en finanzas al dar de alta el activo.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_CONFIRMAR_REGISTRAR_ACTIVO,
        titulo: 'Registrar Activo',
        descripcion: 'Cuando tengas todo listo, presiona para registrar el activo. En este tutorial no lo haré automáticamente.',
      },
    ],
  },

  {
    nombre: 'inventarios-vender-activo',
    titulo: '💸 Vender un activo',
    descripcion: 'Registra la venta de un activo fijo y opcionalmente crea el ingreso en finanzas.',
    icono: '💸',
    pagina: '/inventarios',
    condicionBloqueo: condicionRequiereActivoRegistrado,
    pasos: [
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '💸 Venta de activos',
        descripcion: 'Vender un activo cambia su estado y deja registro. Entraré al inventario y ubicaré un activo registrado.',
        accionPrevia: accionesInventarios.asegurarDetalleInventario,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_PRODUCTOS,
        titulo: 'Pestaña Productos',
        descripcion: 'Al avanzar iré a Productos y ubicaré el botón de Vender dentro de un activo.',
        accionPrevia: async () => {
          await accionesInventarios.cambiarTabProductos();
          await accionesInventarios.cambiarSubtabActivosFijos();
          await accionesInventarios.prepararAnclaVenderActivo();
        },
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.SUBTAB_ACTIVOS_FIJOS,
        titulo: 'Subsección: Activos Fijos',
        descripcion: 'La venta aplica a unidades de activos fijos. Aquí confirmas que estás en “Activos Fijos”.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_VENDER_ACTIVO,
        titulo: 'Vender',
        descripcion: 'Al avanzar abriré el formulario de venta del activo.',
        accionPrevia: accionesInventarios.clickVenderActivo,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.DIALOGO_VENDER_ACTIVO,
        titulo: 'Formulario de venta',
        descripcion: 'Aquí registras el monto y la fecha. En este tutorial no guardaré automáticamente.',
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_MONTO_VENTA_ACTIVO,
        titulo: 'Monto de venta',
        descripcion: 'Ingresa el monto de venta. El sistema puede mostrar también el equivalente en USD según tu configuración.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.CONTENEDOR_FECHA_VENTA_ACTIVO,
        titulo: 'Fecha de venta',
        descripcion: 'Registra la fecha y hora exactas de la venta para que el historial quede consistente.',
      },
      {
        ruta: '/inventarios',
        elementoId: 'registrar_pago_venta',
        titulo: 'Finanzas (opcional)',
        descripcion: 'Si lo dejas activo, se registrará un ingreso en finanzas por esta venta.',
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_CONFIRMAR_VENDER_ACTIVO,
        titulo: 'Vender Activo',
        descripcion: 'Cuando esté todo listo, presiona para confirmar la venta. En este tutorial no lo haré automáticamente.',
      },
    ],
  },

  {
    nombre: 'inventarios-entender-historiales',
    titulo: '🕒 Entender los historiales',
    descripcion: 'Conoce para qué sirven Kardex, Actividad y Bitácora.',
    icono: '🕒',
    pagina: '/inventarios',
    condicionBloqueo: condicionRequiereInventarios,
    pasos: [
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '🕒 Historiales del inventario',
        descripcion: 'Entraré al detalle del inventario y revisaremos las 3 pestañas de historial: Kardex, Actividad y Bitácora.',
        accionPrevia: accionesInventarios.asegurarDetalleInventario,
        bloquearAtras: true,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_KARDEX,
        titulo: 'Kardex',
        descripcion: 'El Kardex registra movimientos de stock: entradas, salidas y ajustes.',
        accionPrevia: accionesInventarios.cambiarTabKardex,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_FILTROS_KARDEX,
        titulo: 'Filtros en Kardex',
        descripcion: 'Usa filtros para acotar por fecha, entidad o tipo de operación y encontrar rápidamente un movimiento específico.',
        accionPrevia: accionesInventarios.scrollATituloKardex,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_AUDITORIA,
        titulo: 'Actividad',
        descripcion: 'Actividad muestra cambios relevantes a nivel de registros.',
        accionPrevia: accionesInventarios.cambiarTabAuditoria,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_FILTROS_AUDITORIA,
        titulo: 'Filtros en Actividad',
        descripcion: 'Los filtros te ayudan a investigar cambios: por tipo, entidad o rango de fechas.',
        accionPrevia: accionesInventarios.scrollATituloAuditoria,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.TAB_BITACORA,
        titulo: 'Bitácora',
        descripcion: 'Bitácora está enfocada en activos fijos: eventos y cambios de estado/uso.',
        accionPrevia: accionesInventarios.cambiarTabBitacora,
      },
      {
        ruta: '/inventarios',
        elementoId: IDS_ELEMENTOS_INVENTARIOS.BTN_FILTROS_BITACORA,
        titulo: 'Filtros en Bitácora',
        descripcion: 'Filtra por rango de fechas y tipos de evento para ubicar el historial de un activo con precisión.',
        accionPrevia: accionesInventarios.scrollATituloBitacora,
      },
      {
        ruta: '/inventarios',
        elementoId: null,
        titulo: '✅ Resumen rápido',
        descripcion: 'Kardex = movimientos de stock. Actividad = auditoría de cambios. Bitácora = historial de activos fijos. Con estas 3 vistas puedes rastrear qué pasó, cuándo y por qué.',
      },
    ],
  },
];
