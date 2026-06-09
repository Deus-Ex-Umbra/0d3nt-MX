import axios from 'axios';
import { serializarFechaHoraParaApi } from './utilidades';

const API_URL = (import.meta as any).env.VITE_API_URL || 'https://api.0dent.com';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizarUsuarioDesdeApi = (usuario: any) => {
  if (!usuario || typeof usuario !== 'object') return usuario;

  const avatar =
    typeof usuario.avatar === 'string' && usuario.avatar.trim() !== ''
      ? usuario.avatar
      : typeof usuario.avatar_url === 'string' && usuario.avatar_url.trim() !== ''
        ? usuario.avatar_url
        : undefined;

  return {
    ...usuario,
    avatar,
  };
};


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_acceso');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const esAxiosError = !!(error && (error as any).isAxiosError);
    const tieneResponse = !!error?.response;
    const esCancelado = (error as any)?.code === 'ERR_CANCELED';

    if (esAxiosError && !tieneResponse && !esCancelado) {
      (error as any).__esErrorConexion = true;
      (error as any).mensaje_usuario = 'No hay conexión con el servidor';
    }
    const status = error.response?.status;
    const url = String(error.config?.url || '');
    const esLicenciamientoPublico = url.includes('/licenciamiento-publico');
    if (esLicenciamientoPublico && (status === 401 || status === 403)) {
      try {
        window.dispatchEvent(new CustomEvent('licenciamiento:llave-invalida'));
      } catch {
      }
      return Promise.reject(error);
    }

    if (status === 401) {
      const esAutenticacionPublica =
        url.includes('/autenticacion/inicio-sesion') ||
        url.includes('/autenticacion/registro');
      const esCambioContrasena = url.includes('/cambiar-contrasena');

      if (!esCambioContrasena && !esAutenticacionPublica) {
        localStorage.removeItem('token_acceso');

        const rutaActual = window.location.hash?.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.pathname;

        if (rutaActual !== '/inicio-sesion' && rutaActual !== '/registro') {
          if (window.location.protocol === 'file:') {
            window.location.hash = '/inicio-sesion';
          } else {
            window.location.href = '/inicio-sesion';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const verificarConexion = async (): Promise<boolean> => {
  try {
    await axios.get(`${API_URL}/api`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

export const autenticacionApi = {
  registrar: async (datos: { nombre: string; correo: string; contrasena: string; pais?: string; codigo_pais?: string }) => {
    const respuesta = await api.post('/autenticacion/registro', datos);
    return respuesta.data;
  },
  iniciarSesion: async (credenciales: { correo: string; contrasena: string }) => {
    const respuesta = await api.post('/autenticacion/inicio-sesion', credenciales);
    return {
      ...respuesta.data,
      usuario: normalizarUsuarioDesdeApi(respuesta.data?.usuario),
    };
  },
};

export const usuariosApi = {
  obtenerPerfil: async () => {
    const respuesta = await api.get('/usuarios/perfil');
    return normalizarUsuarioDesdeApi(respuesta.data);
  },
  actualizarPerfil: async (datos: { nombre?: string; avatar?: string; eliminar_avatar?: boolean; pais?: string; codigo_pais?: string; moneda?: string; moneda_pais_iso?: string; modo_edicion_historica?: boolean }) => {
    const respuesta = await api.put('/usuarios/perfil', datos);
    return normalizarUsuarioDesdeApi(respuesta.data);
  },
  actualizarPais: async (datos: { pais: string; codigo_pais?: string }) => {
    const respuesta = await api.put('/usuarios/perfil/pais', datos);
    return respuesta.data;
  },
  actualizarMoneda: async (datos: { moneda: string; moneda_pais_iso?: string }) => {
    const respuesta = await api.put('/usuarios/perfil/moneda', datos);
    return respuesta.data;
  },
  cambiarContrasena: async (datos: { contrasena_actual: string; nueva_contrasena: string }) => {
    const respuesta = await api.put('/usuarios/perfil/cambiar-contrasena', datos);
    return respuesta.data;
  },
  obtenerTodos: async () => {
    const respuesta = await api.get('/usuarios');
    return respuesta.data;
  },
};

export const pacientesApi = {
  crear: async (datos: any) => {
    const respuesta = await api.post('/pacientes', datos);
    return respuesta.data;
  },
  obtenerTodos: async (termino_busqueda?: string) => {
    const params = termino_busqueda ? `?termino_busqueda=${termino_busqueda}` : '';
    const respuesta = await api.get(`/pacientes${params}`);
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}`);
    return respuesta.data;
  },
  obtenerAnamnesis: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}/anamnesis`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: any) => {
    const respuesta = await api.put(`/pacientes/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/pacientes/${id}`);
    return respuesta.data;
  },
  obtenerResumenEliminacion: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}/resumen-eliminacion`);
    return respuesta.data;
  },
  obtenerUltimaCita: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}/ultima-cita`);
    return respuesta.data;
  },
  obtenerUltimoTratamiento: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}/ultimo-tratamiento`);
    return respuesta.data;
  },
};

export const historiasClinicasApi = {
  listarPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/pacientes/${paciente_id}/historias-clinicas`);
    return respuesta.data;
  },
  obtener: async (paciente_id: number, version_id: number) => {
    const respuesta = await api.get(`/pacientes/${paciente_id}/historias-clinicas/${version_id}`);
    return respuesta.data;
  },
  crear: async (
    paciente_id: number,
    datos: { nombre?: string; contenido_html?: string; config?: any; clonar_de_version_id?: number }
  ) => {
    const respuesta = await api.post(`/pacientes/${paciente_id}/historias-clinicas`, datos);
    return respuesta.data;
  },
  actualizar: async (
    paciente_id: number,
    version_id: number,
    datos: { nombre?: string; contenido_html?: string; config?: any }
  ) => {
    const respuesta = await api.put(`/pacientes/${paciente_id}/historias-clinicas/${version_id}`, datos);
    return respuesta.data;
  },
  finalizar: async (paciente_id: number, version_id: number) => {
    const respuesta = await api.post(`/pacientes/${paciente_id}/historias-clinicas/${version_id}/finalizar`);
    return respuesta.data;
  },
  clonar: async (paciente_id: number, version_id: number) => {
    const respuesta = await api.post(`/pacientes/${paciente_id}/historias-clinicas/${version_id}/clonar`);
    return respuesta.data;
  },
};

export const tratamientosApi = {
  crear: async (datos: { nombre: string; numero_citas: number; costo_total: number }) => {
    const respuesta = await api.post('/tratamientos', datos);
    return respuesta.data;
  },
  obtenerTodos: async () => {
    const respuesta = await api.get('/tratamientos');
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/tratamientos/${id}`);
    return respuesta.data;
  },
  obtenerMaterialesPlantilla: async (id: number) => {
    const respuesta = await api.get(`/tratamientos/${id}/materiales`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: any) => {
    const respuesta = await api.put(`/tratamientos/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/tratamientos/${id}`);
    return respuesta.data;
  },
};

export const planesTratamientoApi = {
  asignar: async (datos: { paciente_id: number; tratamiento_id: number; fecha_inicio: string; hora_inicio: string; fecha_inicio_iso?: string }) => {
    const respuesta = await api.post('/planes-tratamiento', datos);
    return respuesta.data;
  },
  obtenerTodos: async () => {
    const respuesta = await api.get('/planes-tratamiento');
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/planes-tratamiento/${id}`);
    return respuesta.data;
  },
  obtenerPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/planes-tratamiento/paciente/${paciente_id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: { costo_total: number; costo_total_usd?: number; tasa_cambio?: number }) => {
    const respuesta = await api.put(`/planes-tratamiento/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number, citas: 'borrar' | 'mantener' = 'borrar') => {
    const respuesta = await api.delete(`/planes-tratamiento/eliminar/${id}`, {
      params: { citas },
    });
    return respuesta.data;
  },
  cambiarEstado: async (id: number, estado: string) => {
    const respuesta = await api.patch(`/planes-tratamiento/${id}/estado`, { estado });
    return respuesta.data;
  },
};

export const agendaApi = {
  crear: async (datos: any) => {
    const respuesta = await api.post('/agenda', datos);
    return respuesta.data;
  },
  obtenerPorMes: async (mes: number, ano: number, ligero: boolean = true) => {
    const respuesta = await api.get(`/agenda?mes=${mes}&ano=${ano}&ligero=${ligero}`);
    return respuesta.data;
  },
  filtrarCitas: async (fecha_inicio: Date, fecha_fin: Date) => {
    const respuesta = await api.get(`/agenda/filtrar?fecha_inicio=${serializarFechaHoraParaApi(fecha_inicio)}&fecha_fin=${serializarFechaHoraParaApi(fecha_fin)}`);
    return respuesta.data;
  },
  obtenerCitasSinPagar: async () => {
    const respuesta = await api.get('/agenda/sin-pagar');
    return respuesta.data;
  },
  obtenerCitasSinPago: async () => {
    const respuesta = await api.get('/agenda/sin-pago');
    return respuesta.data;
  },
  obtenerEspaciosLibres: async (mes: number, ano: number) => {
    const respuesta = await api.get(`/agenda/espacios-libres?mes=${mes}&ano=${ano}`);
    return respuesta.data;
  },
  filtrarEspaciosLibres: async (fecha_inicio: Date, fecha_fin: Date) => {
    const respuesta = await api.get(`/agenda/espacios-libres-filtrar?fecha_inicio=${serializarFechaHoraParaApi(fecha_inicio)}&fecha_fin=${serializarFechaHoraParaApi(fecha_fin)}`);
    return respuesta.data;
  },
  obtenerDiasOcupados: async (ano: number, mes?: number) => {
    let url = `/agenda/dias-ocupados?ano=${ano}`;
    if (mes) url += `&mes=${mes}`;
    const respuesta = await api.get(url);
    return respuesta.data;
  },
  obtenerOcupacionPorMes: async (mes: number, ano: number) => {
    const respuesta = await api.get(`/agenda/ocupacion-mes?mes=${mes}&ano=${ano}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: any) => {
    const respuesta = await api.put(`/agenda/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/agenda/${id}`);
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/agenda/${id}`);
    return respuesta.data;
  },
  obtenerPorIdCompleto: async (id: number) => {
    const respuesta = await api.get(`/agenda/${id}/completo`);
    return respuesta.data;
  },
};

export const notasApi = {
  crear: async (contenido: string) => {
    const respuesta = await api.post('/notas', { contenido });
    return respuesta.data;
  },
  obtenerUltimas: async (dias: number) => {
    const respuesta = await api.get(`/notas?dias=${dias}`);
    return respuesta.data;
  },
};

export const asistenteApi = {
  obtenerFraseMotivacional: async (dias: number = 7) => {
    const respuesta = await api.post('/asistente/frase-motivacional', { dias });
    return respuesta.data;
  },
  probarGemini: async (prompt: string = 'hola') => {
    const respuesta = await api.post('/asistente/probar-gemini', { prompt });
    return respuesta.data;
  },
  digitalizarCitas: async (imagen_base64: string) => {
    const respuesta = await api.post('/asistente/ocr-citas', { imagen_base64 });
    return respuesta.data;
  },
};

export const finanzasApi = {
  registrarEgreso: async (datos: {
    concepto: string;
    fecha: Date;
    monto: number;
    monto_usd?: number;
    tasa_cambio?: number;
    cita_id?: number;
    plan_tratamiento_id?: number;
  }) => {
    const respuesta = await api.post('/finanzas/egresos', datos);
    return respuesta.data;
  },
  actualizarEgreso: async (id: number, datos: {
    concepto?: string;
    fecha?: Date;
    monto?: number;
    monto_usd?: number;
    tasa_cambio?: number;
  }) => {
    const respuesta = await api.put(`/finanzas/egresos/${id}`, datos);
    return respuesta.data;
  },
  eliminarEgreso: async (id: number) => {
    const respuesta = await api.delete(`/finanzas/egresos/${id}`);
    return respuesta.data;
  },
  validarApiKeyTasa: async (apiKey: string, moneda: string) => {
    const respuesta = await api.post('/finanzas/tasa-cambio/validar', { apiKey, moneda });
    return respuesta.data;
  },
  actualizarTasaAutomatica: async (moneda: string) => {
    const respuesta = await api.post('/finanzas/tasa-cambio/actualizar-automatica', { moneda });
    return respuesta.data;
  },
  registrarPago: async (datos: { fecha: Date; monto: number; concepto: string; monto_usd?: number; tasa_cambio?: number; cita_id?: number; plan_tratamiento_id?: number }) => {
    const respuesta = await api.post('/finanzas/pagos', datos);
    return respuesta.data;
  },
  actualizarPago: async (id: number, datos: { fecha?: Date; monto?: number; monto_usd?: number; tasa_cambio?: number; concepto?: string }) => {
    const respuesta = await api.put(`/finanzas/pagos/${id}`, datos);
    return respuesta.data;
  },
  eliminarPago: async (id: number) => {
    const respuesta = await api.delete(`/finanzas/pagos/${id}`);
    return respuesta.data;
  },
  obtenerReporte: async (fecha_inicio?: string, fecha_fin?: string) => {
    const params = new URLSearchParams();
    if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) params.append('fecha_fin', fecha_fin);

    const respuesta = await api.get(`/finanzas/reporte?${params.toString()}`);
    return respuesta.data;
  },
  obtenerDatosGrafico: async (tipo: 'dia' | 'mes' | 'ano', fecha_referencia?: string) => {
    const params = new URLSearchParams();
    params.append('tipo', tipo);
    if (fecha_referencia) params.append('fecha_referencia', fecha_referencia);

    const respuesta = await api.get(`/finanzas/grafico?${params.toString()}`);
    return respuesta.data;
  },
  obtenerAnalisis: async (filtros: { fecha_inicio: string; fecha_fin: string; glosa?: string; sensible_mayusculas?: boolean; nivel_precision?: 'alta' | 'equilibrio' | 'global' }) => {
    const respuesta = await api.post('/finanzas/analisis', filtros);
    return respuesta.data;
  },
};

export const estadisticasApi = {
  obtenerDashboard: async () => {
    const respuesta = await api.get('/estadisticas/dashboard');
    return respuesta.data;
  },
};

export const catalogoApi = {
  obtenerAlergias: async () => {
    const respuesta = await api.get('/catalogo/alergias');
    return respuesta.data;
  },
  crearAlergia: async (datos: { nombre: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/alergias', datos);
    return respuesta.data;
  },
  actualizarAlergia: async (id: number, datos: { nombre?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/alergias/${id}`, datos);
    return respuesta.data;
  },
  eliminarAlergia: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/alergias/${id}`);
    return respuesta.data;
  },
  obtenerEnfermedades: async () => {
    const respuesta = await api.get('/catalogo/enfermedades');
    return respuesta.data;
  },
  crearEnfermedad: async (datos: { nombre: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/enfermedades', datos);
    return respuesta.data;
  },
  actualizarEnfermedad: async (id: number, datos: { nombre?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/enfermedades/${id}`, datos);
    return respuesta.data;
  },
  eliminarEnfermedad: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/enfermedades/${id}`);
    return respuesta.data;
  },
  obtenerMedicamentos: async () => {
    const respuesta = await api.get('/catalogo/medicamentos');
    return respuesta.data;
  },
  crearMedicamento: async (datos: { nombre: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/medicamentos', datos);
    return respuesta.data;
  },
  actualizarMedicamento: async (id: number, datos: { nombre?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/medicamentos/${id}`, datos);
    return respuesta.data;
  },
  eliminarMedicamento: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/medicamentos/${id}`);
    return respuesta.data;
  },
  obtenerColores: async () => {
    const respuesta = await api.get('/catalogo/colores');
    return respuesta.data;
  },
  crearColor: async (datos: { nombre: string; color: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/colores', datos);
    return respuesta.data;
  },
  actualizarColor: async (id: number, datos: { nombre?: string; color?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/colores/${id}`, datos);
    return respuesta.data;
  },
  eliminarColor: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/colores/${id}`);
    return respuesta.data;
  },
  obtenerEtiquetas: async () => {
    const respuesta = await api.get('/catalogo/etiquetas');
    return respuesta.data;
  },
  crearEtiqueta: async (datos: { nombre: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/etiquetas', datos);
    return respuesta.data;
  },
  actualizarEtiqueta: async (id: number, datos: { nombre?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/etiquetas/${id}`, datos);
    return respuesta.data;
  },
  eliminarEtiqueta: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/etiquetas/${id}`);
    return respuesta.data;
  },
  obtenerEtiquetasPlantilla: async () => {
    const respuesta = await api.get('/catalogo/etiquetas-plantilla');
    return respuesta.data;
  },
  crearEtiquetaPlantilla: async (datos: { nombre: string; codigo: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/etiquetas-plantilla', datos);
    return respuesta.data;
  },
  actualizarEtiquetaPlantilla: async (id: number, datos: { nombre?: string; codigo?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/etiquetas-plantilla/${id}`, datos);
    return respuesta.data;
  },
  eliminarEtiquetaPlantilla: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/etiquetas-plantilla/${id}`);
    return respuesta.data;
  },
  obtenerTamanosHoja: async () => {
    const respuesta = await api.get('/catalogo/tamanos-papel');
    return respuesta.data;
  },
  crearTamanoHoja: async (datos: { nombre: string; ancho: number; alto: number; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/tamanos-papel', datos);
    return respuesta.data;
  },
  actualizarTamanoHoja: async (id: number, datos: { nombre?: string; ancho?: number; alto?: number; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/tamanos-papel/${id}`, datos);
    return respuesta.data;
  },
  eliminarTamanoHoja: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/tamanos-papel/${id}`);
    return respuesta.data;
  },
  obtenerConfiguracionClinica: async () => {
    const respuesta = await api.get('/catalogo/configuracion-clinica');
    return respuesta.data;
  },
  actualizarConfiguracionClinica: async (datos: {
    logo?: string;
    nombre_clinica?: string;
    mensaje_bienvenida_antes?: string;
    mensaje_bienvenida_despues?: string;
    tema_personalizado?: string;
    horarios_laborales?: string;
    gemini_api_key?: string;
    gemini_url_base?: string;
    gemini_verificado?: boolean;
    exchange_rate_api_key?: string;
    exchange_rate_verificado?: boolean;
    cambio_dolar?: number;
    trabajar_con?: string;
    moneda_principal?: string;
    moneda_configurada?: boolean;
    modelo_dientes_odontograma?: 'cuadrado' | 'circular';
  }) => {
    const respuesta = await api.put('/catalogo/configuracion-clinica', datos);
    return respuesta.data;
  },
  obtenerHoraServidor: async (): Promise<Date> => {
    try {
      const respuesta = await api.get('/catalogo/hora-servidor');
      const fechaServidor = new Date(respuesta.data);
      if (!Number.isNaN(fechaServidor.getTime())) {
        return fechaServidor;
      }
    } catch (error) {
    }

    return new Date();
  },
};

export const archivosApi = {
  subir: async (datos: {
    nombre_archivo: string;
    tipo_mime: string;
    descripcion?: string;
    contenido_base64: string;
    paciente_id: number;
    plan_tratamiento_id?: number;
  }) => {
    const respuesta = await api.post('/archivos-adjuntos', datos);
    return respuesta.data;
  },
  obtenerPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/archivos-adjuntos/paciente/${paciente_id}`);
    return respuesta.data;
  },
  obtenerPorPlan: async (plan_id: number) => {
    const respuesta = await api.get(`/archivos-adjuntos/plan-tratamiento/${plan_id}`);
    return respuesta.data;
  },
  obtenerContenido: async (id: number) => {
    const respuesta = await api.get(`/archivos-adjuntos/${id}/contenido`);
    return respuesta.data;
  },
  obtenerUrlVisualizacion: async (id: number): Promise<string> => {
    const respuesta = await api.get(`/archivos-adjuntos/${id}/url-visualizacion`);
    return respuesta.data?.url;
  },
  actualizar: async (id: number, datos: { nombre_archivo?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/archivos-adjuntos/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/archivos-adjuntos/${id}`);
    return respuesta.data;
  },
};

export const edicionesImagenesApi = {
  crear: async (datos: {
    archivo_original_id: number;
    edicion_padre_id?: number;
    nombre?: string;
    descripcion?: string;
    datos_canvas: object;
    imagen_resultado_base64: string;
  }) => {
    const respuesta = await api.post('/ediciones-imagenes', datos);
    return respuesta.data;
  },
  obtenerPorArchivo: async (archivo_id: number) => {
    const respuesta = await api.get(`/ediciones-imagenes/archivo/${archivo_id}`);
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/ediciones-imagenes/${id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: {
    nombre?: string;
    descripcion?: string;
    datos_canvas?: object;
    imagen_resultado_base64?: string;
  }) => {
    const respuesta = await api.put(`/ediciones-imagenes/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/ediciones-imagenes/${id}`);
    return respuesta.data;
  },
  duplicar: async (id: number) => {
    const respuesta = await api.post(`/ediciones-imagenes/${id}/duplicar`);
    return respuesta.data;
  },
  crearComentario: async (edicion_id: number, datos: {
    x: number;
    y: number;
    titulo: string;
    contenido: string;
    color?: string;
  }) => {
    const respuesta = await api.post(`/ediciones-imagenes/${edicion_id}/comentarios`, datos);
    return respuesta.data;
  },
  obtenerComentarios: async (edicion_id: number) => {
    const respuesta = await api.get(`/ediciones-imagenes/${edicion_id}/comentarios`);
    return respuesta.data;
  },
  obtenerComentario: async (comentario_id: number) => {
    const respuesta = await api.get(`/ediciones-imagenes/comentarios/${comentario_id}`);
    return respuesta.data;
  },
  actualizarComentario: async (comentario_id: number, datos: {
    x?: number;
    y?: number;
    titulo?: string;
    contenido?: string;
    color?: string;
  }) => {
    const respuesta = await api.put(`/ediciones-imagenes/comentarios/${comentario_id}`, datos);
    return respuesta.data;
  },
  eliminarComentario: async (comentario_id: number) => {
    const respuesta = await api.delete(`/ediciones-imagenes/comentarios/${comentario_id}`);
    return respuesta.data;
  },
};

export const plantillasConsentimientoApi = {
  crear: async (datos: {
    nombre: string;
    contenido: string;
    tamano_papel?: 'carta' | 'legal' | 'a4';
    tamano_hoja_id?: number | null;
    ancho_mm?: number | null;
    alto_mm?: number | null;
    margen_superior?: number;
    margen_inferior?: number;
    margen_izquierdo?: number;
    margen_derecho?: number;
  }) => {
    const respuesta = await api.post('/plantillas-consentimiento', datos);
    return respuesta.data;
  },
  obtenerTodas: async () => {
    const respuesta = await api.get('/plantillas-consentimiento');
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/plantillas-consentimiento/${id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: {
    nombre?: string;
    contenido?: string;
    tamano_papel?: 'carta' | 'legal' | 'a4';
    tamano_hoja_id?: number | null;
    ancho_mm?: number | null;
    alto_mm?: number | null;
    margen_superior?: number;
    margen_inferior?: number;
    margen_izquierdo?: number;
    margen_derecho?: number;
  }) => {
    const respuesta = await api.put(`/plantillas-consentimiento/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/plantillas-consentimiento/${id}`);
    return respuesta.data;
  },
  generarConsentimiento: async (paciente_id: number, datos: {
    plantilla_id: number;
    pdf_firmado_base64: string;
  }) => {
    const respuesta = await api.post(`/plantillas-consentimiento/pacientes/${paciente_id}/generar-consentimiento`, datos);
    return respuesta.data;
  },
};

export const plantillasRecetasApi = {
  crear: async (datos: {
    nombre: string;
    contenido: string;
    tamano_papel?: 'carta' | 'legal' | 'a4';
    tamano_hoja_id?: number | null;
    ancho_mm?: number | null;
    alto_mm?: number | null;
    margen_superior?: number;
    margen_inferior?: number;
    margen_izquierdo?: number;
    margen_derecho?: number;
  }) => {
    const respuesta = await api.post('/plantillas-recetas', datos);
    return respuesta.data;
  },
  obtenerTodas: async () => {
    const respuesta = await api.get('/plantillas-recetas');
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/plantillas-recetas/${id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: {
    nombre?: string;
    contenido?: string;
    tamano_papel?: 'carta' | 'legal' | 'a4';
    tamano_hoja_id?: number | null;
    ancho_mm?: number | null;
    alto_mm?: number | null;
    margen_superior?: number;
    margen_inferior?: number;
    margen_izquierdo?: number;
    margen_derecho?: number;
  }) => {
    const respuesta = await api.put(`/plantillas-recetas/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/plantillas-recetas/${id}`);
    return respuesta.data;
  },
};

export const inventarioApi = {
  crearInventario: async (datos: { nombre: string }) => {
    const respuesta = await api.post('/inventario', datos);
    return respuesta.data;
  },
  obtenerInventarios: async () => {
    const respuesta = await api.get('/inventario');
    return respuesta.data;
  },
  obtenerInventarioPorId: async (inventario_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}`);
    return respuesta.data;
  },
  actualizarInventario: async (inventario_id: number, datos: { nombre?: string }) => {
    const respuesta = await api.put(`/inventario/${inventario_id}`, datos);
    return respuesta.data;
  },
  eliminarInventario: async (inventario_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}`);
    return respuesta.data;
  },
  crearProducto: async (datos: {
    inventario_id: number;
    nombre: string;
    tipo?: 'material' | 'activo_fijo';
    subtipo_material?: 'con_lote_vencimiento' | 'con_serie' | 'sin_lote';
    subtipo_activo_fijo?: 'instrumental' | 'mobiliario_equipo';
    tipo_gestion?: string;
    stock_minimo?: number;
    unidad_medida?: string;
    descripcion?: string;
    notificar_stock_bajo?: boolean;
  }) => {
    const respuesta = await api.post('/inventario/productos', datos);
    return respuesta.data;
  },
  obtenerProductos: async (inventario_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/productos`);
    return respuesta.data;
  },
  obtenerProductoPorId: async (inventario_id: number, producto_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/productos/${producto_id}`);
    return respuesta.data;
  },
  obtenerStockProducto: async (inventario_id: number, producto_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/productos/${producto_id}/stock`);
    return respuesta.data;
  },
  actualizarProducto: async (inventario_id: number, producto_id: number, datos: any) => {
    const respuesta = await api.put(`/inventario/${inventario_id}/productos/${producto_id}`, datos);
    return respuesta.data;
  },
  eliminarProducto: async (inventario_id: number, producto_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}/productos/${producto_id}`);
    return respuesta.data;
  },

  eliminarMaterial: async (inventario_id: number, material_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}/materiales/${material_id}`);
    return respuesta.data;
  },

  actualizarMaterial: async (inventario_id: number, material_id: number, datos: { fecha_vencimiento?: string | null }) => {
    const respuesta = await api.put(`/inventario/${inventario_id}/materiales/${material_id}`, datos);
    return respuesta.data;
  },

  eliminarMaterialConMotivo: async (inventario_id: number, material_id: number, datos: { motivo: string }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/materiales/${material_id}/eliminar`, datos);
    return respuesta.data;
  },

  desecharMaterialCaducado: async (inventario_id: number, material_id: number) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/materiales/${material_id}/desechar-caducado`);
    return respuesta.data;
  },
  registrarCompra: async (inventario_id: number, datos: {
    producto_id: number;
    cantidad: number;
    costo_total: number;
    fecha_vencimiento?: string;
    nro_lote?: string;
    nro_serie?: string;
    nombre_asignado?: string;
    fecha_compra: string;
    generar_egreso?: boolean;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/registrar-compra`, datos);
    return respuesta.data;
  },
  registrarEntradaMaterial: async (inventario_id: number, datos: {
    producto_id: number;
    cantidad: number;
    costo_unitario: number;
    costo_unitario_usd?: number;
    tipo_entrada: 'compra' | 'regalo' | 'donacion' | 'otro_ingreso';
    nro_lote?: string;
    nro_serie?: string;
    fecha_vencimiento?: string;
    fecha_ingreso?: string;
    observaciones?: string;
    generar_egreso?: boolean;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/materiales/entrada`, datos);
    return respuesta.data;
  },
  registrarEntradaActivo: async (inventario_id: number, datos: {
    producto_id: number;
    costo_compra: number;
    costo_compra_usd?: number;
    tipo_entrada: 'compra' | 'regalo' | 'donacion' | 'otro_ingreso';
    codigo_interno?: string;
    nro_serie?: string;
    nombre_asignado?: string;
    ubicacion?: string;
    fecha_compra: string;
    observaciones?: string;
    generar_egreso?: boolean;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/activos/entrada`, datos);
    return respuesta.data;
  },
  registrarSalidaMaterial: async (inventario_id: number, datos: {
    producto_id: number;
    material_id?: number;
    cantidad: number;
    tipo_salida: 'consumo_cita' | 'consumo_tratamiento' | 'venta' | 'desecho' | 'robo' | 'ajuste';
    observaciones?: string;
    generar_ingreso?: boolean;
    monto_venta?: number;
    monto_venta_usd?: number;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/materiales/salida`, datos);
    return respuesta.data;
  },
  confirmarConsumibles: async (cita_id: number, datos: {
    consumibles: Array<{ producto_id: number; cantidad: number }>;
  }) => {
    const respuesta = await api.post(`/inventario/citas/${cita_id}/confirmar-consumibles`, datos);
    return respuesta.data;
  },
  asignarMaterialesCita: async (cita_id: number, datos: { materiales: { producto_id: number; cantidad_planeada: number }[] }) => {
    const respuesta = await api.post(`/inventario/citas/${cita_id}/asignar-materiales`, datos);
    return respuesta.data;
  },

  agregarMaterialesCita: async (cita_id: number, datos: { materiales: { producto_id: number; cantidad_planeada: number }[] }) => {
    const respuesta = await api.post(`/inventario/citas/${cita_id}/agregar-materiales`, datos);
    return respuesta.data;
  },
  obtenerMaterialesCita: async (cita_id: number) => {
    const respuesta = await api.get(`/inventario/citas/${cita_id}/reservas`);
    return respuesta.data;
  },
  confirmarMaterialesCita: async (cita_id: number, datos: {
    materiales: Array<{ material_cita_id: number; cantidad_usada: number }>;
  }) => {
    const respuesta = await api.post(`/inventario/citas/${cita_id}/confirmar-materiales`, datos);
    return respuesta.data;
  },
  asignarMaterialesTratamiento: async (plan_tratamiento_id: number, datos: {
    materiales: Array<{
      producto_id: number;
      tipo: string;
      cantidad_planeada: number;
      momento_confirmacion?: string;
    }>;
  }) => {
    const respuesta = await api.post(`/inventario/tratamientos/${plan_tratamiento_id}/asignar-materiales`, datos);
    return respuesta.data;
  },
  obtenerMaterialesTratamiento: async (plan_tratamiento_id: number) => {
    const respuesta = await api.get(`/inventario/tratamientos/${plan_tratamiento_id}/reservas`);
    return respuesta.data;
  },
  confirmarMaterialesGenerales: async (plan_tratamiento_id: number, datos: any) => {
    const respuesta = await api.post(`/inventario/tratamientos/${plan_tratamiento_id}/confirmar-materiales-generales`, datos);
    return respuesta.data;
  },
  cambiarEstadoActivo: async (inventario_id: number, activo_id: number, datos: { estado: string; motivo?: string; referencia?: string }) => {
    const respuesta = await api.put(`/inventario/${inventario_id}/activos/${activo_id}/estado`, datos);
    return respuesta.data;
  },
  obtenerHistorialActivo: async (inventario_id: number, activo_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/activos/${activo_id}/historial`);
    return respuesta.data;
  },
  obtenerHistorialMovimientos: async (
    inventario_id: number,
    filtros?: {
      producto_id?: number;
      tipos?: string[];
      fecha_inicio?: Date;
      fecha_fin?: Date;
      usuario_id?: number;
      limit?: number;
    }
  ) => {
    const params = new URLSearchParams();

    if (filtros?.producto_id) {
      params.append('producto_id', filtros.producto_id.toString());
    }

    if (filtros?.tipos && filtros.tipos.length > 0) {
      params.append('tipos', filtros.tipos.join(','));
    }

    if (filtros?.fecha_inicio) {
      params.append('fecha_inicio', filtros.fecha_inicio.toISOString());
    }

    if (filtros?.fecha_fin) {
      params.append('fecha_fin', filtros.fecha_fin.toISOString());
    }

    if (filtros?.usuario_id) {
      params.append('usuario_id', filtros.usuario_id.toString());
    }

    if (filtros?.limit) {
      params.append('limit', filtros.limit.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/historial-movimientos${query}`);
    return respuesta.data;
  },
  obtenerReporteValor: async (inventario_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/reporte/valor`);
    return respuesta.data;
  },
  eliminarLote: async (inventario_id: number, lote_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}/lotes/${lote_id}`);
    return respuesta.data;
  },
  actualizarActivo: async (inventario_id: number, activo_id: number, datos: any) => {
    const respuesta = await api.put(`/inventario/${inventario_id}/activos/${activo_id}`, datos);
    return respuesta.data;
  },
  eliminarActivo: async (inventario_id: number, activo_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}/activos/${activo_id}`);
    return respuesta.data;
  },
  ajustarStock: async (inventario_id: number, datos: {
    producto_id: number;
    material_id?: number;
    tipo_ajuste: 'incremento' | 'decremento' | 'establecer';
    cantidad: number;
    motivo: string;
    observaciones?: string;
    fecha?: string;
    generar_movimiento_financiero?: boolean;
    monto?: number;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/ajustar-stock`, datos);
    return respuesta.data;
  },
  venderActivo: async (inventario_id: number, activo_id: number, datos: {
    monto_venta?: number;
    monto_venta_usd?: number;
    registrar_pago?: boolean;
    tipo_salida: 'venta' | 'desecho' | 'robo';
    observaciones?: string;
    fecha_venta?: string;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/activos/${activo_id}/vender`, datos);
    return respuesta.data;
  },
  obtenerKardex: async (inventario_id: number, filtros?: {
    tipo?: string;
    operacion?: 'entrada' | 'salida';
    producto_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.operacion) params.append('operacion', filtros.operacion);
    if (filtros?.producto_id) params.append('producto_id', filtros.producto_id.toString());
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/kardex${query}`);
    return respuesta.data;
  },
  obtenerKardexProducto: async (inventario_id: number, producto_id: number, filtros?: {
    tipo?: string;
    operacion?: 'entrada' | 'salida';
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.operacion) params.append('operacion', filtros.operacion);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/kardex/producto/${producto_id}${query}`);
    return respuesta.data;
  },
  generarReporteKardex: async (inventario_id: number, fecha_inicio: string, fecha_fin: string) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/kardex/reporte?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`);
    return respuesta.data;
  },
  obtenerBitacora: async (inventario_id: number, filtros?: {
    tipo?: string;
    producto_id?: number;
    estado?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.producto_id) params.append('producto_id', filtros.producto_id.toString());
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/bitacora${query}`);
    return respuesta.data;
  },
  obtenerBitacoraActivo: async (inventario_id: number, activo_id: number, filtros?: {
    tipo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/bitacora/activo/${activo_id}${query}`);
    return respuesta.data;
  },
  obtenerEventosRecientes: async (inventario_id: number, limite?: number) => {
    const query = limite ? `?limite=${limite}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/bitacora/recientes${query}`);
    return respuesta.data;
  },
  buscarAuditoria: async (inventario_id: number, filtros?: {
    accion?: string;
    tipo_entidad?: 'producto' | 'material' | 'activo' | 'inventario';
    usuario_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.accion) params.append('accion', filtros.accion);
    if (filtros?.tipo_entidad) params.append('tipo_entidad', filtros.tipo_entidad);
    if (filtros?.usuario_id) params.append('usuario_id', filtros.usuario_id.toString());
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/auditoria${query}`);
    return respuesta.data;
  },
  obtenerAuditoriaProducto: async (inventario_id: number, producto_id: number, filtros?: {
    accion?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.accion) params.append('accion', filtros.accion);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/auditoria/producto/${producto_id}${query}`);
    return respuesta.data;
  },
  generarReporteAntiSabotaje: async (inventario_id: number, fecha_inicio: string, fecha_fin: string) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/auditoria/reporte-antisabotaje?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`);
    return respuesta.data;
  },
};

export const reportesApi = {
  generar: async (datos: {
    areas: string[];
    fecha_inicio?: string;
    fecha_fin?: string;
    incluir_sugerencias?: boolean;
  }) => {
    const respuesta = await api.post('/reportes/generar', datos);
    return respuesta.data;
  },
  obtener: async () => {
    const respuesta = await api.get('/reportes');
    return respuesta.data;
  },
  descargar: async (id: number) => {
    const respuesta = await api.get(`/reportes/${id}/descargar`, {
      responseType: 'blob',
    });
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/reportes/${id}`);
    return respuesta.data;
  },
};

export const consentimientosApi = {
  obtenerPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/pacientes/${paciente_id}/consentimientos`);
    return respuesta.data;
  },
  crear: async (paciente_id: number, datos: { plantilla_id: number; nombre: string }) => {
    const respuesta = await api.post(`/pacientes/${paciente_id}/consentimientos`, datos);
    return respuesta.data;
  },
  descargar: async (id: number) => {
    const respuesta = await api.get(`/consentimientos/${id}/descargar`, {
      responseType: 'blob',
    });
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/consentimientos/${id}`);
    return respuesta.data;
  },
};

export const pdfApi = {
  generarDesdeHtml: async (datos: {
    contenido_html: string;
    config: {
      widthMm: number;
      heightMm: number;
      margenes: { top: number; right: number; bottom: number; left: number };
    };
  }): Promise<string> => {
    const respuesta = await api.post('/pdf/generar-desde-html', datos);
    return respuesta.data.pdf_base64;
  },
};

export const odontogramaApi = {
  obtenerSimbolos: async () => {
    const respuesta = await api.get('/odontograma/simbolos');
    const data = respuesta.data;
    if (Array.isArray(data)) {
      return data.map((s: any) => ({
        ...s,
        color_primario: s?.color_primario ?? s?.color_hover,
      }));
    }
    return data;
  },
  obtenerSimboloPorId: async (id: number) => {
    const respuesta = await api.get(`/odontograma/simbolos/${id}`);
    const s: any = respuesta.data;
    return {
      ...s,
      color_primario: s?.color_primario ?? s?.color_hover,
    };
  },
  crearSimbolo: async (datos: {
    nombre: string;
    descripcion?: string;
    imagen_base64: string;
    color_primario: string;
    color_secundario?: string | null;
    categoria?: 'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO';
    datos_canvas?: any;
  }) => {
    const respuesta = await api.post('/odontograma/simbolos', datos);
    return respuesta.data;
  },
  actualizarSimbolo: async (id: number, datos: {
    nombre?: string;
    descripcion?: string;
    imagen_base64?: string;
    color_primario?: string;
    color_secundario?: string | null;
    categoria?: 'TRATAMIENTO_PATOLOGIA' | 'CONDICION_HALLAZGO';
    activo?: boolean;
    datos_canvas?: any;
  }) => {
    const respuesta = await api.put(`/odontograma/simbolos/${id}`, datos);
    return respuesta.data;
  },
  eliminarSimbolo: async (id: number) => {
    const respuesta = await api.delete(`/odontograma/simbolos/${id}`);
    return respuesta.data;
  },
  obtenerPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/odontograma/paciente/${paciente_id}`);
    return respuesta.data;
  },
  obtenerOCrearPrincipal: async (paciente_id: number) => {
    const respuesta = await api.get(`/odontograma/paciente/${paciente_id}/principal`);
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/odontograma/${id}`);
    return respuesta.data;
  },
  crear: async (paciente_id: number, datos: { nombre?: string; tipo?: 'adulto' | 'nino' }) => {
    const respuesta = await api.post(`/odontograma/paciente/${paciente_id}`, datos);
    return respuesta.data;
  },
  crearNuevaVersion: async (odontograma_id: number, opciones?: { clonar?: boolean; tipo?: 'adulto' | 'nino' }) => {
    const respuesta = await api.post(`/odontograma/${odontograma_id}/version`, opciones);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: { nombre?: string; datos_pintado?: any; configuracion_dientes?: any }) => {
    const respuesta = await api.put(`/odontograma/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/odontograma/${id}`);
    return respuesta.data;
  },

  aplicarSimbolo: async (odontograma_id: number, datos: {
    simbolo_id: number;
    comentario?: string;
    piezas_afectadas: Array<{ numero_pieza: number; partes: string[] }>;
    transformacion?: {
      x: number;
      y: number;
      escala: number;
      espejo_x?: boolean;
      espejo_y?: boolean;
      rotacion?: number;
      color?: string;
      hover_color?: string;
      estado?: 'REALIZADO' | 'POR_REALIZAR';
    };
  }) => {
    const respuesta = await api.post(`/odontograma/${odontograma_id}/aplicar`, datos);
    return respuesta.data;
  },
  actualizarAplicacion: async (aplicacion_id: number, datos: {
    comentario?: string;
    piezas_afectadas?: Array<{ numero_pieza: number; partes: string[] }>;
    transformacion?: {
      x: number;
      y: number;
      escala: number;
      espejo_x?: boolean;
      espejo_y?: boolean;
      rotacion?: number;
      color?: string;
      hover_color?: string;
      estado?: 'REALIZADO' | 'POR_REALIZAR';
    };
  }) => {
    const respuesta = await api.put(`/odontograma/aplicacion/${aplicacion_id}`, datos);
    return respuesta.data;
  },
  eliminarAplicacion: async (aplicacion_id: number) => {
    const respuesta = await api.delete(`/odontograma/aplicacion/${aplicacion_id}`);
    return respuesta.data;
  },
};

export const tutorialesApi = {
  obtenerCompletados: async () => {
    const respuesta = await api.get('/tutoriales');
    return respuesta.data;
  },
  estaCompletado: async (nombre: string): Promise<boolean> => {
    const respuesta = await api.get(`/tutoriales/${nombre}`);
    return respuesta.data.completado;
  },
  marcarCompletado: async (nombre: string): Promise<void> => {
    await api.post(`/tutoriales/${nombre}/completar`);
  },
  obtenerProgresoPagina: async (datos: {
    pagina: string;
    tutoriales: { nombre: string; titulo: string }[];
    condiciones_bloqueo?: Record<string, { bloqueado: boolean; mensaje?: string }>;
  }) => {
    const respuesta = await api.post('/tutoriales/progreso-pagina', datos);
    return respuesta.data;
  },

  obtenerPrerequisitosEdicionImagenes: async (): Promise<{ tiene_pacientes: boolean; tiene_imagenes: boolean }> => {
    const respuesta = await api.get('/tutoriales/prerequisitos/edicion-imagenes');
    return respuesta.data;
  },
};

export const licenciamientoApi = {
  obtenerEstadoEula: async () => {
    const respuesta = await api.get('/licenciamiento/eula/estado');
    return respuesta.data as {
      aceptado: boolean;
      aceptado_en: string | null;
      eula_version: string | null;
    };
  },
  aceptarEula: async (datos: {
    eula_version?: string;
    hash_aceptacion_local?: string;
    plataforma?: string;
    hostname?: string;
    app_version?: string;
    dispositivo?: Record<string, any>;
  }) => {
    const respuesta = await api.post('/licenciamiento/eula/aceptar', datos);
    return respuesta.data;
  },
  obtenerEstadoCredencial: async () => {
    const respuesta = await api.get('/licenciamiento/credencial/estado');
    return respuesta.data as {
      configurada: boolean;
      vl_api_base_url: string | null;
      actualizado_en: string | null;
    };
  },
  guardarCredencial: async (datos: {
    token: string;
    vl_api_base_url?: string;
  }) => {
    const respuesta = await api.put('/licenciamiento/credencial', datos);
    return respuesta.data;
  },
  obtenerLlavePublicaVl: async () => {
    const respuesta = await api.get('/licenciamiento/vl/llave-publica');
    return respuesta.data as { llave_publica: string };
  },
  activarLicenciaVl: async (datos: {
    codigo_32: string;
    hwid_cliente: string;
    hash_aceptacion_local: string;
  }) => {
    const respuesta = await api.post('/licenciamiento/vl/activar', datos);
    return respuesta.data;
  },
};

export const licenciamientoPublicoApi = {
  obtenerEstadoInstalacion: async (datos: { hwid_cliente: string; verificar?: boolean }) => {
    const params = new URLSearchParams({
      hwid_cliente: datos.hwid_cliente,
    });
    if (datos.verificar) params.set('verificar', '1');
    const respuesta = await api.get(`/licenciamiento-publico/estado?${params.toString()}`);
    return respuesta.data as {
      hwid: string;
      eula_aceptado: boolean;
      eula_aceptado_en: string | null;
      eula_version: string | null;
      credencial_configurada: boolean;
      credencial_valida: boolean;
      credencial_actualizado_en: string | null;
      credencial_validado_en: string | null;
      motivo: string | null;
    };
  },
  aceptarEula: async (datos: {
    hwid_cliente: string;
    eula_version?: string;
    hash_aceptacion_local?: string;
    plataforma?: string;
    hostname?: string;
    app_version?: string;
    dispositivo?: Record<string, any>;
  }) => {
    const respuesta = await api.post('/licenciamiento-publico/eula/aceptar', datos);
    return respuesta.data as { aceptado: boolean; aceptado_en: string };
  },
  guardarCredencial: async (datos: {
    hwid_cliente: string;
    token?: string;
    vl_api_base_url?: string;
  }) => {
    const respuesta = await api.put('/licenciamiento-publico/credencial', datos);
    return respuesta.data as {
      configurada: boolean;
      valida: boolean;
      validado_en: string | null;
      actualizado_en: string;
      motivo: string | null;
    };
  },
  activarLicenciaVl: async (datos: {
    codigo_32: string;
    hwid_cliente: string;
    hash_aceptacion_local: string;
  }) => {
    const respuesta = await api.post('/licenciamiento-publico/vl/activar', datos);
    return respuesta.data;
  },
  solicitarLicenciaVl: async (datos: {
    hwid_cliente: string;
    origen?: string;
    app_version?: string;
    plataforma?: string;
  }) => {
    const respuesta = await api.post('/licenciamiento-publico/vl/licencias/solicitar', datos);
    return respuesta.data as {
      id_licencia: string;
      estado: string;
      fecha_creacion: string;
    };
  },
  obtenerEstadoSolicitudLicenciaVl: async (datos: { hwid_cliente: string; id_licencia: string }) => {
    const params = new URLSearchParams({ hwid_cliente: datos.hwid_cliente });
    const respuesta = await api.get(
      `/licenciamiento-publico/vl/licencias/solicitud/${encodeURIComponent(datos.id_licencia)}?${params.toString()}`,
    );
    return respuesta.data as {
      id_licencia: string;
      estado: string;
      fecha_creacion: string;
    };
  },
  crearSugerenciaVl: async (datos: {
    hwid_cliente: string;
    categoria: string;
    contenido: string;
    imagenes?: string[];
    correo?: string;
    celular?: string;
  }) => {
    const respuesta = await api.post('/licenciamiento-publico/vl/sugerencias', datos);
    return respuesta.data;
  },
};

export type EstadoMigracion = {
  en_progreso: boolean;
  progreso: number;
  etapa: string;
  mensaje?: string;
  error?: string;
  formato_solicitado?: 'zip' | 'rar' | 'tar.gz';
  formato_usado?: 'zip' | 'rar' | 'tar.gz';
  archivo_salida?: string;
  advertencias?: string[];
  iniciado_en?: string;
  finalizado_en?: string;
};

export const migracionApi = {
  iniciar: async (datos?: { formato?: 'zip' | 'rar' | 'tar.gz' }) => {
    const respuesta = await api.post('/migracion/iniciar', datos || {});
    return respuesta.data as { ok: boolean };
  },
  estado: async () => {
    const respuesta = await api.get('/migracion/estado');
    return respuesta.data as EstadoMigracion;
  },
};

