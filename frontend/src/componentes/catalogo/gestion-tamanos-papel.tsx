import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/componentes/ui/alert-dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/componentes/ui/accordion'
import { Edit, Plus, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { catalogoApi } from '@/lib/api'

interface TamanoPapelItem { id: number; nombre: string; ancho: number; alto: number; descripcion?: string; protegido: boolean }

type GestionTamanosPapelProps = {
  seccionExpandida?: boolean;
  onCambiarSeccionExpandida?: (abierta: boolean) => void;
};

export function GestionTamanosPapel({
  seccionExpandida: seccionExpandidaControlada,
  onCambiarSeccionExpandida,
}: GestionTamanosPapelProps) {
  const IDS = {
    raiz: 'config-catalogos-tamanos-hoja',
    toggle: 'config-catalogos-tamanos-hoja-toggle',
    contenido: 'config-catalogos-tamanos-hoja-contenido',
    btnAgregar: 'config-catalogos-tamanos-hoja-btn-agregar',

    dialogCrear: 'config-catalogos-tamanos-hoja-dialog-crear',
    inputNombreCrear: 'config-catalogos-tamanos-hoja-nombre-crear',
    inputAnchoCrear: 'config-catalogos-tamanos-hoja-ancho-crear',
    inputAltoCrear: 'config-catalogos-tamanos-hoja-alto-crear',
    btnCancelarCrear: 'config-catalogos-tamanos-hoja-btn-cancelar-crear',
    btnConfirmarCrear: 'config-catalogos-tamanos-hoja-btn-confirmar-crear',
  };

  const [items, setItems] = useState<TamanoPapelItem[]>([])
  const [cargando, setCargando] = useState(false)
  const cargar = async () => {
    setCargando(true)
    try {
      const lista = await (catalogoApi as any).obtenerTamanosHoja?.()
      if (Array.isArray(lista)) setItems(lista)
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'No se pudieron cargar los tamaños', variant: 'destructive' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editarAbierto, setEditarAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [editItem, setEditItem] = useState<TamanoPapelItem | null>(null)
  const [form, setForm] = useState({ nombre: '', ancho: '', alto: '' })
  const [seccionExpandidaInterna, setSeccionExpandidaInterna] = useState(false)
  const [dialogoConfirmarCierre, setDialogoConfirmarCierre] = useState(false)
  const [accionPendienteCierre, setAccionPendienteCierre] = useState<'crear' | 'editar' | null>(null)

  const seccionExpandida = seccionExpandidaControlada ?? seccionExpandidaInterna;
  const setSeccionExpandida = onCambiarSeccionExpandida ?? setSeccionExpandidaInterna;

  const formularioSucio = useMemo(() => {
    if (crearAbierto) {
      return form.nombre.trim() !== '' || form.ancho !== '' || form.alto !== '';
    }
    if (editarAbierto && editItem) {
      return form.nombre !== editItem.nombre || 
             String(form.ancho) !== String(editItem.ancho) || 
             String(form.alto) !== String(editItem.alto);
    }
    return false;
  }, [form, crearAbierto, editarAbierto, editItem]);

  const intentarCerrar = (tipo: 'crear' | 'editar') => {
    if (formularioSucio) {
      setAccionPendienteCierre(tipo);
      setDialogoConfirmarCierre(true);
    } else {
      cerrarDialogo(tipo);
    }
  };

  const cerrarDialogo = (tipo: 'crear' | 'editar') => {
    if (tipo === 'crear') {
      setCrearAbierto(false);
      setForm({ nombre: '', ancho: '', alto: '' });
    } else {
      setEditarAbierto(false);
      setEditItem(null);
      setForm({ nombre: '', ancho: '', alto: '' });
    }
  };

  const confirmarCierre = () => {
    if (accionPendienteCierre) {
      cerrarDialogo(accionPendienteCierre);
    }
    setDialogoConfirmarCierre(false);
    setAccionPendienteCierre(null);
  };

  const abrirCrear = () => { setForm({ nombre: '', ancho: '', alto: '' }); setCrearAbierto(true) }
  const abrirEditar = (it: TamanoPapelItem) => {
    if (it.protegido) { toast({ title: 'Protegido', description: 'Este tamaño no se puede editar', variant: 'destructive' }); return }
    setEditItem(it)
    setForm({ nombre: it.nombre, ancho: String(it.ancho), alto: String(it.alto) })
    setEditarAbierto(true)
  }

  const convertirANum = (v: string) => Number((v || '').toString().replace(',', '.'))

  const generarDescripcion = (ancho: string, alto: string) => {
    const nAncho = Math.round(convertirANum(ancho))
    const nAlto = Math.round(convertirANum(alto))
    if (!nAncho || !nAlto) return ''
    const anchoPulgadas = (nAncho / 25.4).toFixed(2)
    const altoPulgadas = (nAlto / 25.4).toFixed(2)
    return `${nAncho} × ${nAlto} mm (${anchoPulgadas}" × ${altoPulgadas}")`
  }


  const crear = async () => {
    if (!form.nombre.trim()) { toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' }); return }
    const nAncho = convertirANum(form.ancho)
    const nAlto = convertirANum(form.alto)
    if (!Number.isFinite(nAncho) || !Number.isFinite(nAlto) || nAncho <= 0 || nAlto <= 0) {
      toast({ title: 'Error', description: 'Ancho y alto deben ser números positivos', variant: 'destructive' }); return
    }
    setGuardando(true)
    try {
      const payload = { nombre: form.nombre.trim(), ancho: Math.round(nAncho), alto: Math.round(nAlto) }
      await (catalogoApi as any).crearTamanoHoja?.(payload)
      toast({ title: 'Éxito', description: 'Tamaño creado' })
      setCrearAbierto(false)
      await cargar()
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'No se pudo crear', variant: 'destructive' })
    } finally { setGuardando(false) }
  }

  const actualizar = async () => {
    if (!editItem) return
    const item = editItem
    if (item.protegido) { toast({ title: 'Protegido', description: 'Este tamaño no se puede editar', variant: 'destructive' }); return }
    if (!form.nombre.trim()) { toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' }); return }
    const nAncho = convertirANum(form.ancho)
    const nAlto = convertirANum(form.alto)
    if (!Number.isFinite(nAncho) || !Number.isFinite(nAlto) || nAncho <= 0 || nAlto <= 0) {
      toast({ title: 'Error', description: 'Ancho y alto deben ser números positivos', variant: 'destructive' }); return
    }
    setGuardando(true)
    try {
      const payload: any = { nombre: form.nombre.trim(), ancho: Math.round(nAncho), alto: Math.round(nAlto) }
      await (catalogoApi as any).actualizarTamanoHoja?.(item.id, payload)
      toast({ title: 'Éxito', description: 'Tamaño actualizado' })
      setEditarAbierto(false)
      setEditItem(null)
      await cargar()
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'No se pudo actualizar', variant: 'destructive' })
    } finally { setGuardando(false) }
  }

  const eliminar = async (it: TamanoPapelItem) => {
    if (it.protegido) { toast({ title: 'Protegido', description: 'Este tamaño no se puede eliminar', variant: 'destructive' }); return }
    try {
      await (catalogoApi as any).eliminarTamanoHoja?.(it.id)
      toast({ title: 'Éxito', description: 'Tamaño eliminado' })
      await cargar()
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const tituloUnidad = 'mm'

  return (
    <div id={IDS.raiz} className="space-y-4">
      <div className="flex items-center justify-between">
        <div 
          id={IDS.toggle}
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setSeccionExpandida(!seccionExpandida)}
        >
          {seccionExpandida ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          <div>
            <h3 className="text-lg font-semibold">Tamaños de Hoja</h3>
            <p className="text-sm text-muted-foreground">Gestiona tamaños exclusivamente en milímetros (mm)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button id={IDS.btnAgregar} onClick={abrirCrear} size="sm" className="ml-2"><Plus className="h-4 w-4 mr-2" />Agregar</Button>
        </div>
      </div>

      {seccionExpandida && (
        <div id={IDS.contenido}>
          {cargando ? (
            <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Cargando…</div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {items.map(it => (
                <AccordionItem key={it.id} value={`tp-${it.id}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-medium break-words whitespace-normal">{it.nombre}</span>
                      <span className="text-xs text-muted-foreground">{it.descripcion || `${it.ancho} × ${it.alto} mm`}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(it)} disabled={it.protegido}><Edit className="h-4 w-4 mr-2" />Editar</Button>
                      <Button variant="outline" size="sm" onClick={() => eliminar(it)} disabled={it.protegido}><Trash2 className="h-4 w-4 mr-2" />Eliminar</Button>
                      {it.protegido && <span className="text-xs text-muted-foreground">Protegido</span>}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )}

      <Dialog open={crearAbierto} onOpenChange={(open) => {
        if (!open) intentarCerrar('crear');
        else setCrearAbierto(true);
      }}>
        <DialogContent id={IDS.dialogCrear} className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Agregar tamaño de hoja</DialogTitle>
            <DialogDescription>Las medidas se guardan en mm</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input id={IDS.inputNombreCrear} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Oficio personal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ancho ({tituloUnidad})</Label>
                <Input
                  id={IDS.inputAnchoCrear}
                  type="number"
                  min="1"
                  step="1"
                  value={form.ancho}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^0-9]/g, '');
                    setForm({ ...form, ancho: valor });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  placeholder={'210'}
                />
              </div>
              <div className="space-y-1">
                <Label>Alto ({tituloUnidad})</Label>
                <Input
                  id={IDS.inputAltoCrear}
                  type="number"
                  min="1"
                  step="1"
                  value={form.alto}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^0-9]/g, '');
                    setForm({ ...form, alto: valor });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  placeholder={'297'}
                />
              </div>
            </div>
            {form.ancho && form.alto && (
              <div className="space-y-1">
                <Label>Descripción (auto-generada)</Label>
                <div className="px-3 py-2 bg-secondary/50 rounded-md text-sm text-muted-foreground">
                  {generarDescripcion(form.ancho, form.alto)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button id={IDS.btnCancelarCrear} variant="outline" onClick={() => intentarCerrar('crear')} disabled={guardando}>Cancelar</Button>
            <Button id={IDS.btnConfirmarCrear} onClick={crear} disabled={guardando}>{guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editarAbierto} onOpenChange={(open) => {
        if (!open) intentarCerrar('editar');
        else setEditarAbierto(true);
      }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar tamaño de hoja</DialogTitle>
            <DialogDescription>Las medidas se guardan en mm</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ancho ({tituloUnidad})</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.ancho}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^0-9]/g, '');
                    setForm({ ...form, ancho: valor });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Alto ({tituloUnidad})</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.alto}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^0-9]/g, '');
                    setForm({ ...form, alto: valor });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            {form.ancho && form.alto && editItem && (
              <div className="space-y-1">
                <Label>Descripción (auto-generada)</Label>
                <div className="px-3 py-2 bg-secondary/50 rounded-md text-sm text-muted-foreground">
                  {generarDescripcion(form.ancho, form.alto)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => intentarCerrar('editar')} disabled={guardando}>Cancelar</Button>
            <Button onClick={actualizar} disabled={guardando}>{guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Actualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={dialogoConfirmarCierre} onOpenChange={setDialogoConfirmarCierre}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCierre}>Descartar cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
