import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { driver, DriveStep } from 'driver.js';
import type { AllowedButtons } from 'driver.js';
import { useNavigate, useLocation } from 'react-router-dom';
import 'driver.js/dist/driver.css';
import './driver-overrides.css';
import { tutorialesApi } from '@/lib/api';
import {
    TutorialDefinicion,
    ProgresoPagina,
    TutorialEstado,
    convertirProgresoPagina,
    ProgresoPaginaResponse,
} from './tipos-tutoriales';

const CONDICIONES_BLOQUEO_VACIAS: Record<string, { bloqueado: boolean; mensaje?: string }> = {};

const limpiarAccionesPendientes = (): void => {
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    let timeoutHandle: number | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutHandle = window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutHandle !== undefined) {
            window.clearTimeout(timeoutHandle);
        }
    }
};

const construirProgresoLocal = (
    pagina: string,
    definicionesTutoriales: TutorialDefinicion[],
    condicionesBloqueo: Record<string, { bloqueado: boolean; mensaje?: string }>,
): ProgresoPaginaResponse => {
    const tutoriales = definicionesTutoriales.map(t => {
        const bloqueo = condicionesBloqueo[t.nombre];
        return {
            nombre: t.nombre,
            titulo: t.titulo,
            completado: false,
            bloqueado: bloqueo?.bloqueado ?? false,
            condicion_bloqueo: bloqueo?.mensaje,
        };
    });

    const total = tutoriales.length;
    const completados = tutoriales.filter(t => t.completado).length;
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

    return {
        pagina,
        total_tutoriales: total,
        tutoriales_completados: completados,
        porcentaje_completado: porcentaje,
        tutoriales,
    };
};

interface TutorialesPaginaContextType {
    progreso: ProgresoPagina | null;
    cargando: boolean;
    tutorialActivo: string | null;
    definiciones: TutorialDefinicion[];
    modalAbierto: boolean;
    abrirModal: () => void;
    cerrarModal: () => void;
    iniciarTutorial: (nombre: string) => void;
    finalizarTutorial: () => void;
    recargarProgreso: () => Promise<void>;
    obtenerTutorialEstado: (nombre: string) => TutorialEstado | undefined;
}

const TutorialesPaginaContext = createContext<TutorialesPaginaContextType | null>(null);

interface ProveedorTutorialesPaginaProps {
    children: ReactNode;
    pagina: string;
    definicionesTutoriales: TutorialDefinicion[];
    condicionesBloqueo?: Record<string, { bloqueado: boolean; mensaje?: string }>;
}

export function ProveedorTutorialesPagina({
    children,
    pagina,
    definicionesTutoriales,
    condicionesBloqueo,
}: ProveedorTutorialesPaginaProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const condicionesBloqueoEfectivas = condicionesBloqueo ?? CONDICIONES_BLOQUEO_VACIAS;
    const [progreso, setProgreso] = useState<ProgresoPagina | null>(null);
    const [cargando, setCargando] = useState(true);
    const [tutorialActivo, setTutorialActivo] = useState<string | null>(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const cargarProgreso = useCallback(async () => {
        try {
            setCargando(true);

            const response = await withTimeout(
                tutorialesApi.obtenerProgresoPagina({
                    pagina,
                    tutoriales: definicionesTutoriales.map(t => ({ nombre: t.nombre, titulo: t.titulo })),
                    condiciones_bloqueo: condicionesBloqueoEfectivas,
                }),
                6000,
                'Timeout al cargar progreso de tutoriales',
            ).catch((error) => {
                console.warn('[Tutorial] Usando progreso local por error/timeout:', error);
                return construirProgresoLocal(pagina, definicionesTutoriales, condicionesBloqueoEfectivas);
            });

            setProgreso(convertirProgresoPagina(response));
        } catch (error) {
            console.error('Error al cargar progreso de tutoriales:', error);
            setProgreso(convertirProgresoPagina(construirProgresoLocal(pagina, definicionesTutoriales, condicionesBloqueoEfectivas)));
        } finally {
            setCargando(false);
        }
    }, [pagina, definicionesTutoriales, condicionesBloqueoEfectivas]);

    useEffect(() => {
        cargarProgreso();
    }, [cargarProgreso]);
    const abrirModal = useCallback(() => {
        setModalAbierto(true);
    }, []);

    const cerrarModal = useCallback(() => {
        setModalAbierto(false);
    }, []);
    const obtenerTutorialEstado = useCallback((nombre: string): TutorialEstado | undefined => {
        return progreso?.tutoriales.find(t => t.nombre === nombre);
    }, [progreso]);
    const iniciarTutorial = useCallback((nombre: string) => {
        const definicion = definicionesTutoriales.find(t => t.nombre === nombre);
        if (!definicion) {
            console.error(`Tutorial "${nombre}" no encontrado`);
            return;
        }

        const estado = obtenerTutorialEstado(nombre);
        if (estado?.bloqueado) {
            console.warn(`Tutorial "${nombre}" está bloqueado: ${estado.condicionBloqueo}`);
            return;
        }
        setModalAbierto(false);
        setTutorialActivo(nombre);
        const pasos: DriveStep[] = definicion.pasos.map((paso, index) => {
            const mostrarAnterior = index > 0 && !paso.bloquearAtras;
            const showButtons: AllowedButtons[] = mostrarAnterior ? ['next', 'previous'] : ['next'];

            return {
            element: paso.elementoId ? `#${paso.elementoId}` : undefined,
            popover: {
                title: paso.titulo,
                description: paso.descripcion,
                side: 'bottom' as const,
                align: 'center' as const,
                showButtons,
            },
            onHighlightStarted: paso.accionPrevia ? async () => {
                await paso.accionPrevia?.();
            } : undefined,
            onDeselected: paso.accionPosterior ? async () => {
                await paso.accionPosterior?.();
            } : undefined,
            };
        });

        setTimeout(() => {
            const bloquearClickOverlay = (event: Event) => {
                const target = event.target as HTMLElement | null;
                if (!target) return;

                if (target.closest('.driver-overlay')) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            };

            const driverInstance = driver({
                showProgress: true,
                animate: true,
                allowClose: false,
                allowKeyboardControl: false,
                overlayColor: 'rgba(0, 0, 0, 0.75)',
                stagePadding: 10,
                stageRadius: 8,
                popoverClass: 'tutorial-popover',
                nextBtnText: 'Siguiente →',
                prevBtnText: '← Anterior',
                doneBtnText: '¡Entendido!',
                progressText: '{{current}} de {{total}}',
                smoothScroll: false,
                steps: pasos,
                onDestroyStarted: async () => {
                    document.removeEventListener('click', bloquearClickOverlay, true);
                    document.removeEventListener('mousedown', bloquearClickOverlay, true);

                    limpiarAccionesPendientes();
                    try {
                        await tutorialesApi.marcarCompletado(nombre);
                        await cargarProgreso();
                    } catch (error) {
                        console.error('Error al marcar tutorial como completado:', error);
                    }
                    setTutorialActivo(null);
                    try {
                        (window as any).__tutorialDriverInstance = null;
                        (window as any).__tutorialLastStepIndex = null;
                        (window as any).__tutorialNombreActivo = null;
                    } catch {
                    }
                    driverInstance.destroy();
                },
            });

            try {
                (window as any).__tutorialDriverInstance = driverInstance;
                (window as any).__tutorialLastStepIndex = definicion.pasos.length - 1;
                (window as any).__tutorialNombreActivo = nombre;
            } catch {
            }

            const primerPaso = definicion.pasos[0];
            if (primerPaso.ruta && primerPaso.ruta !== location.pathname) {
                navigate(primerPaso.ruta);
                setTimeout(() => {
                    document.addEventListener('click', bloquearClickOverlay, true);
                    document.addEventListener('mousedown', bloquearClickOverlay, true);
                    driverInstance.drive();
                }, 500);
            } else {
                document.addEventListener('click', bloquearClickOverlay, true);
                document.addEventListener('mousedown', bloquearClickOverlay, true);
                driverInstance.drive();
            }
        }, 300);
    }, [definicionesTutoriales, obtenerTutorialEstado, cargarProgreso, navigate, location.pathname]);

    const finalizarTutorial = useCallback(() => {
        setTutorialActivo(null);
    }, []);

    const recargarProgreso = useCallback(async () => {
        await cargarProgreso();
    }, [cargarProgreso]);

    return (
        <TutorialesPaginaContext.Provider
            value={{
                progreso,
                cargando,
                tutorialActivo,
                definiciones: definicionesTutoriales,
                modalAbierto,
                abrirModal,
                cerrarModal,
                iniciarTutorial,
                finalizarTutorial,
                recargarProgreso,
                obtenerTutorialEstado,
            }}
        >
            {children}
        </TutorialesPaginaContext.Provider>
    );
}

export function useTutorialesPagina() {
    const context = useContext(TutorialesPaginaContext);
    if (!context) {
        throw new Error('useTutorialesPagina debe usarse dentro de ProveedorTutorialesPagina');
    }
    return context;
}

export function useTutorialesPaginaOpcional() {
    return useContext(TutorialesPaginaContext);
}
