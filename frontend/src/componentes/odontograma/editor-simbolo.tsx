import { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Line, Image, Group, Circle, Rect } from 'react-konva';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/componentes/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/componentes/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/componentes/ui/alert-dialog';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Pencil, Eraser, Trash2, Save, Loader2, Undo, Redo, ZoomIn, ZoomOut, RefreshCcw, Wand2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import '@/componentes/ui/color-picker.css';
import { toast } from '@/hooks/use-toast';

interface EditorSimboloProps {
    abierto: boolean;
    onCerrar: () => void;
    onGuardar: (datos: {
        nombre: string;
        descripcion?: string;
        imagen_base64: string;
        datos_canvas?: { objetos: ObjetoCanvas[] };
        categoria?: 'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO';
        color_primario: string;
        color_secundario?: string | null;
    }) => Promise<void>;
    simboloEditar?: {
        id: number;
        nombre: string;
        descripcion?: string;
        imagen_base64: string;
        datos_canvas?: { objetos: ObjetoCanvas[] };
        categoria?: 'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO';
        color_primario?: string;
        color_secundario?: string | null;
    };
}

interface ObjetoCanvas {
    puntos?: number[];
    color?: string;
    grosor?: number;
    modo: 'draw' | 'erase' | 'erase-magic';
    tipo?: 'imagen';
    imagen?: string;
    x?: number;
    y?: number;
    ancho?: number;
    alto?: number;
    eliminar_fondo?: boolean;
}

const getDistanciaPuntoImagen = (px: number, py: number, imgX: number, imgY: number, imgW: number, imgH: number) => {
    return px >= imgX && px <= imgX + imgW && py >= imgY && py <= imgY + imgH;
};

const getDistanciaPuntoSegmento = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

export function EditorSimbolo({ abierto, onCerrar, onGuardar, simboloEditar }: EditorSimboloProps) {
    const IDS = {
        dialog: 'config-catalogos-simbologia-editor-dialog',

        tabCreacion: 'config-catalogos-simbologia-editor-tab-creacion',
        tabDescripcion: 'config-catalogos-simbologia-editor-tab-descripcion',

        inputNombre: 'config-catalogos-simbologia-editor-nombre',
        btnHerrPincel: 'config-catalogos-simbologia-editor-herr-pincel',
        btnHerrBorrador: 'config-catalogos-simbologia-editor-herr-borrador',
        btnHerrBorradorMagico: 'config-catalogos-simbologia-editor-herr-borrador-magico',

        sliderGrosor: 'config-catalogos-simbologia-editor-grosor',

        seccionCategoria: 'config-catalogos-simbologia-editor-seccion-categoria',
        btnCategoria: 'config-catalogos-simbologia-editor-btn-categoria',

        seccionColores: 'config-catalogos-simbologia-editor-seccion-colores',
        btnColorPrincipal: 'config-catalogos-simbologia-editor-color-principal',
        btnColorSecundario: 'config-catalogos-simbologia-editor-color-secundario',

        textareaDescripcion: 'config-catalogos-simbologia-editor-descripcion',

        btnDeshacer: 'config-catalogos-simbologia-editor-deshacer',
        btnRehacer: 'config-catalogos-simbologia-editor-rehacer',
        btnLimpiar: 'config-catalogos-simbologia-editor-limpiar',

        btnZoomMenos: 'config-catalogos-simbologia-editor-zoom-menos',
        btnZoomMas: 'config-catalogos-simbologia-editor-zoom-mas',
        btnZoomReset: 'config-catalogos-simbologia-editor-zoom-reset',

        contenedorLienzo: 'config-catalogos-simbologia-editor-lienzo',

        btnCancelar: 'config-catalogos-simbologia-editor-cancelar',
        btnGuardar: 'config-catalogos-simbologia-editor-guardar',

        dialogSalirSinGuardar: 'config-catalogos-simbologia-editor-dialog-salir',
        btnSalirSinGuardar: 'config-catalogos-simbologia-editor-btn-salir-sin-guardar',
        btnContinuarEditando: 'config-catalogos-simbologia-editor-btn-continuar-editando',

        dialogLimpiar: 'config-catalogos-simbologia-editor-dialog-limpiar',
        btnConfirmarLimpiar: 'config-catalogos-simbologia-editor-btn-limpiar-confirmar',
        btnCancelarLimpiar: 'config-catalogos-simbologia-editor-btn-limpiar-cancelar',
    } as const;

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState<'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO'>('TRATAMIENTO_PATOLOGIA');
    const [colorPrincipal, setColorPrincipal] = useState('#0000FF');
    const [colorSecundario, setColorSecundario] = useState<string | null>('#FF0000');
    const [mostrarColorPickerPrincipal, setMostrarColorPickerPrincipal] = useState(false);
    const [mostrarColorPickerSecundario, setMostrarColorPickerSecundario] = useState(false);
    const [grosor, setGrosor] = useState(5);
    const [herramienta, setHerramienta] = useState<'pencil' | 'eraser' | 'eraser-magic'>('pencil');
    const [zoom, setZoom] = useState(1);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [mostrarCursor, setMostrarCursor] = useState(false);

    const [objetos, setObjetos] = useState<ObjetoCanvas[]>([]);
    const [objetosIniciales, setObjetosIniciales] = useState<ObjetoCanvas[]>([]);
    const [nombreInicial, setNombreInicial] = useState('');
    const [descripcionInicial, setDescripcionInicial] = useState('');
    const [categoriaInicial, setCategoriaInicial] = useState<'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO'>('TRATAMIENTO_PATOLOGIA');
    const [colorPrincipalInicial, setColorPrincipalInicial] = useState('#0000FF');
    const [colorSecundarioInicial, setColorSecundarioInicial] = useState<string | null>('#FF0000');
    const [historialDeshacer, setHistorialDeshacer] = useState<ObjetoCanvas[][]>([]);
    const [historialRehacer, setHistorialRehacer] = useState<ObjetoCanvas[][]>([]);
    const [dibujando, setDibujando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [dialogoConfirmarSalir, setDialogoConfirmarSalir] = useState(false);
    const [dialogoConfirmarLimpiar, setDialogoConfirmarLimpiar] = useState(false);
    const [imagenBase, setImagenBase] = useState<HTMLImageElement | null>(null);

    const stageRef = useRef<any>(null);

    const hayCambios = useCallback(() => {
        return nombre !== nombreInicial ||
            descripcion !== descripcionInicial ||
            categoria !== categoriaInicial ||
            colorPrincipal !== colorPrincipalInicial ||
            colorSecundario !== colorSecundarioInicial ||
            JSON.stringify(objetos) !== JSON.stringify(objetosIniciales);
    }, [nombre, nombreInicial, descripcion, descripcionInicial, categoria, categoriaInicial, colorPrincipal, colorPrincipalInicial, colorSecundario, colorSecundarioInicial, objetos, objetosIniciales]);

    useEffect(() => {
        if (abierto) {
            if (simboloEditar) {
                setNombre(simboloEditar.nombre);
                setDescripcion(simboloEditar.descripcion || '');
                setNombreInicial(simboloEditar.nombre);
                setDescripcionInicial(simboloEditar.descripcion || '');

                const cat = simboloEditar.categoria || 'TRATAMIENTO_PATOLOGIA';
                setCategoria(cat);
                setCategoriaInicial(cat);

                const principal = simboloEditar.color_primario || (cat === 'CONDICION_HALLAZGO' ? '#000000' : '#0000FF');
                const secundario = cat === 'TRATAMIENTO_PATOLOGIA'
                    ? (simboloEditar.color_secundario ?? '#FF0000')
                    : null;
                setColorPrincipal(principal);
                setColorPrincipalInicial(principal);
                setColorSecundario(secundario);
                setColorSecundarioInicial(secundario);

                let datosCanvas = simboloEditar.datos_canvas;
                if (typeof datosCanvas === 'string') {
                    try {
                        datosCanvas = JSON.parse(datosCanvas);
                    } catch (e) {
                        console.error('Error al parsear datos_canvas:', e);
                        datosCanvas = undefined;
                    }
                }

                if (datosCanvas && (datosCanvas as any).objetos && Array.isArray((datosCanvas as any).objetos) && (datosCanvas as any).objetos.length > 0) {
                    const objetosCargados: ObjetoCanvas[] = (datosCanvas as any).objetos;
                    const objetosNormalizados = objetosCargados.map(obj => {
                        if (obj.tipo === 'imagen') return obj;
                        if (obj.modo !== 'draw') return obj;
                        return { ...obj, color: principal };
                    });
                    setObjetos(objetosNormalizados);
                    setObjetosIniciales(objetosNormalizados);
                    setImagenBase(null);
                } else {
                    setObjetos([]);
                    setObjetosIniciales([]);
                    if (simboloEditar.imagen_base64) {
                        const img = new window.Image();
                        img.onload = () => {
                            setImagenBase(img);
                            if (simboloEditar.id) {
                                toast({
                                    title: "Edición de imagen plana",
                                    description: "Este símbolo antiguo no tiene trazos editables. El borrador mágico no estará disponible.",
                                    variant: "default", 
                                });
                            }
                        };
                        const src = simboloEditar.imagen_base64.startsWith('data:') 
                                    ? simboloEditar.imagen_base64 
                                    : `data:image/png;base64,${simboloEditar.imagen_base64}`;
                        img.src = src;
                    } else {
                        setImagenBase(null);
                    }
                }
            } else {
                setNombre('');
                setDescripcion('');
                setNombreInicial('');
                setDescripcionInicial('');
                setCategoria('TRATAMIENTO_PATOLOGIA');
                setCategoriaInicial('TRATAMIENTO_PATOLOGIA');
                setColorPrincipal('#0000FF');
                setColorPrincipalInicial('#0000FF');
                setColorSecundario('#FF0000');
                setColorSecundarioInicial('#FF0000');
                setObjetos([]);
                setObjetosIniciales([]);
                setImagenBase(null);
            }
            setHistorialDeshacer([]);
            setHistorialRehacer([]);
            setMostrarColorPickerPrincipal(false);
            setMostrarColorPickerSecundario(false);
            setGrosor(5);
            setZoom(1);
        }
    }, [abierto, simboloEditar]);

    useEffect(() => {
        setObjetos(prev => prev.map(obj => {
            if (obj.tipo === 'imagen') return obj;
            if (obj.modo !== 'draw') return obj;
            return { ...obj, color: colorPrincipal };
        }));
    }, [colorPrincipal]);

    const toggleCategoria = () => {
        setCategoria(prev => {
            const next = prev === 'TRATAMIENTO_PATOLOGIA' ? 'CONDICION_HALLAZGO' : 'TRATAMIENTO_PATOLOGIA';
            if (next === 'CONDICION_HALLAZGO') {
                setColorSecundario(null);
                if (!colorPrincipal) setColorPrincipal('#000000');
            } else {
                if (!colorPrincipal) setColorPrincipal('#0000FF');
                if (!colorSecundario) setColorSecundario('#FF0000');
            }
            return next;
        });
    };

    const guardarEstadoHistorial = useCallback(() => {
        setHistorialDeshacer(prev => [...prev, [...objetos]]);
        setHistorialRehacer([]);
    }, [objetos]);

    const deshacer = () => {
        if (historialDeshacer.length === 0) return;
        const nuevoHistorial = [...historialDeshacer];
        const estadoAnterior = nuevoHistorial.pop()!;
        setHistorialRehacer(prev => [...prev, [...objetos]]);
        setHistorialDeshacer(nuevoHistorial);
        setObjetos(estadoAnterior);
    };

    const rehacer = () => {
        if (historialRehacer.length === 0) return;
        const nuevoHistorial = [...historialRehacer];
        const estadoSiguiente = nuevoHistorial.pop()!;
        setHistorialDeshacer(prev => [...prev, [...objetos]]);
        setHistorialRehacer(nuevoHistorial);
        setObjetos(estadoSiguiente);
    };

    const getPosicionPuntero = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return null;
        const pointer = stage.getPointerPosition();
        if (!pointer) return null;
        
        return {
            x: pointer.x / zoom,
            y: pointer.y / zoom,
        };
    }, [zoom]);

    const borrarMagico = useCallback((pos: { x: number; y: number }) => {
        const umbral = Math.max(grosor * 5, 20);
        setObjetos(prev => prev.filter(obj => {
            if (obj.tipo === 'imagen' && obj.x !== undefined && obj.y !== undefined && obj.ancho !== undefined && obj.alto !== undefined) {
                 const dentro = getDistanciaPuntoImagen(pos.x, pos.y, obj.x, obj.y, obj.ancho, obj.alto);
                 return !dentro;
            }
            const puntos = obj.puntos || [];
            for (let i = 0; i < puntos.length; i += 2) {
                const dx = puntos[i] - pos.x;
                const dy = puntos[i + 1] - pos.y;
                if (Math.sqrt(dx * dx + dy * dy) <= umbral) {
                    return false;
                }
            }

            for (let i = 0; i < puntos.length - 2; i += 2) {
                const dist = getDistanciaPuntoSegmento(
                    pos.x, pos.y,
                    puntos[i], puntos[i+1],
                    puntos[i+2], puntos[i+3]
                );
                
                if (dist <= umbral) {
                    return false;
                }
            }
            return true;
        }));
    }, [grosor]);

    const handleMouseDown = () => {
        const pos = getPosicionPuntero();
        if (!pos) return;

        if (herramienta === 'eraser-magic') {
            guardarEstadoHistorial();
            borrarMagico(pos);
            setDibujando(true);
            return;
        }

        guardarEstadoHistorial();
        setDibujando(true);
        const esEraser = herramienta === 'eraser';
        const modo: ObjetoCanvas['modo'] = esEraser ? 'erase' : 'draw';
        const grosorFinal = esEraser ? grosor * 1.6 : grosor;

        const nuevoObjeto: ObjetoCanvas = {
            puntos: [pos.x, pos.y, pos.x, pos.y],
            color: esEraser ? '#000000' : colorPrincipal,
            grosor: grosorFinal,
            modo,
        };

        setObjetos(prev => [...prev, nuevoObjeto]);
    };

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        if (stage) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
                const x = pointer.x / zoom;
                const y = pointer.y / zoom;
                setCursorPos({ x, y });

                if (!dibujando) return;

                if (herramienta === 'eraser-magic') {
                    borrarMagico({ x, y });
                    return;
                }

                setObjetos(prev => {
                    const ultimo = prev[prev.length - 1];
                    if (!ultimo) return prev;
                    
                    const puntosActuales = ultimo.puntos || [];
                    const nuevosPuntos = [...puntosActuales, x, y];
                    return [...prev.slice(0, -1), { ...ultimo, puntos: nuevosPuntos }];
                });
            }
        }
    };

    const handleMouseUp = () => {
        setDibujando(false);
    };

    const limpiarCanvas = () => {
        guardarEstadoHistorial();
        setObjetos([]);
        setImagenBase(null);
        setDialogoConfirmarLimpiar(false);
    };

    const ajustarZoom = (delta: number) => {
        setZoom(prev => {
            const nuevo = Math.max(0.5, Math.min(3, parseFloat((prev + delta).toFixed(2))));
            return nuevo;
        });
    };

    const resetZoom = () => setZoom(1);

    const handleGuardar = async () => {
        if (!nombre.trim()) {
            toast({
                title: 'Error',
                description: 'El nombre del símbolo es obligatorio',
                variant: 'destructive',
            });
            return;
        }

        if (!stageRef.current) return;

        setGuardando(true);
        try {
            const stage = stageRef.current;
            const escalaOriginal = stage.scaleX();
            const posicionOriginal = stage.position();
            
            stage.scale({ x: 1, y: 1 });
            stage.position({ x: 0, y: 0 });
            
            const dataUrl = stage.toDataURL({ pixelRatio: 2 });
            
            stage.scale({ x: escalaOriginal, y: escalaOriginal });
            stage.position(posicionOriginal);

            const base64 = dataUrl.split(',')[1];

            await onGuardar({
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || undefined,
                imagen_base64: base64,
                datos_canvas: { objetos },
                categoria,
                color_primario: colorPrincipal,
                color_secundario: categoria === 'TRATAMIENTO_PATOLOGIA' ? (colorSecundario || '#FF0000') : null,
            });

            toast({
                title: 'Símbolo guardado',
                description: 'El símbolo se guardó correctamente',
            });

            onCerrar();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo guardar el símbolo',
                variant: 'destructive',
            });
        } finally {
            setGuardando(false);
        }
    };

    const handleIntentarCerrar = () => {
        if (hayCambios()) {
            setDialogoConfirmarSalir(true);
        } else {
            onCerrar();
        }
    };

    const handleConfirmarSalir = () => {
        setDialogoConfirmarSalir(false);
        onCerrar();
    };

    return (
        <>
            <Dialog open={abierto} onOpenChange={(open) => !open && handleIntentarCerrar()}>
                <DialogContent id={IDS.dialog} className="max-w-5xl w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
                        <DialogTitle className="text-xl text-center">
                            {simboloEditar ? 'Editar Símbolo' : 'Crear Nuevo Símbolo'}
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Dibuja o ajusta la simbología odontológica y guarda la versión final.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 flex flex-col md:flex-row">
                        <div className="w-full md:w-80 h-[40vh] md:h-full border-b md:border-b-0 md:border-r bg-secondary/20 flex-shrink-0 flex flex-col z-10">
                            <Tabs defaultValue="creacion" className="w-full flex flex-col h-full">
                                <div className="p-4 flex-shrink-0 border-b">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger id={IDS.tabCreacion} value="creacion">Creación</TabsTrigger>
                                        <TabsTrigger id={IDS.tabDescripcion} value="descripcion">Descripción</TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                     <TabsContent value="creacion" className="h-full p-4 space-y-4 overflow-y-auto m-0">
                                        <div className="space-y-2">
                                            <Label htmlFor={IDS.inputNombre} className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Nombre del Símbolo</Label>
                                            <Input
                                                id={IDS.inputNombre}
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                placeholder="Ej: Caries, Corona..."
                                                maxLength={100}
                                                className={`h-9 transition-all duration-300 ${!nombre.trim() ? "border-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]" : ""}`}
                                            />
                                        </div>

                                        <div id={IDS.seccionCategoria} className="space-y-2">
                                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Categoría</p>
                                            <Button
                                                id={IDS.btnCategoria}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start h-9"
                                                onClick={toggleCategoria}
                                            >
                                                {categoria === 'TRATAMIENTO_PATOLOGIA' ? 'Tratamiento / Patología' : 'Condición / Hallazgo'}
                                            </Button>
                                        </div>

                                        <div id={IDS.seccionColores} className="space-y-2">
                                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Colores</p>
                                            <div className="space-y-3">
                                                <div className="space-y-1 relative">
                                                    <Label className="text-xs">
                                                        {categoria === 'TRATAMIENTO_PATOLOGIA' ? 'Realizado' : 'Hallazgo'}
                                                    </Label>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            id={IDS.btnColorPrincipal}
                                                            type="button"
                                                            onClick={() => setMostrarColorPickerPrincipal(v => !v)}
                                                            className="w-10 h-10 rounded border-2 border-border hover:border-primary transition-colors flex-shrink-0 shadow-sm"
                                                            style={{ backgroundColor: colorPrincipal }}
                                                            title="Color principal"
                                                        />
                                                        {mostrarColorPickerPrincipal && (
                                                            <div className="absolute bottom-full left-0 mb-2 z-50">
                                                                <div className="fixed inset-0 z-40" onClick={() => setMostrarColorPickerPrincipal(false)} />
                                                                <div className="relative z-50 bg-popover rounded-lg shadow-lg border p-2">
                                                                    <HexColorPicker
                                                                        color={colorPrincipal}
                                                                        onChange={setColorPrincipal}
                                                                        style={{ width: 240, height: 170 }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <Input
                                                            value={colorPrincipal}
                                                            onChange={(e) => setColorPrincipal(e.target.value)}
                                                            className="flex-1"
                                                            placeholder={categoria === 'TRATAMIENTO_PATOLOGIA' ? '#0000FF' : '#000000'}
                                                        />
                                                    </div>
                                                </div>

                                                {categoria === 'TRATAMIENTO_PATOLOGIA' && (
                                                    <div className="space-y-1 relative">
                                                        <Label className="text-xs">Por Realizar</Label>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                id={IDS.btnColorSecundario}
                                                                type="button"
                                                                onClick={() => setMostrarColorPickerSecundario(v => !v)}
                                                                className="w-10 h-10 rounded border-2 border-border hover:border-primary transition-colors flex-shrink-0 shadow-sm"
                                                                style={{ backgroundColor: colorSecundario || '#FF0000' }}
                                                                title="Color secundario"
                                                            />
                                                            {mostrarColorPickerSecundario && (
                                                                <div className="absolute bottom-full left-0 mb-2 z-50">
                                                                    <div className="fixed inset-0 z-40" onClick={() => setMostrarColorPickerSecundario(false)} />
                                                                    <div className="relative z-50 bg-popover rounded-lg shadow-lg border p-2">
                                                                        <HexColorPicker
                                                                            color={colorSecundario || '#FF0000'}
                                                                            onChange={(c) => setColorSecundario(c)}
                                                                            style={{ width: 240, height: 170 }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <Input
                                                                value={colorSecundario || ''}
                                                                onChange={(e) => setColorSecundario(e.target.value || null)}
                                                                className="flex-1"
                                                                placeholder="#FF0000"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Herramienta</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                <Button
                                                    id={IDS.btnHerrPincel}
                                                    variant={herramienta === 'pencil' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="justify-start h-9"
                                                    onClick={() => setHerramienta('pencil')}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Pincel
                                                </Button>
                                                <Button
                                                    id={IDS.btnHerrBorrador}
                                                    variant={herramienta === 'eraser' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="justify-start h-9"
                                                    onClick={() => setHerramienta('eraser')}
                                                >
                                                    <Eraser className="h-4 w-4 mr-2" />
                                                    Borrador normal
                                                </Button>
                                                <Button
                                                    id={IDS.btnHerrBorradorMagico}
                                                    variant={herramienta === 'eraser-magic' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="justify-start h-9"
                                                    onClick={() => setHerramienta('eraser-magic')}
                                                    disabled={!!imagenBase && objetos.length === 0}
                                                    title={!!imagenBase && objetos.length === 0 ? "No disponible en imágenes planas" : "Borrar trazos completos"}
                                                >
                                                    <Wand2 className="h-4 w-4 mr-2" />
                                                    Borrador mágico
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Grosor</p>
                                                <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono">{grosor}px</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded border-2 border-border flex-shrink-0 shadow-sm"
                                                    style={{ backgroundColor: colorPrincipal }}
                                                    title="El pincel usa el color principal"
                                                />
                                                <div className="flex-1">
                                                    <input
                                                        id={IDS.sliderGrosor}
                                                        type="range"
                                                        value={grosor}
                                                        onChange={(e) => setGrosor(Number(e.target.value))}
                                                        min={1}
                                                        max={30}
                                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary bg-secondary"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="descripcion" className="h-full p-4 m-0 flex flex-col">
                                        <div className="h-full flex flex-col gap-2">
                                            <Label htmlFor={IDS.textareaDescripcion} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                Notas del Símbolo
                                            </Label>
                                            <div className="text-xs text-muted-foreground">
                                                Puedes agregar detalles sobre cuándo se debe usar este símbolo o qué representa clínicamente.
                                            </div>
                                            <Textarea
                                                id={IDS.textareaDescripcion}
                                                value={descripcion}
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                placeholder="Ej: Se utiliza para representar una caries incipiente en la cara vestibular..."
                                                maxLength={500}
                                                className="flex-1 resize-none text-sm"
                                            />
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden bg-background">
                            <div className="h-14 border-b flex items-center justify-between px-4 bg-background z-10 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Button id={IDS.btnDeshacer} variant="ghost" size="icon" onClick={deshacer} disabled={historialDeshacer.length === 0} title="Deshacer">
                                        <Undo className="h-4 w-4" />
                                    </Button>
                                    <Button id={IDS.btnRehacer} variant="ghost" size="icon" onClick={rehacer} disabled={historialRehacer.length === 0} title="Rehacer">
                                        <Redo className="h-4 w-4" />
                                    </Button>
                                    <div className="h-6 w-px bg-border mx-1" />
                                    <Button id={IDS.btnLimpiar} variant="ghost" size="icon" onClick={() => setDialogoConfirmarLimpiar(true)} title="Limpiar lienzo" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button id={IDS.btnZoomMenos} variant="outline" size="sm" onClick={() => ajustarZoom(-0.25)} disabled={zoom <= 0.5} className="h-8 w-8 p-0">
                                        <ZoomOut className="h-3 w-3" />
                                    </Button>
                                    <span className="text-xs font-medium w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
                                    <Button id={IDS.btnZoomMas} variant="outline" size="sm" onClick={() => ajustarZoom(0.25)} disabled={zoom >= 3} className="h-8 w-8 p-0">
                                        <ZoomIn className="h-3 w-3" />
                                    </Button>
                                    <Button id={IDS.btnZoomReset} variant="ghost" size="sm" onClick={resetZoom} className="h-8 w-8 p-0 ml-1" title="Restablecer zoom">
                                        <RefreshCcw className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-muted/10">
                                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                                    <div
                                        id={IDS.contenedorLienzo}
                                        className="border shadow-sm bg-white relative"
                                        style={{ width: 400 * zoom, height: 400 * zoom }}
                                    >
                                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />
                                        <Stage
                                            ref={stageRef}
                                            width={400 * zoom}
                                            height={400 * zoom}
                                            scaleX={zoom}
                                            scaleY={zoom}
                                            onMouseDown={handleMouseDown}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={handleMouseUp}
                                            onMouseEnter={() => setMostrarCursor(true)}
                                            onMouseLeave={() => { setMostrarCursor(false); handleMouseUp(); }}
                                            style={{ cursor: 'none' }}
                                        >
                                            <Layer>
                                                {imagenBase && !objetos.some(obj => obj.tipo === 'imagen' && obj.eliminar_fondo) && (
                                                    <Image image={imagenBase} width={400} height={400} listening={false} />
                                                )}
                                                {objetos.map((obj, i) => {
                                                    if (obj.tipo === 'imagen' && obj.imagen) {
                                                        const imageObj = new window.Image();
                                                        imageObj.src = obj.imagen.startsWith('data:') ? obj.imagen : `data:image/png;base64,${obj.imagen}`;
                                                        return (
                                                            <Group key={i} x={obj.x} y={obj.y} listening={false}>
                                                                <Rect width={obj.ancho} height={obj.alto} fill={colorPrincipal} />
                                                                <Image
                                                                    image={imageObj}
                                                                    width={obj.ancho}
                                                                    height={obj.alto}
                                                                    globalCompositeOperation="destination-in"
                                                                    opacity={1}
                                                                />
                                                            </Group>
                                                        );
                                                    }

                                                    return (
                                                        <Line
                                                            key={i}
                                                            points={obj.puntos}
                                                            stroke={obj.color}
                                                            strokeWidth={obj.grosor}
                                                            tension={0.5}
                                                            lineCap="round"
                                                            lineJoin="round"
                                                            globalCompositeOperation={obj.modo === 'erase' ? 'destination-out' : 'source-over'}
                                                        />
                                                    );
                                                })}
                                            </Layer>
                                            {mostrarCursor && (
                                                <Layer listening={false}>
                                                    <Group x={cursorPos.x} y={cursorPos.y}>
                                                        <Circle
                                                            radius={grosor / 2}
                                                            stroke="black"
                                                            strokeWidth={1 / zoom}
                                                            fill="rgba(0,0,0,0.1)"
                                                        />
                                                        <Line points={[-5 / zoom, 0, 5 / zoom, 0]} stroke="black" strokeWidth={1 / zoom} />
                                                        <Line points={[0, -5 / zoom, 0, 5 / zoom]} stroke="black" strokeWidth={1 / zoom} />
                                                    </Group>
                                                </Layer>
                                            )}
                                        </Stage>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t bg-background flex justify-end gap-3 z-10">
                                <Button id={IDS.btnCancelar} variant="outline" onClick={handleIntentarCerrar} disabled={guardando}>
                                    Cancelar
                                </Button>
                                <Button id={IDS.btnGuardar} onClick={handleGuardar} disabled={guardando}>
                                    {guardando ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Guardar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog open={dialogoConfirmarSalir} onOpenChange={setDialogoConfirmarSalir}>
                <AlertDialogContent id={IDS.dialogSalirSinGuardar}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel id={IDS.btnContinuarEditando}>Continuar editando</AlertDialogCancel>
                        <AlertDialogAction id={IDS.btnSalirSinGuardar} onClick={handleConfirmarSalir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Salir sin guardar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={dialogoConfirmarLimpiar} onOpenChange={setDialogoConfirmarLimpiar}>
                <AlertDialogContent id={IDS.dialogLimpiar}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Limpiar el lienzo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán todos los trazos del símbolo. Esta acción no se puede revertir fuera del botón Deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel id={IDS.btnCancelarLimpiar} onClick={() => setDialogoConfirmarLimpiar(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction id={IDS.btnConfirmarLimpiar} onClick={limpiarCanvas} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Limpiar todo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
