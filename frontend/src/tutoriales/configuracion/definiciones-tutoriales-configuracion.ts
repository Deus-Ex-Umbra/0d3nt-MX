import { TutorialDefinicion } from '@/contextos/tutoriales/tipos-tutoriales';
import {
	irATabClinica,
	irATabPerfil,
	irATabCatalogos,
	asegurarSeccionExpandida,
	scrollAElemento,
	seleccionarTemaApariencia,
	abrirEditorTemaPersonalizado,
	cerrarEditorTemaPersonalizado,
	abrirDialogoCrearCatalogo,
	abrirDialogoCrearTamanoHoja,
	abrirEditorSimbologia,
	scrollRelativoAElemento,
	abrirTabDescripcionEditorSimbologia,
} from './acciones-tutoriales';

export const IDS_ELEMENTOS_CONFIGURACION = {
	TITULO_PAGINA: 'titulo-pagina-configuracion',

	TAB_PERFIL: 'tab-configuracion-perfil',
	TAB_CLINICA: 'tab-configuracion-clinica',
	TAB_APARIENCIA: 'tab-configuracion-apariencia',
	TAB_CATALOGOS: 'tab-configuracion-catalogos',

	CARD_INFO_PERSONAL: 'config-perfil-card-info-personal',
	SECCION_AVATAR: 'config-perfil-avatar',
	INPUT_NOMBRE: 'nombre',
	INPUT_CORREO: 'correo',
	BTN_GUARDAR_PERFIL: 'btn-config-perfil-guardar',

	CARD_CONTRASENA: 'config-perfil-card-contrasena',
	INPUT_CONTRASENA_ACTUAL: 'contrasena_actual',
	INPUT_NUEVA_CONTRASENA: 'nueva_contrasena',
	INPUT_CONFIRMAR_CONTRASENA: 'confirmar_contrasena',
	BTN_CAMBIAR_CONTRASENA: 'btn-config-contrasena-cambiar',

	CARD_AJUSTES_EXTRA: 'config-perfil-card-ajustes-extra',
	SECCION_PAIS: 'config-perfil-seccion-pais',
	BTN_GUARDAR_PAIS: 'btn-config-guardar-pais',

	SECCION_MONEDA: 'contenedor-seccion-moneda',
	BTN_GUARDAR_MONEDA: 'btn-config-guardar-moneda',

	CARD_DIVISAS: 'config-perfil-card-divisas',
	INPUT_CAMBIO_LOCAL: 'divisas-cambio-local',
	BTN_ACTUALIZAR_TASA_API: 'btn-config-divisas-actualizar-api',
	MODO_TRABAJO_LOCAL: 'config-divisas-modo-local',
	MODO_TRABAJO_USD: 'config-divisas-modo-usd',
	BTN_GUARDAR_DIVISAS: 'btn-config-divisas-guardar',

	SECCION_EXCHANGE_RATE: 'config-perfil-seccion-exchange-rate',
	INPUT_EXCHANGE_RATE_API_KEY: 'exchange_rate_api_key',
	BTN_EXCHANGE_RATE_GUARDAR_VALIDAR: 'btn-config-exchange-rate-guardar-validar',

	SECCION_HISTORICA: 'config-perfil-seccion-historica',
	BTN_MODO_NORMAL: 'btn-config-modo-normal',
	BTN_MODO_HISTORICO: 'btn-config-modo-historico',

	SECCION_MODELO_ODONTOGRAMA: 'config-perfil-seccion-modelo-odontograma',
	BTN_MODELO_ODONTOGRAMA_CUADRADO: 'btn-config-modelo-odontograma-cuadrado',
	BTN_MODELO_ODONTOGRAMA_CIRCULAR: 'btn-config-modelo-odontograma-circular',

	SECCION_GEMINI: 'config-perfil-seccion-gemini',
	INPUT_GEMINI_API_KEY: 'gemini_api_key_extra',
	INPUT_GEMINI_URL_BASE: 'gemini_url_base_extra',
	BTN_GUARDAR_GEMINI: 'btn-config-gemini-guardar',

	CARD_CLINICA_CONFIG: 'config-clinica-card-config',
	SECCION_LOGO_CLINICA: 'config-clinica-seccion-logo',
	BTN_CAMARA_LOGO: 'config-clinica-btn-camara-logo',
	BTN_QUITAR_LOGO: 'config-clinica-btn-quitar-logo',
	INPUT_NOMBRE_CLINICA: 'nombre_clinica',
	INPUT_MENSAJE_ANTES: 'mensaje_antes',
	INPUT_MENSAJE_DESPUES: 'mensaje_despues',
	BTN_GUARDAR_CLINICA: 'config-clinica-btn-guardar',
	CARD_CLINICA_PREVIEW: 'config-clinica-card-preview',
	PREVIEW_LOGO: 'config-clinica-preview-logo',

	CARD_HORARIOS_LABORALES: 'config-clinica-card-horarios-laborales',
	BTN_GUARDAR_HORARIOS_LABORALES: 'config-clinica-btn-guardar-horarios-laborales',
	HORARIOS_DIA_DOMINGO: 'config-clinica-horarios-dia-domingo',
	HORARIOS_DIA_LUNES: 'config-clinica-horarios-dia-lunes',
	HORARIOS_BTN_AGREGAR_DOMINGO: 'config-clinica-horarios-dia-domingo-btn-agregar',
	HORARIOS_BTN_AGREGAR_LUNES: 'config-clinica-horarios-dia-lunes-btn-agregar',

	CARD_APARIENCIA_TEMA: 'config-apariencia-card-tema',
	BTN_TEMA_CLARO: 'config-apariencia-tema-claro',
	BTN_TEMA_OSCURO: 'config-apariencia-tema-oscuro',
	BTN_TEMA_AZUL_OCEANO: 'config-apariencia-tema-azul',
	BTN_TEMA_MENTA_DENTAL: 'config-apariencia-tema-menta',
	BTN_TEMA_PERSONALIZADO: 'config-apariencia-tema-personalizado',
	PANEL_TEMA_PERSONALIZADO: 'config-apariencia-panel-personalizado',
	BTN_PERSONALIZAR_COLORES: 'config-apariencia-btn-personalizar-colores',
	DIALOG_EDITOR_TEMA_PERSONALIZADO: 'config-apariencia-dialog-editor-personalizado',
	BTN_CANCELAR_EDITOR_TEMA: 'config-apariencia-btn-cancelar-editor',

	CARD_CATALOGOS_GESTION: 'config-catalogos-card-gestion',

	CAT_TAMANOS_HOJA_RAIZ: 'config-catalogos-tamanos-hoja',
	CAT_TAMANOS_HOJA_TOGGLE: 'config-catalogos-tamanos-hoja-toggle',
	CAT_TAMANOS_HOJA_BTN_AGREGAR: 'config-catalogos-tamanos-hoja-btn-agregar',
	CAT_TAMANOS_HOJA_DIALOG_CREAR: 'config-catalogos-tamanos-hoja-dialog-crear',
	CAT_TAMANOS_HOJA_INPUT_NOMBRE: 'config-catalogos-tamanos-hoja-nombre-crear',
	CAT_TAMANOS_HOJA_INPUT_ANCHO: 'config-catalogos-tamanos-hoja-ancho-crear',
	CAT_TAMANOS_HOJA_INPUT_ALTO: 'config-catalogos-tamanos-hoja-alto-crear',
	CAT_TAMANOS_HOJA_BTN_CANCELAR_CREAR: 'config-catalogos-tamanos-hoja-btn-cancelar-crear',
	CAT_TAMANOS_HOJA_BTN_CONFIRMAR_CREAR: 'config-catalogos-tamanos-hoja-btn-confirmar-crear',

	CAT_ALERGIAS_RAIZ: 'config-catalogos-alergias',
	CAT_ALERGIAS_TOGGLE: 'config-catalogos-alergias-toggle',
	CAT_ALERGIAS_BTN_AGREGAR: 'config-catalogos-alergias-btn-agregar',
	CAT_ALERGIAS_DIALOG_CREAR: 'config-catalogos-alergias-dialog-crear',
	CAT_ALERGIAS_INPUT_NOMBRE: 'config-catalogos-alergias-nombre-crear',
	CAT_ALERGIAS_INPUT_DESCRIPCION: 'config-catalogos-alergias-descripcion-crear',
	CAT_ALERGIAS_BTN_CANCELAR_CREAR: 'config-catalogos-alergias-btn-cancelar-crear',
	CAT_ALERGIAS_BTN_CONFIRMAR_CREAR: 'config-catalogos-alergias-btn-confirmar-crear',

	CAT_ENFERMEDADES_RAIZ: 'config-catalogos-enfermedades',
	CAT_ENFERMEDADES_TOGGLE: 'config-catalogos-enfermedades-toggle',
	CAT_ENFERMEDADES_BTN_AGREGAR: 'config-catalogos-enfermedades-btn-agregar',
	CAT_ENFERMEDADES_DIALOG_CREAR: 'config-catalogos-enfermedades-dialog-crear',
	CAT_ENFERMEDADES_INPUT_NOMBRE: 'config-catalogos-enfermedades-nombre-crear',
	CAT_ENFERMEDADES_INPUT_DESCRIPCION: 'config-catalogos-enfermedades-descripcion-crear',
	CAT_ENFERMEDADES_BTN_CANCELAR_CREAR: 'config-catalogos-enfermedades-btn-cancelar-crear',
	CAT_ENFERMEDADES_BTN_CONFIRMAR_CREAR: 'config-catalogos-enfermedades-btn-confirmar-crear',

	CAT_MEDICAMENTOS_RAIZ: 'config-catalogos-medicamentos',
	CAT_MEDICAMENTOS_TOGGLE: 'config-catalogos-medicamentos-toggle',
	CAT_MEDICAMENTOS_BTN_AGREGAR: 'config-catalogos-medicamentos-btn-agregar',
	CAT_MEDICAMENTOS_DIALOG_CREAR: 'config-catalogos-medicamentos-dialog-crear',
	CAT_MEDICAMENTOS_INPUT_NOMBRE: 'config-catalogos-medicamentos-nombre-crear',
	CAT_MEDICAMENTOS_INPUT_DESCRIPCION: 'config-catalogos-medicamentos-descripcion-crear',
	CAT_MEDICAMENTOS_BTN_CANCELAR_CREAR: 'config-catalogos-medicamentos-btn-cancelar-crear',
	CAT_MEDICAMENTOS_BTN_CONFIRMAR_CREAR: 'config-catalogos-medicamentos-btn-confirmar-crear',

	CAT_COLORES_RAIZ: 'config-catalogos-colores',
	CAT_COLORES_TOGGLE: 'config-catalogos-colores-toggle',
	CAT_COLORES_BTN_AGREGAR: 'config-catalogos-colores-btn-agregar',
	CAT_COLORES_DIALOG_CREAR: 'config-catalogos-colores-dialog-crear',
	CAT_COLORES_INPUT_NOMBRE: 'config-catalogos-colores-nombre-crear',
	CAT_COLORES_INPUT_DESCRIPCION: 'config-catalogos-colores-descripcion-crear',
	CAT_COLORES_INPUT_COLOR: 'config-catalogos-colores-color-crear',
	CAT_COLORES_BTN_CANCELAR_CREAR: 'config-catalogos-colores-btn-cancelar-crear',
	CAT_COLORES_BTN_CONFIRMAR_CREAR: 'config-catalogos-colores-btn-confirmar-crear',

	CAT_ETIQUETAS_RAIZ: 'config-catalogos-etiquetas-plantillas',
	CAT_ETIQUETAS_TOGGLE: 'config-catalogos-etiquetas-plantillas-toggle',
	CAT_ETIQUETAS_BTN_AGREGAR: 'config-catalogos-etiquetas-plantillas-btn-agregar',
	CAT_ETIQUETAS_DIALOG_CREAR: 'config-catalogos-etiquetas-plantillas-dialog-crear',
	CAT_ETIQUETAS_INPUT_NOMBRE: 'config-catalogos-etiquetas-plantillas-nombre-crear',
	CAT_ETIQUETAS_INPUT_DESCRIPCION: 'config-catalogos-etiquetas-plantillas-descripcion-crear',
	CAT_ETIQUETAS_INPUT_CODIGO: 'config-catalogos-etiquetas-plantillas-codigo-crear',
	CAT_ETIQUETAS_BTN_CANCELAR_CREAR: 'config-catalogos-etiquetas-plantillas-btn-cancelar-crear',
	CAT_ETIQUETAS_BTN_CONFIRMAR_CREAR: 'config-catalogos-etiquetas-plantillas-btn-confirmar-crear',

	CAT_SIMBOLOGIA_RAIZ: 'config-catalogos-simbologia',
	CAT_SIMBOLOGIA_TOGGLE: 'config-catalogos-simbologia-toggle',
	CAT_SIMBOLOGIA_BTN_AGREGAR: 'config-catalogos-simbologia-btn-agregar',
	CAT_SIMBOLOGIA_INPUT_BUSCAR: 'config-catalogos-simbologia-buscar',
	CAT_SIMBOLOGIA_LISTA: 'config-catalogos-simbologia-lista',

	SIMB_EDITOR_DIALOG: 'config-catalogos-simbologia-editor-dialog',
	SIMB_EDITOR_TAB_CREACION: 'config-catalogos-simbologia-editor-tab-creacion',
	SIMB_EDITOR_TAB_DESCRIPCION: 'config-catalogos-simbologia-editor-tab-descripcion',
	SIMB_EDITOR_INPUT_NOMBRE: 'config-catalogos-simbologia-editor-nombre',
	SIMB_EDITOR_BTN_CATEGORIA: 'config-catalogos-simbologia-editor-btn-categoria',
	SIMB_EDITOR_SECCION_COLORES: 'config-catalogos-simbologia-editor-seccion-colores',
	SIMB_EDITOR_BTN_COLOR_PRINCIPAL: 'config-catalogos-simbologia-editor-color-principal',
	SIMB_EDITOR_BTN_COLOR_SECUNDARIO: 'config-catalogos-simbologia-editor-color-secundario',
	SIMB_EDITOR_HERR_PINCEL: 'config-catalogos-simbologia-editor-herr-pincel',
	SIMB_EDITOR_HERR_BORRADOR: 'config-catalogos-simbologia-editor-herr-borrador',
	SIMB_EDITOR_HERR_BORRADOR_MAGICO: 'config-catalogos-simbologia-editor-herr-borrador-magico',
	SIMB_EDITOR_BTN_COLOR: 'config-catalogos-simbologia-editor-color-principal',
	SIMB_EDITOR_SLIDER_GROSOR: 'config-catalogos-simbologia-editor-grosor',
	SIMB_EDITOR_TEXTAREA_DESCRIPCION: 'config-catalogos-simbologia-editor-descripcion',
	SIMB_EDITOR_BTN_DESHACER: 'config-catalogos-simbologia-editor-deshacer',
	SIMB_EDITOR_BTN_REHACER: 'config-catalogos-simbologia-editor-rehacer',
	SIMB_EDITOR_BTN_LIMPIAR: 'config-catalogos-simbologia-editor-limpiar',
	SIMB_EDITOR_BTN_ZOOM_MENOS: 'config-catalogos-simbologia-editor-zoom-menos',
	SIMB_EDITOR_BTN_ZOOM_MAS: 'config-catalogos-simbologia-editor-zoom-mas',
	SIMB_EDITOR_BTN_ZOOM_RESET: 'config-catalogos-simbologia-editor-zoom-reset',
	SIMB_EDITOR_LIENZO: 'config-catalogos-simbologia-editor-lienzo',
	SIMB_EDITOR_BTN_CANCELAR: 'config-catalogos-simbologia-editor-cancelar',
	SIMB_EDITOR_BTN_GUARDAR: 'config-catalogos-simbologia-editor-guardar',
} as const;

export const TUTORIALES_CONFIGURACION: TutorialDefinicion[] = [
	{
		nombre: 'configuracion-perfil-y-otros',
		titulo: '👤 Perfil y Otros Ajustes',
		descripcion: 'Actualiza tu perfil, región, moneda, divisas y opciones avanzadas (IA incluida).',
		icono: '👤',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '👤 Perfil y Ajustes Extra',
				descripcion: 'En este tutorial veremos toda la pestaña “Perfil”: tu información personal, contraseña, país, moneda, divisas, y algunos ajustes avanzados. No necesitas ser técnico: iré paso a paso. Si en algún punto no estás seguro o prefieres que lo configure otra persona, puedes solicitar ayuda al desarrollador.',
				accionPrevia: irATabPerfil,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.TAB_PERFIL,
				titulo: 'Ir a Perfil',
				descripcion: 'Primero, nos aseguramos de estar en la pestaña “Perfil”.',
				accionPrevia: irATabPerfil,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_INFO_PERSONAL,
				titulo: 'Información Personal',
				descripcion: 'Aquí actualizas tus datos básicos: avatar, nombre y (solo lectura) tu correo.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_INFO_PERSONAL}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SECCION_AVATAR,
				titulo: 'Avatar (foto)',
				descripcion: 'Tu avatar es la imagen que te representa en el sistema. Si quieres, puedes cambiarla con el ícono de la cámara.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SECCION_AVATAR}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_NOMBRE,
				titulo: 'Nombre completo',
				descripcion: 'Es el nombre que verás en el sistema (por ejemplo: “Dr. Juan Pérez”).',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_CORREO,
				titulo: 'Correo electrónico',
				descripcion: 'Este correo es tu usuario de inicio de sesión. Por seguridad, no se modifica desde aquí.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_PERFIL,
				titulo: 'Guardar cambios de perfil',
				descripcion: 'Cuando cambies tu nombre (o tu avatar), usa este botón para guardar.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_CONTRASENA,
				titulo: 'Cambiar contraseña',
				descripcion: 'Si quieres actualizar tu contraseña, esta es la sección. Te recomiendo usar una contraseña que solo tú conozcas.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_CONTRASENA}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_CONTRASENA_ACTUAL,
				titulo: 'Contraseña actual',
				descripcion: 'Escribe tu contraseña actual para confirmar que eres tú.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_NUEVA_CONTRASENA,
				titulo: 'Nueva contraseña',
				descripcion: 'Elige tu nueva contraseña. El sistema te mostrará si cumple los requisitos mínimos.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_CONFIRMAR_CONTRASENA,
				titulo: 'Confirmar nueva contraseña',
				descripcion: 'Vuelve a escribir la nueva contraseña para asegurarte de que no hay errores.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_CAMBIAR_CONTRASENA,
				titulo: 'Aplicar cambio de contraseña',
				descripcion: 'Cuando los tres campos estén completos, presiona para cambiar tu contraseña.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_AJUSTES_EXTRA,
				titulo: 'Ajustes extra',
				descripcion: 'Aquí están las configuraciones regionales (país/moneda) y opciones avanzadas (divisas, edición histórica e IA).',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_AJUSTES_EXTRA}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SECCION_PAIS,
				titulo: 'País predeterminado',
				descripcion: 'Esto define el prefijo telefónico que aparecerá por defecto al crear pacientes. Puedes cambiarlo según tu clínica.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SECCION_PAIS}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_PAIS,
				titulo: 'Guardar país',
				descripcion: 'Guarda el país cuando lo cambies.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SECCION_MONEDA,
				titulo: 'Moneda local (base del sistema)',
				descripcion: 'Esta moneda se usa como base para el sistema. Selecciónala cuidadosamente: normalmente solo se define una vez.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SECCION_MONEDA}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_MONEDA,
				titulo: 'Guardar moneda',
				descripcion: 'Guarda la moneda seleccionada. Si ya está configurada como base, el sistema puede bloquear cambios para evitar inconsistencias.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_DIVISAS,
				titulo: 'Configuración de divisas',
				descripcion: 'Si trabajas con dólares además de tu moneda local, aquí defines la tasa de cambio y tu modo de trabajo principal.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_DIVISAS}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_CAMBIO_LOCAL,
				titulo: 'Tasa de cambio',
				descripcion: 'Aquí defines cuánto vale 1 USD en tu moneda local (por ejemplo: 1 USD = 6.96 en tu moneda).',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_ACTUALIZAR_TASA_API,
				titulo: 'Actualizar desde internet',
				descripcion: 'Este botón intenta traer la tasa automáticamente desde un servicio externo. Requiere internet y que la API de tasa esté configurada.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.MODO_TRABAJO_LOCAL,
				titulo: 'Modo de trabajo: moneda local',
				descripcion: 'Ideal si la mayoría de tu trabajo lo gestionas en una sola moneda.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.MODO_TRABAJO_USD,
				titulo: 'Modo de trabajo: dólares',
				descripcion: 'Útil si también cobras o registras montos en USD. El sistema usa la tasa de cambio que configuraste.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_DIVISAS,
				titulo: 'Guardar preferencias de divisas',
				descripcion: 'Después de ajustar tasa y modo de trabajo, guarda los cambios aquí.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SECCION_EXCHANGE_RATE,
				titulo: 'API de tasa de cambio',
				descripcion: 'Una “API Key” es como una llave que autoriza al sistema a usar un servicio. Aquí se usa para consultar tasas de cambio automáticamente (si quieres).',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SECCION_EXCHANGE_RATE}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_EXCHANGE_RATE_API_KEY,
				titulo: 'API Key (ExchangeRate)',
				descripcion: 'Pega aquí la llave del servicio. Si no la tienes, puedes usar una gratuita desde su página.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_EXCHANGE_RATE_GUARDAR_VALIDAR,
				titulo: 'Guardar y validar',
				descripcion: 'Guarda la llave y prueba si la conexión funciona.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SECCION_HISTORICA,
				titulo: 'Edición histórica',
				descripcion: 'Permite crear citas y tratamientos en el pasado. Úsalo solo si realmente lo necesitas, y recuerda que por seguridad se desactiva al iniciar sesión.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SECCION_HISTORICA}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_MODO_NORMAL,
				titulo: 'Modo normal',
				descripcion: 'Es el modo recomendado para el uso diario.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_MODO_HISTORICO,
				titulo: 'Edición histórica',
				descripcion: 'Actívalo solo cuando necesites registrar algo en fechas pasadas.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SECCION_MODELO_ODONTOGRAMA,
				titulo: 'Modelo de dientes (Odontograma)',
				descripcion: 'Aquí puedes elegir cómo se ven los dientes del odontograma en todo el sistema. Elige el estilo que prefieras (cuadrado o circular). Si lo deseas, también puedes solicitar ayuda al desarrollador para dejarlo configurado.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SECCION_MODELO_ODONTOGRAMA}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_MODELO_ODONTOGRAMA_CUADRADO,
				titulo: 'Modelo: Cuadrado',
				descripcion: 'Selecciona el estilo “Cuadrado”. Verás una vista previa en el botón. Si no estás seguro, puedes pedir apoyo al desarrollador.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_MODELO_ODONTOGRAMA_CIRCULAR,
				titulo: 'Modelo: Circular',
				descripcion: 'Selecciona el estilo “Circular”. Verás una vista previa en el botón. Si no estás seguro, puedes pedir apoyo al desarrollador.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SECCION_GEMINI,
				titulo: 'Inteligencia Artificial (Gemini)',
				descripcion: 'La IA puede ayudar en reportes. También usa una API Key (una “llave” de acceso). Si tienes problemas para configurarlo, consulta con el desarrollador, porque la llave y el enlace normalmente se configuran manualmente.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SECCION_GEMINI}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_GEMINI_API_KEY,
				titulo: 'Gemini API Key',
				descripcion: 'Este campo al igual que la tasa de cambio, viene vacío. Si lo deseas, puedes solicitar ayuda al desarrollador para configurarlo correctamente.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_GEMINI_URL_BASE,
				titulo: 'Endpoint (URL del modelo)',
				descripcion: 'Es la dirección del servicio de IA. Si necesitas cambiarlo, es mejor hacerlo con apoyo del desarrollador.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_GEMINI,
				titulo: 'Guardar configuración de IA',
				descripcion: 'Guarda la configuración y verifica si queda activa. Si no sabes qué valores usar, solicita ayuda al desarrollador.',
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ ¡Listo!',
				descripcion: 'Con esto ya conoces toda la pestaña “Perfil y otros”. Si quieres, puedes continuar con los tutoriales de Clínica, Apariencia y Catálogos.',
			},
		],
	},
	{
		nombre: 'configuracion-clinica',
		titulo: '🏥 Clínica',
		descripcion: 'Personaliza el logo, el nombre del consultorio y el mensaje de bienvenida.',
		icono: '🏥',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🏥 Configuración de Clínica',
				descripcion: 'En este tutorial veremos cómo personalizar la identidad de tu consultorio: logo, nombre y mensaje de bienvenida. Empezamos yendo automáticamente a la pestaña “Clínica”.',
				accionPrevia: irATabClinica,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.TAB_CLINICA,
				titulo: 'Ir a Clínica',
				descripcion: 'Esta pestaña controla la identidad visual de tu consultorio dentro del sistema.',
				accionPrevia: irATabClinica,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_CLINICA_CONFIG,
				titulo: 'Panel de Clínica',
				descripcion: 'Aquí están todas las opciones para el logo, el nombre y el mensaje que se verá en el inicio.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_CLINICA_CONFIG}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SECCION_LOGO_CLINICA,
				titulo: 'Logo de la Clínica',
				descripcion: 'Este logo se aplica únicamente al menú lateral (la barra de navegación).',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SECCION_LOGO_CLINICA}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_CAMARA_LOGO,
				titulo: 'Subir/cambiar logo',
				descripcion: 'Haz clic en el ícono de la cámara para seleccionar una imagen. Recomendación: usa una imagen cuadrada o con fondo transparente para que se vea mejor.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_QUITAR_LOGO,
				titulo: 'Quitar logo',
				descripcion: 'Si quieres volver a dejarlo sin logo, puedes quitarlo aquí. Luego recuerda guardar la configuración.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_NOMBRE_CLINICA,
				titulo: 'Nombre de la clínica',
				descripcion: 'Es el nombre que aparecerá en el mensaje de bienvenida y en distintos lugares del sistema.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_MENSAJE_ANTES,
				titulo: 'Mensaje de bienvenida (antes)',
				descripcion: 'Esta parte va antes del nombre del usuario. Ejemplo: “Bienvenido,”.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.INPUT_MENSAJE_DESPUES,
				titulo: 'Mensaje de bienvenida (después)',
				descripcion: 'Esta parte va después del nombre del usuario. Ejemplo: “¿qué haremos hoy?”.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_CLINICA,
				titulo: 'Guardar configuración',
				descripcion: 'Guarda los cambios. Después de guardar, el menú lateral usará el nuevo logo y el inicio reflejará el mensaje/nombre configurados.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_CLINICA_PREVIEW,
				titulo: 'Vista previa',
				descripcion: 'Aquí puedes ver una vista previa del mensaje y el nombre en la página de inicio (el logo se usa en el menú lateral).',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_CLINICA_PREVIEW}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ ¡Listo!',
				descripcion: 'Con esto ya sabes cómo personalizar la identidad de tu consultorio. Si quieres, seguimos con Apariencia y luego con Catálogos.',
			},
		],
	},
	{
		nombre: 'configuracion-clinica-horas-laborables',
		titulo: '⏰ Clínica: Horas laborables',
		descripcion:
			'Configura los horarios por día. Si un día queda sin intervalos, se considera no laborable. Puedes ajustar los rangos y agregar intervalos extra.',
		icono: '⏰',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '⏰ Horas laborables (Clínica)',
				descripcion:
					'En este tutorial configurarás los horarios laborables por día. Verás los rangos por defecto (08:00–12:00 y 14:00–18:00), cómo cambiarlos y cómo agregar intervalos extra.',
				accionPrevia: irATabClinica,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.TAB_CLINICA,
				titulo: 'Ir a Clínica',
				descripcion: 'Primero, nos aseguramos de estar en la pestaña “Clínica”.',
				accionPrevia: irATabClinica,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_HORARIOS_LABORALES,
				titulo: 'Horarios laborables por día',
				descripcion:
					'Aquí defines el horario de atención. Cada día puede tener uno o varios intervalos (por ejemplo: mañana y tarde).',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_HORARIOS_LABORALES}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.HORARIOS_DIA_DOMINGO,
				titulo: 'Domingo: día no laborable (si no hay intervalos)',
				descripcion:
					'Si un día NO tiene intervalos, entonces ese día se considera NO laborable. Usaremos “domingo” como ejemplo: si dejas domingo vacío (sin rangos), el sistema lo interpreta como un día de descanso.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.HORARIOS_DIA_DOMINGO}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.HORARIOS_DIA_LUNES,
				titulo: 'Lunes: horarios por defecto y edición',
				descripcion:
					'Cada día inicia con horarios por defecto (por ejemplo, mañana y tarde). Puedes editar las horas directamente en los campos de inicio/fin para ajustarlas a tu forma de trabajo.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.HORARIOS_DIA_LUNES}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.HORARIOS_BTN_AGREGAR_LUNES,
				titulo: 'Agregar un tercer intervalo (emergencias)',
				descripcion:
					'Además de mañana y tarde, puedes agregar un TERCER intervalo para casos especiales, como un horario de “emergencias” (ejemplo: 19:00–21:00). Usa “Agregar” para crear ese rango adicional.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.HORARIOS_BTN_AGREGAR_LUNES}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_HORARIOS_LABORALES,
				titulo: 'Guardar horarios',
				descripcion:
					'Cuando termines, guarda. Consejo: evita intervalos solapados (el sistema te avisará si hay conflictos).',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.BTN_GUARDAR_HORARIOS_LABORALES}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ Tutorial completado',
				descripcion:
					'Listo: ya sabes cómo configurar las horas laborables. Si un día queda sin intervalos, se tratará como no laborable, y puedes agregar tantos intervalos como necesites.',
			},
		],
	},
	{
		nombre: 'configuracion-apariencia-temas',
		titulo: '🎨 Apariencia: Temas',
		descripcion: 'Cambia el tema, prueba opciones recomendadas (incluida “Azul Océano” para la noche) y conoce el editor de tema personalizado.',
		icono: '🎨',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🎨 Temas de Apariencia',
				descripcion: 'Vamos a probar algunos temas para que elijas el que te sea más cómodo. Tip: si trabajas de noche, “Azul Océano” suele ser más amable con la vista.',
				accionPrevia: async () => {
					await seleccionarTemaApariencia('claro');
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.TAB_APARIENCIA,
				titulo: 'Ir a Apariencia',
				descripcion: 'Esta pestaña controla los colores y el estilo visual del sistema.',
				accionPrevia: async () => {
					await seleccionarTemaApariencia('claro');
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_APARIENCIA_TEMA,
				titulo: 'Selector de Tema',
				descripcion: 'Aquí puedes cambiar el tema cuando quieras. Se aplica al instante y queda guardado automáticamente.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_APARIENCIA_TEMA}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_TEMA_OSCURO,
				titulo: 'Probar “Oscuro”',
				descripcion: 'Probemos un tema oscuro clásico. Si trabajas con poca luz, suele ser más cómodo.',
				accionPrevia: async () => {
					await seleccionarTemaApariencia('oscuro');
				},
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_TEMA_AZUL_OCEANO,
				titulo: 'Recomendación nocturna: “Azul Océano”',
				descripcion: 'Si vas a trabajar de noche, este tema suele ayudar a reducir fatiga visual sin perder contraste.',
				accionPrevia: async () => {
					await seleccionarTemaApariencia('azul');
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_TEMA_MENTA_DENTAL,
				titulo: 'Probar un tema médico (ejemplo)',
				descripcion: 'Vamos a probar “Menta Dental”. Puedes explorar otros temas médicos cuando quieras.',
				accionPrevia: async () => {
					await seleccionarTemaApariencia('menta');
				},
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_TEMA_PERSONALIZADO,
				titulo: 'Tema “Personalizado”',
				descripcion: 'Si quieres tu propio estilo, este tema te permite editar los colores a tu gusto.',
				accionPrevia: async () => {
					await seleccionarTemaApariencia('personalizado');
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.PANEL_TEMA_PERSONALIZADO}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_PERSONALIZAR_COLORES,
				titulo: 'Abrir editor de colores',
				descripcion: 'Abrimos el editor para ver cómo se personaliza. Los cambios se ven en tiempo real mientras editas.',
				accionPrevia: abrirEditorTemaPersonalizado,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.DIALOG_EDITOR_TEMA_PERSONALIZADO,
				titulo: 'Editor de Tema Personalizado',
				descripcion: 'Aquí puedes elegir colores, probar paletas y guardar. Si no guardas y cancelas, se revierte automáticamente.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_CANCELAR_EDITOR_TEMA,
				titulo: 'Cerrar sin guardar',
				descripcion: 'Cerremos el editor sin guardar (así no cambiamos tu tema actual).',
				accionPrevia: cerrarEditorTemaPersonalizado,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.BTN_TEMA_CLARO,
				titulo: 'Volver al tema blanco',
				descripcion: 'Volvemos a “Claro” para dejar el sistema con un estilo limpio y luminoso.',
				accionPrevia: async () => {
					await seleccionarTemaApariencia('claro');
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ ¡Listo!',
				descripcion: 'Ya sabes cambiar de tema y usar el editor personalizado. Cuando trabajes de noche, prueba “Azul Océano” y elige el que te resulte más cómodo.',
			},
		],
	},
	{
		nombre: 'configuracion-catalogos-tamanos-hoja',
		titulo: '🗂️ Catálogos: Tamaños de Hoja',
		descripcion: 'Crea un tamaño de hoja (A4, Carta, etc.) para tus PDFs y reportes. (Sin guardar cambios en el tutorial).',
		icono: '🗂️',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🗂️ Ir a Catálogos',
				descripcion: 'Todos estos registros se crean desde la pestaña “Catálogos”. Empezaremos con Tamaños de Hoja. (El tutorial no te obliga a guardar nada).',
				accionPrevia: async () => {
					await irATabCatalogos();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_CATALOGOS_GESTION}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CARD_CATALOGOS_GESTION,
				titulo: 'Tarjeta de Catálogos',
				descripcion: 'Aquí encontrarás todas las secciones de catálogos disponibles.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CARD_CATALOGOS_GESTION}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_TOGGLE,
				titulo: 'Sección: Tamaños de Hoja',
				descripcion: 'Abre esta sección para ver y administrar tamaños que se guardan en milímetros (mm).',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_TOGGLE,
						'config-catalogos-tamanos-hoja-contenido'
					);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_BTN_AGREGAR,
				titulo: 'Agregar tamaño',
				descripcion: 'Usa este botón para crear un nuevo tamaño de hoja.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_TOGGLE,
						'config-catalogos-tamanos-hoja-contenido'
					);
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_BTN_AGREGAR}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_DIALOG_CREAR,
				titulo: 'Formulario de creación',
				descripcion: 'Se abre un diálogo donde defines nombre y medidas en mm. La descripción se genera automáticamente a partir de ancho y alto.',
				accionPrevia: abrirDialogoCrearTamanoHoja,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_INPUT_NOMBRE,
				titulo: 'Nombre',
				descripcion: 'Ejemplos: “A4”, “Carta”, “Oficio”. Usa nombres cortos y claros.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_INPUT_ANCHO,
				titulo: 'Ancho (mm)',
				descripcion: 'Ingresa el ancho en milímetros. Ejemplo A4: 210.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_INPUT_ALTO,
				titulo: 'Alto (mm)',
				descripcion: 'Ingresa el alto en milímetros. Ejemplo A4: 297.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_TAMANOS_HOJA_BTN_CONFIRMAR_CREAR,
				titulo: 'Crear',
				descripcion: 'Al presionar “Crear”, quedará disponible para PDFs/reportes. (En este tutorial no lo haremos).',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ Listo',
				descripcion: 'Ya sabes cómo registrar tamaños de hoja. Ahora podemos continuar con Alergias, Enfermedades, Medicamentos y otros catálogos.',
			},
		],
	},
	{
		nombre: 'configuracion-catalogos-alergias',
		titulo: '🗂️ Catálogos: Registrar Alergia',
		descripcion: 'Aprende a agregar una alergia al catálogo. (El tutorial no guarda cambios).',
		icono: '🗂️',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🗂️ Ir a Catálogos',
				descripcion: 'Vamos a ver cómo se agrega una alergia al catálogo. Primero, vamos a la pestaña “Catálogos”.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_TOGGLE}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_TOGGLE,
				titulo: 'Sección: Alergias',
				descripcion: 'Expande la sección para ver la lista y el buscador.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_RAIZ}-contenido`
					);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_BTN_AGREGAR,
				titulo: 'Agregar alergia',
				descripcion: 'Aquí abres el formulario para crear una nueva alergia.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_RAIZ}-contenido`
					);
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_BTN_AGREGAR}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_DIALOG_CREAR,
				titulo: 'Formulario',
				descripcion: 'Completa el nombre y, si quieres, una descripción (síntomas, severidad, etc.).',
				accionPrevia: () => abrirDialogoCrearCatalogo(IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_RAIZ),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_INPUT_NOMBRE,
				titulo: 'Nombre de la alergia',
				descripcion: 'Ejemplos: Penicilina, Polen, Mariscos.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_INPUT_DESCRIPCION,
				titulo: 'Descripción (opcional)',
				descripcion: 'Puedes anotar reacción típica o nivel de gravedad (leve/moderada/severa).',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ALERGIAS_BTN_CONFIRMAR_CREAR,
				titulo: 'Crear',
				descripcion: 'Guardaría la nueva alergia en el catálogo para selección rápida en pacientes.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ Listo',
				descripcion: 'Ya sabes cómo agregar alergias. Puedes repetir el flujo para Enfermedades y Medicamentos.',
			},
		],
	},
	{
		nombre: 'configuracion-catalogos-enfermedades',
		titulo: '🗂️ Catálogos: Registrar Enfermedad',
		descripcion: 'Aprende a agregar una enfermedad/condición al catálogo. (El tutorial no guarda cambios).',
		icono: '🗂️',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🗂️ Ir a Catálogos',
				descripcion: 'Vamos a ver cómo se registra una enfermedad/condición en el catálogo.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_TOGGLE}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_TOGGLE,
				titulo: 'Sección: Enfermedades',
				descripcion: 'Aquí registras condiciones médicas frecuentes para seleccionarlas rápidamente.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_RAIZ}-contenido`
					);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_BTN_AGREGAR,
				titulo: 'Agregar enfermedad',
				descripcion: 'Abrimos el formulario de creación.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_RAIZ}-contenido`
					);
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_BTN_AGREGAR}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_DIALOG_CREAR,
				titulo: 'Formulario',
				descripcion: 'Completa el nombre y, si quieres, una descripción con detalles relevantes.',
				accionPrevia: () => abrirDialogoCrearCatalogo(IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_RAIZ),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_INPUT_NOMBRE,
				titulo: 'Nombre',
				descripcion: 'Ejemplos: Diabetes, Hipertensión, Asma.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_INPUT_DESCRIPCION,
				titulo: 'Descripción (opcional)',
				descripcion: 'Puedes especificar tipo, control, o detalles relevantes.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ENFERMEDADES_BTN_CONFIRMAR_CREAR,
				titulo: 'Crear',
				descripcion: 'Al guardar, esta condición quedará disponible para selección rápida. (En este tutorial no guardaremos).',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ Listo',
				descripcion: 'Así se registran enfermedades/condiciones. El flujo es el mismo en Medicamentos.',
			},
		],
	},
	{
		nombre: 'configuracion-catalogos-medicamentos',
		titulo: '🗂️ Catálogos: Registrar Medicamento',
		descripcion: 'Aprende a agregar un medicamento al catálogo. (El tutorial no guarda cambios).',
		icono: '🗂️',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🗂️ Ir a Catálogos',
				descripcion: 'Vamos a ver cómo se registra un medicamento en el catálogo.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_TOGGLE}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_TOGGLE,
				titulo: 'Sección: Medicamentos',
				descripcion: 'Este catálogo sirve para selección rápida de medicamentos en historia clínica.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_RAIZ}-contenido`
					);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_BTN_AGREGAR,
				titulo: 'Agregar medicamento',
				descripcion: 'Abrimos el formulario de creación.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_RAIZ}-contenido`
					);
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_BTN_AGREGAR}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_DIALOG_CREAR,
				titulo: 'Formulario',
				descripcion: 'Completa el nombre y, si quieres, una descripción con dosis o indicaciones.',
				accionPrevia: () => abrirDialogoCrearCatalogo(IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_RAIZ),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_INPUT_NOMBRE,
				titulo: 'Nombre',
				descripcion: 'Ejemplos: Ibuprofeno, Amoxicilina, Losartán.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_INPUT_DESCRIPCION,
				titulo: 'Descripción (opcional)',
				descripcion: 'Puedes anotar dosis, frecuencia o indicaciones típicas.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_MEDICAMENTOS_BTN_CONFIRMAR_CREAR,
				titulo: 'Crear',
				descripcion: 'Al guardar, quedará disponible para selección rápida. (En este tutorial no guardaremos).',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ Listo',
				descripcion: 'Así se registran medicamentos. El flujo es el mismo en otros catálogos simples.',
			},
		],
	},
	{
		nombre: 'configuracion-catalogos-colores-categoria',
		titulo: '🗂️ Catálogos: Colores de Categoría',
		descripcion: 'Crea un color para categorizar estados (Urgente, Seguimiento, etc.). (El tutorial no guarda cambios).',
		icono: '🗂️',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🗂️ Ir a Catálogos',
				descripcion: 'Vamos a ver cómo se crea un color de categoría para marcar estados como “Urgente” o “Seguimiento”.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_TOGGLE}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_TOGGLE,
				titulo: 'Sección: Colores de Categoría',
				descripcion: 'Este catálogo define colores reutilizables para categorías/estados en distintas vistas.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_RAIZ}-contenido`
					);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_BTN_AGREGAR,
				titulo: 'Agregar color',
				descripcion: 'Abrimos el formulario de creación de color.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_RAIZ}-contenido`
					);
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_BTN_AGREGAR}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_DIALOG_CREAR,
				titulo: 'Formulario',
				descripcion: 'Define un nombre y elige un color.',
				accionPrevia: () => abrirDialogoCrearCatalogo(IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_RAIZ),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_INPUT_NOMBRE,
				titulo: 'Nombre de la categoría',
				descripcion: 'Ejemplos: Urgente, Seguimiento, Revisión.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_INPUT_COLOR,
				titulo: 'Seleccionar color',
				descripcion: 'Puedes elegirlo en el selector o escribir el código hexadecimal (por ejemplo: #22C55E).',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_COLORES_BTN_CONFIRMAR_CREAR,
				titulo: 'Crear',
				descripcion: 'Al guardar, el color quedará disponible para asignarlo en categorías/estados. (En este tutorial no guardaremos).',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ Listo',
				descripcion: 'Ya sabes cómo crear colores de categoría.',
			},
		],
	},
	{
		nombre: 'configuracion-catalogos-etiquetas-plantillas',
		titulo: '🗂️ Catálogos: Etiquetas de Plantillas',
		descripcion: 'Crea una etiqueta dinámica para plantillas (con código tipo [ETIQUETA]). (El tutorial no guarda cambios).',
		icono: '🗂️',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🗂️ Ir a Catálogos',
				descripcion: 'Vamos a ver cómo se crea una etiqueta dinámica para plantillas.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_TOGGLE}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_TOGGLE,
				titulo: 'Sección: Etiquetas de Plantillas',
				descripcion: 'Estas etiquetas se usan para reemplazar campos dinámicos dentro de tus plantillas.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_RAIZ}-contenido`
					);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_BTN_AGREGAR,
				titulo: 'Agregar etiqueta',
				descripcion: 'Abrimos el formulario de creación.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_TOGGLE,
						`${IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_RAIZ}-contenido`
					);
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_BTN_AGREGAR}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_DIALOG_CREAR,
				titulo: 'Formulario',
				descripcion: 'Define un nombre y un código (formato entre corchetes).',
				accionPrevia: () => abrirDialogoCrearCatalogo(IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_RAIZ),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_INPUT_NOMBRE,
				titulo: 'Nombre',
				descripcion: 'Un nombre amigable. Ejemplo: “Nombre del Paciente”.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_INPUT_CODIGO,
				titulo: 'Código (formato)',
				descripcion: 'El código suele ir entre corchetes. Ejemplos: [PACIENTE_NOMBRE], [FECHA_NAC].',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_ETIQUETAS_BTN_CONFIRMAR_CREAR,
				titulo: 'Crear',
				descripcion: 'Al guardar, el código quedará disponible para usarlo en plantillas. (En este tutorial no guardaremos).',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ Listo',
				descripcion: 'Ya sabes cómo crear etiquetas de plantillas.',
			},
		],
	},
	{
		nombre: 'configuracion-catalogos-simbologia',
		titulo: '🦷 Catálogos: Crear Nueva Simbología',
		descripcion: 'Crea un nuevo símbolo odontológico con el editor tipo “paint” y aprende para qué sirve cada control.',
		icono: '🦷',
		pagina: '/configuracion',
		condicionBloqueo: null,
		pasos: [
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '🗂️ Ir a Catálogos',
				descripcion: 'La Simbología se administra desde Catálogos. Vamos a crear un símbolo nuevo y a entender cada herramienta del editor.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_TOGGLE}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_TOGGLE,
				titulo: 'Sección: Simbología Odontológica',
				descripcion: 'Aquí se crean los símbolos que luego usarás en el odontograma.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_TOGGLE,
						'config-catalogos-simbologia-contenido'
					);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_INPUT_BUSCAR,
				titulo: 'Buscar símbolos',
				descripcion: 'Si tu clínica tiene muchos símbolos, usa el buscador para encontrarlos rápidamente por nombre.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_TOGGLE,
						'config-catalogos-simbologia-contenido'
					);
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_INPUT_BUSCAR}`);
				},
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_LISTA,
				titulo: 'Lista de símbolos',
				descripcion: 'Aquí ves los símbolos existentes. Puedes previsualizar, editar o eliminar según lo necesites.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_LISTA}`),
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_BTN_AGREGAR,
				titulo: 'Agregar símbolo',
				descripcion: 'Este botón abre el editor para crear una nueva simbología.',
				accionPrevia: async () => {
					await irATabCatalogos();
					await asegurarSeccionExpandida(
						IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_TOGGLE,
						'config-catalogos-simbologia-contenido'
					);
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.CAT_SIMBOLOGIA_BTN_AGREGAR}`);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_DIALOG,
				titulo: 'Editor de Simbología (tipo paint)',
				descripcion: 'Este editor se parece a un “paint”: eliges herramienta y grosor; dibujas en el lienzo y guardas el símbolo.',
				accionPrevia: abrirEditorSimbologia,
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_TAB_CREACION,
				titulo: 'Pestaña: Creación',
				descripcion: 'Aquí están las herramientas de dibujo y las opciones del símbolo.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_INPUT_NOMBRE,
				titulo: 'Nombre del símbolo',
				descripcion: 'Pon un nombre claro (ej: “Caries”, “Corona”, “Ausente”). Se usa para buscar y entender el símbolo.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_CATEGORIA,
				titulo: 'Categoría (solo 2 tipos)',
				descripcion:
					'Aquí cambias entre “Tratamiento” y “Hallazgo”.\n\n'
					+ 'Esto define los colores del símbolo:\n'
					+ '- Hallazgo: 1 solo color (fijo).\n'
					+ '- Tratamiento: 2 colores, porque en el odontograma podrás cambiar el estado (Por realizar / Realizado) y el símbolo cambiará de color.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_SECCION_COLORES,
				titulo: 'Colores del símbolo',
				descripcion: 'Aquí defines los colores del símbolo según la categoría elegida arriba.',
				accionPrevia: () => scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_SECCION_COLORES}`),
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_HERR_PINCEL,
				titulo: 'Herramienta: Pincel',
				descripcion: 'Dibujo normal. Ideal para líneas y marcas generales.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_HERR_BORRADOR,
				titulo: 'Herramienta: Borrador normal',
				descripcion: 'Borra “por trazo” pasando el cursor por encima (como un borrador clásico).',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_HERR_BORRADOR_MAGICO,
				titulo: 'Herramienta: Borrador mágico',
				descripcion: 'Borra trazos completos cercanos. Útil para limpiar rápido. (Puede deshabilitarse si el símbolo es una imagen plana antigua).',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: 'Grosor (más abajo)',
				descripcion: 'Más abajo encontrarás el control de grosor del trazo (en píxeles). Recomendación: usa grosores medianos para que el símbolo se vea bien en tamaños pequeños.',
				accionPrevia: async () => {
					await scrollRelativoAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_SECCION_COLORES}`, 220);
				},
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_DESHACER,
				titulo: 'Deshacer',
				descripcion: 'Revierte el último cambio. Es tu “seguro” mientras dibujas.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_REHACER,
				titulo: 'Rehacer',
				descripcion: 'Recupera una acción que deshiciste.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_LIMPIAR,
				titulo: 'Limpiar lienzo',
				descripcion: 'Borra todo el dibujo. Úsalo solo si quieres empezar de cero.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_ZOOM_MENOS,
				titulo: 'Zoom -',
				descripcion: 'Reduce el zoom para ver el símbolo completo.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_ZOOM_MAS,
				titulo: 'Zoom +',
				descripcion: 'Aumenta el zoom para dibujar detalles finos.',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_ZOOM_RESET,
				titulo: 'Restablecer zoom',
				descripcion: 'Vuelve al zoom normal (100%).',
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_LIENZO,
				titulo: 'Lienzo de dibujo',
				descripcion: 'Aquí dibujas el símbolo. Consejo: crea formas simples y contrastadas para que se vean bien en el odontograma.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_TAB_DESCRIPCION,
				titulo: 'Pestaña: Descripción',
				descripcion: 'Aquí puedes escribir la descripción del símbolo: qué representa y cuándo usarlo.',
				bloquearAtras: true,
				accionPrevia: async () => {
					await abrirTabDescripcionEditorSimbologia();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_TAB_DESCRIPCION}`);
				},
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_TEXTAREA_DESCRIPCION,
				titulo: 'Descripción del símbolo',
				descripcion: 'Útil para estandarizar el significado y el uso del símbolo en tu equipo.',
				bloquearAtras: true,
				accionPrevia: async () => {
					await abrirTabDescripcionEditorSimbologia();
					await scrollAElemento(`#${IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_TEXTAREA_DESCRIPCION}`);
				},
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_GUARDAR,
				titulo: 'Guardar',
				descripcion: 'Guarda el símbolo para que aparezca en la lista y pueda usarse en el odontograma.',
				bloquearAtras: true,
			},
			{
				ruta: '/configuracion',
				elementoId: IDS_ELEMENTOS_CONFIGURACION.SIMB_EDITOR_BTN_CANCELAR,
				titulo: 'Cancelar',
				descripcion: 'Cierra el editor. Si hay cambios sin guardar, el sistema te pedirá confirmación.',
			},
			{
				ruta: '/configuracion',
				elementoId: null,
				titulo: '✅ Listo',
				descripcion: 'Ya sabes crear simbología y para qué sirve cada herramienta del editor.',
			},
		],
	},
];

