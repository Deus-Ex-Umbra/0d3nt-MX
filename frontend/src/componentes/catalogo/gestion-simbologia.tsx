import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Plus, Edit, Trash2, Loader2, Search, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { odontogramaApi } from '@/lib/api';
import { SimboloOdontograma } from '@/tipos';
import { EditorSimbolo } from '@/componentes/odontograma/editor-simbolo';
import { ImagenSimboloTintada } from '@/componentes/odontograma/imagen-simbolo-tintada';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/componentes/ui/alert-dialog';

type GestionSimbologiaProps = {
    seccionExpandida?: boolean;
    onCambiarSeccionExpandida?: (abierta: boolean) => void;
};

export function GestionSimbologia({
    seccionExpandida: seccionExpandidaControlada,
    onCambiarSeccionExpandida,
}: GestionSimbologiaProps) {
    const IDS = {
        raiz: 'config-catalogos-simbologia',
        toggle: 'config-catalogos-simbologia-toggle',
        contenido: 'config-catalogos-simbologia-contenido',
        btnAgregar: 'config-catalogos-simbologia-btn-agregar',
        inputBuscar: 'config-catalogos-simbologia-buscar',
        lista: 'config-catalogos-simbologia-lista',
        dialogPrevisualizar: 'config-catalogos-simbologia-dialog-previsualizar',
        dialogEliminar: 'config-catalogos-simbologia-dialog-eliminar',
        btnCancelarEliminar: 'config-catalogos-simbologia-btn-cancelar-eliminar',
        btnConfirmarEliminar: 'config-catalogos-simbologia-btn-confirmar-eliminar',
    } as const;

    const [simbolos, setSimbolos] = useState<SimboloOdontograma[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [editorAbierto, setEditorAbierto] = useState(false);
    const [simboloEditar, setSimboloEditar] = useState<SimboloOdontograma | undefined>(undefined);
    const [simboloEliminar, setSimboloEliminar] = useState<number | null>(null);
    const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
    const [simboloPrevisualizar, setSimboloPrevisualizar] = useState<SimboloOdontograma | null>(null);
    const [seccion_expandida_interna, setSeccionExpandidaInterna] = useState(false);
    const [simbolosExpandidos, setSimbolosExpandidos] = useState<Set<number>>(new Set());

    const seccion_expandida = seccionExpandidaControlada ?? seccion_expandida_interna;
    const setSeccionExpandida = onCambiarSeccionExpandida ?? setSeccionExpandidaInterna;

    const simbolosFiltrados = useMemo(() => {
        if (!busqueda.trim()) return simbolos;
        const busquedaLower = busqueda.toLowerCase();
        return simbolos.filter(s =>
            s.nombre.toLowerCase().includes(busquedaLower) ||
            (s.descripcion && s.descripcion.toLowerCase().includes(busquedaLower))
        );
    }, [simbolos, busqueda]);

    const toggleExpandirDescripcion = (id: number) => {
        const nuevos = new Set(simbolosExpandidos);
        if (nuevos.has(id)) {
            nuevos.delete(id);
        } else {
            nuevos.add(id);
        }
        setSimbolosExpandidos(nuevos);
    };

    const cargarSimbolos = async () => {
        setCargando(true);
        try {
            const data = await odontogramaApi.obtenerSimbolos();
            setSimbolos(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los símbolos',
                variant: 'destructive',
            });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarSimbolos();
    }, []);

    const handleGuardarSimbolo = async (datos: {
        nombre: string;
        descripcion?: string;
        imagen_base64: string;
        datos_canvas?: any;
        categoria?: 'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO';
        color_primario: string;
        color_secundario?: string | null;
    }) => {
        if (simboloEditar) {
            await odontogramaApi.actualizarSimbolo(simboloEditar.id, datos);
        } else {
            await odontogramaApi.crearSimbolo(datos);
        }
        await cargarSimbolos();
    };

    const handleAbrirEditar = (simbolo: SimboloOdontograma) => {
        setSimboloEditar(simbolo);
        setEditorAbierto(true);
    };

    const handleAbrirNuevo = () => {
        setSimboloEditar(undefined);
        setEditorAbierto(true);
    };

    const handleCerrarEditor = () => {
        setEditorAbierto(false);
        setSimboloEditar(undefined);
    };

    const handleConfirmarEliminar = async () => {
        if (simboloEliminar === null) return;

        try {
            await odontogramaApi.eliminarSimbolo(simboloEliminar);
            toast({
                title: 'Símbolo eliminado',
                description: 'El símbolo se eliminó correctamente',
            });
            await cargarSimbolos();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo eliminar el símbolo',
                variant: 'destructive',
            });
        } finally {
            setSimboloEliminar(null);
            setConfirmandoEliminar(false);
        }
    };

    return (
        <>
            <div id={IDS.raiz} className="space-y-4">
                <div className="flex items-center justify-between">
                    <div 
                        id={IDS.toggle}
                        className="flex items-center gap-2 cursor-pointer select-none"
                        onClick={() => setSeccionExpandida(!seccion_expandida)}
                    >
                         {seccion_expandida ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                          )}
                        <div>
                            <h3 className="text-lg font-semibold">Simbología Odontológica</h3>
                            <p className="text-sm text-muted-foreground">
                                Símbolos para marcar condiciones dentales en el odontograma
                            </p>
                        </div>
                    </div>
                    <Button id={IDS.btnAgregar} onClick={handleAbrirNuevo} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                    </Button>
                </div>

                {seccion_expandida && (
                    <div id={IDS.contenido}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id={IDS.inputBuscar}
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar simbología por nombre..."
                                className="pl-10 h-11 text-base"
                            />
                        </div>
                        <Card>
                            <CardContent className="pt-4">
                                {cargando ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : simbolosFiltrados.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {busqueda ? (
                                            <>
                                                <p>No se encontraron símbolos con "{busqueda}"</p>
                                                <Button variant="link" onClick={() => setBusqueda('')}>
                                                    Limpiar búsqueda
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <p>No hay símbolos creados.</p>
                                                <p className="text-sm">Haz clic en "Nuevo Símbolo" para crear uno.</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <ScrollArea id={IDS.lista} className="h-[350px]">
                                        <div className="space-y-3">
                                            {simbolosFiltrados.map((simbolo) => (
                                                <div
                                                    key={simbolo.id}
                                                    className="flex flex-col border rounded-lg hover:border-primary hover:shadow-md transition-all bg-card overflow-hidden"
                                                >
                                                    <div className="flex w-full items-center gap-3 p-3">
                                                        <div className="flex-shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSimboloPrevisualizar(simbolo)}
                                                                className="w-16 h-16 rounded-md border bg-white overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all flex items-center justify-center p-1"
                                                            >
                                                                <ImagenSimboloTintada
                                                                    base64={simbolo.imagen_base64}
                                                                    color={simbolo.color_hover || '#0000FF'}
                                                                    alt={simbolo.nombre}
                                                                    className="max-w-full max-h-full object-contain"
                                                                />
                                                            </button>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <span className="font-medium text-sm block truncate" title={simbolo.nombre}>
                                                                {simbolo.nombre}
                                                            </span>
                                                        </div>

                                                        <div className="flex gap-1 flex-shrink-0 items-center">
                                                            {simbolo.descripcion && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground mr-1"
                                                                    onClick={() => toggleExpandirDescripcion(simbolo.id)}
                                                                    title={simbolosExpandidos.has(simbolo.id) ? "Ocultar descripción" : "Ver descripción"}
                                                                >
                                                                    {simbolosExpandidos.has(simbolo.id) ? 
                                                                        <ChevronUp className="h-4 w-4" /> : 
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    }
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={() => handleAbrirEditar(simbolo)}
                                                            >
                                                                <Edit className="h-3 w-3 mr-1" />
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-destructive hover:text-destructive"
                                                                onClick={() => {
                                                                    setSimboloEliminar(simbolo.id);
                                                                    setConfirmandoEliminar(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    {simbolosExpandidos.has(simbolo.id) && simbolo.descripcion && (
                                                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
                                                            <div className="bg-muted/30 p-3 rounded-md text-xs border border-border/50">
                                                                <p className="font-semibold mb-1 text-foreground/80">Descripción:</p>
                                                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{simbolo.descripcion}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <EditorSimbolo
                abierto={editorAbierto}
                onCerrar={handleCerrarEditor}
                onGuardar={handleGuardarSimbolo}
                simboloEditar={simboloEditar}
            />

            <Dialog open={!!simboloPrevisualizar} onOpenChange={(open) => !open && setSimboloPrevisualizar(null)}>
                <DialogContent id={IDS.dialogPrevisualizar} className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{simboloPrevisualizar?.nombre}</DialogTitle>
                    </DialogHeader>
                    {simboloPrevisualizar && (
                        <div className="flex justify-center">
                            <ImagenSimboloTintada
                                base64={simboloPrevisualizar.imagen_base64}
                                color={simboloPrevisualizar.color_hover || '#0000FF'}
                                alt={simboloPrevisualizar.nombre}
                                className="max-h-80 max-w-full object-contain rounded-lg border"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmandoEliminar} onOpenChange={setConfirmandoEliminar}>
                <AlertDialogContent id={IDS.dialogEliminar}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar símbolo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El símbolo será eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel id={IDS.btnCancelarEliminar} onClick={() => setSimboloEliminar(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction id={IDS.btnConfirmarEliminar} onClick={handleConfirmarEliminar}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
