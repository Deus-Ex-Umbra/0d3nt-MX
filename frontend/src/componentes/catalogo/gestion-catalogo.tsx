import { useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/componentes/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import { Edit, Trash2, Plus, Loader2, AlertCircle, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { HexColorPicker } from 'react-colorful';
import '../ui/color-picker.css';

interface ItemCatalogo {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  codigo?: string;
  activo: boolean;
}

interface GestionCatalogoProps {
  titulo: string;
  idBase?: string;
  items: ItemCatalogo[];
  cargando: boolean;
  onCrear: (datos: any) => Promise<void>;
  onActualizar?: (id: number, datos: any) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
  onRecargar: () => Promise<void>;
  permitirColor?: boolean;
  permitirCodigo?: boolean;
  icono?: React.ReactNode;
  placeholderNombre?: string;
  placeholderDescripcion?: string;
  placeholderCodigo?: string;
  ayudaNombre?: string;
  ayudaDescripcion?: string;

  seccionExpandida?: boolean;
  onCambiarSeccionExpandida?: (abierta: boolean) => void;
}

export function GestionCatalogo({
  titulo,
  idBase,
  items,
  cargando,
  onCrear,
  onActualizar,
  onEliminar,
  onRecargar,
  permitirColor = false,
  permitirCodigo = false,
  icono,
  placeholderNombre = 'Ej: Penicilina, Diabetes, etc.',
  placeholderDescripcion = 'Agrega detalles adicionales...',
  placeholderCodigo = 'Ej: [PACIENTE_NOMBRE]',
  ayudaNombre,
  ayudaDescripcion,
  seccionExpandida,
  onCambiarSeccionExpandida,
}: GestionCatalogoProps) {
  const [dialogo_crear_abierto, setDialogoCrearAbierto] = useState(false);
  const [dialogo_editar_abierto, setDialogoEditarAbierto] = useState(false);
  const [item_editar, setItemEditar] = useState<ItemCatalogo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [item_a_eliminar, setItemAEliminar] = useState<{ id: number; nombre: string } | null>(null);
  const [busqueda, setBusqueda] = useState('');
    const [seccion_expandida_interna, setSeccionExpandidaInterna] = useState(false);
  const [formulario_inicial, setFormularioInicial] = useState({
     nombre: '',
     descripcion: '',
     codigo: '',
     color: '#808080',
  });

    const seccion_expandida = seccionExpandida ?? seccion_expandida_interna;
    const setSeccionExpandida = onCambiarSeccionExpandida ?? setSeccionExpandidaInterna;
  
  const [hay_cambios, setHayCambios] = useState(false);
  const [dialogo_confirmar_cierre_crear, setDialogoConfirmarCierreCrear] = useState(false);
  const [dialogo_confirmar_cierre_editar, setDialogoConfirmarCierreEditar] = useState(false);

  const abrirDialogoConfirmarEliminar = (id: number, nombre: string) => {
    setItemAEliminar({ id, nombre });
    setDialogoConfirmarEliminarAbierto(true);
  };
  
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    codigo: '',
    color: '#808080',
  });

  const comprobarCambios = (nuevoFormulario: any, inicial: any) => {
      return JSON.stringify(nuevoFormulario) !== JSON.stringify(inicial);
  };
  
  const actualizarFormularioYVerificar = (nuevoForm: any, esEdicion = false) => {
      setFormulario(nuevoForm);
      if (esEdicion) {
          setHayCambios(comprobarCambios(nuevoForm, formulario_inicial));
      } else {
        const vacio = {
             nombre: '',
            descripcion: '',
            codigo: '',
            color: '#808080',
        };
        setHayCambios(comprobarCambios(nuevoForm, vacio));
      }
  };

  const reiniciarFormulario = () => {
    const estadoInicial = {
      nombre: '',
      descripcion: '',
      codigo: '',
      color: '#808080',
    };
    setFormulario(estadoInicial);
    setFormularioInicial(estadoInicial);
    setHayCambios(false);
  };

  const intentarCerrarCrear = () => {
      if (hay_cambios) {
          setDialogoConfirmarCierreCrear(true);
      } else {
          setDialogoCrearAbierto(false);
          reiniciarFormulario();
      }
  };
  
  const intentarCerrarEditar = () => {
      if (hay_cambios) {
           setDialogoConfirmarCierreEditar(true);
      } else {
          setDialogoEditarAbierto(false);
          setItemEditar(null);
          reiniciarFormulario();
      }
  };

  const confirmarCierreCrear = () => {
      setDialogoConfirmarCierreCrear(false);
      setDialogoCrearAbierto(false);
      reiniciarFormulario();
  };

   const confirmarCierreEditar = () => {
      setDialogoConfirmarCierreEditar(false);
      setDialogoEditarAbierto(false);
      setItemEditar(null);
      reiniciarFormulario();
  };

  const manejarCrear = async () => {
    if (!formulario.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (permitirCodigo && !formulario.codigo.trim()) {
      toast({
        title: 'Error',
        description: 'El código es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (permitirCodigo && (!formulario.codigo.startsWith('[') || !formulario.codigo.endsWith(']'))) {
      toast({
        title: 'Error',
        description: 'El código debe estar entre corchetes, ej: [MI_ETIQUETA]',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos: any = { nombre: formulario.nombre.trim() };
      
      if (formulario.descripcion.trim()) {
        datos.descripcion = formulario.descripcion.trim();
      }
      
      if (permitirColor) {
        datos.color = formulario.color;
      }

      if (permitirCodigo) {
        datos.codigo = formulario.codigo.trim().toUpperCase();
      }

      await onCrear(datos);
      toast({
        title: 'Éxito',
        description: `${titulo} creado correctamente`,
      });
      setDialogoCrearAbierto(false);
      reiniciarFormulario();
      await onRecargar();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `No se pudo crear el ${titulo.toLowerCase()}`,
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEditar = async () => {
    if (!item_editar || !onActualizar) return;
    
    if (!formulario.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (permitirCodigo && !formulario.codigo.trim()) {
      toast({
        title: 'Error',
        description: 'El código es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (permitirCodigo && (!formulario.codigo.startsWith('[') || !formulario.codigo.endsWith(']'))) {
      toast({
        title: 'Error',
        description: 'El código debe estar entre corchetes, ej: [MI_ETIQUETA]',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos: any = { nombre: formulario.nombre.trim() };
      
      if (formulario.descripcion.trim()) {
        datos.descripcion = formulario.descripcion.trim();
      }
      
      if (permitirColor) {
        datos.color = formulario.color;
      }

      if (permitirCodigo) {
        datos.codigo = formulario.codigo.trim().toUpperCase();
      }

      await onActualizar(item_editar.id, datos);
      toast({
        title: 'Éxito',
        description: `${titulo} actualizado correctamente`,
      });
      setDialogoEditarAbierto(false);
      setItemEditar(null);
      reiniciarFormulario();
      await onRecargar();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `No se pudo actualizar el ${titulo.toLowerCase()}`,
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoEditar = (item: ItemCatalogo) => {
    setItemEditar(item);
    const estadoItem = {
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      codigo: item.codigo || '',
      color: item.color || '#808080',
    };
    setFormulario(estadoItem);
    setFormularioInicial(estadoItem);
    setHayCambios(false);
    setDialogoEditarAbierto(true);
  };

  const manejarEliminar = async () => {
    if (!item_a_eliminar) return;

    try {
      await onEliminar(item_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: `${titulo} eliminado correctamente`,
      });
      setDialogoConfirmarEliminarAbierto(false);
      setItemAEliminar(null);
      await onRecargar();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `No se pudo eliminar el ${titulo.toLowerCase()}`,
        variant: 'destructive',
      });
    }
  };

  const items_filtrados = items.filter(item =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (item.descripcion && item.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const ids = {
    raiz: idBase,
    toggle: idBase ? `${idBase}-toggle` : undefined,
    contenido: idBase ? `${idBase}-contenido` : undefined,
    btnAgregar: idBase ? `${idBase}-btn-agregar` : undefined,
    inputBuscar: idBase ? `${idBase}-buscar` : undefined,
    dialogEliminar: idBase ? `${idBase}-dialog-eliminar` : undefined,
    btnCancelarEliminar: idBase ? `${idBase}-btn-cancelar-eliminar` : undefined,
    btnConfirmarEliminar: idBase ? `${idBase}-btn-confirmar-eliminar` : undefined,

    dialogCrear: idBase ? `${idBase}-dialog-crear` : undefined,
    nombreCrear: idBase ? `${idBase}-nombre-crear` : 'nombre-crear',
    descripcionCrear: idBase ? `${idBase}-descripcion-crear` : 'descripcion-crear',
    codigoCrear: idBase ? `${idBase}-codigo-crear` : 'codigo-crear',
    colorCrear: idBase ? `${idBase}-color-crear` : 'color-crear',
    btnCancelarCrear: idBase ? `${idBase}-btn-cancelar-crear` : undefined,
    btnConfirmarCrear: idBase ? `${idBase}-btn-confirmar-crear` : undefined,

    dialogEditar: idBase ? `${idBase}-dialog-editar` : undefined,
    nombreEditar: idBase ? `${idBase}-nombre-editar` : 'nombre-editar',
    descripcionEditar: idBase ? `${idBase}-descripcion-editar` : 'descripcion-editar',
    codigoEditar: idBase ? `${idBase}-codigo-editar` : 'codigo-editar',
    colorEditar: idBase ? `${idBase}-color-editar` : 'color-editar',
    btnCancelarEditar: idBase ? `${idBase}-btn-cancelar-editar` : undefined,
    btnConfirmarEditar: idBase ? `${idBase}-btn-confirmar-editar` : undefined,
  };

  return (
    <div id={ids.raiz} className="space-y-4">
      <div className="flex items-center justify-between">
        <div 
          id={ids.toggle}
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setSeccionExpandida(!seccion_expandida)}
        >
          {seccion_expandida ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
          )}
          {icono && (
            <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
              {icono}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
            <p className="text-sm text-muted-foreground">
              {items.length} registros
            </p>
          </div>
        </div>
        <Button
          id={ids.btnAgregar}
          onClick={() => {
            reiniciarFormulario();
            setDialogoCrearAbierto(true);
          }}
          size="sm"
          className="hover:scale-105 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {seccion_expandida && (
        <>
          <div id={ids.contenido} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={ids.inputBuscar}
              type="text"
              placeholder={`Buscar en ${titulo.toLowerCase()}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items_filtrados.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="mx-auto w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {busqueda ? 'No se encontraron resultados' : 'No hay registros'}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {items_filtrados.map((item) => (
                <AccordionItem key={item.id} value={`item-${item.id}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      {permitirColor && item.color && (
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <span className="font-medium break-words whitespace-normal leading-tight">{item.nombre}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {item.descripcion && (
                        <div className="p-3 rounded-lg bg-secondary/30">
                          <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {onActualizar && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirDialogoEditar(item)}
                            className="hover:bg-primary/20 hover:text-primary transition-all duration-200"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirDialogoConfirmarEliminar(item.id, item.nombre)}
                          className="hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </>
      )}

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
  <DialogContent id={ids.dialogEliminar} className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Confirmar Eliminación</DialogTitle>
      <DialogDescription>
        ¿Estás seguro de que deseas eliminar este elemento?
      </DialogDescription>
    </DialogHeader>
    
    {item_a_eliminar && (
      <div className="p-4 rounded-lg bg-secondary/30 border border-border">
        <p className="font-semibold text-foreground">"{item_a_eliminar.nombre}"</p>
        <p className="text-sm text-muted-foreground mt-1">{titulo}</p>
      </div>
    )}

    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
      <p className="text-sm text-destructive">
        Esta acción no se puede deshacer.
      </p>
    </div>

    <DialogFooter>
      <Button
        id={ids.btnCancelarEliminar}
        variant="outline"
        onClick={() => {
          setDialogoConfirmarEliminarAbierto(false);
          setItemAEliminar(null);
        }}
        className="hover:scale-105 transition-all duration-200"
      >
        Cancelar
      </Button>
      <Button
        id={ids.btnConfirmarEliminar}
        variant="destructive"
        onClick={manejarEliminar}
        className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
      >
        Eliminar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      <Dialog open={dialogo_crear_abierto} onOpenChange={(open) => {
          if(!open) intentarCerrarCrear();
          else setDialogoCrearAbierto(true);
      }}>
        <DialogContent id={ids.dialogCrear} className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar {titulo}</DialogTitle>
            <DialogDescription>
              Completa la información para crear un nuevo registro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={ids.nombreCrear}>Nombre *</Label>
              <Input
                id={ids.nombreCrear}
                value={formulario.nombre}
                onChange={(e) => actualizarFormularioYVerificar({ ...formulario, nombre: e.target.value })}
                placeholder={placeholderNombre}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
              {ayudaNombre && (
                <p className="text-xs text-muted-foreground">
                  {ayudaNombre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids.descripcionCrear}>Descripción (opcional)</Label>
              <Textarea
                id={ids.descripcionCrear}
                value={formulario.descripcion}
                onChange={(e) => actualizarFormularioYVerificar({ ...formulario, descripcion: e.target.value })}
                placeholder={placeholderDescripcion}
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
              {ayudaDescripcion && (
                <p className="text-xs text-muted-foreground">
                  {ayudaDescripcion}
                </p>
              )}
            </div>

            {permitirCodigo && (
              <div className="space-y-2">
                <Label htmlFor={ids.codigoCrear}>Código *</Label>
                <Input
                  id={ids.codigoCrear}
                  value={formulario.codigo}
                  onChange={(e) => actualizarFormularioYVerificar({ ...formulario, codigo: e.target.value.toUpperCase() })}
                  placeholder={placeholderCodigo}
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Debe estar entre corchetes, ej: [MI_ETIQUETA]
                </p>
              </div>
            )}

            {permitirColor && (
              <div className="space-y-2">
                <Label htmlFor={ids.colorCrear}>Color *</Label>
                <div className="space-y-3">
                  <HexColorPicker 
                    color={formulario.color}
                    onChange={(color) => actualizarFormularioYVerificar({ ...formulario, color })}
                    style={{ width: '100%', height: '150px' }}
                  />
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-border flex-shrink-0"
                      style={{ backgroundColor: formulario.color }}
                    />
                    <Input
                      id={ids.colorCrear}
                      type="text"
                      value={formulario.color}
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(valor)) {
                          actualizarFormularioYVerificar({ ...formulario, color: valor });
                        }
                      }}
                      placeholder="#808080"
                      className="flex-1 font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              id={ids.btnCancelarCrear}
              variant="outline"
              onClick={intentarCerrarCrear}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button id={ids.btnConfirmarCrear} onClick={manejarCrear} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_editar_abierto} onOpenChange={(open) => {
          if(!open) intentarCerrarEditar();
          else setDialogoEditarAbierto(true);
      }}>
        <DialogContent id={ids.dialogEditar} className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar {titulo}</DialogTitle>
            <DialogDescription>
              Modifica la información del registro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={ids.nombreEditar}>Nombre *</Label>
              <Input
                id={ids.nombreEditar}
                value={formulario.nombre}
                onChange={(e) => actualizarFormularioYVerificar({ ...formulario, nombre: e.target.value }, true)}
                placeholder={placeholderNombre}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
              {ayudaNombre && (
                <p className="text-xs text-muted-foreground">
                  {ayudaNombre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids.descripcionEditar}>Descripción (opcional)</Label>
              <Textarea
                id={ids.descripcionEditar}
                value={formulario.descripcion}
                onChange={(e) => actualizarFormularioYVerificar({ ...formulario, descripcion: e.target.value }, true)}
                placeholder={placeholderDescripcion}
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
              {ayudaDescripcion && (
                <p className="text-xs text-muted-foreground">
                  {ayudaDescripcion}
                </p>
              )}
            </div>

            {permitirCodigo && (
              <div className="space-y-2">
                <Label htmlFor={ids.codigoEditar}>Código *</Label>
                <Input
                  id={ids.codigoEditar}
                  value={formulario.codigo}
                  onChange={(e) => actualizarFormularioYVerificar({ ...formulario, codigo: e.target.value.toUpperCase() }, true)}
                  placeholder={placeholderCodigo}
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Debe estar entre corchetes, ej: [MI_ETIQUETA]
                </p>
              </div>
            )}

            {permitirColor && (
              <div className="space-y-2">
                <Label htmlFor={ids.colorEditar}>Color *</Label>
                <div className="space-y-3">
                  <HexColorPicker 
                    color={formulario.color}
                    onChange={(color) => actualizarFormularioYVerificar({ ...formulario, color }, true)}
                    style={{ width: '100%', height: '150px' }}
                  />
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-border flex-shrink-0"
                      style={{ backgroundColor: formulario.color }}
                    />
                    <Input
                      id={ids.colorEditar}
                      type="text"
                      value={formulario.color}
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(valor)) {
                          actualizarFormularioYVerificar({ ...formulario, color: valor }, true);
                        }
                      }}
                      placeholder="#808080"
                      className="flex-1 font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              id={ids.btnCancelarEditar}
              variant="outline"
              onClick={intentarCerrarEditar}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button id={ids.btnConfirmarEditar} onClick={manejarEditar} disabled={guardando || !hay_cambios}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogo_confirmar_cierre_crear} onOpenChange={setDialogoConfirmarCierreCrear}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>¿Descartar cambios?</DialogTitle>
              <DialogDescription>
                Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogoConfirmarCierreCrear(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmarCierreCrear}>
                Descartar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      
       <Dialog open={dialogo_confirmar_cierre_editar} onOpenChange={setDialogoConfirmarCierreEditar}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>¿Descartar cambios?</DialogTitle>
              <DialogDescription>
                Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogoConfirmarCierreEditar(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmarCierreEditar}>
                Descartar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
