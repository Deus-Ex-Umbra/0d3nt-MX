import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { TituloAccionable } from '@/componentes/tutoriales/titulo-accionable';
import { TutorialModalWrapper } from '@/componentes/tutoriales/tutorial-modal-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Badge } from '@/componentes/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Users, Plus, Search, Edit, Trash2, Eye, Loader2, AlertCircle, UserCircle, MessageCircle, Palette, Calendar, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/componentes/ui/accordion';
import { generarPdfDesdeHtml, TAMANOS_PAPEL, MARGENES_DEFECTO } from '@/lib/pdf-utils';
import { pacientesApi, catalogoApi, historiasClinicasApi, archivosApi, odontogramaApi, plantillasConsentimientoApi, plantillasRecetasApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { SelectConAgregar } from '@/componentes/ui/select-with-add';
import { Combobox } from '@/componentes/ui/combobox';
import { GestorArchivos } from '@/componentes/archivos/gestor-archivos';
import { PhoneInput, formatearTelefonoCompleto, separarTelefono } from '@/componentes/ui/phone-input';
import { EditorDocumento, type DocumentoConfig } from '@/componentes/ui/editor-documento';
import { EditorHtmlRico } from '@/componentes/ui/editor-html-rico';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { DialogoOdontogramaHistoria } from '@/componentes/odontograma/dialogo-odontograma-historia';
import { HexColorPicker } from 'react-colorful';
import '@/componentes/ui/color-picker.css';
import { Paciente, ItemCatalogo, HistoriaClinicaVersion } from '@/tipos';
import { DialogoOdontograma } from '@/componentes/odontograma';
import type { EditorHandle } from '@/componentes/ui/editor-con-etiquetas-personalizado';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { useMoneda } from '@/hooks/use-moneda';
import { useSafeClose } from '@/hooks/use-safe-close';
import { useBusquedaPaginacion } from '@/hooks/use-busqueda-paginacion';
import { DialogoConfirmacionCierre } from '@/componentes/ui/dialogo-confirmacion-cierre';
import { ProveedorTutorialesPagina } from '@/contextos/tutoriales';
import { TUTORIALES_PACIENTES, IDS_ELEMENTOS_PACIENTES } from '@/tutoriales/pacientes';

const CONFIG_DOC_DEF: DocumentoConfig = {
  tamano_hoja_id: null,
  nombre_tamano: 'Carta',
  widthMm: 216,
  heightMm: 279,
  margenes: { top: 20, right: 20, bottom: 20, left: 20 },
};

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const truncarTexto = (texto: string, maxChars: number): string => {
  const limpio = (texto || '').trim();
  if (!limpio) return '';
  if (maxChars <= 3) return limpio.slice(0, Math.max(0, maxChars));
  return limpio.length > maxChars ? `${limpio.slice(0, maxChars - 3)}...` : limpio;
};

const formatearFechaHoraLocal = (fecha: Date | string): string => {
  const f = new Date(fecha);
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = MESES_CORTOS[f.getMonth()] ?? '';
  const anio = f.getFullYear();
  const horas = String(f.getHours()).padStart(2, '0');
  const minutos = String(f.getMinutes()).padStart(2, '0');
  return `${dia} ${mes} ${anio} ${horas}:${minutos}`.trim();
};

const formatearFechaCortaLocal = (fecha: Date | string): string => {
  const f = new Date(fecha);
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = MESES_CORTOS[f.getMonth()] ?? '';
  const anio = f.getFullYear();
  return `${dia} ${mes} ${anio}`.trim();
};

export default function Pacientes() {
  const { formatearMoneda } = useMoneda();
  const { usuario } = useAutenticacion();
  const [todos_pacientes, setTodosPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [dialogo_ver_abierto, setDialogoVerAbierto] = useState(false);
  const [dialogo_color_abierto, setDialogoColorAbierto] = useState(false);
  const [dialogo_whatsapp_abierto, setDialogoWhatsappAbierto] = useState(false);
  const [dialogo_odontograma_abierto, setDialogoOdontogramaAbierto] = useState(false);
  const [paciente_odontograma, setPacienteOdontograma] = useState<Paciente | null>(null);
  const [telefono_whatsapp, setTelefonoWhatsapp] = useState('');
  const [nombre_paciente_whatsapp, setNombrePacienteWhatsapp] = useState('');
  const [paciente_seleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardando_color, setGuardandoColor] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [paciente_a_eliminar, setPacienteAEliminar] = useState<number | null>(null);
  const [resumen_eliminacion, setResumenEliminacion] = useState<any | null>(null);
  const [cargando_resumen_eliminacion, setCargandoResumenEliminacion] = useState(false);
  const [error_resumen_eliminacion, setErrorResumenEliminacion] = useState<string | null>(null);
  const ultima_peticion_resumen_eliminacion = useRef(0);
  const [ultima_cita, setUltimaCita] = useState<any>(null);
  const [ultimo_tratamiento, setUltimoTratamiento] = useState<any>(null);
  const [cargando_info_adicional, setCargandoInfoAdicional] = useState(false);
  const [cargando_detalle_paciente, setCargandoDetallePaciente] = useState(false);
  const [cargando_edicion_paciente, setCargandoEdicionPaciente] = useState(false);
  const [notas_generales_config, setNotasGeneralesConfig] = useState<DocumentoConfig>({ ...CONFIG_DOC_DEF });
  const [notas_medicas_config, setNotasMedicasConfig] = useState<DocumentoConfig>({ ...CONFIG_DOC_DEF });
  const [tiene_odontogramas, setTieneOdontogramas] = useState(false);
  const [tiene_odontograma_paciente, setTieneOdontogramaPaciente] = useState(false);
  const [tiene_plantillas_consentimiento, setTienePlantillasConsentimiento] = useState(false);
  const [tiene_plantillas_recetas, setTienePlantillasRecetas] = useState(false);

  const refrescarTieneOdontogramaPaciente = useCallback(async (pacienteId: number | null | undefined) => {
    if (!pacienteId) {
      setTieneOdontogramaPaciente(false);
      return;
    }

    try {
      const res = await odontogramaApi.obtenerPorPaciente(pacienteId);
      const tiene = Array.isArray(res) ? res.length > 0 : Boolean(res);
      setTieneOdontogramaPaciente(tiene);
    } catch {
      setTieneOdontogramaPaciente(false);
    }
  }, []);

  const abrirDialogoConfirmarEliminar = (id: number) => {
    setPacienteAEliminar(id);
    setResumenEliminacion(null);
    setErrorResumenEliminacion(null);
    setDialogoConfirmarEliminarAbierto(true);
  };

  useEffect(() => {
    const cargarResumen = async (paciente_id: number) => {
      const requestId = Date.now();
      ultima_peticion_resumen_eliminacion.current = requestId;
      setCargandoResumenEliminacion(true);
      setErrorResumenEliminacion(null);
      try {
        const data = await pacientesApi.obtenerResumenEliminacion(paciente_id);
        if (ultima_peticion_resumen_eliminacion.current !== requestId) return;
        setResumenEliminacion(data);
      } catch (e: any) {
        if (ultima_peticion_resumen_eliminacion.current !== requestId) return;
        setErrorResumenEliminacion(obtenerMensajeErrorPaciente(e?.response?.data?.message) || 'No se pudo cargar el resumen de eliminación.');
      } finally {
        if (ultima_peticion_resumen_eliminacion.current === requestId) {
          setCargandoResumenEliminacion(false);
        }
      }
    };

    if (dialogo_confirmar_eliminar_abierto && paciente_a_eliminar) {
      void cargarResumen(paciente_a_eliminar);
    }
  }, [dialogo_confirmar_eliminar_abierto, paciente_a_eliminar]);

  const [catalogos, setCatalogos] = useState({
    alergias: [] as ItemCatalogo[],
    enfermedades: [] as ItemCatalogo[],
    medicamentos: [] as ItemCatalogo[],
    colores: [] as ItemCatalogo[],
  });

  const [formulario, setFormulario] = useState({
    nombre: '',
    apellidos: '',
    codigo_pais: '+591',
    numero_telefono: '',
    correo: '',
    direccion: '',
    notas_generales: '',
    alergias_ids: [] as number[],
    enfermedades_ids: [] as number[],
    medicamentos_ids: [] as number[],
    notas_medicas: '',
    color_categoria: '',
  });

  const [formulario_inicial, setFormularioInicial] = useState<typeof formulario | null>(null);

  const [formulario_color, setFormularioColor] = useState({
    nombre: '',
    descripcion: '',
    color: '#808080',
  });

  const [versiones_historia, setVersionesHistoria] = useState<HistoriaClinicaVersion[]>([]);
  const [version_activa, setVersionActiva] = useState<HistoriaClinicaVersion | null>(null);
  const [version_visualizada, setVersionVisualizada] = useState<HistoriaClinicaVersion | null>(null);
  const [cargando_historias, setCargandoHistorias] = useState(false);
  const [dialogo_historia_abierto, setDialogoHistoriaAbierto] = useState(false);
  const [historia_en_edicion, setHistoriaEnEdicion] = useState<HistoriaClinicaVersion | null>(null);
  const [historia_contenido, setHistoriaContenido] = useState('');
  const [historia_config, setHistoriaConfig] = useState<DocumentoConfig>({ ...CONFIG_DOC_DEF });
  const [guardando_historia, setGuardandoHistoria] = useState(false);
  const [creando_historia, setCreandoHistoria] = useState(false);
  const [historia_tocada, setHistoriaTocada] = useState(false);

  const [historia_inicial, setHistoriaInicial] = useState<{
    nombre: string;
    contenido: string;
    config: DocumentoConfig;
  } | null>(null);

  const editor_historia_ref = useRef<EditorHandle | null>(null);
  const [dialogo_odontograma_historia_abierto, setDialogoOdontogramaHistoriaAbierto] = useState(false);

  const formulario_sucio = formulario_inicial !== null && JSON.stringify(formulario) !== JSON.stringify(formulario_inicial);
  const formulario_sucio_para_cierre = modo_edicion ? true : formulario_sucio;

  const { handleOpenChange, closeConfirmationProps } = useSafeClose({
    isOpen: dialogo_abierto,
    onOpenChange: setDialogoAbierto,
    isDirty: formulario_sucio_para_cierre,
    isLoading: guardando || cargando_edicion_paciente,
  });

  const historia_sucia = useMemo(() => {
    if (!dialogo_historia_abierto) return false;
    if (!historia_en_edicion || historia_en_edicion.finalizada) return false;

    if (historia_tocada) return true;
    if (!historia_inicial) return false;

    const nombreActual = (historia_en_edicion.nombre || '').trim();
    const nombreInicial = (historia_inicial.nombre || '').trim();

    return (
      nombreActual !== nombreInicial ||
      historia_contenido !== historia_inicial.contenido ||
      JSON.stringify(historia_config) !== JSON.stringify(historia_inicial.config)
    );
  }, [dialogo_historia_abierto, historia_en_edicion, historia_tocada, historia_inicial, historia_contenido, historia_config]);

  const {
    handleOpenChange: handleHistoriaOpenChange,
    closeConfirmationProps: closeHistoriaConfirmationProps,
  } = useSafeClose({
    isOpen: dialogo_historia_abierto,
    onOpenChange: setDialogoHistoriaAbierto,
    isDirty: historia_sucia,
    isLoading: guardando_historia || creando_historia,
  });

  useEffect(() => {
    cargarDatosIniciales();
    cargarCatalogos();
  }, []);

  useEffect(() => {
    let cancelado = false;

    const verificarPlantillas = async () => {
      try {
        const [consentimientos, recetas] = await Promise.all([
          plantillasConsentimientoApi.obtenerTodas(),
          plantillasRecetasApi.obtenerTodas(),
        ]);

        if (cancelado) return;

        setTienePlantillasConsentimiento(Array.isArray(consentimientos) && consentimientos.length > 0);
        setTienePlantillasRecetas(Array.isArray(recetas) && recetas.length > 0);
      } catch {
        if (cancelado) return;
        setTienePlantillasConsentimiento(false);
        setTienePlantillasRecetas(false);
      }
    };

    void verificarPlantillas();

    return () => {
      cancelado = true;
    };
  }, []);

  const obtenerTextoBusquedaPaciente = useCallback((p: Paciente) => {
    return `${p.nombre} ${p.apellidos} ${p.id} ${p.telefono || ''} ${p.correo || ''}`;
  }, []);

  const {
    items_filtrados: pacientes,
    items_paginados: pacientes_paginados,
    pagina_actual,
    setPaginaActual,
    items_por_pagina,
    setItemsPorPagina,
    total_paginas,
  } = useBusquedaPaginacion({
    items: todos_pacientes,
    busqueda,
    obtenerTexto: obtenerTextoBusquedaPaciente,
    items_por_pagina_inicial: 10,
  });

  useEffect(() => {
    let cancelado = false;

    const verificarOdontogramas = async () => {
      if (todos_pacientes.length === 0) {
        setTieneOdontogramas(false);
        return;
      }

      try {
        const candidatos = todos_pacientes.slice(0, 5);
        for (const paciente of candidatos) {
          const res = await odontogramaApi.obtenerPorPaciente(paciente.id);
          const tiene = Array.isArray(res) ? res.length > 0 : Boolean(res);
          if (tiene) {
            if (!cancelado) setTieneOdontogramas(true);
            return;
          }
        }
        if (!cancelado) setTieneOdontogramas(false);
      } catch {
        if (!cancelado) setTieneOdontogramas(false);
      }
    };

    void verificarOdontogramas();

    return () => {
      cancelado = true;
    };
  }, [todos_pacientes]);

  useEffect(() => {
    void refrescarTieneOdontogramaPaciente(paciente_seleccionado?.id);
  }, [paciente_seleccionado?.id, refrescarTieneOdontogramaPaciente]);

  useEffect(() => {
    if (!dialogo_odontograma_abierto && paciente_seleccionado?.id && paciente_odontograma?.id === paciente_seleccionado.id) {
      void refrescarTieneOdontogramaPaciente(paciente_seleccionado.id);
    }
  }, [dialogo_odontograma_abierto, paciente_odontograma?.id, paciente_seleccionado?.id, refrescarTieneOdontogramaPaciente]);

  const condicionesBloqueoTutoriales = useMemo(() => {
    const tienePacientes = todos_pacientes.length > 0;

    return {
      'pacientes-editar-historia': {
        bloqueado: !tienePacientes,
        mensaje: 'Requiere crear un paciente',
      },
      'pacientes-ver-informacion': {
        bloqueado: !tienePacientes,
        mensaje: 'Requiere crear un paciente',
      },
      'pacientes-gestionar-archivos': {
        bloqueado: !tienePacientes,
        mensaje: 'Requiere crear un paciente',
      },
      'pacientes-crear-consentimiento': {
        bloqueado: !tienePacientes || !tiene_plantillas_consentimiento,
        mensaje: !tienePacientes
          ? 'Requiere crear un paciente'
          : 'Requiere crear una plantilla de consentimiento informado',
      },
      'pacientes-crear-receta': {
        bloqueado: !tienePacientes || !tiene_plantillas_recetas,
        mensaje: !tienePacientes
          ? 'Requiere crear un paciente'
          : 'Requiere crear una plantilla de receta',
      },
      'pacientes-crear-odontograma': {
        bloqueado: !tienePacientes,
        mensaje: 'Requiere crear un paciente',
      },
      'pacientes-editar-odontograma': {
        bloqueado: !tienePacientes || !tiene_odontogramas,
        mensaje: !tienePacientes
          ? 'Requiere crear un paciente'
          : 'Requiere crear un odontograma',
      },
    };
  }, [todos_pacientes.length, tiene_odontogramas, tiene_plantillas_consentimiento, tiene_plantillas_recetas]);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    try {
      const datos = await pacientesApi.obtenerTodos();
      setTodosPacientes(datos);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pacientes',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const obtenerMensajeErrorPaciente = (mensaje: unknown): string => {
    const texto = Array.isArray(mensaje)
      ? mensaje.join(', ')
      : typeof mensaje === 'string'
        ? mensaje
        : '';

    const lower = texto.toLowerCase();

    if (
      lower.includes('correo') &&
      (lower.includes('must be an email') || lower.includes('must be email') || lower.includes('email'))
    ) {
      return 'El correo electrónico no es válido';
    }

    if (lower.includes('must be correo')) {
      return 'El correo electrónico no es válido';
    }

    return texto || 'No se pudo guardar el paciente';
  };

  const cargarDatos = async () => {
    await cargarDatosIniciales();
  };

  const cargarCatalogos = async () => {
    try {
      const [alergias, enfermedades, medicamentos, colores] = await Promise.all([
        catalogoApi.obtenerAlergias(),
        catalogoApi.obtenerEnfermedades(),
        catalogoApi.obtenerMedicamentos(),
        catalogoApi.obtenerColores(),
      ]);
      setCatalogos({ alergias, enfermedades, medicamentos, colores });
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  const abrirDialogoNuevo = () => {
    const nuevoForm = {
      nombre: '',
      apellidos: '',
      codigo_pais: usuario?.codigo_pais || '+591',
      numero_telefono: '',
      correo: '',
      direccion: '',
      notas_generales: '',
      alergias_ids: [] as number[],
      enfermedades_ids: [] as number[],
      medicamentos_ids: [] as number[],
      notas_medicas: '',
      color_categoria: '',
    };
    setFormulario(nuevoForm);
    setFormularioInicial(nuevoForm);
    setModoEdicion(false);
    setNotasGeneralesConfig({ ...CONFIG_DOC_DEF });
    setNotasMedicasConfig({ ...CONFIG_DOC_DEF });
    limpiarEstadoHistoria();
    setDialogoAbierto(true);
  };

  const abrirDialogoEditar = async (paciente: Paciente) => {
    setPacienteSeleccionado(null);
    setFormulario({
      nombre: '',
      apellidos: '',
      codigo_pais: '+591',
      numero_telefono: '',
      correo: '',
      direccion: '',
      notas_generales: '',
      alergias_ids: [],
      enfermedades_ids: [],
      medicamentos_ids: [],
      notas_medicas: '',
      color_categoria: '',
    });
    limpiarEstadoHistoria();
    setModoEdicion(true);
    setDialogoAbierto(true);
    setCargandoEdicionPaciente(true);

    try {
      const datos_completos = await pacientesApi.obtenerPorId(paciente.id);

      const { codigo_pais, numero } = datos_completos.telefono
        ? separarTelefono(datos_completos.telefono)
        : { codigo_pais: '+591', numero: '' };

      const formularioInicialValues = {
        nombre: datos_completos.nombre,
        apellidos: datos_completos.apellidos,
        codigo_pais,
        numero_telefono: numero,
        correo: datos_completos.correo || '',
        direccion: datos_completos.direccion || '',
        notas_generales: datos_completos.notas_generales || '',
        alergias_ids: Array.isArray(datos_completos.alergias) ? datos_completos.alergias : [],
        enfermedades_ids: Array.isArray(datos_completos.enfermedades) ? datos_completos.enfermedades : [],
        medicamentos_ids: Array.isArray(datos_completos.medicamentos) ? datos_completos.medicamentos : [],
        notas_medicas: datos_completos.notas_medicas || '',
        color_categoria: datos_completos.color_categoria || '',
      };

      setFormulario(formularioInicialValues);
      setFormularioInicial(formularioInicialValues);
      setPacienteSeleccionado(datos_completos);
      if (datos_completos.notas_generales_config) {
        setNotasGeneralesConfig({
          tamano_hoja_id: datos_completos.notas_generales_config.tamano_hoja_id ?? null,
          nombre_tamano: datos_completos.notas_generales_config.nombre_tamano ?? 'Personalizado',
          widthMm: datos_completos.notas_generales_config.widthMm ?? 216,
          heightMm: datos_completos.notas_generales_config.heightMm ?? 279,
          margenes: datos_completos.notas_generales_config.margenes ?? { top: 20, right: 20, bottom: 20, left: 20 },
        });
      } else {
        setNotasGeneralesConfig({ tamano_hoja_id: null, nombre_tamano: 'Carta', widthMm: 216, heightMm: 279, margenes: { top: 20, right: 20, bottom: 20, left: 20 } });
      }
      if (datos_completos.notas_medicas_config) {
        setNotasMedicasConfig({
          tamano_hoja_id: datos_completos.notas_medicas_config.tamano_hoja_id ?? null,
          nombre_tamano: datos_completos.notas_medicas_config.nombre_tamano ?? 'Personalizado',
          widthMm: datos_completos.notas_medicas_config.widthMm ?? 216,
          heightMm: datos_completos.notas_medicas_config.heightMm ?? 279,
          margenes: datos_completos.notas_medicas_config.margenes ?? { top: 20, right: 20, bottom: 20, left: 20 },
        });
      } else {
        setNotasMedicasConfig({ tamano_hoja_id: null, nombre_tamano: 'Carta', widthMm: 216, heightMm: 279, margenes: { top: 20, right: 20, bottom: 20, left: 20 } });
      }
      await cargarHistoriasClinicas(paciente.id, false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del paciente',
        variant: 'destructive',
      });
      setDialogoAbierto(false);
    } finally {
      setCargandoEdicionPaciente(false);
    }
  };

  const manejarGuardar = async () => {
    if (!formulario.nombre || !formulario.apellidos) {
      toast({
        title: 'Error',
        description: 'Nombre y apellidos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const telefono_completo = formulario.numero_telefono
        ? formatearTelefonoCompleto(formulario.codigo_pais, formulario.numero_telefono)
        : undefined;

      const datos: any = {
        nombre: formulario.nombre,
        apellidos: formulario.apellidos,
        telefono: telefono_completo,
        correo: formulario.correo || undefined,
        direccion: formulario.direccion || undefined,
        notas_generales: formulario.notas_generales || undefined,
        notas_generales_config: notas_generales_config,
        alergias_ids: formulario.alergias_ids,
        enfermedades_ids: formulario.enfermedades_ids,
        medicamentos_ids: formulario.medicamentos_ids,
        notas_medicas: formulario.notas_medicas || undefined,
        notas_medicas_config: notas_medicas_config,
        color_categoria: formulario.color_categoria || undefined,
      };

      if (modo_edicion && paciente_seleccionado) {
        await pacientesApi.actualizar(paciente_seleccionado.id, datos);
        if (versionSeleccionadaEditable && historia_en_edicion) {
          await historiasClinicasApi.actualizar(paciente_seleccionado.id, historia_en_edicion.id, {
            nombre: historia_en_edicion.nombre,
            contenido_html: historia_contenido,
            config: historia_config,
          });
          await cargarHistoriasClinicas(paciente_seleccionado.id);
        }
        toast({
          title: 'Éxito',
          description: 'Paciente y versión actualizados correctamente',
        });
      } else {
        const paciente_creado = await pacientesApi.crear(datos);
        toast({
          title: 'Éxito',
          description: 'Paciente creado correctamente',
        });
        if (paciente_creado?.id) {
          await crearPrimeraHistoria(paciente_creado.id, false);
        }
      }
      setDialogoAbierto(false);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al guardar paciente:', error);
      toast({
        title: 'Error',
        description: obtenerMensajeErrorPaciente(error.response?.data?.message),
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async () => {
    if (!paciente_a_eliminar) return;

    try {
      await pacientesApi.eliminar(paciente_a_eliminar);
      toast({
        title: 'Éxito',
        description: 'Paciente eliminado correctamente',
      });
      setDialogoConfirmarEliminarAbierto(false);
      setPacienteAEliminar(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el paciente',
        variant: 'destructive',
      });
    }
  };

  const verDetallePaciente = async (id: number) => {
    setPacienteSeleccionado(null);
    setUltimaCita(null);
    setUltimoTratamiento(null);
    limpiarEstadoHistoria();
    setDialogoVerAbierto(true);
    setCargandoDetallePaciente(true);

    try {
      const datos = await pacientesApi.obtenerPorId(id);
      setPacienteSeleccionado(datos);
      await cargarHistoriasClinicas(id, true);
      cargarInfoAdicionalPaciente(id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el paciente',
        variant: 'destructive',
      });
      setDialogoVerAbierto(false);
    } finally {
      setCargandoDetallePaciente(false);
    }
  };

  const cargarInfoAdicionalPaciente = async (id: number) => {
    setCargandoInfoAdicional(true);
    try {
      const [cita, tratamiento] = await Promise.allSettled([
        pacientesApi.obtenerUltimaCita(id),
        pacientesApi.obtenerUltimoTratamiento(id),
      ]);

      if (cita.status === 'fulfilled') {
        setUltimaCita(cita.value);
      } else {
        setUltimaCita(null);
      }

      if (tratamiento.status === 'fulfilled') {
        setUltimoTratamiento(tratamiento.value);
      } else {
        setUltimoTratamiento(null);
      }
    } catch (error) {
      console.error('Error al cargar información adicional:', error);
    } finally {
      setCargandoInfoAdicional(false);
    }
  };

  const obtenerColorPorId = (color_value: string) => {
    return catalogos.colores.find(c => c.color === color_value);
  };

  const prepararWhatsApp = (telefono: string, nombre: string, apellidos: string) => {
    setTelefonoWhatsapp(telefono);
    setNombrePacienteWhatsapp(`${nombre} ${apellidos}`);
    setDialogoWhatsappAbierto(true);
  };

  const confirmarAbrirWhatsApp = () => {
    const numero_limpio = telefono_whatsapp.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${numero_limpio}`, '_blank');
    setDialogoWhatsappAbierto(false);
  };

  const abrirDialogoNuevoColor = () => {
    setFormularioColor({
      nombre: '',
      descripcion: '',
      color: '#808080',
    });
    setDialogoColorAbierto(true);
  };

  const manejarCrearColor = async () => {
    if (!formulario_color.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del color es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardandoColor(true);
    try {
      const nuevo_color = await catalogoApi.crearColor({
        nombre: formulario_color.nombre.trim(),
        color: formulario_color.color,
        descripcion: formulario_color.descripcion.trim() || undefined,
      });

      await cargarCatalogos();

      setFormulario({
        ...formulario,
        color_categoria: nuevo_color.color,
      });

      toast({
        title: 'Éxito',
        description: 'Color agregado al catálogo',
      });

      setDialogoColorAbierto(false);
      setFormularioColor({
        nombre: '',
        descripcion: '',
        color: '#808080',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo agregar el color',
        variant: 'destructive',
      });
    } finally {
      setGuardandoColor(false);
    }
  };

  const agregarAlergia = async (nombre: string) => {
    try {
      const nueva_alergia = await catalogoApi.crearAlergia({ nombre });
      await cargarCatalogos();
      setFormulario({
        ...formulario,
        alergias_ids: [...formulario.alergias_ids, nueva_alergia.id]
      });
      toast({
        title: 'Éxito',
        description: 'Alergia agregada al catálogo',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la alergia',
        variant: 'destructive',
      });
    }
  };

  const agregarEnfermedad = async (nombre: string) => {
    try {
      const nueva_enfermedad = await catalogoApi.crearEnfermedad({ nombre });
      await cargarCatalogos();
      setFormulario({
        ...formulario,
        enfermedades_ids: [...formulario.enfermedades_ids, nueva_enfermedad.id]
      });
      toast({
        title: 'Éxito',
        description: 'Enfermedad agregada al catálogo',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la enfermedad',
        variant: 'destructive',
      });
    }
  };

  const agregarMedicamento = async (nombre: string) => {
    try {
      const nuevo_medicamento = await catalogoApi.crearMedicamento({ nombre });
      await cargarCatalogos();
      setFormulario({
        ...formulario,
        medicamentos_ids: [...formulario.medicamentos_ids, nuevo_medicamento.id]
      });
      toast({
        title: 'Éxito',
        description: 'Medicamento agregado al catálogo',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el medicamento',
        variant: 'destructive',
      });
    }
  };

  const toggleAlergia = (id: number) => {
    setFormulario(prev => ({
      ...prev,
      alergias_ids: prev.alergias_ids.includes(id)
        ? prev.alergias_ids.filter(a => a !== id)
        : [...prev.alergias_ids, id]
    }));
  };

  const toggleEnfermedad = (id: number) => {
    setFormulario(prev => ({
      ...prev,
      enfermedades_ids: prev.enfermedades_ids.includes(id)
        ? prev.enfermedades_ids.filter(e => e !== id)
        : [...prev.enfermedades_ids, id]
    }));
  };

  const toggleMedicamento = (id: number) => {
    setFormulario(prev => ({
      ...prev,
      medicamentos_ids: prev.medicamentos_ids.includes(id)
        ? prev.medicamentos_ids.filter(m => m !== id)
        : [...prev.medicamentos_ids, id]
    }));
  };

  const obtenerAlergiasPorIds = (ids: number[]) => {
    if (!Array.isArray(ids)) return [];
    return ids.map(id => catalogos.alergias.find(a => a.id === id)).filter(Boolean) as ItemCatalogo[];
  };

  const obtenerEnfermedadesPorIds = (ids: number[]) => {
    if (!Array.isArray(ids)) return [];
    return ids.map(id => catalogos.enfermedades.find(e => e.id === id)).filter(Boolean) as ItemCatalogo[];
  };

  const obtenerMedicamentosPorIds = (ids: number[]) => {
    if (!Array.isArray(ids)) return [];
    return ids.map(id => catalogos.medicamentos.find(m => m.id === id)).filter(Boolean) as ItemCatalogo[];
  };

  const limpiarEstadoHistoria = () => {
    setVersionesHistoria([]);
    setVersionActiva(null);
    setVersionVisualizada(null);
    setHistoriaEnEdicion(null);
    setHistoriaContenido('');
    setHistoriaConfig({ ...CONFIG_DOC_DEF });
  };

  const cargarHistoriasClinicas = async (paciente_id: number, crear_si_no_existe: boolean = false) => {
    setCargandoHistorias(true);
    try {
      const lista = await historiasClinicasApi.listarPorPaciente(paciente_id);
      const ordenadas = Array.isArray(lista)
        ? [...lista].sort((a, b) => (a.numero_version || 0) - (b.numero_version || 0))
        : [];

      setVersionesHistoria(ordenadas);
      const ultima = ordenadas[ordenadas.length - 1] || null;
      const editable = ultima && !ultima.finalizada ? ultima : null;
      const seleccion = ultima || null;

      setVersionActiva(editable || null);
      setVersionVisualizada(seleccion);

      if (seleccion) {
        const esEditable = editable && seleccion.id === editable.id && !seleccion.finalizada;
        setHistoriaEnEdicion(esEditable ? seleccion : null);
        setHistoriaContenido(seleccion.contenido_html || '');
        setHistoriaConfig(seleccion.config || { ...CONFIG_DOC_DEF });
      }

      if (crear_si_no_existe && lista.length === 0) {
        await crearPrimeraHistoria(paciente_id, false);
      }
    } catch (error) {
      console.error('Error al cargar historias clínicas', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las versiones de la historia clínica',
        variant: 'destructive',
      });
    }
    setCargandoHistorias(false);
  };

  const abrirEditorHistoria = (version: HistoriaClinicaVersion) => {
    const contenido = version.contenido_html || '';
    const config = version.config || { ...CONFIG_DOC_DEF };
    const nombre = version.nombre || '';

    setHistoriaEnEdicion(version);
    setHistoriaContenido(contenido);
    setHistoriaConfig(config);
    setHistoriaInicial({ nombre, contenido, config });
    setHistoriaTocada(false);
    setDialogoHistoriaAbierto(true);
  };

  const crearPrimeraHistoria = async (paciente_id: number, abrirEditor: boolean = false) => {
    setCreandoHistoria(true);
    try {
      const version = await historiasClinicasApi.crear(paciente_id, {
        contenido_html: '',
        config: { ...CONFIG_DOC_DEF },
      });
      await cargarHistoriasClinicas(paciente_id);
      setVersionActiva(version);
      setVersionVisualizada(version);
      setHistoriaEnEdicion(version);
      setHistoriaContenido(version.contenido_html || '');
      setHistoriaConfig(version.config || { ...CONFIG_DOC_DEF });
      setHistoriaInicial({
        nombre: version.nombre || '',
        contenido: version.contenido_html || '',
        config: version.config || { ...CONFIG_DOC_DEF },
      });
      setHistoriaTocada(false);
      if (abrirEditor) {
        abrirEditorHistoria(version);
      }
      toast({
        title: 'Historia clínica creada',
        description: 'Se generó la primera versión en blanco.',
      });
    } catch (error: any) {
      console.error('Error al crear historia clínica', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la historia clínica',
        variant: 'destructive',
      });
    } finally {
      setCreandoHistoria(false);
    }
  };

  const crearNuevaVersionDesdeActual = async () => {
    if (!paciente_seleccionado) return;
    const base = version_activa || version_visualizada || versiones_historia[0];
    if (!base) {
      await crearPrimeraHistoria(paciente_seleccionado.id, false);
      return;
    }
    setCreandoHistoria(true);
    try {
      if (versionSeleccionadaEditable && historia_en_edicion) {
        await historiasClinicasApi.actualizar(paciente_seleccionado.id, historia_en_edicion.id, {
          nombre: historia_en_edicion.nombre,
          contenido_html: historia_contenido,
          config: historia_config,
        });
      }

      const nueva = await historiasClinicasApi.clonar(paciente_seleccionado.id, base.id);
      await cargarHistoriasClinicas(paciente_seleccionado.id);
      setVersionActiva(nueva);
      setVersionVisualizada(nueva);
      setHistoriaEnEdicion(nueva);
      setHistoriaContenido(nueva.contenido_html || '');
      setHistoriaConfig(nueva.config || { ...CONFIG_DOC_DEF });
      setHistoriaInicial({
        nombre: nueva.nombre || '',
        contenido: nueva.contenido_html || '',
        config: nueva.config || { ...CONFIG_DOC_DEF },
      });
      setHistoriaTocada(false);
      toast({
        title: 'Nueva versión creada',
        description: 'Se creó una copia lista para editar y la versión anterior fue finalizada.',
      });
    } catch (error: any) {
      console.error('Error al clonar historia clínica', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la nueva versión',
        variant: 'destructive',
      });
    } finally {
      setCreandoHistoria(false);
    }
  };

  const seleccionarVersionHistoria = (versionId: number) => {
    const seleccionada = versiones_historia.find((v) => v.id === versionId);
    if (!seleccionada) return;
    setVersionVisualizada(seleccionada);

    const esEditable = version_activa && seleccionada.id === version_activa.id && !seleccionada.finalizada;
    setHistoriaEnEdicion(esEditable ? seleccionada : null);
    setHistoriaContenido(seleccionada.contenido_html || '');
    setHistoriaConfig(seleccionada.config || { ...CONFIG_DOC_DEF });
  };

  const guardarHistoriaClinica = async () => {
    if (!paciente_seleccionado || !historia_en_edicion) return;
    setGuardandoHistoria(true);
    try {
      await historiasClinicasApi.actualizar(paciente_seleccionado.id, historia_en_edicion.id, {
        nombre: historia_en_edicion.nombre,
        contenido_html: historia_contenido,
        config: historia_config,
      });
      setHistoriaInicial({
        nombre: historia_en_edicion.nombre || '',
        contenido: historia_contenido,
        config: historia_config,
      });
      setHistoriaTocada(false);
      await cargarHistoriasClinicas(paciente_seleccionado.id);
      setDialogoHistoriaAbierto(false);
      toast({ title: 'Guardado', description: 'Historia clínica actualizada' });
    } catch (error: any) {
      console.error('Error al guardar historia clínica', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar la historia clínica',
        variant: 'destructive',
      });
    } finally {
      setGuardandoHistoria(false);
    }
  };

  const finalizarHistoriaClinica = async (version: HistoriaClinicaVersion) => {
    if (!paciente_seleccionado) return;
    setGuardandoHistoria(true);
    try {
      await historiasClinicasApi.finalizar(paciente_seleccionado.id, version.id);
      await cargarHistoriasClinicas(paciente_seleccionado.id);
      setDialogoHistoriaAbierto(false);
      toast({ title: 'Versión finalizada', description: 'La versión quedó bloqueada para edición.' });
    } catch (error: any) {
      console.error('Error al finalizar historia clínica', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo finalizar la versión',
        variant: 'destructive',
      });
    } finally {
      setGuardandoHistoria(false);
    }
  };

  const versionSeleccionadaEditable = Boolean(
    version_visualizada &&
    version_activa &&
    version_visualizada.id === version_activa.id &&
    !version_visualizada.finalizada,
  );

  const insertarHtmlEnHistoria = useCallback((html: string) => {
    const chain = editor_historia_ref.current?.chain?.();
    if (chain && typeof chain.focus === 'function') {
      try {
        chain.focus().insertContent(html).run();
        return;
      } catch (e) {
        console.error('No se pudo insertar en el editor (chain.insertContent)', e);
      }
    }
    setHistoriaContenido((prev) => `${prev || ''}${html || ''}`);
    setHistoriaTocada(true);
  }, []);

  const esUltimaSeleccionada = Boolean(
    version_visualizada &&
    versiones_historia.length > 0 &&
    version_visualizada.id === versiones_historia[versiones_historia.length - 1].id,
  );

  if (cargando && pacientes.length === 0) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando pacientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProveedorTutorialesPagina
      pagina="/pacientes"
      definicionesTutoriales={TUTORIALES_PACIENTES}
      condicionesBloqueo={condicionesBloqueoTutoriales}
    >
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 id={IDS_ELEMENTOS_PACIENTES.TITULO_PAGINA} className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                  <TituloAccionable titulo="Pacientes">Pacientes</TituloAccionable>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Gestiona la información de tus pacientes
                </p>
              </div>

              <Button
                id={IDS_ELEMENTOS_PACIENTES.BTN_NUEVO_PACIENTE}
                size="lg"
                className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                onClick={abrirDialogoNuevo}
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Paciente
              </Button>
            </div>

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">Búsqueda de Pacientes</CardTitle>
                  <CardDescription>Busca por nombre, apellidos o ID</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar paciente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-11 hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Lista de Pacientes</CardTitle>
                      <CardDescription>
                        {pacientes.length} de {todos_pacientes.length} paciente{todos_pacientes.length !== 1 ? 's' : ''}
                        {busqueda && ' (filtrados)'}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Mostrar:</Label>
                    <Select
                      value={items_por_pagina.toString()}
                      onValueChange={(v) => {
                        setItemsPorPagina(Number(v));
                        setPaginaActual(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pacientes.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {busqueda ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {busqueda
                        ? 'Intenta con otros términos de búsqueda o limpia el filtro'
                        : 'Comienza creando tu primer paciente usando el botón "Nuevo Paciente"'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Nombre Completo</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pacientes_paginados.map((paciente, index) => (
                        <TableRow key={paciente.id} className="hover:bg-secondary/50 transition-colors duration-200">
                        <TableCell>
                          {paciente.color_categoria && (
                            <div
                              className="w-4 h-4 rounded-full hover:scale-125 transition-transform duration-200 cursor-help"
                              style={{ backgroundColor: paciente.color_categoria }}
                              title={obtenerColorPorId(paciente.color_categoria)?.nombre || 'Color de categoría'}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {paciente.nombre} {paciente.apellidos}
                        </TableCell>
                        <TableCell>
                          {paciente.telefono ? (
                            <div className="flex items-center gap-2">
                              <span>{paciente.telefono}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  prepararWhatsApp(paciente.telefono!, paciente.nombre, paciente.apellidos);
                                }}
                                className="h-7 w-7 hover:bg-green-500/20 hover:text-green-500 transition-all duration-200"
                                title="Abrir WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{paciente.correo || '-'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => verDetallePaciente(paciente.id)}
                            id={index === 0 ? IDS_ELEMENTOS_PACIENTES.BTN_VER_PRIMER_PACIENTE : undefined}
                            className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            id={index === 0 ? 'btn-pacientes-odontograma-primer' : undefined}
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPacienteOdontograma(paciente);
                              setDialogoOdontogramaAbierto(true);
                            }}
                            className="hover:bg-cyan-500/20 hover:text-cyan-500 hover:scale-110 transition-all duration-200"
                            title="Odontograma"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 2C9.5 2 7.5 3 7 5.5C6.5 8 5 9 4 10C3 11 2.5 13 3 15C3.5 17 5 19 6 21C7 23 8 22 8.5 20C9 18 9.5 15 10 14C10.5 13 11 12.5 12 12.5C13 12.5 13.5 13 14 14C14.5 15 15 18 15.5 20C16 22 17 23 18 21C19 19 20.5 17 21 15C21.5 13 21 11 20 10C19 9 17.5 8 17 5.5C16.5 3 14.5 2 12 2Z" />
                            </svg>
                          </Button>
                          <Button
                            id={index === 0 ? 'btn-pacientes-editar-primer' : undefined}
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirDialogoEditar(paciente)}
                            className="hover:bg-blue-500/20 hover:text-blue-500 hover:scale-110 transition-all duration-200"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirDialogoConfirmarEliminar(paciente.id)}
                            className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>

                  {total_paginas > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                        disabled={pagina_actual === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {pagina_actual} de {total_paginas}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual((p) => Math.min(total_paginas, p + 1))}
                        disabled={pagina_actual === total_paginas}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eliminar paciente</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="text-sm text-destructive space-y-2">
              <p>Antes de eliminar, revisa lo que ocurrirá:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Se cancelarán todos los tratamientos pendientes.</li>
                <li>Se cancelarán todas las citas pendientes.</li>
                <li>Se cerrarán como confirmadas las citas pasadas que estén sin confirmar.</li>
                <li>
                  Los tratamientos no finalizados se cancelarán, excepto si están al 100% pagados: en ese caso se marcarán como finalizados automáticamente.
                </li>
                <li>Los tratamientos completados se mantendrán completados.</li>
              </ul>
            </div>
          </div>

          {cargando_resumen_eliminacion && (
            <div className="text-sm text-muted-foreground">Cargando resumen de citas y tratamientos…</div>
          )}

          {error_resumen_eliminacion && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error_resumen_eliminacion}</p>
              <p className="text-xs text-muted-foreground mt-2">No se habilitará la eliminación hasta cargar este resumen.</p>
            </div>
          )}

          {resumen_eliminacion && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="text-sm font-semibold text-foreground">
                  {resumen_eliminacion.paciente?.nombre} {resumen_eliminacion.paciente?.apellidos}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Citas: {resumen_eliminacion.resumen?.total_citas ?? 0} · Pagadas: {resumen_eliminacion.resumen?.citas_pagadas ?? 0} · Canceladas: {resumen_eliminacion.resumen?.citas_canceladas ?? 0} · Se cancelarán: {resumen_eliminacion.resumen?.citas_que_se_cancelaran ?? 0} · Se confirmarán (pasadas): {resumen_eliminacion.resumen?.citas_pasadas_sin_confirmar_que_se_confirmaran ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Planes: {resumen_eliminacion.resumen?.total_planes ?? 0} · Completados: {resumen_eliminacion.resumen?.planes_completados ?? 0} · Se completarán: {resumen_eliminacion.resumen?.planes_que_se_completaran_automaticamente ?? 0} · Quedarán cancelados: {resumen_eliminacion.resumen?.planes_que_quedaran_cancelados ?? 0}
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="detalles" className="border rounded-lg">
                  <AccordionTrigger className="px-3 hover:no-underline">
                    Ver detalles (citas y tratamientos)
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <div className="text-xs text-muted-foreground mb-3">
                      Aquí se listan los registros afectados para que revises antes de eliminar.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border">
                        <div className="text-sm font-semibold">Citas que se cancelarán</div>
                        <div className="text-xs text-muted-foreground mb-2">Incluye citas pendientes (o sin estado explícito).</div>
                        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-2">
                          {(resumen_eliminacion.citas || [])
                            .filter((c: any) => c.se_cancelara_al_eliminar)
                            .map((c: any) => (
                              <div key={String(c.fecha) + String(c.descripcion)} className="text-xs">
                                {new Date(c.fecha).toLocaleString()} · {c.descripcion}
                              </div>
                            ))}
                          {(resumen_eliminacion.citas || []).filter((c: any) => c.se_cancelara_al_eliminar).length === 0 && (
                            <div className="text-xs text-muted-foreground">No hay citas pendientes para cancelar.</div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border">
                        <div className="text-sm font-semibold">Citas pagadas</div>
                        <div className="text-xs text-muted-foreground mb-2">Se mantienen como registro.</div>
                        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-2">
                          {(resumen_eliminacion.citas || [])
                            .filter((c: any) => String(c.estado_pago || '').toLowerCase() === 'pagado')
                            .map((c: any) => (
                              <div key={String(c.fecha) + String(c.descripcion)} className="text-xs">
                                {new Date(c.fecha).toLocaleString()} · {c.descripcion}
                              </div>
                            ))}
                          {(resumen_eliminacion.citas || []).filter((c: any) => String(c.estado_pago || '').toLowerCase() === 'pagado').length === 0 && (
                            <div className="text-xs text-muted-foreground">No hay citas pagadas.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border mt-3">
                      <div className="text-sm font-semibold">Tratamientos</div>
                      <div className="text-xs text-muted-foreground mb-2">Se indica si se mantendrán, se completarán o se cancelarán.</div>
                      <div className="space-y-1 max-h-[220px] overflow-y-auto pr-2">
                        {(resumen_eliminacion.planes || []).map((p: any) => (
                          <div key={p.tratamiento?.nombre + String(p.estado)} className="text-xs">
                            {p.tratamiento?.nombre || 'Tratamiento'} · Estado actual: {p.estado}
                            {p.se_completara_al_eliminar ? ' · Se marcará como finalizado' : ''}
                            {p.se_cancelara_al_eliminar ? ' · Se cancelará' : ''}
                          </div>
                        ))}
                        {(resumen_eliminacion.planes || []).length === 0 && (
                          <div className="text-xs text-muted-foreground">No hay tratamientos registrados.</div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarAbierto(false);
                setPacienteAEliminar(null);
                setResumenEliminacion(null);
                setErrorResumenEliminacion(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={manejarEliminar}
              disabled={cargando_resumen_eliminacion || !!error_resumen_eliminacion || !resumen_eliminacion}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar Paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_abierto} onOpenChange={handleOpenChange}>
        <DialogContent
          id={IDS_ELEMENTOS_PACIENTES.DIALOG_PACIENTE}
          className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col"
        >
          <DialogHeader>
            <DialogTitle>
              {modo_edicion ? 'Editar Paciente' : 'Nuevo Paciente'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion
                ? 'Modifica la información del paciente'
                : 'Completa los datos del nuevo paciente'}
            </DialogDescription>
          </DialogHeader>

          <div id={IDS_ELEMENTOS_PACIENTES.DIALOG_SCROLL_CONTAINER} className="flex-1 overflow-y-auto pr-2">
            {modo_edicion && cargando_edicion_paciente ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Cargando información del paciente...</p>
              </div>
            ) : (
              <Tabs defaultValue="datos-generales" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger id={IDS_ELEMENTOS_PACIENTES.TAB_DATOS_GENERALES} value="datos-generales">Datos Generales</TabsTrigger>
                  <TabsTrigger id={IDS_ELEMENTOS_PACIENTES.TAB_INFO_MEDICA} value="anamnesis">Información Médica</TabsTrigger>
                </TabsList>

                <TabsContent value="datos-generales" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={IDS_ELEMENTOS_PACIENTES.INPUT_NOMBRE}>Nombre *</Label>
                      <Input
                        id={IDS_ELEMENTOS_PACIENTES.INPUT_NOMBRE}
                        value={formulario.nombre}
                        onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                        placeholder="Juan"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={IDS_ELEMENTOS_PACIENTES.INPUT_APELLIDOS}>Apellidos *</Label>
                      <Input
                        id={IDS_ELEMENTOS_PACIENTES.INPUT_APELLIDOS}
                        value={formulario.apellidos}
                        onChange={(e) => setFormulario({ ...formulario, apellidos: e.target.value })}
                        placeholder="Pérez López"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <PhoneInput
                      codigo_pais={formulario.codigo_pais}
                      numero={formulario.numero_telefono}
                      onCodigoPaisChange={(codigo) => setFormulario({ ...formulario, codigo_pais: codigo })}
                      onNumeroChange={(numero) => setFormulario({ ...formulario, numero_telefono: numero })}
                      label="Teléfono"
                      placeholder="70123456"
                      idCodigoPais={IDS_ELEMENTOS_PACIENTES.TEL_CODIGO_PAIS}
                      idNumero={IDS_ELEMENTOS_PACIENTES.TEL_NUMERO}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="correo">Correo Electrónico</Label>
                      <Input
                        id="correo"
                        type="email"
                        value={formulario.correo}
                        onChange={(e) => setFormulario({ ...formulario, correo: e.target.value })}
                        placeholder="paciente@email.com"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formulario.direccion}
                      onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
                      placeholder="Calle Principal #123"
                      className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <div id={IDS_ELEMENTOS_PACIENTES.NOTAS_GENERALES} className="space-y-2">
                    <Label htmlFor={IDS_ELEMENTOS_PACIENTES.NOTAS_GENERALES}>Notas Generales</Label>
                    <EditorHtmlRico
                      contenido={formulario.notas_generales}
                      onChange={(contenido) => setFormulario({ ...formulario, notas_generales: contenido })}
                      minHeight="180px"
                      placeholder="Notas generales del paciente..."
                      className="border rounded-md"
                    />
                  </div>

                  <div id={IDS_ELEMENTOS_PACIENTES.COLORES_CONTAINER} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Color de Categoría</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={abrirDialogoNuevoColor}
                        className="hover:bg-primary/20 hover:scale-105 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Color
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Selecciona un color del catálogo para identificar al paciente
                    </p>
                    <ScrollArea
                      className={`rounded-md border border-border p-3 ${catalogos.colores.filter(c => c.color).length > 8
                        ? 'h-[200px]'
                        : 'h-auto max-h-[200px]'
                        }`}
                    >
                      <div className="flex gap-2 flex-wrap items-end">
                        {catalogos.colores.filter(c => c.color).map((color) => {
                          const nombreCompleto = color.nombre || '';
                          const nombreHeader = truncarTexto(nombreCompleto, 14);

                          return (
                            <div key={color.id} className="w-14">
                              <div
                                className="text-[10px] leading-3 text-muted-foreground truncate text-center mb-1"
                              >
                                {nombreHeader || '—'}
                              </div>
                              <button
                                type="button"
                                className={`group relative w-12 h-12 mx-auto rounded-lg border-2 ${formulario.color_categoria === color.color
                                  ? 'border-foreground shadow-lg'
                                  : 'border-transparent'
                                  }`}
                                style={{ backgroundColor: color.color! }}
                                onClick={() => setFormulario({ ...formulario, color_categoria: color.color! })}
                                aria-label={`Seleccionar color: ${nombreCompleto}`}
                              >
                              </button>
                            </div>
                          );
                        })}
                        {formulario.color_categoria && (
                          <div className="w-14">
                            <div className="text-[10px] leading-3 text-muted-foreground text-center mb-1">&nbsp;</div>
                            <button
                              type="button"
                              className="w-12 h-12 mx-auto rounded-lg border-2 border-border bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                              onClick={() => setFormulario({ ...formulario, color_categoria: '' })}
                              aria-label="Limpiar color"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    {formulario.color_categoria && (
                      <div className="p-3 mt-2 rounded-lg bg-secondary/30 border border-border">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">
                            {obtenerColorPorId(formulario.color_categoria)?.nombre || 'Color seleccionado'}
                          </span>
                        </p>
                        {obtenerColorPorId(formulario.color_categoria)?.descripcion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {obtenerColorPorId(formulario.color_categoria)?.descripcion}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="anamnesis" className="space-y-4 mt-4">
                  <div id={IDS_ELEMENTOS_PACIENTES.ALERGIAS_SECTION} className="space-y-2">
                    <Label>Alergias</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formulario.alergias_ids.map((id) => {
                        const alergia = catalogos.alergias.find(a => a.id === id);
                        return alergia ? (
                          <Badge
                            key={id}
                            variant="destructive"
                            className="cursor-pointer hover:bg-destructive/80 transition-all duration-200"
                            onClick={() => toggleAlergia(id)}
                          >
                            {alergia.nombre} ×
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <SelectConAgregar
                      opciones={catalogos.alergias.map(a => ({ valor: a.id.toString(), etiqueta: a.nombre }))}
                      valor=""
                      onChange={(valor) => {
                        if (valor) toggleAlergia(parseInt(valor));
                      }}
                      onAgregarNuevo={agregarAlergia}
                      estiloAgregar="destacado"
                      placeholder="Seleccionar alergia"
                      textoAgregar="Agregar nueva alergia"
                      tituloModal="Agregar Nueva Alergia"
                      descripcionModal="Ingresa el nombre de la alergia"
                      placeholderInput="Ej: Penicilina"
                    />
                  </div>

                  <div id={IDS_ELEMENTOS_PACIENTES.ENFERMEDADES_SECTION} className="space-y-2">
                    <Label>Enfermedades Preexistentes</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formulario.enfermedades_ids.map((id) => {
                        const enfermedad = catalogos.enfermedades.find(e => e.id === id);
                        return enfermedad ? (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80 hover:text-destructive transition-all duration-200"
                            onClick={() => toggleEnfermedad(id)}
                          >
                            {enfermedad.nombre} ×
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <SelectConAgregar
                      opciones={catalogos.enfermedades.map(e => ({ valor: e.id.toString(), etiqueta: e.nombre }))}
                      valor=""
                      onChange={(valor) => {
                        if (valor) toggleEnfermedad(parseInt(valor));
                      }}
                      onAgregarNuevo={agregarEnfermedad}
                      estiloAgregar="destacado"
                      placeholder="Seleccionar enfermedad"
                      textoAgregar="Agregar nueva enfermedad"
                      tituloModal="Agregar Nueva Enfermedad"
                      descripcionModal="Ingresa el nombre de la enfermedad"
                      placeholderInput="Ej: Diabetes"
                    />
                  </div>

                  <div id={IDS_ELEMENTOS_PACIENTES.MEDICAMENTOS_SECTION} className="space-y-2">
                    <Label>Medicamentos Actuales</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formulario.medicamentos_ids.map((id) => {
                        const medicamento = catalogos.medicamentos.find(m => m.id === id);
                        return medicamento ? (
                          <Badge
                            key={id}
                            className="cursor-pointer hover:bg-primary/80 transition-all duration-200"
                            onClick={() => toggleMedicamento(id)}
                          >
                            {medicamento.nombre} ×
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <SelectConAgregar
                      opciones={catalogos.medicamentos.map(m => ({ valor: m.id.toString(), etiqueta: m.nombre }))}
                      valor=""
                      onChange={(valor) => {
                        if (valor) toggleMedicamento(parseInt(valor));
                      }}
                      onAgregarNuevo={agregarMedicamento}
                      estiloAgregar="destacado"
                      placeholder="Seleccionar medicamento"
                      textoAgregar="Agregar nuevo medicamento"
                      tituloModal="Agregar Nuevo Medicamento"
                      descripcionModal="Ingresa el nombre del medicamento"
                      placeholderInput="Ej: Aspirina"
                    />
                  </div>

                  <div id={IDS_ELEMENTOS_PACIENTES.HISTORIA_SECTION} className="space-y-2">
                    <Label>Historia Clínica</Label>
                    {!modo_edicion && (
                      <div id={IDS_ELEMENTOS_PACIENTES.HISTORIA_BLOQUEADA_MSG} className="p-4 rounded-lg border border-border bg-secondary/30 text-sm text-muted-foreground">
                        Primero debe crear el paciente para iniciar una historia clínica.
                      </div>
                    )}

                    {modo_edicion && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Solo la última versión es editable; las anteriores se pueden visualizar.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Cada versión conserva su tamaño de hoja y márgenes.
                            </p>
                          </div>
                          {versiones_historia.length > 0 && (
                            <Button
                                id="btn-historia-crear-nueva-version"
                              type="button"
                              variant="secondary"
                              onClick={crearNuevaVersionDesdeActual}
                              disabled={creando_historia || guardando_historia || versiones_historia.length === 0 || !esUltimaSeleccionada}
                            >
                              {creando_historia && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Guardar y crear nueva versión
                            </Button>
                          )}
                        </div>

                        {cargando_historias ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando versiones...
                          </div>
                        ) : versiones_historia.length === 0 ? (
                          <div className="p-4 rounded-lg border border-dashed text-sm text-muted-foreground flex items-center justify-between gap-3">
                            <span>Aún no hay versiones. Crea la primera para comenzar a documentar.</span>
                            {paciente_seleccionado && (
                              <Button id="btn-historia-crear-primera" onClick={() => crearPrimeraHistoria(paciente_seleccionado.id, false)} disabled={creando_historia}>
                                {creando_historia && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear primera versión
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-sm">Seleccionar versión</Label>
                                <Combobox
                                  opciones={versiones_historia.map((v) => ({
                                    valor: v.id.toString(),
                                    etiqueta: `Versión ${v.numero_version}: ${v.nombre || 'Sin nombre'}${v.id === version_activa?.id ? ' (actual)' : ''}`
                                  }))}
                                  valor={version_visualizada?.id?.toString() ?? ''}
                                  onChange={(valor) => seleccionarVersionHistoria(Number(valor))}
                                  placeholder="Seleccionar versión"
                                  textoVacio="No hay versiones disponibles"
                                  idTrigger="historia-combobox-version"
                                />
                                {version_visualizada && (
                                  <p className="text-xs text-muted-foreground">
                                    {version_visualizada.finalizada ? 'Solo lectura' : 'Editable'} · {formatearFechaHoraLocal(version_visualizada.creado_en)}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <Label className="text-sm">Nombre de la versión</Label>
                                <Input
                                  id="historia-nombre-version"
                                  value={versionSeleccionadaEditable ? (historia_en_edicion?.nombre || '') : (version_visualizada?.nombre || '')}
                                  onChange={(e) => {
                                    if (!version_visualizada) return;
                                    const nuevoNombre = e.target.value;
                                    if (versionSeleccionadaEditable) {
                                      setHistoriaEnEdicion((prev) => (prev && prev.id === version_visualizada.id ? { ...prev, nombre: nuevoNombre } : prev));
                                      setVersionActiva((prev) => (prev && prev.id === version_visualizada.id ? { ...prev, nombre: nuevoNombre } : prev));
                                    }
                                    setVersionVisualizada({ ...version_visualizada, nombre: nuevoNombre });
                                    setVersionesHistoria((prev) => prev.map((v) => (v.id === version_visualizada.id ? { ...v, nombre: nuevoNombre } : v)));
                                  }}
                                  disabled={!versionSeleccionadaEditable}
                                />
                                {!versionSeleccionadaEditable && (
                                  <p className="text-xs text-muted-foreground">Esta versión está bloqueada. Solo la última versión sin finalizar se puede editar.</p>
                                )}
                              </div>
                            </div>

                            <div id="historia-editor-container">
                              <EditorDocumento
                                valorHtml={versionSeleccionadaEditable ? historia_contenido : (version_visualizada?.contenido_html || '')}
                                onChangeHtml={versionSeleccionadaEditable ? setHistoriaContenido : () => { }}
                                config={versionSeleccionadaEditable ? historia_config : ((version_visualizada as any)?.config ?? historia_config)}
                                onChangeConfig={versionSeleccionadaEditable ? setHistoriaConfig : () => { }}
                                minHeight="320px"
                                soloLectura={!versionSeleccionadaEditable}
                                idPrefix="historia-editor"
                                mostrarBotonOdontograma
                                onAbrirOdontograma={tiene_odontograma_paciente ? () => {
                                  if (!paciente_seleccionado) return;
                                  setDialogoOdontogramaHistoriaAbierto(true);
                                } : undefined}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          <DialogFooter>
            <Button
              id={IDS_ELEMENTOS_PACIENTES.BTN_CANCELAR_PACIENTE}
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              id={IDS_ELEMENTOS_PACIENTES.BTN_GUARDAR_PACIENTE}
              onClick={manejarGuardar}
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_whatsapp_abierto} onOpenChange={setDialogoWhatsappAbierto}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Confirmar Apertura de WhatsApp
            </DialogTitle>
            <DialogDescription>
              Verifica que la información sea correcta antes de continuar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Paciente</Label>
                <p className="text-sm font-semibold text-foreground">{nombre_paciente_whatsapp}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Número de Teléfono</Label>
                <p className="text-base font-bold text-foreground">{telefono_whatsapp}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground">
                Se abrirá WhatsApp en una nueva pestaña con este número. Asegúrate de que el número sea correcto.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoWhatsappAbierto(false)}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarAbrirWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-200"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_color_abierto} onOpenChange={setDialogoColorAbierto}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Color</DialogTitle>
            <DialogDescription>
              Crea un nuevo color para categorizar pacientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-color">Nombre *</Label>
              <Input
                id="nombre-color"
                value={formulario_color.nombre}
                onChange={(e) => setFormularioColor({ ...formulario_color, nombre: e.target.value })}
                placeholder="Ej: Urgente, VIP, Regular..."
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion-color">Descripción (opcional)</Label>
              <Textarea
                id="descripcion-color"
                value={formulario_color.descripcion}
                onChange={(e) => setFormularioColor({ ...formulario_color, descripcion: e.target.value })}
                placeholder="Describe el propósito de esta categoría..."
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-picker">Color *</Label>
              <div className="space-y-3">
                <HexColorPicker
                  color={formulario_color.color}
                  onChange={(color) => setFormularioColor({ ...formulario_color, color })}
                  style={{ width: '100%', height: '150px' }}
                />
                <Input
                  type="text"
                  value={formulario_color.color}
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(valor) || valor === '') {
                      setFormularioColor({ ...formulario_color, color: valor });
                    }
                  }}
                  placeholder="#808080"
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200 font-mono text-center"
                  maxLength={7}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Selecciona el color deseado o ingresa el código hexadecimal
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 border-border bg-secondary/20">
              <p className="text-sm font-semibold mb-3">Vista Previa:</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-lg border-2 border-border shadow-md transition-all duration-200"
                  style={{ backgroundColor: formulario_color.color }}
                />
                <div className="flex-1">
                  <p className="font-medium text-base">{formulario_color.nombre || 'Nombre del color'}</p>
                  {formulario_color.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1">{formulario_color.descripcion}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{formulario_color.color}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoColorAbierto(false);
                setFormularioColor({
                  nombre: '',
                  descripcion: '',
                  color: '#808080',
                });
              }}
              disabled={guardando_color}
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarCrearColor}
              disabled={guardando_color || !formulario_color.nombre.trim()}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando_color && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Palette className="mr-2 h-4 w-4" />
              Crear Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_historia_abierto} onOpenChange={handleHistoriaOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar historia clínica</DialogTitle>
            <DialogDescription>
              Versión {historia_en_edicion?.numero_version || ''}{' '}
              {historia_en_edicion?.finalizada ? '(finalizada)' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Nombre de la versión</Label>
              <Input
                value={historia_en_edicion?.nombre || ''}
                onChange={(e) =>
                  setHistoriaEnEdicion((prev: HistoriaClinicaVersion | null) =>
                    prev ? { ...prev, nombre: e.target.value } : prev,
                  )
                }
                onInput={() => setHistoriaTocada(true)}
                disabled={historia_en_edicion?.finalizada}
              />
            </div>

            <div className="mt-4">
              <div
                onKeyDownCapture={() => setHistoriaTocada(true)}
                onPasteCapture={() => setHistoriaTocada(true)}
              >
                <EditorDocumento
                  valorHtml={historia_contenido}
                  onChangeHtml={(html) => {
                    setHistoriaContenido(html);
                    if (html !== historia_contenido) setHistoriaTocada(true);
                  }}
                  config={historia_config}
                  onChangeConfig={(config) => {
                    setHistoriaConfig(config);
                    if (JSON.stringify(config) !== JSON.stringify(historia_config)) setHistoriaTocada(true);
                  }}
                  minHeight="400px"
                  soloLectura={Boolean(historia_en_edicion?.finalizada)}
                  editorRef={editor_historia_ref as any}
                  mostrarBotonOdontograma
                  onAbrirOdontograma={tiene_odontograma_paciente ? () => {
                    if (!paciente_seleccionado) return;
                    setDialogoOdontogramaHistoriaAbierto(true);
                  } : undefined}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleHistoriaOpenChange(false)}
              disabled={guardando_historia || creando_historia}
            >
              Cancelar
            </Button>
            {!historia_en_edicion?.finalizada && (
              <Button
                variant="secondary"
                onClick={() => historia_en_edicion && finalizarHistoriaClinica(historia_en_edicion)}
                disabled={guardando_historia}
              >
                Finalizar versión
              </Button>
            )}
            {!historia_en_edicion?.finalizada && (
              <Button onClick={guardarHistoriaClinica} disabled={guardando_historia}>
                {guardando_historia && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DialogoOdontogramaHistoria
        abierto={dialogo_odontograma_historia_abierto}
        onCerrar={() => setDialogoOdontogramaHistoriaAbierto(false)}
        pacienteId={paciente_seleccionado?.id || 0}
        pacienteNombre={paciente_seleccionado ? `${paciente_seleccionado.nombre} ${paciente_seleccionado.apellidos}` : ''}
        puedeInsertar={Boolean(paciente_seleccionado) && !Boolean(historia_en_edicion?.finalizada)}
        onInsertarHtml={(html) => {
          if (!historia_en_edicion?.finalizada) insertarHtmlEnHistoria(html);
        }}
      />

      <Dialog
        open={dialogo_ver_abierto}
        onOpenChange={(open) => {
          setDialogoVerAbierto(open);
          if (!open) {
            limpiarEstadoHistoria();
          }
        }}
      >
        <DialogContent id={IDS_ELEMENTOS_PACIENTES.DIALOG_VER_PACIENTE} className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-6 w-6" />
              Detalle del Paciente
            </DialogTitle>
            <DialogDescription className="sr-only">
              Información detallada del paciente seleccionado
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {cargando_detalle_paciente ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Cargando información del paciente...</p>
              </div>
            ) : paciente_seleccionado ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors duration-200">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {paciente_seleccionado.nombre.charAt(0)}{paciente_seleccionado.apellidos.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground">
                      {paciente_seleccionado.nombre} {paciente_seleccionado.apellidos}
                    </h3>
                    {paciente_seleccionado.color_categoria && (
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: paciente_seleccionado.color_categoria }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {obtenerColorPorId(paciente_seleccionado.color_categoria)?.nombre || 'Color de categoría'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Tabs id={IDS_ELEMENTOS_PACIENTES.VER_TABS} defaultValue="contacto" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger id={IDS_ELEMENTOS_PACIENTES.VER_TAB_CONTACTO} value="contacto">Contacto</TabsTrigger>
                    <TabsTrigger id={IDS_ELEMENTOS_PACIENTES.VER_TAB_MEDICO} value="medico">Información Médica</TabsTrigger>
                    <TabsTrigger id={IDS_ELEMENTOS_PACIENTES.VER_TAB_ARCHIVOS} value="archivos">Archivos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="contacto" className="space-y-4 mt-4">
                    <div id={IDS_ELEMENTOS_PACIENTES.VER_CONTACTO_SECCION} className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground">Teléfono</Label>
                        {paciente_seleccionado.telefono ? (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-foreground font-medium">
                              {paciente_seleccionado.telefono}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => prepararWhatsApp(
                                paciente_seleccionado.telefono!,
                                paciente_seleccionado.nombre,
                                paciente_seleccionado.apellidos
                              )}
                              className="hover:bg-green-500/20 hover:text-green-500 hover:border-green-500 transition-all duration-200"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          </div>
                        ) : (
                          <p className="text-foreground font-medium">No registrado</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Correo</Label>
                        <p className="text-foreground font-medium">
                          {paciente_seleccionado.correo || 'No registrado'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Dirección</Label>
                        <p className="text-foreground font-medium">
                          {paciente_seleccionado.direccion || 'No registrada'}
                        </p>
                      </div>
                      {paciente_seleccionado.notas_generales && (
                        <div>
                          <Label className="text-muted-foreground">Notas Generales</Label>
                          <div className="mt-2 p-3 rounded-lg bg-secondary/30 border border-border">
                            <RenderizadorHtml
                              contenido={paciente_seleccionado.notas_generales}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="medico" className="space-y-4 mt-4">
                    {cargando_info_adicional ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div id={IDS_ELEMENTOS_PACIENTES.VER_MEDICO_SECCION} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Card className="border">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Última Cita
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3">
                              {ultima_cita ? (
                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Fecha</Label>
                                    <p className="text-xs font-medium">
                                      {formatearFechaCortaLocal(ultima_cita.fecha)}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Estado</Label>
                                    <div className="mt-1">
                                      <Badge
                                        variant={
                                          ultima_cita.estado_pago === 'pagado' ? 'default' :
                                            ultima_cita.estado_pago === 'pendiente' ? 'secondary' :
                                              'destructive'
                                        }
                                        className="text-xs"
                                      >
                                        {ultima_cita.estado_pago === 'pagado' ? 'Pagado' :
                                          ultima_cita.estado_pago === 'pendiente' ? 'Pendiente' :
                                            'Cancelado'}
                                      </Badge>
                                    </div>
                                  </div>
                                  {ultima_cita.monto_esperado && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Monto</Label>
                                      <p className="text-xs font-semibold">
                                        {formatearMoneda(ultima_cita.monto_esperado)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">
                                    Sin citas
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          <Card className="border">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Último Tratamiento
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3">
                              {ultimo_tratamiento ? (
                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Tratamiento</Label>
                                    <p className="text-xs font-semibold">{ultimo_tratamiento.tratamiento.nombre}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Estado</Label>
                                    <div className="mt-1">
                                      <Badge
                                        variant={
                                          ultimo_tratamiento.estado === 'completado' ? 'default' :
                                            ultimo_tratamiento.estado === 'en_progreso' ? 'secondary' :
                                              'outline'
                                        }
                                        className="text-xs"
                                      >
                                        {ultimo_tratamiento.estado === 'completado' ? 'Completado' :
                                          ultimo_tratamiento.estado === 'en_progreso' ? 'En Progreso' :
                                            ultimo_tratamiento.estado}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Costo</Label>
                                    <p className="text-xs font-semibold">
                                      {formatearMoneda(ultimo_tratamiento.costo_total)}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">
                                    Sin tratamientos
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                        {paciente_seleccionado.alergias && paciente_seleccionado.alergias.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Alergias</Label>
                            <div className="flex flex-wrap gap-2">
                              {obtenerAlergiasPorIds(paciente_seleccionado.alergias).map((alergia) => (
                                <Badge key={alergia.id} variant="destructive">
                                  {alergia.nombre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {paciente_seleccionado.enfermedades && paciente_seleccionado.enfermedades.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Enfermedades Preexistentes</Label>
                            <div className="flex flex-wrap gap-2">
                              {obtenerEnfermedadesPorIds(paciente_seleccionado.enfermedades).map((enfermedad) => (
                                <Badge key={enfermedad.id} variant="secondary">
                                  {enfermedad.nombre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {paciente_seleccionado.medicamentos && paciente_seleccionado.medicamentos.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Medicamentos Actuales</Label>
                            <div className="flex flex-wrap gap-2">
                              {obtenerMedicamentosPorIds(paciente_seleccionado.medicamentos).map((medicamento) => (
                                <Badge key={medicamento.id}>
                                  {medicamento.nombre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div id={IDS_ELEMENTOS_PACIENTES.VER_HISTORIA_SECCION} className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="space-y-1">
                                <Label className="text-muted-foreground">Historia Clínica</Label>
                                <p className="text-xs text-muted-foreground">Selecciona una versión para visualizarla. Solo el nombre puede modificarse aquí.</p>
                              </div>
                              {!version_visualizada && paciente_seleccionado && (
                                <Button onClick={() => crearPrimeraHistoria(paciente_seleccionado.id, false)} disabled={creando_historia}>
                                  {creando_historia && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Crear primera versión
                                </Button>
                              )}
                            </div>

                            {cargando_historias ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando versiones...
                              </div>
                            ) : version_visualizada ? (
                              <div className="space-y-3">
                                <div className="grid md:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-sm">Seleccionar versión</Label>
                                    <Combobox
                                      opciones={versiones_historia.map((v) => ({
                                        valor: v.id.toString(),
                                        etiqueta: `Versión ${v.numero_version}: ${v.nombre || 'Sin nombre'}${v.id === version_activa?.id ? ' (actual)' : ''}`
                                      }))}
                                      valor={version_visualizada?.id?.toString() ?? ''}
                                      onChange={(valor) => seleccionarVersionHistoria(Number(valor))}
                                      placeholder="Seleccionar versión"
                                      textoVacio="No hay versiones disponibles"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      {version_visualizada.finalizada ? 'Solo lectura' : 'Editable'} · {formatearFechaHoraLocal(version_visualizada.creado_en)}
                                    </p>
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-sm">Nombre de la versión</Label>
                                    <Input
                                      value={version_visualizada?.nombre || ''}
                                      onChange={(e) => {
                                        if (!version_visualizada) return;
                                        const nuevoNombre = e.target.value;
                                        setVersionVisualizada({ ...version_visualizada, nombre: nuevoNombre });
                                        setVersionesHistoria((prev) => prev.map((v) => (v.id === version_visualizada.id ? { ...v, nombre: nuevoNombre } : v)));
                                        setVersionActiva((prev) => (prev && prev.id === version_visualizada.id ? { ...prev, nombre: nuevoNombre } : prev));
                                      }}
                                      disabled={guardando_historia}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-1"
                                      onClick={async () => {
                                        if (!paciente_seleccionado || !version_visualizada) return;
                                        setGuardandoHistoria(true);
                                        try {
                                          await historiasClinicasApi.actualizar(paciente_seleccionado.id, version_visualizada.id, {
                                            nombre: version_visualizada.nombre,
                                            contenido_html: version_visualizada.contenido_html,
                                            config: (version_visualizada as any)?.config,
                                          });
                                          await cargarHistoriasClinicas(paciente_seleccionado.id);
                                          seleccionarVersionHistoria(version_visualizada.id);
                                          toast({ title: 'Nombre actualizado', description: 'La versión se renombró correctamente.' });
                                        } catch (error: any) {
                                          toast({
                                            title: 'Error',
                                            description: error.response?.data?.message || 'No se pudo actualizar el nombre de la versión',
                                            variant: 'destructive',
                                          });
                                        }
                                        setGuardandoHistoria(false);
                                      }}
                                      disabled={guardando_historia}
                                    >
                                      {guardando_historia && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Guardar nombre
                                    </Button>
                                    <Button
                                      id={IDS_ELEMENTOS_PACIENTES.VER_BTN_EXPORTAR_PDF}
                                      size="sm"
                                      variant="outline"
                                      className="mt-1"
                                      onClick={async () => {
                                        if (!version_visualizada || !paciente_seleccionado) return;
                                        setGuardandoHistoria(true);
                                        try {
                                          const config = (version_visualizada as any).config || {};
                                          const pdfConfig = {
                                            widthMm: config.widthMm || TAMANOS_PAPEL.carta.widthMm,
                                            heightMm: config.heightMm || TAMANOS_PAPEL.carta.heightMm,
                                            margenes: config.margenes || MARGENES_DEFECTO,
                                          };
                                          const base64 = await generarPdfDesdeHtml(version_visualizada.contenido_html || '', pdfConfig);

                                          const nombre_archivo = `Historia_Clinica_${paciente_seleccionado.nombre}_${paciente_seleccionado.apellidos}_v${version_visualizada.numero_version}.pdf`;
                                          await archivosApi.subir({
                                            nombre_archivo,
                                            tipo_mime: 'application/pdf',
                                            descripcion: `Historia clínica versión ${version_visualizada.numero_version}${version_visualizada.nombre ? ': ' + version_visualizada.nombre : ''}`,
                                            contenido_base64: base64,
                                            paciente_id: paciente_seleccionado.id,
                                          });

                                          toast({ title: 'PDF guardado', description: 'La historia clínica se guardó en archivos del paciente.' });
                                        } catch (error) {
                                          console.error('Error al exportar PDF:', error);
                                          toast({ title: 'Error', description: 'No se pudo exportar el PDF', variant: 'destructive' });
                                        } finally {
                                          setGuardandoHistoria(false);
                                        }
                                      }}
                                      disabled={guardando_historia}
                                    >
                                      {guardando_historia && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Exportar PDF
                                    </Button>
                                  </div>
                                </div>

                                <div id={IDS_ELEMENTOS_PACIENTES.VER_HISTORIA_PREVIEW} className="overflow-hidden">
                                  <RenderizadorHtml
                                    contenido={version_visualizada.contenido_html || ''}
                                    modoDocumento
                                    escala={0.7}
                                    altura="500px"
                                    ajustarAncho
                                    className="max-w-full"
                                    tamanoPersonalizado={{
                                      widthMm: (version_visualizada as any).config?.widthMm ?? 216,
                                      heightMm: (version_visualizada as any).config?.heightMm ?? 279,
                                    }}
                                    margenes={(version_visualizada as any).config?.margenes ?? { top: 20, right: 20, bottom: 20, left: 20 }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-secondary/30 border border-dashed text-sm text-muted-foreground">
                                Crea la primera versión para registrar la historia clínica.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="archivos" className="space-y-4 mt-4">
                    <GestorArchivos
                      paciente_id={paciente_seleccionado.id}
                      paciente={{
                        nombre: paciente_seleccionado.nombre,
                        apellidos: paciente_seleccionado.apellidos,
                        telefono: paciente_seleccionado.telefono,
                        correo: paciente_seleccionado.correo,
                        direccion: paciente_seleccionado.direccion,
                      }}
                      modo="paciente"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      {paciente_odontograma && (
        <DialogoOdontograma
          abierto={dialogo_odontograma_abierto}
          onCerrar={() => {
            setDialogoOdontogramaAbierto(false);
            setPacienteOdontograma(null);
          }}
          pacienteId={paciente_odontograma.id}
          pacienteNombre={`${paciente_odontograma.nombre} ${paciente_odontograma.apellidos}`}
        />
      )}

      <DialogoConfirmacionCierre {...closeConfirmationProps} />
      <DialogoConfirmacionCierre {...closeHistoriaConfirmationProps} />
      <Toaster />
      <TutorialModalWrapper tema="Pacientes" />
      </div>
    </ProveedorTutorialesPagina>
  );
}
