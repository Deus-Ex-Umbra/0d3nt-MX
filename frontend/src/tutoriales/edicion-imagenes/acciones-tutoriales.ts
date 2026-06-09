
import { IDS_ELEMENTOS_EDICION_IMAGENES } from './constantes';

export const esperarElemento = (selector: string | (() => string), timeout = 5000): Promise<HTMLElement> => {
    return new Promise((resolve, reject) => {
        const sel = typeof selector === 'function' ? selector() : selector;
        const elemento = document.getElementById(sel) || document.querySelector(`#${sel}`) as HTMLElement;
        if (elemento) {
            resolve(elemento);
            return;
        }

        const observer = new MutationObserver(() => {
            const el = document.getElementById(sel) || document.querySelector(`#${sel}`) as HTMLElement;
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
            reject(new Error(`Elemento ${sel} no encontrado tras ${timeout}ms`));
        }, timeout);
    });
};

export const clickElemento = async (id: string | (() => string)) => {
    try {
        const el = await esperarElemento(id);
        el.click();
    } catch (e) {
        console.warn(`No se pudo hacer click en ${id}`, e);
    }
};

export const accionesEdicionImagenes = {
    asegurarVistaSeleccionPaciente: async () => {
        const btnCambiarPaciente = document.getElementById('btn-cambiar-paciente') as HTMLElement | null;
        if (btnCambiarPaciente) {
            btnCambiarPaciente.click();
            await new Promise(resolve => setTimeout(resolve, 600));
        }
    },

    seleccionarPrimerPaciente: async () => {
        const botonesVer = document.querySelectorAll('[id^="btn-ver-imagenes-paciente-"]');
        if (botonesVer.length > 0) {
            (botonesVer[0] as HTMLElement).click();
            await new Promise(resolve => setTimeout(resolve, 900));
        }
    },

    asegurarEditorAbierto: async () => {
        const editorDialog = document.getElementById(IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_DIALOG);
        if (editorDialog) return;
        const botonesEditar = document.querySelectorAll('[id^="btn-editar-imagen-"]');
        if (botonesEditar.length > 0) {
            (botonesEditar[0] as HTMLElement).click();
        } else {
            const listaPacientes = document.getElementById(IDS_ELEMENTOS_EDICION_IMAGENES.LISTA_PACIENTES);
            if (listaPacientes) {
                const primerBotonVer = listaPacientes.querySelector('[id^="btn-ver-imagenes-paciente-"]') as HTMLElement;
                if (primerBotonVer) {
                    primerBotonVer.click();
                    setTimeout(() => {
                        const botones = document.querySelectorAll('[id^="btn-editar-imagen-"]');
                        if (botones.length > 0) (botones[0] as HTMLElement).click();
                    }, 1000);
                }
            }
        }
        try {
            await esperarElemento(IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_DIALOG);
        } catch (e) {
            console.warn('El editor no se abrió a tiempo');
        }
    },

    cambiarTabHerramientas: async () => {
        await clickElemento(IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_TAB_HERRAMIENTAS);
    },

    cambiarTabComentarios: async () => {
        await clickElemento(IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_TAB_COMENTARIOS);
    },

    abrirDialogoGuardar: async () => {
        await clickElemento(IDS_ELEMENTOS_EDICION_IMAGENES.EDITOR_BTN_ABRIR_GUARDAR);
    },
};
