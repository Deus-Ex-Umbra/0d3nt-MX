
import { TutorialDefinicion } from '@/contextos/tutoriales/tipos-tutoriales';
import { accionesEdicionImagenes } from './acciones-tutoriales';
import { IDS_ELEMENTOS_EDICION_IMAGENES } from './constantes';

export const TUTORIALES_EDICION_IMAGENES: TutorialDefinicion[] = [
    {
        nombre: 'guia-edicion-completa',
        titulo: '🖍️ Crear una versión nueva (Edición de Imágenes)',
        descripcion: 'Crea una nueva versión para editar, luego aprende la sección de pintado y la sección de comentarios con detalle.',
        icono: 'Pencil',
        pagina: '/edicion-imagenes',
        condicionBloqueo: null,
        pasos: [
            {
                ruta: '/edicion-imagenes',
                elementoId: null,
                titulo: 'Objetivo del tutorial',
                descripcion: 'Vas a abrir el editor creando una versión nueva y luego entender las 2 secciones clave: Pintado y Comentarios.',
                bloquearAtras: true,
                accionPrevia: accionesEdicionImagenes.asegurarVistaSeleccionPaciente,
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.BUSCAR_PACIENTE,
                titulo: '1) Buscar paciente',
                descripcion: 'Puedes buscar por nombre, apellidos, teléfono o ID. La idea es ubicar rápido el paciente que tiene el estudio (imagen) a editar.',
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.LISTA_PACIENTES,
                titulo: '2) Seleccionar paciente',
                descripcion: 'Selecciona un paciente (clic en la fila) o usa “Ver Imágenes”.\n\nTip: elige un paciente que tenga al menos 1 imagen (si al entrar no aparecen imágenes, vuelve y elige otro paciente o sube una imagen desde Pacientes → Archivos).',
                bloquearAtras: true,
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.CONTENEDOR_IMAGENES,
                titulo: '3) Elegir imagen y crear versión',
                descripcion: 'Aquí aparecen las imágenes del paciente. Presiona “Editar y Crear Versiones”.\n\nImportante: al abrir el editor desde aquí, el sistema crea AUTOMÁTICAMENTE una versión nueva encima de la última. Si no existían versiones, esta será la primera.',
                accionPosterior: accionesEdicionImagenes.asegurarEditorAbierto,
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_DIALOG,
                titulo: 'Editor abierto: estás en una nueva versión',
                descripcion: 'Listo: ya estás trabajando sobre una versión nueva (por ejemplo “Edición 1, 2, 3…”).\n\nRegla mental: “Abrir editor” = crea versión nueva para trabajar. “Guardar” = actualiza la versión actual (no crea otra nueva). Para crear otra versión distinta, vuelves a abrir el editor desde la imagen (o duplicas una versión).',
                accionPrevia: accionesEdicionImagenes.asegurarEditorAbierto
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_TAB_HERRAMIENTAS,
                titulo: 'Sección 1: Pintado (Herramientas)',
                descripcion: 'Esta pestaña concentra TODO lo relacionado a pintar/anotar: seleccionar herramienta, color, grosor y opacidad.\n\nTip: si algo “no deja dibujar”, revisa si estás en modo Comentario/Reubicación (se cancela desde el botón Comentario).',
                accionPrevia: async () => {
                    await accionesEdicionImagenes.asegurarEditorAbierto();
                    await accionesEdicionImagenes.cambiarTabHerramientas();
                }
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_TOOL_PINCEL,
                titulo: 'Pincel: anotaciones a mano alzada',
                descripcion: 'Usa Pincel para trazar líneas libres sobre la imagen. Ajusta color, grosor y opacidad para diferenciar hallazgos (ej: rojo para patología, azul para referencia).',
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_TOOL_BORRADOR,
                titulo: 'Borrador: correcciones',
                descripcion: 'El Borrador borra trazos (ideal para corregir sin reiniciar todo). Si necesitas reiniciar por completo, usa “Limpiar” desde la barra superior.',
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_CANVAS,
                titulo: 'Área de trabajo (Canvas)',
                descripcion: 'Este es el lienzo donde interactúas con la imagen.\n\nCómo dibujar: selecciona Pincel → clic y arrastra.\nCómo navegar: usa zoom (±) y rotación si la imagen viene girada.\n\nRecomendación: antes de guardar, revisa que las marcas no oculten estructuras importantes (baja opacidad si necesitas).',
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_TAB_COMENTARIOS,
                titulo: 'Sección 2: Comentarios (lista)',
                descripcion: 'La pestaña “Comentarios” es el panel de administración: aquí ves la lista de comentarios, los editas o los eliminas.\n\nOjo: para CREAR un comentario nuevo, se hace desde el botón “Comentario” (en Herramientas) y luego clic en la imagen.',
                accionPrevia: async () => {
                    await accionesEdicionImagenes.asegurarEditorAbierto();
                    await accionesEdicionImagenes.cambiarTabComentarios();
                }
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_LISTA_COMENTARIOS,
                titulo: 'Lista de comentarios',
                descripcion: 'Si ya existen comentarios, aquí los verás. Puedes abrir detalle, editar o eliminar. Cada comentario se asocia a esta versión: si creas otra versión, tendrá su propia lista.',
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_TOOL_COMENTARIO,
                titulo: 'Crear un comentario (modo Comentario)',
                descripcion: 'Vuelve a Herramientas y presiona “Comentario”. El cursor queda en modo comentario: el siguiente clic en la imagen coloca un marcador y abre el formulario (título, contenido y color).\n\nPara cancelar el modo comentario, vuelve a presionar el mismo botón (cambia a “Cancelar”).',
                accionPrevia: async () => {
                    await accionesEdicionImagenes.asegurarEditorAbierto();
                    await accionesEdicionImagenes.cambiarTabHerramientas();
                },
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_CANVAS,
                titulo: 'Colocar el marcador sobre la imagen',
                descripcion: 'Con el modo Comentario activo, haz clic en el punto exacto de la imagen donde quieres anclar la nota.\n\nBuena práctica: pon comentarios “pegados” al hallazgo y usa el color para clasificar (ej: rojo urgente, amarillo seguimiento).',
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_BTN_ABRIR_GUARDAR,
                titulo: 'Guardar: confirma y persiste cambios',
                descripcion: 'Cuando termines de dibujar y/o comentar, presiona “Guardar”. Esto NO crea otra versión: guarda los cambios dentro de la versión actual.',
                accionPosterior: accionesEdicionImagenes.abrirDialogoGuardar,
            },
            {
                ruta: '/edicion-imagenes',
                elementoId: IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_BTN_GUARDAR,
                titulo: 'Confirmar guardado',
                descripcion: 'En este diálogo puedes ajustar nombre/descripcion y luego confirmar.\n\nSi quieres crear otra versión (una nueva “capa” de trabajo), vuelve a la pantalla anterior y presiona otra vez “Editar y Crear Versiones”, o duplica una versión desde el historial.',
                accionPrevia: async () => {
                    await accionesEdicionImagenes.asegurarEditorAbierto();
                    await accionesEdicionImagenes.abrirDialogoGuardar();
                },
            }
        ]
    }
];
