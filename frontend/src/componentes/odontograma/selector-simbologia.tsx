import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Search, Plus, Check } from 'lucide-react';
import { SimboloOdontograma } from '@/tipos';
import { ImagenSimboloTintada } from './imagen-simbolo-tintada';
import { HexColorPicker } from 'react-colorful';
import { Label } from '@/componentes/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { useClinica } from '@/contextos/clinica-contexto';
import { MolarCuadrado } from './dientes/Molar-cuadrado';
import { MolarCircular } from './dientes/Molar-circular';

interface SelectorSimbologiaProps {
    abierto: boolean;
    onCerrar: () => void;
    simbolos: SimboloOdontograma[];
    onSeleccionar: (simbolo: SimboloOdontograma, colorResaltado: string) => void;
    onCrearNuevo: () => void;
}

export function SelectorSimbologia({
    abierto,
    onCerrar,
    simbolos,
    onSeleccionar,
    onCrearNuevo,
}: SelectorSimbologiaProps) {
    const { config_clinica } = useClinica();
    const modelo_dientes = (config_clinica as any)?.modelo_dientes_odontograma === 'circular' ? 'circular' : 'cuadrado';
    const [busqueda, setBusqueda] = useState('');
    const [simboloSeleccionado, setSimboloSeleccionado] = useState<SimboloOdontograma | null>(null);
    const [colorResaltado, setColorResaltado] = useState('#FF0000');
    const [previewPartes, setPreviewPartes] = useState<Set<string>>(() => new Set());
    const [previewParteHover, setPreviewParteHover] = useState<string | null>(null);
    const [previewSimboloHover, setPreviewSimboloHover] = useState(false);

    const ALPHA_HOVER_PARTE = '26';
    const ALPHA_MARCADO_FUERTE = 'B3';
    const ALPHA_HOVER_SIMBOLO = 'E6';
    const ALPHA_MARCADO_SUAVE = '1A';

    const conAlpha = (hex: string, alphaHex: string) => {
        const raw = (hex || '').trim();
        if (!raw.startsWith('#')) return hex;
        const h = raw.slice(1);
        const full = h.length === 3
            ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
            : h;
        if (full.length !== 6) return hex;
        return `#${full}${alphaHex}`;
    };

    const colorPartePreview = (parte: string) => {
        const estaMarcada = previewPartes.has(parte);
        const estaAfectadaPorSimbolo = previewPartes.has(parte);

        if (previewSimboloHover) {
            if (estaMarcada) return conAlpha(colorResaltado, ALPHA_MARCADO_FUERTE);
            if (previewParteHover === parte) return conAlpha(colorResaltado, ALPHA_HOVER_PARTE);
            if (estaAfectadaPorSimbolo) return conAlpha(colorResaltado, ALPHA_HOVER_SIMBOLO);
            return 'white';
        }

        if (previewParteHover === parte) return conAlpha(colorResaltado, ALPHA_HOVER_PARTE);
        if (estaMarcada) return conAlpha(colorResaltado, ALPHA_MARCADO_SUAVE);
        return 'white';
    };

    useEffect(() => {
        if (!abierto) return;
        setSimboloSeleccionado(null);
        setBusqueda('');
    }, [abierto]);

    const simbolosFiltrados = useMemo(() => {
        if (!busqueda.trim()) return simbolos;
        const busquedaLower = busqueda.toLowerCase();
        return simbolos.filter(s =>
            s.nombre.toLowerCase().includes(busquedaLower) ||
            (s.descripcion && s.descripcion.toLowerCase().includes(busquedaLower))
        );
    }, [simbolos, busqueda]);

    const handleSeleccionar = () => {
        if (simboloSeleccionado) {
            onSeleccionar(simboloSeleccionado, colorResaltado);
            setSimboloSeleccionado(null);
            setBusqueda('');
            onCerrar();
        }
    };

    const handleCrearNuevo = () => {
        onCrearNuevo();
    };

    return (
        <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
            <DialogContent id="dialog-selector-simbologia" className="max-w-5xl h-[85vh] flex flex-col p-6">
                <DialogHeader>
                    <DialogTitle>Agregar Simbología</DialogTitle>
                    <DialogDescription>
                        Selecciona una simbología para agregarla
                    </DialogDescription>
                </DialogHeader>
                <div className="relative shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="selector-simbologia-busqueda"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="pl-10"
                    />
                </div>
                <ScrollArea id="selector-simbologia-lista" className="flex-1 min-h-0 border rounded-lg bg-background/50">
                    {simbolosFiltrados.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                            <p>No se encontraron simbologías</p>
                            <Button variant="link" onClick={handleCrearNuevo} className="mt-2">
                                <Plus className="h-4 w-4 mr-1" />
                                Crear nueva simbología
                            </Button>
                        </div>
                    ) : (
                        <div id="selector-simbologia-grid" className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4">
                            {simbolosFiltrados.map((simbolo) => (
                                <button
                                    key={simbolo.id}
                                    onClick={() => {
                                        setSimboloSeleccionado(prev => {
                                            const next = prev?.id === simbolo.id ? null : simbolo;
                                                                    if (next) {
                                                                        setColorResaltado(next.color_hover || '#FF0000');
                                                                        setPreviewPartes(new Set());
                                                                    }
                                            return next;
                                        });
                                    }}
                                    className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all hover:border-primary/50 hover:shadow-md ${simboloSeleccionado?.id === simbolo.id
                                            ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                                            : 'border-transparent bg-secondary/10'
                                        }`}
                                >
                                    <div className="w-full aspect-square bg-white rounded border mb-2 flex items-center justify-center overflow-hidden p-1">
                                        <ImagenSimboloTintada
                                            base64={simbolo.imagen_base64}
                                            color={simbolo.color_hover || '#0000FF'}
                                            alt={simbolo.nombre}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-xs font-medium w-full truncate text-center" title={simbolo.nombre}>
                                        {simbolo.nombre}
                                    </span>
                                    {simboloSeleccionado?.id === simbolo.id && (
                                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {simboloSeleccionado && (
                    <div className="mt-3 p-3 rounded-lg border bg-secondary/10">
                        <div className="grid grid-cols-[auto,1fr] items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                    <Label className="text-xs text-muted-foreground">Resaltado</Label>
                                    <div className="text-sm font-medium truncate" title={simboloSeleccionado.nombre}>{simboloSeleccionado.nombre}</div>
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            className="w-9 h-9 rounded border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                            style={{ backgroundColor: colorResaltado }}
                                            title="Cambiar color de resaltado"
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2">
                                        <HexColorPicker className="w-40 h-32" color={colorResaltado} onChange={setColorResaltado} />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center justify-center gap-3 w-full">
                                <div className="flex flex-col items-center">
                                    {modelo_dientes === 'circular' ? (
                                      <MolarCircular
                                        baseSize={44}
                                        modoAsignacion={true}
                                        colores={{
                                            top: colorPartePreview('top'),
                                            left: colorPartePreview('left'),
                                            right: colorPartePreview('right'),
                                            bottom: colorPartePreview('bottom'),
                                            center: colorPartePreview('center'),
                                            'root-1': colorPartePreview('root-1'),
                                            'root-2': colorPartePreview('root-2'),
                                            'root-3': colorPartePreview('root-3'),
                                        }}
                                        eventos={{
                                            onClick: (parte) => {
                                                setPreviewPartes(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(parte)) next.delete(parte);
                                                    else next.add(parte);
                                                    return next;
                                                });
                                            },
                                            onEnter: (parte) => setPreviewParteHover(parte),
                                            onLeave: () => setPreviewParteHover(null),
                                        }}
                                      />
                                    ) : (
                                      <MolarCuadrado
                                        baseSize={44}
                                        modoAsignacion={true}
                                        colores={{
                                            top: colorPartePreview('top'),
                                            left: colorPartePreview('left'),
                                            right: colorPartePreview('right'),
                                            bottom: colorPartePreview('bottom'),
                                            center: colorPartePreview('center'),
                                            'root-1': colorPartePreview('root-1'),
                                            'root-2': colorPartePreview('root-2'),
                                            'root-3': colorPartePreview('root-3'),
                                        }}
                                        eventos={{
                                            onClick: (parte) => {
                                                setPreviewPartes(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(parte)) next.delete(parte);
                                                    else next.add(parte);
                                                    return next;
                                                });
                                            },
                                            onEnter: (parte) => setPreviewParteHover(parte),
                                            onLeave: () => setPreviewParteHover(null),
                                        }}
                                      />
                                    )}
                                    <span className="mt-1 text-[10px] text-muted-foreground">Selecciona partes</span>
                                </div>

                                <div
                                    className={
                                        'flex items-center justify-center ' +
                                        (previewSimboloHover ? 'scale-[1.03]' : '')
                                    }
                                    onMouseEnter={() => setPreviewSimboloHover(true)}
                                    onMouseLeave={() => setPreviewSimboloHover(false)}
                                    style={{ transition: 'transform 120ms ease' }}
                                    title="Pasa por la simbología para ver intensidad"
                                >
                                    <ImagenSimboloTintada
                                        base64={simboloSeleccionado.imagen_base64}
                                        color={simboloSeleccionado.color_primario || simboloSeleccionado.color_hover || '#0000FF'}
                                        alt={simboloSeleccionado.nombre}
                                        className="w-9 h-9 object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                    <Button variant="outline" onClick={handleCrearNuevo}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Nueva
                    </Button>
                    <div className="flex gap-2">
                        <Button id="selector-simbologia-btn-cancelar" variant="outline" onClick={onCerrar}>
                            Cancelar
                        </Button>
                        <Button id="selector-simbologia-btn-agregar" onClick={handleSeleccionar} disabled={!simboloSeleccionado}>
                            <Check className="h-4 w-4 mr-2" />
                            Agregar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
