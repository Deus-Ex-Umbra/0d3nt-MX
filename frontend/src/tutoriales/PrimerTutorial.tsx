import { useEffect, useState, useCallback, useRef } from 'react';
import { driver, DriveStep } from 'driver.js';
import { useNavigate, useLocation } from 'react-router-dom';
import 'driver.js/dist/driver.css';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { tutorialesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const NOMBRE_TUTORIAL = 'primer-tutorial';

interface PasoTutorial {
    ruta: string;
    elementoId: string | null;
    titulo: string;
    descripcion: string;
}

export function PrimerTutorial() {
    const { usuario } = useAutenticacion();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [tutorialVerificado, setTutorialVerificado] = useState(false);
    const [debeMostrar, setDebeMostrar] = useState(false);
    const [pasoActual, setPasoActual] = useState(0);
    const [tutorialActivo, setTutorialActivo] = useState(false);
    const driverRef = useRef<ReturnType<typeof driver> | null>(null);
    const pasoActualRef = useRef(0);
    const avanzandoRef = useRef(false);

    useEffect(() => {
        pasoActualRef.current = pasoActual;
    }, [pasoActual]);
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
                    <p style="margin-top: 8px;"><strong>💡 Tip:</strong> Presiona sobre el título para acceder al tutorial específico de esta página.</p>
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
                    <p style="margin-top: 8px;"><strong>💡 Tip:</strong> Presiona sobre el título para acceder al tutorial específico de esta página.</p>
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
                    <p style="margin-top: 8px;">Aquí <strong>dibujarás y agregarás comentarios</strong> (anotaciones) sobre las imágenes para resaltar hallazgos o explicar procedimientos.</p>
                    <p style="margin-top: 8px;"><strong>💡 Tip:</strong> Presiona sobre el título para acceder al tutorial específico de esta página.</p>
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
                    <p style="margin-top: 8px;"><strong>💡 Tip:</strong> Presiona sobre el título para acceder al tutorial específico de esta página.</p>
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
                    <p style="margin-top: 8px;"><strong>💡 Tip:</strong> Presiona sobre el título para acceder al tutorial específico de esta página.</p>
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
                    <p style="margin-top: 8px;"><strong>💡 Tip:</strong> Presiona sobre el título para acceder al tutorial específico de esta página.</p>
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
                        <li>Presiona 3 veces los títulos para más tutoriales</li>
                    </ul>
                    <p style="margin-top: 12px;">¡Esperamos que disfrutes usando <strong>0d3ntApp</strong>! 🦷</p>
                </div>
            `,
        },
    ], [usuario?.nombre]);

    useEffect(() => {
        if (!usuario) return;

        const verificarTutorial = async () => {
            try {
                const completado = await tutorialesApi.estaCompletado(NOMBRE_TUTORIAL);
                setDebeMostrar(!completado);
            } catch (error) {
                console.error('Error al verificar tutorial:', error);
                setDebeMostrar(false);
            } finally {
                setTutorialVerificado(true);
            }
        };

        verificarTutorial();
    }, [usuario]);

    useEffect(() => {
        if (!tutorialVerificado || !debeMostrar || tutorialActivo) return;

        const timeout = setTimeout(() => {
            iniciarTutorial();
        }, 500);

        return () => clearTimeout(timeout);
    }, [tutorialVerificado, debeMostrar]);
    useEffect(() => {
        if (!tutorialActivo) return;

        const pasos = obtenerPasos();
        const pasoInfo = pasos[pasoActual];

        if (!pasoInfo) return;
        if (location.pathname !== pasoInfo.ruta) return;
        const timeout = setTimeout(() => {
            mostrarPasoActual();
        }, 400);

        return () => clearTimeout(timeout);
    }, [location.pathname, pasoActual, tutorialActivo]);

    const mostrarPasoActual = async () => {
        avanzandoRef.current = false;
        const pasos = obtenerPasos();
        const pasoInfo = pasos[pasoActual];
        if (!pasoInfo) return;
        if (pasoInfo.elementoId) {
            const elemento = document.getElementById(pasoInfo.elementoId);
            if (!elemento) {
                setTimeout(() => mostrarPasoActual(), 200);
                return;
            }
        }
        if (driverRef.current) {
            try {
                driverRef.current.destroy();
            } catch (e) {
            }
        }

        const esUltimoPaso = pasoActual >= pasos.length - 1;
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
                onNextClick: () => {
                    avanzarPaso();
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
            progressText: `${pasoActual + 1} de ${pasos.length}`,
            nextBtnText: esUltimoPaso ? '¡Entendido!' : 'Siguiente →',
            doneBtnText: '¡Entendido!',
            showButtons: ['next'],
            smoothScroll: false,
            steps: [step],
        });

        driverRef.current = driverObj;
        driverObj.drive();
    };

    const avanzarPaso = async () => {
        if (avanzandoRef.current) return;
        avanzandoRef.current = true;
        const pasos = obtenerPasos();
        const siguientePaso = pasoActualRef.current + 1;

        if (siguientePaso >= pasos.length) {
            await finalizarTutorial();
            return;
        }

        const siguienteInfo = pasos[siguientePaso];
        setPasoActual(siguientePaso);
        if (driverRef.current) {
            try {
                driverRef.current.destroy();
            } catch (e) {
            }
            driverRef.current = null;
        }
        if (siguienteInfo.ruta !== location.pathname) {
            navigate(siguienteInfo.ruta);
        } else {
            setTimeout(() => mostrarPasoActual(), 100);
        }
    };

    const finalizarTutorial = async () => {
        try {
            await tutorialesApi.marcarCompletado(NOMBRE_TUTORIAL);
        } catch (error) {
            console.error('Error al marcar tutorial como completado:', error);
        }

        if (driverRef.current) {
            try {
                driverRef.current.destroy();
            } catch (e) {
            }
            driverRef.current = null;
        }

        setTutorialActivo(false);
        setDebeMostrar(false);
        avanzandoRef.current = false;
        if (location.pathname !== '/inicio') {
            navigate('/inicio');
        }
    };

    const iniciarTutorial = () => {
        setTutorialActivo(true);
        setPasoActual(0);
        if (location.pathname !== '/inicio') {
            navigate('/inicio');
        } else {
            setTimeout(() => mostrarPasoActual(), 100);
        }
    };
    useEffect(() => {
        if (!tutorialActivo) return;

        const manejarClic = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const idsBloqueados = [
                'nombre-usuario-inicio',
                'titulo-pagina-pacientes',
                'titulo-pagina-agenda',
                'titulo-pagina-edicion-imagenes',
                'titulo-pagina-tratamientos',
                'titulo-pagina-finanzas',
                'titulo-pagina-inventarios',
                'titulo-pagina-configuracion'
            ];

            const elementoBloqueado = idsBloqueados.find(id =>
                target.id === id || target.closest(`#${id}`)
            );

            if (elementoBloqueado) {
                e.preventDefault();
                e.stopPropagation();
                toast({
                    title: "Tutorial en curso",
                    description: "Ahora no, continuamos con el tutorial.",
                    variant: "default",
                    duration: 2000,
                });
            }
        };
        window.addEventListener('click', manejarClic, { capture: true });
        window.addEventListener('mousedown', manejarClic, { capture: true });

        return () => {
            window.removeEventListener('click', manejarClic, { capture: true });
            window.removeEventListener('mousedown', manejarClic, { capture: true });
        };
    }, [tutorialActivo, toast]);
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
                text-shadow: none !important;
                -webkit-text-stroke: 0 !important;
                filter: none !important;
            }
            .driver-popover-description {
                color: hsl(var(--muted-foreground)) !important;
                text-shadow: none !important;
                -webkit-text-stroke: 0 !important;
                filter: none !important;
            }
            .driver-popover-progress-text {
                color: hsl(var(--muted-foreground)) !important;
                text-shadow: none !important;
                -webkit-text-stroke: 0 !important;
                filter: none !important;
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
            if (driverRef.current) {
                try {
                    driverRef.current.destroy();
                } catch (e) {
                }
            }
        };
    }, []);

    if (!tutorialActivo) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                pointerEvents: 'auto',
                background: 'transparent',
            }}
        />
    );
}
