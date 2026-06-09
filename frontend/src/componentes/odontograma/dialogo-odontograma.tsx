import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { Switch } from '@/componentes/ui/switch';
import { Label } from '@/componentes/ui/label';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/componentes/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/componentes/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/componentes/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { HexColorPicker } from 'react-colorful';
import { Loader2, X, Download, Plus, Minus, RotateCcw, Check, Trash2, Hand, Eye, Edit3, Copy, FilePlus, Pencil, Eraser, Move, Save, Palette, Grid, Highlighter, Undo, Redo, CircleDashed, Maximize2, Minimize2 } from 'lucide-react'; 
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/componentes/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/componentes/ui/alert-dialog";
import { Badge } from '@/componentes/ui/badge';
import { odontogramaApi, archivosApi } from '@/lib/api';
import { OdontogramaChart, SimbologiaAnadida, generateInitialConfig, generateArchConfig } from './odontograma-chart';
import { SelectorSimbologia } from './selector-simbologia';
import { EditorSimbolo } from './editor-simbolo';
import { ImagenSimboloTintada } from './imagen-simbolo-tintada';
import { obtenerInfoDiente, obtenerNombreCara } from '@/lib/terminologia-dental';
import {
    SimboloOdontograma,
    Odontograma,
    PiezaAfectada
} from '@/tipos';

interface DialogoOdontogramaProps {
    abierto: boolean;
    onCerrar: () => void;
    pacienteId: number;
    pacienteNombre: string;
}

export function DialogoOdontograma({
    abierto,
    onCerrar,
    pacienteId,
    pacienteNombre,
}: DialogoOdontogramaProps) {
    const [_odontograma, setOdontograma] = useState<Odontograma | null>(null);
    const [simbolos, setSimbolos] = useState<SimboloOdontograma[]>([]);
    const [cargando, setCargando] = useState(true);
    const [exportando, setExportando] = useState(false);
    const [modoEditor, setModoEditor] = useState(false);
    const [simbologiasAnadidas, setSimbologiasAnadidas] = useState<SimbologiaAnadida[]>([]);
    const [simbologiaActiva, setSimbologiaActiva] = useState<string | null>(null);
    const [modoAsignacion, setModoAsignacion] = useState(false);
    const [piezasSeleccionadas, setPiezasSeleccionadas] = useState<PiezaAfectada[]>([]);
    const [simbologiaHover, setSimbologiaHover] = useState<string | null>(null);
    const [modoDibujo, setModoDibujo] = useState(false);
    const [herramientaDibujo, setHerramientaDibujo] = useState<'pencil' | 'eraser'>('pencil');
    const [dibujos, setDibujos] = useState<any[]>([]); 
    const [configuracionDientes, setConfiguracionDientes] = useState<any>({});
    const [mostrarGrid, setMostrarGrid] = useState(false);
    const [mostrarAsignaciones, setMostrarAsignaciones] = useState(true);
    const [modoEdicionPosicion, setModoEdicionPosicion] = useState(false);
    const [guardandoVisual, setGuardandoVisual] = useState(false);
    const [colorDibujo, setColorDibujo] = useState('#df4b26');
    const [grosorDibujo, setGrosorDibujo] = useState(5);
    const [selectorAbierto, setSelectorAbierto] = useState(false);
    const [editorAbierto, setEditorAbierto] = useState(false);
    const [dialogoNuevaVersionAbierto, setDialogoNuevaVersionAbierto] = useState(false);
    const [opcionesNuevaVersion, setOpcionesNuevaVersion] = useState<{ clonar: boolean; tipo: 'adulto' | 'nino' }>({
        clonar: true,
        tipo: 'adulto',
    });
    const [versiones, setVersiones] = useState<Odontograma[]>([]);
    const [detallesVersion, setDetallesVersion] = useState('');
    const [tieneCambios, setTieneCambios] = useState(false);
    const [dialogoCambiosSinGuardarAbierto, setDialogoCambiosSinGuardarAbierto] = useState(false);
    const [accionPendiente, setAccionPendiente] = useState<'cerrar' | 'vista' | null>(null);

    const [escala, setEscala] = useState(0.6);
    const [mostrarNumeros, setMostrarNumeros] = useState(true);

    const chartRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contadorId = useRef(0);

    const [dienteHoverInfo, setDienteHoverInfo] = useState<{ numero: number; nombre: string } | null>(null);
    const [layoutMode, setLayoutMode] = useState<'linear' | 'arch' | 'custom'>('linear');
    const [linearRowGap, setLinearRowGap] = useState(60);
    const [historialConfig, setHistorialConfig] = useState<any[]>([]);
    const [futuroConfig, setFuturoConfig] = useState<any[]>([]);
    const guardarEnHistorial = useCallback(() => {
        setHistorialConfig(prev => {
            const nuevo = [...prev, configuracionDientes].slice(-20);
            return nuevo;
        });
        setFuturoConfig([]);
    }, [configuracionDientes]);

    const obtenerColorAplicacion = useCallback((simb: SimbologiaAnadida | null | undefined): string => {
        if (!simb) return '#0000FF';
        const t: any = simb.transformacion as any;
        if (t?.color) return t.color;
        const categoria = simb.categoria || 'TRATAMIENTO_PATOLOGIA';
        if (categoria === 'CONDICION_HALLAZGO') {
            return simb.color_principal || '#0000FF';
        }
        const estado = simb.estado || t?.estado;
        if (estado === 'REALIZADO') return simb.color_principal || '#0000FF';
        return (simb.color_secundario || simb.color_principal || '#0000FF');
    }, []);

    const obtenerHoverColorAplicacion = useCallback((simb: SimbologiaAnadida | null | undefined): string => {
        if (!simb) return '#0000FF';
        return simb.color_hover || '#0000FF';
    }, []);

    const deshacerConfig = () => {
        if (historialConfig.length === 0) return;
        
        const anterior = historialConfig[historialConfig.length - 1];
        const nuevoHistorial = historialConfig.slice(0, -1);
        
        setFuturoConfig(prev => [configuracionDientes, ...prev]);
        setHistorialConfig(nuevoHistorial);
        setConfiguracionDientes(anterior);
        setTieneCambios(true);
    };

    const rehacerConfig = () => {
        if (futuroConfig.length === 0) return;

        const siguiente = futuroConfig[0];
        const nuevoFuturo = futuroConfig.slice(1);

        setHistorialConfig(prev => [...prev, configuracionDientes]);
        setFuturoConfig(nuevoFuturo);
        setConfiguracionDientes(siguiente);
        setTieneCambios(true);
    };

    const handlePiezaHover = (numero: number | null) => {
        if (numero) {
            const info = obtenerInfoDiente(numero);
            setDienteHoverInfo({ numero, nombre: info.nombre });
        } else {
            setDienteHoverInfo(null);
        }
    };

    const handleCerrarControlado = () => {
        if (tieneCambios && modoEditor) {
            setAccionPendiente('cerrar');
            setDialogoCambiosSinGuardarAbierto(true);
        } else {
            onCerrar();
        }
    };
    
    useEffect(() => {
        if (!abierto) {
            setTieneCambios(false);
        }
    }, [abierto]);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [odontogramas, simbolosData] = await Promise.all([
                odontogramaApi.obtenerPorPaciente(pacienteId),
                odontogramaApi.obtenerSimbolos(),
            ]);
            setSimbolos(simbolosData);
            let odontogramaData = null;
            if (Array.isArray(odontogramas) && odontogramas.length > 0) {
                 const sorted = [...odontogramas].sort((a, b) => (b.version || 0) - (a.version || 0));
                 setVersiones(sorted);
                 odontogramaData = sorted[0];
            } else if (!Array.isArray(odontogramas) && odontogramas) {
                odontogramaData = odontogramas;
                setVersiones([odontogramas]);
            } else {
                setVersiones([]);
            }

            setOdontograma(odontogramaData);
            setDetallesVersion(odontogramaData?.nombre || '');
            
            if (odontogramaData) {
                if (odontogramaData.datos_pintado) {
                    setDibujos(odontogramaData.datos_pintado);
                } else {
                    setDibujos([]);
                }
                if (odontogramaData.configuracion_dientes && Object.keys(odontogramaData.configuracion_dientes).length > 0) {
                    setConfiguracionDientes(odontogramaData.configuracion_dientes);
                    const cfg = odontogramaData.configuracion_dientes;
                    const isLinear = (cfg[11]?.y && cfg[18]?.y && Math.abs(cfg[11].y - cfg[18].y) < 5) || 
                                     (cfg[51]?.y && cfg[55]?.y && Math.abs(cfg[51].y - cfg[55].y) < 5);
                    setLayoutMode(isLinear ? 'linear' : 'arch');
                } else {
                    setConfiguracionDientes({});
                    setLayoutMode('linear');
                }

                setOpcionesNuevaVersion(prev => ({
                    ...prev,
                    tipo: odontogramaData.tipo || 'adulto'
                }));

                if (odontogramaData.aplicaciones) {
                    const simbsExistentes: SimbologiaAnadida[] = odontogramaData.aplicaciones.map((app: any) => {
                        const esImagen = !!app.transformacion;
                        let t: any = app.transformacion;
                        if (t) {
                            if (t.escala !== undefined && t.scaleX === undefined) {
                                t = { 
                                    ...t, 
                                    scaleX: t.escala, 
                                    scaleY: t.escala,
                                    rotation: t.rotacion !== undefined ? t.rotacion : t.rotation
                                };
                            }
                        }

                        const categoria = app.simbolo?.categoria || 'TRATAMIENTO_PATOLOGIA';
                        const hoverBase = app.simbolo?.color_hover || '#0000FF';
                        const principal = app.simbolo?.color_primario || app.simbolo?.color_hover || '#0000FF';
                        const secundario = app.simbolo?.color_secundario;

                        const hoverColor = t?.hover_color || t?.color_hover || hoverBase;

                        let estado: 'REALIZADO' | 'POR_REALIZAR' | undefined = undefined;
                        if (categoria !== 'CONDICION_HALLAZGO') {
                            estado = t?.estado;
                            if (!estado) {
                                const colorPersistido = (t?.color || '').toString().toLowerCase();
                                const principalLower = (principal || '').toString().toLowerCase();
                                estado = colorPersistido && principalLower && colorPersistido === principalLower
                                    ? 'REALIZADO'
                                    : 'POR_REALIZAR';
                            }
                        }

                        const colorIcono = categoria === 'CONDICION_HALLAZGO'
                            ? (t?.color || principal)
                            : (t?.color || (estado === 'REALIZADO' ? principal : (secundario || principal)));

                        if (t && esImagen) {
                            t = {
                                ...t,
                                color: colorIcono,
                                hover_color: hoverColor,
                                estado,
                            };
                        }

                        return {
                            id: `existing-${app.id}`,
                            aplicacionId: app.id,
                            simboloId: app.simbolo.id,
                            nombre: app.simbolo.nombre,
                            imagen_base64: app.simbolo.imagen_base64,
                            descripcion: app.simbolo.descripcion,
                            categoria,
                            color_principal: principal,
                            color_secundario: secundario,
                            color_hover: hoverColor,
                            estado,
                            piezasAsignadas: app.piezas_afectadas || [],
                            transformacion: t,
                            esImagen: esImagen
                        };
                    });
                    setSimbologiasAnadidas(simbsExistentes);
                }
            } else {
                setSimbologiasAnadidas([]);
                setDibujos([]);
                setConfiguracionDientes({});
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setCargando(false);
        }
    }, [pacienteId]);

    const handleCambiarVersion = (versionIdStr: string) => {
        const versionId = parseInt(versionIdStr);
        const versionSeleccionada = versiones.find(v => v.id === versionId);
        if (versionSeleccionada) {
            setOdontograma(versionSeleccionada);
            setDetallesVersion(versionSeleccionada.nombre || '');
            
            if (versionSeleccionada.datos_pintado) {
                setDibujos(versionSeleccionada.datos_pintado);
            } else {
                setDibujos([]);
            }
            if (versionSeleccionada.configuracion_dientes && Object.keys(versionSeleccionada.configuracion_dientes).length > 0) {
                setConfiguracionDientes(versionSeleccionada.configuracion_dientes);
                const cfg = versionSeleccionada.configuracion_dientes;
                const isLinear = (cfg[11]?.y && cfg[18]?.y && Math.abs(cfg[11].y - cfg[18].y) < 5) || 
                                 (cfg[51]?.y && cfg[55]?.y && Math.abs(cfg[51].y - cfg[55].y) < 5);
                setLayoutMode(isLinear ? 'linear' : 'arch');
            } else {
                setConfiguracionDientes({});
                setLayoutMode('linear');
            }

            if (versionSeleccionada.aplicaciones) {
                const simbsExistentes: SimbologiaAnadida[] = versionSeleccionada.aplicaciones.map((app: any) => {
                    const esImagen = !!app.transformacion;
                    let t: any = app.transformacion;
                    if (t) {
                        if (t.escala !== undefined && t.scaleX === undefined) {
                            t = { 
                                ...t, 
                                scaleX: t.escala, 
                                scaleY: t.escala, 
                                rotation: t.rotacion !== undefined ? t.rotacion : t.rotation
                            };
                        }
                    }

                    const categoria = app.simbolo?.categoria || 'TRATAMIENTO_PATOLOGIA';
                    const hoverBase = app.simbolo?.color_hover || '#0000FF';
                    const principal = app.simbolo?.color_primario || app.simbolo?.color_hover || '#0000FF';
                    const secundario = app.simbolo?.color_secundario;

                    const hoverColor = t?.hover_color || t?.color_hover || hoverBase;

                    let estado: 'REALIZADO' | 'POR_REALIZAR' | undefined = undefined;
                    if (categoria !== 'CONDICION_HALLAZGO') {
                        estado = t?.estado;
                        if (!estado) {
                            const colorPersistido = (t?.color || '').toString().toLowerCase();
                            const principalLower = (principal || '').toString().toLowerCase();
                            estado = colorPersistido && principalLower && colorPersistido === principalLower
                                ? 'REALIZADO'
                                : 'POR_REALIZAR';
                        }
                    }

                    const colorIcono = categoria === 'CONDICION_HALLAZGO'
                        ? (t?.color || principal)
                        : (t?.color || (estado === 'REALIZADO' ? principal : (secundario || principal)));

                    if (t && esImagen) {
                        t = {
                            ...t,
                            color: colorIcono,
                            hover_color: hoverColor,
                            estado,
                        };
                    }

                    return {
                        id: `existing-${app.id}`,
                        aplicacionId: app.id,
                        simboloId: app.simbolo.id,
                        nombre: app.simbolo.nombre,
                        imagen_base64: app.simbolo.imagen_base64,
                        descripcion: app.simbolo.descripcion,
                        categoria,
                        color_principal: principal,
                        color_secundario: secundario,
                        color_hover: hoverColor,
                        estado,
                        piezasAsignadas: app.piezas_afectadas || [],
                        transformacion: t,
                        esImagen: esImagen
                    };
                });
                setSimbologiasAnadidas(simbsExistentes);
            } else {
                setSimbologiasAnadidas([]);
            }

            if (!versionSeleccionada.es_ultima_version) {
                setModoEditor(false);
            }
        }
    };

    const [factorSeparacion, setFactorSeparacion] = useState(0);

    const handleResetPosicionLineal = () => {
         guardarEnHistorial();
         const tipo = _odontograma?.tipo || 'adulto';
         const config = generateInitialConfig(tipo, 1000/2, (1000 - ((40*2)+60))/2, 40+5, 60, 40);
         setConfiguracionDientes(config);
         setFactorSeparacion(0);
         setLinearRowGap(60);
         setLayoutMode('linear');
         setTieneCambios(true);
    };

    const handleResetPosicionArco = () => {
         guardarEnHistorial();
         const tipo = _odontograma?.tipo || 'adulto';
         const config = generateArchConfig(tipo, 1000/2, 350, 40, 0); 
         setConfiguracionDientes(config);
         setFactorSeparacion(0);
         setLayoutMode('arch');
         setTieneCambios(true);
    };

    const handleAjustarArco = (delta: number) => {
        const tipo = _odontograma?.tipo || 'adulto';

        if (layoutMode === 'linear') {
            const pxChange = delta > 0 ? 20 : -20;
            const nuevoRowGap = Math.max(40, Math.min(400, linearRowGap + pxChange));
            
            if (nuevoRowGap !== linearRowGap) {
                guardarEnHistorial();
                setLinearRowGap(nuevoRowGap);
                const totalHeight = 80 + nuevoRowGap;
                const startY = (1000 - totalHeight) / 2;
                const config = generateInitialConfig(tipo, 1000/2, startY, 40+5, nuevoRowGap, 40);
                setConfiguracionDientes(config);
                setTieneCambios(true);
            }
        } else {
            const nuevoFactor = Math.max(-0.5, Math.min(0.5, factorSeparacion + delta));
            if (nuevoFactor !== factorSeparacion) {
                guardarEnHistorial();
                setFactorSeparacion(nuevoFactor);
                const config = generateArchConfig(tipo, 1000/2, 350, 40, nuevoFactor);
                setConfiguracionDientes(config);
                setTieneCambios(true);
            }
        }
    };

    const handleCrearInicial = async (tipo: 'adulto' | 'nino') => {
        setCargando(true);
        try {
            await odontogramaApi.crear(pacienteId, { tipo });
            await cargarDatos();
            toast({ title: 'Odontograma creado', description: `Se ha iniciado el odontograma ${tipo}` });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', variant: 'destructive', description: 'No se pudo crear el odontograma' });
            setCargando(false);
        }
    };

    const handleGuardarCambiosVisuales = async () => {
        if (!_odontograma) return;
        setGuardandoVisual(true);
        try {
            await odontogramaApi.actualizar(_odontograma.id, {
                datos_pintado: dibujos,
                configuracion_dientes: configuracionDientes,
                nombre: detallesVersion
            });
            const updates = simbologiasAnadidas
                .filter(s => s.esImagen && typeof (s as any).aplicacionId === 'number')
                .map(s => {
                    const id = (s as any).aplicacionId as number;
                    const t = s.transformacion as any;
                    const transformacionApi = t ? {
                        x: t.x,
                        y: t.y,
                        escala: t.scaleX || 1,
                        rotacion: t.rotation || 0,
                        color: t.color || obtenerColorAplicacion(s),
                        hover_color: s.color_hover,
                        estado: s.estado || t?.estado,
                    } : undefined;

                    return odontogramaApi.actualizarAplicacion(id, {
                        transformacion: transformacionApi
                    });
                });
            
            await Promise.all(updates);

            setTieneCambios(false);

            toast({ title: 'Guardado', description: 'Cambios visuales y posiciones guardados' });
        } catch (error) {
            console.error(error);
            setTieneCambios(true);
            toast({ title: 'Error', variant: 'destructive', description: 'No se pudieron guardar los cambios' });
        } finally {
            setGuardandoVisual(false);
        }
    };

    const crearNuevaVersion = async () => {
        if (!_odontograma) return;
        setCargando(true);
        try {
            const nuevo = await odontogramaApi.crearNuevaVersion(_odontograma.id, opcionesNuevaVersion);
            await cargarDatos();
            setDialogoNuevaVersionAbierto(false);
            toast({ title: 'Éxito', description: `Nueva versión ${nuevo.version} creada correctamente` });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', variant: 'destructive', description: 'No se pudo crear la nueva versión' });
        } finally {
            setCargando(false);
        }
    };

    const abrirDialogoNuevaVersion = () => {
        if (!_odontograma) return;
        setOpcionesNuevaVersion({
            clonar: true,
            tipo: _odontograma.tipo || 'adulto'
        });
        setDialogoNuevaVersionAbierto(true);
    };

    useEffect(() => {
        if (abierto && pacienteId) {
            cargarDatos();
            setModoEditor(false);
            setSimbologiaActiva(null);
            setModoAsignacion(false);
            setPiezasSeleccionadas([]);
            setSimbologiaHover(null);
            setEscala(0.6);
            setDibujos([]);
            setModoDibujo(false);
            setModoEdicionPosicion(false);
        }
    }, [abierto, pacienteId, cargarDatos]);

    useEffect(() => {
        if (!cargando && _odontograma && scrollContainerRef.current && abierto) {
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const { scrollHeight, clientHeight, scrollWidth, clientWidth } = scrollContainerRef.current;
                    if (scrollHeight > clientHeight) {
                        scrollContainerRef.current.scrollTop = (scrollHeight - clientHeight) / 2;
                    }
                    if (scrollWidth > clientWidth) {
                        scrollContainerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
                    }
                }
            }, 100);
        }
    }, [cargando, _odontograma, abierto]);

    const handleCambiarEstadoTratamiento = async (simbologiaId: string, estado: 'REALIZADO' | 'POR_REALIZAR') => {
        const simbologia = simbologiasAnadidas.find(s => s.id === simbologiaId);
        if (!simbologia) return;
        if (simbologia.categoria !== 'TRATAMIENTO_PATOLOGIA') return;

        const colorObjetivo = estado === 'REALIZADO'
            ? (simbologia.color_principal || '#0000FF')
            : (simbologia.color_secundario || simbologia.color_principal || '#0000FF');

        setSimbologiasAnadidas(prev => prev.map(s =>
            s.id === simbologiaId
                ? ({
                    ...s,
                    estado,
                    transformacion: s.transformacion
                        ? ({ ...s.transformacion, color: colorObjetivo, estado } as any)
                        : s.transformacion,
                })
                : s
        ));

        setTieneCambios(true);

        if (!simbologia.aplicacionId) return;
        const aplicacionId = simbologia.aplicacionId;

        try {
            const t = (simbologia.transformacion as any) || { x: 500, y: 500, scaleX: 1, scaleY: 1, rotation: 0 };
            await odontogramaApi.actualizarAplicacion(aplicacionId, {
                transformacion: {
                    x: t.x,
                    y: t.y,
                    escala: t.scaleX || 1,
                    rotacion: t.rotation || 0,
                    color: colorObjetivo,
                    estado,
                    hover_color: simbologia.color_hover,
                } as any
            });
        } catch (e) {
            console.error('Error al actualizar estado del tratamiento:', e);
        }
    };

    const handleCambiarColorSimbologiaAplicada = async (simbologiaId: string, color: string) => {
        setSimbologiasAnadidas(prev => prev.map(s =>
            s.id === simbologiaId
                ? ({
                    ...s,
                    color_hover: color,
                    transformacion: s.transformacion
                        ? ({ ...s.transformacion, hover_color: color } as any)
                        : ({ x: 500, y: 500, scaleX: 1, scaleY: 1, rotation: 0, hover_color: color } as any),
                })
                : s
        ));

        setTieneCambios(true);

        const simbologia = simbologiasAnadidas.find(s => s.id === simbologiaId);
        if (!simbologia?.aplicacionId) return;
        const aplicacionId = simbologia.aplicacionId;
        const t = (simbologia?.transformacion as any) || { x: 500, y: 500, scaleX: 1, scaleY: 1, rotation: 0 };

        try {
            await odontogramaApi.actualizarAplicacion(aplicacionId, {
                transformacion: {
                    x: t.x,
                    y: t.y,
                    escala: t.scaleX || 1,
                    rotacion: t.rotation || 0,
                    color: t.color || obtenerColorAplicacion(simbologia),
                    hover_color: color,
                    estado: simbologia?.estado || t?.estado,
                } as any,
            });
        } catch (e) {
            console.error('Error al actualizar color de la simbología aplicada:', e);
        }
    };


    const handleAgregarSimbologia = (simbolo: SimboloOdontograma, colorResaltado?: string) => {
        const categoria = simbolo?.categoria || 'TRATAMIENTO_PATOLOGIA';
        const hoverColor = colorResaltado || simbolo?.color_hover || '#FF0000';
        const principal = (simbolo as any)?.color_primario || simbolo?.color_primario || simbolo?.color_hover || '#0000FF';
        const secundario = simbolo?.color_secundario;
        const estado: 'REALIZADO' | 'POR_REALIZAR' | undefined = categoria === 'CONDICION_HALLAZGO' ? undefined : 'POR_REALIZAR';
        const colorIconoInicial = categoria === 'CONDICION_HALLAZGO' ? principal : (secundario || principal);
        const instanciasMismoSimbolo = simbologiasAnadidas.filter(s => s.esImagen && s.simboloId === simbolo.id).length;
        const pasosPorVuelta = 8;
        const ring = Math.floor(instanciasMismoSimbolo / pasosPorVuelta);
        const stepIndex = instanciasMismoSimbolo % pasosPorVuelta;
        const radius = 140 + ring * 120;
        const angle = (Math.PI * 2 * stepIndex) / pasosPorVuelta;

        const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
        const xInicial = clamp(500 + Math.round(radius * Math.cos(angle)), 50, 950);
        const yInicial = clamp(500 + Math.round(radius * Math.sin(angle)), 50, 950);

        const nuevaSimb: SimbologiaAnadida = {
            id: `new-${Date.now()}-${contadorId.current++}`,
            simboloId: simbolo.id,
            nombre: simbolo.nombre,
            imagen_base64: simbolo.imagen_base64,
            descripcion: simbolo.descripcion,
            categoria,
            color_principal: principal,
            color_secundario: secundario,
            color_hover: hoverColor,
            estado,
            piezasAsignadas: [],
            esImagen: true,
            transformacion: { x: xInicial, y: yInicial, scaleX: 1, scaleY: 1, rotation: 0, color: colorIconoInicial, hover_color: hoverColor, estado }
        };
        setSimbologiasAnadidas(prev => [...prev, nuevaSimb]);
        setSimbologiaActiva(nuevaSimb.id);
        setTieneCambios(true);

        odontogramaApi.aplicarSimbolo(_odontograma!.id, {
            simbolo_id: simbolo.id,
            piezas_afectadas: [],
            transformacion: {
                x: nuevaSimb.transformacion!.x,
                y: nuevaSimb.transformacion!.y,
                escala: nuevaSimb.transformacion!.scaleX || 1, 
                rotacion: nuevaSimb.transformacion!.rotation || 0,
                color: colorIconoInicial,
                hover_color: hoverColor,
                estado,
            }
        }).then(app => {
            const appId = app?.id;
            if (!Number.isFinite(appId)) {
                toast({
                    title: 'Advertencia',
                    variant: 'destructive',
                    description: 'La simbología se agregó localmente, pero el servidor no devolvió un id de aplicación.'
                });
                return;
            }
            setSimbologiasAnadidas(prev => prev.map(s => s.id === nuevaSimb.id ? {
                ...s,
                aplicacionId: appId,
                transformacion: { ...s.transformacion, color: colorIconoInicial, hover_color: hoverColor, estado } as any
            } : s));
            toast({ title: 'Simbología agregada', description: `${simbolo.nombre} añadido al lienzo` });
        }).catch((e) => {
            console.error('Error al aplicar simbología:', e);
            toast({ title: 'Error', variant: 'destructive', description: 'No se pudo guardar la simbología en el servidor' });
        });
    };

    const handleUpdateSimboloTransform = (id: string, transform: any) => {
        setSimbologiasAnadidas(prev => prev.map(s => 
            s.id === id ? { ...s, transformacion: transform } : s
        ));
    };

    const handleSeleccionarSimbologia = (id: string) => {
        if (modoAsignacion && simbologiaActiva !== id) {
            setModoAsignacion(false);
            setPiezasSeleccionadas([]);
        }
        setSimbologiaActiva(id === simbologiaActiva ? null : id);
    };

    const handleIniciarAsignacion = () => {
        if (!simbologiaActiva) return;
        const simb = simbologiasAnadidas.find(s => s.id === simbologiaActiva);
        if (simb) {
            setPiezasSeleccionadas([...simb.piezasAsignadas]);
            setModoAsignacion(true);
        }
    };

    const handleTerminarAsignacion = async () => {
        if (!simbologiaActiva) return;
        setSimbologiasAnadidas(prev => prev.map(s =>
            s.id === simbologiaActiva
                ? { ...s, piezasAsignadas: [...piezasSeleccionadas] }
                : s
        ));
        setModoAsignacion(false);
        setPiezasSeleccionadas([]);
        const simb = simbologiasAnadidas.find(s => s.id === simbologiaActiva);
        if (simb?.aplicacionId) {
            try {
                await odontogramaApi.actualizarAplicacion(simb.aplicacionId, {
                    piezas_afectadas: piezasSeleccionadas
                });
                toast({ title: 'Guardado', description: 'Asignación actualizada' });
            } catch (e) {
                toast({ title: 'Error', variant: 'destructive', description: 'No se pudo guardar la asignación' });
            }
        }
    };

    const handlePiezaClick = (numeroPieza: number, parte: string) => {
        if (!modoAsignacion || !modoEditor) return;

        setPiezasSeleccionadas(prev => {
            const piezaIndex = prev.findIndex(p => p.numero_pieza === numeroPieza);

            if (piezaIndex === -1) {
                return [...prev, { numero_pieza: numeroPieza, partes: [parte] }];
            }

            const pieza = prev[piezaIndex];
            const parteIndex = pieza.partes.indexOf(parte);

            if (parteIndex === -1) {
                const nuevaPieza = { ...pieza, partes: [...pieza.partes, parte] };
                return [...prev.slice(0, piezaIndex), nuevaPieza, ...prev.slice(piezaIndex + 1)];
            }

            const nuevasPartes = pieza.partes.filter(p => p !== parte);
            if (nuevasPartes.length === 0) {
                return prev.filter((_, i) => i !== piezaIndex);
            }

            const nuevaPieza = { ...pieza, partes: nuevasPartes };
            return [...prev.slice(0, piezaIndex), nuevaPieza, ...prev.slice(piezaIndex + 1)];
        });
    };

    const handleEliminarSimbologia = async (id: string) => {
        const simb = simbologiasAnadidas.find(s => s.id === id);
        if (simbologiaActiva === id) {
            setSimbologiaActiva(null);
            setModoAsignacion(false);
            setPiezasSeleccionadas([]);
        }
        setSimbologiasAnadidas(prev => prev.filter(s => s.id !== id));
        setTieneCambios(true);

        if (!simb?.aplicacionId) return;
        const aplicacionId = simb.aplicacionId;
        try {
            await odontogramaApi.eliminarAplicacion(aplicacionId);
            toast({ title: 'Eliminado', description: 'La simbología fue eliminada del odontograma' });
        } catch (e) {
            console.error('Error al eliminar la aplicación:', e);
            toast({ title: 'Error', variant: 'destructive', description: 'No se pudo eliminar la simbología' });
        }
    };

    const handleGuardarSimbolo = async (datos: {
        nombre: string;
        descripcion?: string;
        imagen_base64: string;
        datos_canvas?: any;
        categoria?: 'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO';
        color_primario: string;
        color_secundario?: string | null;
    }) => {
        await odontogramaApi.crearSimbolo(datos);
        const nuevosSimbolos = await odontogramaApi.obtenerSimbolos();
        setSimbolos(nuevosSimbolos);
        setEditorAbierto(false);
        
        toast({
            title: 'Símbolo creado',
            description: 'El símbolo se creó correctamente',
        });
    };

    const handleExportarImagen = async () => {
        if (!chartRef.current) return;

        setExportando(true);
        try {
            const chartDiv = chartRef.current;
            const svgElements = chartDiv.querySelectorAll('svg');

            const canvas = document.createElement('canvas');
            canvas.width = 1000 * 2;
            canvas.height = 1000 * 2;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const unzoom = 1 / escala;
                const exportScale = 2 * unzoom;
                ctx.scale(exportScale, exportScale);
                const chartRect = chartDiv.getBoundingClientRect();
                if (mostrarGrid) {
                   ctx.strokeStyle = '#eee';
                   ctx.lineWidth = 1;
                   const step = 50;
                   const width = 1000;
                   const height = 1000;
                   ctx.save();
                   ctx.setTransform(2, 0, 0, 2, 0, 0); 
                   for (let i = 0; i <= width; i += step) {
                       ctx.beginPath();
                       ctx.moveTo(i, 0);
                       ctx.lineTo(i, height);
                       ctx.stroke();
                   }
                   for (let i = 0; i <= height; i += step) {
                       ctx.beginPath();
                       ctx.moveTo(0, i);
                       ctx.lineTo(width, i);
                       ctx.stroke();
                   }
                   ctx.restore();
                }

                for (const svg of svgElements) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);

                    const img = new Image();
                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            const rect = svg.getBoundingClientRect();
                            const x = rect.left - chartRect.left;
                            const y = rect.top - chartRect.top;
                            ctx.drawImage(img, x, y, rect.width, rect.height);
                            resolve();
                        };
                        img.src = url;
                    });
                    URL.revokeObjectURL(url);
                }
                if (mostrarNumeros && configuracionDientes) {
                   ctx.save();
                   ctx.setTransform(2, 0, 0, 2, 0, 0);
                   ctx.fillStyle = '#374151';
                   ctx.font = 'bold 12px sans-serif';
                   ctx.textAlign = 'center';
                   
                   Object.keys(configuracionDientes).forEach((key) => {
                       const pos = configuracionDientes[key];
                       if (pos) {
                           ctx.fillText(key, pos.x + 20, pos.y - 8); 
                       }
                   });
                   ctx.restore();
                }
                
                if (stageRef.current) {
                    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
                    const img = new Image();
                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                             ctx.save();
                             ctx.setTransform(1, 0, 0, 1, 0, 0);
                             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                             ctx.restore();
                             resolve();
                        };
                        img.src = dataUrl;
                    });
                } else {
                     const konvaContent = chartDiv.querySelector('.konvajs-content canvas');
                     if (konvaContent) {
                        const konvaCanvas = konvaContent as HTMLCanvasElement;
                        const rect = konvaContent.getBoundingClientRect();
                        const x = rect.left - chartRect.left;
                        const y = rect.top - chartRect.top;
                        ctx.drawImage(konvaCanvas, x, y, rect.width, rect.height);
                     }
                }
            }

            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];

            const sufijo = `${mostrarGrid ? 'G' : ''}${mostrarNumeros ? 'N' : ''}${modoEditor || mostrarAsignaciones ? 'A' : ''}`;
            await archivosApi.subir({
                nombre_archivo: `Odontograma_${sufijo}_${new Date().toISOString().split('T')[0]}.png`,
                tipo_mime: 'image/png',
                descripcion: `Odontograma de ${pacienteNombre}`,
                contenido_base64: base64,
                paciente_id: pacienteId,
            });

            toast({
                title: 'Imagen exportada',
                description: 'El odontograma se guardó en los archivos del paciente',
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo exportar la imagen',
                variant: 'destructive',
            });
        } finally {
            setExportando(false);
        }
    };

    const simbologiaActivaData = simbologiasAnadidas.find(s => s.id === simbologiaActiva);

    const piezasDeSimbolgia = simbologiaActivaData?.piezasAsignadas || [];

    if (cargando) {
        return (
            <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
                <DialogContent className="max-w-5xl max-h-[90vh]">
                     <DialogHeader>
                        <DialogTitle className="sr-only">Cargando datos</DialogTitle>
                        <DialogDescription className="sr-only">Por favor espere</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground">Cargando odontograma...</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!_odontograma) {
        return (
             <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
                <DialogContent id="dialog-odontograma-inicial" className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Iniciar Odontograma</DialogTitle>
                        <DialogDescription>
                            El paciente {pacienteNombre} no tiene un odontograma registrado. Selecciona el tipo para comenzar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-8">
                         <div 
                            id="odontograma-iniciar-adulto"
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary/50 hover:border-primary transition-all gap-4"
                            onClick={() => handleCrearInicial('adulto')}
                        >
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-3xl font-bold handleCerrarControladomary">A</span>
                            </div>
                            <span className="font-semibold text-lg">Adulto</span>
                        </div>
                        <div 
                            id="odontograma-iniciar-nino"
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary/50 hover:border-primary transition-all gap-4"
                            onClick={() => handleCrearInicial('nino')}
                        >
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-3xl font-bold text-primary">N</span>
                            </div>
                            <span className="font-semibold text-lg">Niño</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={abierto} onOpenChange={(open) => !open && handleCerrarControlado()}>
                <DialogContent id="dialog-odontograma" className="max-w-[98vw] max-h-[98vh] h-[95vh] w-[98vw] overflow-hidden flex flex-col p-0 [&>button]:hidden">
                    <DialogDescription className="sr-only">
                        Odontograma dental del paciente para registrar símbolos y marcas
                    </DialogDescription>
                    <DialogHeader className="p-4 pb-3 border-b bg-background shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <DialogTitle className="text-lg">
                                    Odontograma - {pacienteNombre}
                                </DialogTitle>

                                {_odontograma && (
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/20 uppercase">
                                            {_odontograma.tipo === 'nino' ? 'Niño' : 'Adulto'}
                                        </span>
                                        <Select value={_odontograma.id.toString()} onValueChange={handleCambiarVersion}>
                                            <SelectTrigger id="odontograma-select-version" className="h-7 text-xs w-[120px]">
                                                <SelectValue placeholder="Versión" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {versiones.map((v) => (
                                                    <SelectItem key={v.id} value={v.id.toString()}>
                                                        v{v.version} {v.es_ultima_version ? '(Actual)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button 
                                            id="odontograma-btn-nueva-version"
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 text-xs px-2" 
                                            onClick={abrirDialogoNuevaVersion}
                                            title="Crear nueva versión a partir de la actual"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Nueva Versión
                                        </Button>
                                    </div>
                                )}
                                <div id="odontograma-modo-toggle" className="flex items-center bg-secondary rounded-lg p-1">
                                    <button
                                        id="odontograma-btn-vista"
                                        onClick={() => { 
                                            if (tieneCambios && modoEditor) {
                                                setAccionPendiente('vista');
                                                setDialogoCambiosSinGuardarAbierto(true);
                                            } else {
                                                setModoEditor(false); 
                                                setModoAsignacion(false); 
                                                setSimbologiaActiva(null);
                                                setPiezasSeleccionadas([]);
                                                setModoDibujo(false);
                                                setModoEdicionPosicion(false);
                                            }
                                        }}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${!modoEditor
                                            ? 'bg-background text-foreground shadow'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Eye className="h-4 w-4" />
                                        Vista
                                    </button>
                                    <button
                                        id="odontograma-btn-editar"
                                        onClick={() => setModoEditor(true)}
                                        disabled={!_odontograma?.es_ultima_version}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${modoEditor
                                            ? 'bg-background text-foreground shadow'
                                            : 'text-muted-foreground hover:text-foreground'
                                            } ${!_odontograma?.es_ultima_version ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={!_odontograma?.es_ultima_version ? "Solo se puede editar la última versión" : "Editar odontograma"}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Editar
                                    </button>
                                </div>
                            </div>

                            <div id="odontograma-controles-visualizacion" className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEscala(s => Math.max(0.2, s - 0.1))} disabled={escala <= 0.2}>
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-xs w-10 text-center">{Math.round(escala * 100)}%</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEscala(s => Math.min(2, s + 0.1))} disabled={escala >= 2}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEscala(0.6)}>
                                        <RotateCcw className="h-3 w-3" />
                                    </Button>
                                </div>
                                
                                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1">
                                    <Label htmlFor="show-nums" className="text-xs font-normal cursor-pointer">Números</Label>
                                    <Switch id="show-nums" checked={mostrarNumeros} onCheckedChange={setMostrarNumeros} />
                                </div>
                                
                                {!modoEditor && (
                                    <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1" title="Mostrar/Ocultar asignaciones">
                                        <Highlighter className="h-3 w-3 text-muted-foreground" />
                                        <Switch id="show-assignments" checked={mostrarAsignaciones} onCheckedChange={setMostrarAsignaciones} className="scale-90" />
                                    </div>
                                )}

                                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1">
                                    <Grid className="h-3 w-3 text-muted-foreground" />
                                    <Switch id="show-grid-header" checked={mostrarGrid} onCheckedChange={setMostrarGrid} className="scale-90" />
                                </div>

                                <div className="h-6 w-px bg-border mx-1" />

                                <div title={modoEditor ? "Salga del modo edición para exportar" : tieneCambios ? "Guarde los cambios antes de exportar" : "Exportar imagen"}>
                                    <Button 
                                        id="odontograma-btn-exportar"
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleExportarImagen} 
                                        disabled={exportando || modoEditor || tieneCambios}
                                    >
                                        {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleCerrarControlado}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    { modoEditor && (
                        <div className="flex items-center justify-end gap-2 p-2 px-4 border-b bg-secondary/30 shrink-0">
                             <Button 
                                id="odontograma-btn-guardar-visual"
                                variant="default" 
                                size="sm" 
                                onClick={handleGuardarCambiosVisuales}
                                disabled={guardandoVisual || !tieneCambios}
                                className={`gap-2 transition-all duration-300 ${tieneCambios ? "border-2 border-primary shadow-sm" : ""}`}
                            >
                                {guardandoVisual ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                Guardar Visualización
                            </Button>
                        </div>
                    )}

                    <div className="flex-1 flex overflow-hidden">
                        {!modoEditor ? (
                            <div id="odontograma-sidebar-resumen" className="w-72 border-r bg-background flex flex-col shrink-0">
                                <div className="p-3 border-b bg-secondary/10 flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">Resumen de Hallazgos</h3>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-3 space-y-3">
                                        <div className="border border-l-4 border-l-primary/50 rounded p-3 bg-muted/20 text-sm mb-4">
                                            <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
                                            <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-xs">
                                                {detallesVersion || "Sin notas registradas para esta versión."}
                                            </p>
                                        </div>

                                        {simbologiasAnadidas.map((simb, idx) => (
                                            <div key={simb.id || idx} className="border rounded-lg p-2 bg-card hover:bg-secondary/20 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                        <div 
                                                            className="w-8 h-8 rounded border flex items-center justify-center overflow-hidden shrink-0 bg-white"
                                                        style={{ borderColor: obtenerHoverColorAplicacion(simb) }}
                                                        onMouseEnter={() => setSimbologiaHover(simb.id)}
                                                        onMouseLeave={() => setSimbologiaHover(null)}
                                                    >
                                                        <ImagenSimboloTintada
                                                            base64={simb.imagen_base64}
                                                            color={obtenerColorAplicacion(simb)}
                                                            alt={simb.nombre}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="font-medium text-sm block truncate" title={simb.nombre}>{simb.nombre}</span>
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                                                                {typeof simb.aplicacionId === 'number' ? `#${simb.aplicacionId}` : 'nuevo'}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground block">{simb.descripcion || 'Sin descripción'}</span>
                                                    </div>
                                                </div>
                                                {simb.piezasAsignadas.length > 0 ? (
                                                    <div className="pl-10">
                                                        <p className="text-[10px] text-muted-foreground mb-1 font-medium">Piezas afectadas:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {[...new Set(simb.piezasAsignadas.map(p => p.numero_pieza))].sort((a, b) => a - b).map((p) => (
                                                                <Badge key={p} variant="outline" className="text-[10px] h-5 px-1 bg-background">
                                                                    {p}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-muted-foreground italic pl-10">Sin piezas asignadas</p>
                                                )}
                                            </div>
                                        ))}
                                        {simbologiasAnadidas.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                No hay hallazgos registrados
                                            </p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : (
                            <div className="w-72 border-r bg-background flex flex-col shrink-0 min-h-0">
                                <Tabs 
                                    defaultValue="simbologia" 
                                    className="flex-1 flex flex-col min-h-0"
                                    onValueChange={(value) => {
                                        if (value === 'simbologia') {
                                            setModoDibujo(false);
                                            setModoEdicionPosicion(false);
                                        } else {
                                            setSimbologiaActiva(null);
                                            setModoAsignacion(false);
                                            setPiezasSeleccionadas([]);
                                        }
                                    }}
                                >
                                    <div className="p-2 border-b">
                                        <TabsList className="w-full grid grid-cols-2">
                                            <TabsTrigger id="odontograma-tab-simbologia" value="simbologia">Simbología</TabsTrigger>
                                            <TabsTrigger id="odontograma-tab-herramientas" value="herramientas">Herramientas</TabsTrigger>
                                        </TabsList>
                                    </div>
                                    
                                    <TabsContent value="simbologia" className="flex-1 flex flex-col p-0 m-0 min-h-0 data-[state=inactive]:hidden text-sm">
                                        <div className="p-3 border-b">
                                            <Button id="odontograma-btn-agregar-simbologia" onClick={() => setSelectorAbierto(true)} className="w-full" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Agregar
                                            </Button>
                                        </div>
                                        <ScrollArea className="flex-1">
                                            <div className="p-2 space-y-2">
                                                {simbologiasAnadidas.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-8">
                                                        No hay simbologías
                                                    </p>
                                                ) : (
                                                    simbologiasAnadidas.map((simb) => (
                                                        <div
                                                            key={simb.id}
                                                            onClick={() => handleSeleccionarSimbologia(simb.id)}
                                                            onMouseEnter={() => setSimbologiaHover(simb.id)}
                                                            onMouseLeave={() => setSimbologiaHover(null)}
                                                            className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${simbologiaActiva === simb.id
                                                                ? 'border-primary bg-primary/10'
                                                                : 'border-transparent hover:border-primary/30 hover:bg-secondary/50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-8 h-8 bg-white rounded border flex items-center justify-center overflow-hidden shrink-0"
                                                                    style={{ borderColor: obtenerHoverColorAplicacion(simb) }}
                                                                >
                                                                    <ImagenSimboloTintada
                                                                        base64={simb.imagen_base64}
                                                                                    color={obtenerColorAplicacion(simb)}
                                                                        alt={simb.nombre}
                                                                        className="max-w-full max-h-full object-contain"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <p className="text-sm font-medium truncate">{simb.nombre}</p>
                                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                                                                            {typeof simb.aplicacionId === 'number' ? `#${simb.aplicacionId}` : 'nuevo'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>

                                    <TabsContent value="herramientas" className="flex-1 flex flex-col m-0 p-0 min-h-0 data-[state=inactive]:hidden">
                                        <ScrollArea className="flex-1">
                                            <div className="p-4 space-y-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between pb-1 border-b">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                                            <Palette className="w-4 h-4" />
                                                            <span>Pintado (Lienzo)</span>
                                                        </div>
                                                {herramientaDibujo === 'pencil' && modoDibujo && (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <div 
                                                                className="w-5 h-5 rounded-full border shadow-sm cursor-pointer hover:scale-110 transition-transform" 
                                                                style={{ backgroundColor: colorDibujo }}
                                                                title="Cambiar color del lápiz"
                                                            />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-2">
                                                            <HexColorPicker color={colorDibujo} onChange={setColorDibujo} />
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <Button 
                                                    id="odontograma-tool-lapiz"
                                                    variant={modoDibujo && herramientaDibujo === 'pencil' ? "default" : "outline"} 
                                                    size="sm" 
                                                    className="flex flex-col h-auto py-2 px-1 gap-1"
                                                    onClick={() => { setModoDibujo(true); setHerramientaDibujo('pencil'); setModoEdicionPosicion(false); }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="text-[10px]">Lápiz</span>
                                                </Button>
                                                <Button 
                                                    id="odontograma-tool-borrador"
                                                    variant={modoDibujo && herramientaDibujo === 'eraser' ? "default" : "outline"} 
                                                    size="sm" 
                                                    className="flex flex-col h-auto py-2 px-1 gap-1"
                                                    onClick={() => { setModoDibujo(true); setHerramientaDibujo('eraser'); setModoEdicionPosicion(false); }}
                                                >
                                                    <Eraser className="h-4 w-4" />
                                                    <span className="text-[10px]">Borrar</span>
                                                </Button>
                                                <Button 
                                                    id="odontograma-tool-mover"
                                                    variant={modoEdicionPosicion ? "default" : "outline"} 
                                                    size="sm" 
                                                    className="flex flex-col h-auto py-2 px-1 gap-1"
                                                    onClick={() => { 
                                                        const nuevoEstado = !modoEdicionPosicion;
                                                        setModoEdicionPosicion(nuevoEstado); 
                                                        if (nuevoEstado) setModoDibujo(false); 
                                                    }}
                                                >
                                                    <div className="relative flex items-center justify-center w-6 h-6">
                                                        <Move className="h-6 w-6 absolute opacity-30" />
                                                        <Grid className="h-3 w-3 absolute bg-background rounded-full border" />
                                                    </div>
                                                    <span className="text-[10px]">Mover</span>
                                                </Button>
                                            </div>
                                            {modoDibujo && (
                                                <div className="space-y-2 mt-2 p-2 border rounded bg-secondary/10">
                                                    <div className="flex justify-between items-center">
                                                        <Label className="text-xs">Grosor</Label>
                                                        <span className="text-xs text-muted-foreground">{grosorDibujo}px</span>
                                                    </div>
                                                    <input 
                                                        type="range"
                                                        value={grosorDibujo} 
                                                        min={1} 
                                                        max={20} 
                                                        step={1} 
                                                        onChange={(e) => setGrosorDibujo(Number(e.target.value))}
                                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground pb-1 border-b">
                                                <Grid className="w-4 h-4" />
                                                <span>Estructura</span>
                                            </div>

                                            {modoEdicionPosicion && (
                                                <div className="mt-3 p-2 bg-background rounded border shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in zoom-in">
                                                    <p className="text-xs text-primary font-medium mb-1">Modo Movimiento Activo</p>
                                                    <div className="grid grid-cols-2 gap-2 w-full my-2 select-none">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="text-[10px] h-7 gap-1.5 select-none" 
                                                            onClick={handleResetPosicionArco}
                                                            disabled={layoutMode === 'arch'}
                                                        >
                                                            <CircleDashed className="h-3 w-3" />
                                                            Forma Arco
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="text-[10px] h-7 gap-1.5 select-none" 
                                                            onClick={handleResetPosicionLineal}
                                                            disabled={layoutMode === 'linear'}
                                                        >
                                                            <Grid className="h-3 w-3" />
                                                            Original
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 w-full mb-2 select-none">
                                                        <Button 
                                                            size="sm" 
                                                            variant="secondary" 
                                                            className="text-[10px] h-7 gap-1.5 select-none" 
                                                            onClick={() => handleAjustarArco(0.1)} 
                                                            title="Aumentar curvatura/separación"
                                                            disabled={(layoutMode === 'linear' ? linearRowGap >= 400 : factorSeparacion >= 0.5)}
                                                        >
                                                            <Maximize2 className="h-3 w-3" />
                                                            Separar
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="secondary" 
                                                            className="text-[10px] h-7 gap-1.5 select-none" 
                                                            onClick={() => handleAjustarArco(-0.1)} 
                                                            title="Disminuir curvatura/separación"
                                                            disabled={(layoutMode === 'linear' ? linearRowGap <= 50 : factorSeparacion <= -0.5)}
                                                        >
                                                            <Minimize2 className="h-3 w-3" />
                                                            Unir
                                                        </Button>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mb-2">
                                                        Arrastra los dientes para reposicionarlos.
                                                    </p>
                                                    <div className="flex gap-2 w-full mb-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="flex-1 text-[10px] h-7 gap-1"
                                                            onClick={deshacerConfig}
                                                            disabled={historialConfig.length === 0}
                                                        >
                                                            <Undo className="h-3 w-3" /> Deshacer
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="flex-1 text-[10px] h-7 gap-1"
                                                            onClick={rehacerConfig}
                                                            disabled={futuroConfig.length === 0}
                                                        >
                                                            <Redo className="h-3 w-3" /> Rehacer
                                                        </Button>
                                                    </div>
                                                    {dienteHoverInfo ? (
                                                        <>
                                                            <span className="text-lg font-bold text-primary">{dienteHoverInfo.numero}</span>
                                                            <span className="text-xs font-medium">{dienteHoverInfo.nombre}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Selecciona/Pasa sobre un diente</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {!modoEdicionPosicion && (
                                                <div className="text-center p-4 text-xs text-muted-foreground">
                                                    Selecciona la herramienta "Mover" para ajustar la posición de los dientes.
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground pb-1 border-b">
                                                <Edit3 className="w-4 h-4" />
                                                <span>Notas de Versión</span>
                                            </div>
                                            <div className="space-y-2">
                                                <Textarea 
                                                    id="detalles-version-tool"
                                                    placeholder="Escriba los detalles de esta versión..."
                                                    value={detallesVersion}
                                                    onChange={(e) => {
                                                        setDetallesVersion(e.target.value);
                                                        setTieneCambios(true);
                                                    }}
                                                    className="h-[200px] text-xs resize-none"
                                                />
                                            </div>
                                        </div>
                                        </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}

                        <div className="flex-1 overflow-auto bg-secondary/20 isolate relative">
                            <div className="min-w-full min-h-full flex p-8">
                                <div ref={chartRef} className="shadow-lg border bg-white m-auto">
                                    <OdontogramaChart
                                        simbologiasAnadidas={simbologiasAnadidas}
                                    simbologiaActiva={simbologiaActiva}
                                    onSimbologiaSelect={handleSeleccionarSimbologia}
                                    onPiezaClick={(n, p) => { handlePiezaClick(n, p); setTieneCambios(true); }}
                                    piezasSeleccionadas={piezasSeleccionadas}
                                    simbologiaHover={simbologiaHover}
                                    onSimbologiaHover={setSimbologiaHover}
                                    modoAsignacion={modoAsignacion && modoEditor}
                                    escala={escala}
                                    mostrarNumeros={mostrarNumeros}
                                    mostrarAsignaciones={modoEditor || mostrarAsignaciones}
                                    colorFondo="#ffffff"
                                    tipo={_odontograma?.tipo || 'adulto'}
                                    modoEdicionPosicion={modoEdicionPosicion}
                                    modoDibujo={modoDibujo}
                                    herramientaDibujo={herramientaDibujo}
                                    colorDibujo={colorDibujo}
                                    grosorDibujo={grosorDibujo}
                                    mostrarGrid={mostrarGrid}
                                    dibujos={dibujos}
                                    setDibujos={(d) => { setDibujos(d); setTieneCambios(true); }}
                                    configuracionDientes={configuracionDientes}
                                    onConfigChangeStart={guardarEnHistorial}
                                    setConfiguracionDientes={(c) => { setConfiguracionDientes(c); setTieneCambios(true); }}
                                    onUpdateSimboloTransform={(id, t) => { handleUpdateSimboloTransform(id, t); setTieneCambios(true); }}
                                    onDienteHover={handlePiezaHover}
                                    stageRef={stageRef}
                                />
                            </div>
                            </div>
                        </div>

                        {modoEditor ? (
                            simbologiaActiva && simbologiaActivaData && (
                                <div className="w-80 border-l bg-background flex flex-col shrink-0">
                                    <div className="p-3 border-b">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-10 h-10 bg-white rounded border flex items-center justify-center overflow-hidden"
                                                style={{ borderColor: obtenerHoverColorAplicacion(simbologiaActivaData) }}
                                            >
                                                <ImagenSimboloTintada
                                                    base64={simbologiaActivaData.imagen_base64}
                                                    color={obtenerColorAplicacion(simbologiaActivaData)}
                                                    alt={simbologiaActivaData.nombre}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{simbologiaActivaData.nombre}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                className="w-4 h-4 rounded border border-gray-300 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: obtenerHoverColorAplicacion(simbologiaActivaData) }}
                                                                title="Cambiar color de resaltado"
                                                            />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-2">
                                                            <HexColorPicker
                                                                color={obtenerHoverColorAplicacion(simbologiaActivaData)}
                                                                onChange={(c) => handleCambiarColorSimbologiaAplicada(simbologiaActiva as string, c)}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    {simbologiaActivaData.categoria !== 'CONDICION_HALLAZGO' && simbologiaActivaData.color_secundario && (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant={(simbologiaActivaData.estado || 'POR_REALIZAR') === 'POR_REALIZAR' ? 'default' : 'outline'}
                                                                className="h-7 px-2 text-[11px]"
                                                                onClick={() => handleCambiarEstadoTratamiento(simbologiaActiva, 'POR_REALIZAR')}
                                                            >
                                                                Por Realizar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={simbologiaActivaData.estado === 'REALIZADO' ? 'default' : 'outline'}
                                                                className="h-7 px-2 text-[11px]"
                                                                onClick={() => handleCambiarEstadoTratamiento(simbologiaActiva, 'REALIZADO')}
                                                            >
                                                                Realizado
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {obtenerColorAplicacion(simbologiaActivaData)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 space-y-3">
                                        {modoAsignacion ? (
                                            <>
                                                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                                                    <Hand className="h-4 w-4 text-primary animate-pulse" />
                                                    <span className="text-sm text-primary font-medium">
                                                        Modo asignación activo
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Haz clic en las partes de los dientes para marcarlas
                                                </p>
                                                <div className="text-sm">
                                                    <span className="font-medium">Partes seleccionadas: </span>
                                                    <span className="text-primary">
                                                        {piezasSeleccionadas.reduce((acc, p) => acc + p.partes.length, 0)}
                                                    </span>
                                                </div>
                                                <Button onClick={handleTerminarAsignacion} className="w-full">
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Terminar Asignación
                                                </Button>
                                            </>
                                        ) : (
                                            <Button onClick={handleIniciarAsignacion} className="w-full" variant="outline">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Asignar Piezas
                                            </Button>
                                        )}
                                    </div>
                                    {piezasDeSimbolgia.length > 0 && !modoAsignacion && (
                                        <div className="flex-1 overflow-hidden border-t">
                                            <div className="p-3 pb-0">
                                                <p className="text-sm font-medium">Piezas Asignadas</p>
                                            </div>
                                            <ScrollArea className="h-full max-h-[300px] px-3 pb-3">
                                                <Accordion type="multiple" className="w-full">
                                                    {piezasDeSimbolgia.map((pieza) => {
                                                        const info = obtenerInfoDiente(pieza.numero_pieza);
                                                        return (
                                                            <AccordionItem key={pieza.numero_pieza} value={`pieza-${pieza.numero_pieza}`}>
                                                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold">{pieza.numero_pieza}</span>
                                                                        <span className="text-muted-foreground">-</span>
                                                                        <span>{info.nombre}</span>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pb-2">
                                                                    <div className="space-y-1 pl-2">
                                                                        <p className="text-xs text-muted-foreground mb-2">
                                                                            {info.cuadrante} • {info.tipo.charAt(0).toUpperCase() + info.tipo.slice(1)}
                                                                        </p>
                                                                        <p className="text-xs font-medium">Caras seleccionadas:</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {pieza.partes.map(parte => (
                                                                                <span
                                                                                    key={parte}
                                                                                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                                                                                >
                                                                                    {obtenerNombreCara(parte)}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>

                                                            </AccordionItem>
                                                        );
                                                    })}
                                                </Accordion>
                                            </ScrollArea>
                                        </div>
                                    )}

                                    <div className="mt-auto p-3 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-destructive hover:text-destructive"
                                            onClick={() => handleEliminarSimbologia(simbologiaActiva)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar Simbología
                                        </Button>
                                    </div>
                                </div>
                            )
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
            <SelectorSimbologia
                abierto={selectorAbierto}
                onCerrar={() => setSelectorAbierto(false)}
                simbolos={simbolos}
                onSeleccionar={handleAgregarSimbologia}
                onCrearNuevo={() => setEditorAbierto(true)}
            />
            <EditorSimbolo
                abierto={editorAbierto}
                onCerrar={() => setEditorAbierto(false)}
                onGuardar={handleGuardarSimbolo}
            />
            <Dialog open={dialogoNuevaVersionAbierto} onOpenChange={setDialogoNuevaVersionAbierto}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Versión</DialogTitle>
                        <DialogDescription>
                            Configura cómo quieres iniciar la nueva versión del odontograma.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <Label className="text-base font-medium">Contenido Inicial</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div 
                                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer hover:bg-secondary/50 transition-all ${opcionesNuevaVersion.clonar ? 'border-primary bg-primary/5' : 'border-dashed'} ${ (_odontograma?.tipo === 'adulto' && opcionesNuevaVersion.tipo === 'nino') ? 'opacity-40 grayscale cursor-not-allowed' : '' }`}
                                    onClick={() => {
                                        if (_odontograma?.tipo === 'adulto' && opcionesNuevaVersion.tipo === 'nino') return;
                                        setOpcionesNuevaVersion(prev => ({ ...prev, clonar: true }))
                                    }}
                                >
                                    <Copy className={`h-8 w-8 ${opcionesNuevaVersion.clonar ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <span className="font-medium text-sm">Copiar Anterior</span>
                                    {opcionesNuevaVersion.clonar && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                                <div 
                                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer hover:bg-secondary/50 transition-all ${!opcionesNuevaVersion.clonar ? 'border-primary bg-primary/5' : 'border-dashed'}`}
                                    onClick={() => setOpcionesNuevaVersion(prev => ({ ...prev, clonar: false }))}
                                >
                                    <FilePlus className={`h-8 w-8 ${!opcionesNuevaVersion.clonar ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <span className="font-medium text-sm">Desde Cero</span>
                                    {!opcionesNuevaVersion.clonar && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base font-medium">Tipo de Odontograma</Label>
                            <Select 
                                value={opcionesNuevaVersion.tipo} 
                                onValueChange={(val: 'adulto' | 'nino') => {
                                    const tipoActual = _odontograma?.tipo || 'adulto';
                                    let clonar = opcionesNuevaVersion.clonar;
                                    if (tipoActual === 'adulto' && val === 'nino') {
                                        clonar = false;
                                    }
                                    setOpcionesNuevaVersion(prev => ({ ...prev, tipo: val, clonar }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="adulto">Adulto (32 Piezas)</SelectItem>
                                    <SelectItem value="nino">Niño / Temporal (20 Piezas)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                El tipo determina la cantidad y forma de las piezas dentales que se mostrarán.
                            </p>
                            {_odontograma?.tipo === 'adulto' && opcionesNuevaVersion.tipo === 'nino' && (
                                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20">
                                    <strong>Atención:</strong> Al cambiar de esquema Adulto a Niño, no es posible conservar los hallazgos previos debido a la incompatibilidad de piezas. Se iniciará un odontograma en blanco.
                                </div>
                            )}
                            {_odontograma?.tipo === 'nino' && opcionesNuevaVersion.tipo === 'adulto' && opcionesNuevaVersion.clonar && (
                                <div className="p-3 bg-yellow-500/10 text-yellow-700 text-xs rounded-md border border-yellow-500/20">
                                    <strong>Aviso:</strong> Al pasar de Niño a Adulto conservando datos, solo se mantendrán las referencias compatibles. Revise los hallazgos después de crear la versión.
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogoNuevaVersionAbierto(false)}>Cancelar</Button>
                        <Button onClick={crearNuevaVersion}>Crear Versión</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={dialogoCambiosSinGuardarAbierto} onOpenChange={setDialogoCambiosSinGuardarAbierto}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {accionPendiente === 'vista' ? '¿Salir sin guardar?' : '¿Descartar cambios?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {accionPendiente === 'vista' 
                                ? "Algunos cambios no se guardarán. Si cambias a modo vista ahora, se perderán los cambios no guardados."
                                : "Tienes cambios no guardados en el odontograma. Si sales ahora, se perderán."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            setDialogoCambiosSinGuardarAbierto(false);
                            if (accionPendiente === 'vista') {
                                setModoEditor(false); 
                                setModoAsignacion(false); 
                                setSimbologiaActiva(null);
                                setPiezasSeleccionadas([]);
                                setModoDibujo(false);
                                setModoEdicionPosicion(false);
                                setTieneCambios(false);
                                cargarDatos();
                            } else {
                                onCerrar();
                            }
                            setAccionPendiente(null);
                        }}
                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Salir sin guardar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
