import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select';
import { Label } from '@/componentes/ui/label';
import { Switch } from '@/componentes/ui/switch';
import { ScrollArea, ScrollBar } from '@/componentes/ui/scroll-area';
import { Grid, Highlighter, Loader2, Minus, Plus, RotateCcw } from 'lucide-react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { odontogramaApi } from '@/lib/api';
import type { Odontograma, OdontogramaAplicacion, PiezaAfectada } from '@/tipos';
import { obtenerNombreCara } from '@/lib/terminologia-dental';
import { OdontogramaChart, type SimbologiaAnadida, generateInitialConfig } from './odontograma-chart';
import { ImagenSimboloTintada } from './imagen-simbolo-tintada';
import { cn } from '@/lib/utilidades';
import { useToast } from '@/hooks/use-toast';

const ScrollAreaBidireccional = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <ScrollAreaPrimitive.Root className={cn('relative overflow-hidden', className)}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
);

interface DialogoOdontogramaHistoriaProps {
  abierto: boolean;
  onCerrar: () => void;
  pacienteId: number;
  pacienteNombre?: string;
  puedeInsertar: boolean;
  onInsertarHtml: (html: string) => void;
}

const escapeHtml = (texto: string): string => {
  return (texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const agruparPiezas = (piezas: PiezaAfectada[]) => {
  const mapa = new Map<number, Set<string>>();
  for (const p of piezas || []) {
    if (!p || typeof p.numero_pieza !== 'number') continue;
    const set = mapa.get(p.numero_pieza) ?? new Set<string>();
    for (const parte of p.partes || []) {
      if (parte) set.add(parte);
    }
    mapa.set(p.numero_pieza, set);
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([numero, partesSet]) => ({
      numero_pieza: numero,
      partes: [...partesSet.values()],
    }));
};

const formatearPiezas = (piezas: PiezaAfectada[]) => {
  const agrupadas = agruparPiezas(piezas);
  if (agrupadas.length === 0) return '—';
  return agrupadas
    .map((p) => {
      const partes = (p.partes || [])
        .map((c) => obtenerNombreCara(c) || c)
        .filter(Boolean);
      return partes.length > 0 ? `${p.numero_pieza} (${partes.join(', ')})` : String(p.numero_pieza);
    })
    .join('; ');
};

const esHallazgo = (app: OdontogramaAplicacion): boolean => {
  const categoria = (app as any)?.simbolo?.categoria;
  return categoria === 'CONDICION_HALLAZGO';
};

const obtenerEstadoTratamiento = (app: OdontogramaAplicacion): 'REALIZADO' | 'POR_REALIZAR' | null => {
  if (esHallazgo(app)) return null;

  const t: any = (app as any)?.transformacion;
  if (t?.estado === 'REALIZADO' || t?.estado === 'POR_REALIZAR') return t.estado;

  const simbolo: any = (app as any)?.simbolo;
  const principal = (simbolo?.color_primario || simbolo?.color_hover || '').toString().toLowerCase();
  const colorPersistido = (t?.color || '').toString().toLowerCase();
  if (principal && colorPersistido) {
    return colorPersistido === principal ? 'REALIZADO' : 'POR_REALIZAR';
  }

  return null;
};

const formatearEstadoTratamiento = (app: OdontogramaAplicacion): string | null => {
  const estado = obtenerEstadoTratamiento(app);
  if (!estado) return null;
  return estado === 'REALIZADO' ? 'Realizado' : 'Por realizar';
};

const construirHtmlAplicacion = (app: OdontogramaAplicacion, version: number | undefined) => {
  const simboloNombre = escapeHtml(app?.simbolo?.nombre || 'Simbología');
  const comentario = (app?.comentario || '').trim();
  const comentarioHtml = comentario ? ` <em>${escapeHtml(comentario)}</em>` : '';
  const piezasTexto = escapeHtml(formatearPiezas(app?.piezas_afectadas || []));
  const versionTexto = version ? `Odontograma v${version}` : 'Odontograma';
  if (esHallazgo(app)) {
    return `<p><strong>${simboloNombre}</strong>${comentarioHtml}<br/>Piezas: ${piezasTexto} (${escapeHtml(versionTexto)})</p>`;
  }

  const idTexto = escapeHtml(String((app as any)?.id ?? ''));
  const estadoTexto = formatearEstadoTratamiento(app);
  const estadoHtml = estadoTexto ? `<br/><strong>Estado:</strong> <em>${escapeHtml(estadoTexto)}</em>` : '';

  return `<p><strong>${simboloNombre}</strong>${comentarioHtml}<br/><strong>ID:</strong> ${idTexto}${estadoHtml}<br/>Piezas: ${piezasTexto} (${escapeHtml(versionTexto)})</p>`;
};

const mapAplicacionesToSimbologias = (odontograma: Odontograma | null): SimbologiaAnadida[] => {
  if (!odontograma?.aplicaciones) return [];

  return odontograma.aplicaciones.map((app: any) => {
    const categoria = app.simbolo?.categoria || 'TRATAMIENTO_PATOLOGIA';
    const hoverBase = app.simbolo?.color_hover || '#0000FF';
    const principal = app.simbolo?.color_primario || app.simbolo?.color_hover || '#0000FF';
    const secundario = app.simbolo?.color_secundario;

    const esImagen = !!app.transformacion;
    let t: any = app.transformacion;

    if (t && t.escala !== undefined && t.scaleX === undefined) {
      t = {
        ...t,
        scaleX: t.escala,
        scaleY: t.escala,
        rotation: t.rotacion !== undefined ? t.rotacion : t.rotation,
      };
    }

    const hoverColor = t?.hover_color || t?.color_hover || hoverBase;

    let estado: 'REALIZADO' | 'POR_REALIZAR' | undefined = undefined;
    if (categoria !== 'CONDICION_HALLAZGO') {
      estado = t?.estado;
      if (!estado) {
        const colorPersistido = (t?.color || '').toString().toLowerCase();
        const principalLower = (principal || '').toString().toLowerCase();
        estado = colorPersistido && principalLower && colorPersistido === principalLower ? 'REALIZADO' : 'POR_REALIZAR';
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
      id: `hist-${app.id}`,
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
      esImagen,
    } satisfies SimbologiaAnadida;
  });
};

export function DialogoOdontogramaHistoria({
  abierto,
  onCerrar,
  pacienteId,
  pacienteNombre,
  puedeInsertar,
  onInsertarHtml,
}: DialogoOdontogramaHistoriaProps) {
  const { toast } = useToast();
  const [cargando, setCargando] = useState(false);
  const [odontogramas, setOdontogramas] = useState<Odontograma[]>([]);
  const [odontogramaSeleccionado, setOdontogramaSeleccionado] = useState<Odontograma | null>(null);
  const [tab, setTab] = useState<'visualizacion' | 'simbologia'>('simbologia');

  const [insertandoAplicacionId, setInsertandoAplicacionId] = useState<number | null>(null);

  const [escala, setEscala] = useState(0.6);
  const [mostrarGrid, setMostrarGrid] = useState(false);
  const [mostrarAsignaciones, setMostrarAsignaciones] = useState(true);
  const [mostrarNumeros, setMostrarNumeros] = useState(true);

  const [dibujos, setDibujos] = useState<any[]>([]);
  const [configuracionDientes, setConfiguracionDientes] = useState<any>({});

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await odontogramaApi.obtenerPorPaciente(pacienteId);
      const lista = Array.isArray(res) ? res : res ? [res] : [];
      const ordenadas = [...lista].sort((a, b) => (b.version || 0) - (a.version || 0));
      setOdontogramas(ordenadas);
      const inicial = ordenadas[0] || null;
      setOdontogramaSeleccionado(inicial);
    } catch (e) {
      console.error('Error al cargar odontogramas', e);
      setOdontogramas([]);
      setOdontogramaSeleccionado(null);
    } finally {
      setCargando(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    if (!abierto) return;
    if (!pacienteId || pacienteId <= 0) return;
    setTab('simbologia');
    setEscala(0.6);
    setMostrarGrid(false);
    setMostrarAsignaciones(true);
    setMostrarNumeros(true);
    void cargar();
  }, [abierto, pacienteId, cargar]);

  useEffect(() => {
    if (!odontogramaSeleccionado) {
      setDibujos([]);
      setConfiguracionDientes({});
      return;
    }
    setDibujos(odontogramaSeleccionado.datos_pintado || []);

    if (odontogramaSeleccionado.configuracion_dientes && Object.keys(odontogramaSeleccionado.configuracion_dientes).length > 0) {
      setConfiguracionDientes(odontogramaSeleccionado.configuracion_dientes);
    } else {
      const tipo = odontogramaSeleccionado.tipo || 'adulto';
      const cfg = generateInitialConfig(tipo, 1000 / 2, (1000 - ((40 * 2) + 60)) / 2, 40 + 5, 60, 40);
      setConfiguracionDientes(cfg);
    }
  }, [odontogramaSeleccionado]);

  const simbologias = useMemo(() => mapAplicacionesToSimbologias(odontogramaSeleccionado), [odontogramaSeleccionado]);
  const aplicaciones = odontogramaSeleccionado?.aplicaciones || [];

  const onCambiarVersion = (id: string) => {
    const vid = Number(id);
    const encontrado = odontogramas.find((o) => o.id === vid) || null;
    setOdontogramaSeleccionado(encontrado);
  };

  const insertarAplicacion = (app: OdontogramaAplicacion) => {
    if (!odontogramaSeleccionado) return;
    if (!puedeInsertar) return;
    if (insertandoAplicacionId !== null) return;

    setInsertandoAplicacionId(app.id);
    try {
      const html = construirHtmlAplicacion(app, odontogramaSeleccionado.version);
      onInsertarHtml(html);
      toast({
        title: 'Agregado a la historia clínica',
        description: `${app?.simbolo?.nombre || 'Simbología'} (${odontogramaSeleccionado.version ? `v${odontogramaSeleccionado.version}` : 'sin versión'})`,
      });
    } catch (e) {
      console.error('Error al insertar aplicación en la historia', e);
      toast({
        variant: 'destructive',
        title: 'No se pudo agregar a la historia',
        description: 'Inténtalo de nuevo.',
      });
    } finally {
      window.setTimeout(() => setInsertandoAplicacionId(null), 650);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) onCerrar(); }}>
      <DialogContent className="max-w-6xl h-[85vh] overflow-hidden flex flex-col" id="dialog-odontograma-historia">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <DialogTitle className="text-xl">Odontograma</DialogTitle>
              <DialogDescription className="mt-3">
                {pacienteNombre ? `Paciente: ${pacienteNombre}` : ''}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Versión:</span>
                <Select
                  value={odontogramaSeleccionado ? String(odontogramaSeleccionado.id) : ''}
                  onValueChange={onCambiarVersion}
                  disabled={cargando || odontogramas.length === 0 || tab === 'simbologia'}
                >
                  <SelectTrigger id="odontograma-select-version" className="h-9 w-[210px]">
                    <SelectValue placeholder={cargando ? 'Cargando…' : 'Seleccionar versión'} />
                  </SelectTrigger>
                  <SelectContent>
                    {odontogramas.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {`v${o.version || ''}`} {o.nombre ? `· ${o.nombre}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tab === 'visualizacion' && (
                <div className="flex items-center gap-2 flex-wrap" id="odontograma-historia-controles-visualizacion">
                  <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEscala((s) => Math.max(0.2, Number((s - 0.1).toFixed(2))))}
                      disabled={escala <= 0.2}
                      title="Disminuir tamaño"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs w-10 text-center">{Math.round(escala * 100)}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEscala((s) => Math.min(2, Number((s + 0.1).toFixed(2))))}
                      disabled={escala >= 2}
                      title="Aumentar tamaño"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEscala(0.6)}
                      title="Restablecer tamaño"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1">
                    <Label htmlFor="hist-odo-show-nums" className="text-xs font-normal cursor-pointer">Números</Label>
                    <Switch id="hist-odo-show-nums" checked={mostrarNumeros} onCheckedChange={setMostrarNumeros} />
                  </div>

                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1" title="Mostrar/Ocultar anotaciones">
                    <Highlighter className="h-3 w-3 text-muted-foreground" />
                    <Switch id="hist-odo-show-assignments" checked={mostrarAsignaciones} onCheckedChange={setMostrarAsignaciones} className="scale-90" />
                  </div>

                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1" title="Mostrar/Ocultar cuadrícula">
                    <Grid className="h-3 w-3 text-muted-foreground" />
                    <Switch id="hist-odo-show-grid" checked={mostrarGrid} onCheckedChange={setMostrarGrid} className="scale-90" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {cargando && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando odontograma…
            </div>
          )}
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-3 flex-1 overflow-hidden min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-2" id="odontograma-historia-tabs">
            <TabsTrigger value="simbologia">Simbología</TabsTrigger>
            <TabsTrigger value="visualizacion">Odontograma</TabsTrigger>
          </TabsList>

          <TabsContent value="visualizacion" className="mt-3 flex-1 overflow-hidden min-h-0 h-full">
            <div className="h-full overflow-hidden rounded-md border bg-secondary/20 isolate relative flex flex-col min-h-0">
              <ScrollAreaBidireccional className="flex-1 min-h-0">
                <div className="min-w-full min-h-full flex p-6">
                  <div className="w-max h-max mx-auto my-auto shadow-lg border bg-white">
                    <OdontogramaChart
                      simbologiasAnadidas={simbologias}
                      simbologiaActiva={null}
                      onPiezaClick={() => { }}
                      piezasSeleccionadas={[]}
                      simbologiaHover={null}
                      onSimbologiaHover={() => { }}
                      modoAsignacion={false}
                      escala={escala}
                      mostrarNumeros={mostrarNumeros}
                      mostrarAsignaciones={mostrarAsignaciones}
                      colorFondo="#ffffff"
                      tipo={odontogramaSeleccionado?.tipo || 'adulto'}
                      modoEdicionPosicion={false}
                      modoDibujo={false}
                      mostrarGrid={mostrarGrid}
                      dibujos={dibujos}
                      setDibujos={() => { }}
                      configuracionDientes={configuracionDientes}
                      setConfiguracionDientes={() => { }}
                      onUpdateSimboloTransform={() => { }}
                    />
                  </div>
                </div>
              </ScrollAreaBidireccional>
            </div>
          </TabsContent>

          <TabsContent value="simbologia" className="mt-3 flex-1 overflow-hidden min-h-0 h-full">
            <div className="h-full overflow-hidden rounded-md border bg-background flex flex-col min-h-0">
              <div className="p-3 border-b">
                <div className="text-sm font-semibold">Simbología aplicada</div>
                <div className="text-xs text-muted-foreground">Incluye piezas/caras afectadas por aplicación.</div>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-3 space-y-3">
                  {aplicaciones.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No hay registros en esta versión.</div>
                  ) : (
                    aplicaciones.map((app) => (
                      <div key={app.id} className="p-3 rounded-lg border">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-white rounded border flex items-center justify-center overflow-hidden shrink-0">
                            {app.simbolo?.imagen_base64 ? (
                              <ImagenSimboloTintada
                                base64={app.simbolo.imagen_base64}
                                color={app.simbolo.color_primario || app.simbolo.color_hover}
                                alt={app.simbolo?.nombre || 'Simbología'}
                              />
                            ) : null}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold">{app.simbolo?.nombre}</div>
                                {app.simbolo?.descripcion && (
                                  <div className="text-xs text-muted-foreground">{app.simbolo.descripcion}</div>
                                )}
                                <div className="text-xs mt-1 text-muted-foreground">
                                  <span className="font-semibold">ID:</span> {app.id}
                                  {!esHallazgo(app as any) && formatearEstadoTratamiento(app as any) ? (
                                    <>
                                      <span className="mx-2">·</span>
                                      <span className="font-semibold">Estado:</span> {formatearEstadoTratamiento(app as any)}
                                    </>
                                  ) : null}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => insertarAplicacion(app)}
                                disabled={!puedeInsertar || insertandoAplicacionId !== null}
                              >
                                {insertandoAplicacionId === app.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Agregando…
                                  </>
                                ) : (
                                  'Añadir a la Historia'
                                )}
                              </Button>
                            </div>
                            {app.comentario && (
                              <div className="text-xs mt-2"><span className="font-semibold">Nota:</span> {app.comentario}</div>
                            )}
                            <div className="text-xs mt-2"><span className="font-semibold">Piezas:</span> {formatearPiezas(app.piezas_afectadas || [])}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
