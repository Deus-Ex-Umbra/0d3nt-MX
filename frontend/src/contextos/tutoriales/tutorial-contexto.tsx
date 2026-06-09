import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { driver, DriveStep } from 'driver.js';
import { useNavigate, useLocation } from 'react-router-dom';
import 'driver.js/dist/driver.css';
import './driver-overrides.css';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { tutorialesApi } from '@/lib/api';

const NOMBRE_TUTORIAL = 'primer-tutorial';
const STORAGE_KEY = 'tutorial-activo-estado';

interface PasoTutorial {
    ruta: string;
    elementoId: string | null;
    titulo: string;
    descripcion: string;
}

interface TutorialContextType {
    tutorialActivo: boolean;
    pasoActual: number;
    iniciarTutorial: () => void;
    finalizarTutorial: () => void;
}

interface EstadoTutorialStorage {
    activo: boolean;
    paso: number;
    timestamp: number;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial debe usarse dentro de ProveedorTutorial');
    }
    return context;
}

function guardarEstado(activo: boolean, paso: number) {
    const estado: EstadoTutorialStorage = {
        activo,
        paso,
        timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function obtenerEstado(): EstadoTutorialStorage | null {
    try {
        const data = sessionStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        const estado = JSON.parse(data) as EstadoTutorialStorage;
        if (Date.now() - estado.timestamp > 5 * 60 * 1000) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return estado;
    } catch {
        return null;
    }
}

function limpiarEstado() {
    sessionStorage.removeItem(STORAGE_KEY);
}

interface ProveedorTutorialProps {
    children: ReactNode;
}

export function ProveedorTutorial({ children }: ProveedorTutorialProps) {
    const { usuario } = useAutenticacion();
    const navigate = useNavigate();
    const location = useLocation();
    const [tutorialVerificado, setTutorialVerificado] = useState(false);
    const [debeMostrar, setDebeMostrar] = useState(false);
    const [pasoActual, setPasoActual] = useState(0);
    const [tutorialActivo, setTutorialActivo] = useState(false);
    const [inicializado, setInicializado] = useState(false);
    const driverRef = useRef<ReturnType<typeof driver> | null>(null);
    const usuarioIdAnteriorRef = useRef<number | null>(null);
    const pasoActualRef = useRef(pasoActual);
    const tutorialActivoRef = useRef(tutorialActivo);
    const locationRef = useRef(location.pathname);
    useEffect(() => {
        pasoActualRef.current = pasoActual;
    }, [pasoActual]);

    useEffect(() => {
        tutorialActivoRef.current = tutorialActivo;
    }, [tutorialActivo]);

    useEffect(() => {
        locationRef.current = location.pathname;
    }, [location.pathname]);
    useEffect(() => {
        const usuarioIdActual = usuario?.id ?? null;
        if (usuarioIdAnteriorRef.current !== null && usuarioIdAnteriorRef.current !== usuarioIdActual) {
            console.log('[Tutorial] Usuario cambió de', usuarioIdAnteriorRef.current, 'a', usuarioIdActual, '- reseteando estado');
            if (driverRef.current) {
                try {
                    driverRef.current.destroy();
                } catch (e) {
                }
                driverRef.current = null;
            }
            setTutorialActivo(false);
            tutorialActivoRef.current = false;
            setPasoActual(0);
            pasoActualRef.current = 0;
            setDebeMostrar(false);
            setTutorialVerificado(false);
            limpiarEstado();
        }

        usuarioIdAnteriorRef.current = usuarioIdActual;
    }, [usuario?.id]);
    const obtenerPasos = useCallback((): PasoTutorial[] => [
        {
            ruta: '/inicio',
            elementoId: null,
            titulo: '🦷 ¡Bienvenido a 0d3ntApp!',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>¡Hola <strong>${usuario?.nombre || 'Doctor/a'}</strong>!</p>
                    <p style="margin-top: 8px;">Gracias por elegir <strong>0d3ntApp</strong> para la gestión de tu consultorio dental.</p>
                    <p style="margin-top: 8px;">Este breve tutorial te guiará por las principales funciones de la aplicación.</p>
                </div>
            `,
        },
        {
            ruta: '/inicio',
            elementoId: null,
            titulo: '🖱️ Consejo: deja que el tutorial lo haga',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>En los <strong>tutoriales</strong>, la guía <strong>navega</strong> por las pantallas y <strong>presiona los botones por ti</strong> cuando es necesario.</p>
                    <p style="margin-top: 8px;">Por eso, <strong>no necesitas</strong> hacer clic en los elementos que se resaltan: solo usa el botón <strong>"Siguiente"</strong> del tutorial para continuar.</p>
                    <p style="margin-top: 8px; font-size: 0.9em; opacity: 0.85;">Así la explicación se reproduce en el orden correcto y sin interrupciones.</p>
                </div>
            `,
        },
        {
            ruta: '/inicio',
            elementoId: 'nombre-usuario-inicio',
            titulo: '👤 Tu Nombre',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Este es tu nombre de usuario en la pantalla de inicio.</p>
                    <p style="margin-top: 8px;"><strong>💡 Tip:</strong> En <strong>cada página</strong>, el <strong>título</strong> tiene accesos a los tutoriales de esa sección.</p>
                    <p style="margin-top: 8px;">Los tutoriales adicionales <strong>se activan</strong> tocando <strong>3 veces</strong> el título de la página (y en Inicio, tocando <strong>3 veces</strong> tu nombre).</p>
                </div>
            `,
        },
        {
            ruta: '/pacientes',
            elementoId: 'titulo-pagina-pacientes',
            titulo: '👥 Página de Pacientes',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Bienvenido a la gestión de <strong>pacientes</strong>.</p>
                    <p style="margin-top: 8px;">Aquí puedes registrar nuevos pacientes, ver historiales clínicos, gestionar odontogramas y archivos.</p>
                </div>
            `,
        },
        {
            ruta: '/agenda',
            elementoId: 'titulo-pagina-agenda',
            titulo: '📅 Página de Agenda',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Organiza tus <strong>citas</strong> y horarios.</p>
                    <p style="margin-top: 8px;">Programa, edita y gestiona las citas de tus pacientes con un calendario intuitivo.</p>
                </div>
            `,
        },
        {
            ruta: '/edicion-imagenes',
            elementoId: 'titulo-pagina-edicion-imagenes',
            titulo: '🖼️ Visor de Estudios',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Visualiza y edita <strong>radiografías</strong> e imágenes clínicas.</p>
                    <p style="margin-top: 8px;">Agrega anotaciones, mediciones y comentarios a los estudios de tus pacientes.</p>
                </div>
            `,
        },
        {
            ruta: '/tratamientos',
            elementoId: 'titulo-pagina-tratamientos',
            titulo: '📋 Página de Tratamientos',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Crea y administra <strong>plantillas de tratamiento</strong>.</p>
                    <p style="margin-top: 8px;">Asigna planes de tratamiento a tus pacientes con costos, materiales y citas asociadas.</p>
                </div>
            `,
        },
        {
            ruta: '/finanzas',
            elementoId: 'titulo-pagina-finanzas',
            titulo: '💰 Página de Finanzas',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Controla tus <strong>ingresos y egresos</strong>.</p>
                    <p style="margin-top: 8px;">Visualiza reportes financieros, gráficos y analiza tus ganancias.</p>
                </div>
            `,
        },
        {
            ruta: '/inventarios',
            elementoId: 'titulo-pagina-inventarios',
            titulo: '📦 Página de Inventarios',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Administra tus <strong>materiales y activos fijos</strong>.</p>
                    <p style="margin-top: 8px;">Controla stock, registra compras, gestiona lotes y vencimientos.</p>
                </div>
            `,
        },
        {
            ruta: '/configuracion',
            elementoId: 'titulo-pagina-configuracion',
            titulo: '⚙️ Página de Configuración',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Personaliza tu <strong>perfil y preferencias</strong>.</p>
                    <p style="margin-top: 8px;">Aquí encontrarás opciones para cambiar tema, gestionar catálogos, y configurar tu clínica.</p>
                    <p style="margin-top: 8px;"><strong>💡 Tip:</strong> Presiona sobre el título para acceder al tutorial específico de esta página.</p>
                </div>
            `,
        },
        {
            ruta: '/configuracion',
            elementoId: 'contenedor-seccion-moneda',
            titulo: '💵 Configuración de Moneda',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Aquí debes configurar tu <strong>Moneda Local</strong>.</p>
                    <p style="margin-top: 8px;"><strong>⚠️ ¡Muy Importante!</strong> Esta es una configuración de <strong>única vez</strong> que no podrás cambiar después.</p>
                    <p style="margin-top: 8px;">La moneda que selecciones será la base para:</p>
                    <ul style="margin-top: 6px; padding-left: 20px; font-size: 0.9em;">
                        <li>Cálculo de precios en tratamientos</li>
                        <li>Reportes financieros</li>
                        <li>Costos de inventario</li>
                    </ul>
                    <p style="margin-top: 8px; font-size: 0.9em; opacity: 0.8;">Selecciona tu país o moneda en la lista y presiona "Guardar Moneda".</p>
                </div>
            `,
        },
        {
            ruta: '/inicio',
            elementoId: null,
            titulo: '🎉 ¡Listo para comenzar!',
            descripcion: `
                <div style="line-height: 1.6;">
                    <p>Ya conoces las funciones principales de <strong>0d3ntApp</strong>.</p>
                    <p style="margin-top: 8px;">Recuerda:</p>
                    <ul style="margin-top: 8px; padding-left: 20px;">
                        <li>Configura tu <strong>moneda</strong> en Configuración</li>
                        <li>Los tutoriales adicionales se activan tocando 3 veces los títulos</li>
                    </ul>
                    <p style="margin-top: 12px;">¡Esperamos que disfrutes usando <strong>0d3ntApp</strong>! 🦷</p>
                </div>
            `,
        },
    ], [usuario?.nombre]);

    useEffect(() => {
        const estadoGuardado = obtenerEstado();
        if (estadoGuardado && estadoGuardado.activo) {
            console.log('[Tutorial] Restaurando estado guardado:', estadoGuardado);
            setTutorialActivo(true);
            setPasoActual(estadoGuardado.paso);
            pasoActualRef.current = estadoGuardado.paso;
            tutorialActivoRef.current = true;
        }
        setInicializado(true);
    }, []);

    useEffect(() => {
        if (!usuario || !inicializado) {
            console.log('[Tutorial] Verificación pendiente:', { usuario: !!usuario, inicializado });
            return;
        }

        const verificarTutorial = async () => {
            console.log('[Tutorial] Verificando si tutorial está completado...');
            try {
                const completado = await tutorialesApi.estaCompletado(NOMBRE_TUTORIAL);
                console.log('[Tutorial] Respuesta del backend - completado:', completado);
                const estadoGuardado = obtenerEstado();
                console.log('[Tutorial] Estado guardado:', estadoGuardado);
                if (estadoGuardado?.activo) {
                    console.log('[Tutorial] Hay estado guardado activo, debeMostrar = true');
                    setDebeMostrar(true);
                } else {
                    console.log('[Tutorial] No hay estado guardado, debeMostrar =', !completado);
                    setDebeMostrar(!completado);
                }
            } catch (error) {
                console.error('[Tutorial] Error al verificar tutorial:', error);
                setDebeMostrar(false);
            } finally {
                console.log('[Tutorial] Verificación completada');
                setTutorialVerificado(true);
            }
        };

        verificarTutorial();
    }, [usuario, inicializado]);

    useEffect(() => {
        console.log('[Tutorial] Efecto inicio automático:', {
            tutorialVerificado,
            debeMostrar,
            inicializado,
            pathname: location.pathname,
            tutorialActivo,
        });

        if (!tutorialVerificado || !debeMostrar || !inicializado) {
            console.log('[Tutorial] Condiciones no cumplidas para iniciar');
            return;
        }
        if (location.pathname !== '/inicio') {
            console.log('[Tutorial] No estamos en /inicio, no iniciamos');
            return;
        }

        const estadoGuardado = obtenerEstado();
        if (estadoGuardado?.activo && tutorialActivo) {
            console.log('[Tutorial] Tutorial activo restaurado, mostrando paso:', estadoGuardado.paso);
            setTimeout(() => {
                mostrarPasoEnPantalla(estadoGuardado.paso);
            }, 500);
            return;
        }

        if (!tutorialActivo) {
            console.log('[Tutorial] Programando inicio automático en 800ms...');
            const timeout = setTimeout(() => {
                console.log('[Tutorial] Iniciando tutorial automáticamente');
                iniciarTutorialInterno();
            }, 800);
            return () => clearTimeout(timeout);
        }
    }, [tutorialVerificado, debeMostrar, inicializado, location.pathname]);

    useEffect(() => {
        if (!tutorialActivo || !inicializado) return;

        const pasos = obtenerPasos();
        const pasoInfo = pasos[pasoActual];

        if (!pasoInfo) return;

        console.log(`[Tutorial] Cambio de ruta detectado: ${location.pathname}, esperando: ${pasoInfo.ruta}`);

        if (location.pathname === pasoInfo.ruta) {
            console.log('[Tutorial] Ruta correcta, mostrando paso:', pasoActual);
            setTimeout(() => {
                mostrarPasoEnPantalla(pasoActual);
            }, 600);
        }
    }, [location.pathname, tutorialActivo, inicializado]);

    const destruirDriverActual = useCallback(() => {
        if (driverRef.current) {
            try {
                driverRef.current.destroy();
            } catch (e) {
            }
            driverRef.current = null;
        }
    }, []);

    const finalizarTutorialInterno = useCallback(async () => {
        console.log('[Tutorial] Finalizando tutorial');
        try {
            await tutorialesApi.marcarCompletado(NOMBRE_TUTORIAL);
        } catch (error) {
            console.error('Error al marcar tutorial como completado:', error);
        }

        destruirDriverActual();
        setTutorialActivo(false);
        tutorialActivoRef.current = false;
        setDebeMostrar(false);
        limpiarEstado();

        if (locationRef.current !== '/inicio') {
            navigate('/inicio');
        }
    }, [destruirDriverActual, navigate]);

    const mostrarPasoEnPantalla = useCallback(async (numeroPaso: number) => {
        const pasos = obtenerPasos();
        const pasoInfo = pasos[numeroPaso];

        if (!pasoInfo) {
            console.log('[Tutorial] No hay info para paso:', numeroPaso);
            return;
        }

        console.log(`[Tutorial] Mostrando paso ${numeroPaso} en ruta ${locationRef.current}`);

        if (locationRef.current !== pasoInfo.ruta) {
            console.log(`[Tutorial] Ruta incorrecta. Actual: ${locationRef.current}, esperada: ${pasoInfo.ruta}`);
            return;
        }

        if (pasoInfo.elementoId) {
            const elemento = document.getElementById(pasoInfo.elementoId);
            if (!elemento) {
                console.log(`[Tutorial] Elemento ${pasoInfo.elementoId} no encontrado, reintentando...`);
                setTimeout(() => mostrarPasoEnPantalla(numeroPaso), 300);
                return;
            }
        }

        destruirDriverActual();

        const esUltimoPaso = numeroPaso >= pasos.length - 1;
        const esPasoMoneda = pasoInfo.elementoId === 'contenedor-seccion-moneda';
        if (esPasoMoneda && pasoInfo.elementoId) {
            const elementoMoneda = document.getElementById(pasoInfo.elementoId);
            if (elementoMoneda) {
                elementoMoneda.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 400));
            }
        }

        const step: DriveStep = {
            popover: {
                title: pasoInfo.titulo,
                description: pasoInfo.descripcion,
                side: pasoInfo.elementoId ? 'bottom' : undefined,
                align: pasoInfo.elementoId ? 'start' : undefined,
                onPopoverRender: (popover) => {
                    if (numeroPaso !== 1) return;

                    const existente = popover.footerButtons.querySelector('.tutorial-omitir-btn');
                    if (existente) {
                        existente.remove();
                    }

                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'tutorial-omitir-btn';
                    btn.textContent = 'Omitir tutorial';

                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        finalizarTutorialInterno();
                    });
                    popover.footerButtons.insertBefore(btn, popover.nextButton);
                },
                onNextClick: () => {
                    const pasoActualReal = pasoActualRef.current;
                    const siguientePaso = pasoActualReal + 1;

                    console.log(`[Tutorial] Next: paso ${pasoActualReal} -> ${siguientePaso}`);

                    destruirDriverActual();

                    if (siguientePaso >= pasos.length) {
                        finalizarTutorialInterno();
                        return;
                    }

                    const siguienteInfo = pasos[siguientePaso];
                    setPasoActual(siguientePaso);
                    pasoActualRef.current = siguientePaso;
                    guardarEstado(true, siguientePaso);

                    if (siguienteInfo.ruta !== locationRef.current) {
                        console.log(`[Tutorial] Navegando de ${locationRef.current} a ${siguienteInfo.ruta}`);
                        navigate(siguienteInfo.ruta);
                    } else {
                        setTimeout(() => mostrarPasoEnPantalla(siguientePaso), 200);
                    }
                },
            },
        };
        if (pasoInfo.elementoId) {
            step.element = `#${pasoInfo.elementoId}`;
        }

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: false,
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            stagePadding: 10,
            stageRadius: 8,
            popoverClass: 'tutorial-popover',
            progressText: `${numeroPaso + 1} de ${pasos.length}`,
            nextBtnText: esUltimoPaso ? '¡Entendido!' : 'Siguiente →',
            doneBtnText: '¡Entendido!',
            showButtons: ['next'],
            smoothScroll: false,
            steps: [step],
        });

        driverRef.current = driverObj;
        driverObj.drive();
    }, [obtenerPasos, destruirDriverActual, navigate, finalizarTutorialInterno]);

    const iniciarTutorialInterno = useCallback(() => {
        console.log('[Tutorial] Iniciando tutorial interno');
        setTutorialActivo(true);
        tutorialActivoRef.current = true;
        setPasoActual(0);
        pasoActualRef.current = 0;
        guardarEstado(true, 0);

        if (location.pathname !== '/inicio') {
            navigate('/inicio');
        } else {
            setTimeout(() => mostrarPasoEnPantalla(0), 200);
        }
    }, [location.pathname, navigate, mostrarPasoEnPantalla]);

    const iniciarTutorial = useCallback(() => {
        setDebeMostrar(true);
        iniciarTutorialInterno();
    }, [iniciarTutorialInterno]);

    const finalizarTutorial = useCallback(() => {
        finalizarTutorialInterno();
    }, [finalizarTutorialInterno]);
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
            .driver-popover {
                background: hsl(var(--card)) !important;
                color: hsl(var(--foreground)) !important;
                border: 2px solid hsl(var(--border)) !important;
                border-radius: 12px !important;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
                max-width: 400px !important;
            }
            .driver-popover-title {
                font-size: 1.25rem !important;
                font-weight: 700 !important;
                color: hsl(var(--foreground)) !important;
            }
            .driver-popover-description {
                color: hsl(var(--muted-foreground)) !important;
            }
            .driver-popover-progress-text {
                color: hsl(var(--muted-foreground)) !important;
            }
            .driver-popover-navigation-btns {
                gap: 8px !important;
            }
            .driver-popover-prev-btn,
            .driver-popover-next-btn {
                background: hsl(var(--primary)) !important;
                color: hsl(var(--primary-foreground)) !important;
                border: none !important;
                border-radius: 6px !important;
                padding: 8px 16px !important;
                font-weight: 600 !important;
                text-shadow: none !important;
                -webkit-text-stroke: 0 !important;
                filter: none !important;
                transition: all 0.2s !important;
            }
            .driver-popover-prev-btn:hover,
            .driver-popover-next-btn:hover {
                opacity: 0.9 !important;
                transform: scale(1.02) !important;
            }
            .driver-popover-close-btn {
                color: hsl(var(--muted-foreground)) !important;
                text-shadow: none !important;
                -webkit-text-stroke: 0 !important;
                filter: none !important;
            }
            .driver-popover-close-btn:hover {
                color: hsl(var(--foreground)) !important;
            }
            .driver-popover-arrow-side-left,
            .driver-popover-arrow-side-right,
            .driver-popover-arrow-side-top,
            .driver-popover-arrow-side-bottom {
                border-color: hsl(var(--card)) !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            const existingStyle = document.getElementById('tutorial-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);
    useEffect(() => {
        return () => {
            destruirDriverActual();
        };
    }, [destruirDriverActual]);

    const value: TutorialContextType = {
        tutorialActivo,
        pasoActual,
        iniciarTutorial,
        finalizarTutorial,
    };

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
}

