import { SimboloOdontograma, OdontogramaAplicacion } from '@/tipos';
import { Button } from '@/componentes/ui/button';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Badge } from '@/componentes/ui/badge';
import { Textarea } from '@/componentes/ui/textarea';
import { Label } from '@/componentes/ui/label';
import { Check, X, Trash2, Edit, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { HexColorPicker } from 'react-colorful';
import { ImagenSimboloTintada } from './imagen-simbolo-tintada';

interface PanelSimbologiaProps {
    simbolos: SimboloOdontograma[];
    simboloSeleccionado: number | null;
    onSimboloSelect: (id: number | null) => void;
    aplicaciones: OdontogramaAplicacion[];
    onAplicacionDelete: (id: number) => void;
    onAplicacionEdit: (aplicacion: OdontogramaAplicacion) => void;
    comentarioActual: string;
    onComentarioChange: (comentario: string) => void;
    onAplicar: () => void;
    onCancelarSeleccion: () => void;
    piezasSeleccionadasCount: number;
    cargandoSimbolos: boolean;
    aplicacionHover: OdontogramaAplicacion | null;
    onAplicacionHover: (aplicacion: OdontogramaAplicacion | null) => void;
    onColorChange?: (color: string) => void;
    colorActual?: string;
}

export function PanelSimbologia({
    simbolos,
    simboloSeleccionado,
    onSimboloSelect,
    aplicaciones,
    onAplicacionDelete,
    onAplicacionEdit,
    comentarioActual,
    onComentarioChange,
    onAplicar,
    onCancelarSeleccion,
    piezasSeleccionadasCount,
    cargandoSimbolos,
    aplicacionHover,
    onAplicacionHover,
    onColorChange,
    colorActual
}: PanelSimbologiaProps) {
    const simboloActual = simbolos.find(s => s.id === simboloSeleccionado);

    return (
        <div className="w-80 border-r bg-background flex flex-col h-full">
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Simbología Disponible</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {cargandoSimbolos ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : simbolos.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay símbolos creados. Ve a Configuración → Catálogos para crear símbolos.
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {simbolos.map(simbolo => (
                                        <button
                                            key={simbolo.id}
                                            onClick={() => onSimboloSelect(simbolo.id === simboloSeleccionado ? null : simbolo.id)}
                                            className={`
                        p-2 rounded-lg border-2 transition-all hover:scale-105
                        ${simboloSeleccionado === simbolo.id
                                                    ? 'bg-primary/10 ring-2 ring-primary/20'
                                                    : 'hover:bg-secondary/20'
                                                }
                      `}
                                            title={simbolo.nombre}
                                        >
                                            <div
                                                className="w-full h-12 rounded border bg-white flex items-center justify-center overflow-hidden"
                                                style={{ borderColor: simbolo.color_hover || '#FF0000' }}
                                            >
                                                <ImagenSimboloTintada
                                                    base64={simbolo.imagen_base64}
                                                    color={simbolo.color_hover || '#0000FF'}
                                                    alt={simbolo.nombre}
                                                    className="w-full h-12 object-contain"
                                                />
                                            </div>
                                            <p className="text-xs truncate mt-1 text-foreground">{simbolo.nombre}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {simboloActual && (
                        <Card className="border-primary">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button 
                                                   className="w-4 h-4 rounded border border-gray-300 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                   style={{ backgroundColor: colorActual || simboloActual.color_hover }}
                                                   title="Cambiar color de resaltado"
                                                />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-2">
                                                <HexColorPicker 
                                                    color={colorActual || simboloActual.color_hover} 
                                                    onChange={(c) => onColorChange && onColorChange(c)} 
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {simboloActual.nombre}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={onCancelarSeleccion}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    Haz clic en las partes de las piezas dentales que deseas marcar.
                                </p>

                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {piezasSeleccionadasCount} parte{piezasSeleccionadasCount !== 1 ? 's' : ''} seleccionada{piezasSeleccionadasCount !== 1 ? 's' : ''}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="comentario" className="text-xs">Comentario (opcional)</Label>
                                    <Textarea
                                        id="comentario"
                                        value={comentarioActual}
                                        onChange={(e) => onComentarioChange(e.target.value)}
                                        placeholder="Añade un comentario sobre esta marca..."
                                        className="text-sm resize-none"
                                        rows={2}
                                    />
                                </div>

                                <Button
                                    onClick={onAplicar}
                                    disabled={piezasSeleccionadasCount === 0}
                                    className="w-full"
                                    size="sm"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Aplicar Símbolo
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">
                                Símbolos Aplicados ({aplicaciones.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {aplicaciones.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay símbolos aplicados aún.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {aplicaciones.map((aplicacion) => {
                                        const colorBorde = (aplicacion.transformacion as any)?.hover_color || aplicacion.simbolo.color_hover || '#FF0000';
                                        const isHover = aplicacionHover?.id === aplicacion.id;

                                        return (
                                            <div
                                                key={aplicacion.id}
                                                className={
                                                    `p-2 rounded-lg border-2 transition-all cursor-pointer ` +
                                                    (isHover
                                                        ? 'bg-primary/10 ring-2 ring-primary/20'
                                                        : 'hover:bg-secondary/20')
                                                }
                                                style={{ borderColor: colorBorde }}
                                                onMouseEnter={() => onAplicacionHover(aplicacion)}
                                                onMouseLeave={() => onAplicacionHover(null)}
                                            >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded"
                                                    style={{ backgroundColor: colorBorde }}
                                                />
                                                <span className="text-sm font-medium flex-1 truncate">
                                                    {aplicacion.simbolo.nombre}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAplicacionEdit(aplicacion);
                                                    }}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAplicacionDelete(aplicacion.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            {aplicacion.comentario && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {aplicacion.comentario}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {aplicacion.piezas_afectadas.slice(0, 5).map((p, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs py-0">
                                                        {p.numero_pieza}
                                                    </Badge>
                                                ))}
                                                {aplicacion.piezas_afectadas.length > 5 && (
                                                    <Badge variant="outline" className="text-xs py-0">
                                                        +{aplicacion.piezas_afectadas.length - 5}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    );
}
