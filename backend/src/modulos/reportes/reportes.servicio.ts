import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Paciente } from '../pacientes/entidades/paciente.entidad';
import { Cita } from '../agenda/entidades/cita.entidad';
import {
  PlanTratamiento,
  EstadoPlanTratamiento,
} from '../tratamientos/entidades/plan-tratamiento.entidad';
import { Pago } from '../finanzas/entidades/pago.entidad';
import { Egreso } from '../finanzas/entidades/egreso.entidad';
import { Inventario } from '../inventario/entidades/inventario.entidad';
import { Producto } from '../inventario/entidades/producto.entidad';
import {
  Kardex,
  TipoOperacionKardex,
} from '../inventario/entidades/kardex.entidad';
import { Activo } from '../inventario/entidades/activo.entidad';
import { Bitacora } from '../inventario/entidades/bitacora.entidad';
import { Auditoria } from '../inventario/entidades/auditoria.entidad';
import { Reporte } from './entidades/reporte.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { ConfiguracionClinica } from '../catalogo/entidades/configuracion-clinica.entidad';
import { GeminiServicio } from '../gemini/gemini.servicio';
import { GenerarReporteDto, AreaReporte } from './dto/generar-reporte.dto';
import {
  AlmacenamientoServicio,
  TipoDocumento,
} from '../almacenamiento/almacenamiento.servicio';
import PDFDocument from 'pdfkit';
type PDFDocumentType = InstanceType<typeof PDFDocument>;
import { createReadStream } from 'fs';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

@Injectable()
export class ReportesServicio {
  constructor(
    @InjectRepository(Paciente)
    private readonly paciente_repositorio: Repository<Paciente>,
    @InjectRepository(Cita)
    private readonly cita_repositorio: Repository<Cita>,
    @InjectRepository(PlanTratamiento)
    private readonly plan_repositorio: Repository<PlanTratamiento>,
    @InjectRepository(Pago)
    private readonly pago_repositorio: Repository<Pago>,
    @InjectRepository(Egreso)
    private readonly egreso_repositorio: Repository<Egreso>,
    @InjectRepository(Inventario)
    private readonly inventario_repositorio: Repository<Inventario>,
    @InjectRepository(Producto)
    private readonly producto_repositorio: Repository<Producto>,
    @InjectRepository(Kardex)
    private readonly kardex_repositorio: Repository<Kardex>,
    @InjectRepository(Activo)
    private readonly activo_repositorio: Repository<Activo>,
    @InjectRepository(Bitacora)
    private readonly bitacora_repositorio: Repository<Bitacora>,
    @InjectRepository(Auditoria)
    private readonly auditoria_repositorio: Repository<Auditoria>,
    @InjectRepository(Reporte)
    private readonly reporte_repositorio: Repository<Reporte>,
    @InjectRepository(Usuario)
    private readonly usuario_repositorio: Repository<Usuario>,
    @InjectRepository(ConfiguracionClinica)
    private readonly configuracion_clinica_repositorio: Repository<ConfiguracionClinica>,
    private readonly gemini_servicio: GeminiServicio,
    private readonly almacenamiento_servicio: AlmacenamientoServicio,
  ) {}

  async generarReporte(
    usuario_id: number,
    dto: GenerarReporteDto,
  ): Promise<Buffer> {
    let fecha_inicio = new Date(0);
    if (dto.fecha_inicio) {
      const [year, month, day] = dto.fecha_inicio
        .toString()
        .split('-')
        .map(Number);
      fecha_inicio = new Date(year, month - 1, day);
    }

    let fecha_fin = new Date();
    if (dto.fecha_fin) {
      const [year, month, day] = dto.fecha_fin
        .toString()
        .split('-')
        .map(Number);
      fecha_fin = new Date(year, month - 1, day);
    }
    fecha_fin.setHours(23, 59, 59, 999);

    const usuario = await this.usuario_repositorio.findOne({
      where: { id: usuario_id },
    });
    const config_clinica = await this.configuracion_clinica_repositorio.findOne(
      { where: { usuario: { id: usuario_id } } },
    );

    const datos_reporte: any = {
      fecha_generacion: new Date(),
      periodo: {
        inicio: fecha_inicio,
        fin: fecha_fin,
      },
      metadatos: {
        nombre_usuario: usuario ? usuario.nombre : 'Usuario',
        nombre_clinica: config_clinica?.nombre_clinica || 'Clínica Dental',
        pais: usuario?.pais || 'Desconocido',
        moneda: usuario?.moneda || 'Bs.',
      },
      areas: {},
    };

    for (const area of dto.areas) {
      switch (area) {
        case AreaReporte.FINANZAS:
          datos_reporte.areas.finanzas = await this.obtenerDatosFinanzas(
            usuario_id,
            fecha_inicio,
            fecha_fin,
          );
          break;
        case AreaReporte.AGENDA:
          datos_reporte.areas.agenda = await this.obtenerDatosAgenda(
            usuario_id,
            fecha_inicio,
            fecha_fin,
          );
          break;
        case AreaReporte.TRATAMIENTOS:
          datos_reporte.areas.tratamientos =
            await this.obtenerDatosTratamientos(
              usuario_id,
              fecha_inicio,
              fecha_fin,
            );
          break;
        case AreaReporte.INVENTARIO:
          datos_reporte.areas.inventario = await this.obtenerDatosInventario(
            usuario_id,
            fecha_inicio,
            fecha_fin,
          );
          break;
      }
    }

    const incluir_sugerencias = dto.incluir_sugerencias !== false;
    const texto_gemini = await this.generarTextoConGemini(
      usuario_id,
      datos_reporte,
      dto.areas,
      incluir_sugerencias,
    );

    return this.generarPDF(datos_reporte, texto_gemini);
  }

  private async obtenerDatosFinanzas(
    usuario_id: number,
    fecha_inicio: Date,
    fecha_fin: Date,
  ): Promise<any> {
    const pagos_todos = await this.pago_repositorio.find({
      where: {
        fecha: Between(fecha_inicio, fecha_fin),
        usuario: { id: usuario_id },
      },
      relations: ['plan_tratamiento', 'plan_tratamiento.paciente'],
      withDeleted: true,
    });

    const egresos_todos = await this.egreso_repositorio.find({
      where: {
        fecha: Between(fecha_inicio, fecha_fin),
        usuario: { id: usuario_id },
      },
      relations: [
        'plan_tratamiento',
        'plan_tratamiento.paciente',
        'plan_tratamiento.tratamiento',
      ],
      withDeleted: true,
    });

    const pagos = pagos_todos.filter((p) => !p.eliminado_en);
    const egresos = egresos_todos.filter((e) => !e.eliminado_en);
    const pagos_eliminados = pagos_todos.filter((p) => p.eliminado_en);
    const egresos_eliminados = egresos_todos.filter((e) => e.eliminado_en);
    const total_ingresos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    const total_egresos = egresos.reduce((sum, e) => sum + Number(e.monto), 0);
    const balance = total_ingresos - total_egresos;
    const total_ingresos_usd = pagos.reduce(
      (sum, p) => sum + Number(p.monto_usd || 0),
      0,
    );
    const total_egresos_usd = egresos.reduce(
      (sum, e) => sum + Number(e.monto_usd || 0),
      0,
    );
    const balance_usd = total_ingresos_usd - total_egresos_usd;
    const total_ingresos_historico = pagos_todos.reduce(
      (sum, p) => sum + Number(p.monto),
      0,
    );
    const total_egresos_historico = egresos_todos.reduce(
      (sum, e) => sum + Number(e.monto),
      0,
    );
    const balance_historico =
      total_ingresos_historico - total_egresos_historico;
    const total_ingresos_historico_usd = pagos_todos.reduce(
      (sum, p) => sum + Number(p.monto_usd || 0),
      0,
    );
    const total_egresos_historico_usd = egresos_todos.reduce(
      (sum, e) => sum + Number(e.monto_usd || 0),
      0,
    );
    const balance_historico_usd =
      total_ingresos_historico_usd - total_egresos_historico_usd;
    const categorias_egresos: {
      [key: string]: { cantidad: number; monto: number; monto_usd: number };
    } = {};
    egresos.forEach((e) => {
      const concepto_base = e.concepto?.split(':')[0]?.trim() || 'Otros';
      if (!categorias_egresos[concepto_base]) {
        categorias_egresos[concepto_base] = {
          cantidad: 0,
          monto: 0,
          monto_usd: 0,
        };
      }
      categorias_egresos[concepto_base].cantidad++;
      categorias_egresos[concepto_base].monto += Number(e.monto);
      categorias_egresos[concepto_base].monto_usd += Number(e.monto_usd || 0);
    });

    const top_egresos = Object.entries(categorias_egresos)
      .map(([concepto, datos]) => ({ concepto, ...datos }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

    const dias_periodo = Math.max(
      1,
      Math.ceil(
        (fecha_fin.getTime() - fecha_inicio.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const promedio_diario_ingresos = total_ingresos / dias_periodo;
    const promedio_diario_egresos = total_egresos / dias_periodo;
    const transacciones_por_hora: {
      [key: number]: { ingresos: number; egresos: number; count: number };
    } = {};
    const transacciones_por_fecha: {
      [key: string]: {
        ingresos: number;
        egresos: number;
        ingresos_usd: number;
        egresos_usd: number;
      };
    } = {};
    const transacciones_historico_por_fecha: {
      [key: string]: {
        ingresos: number;
        egresos: number;
        ingresos_usd: number;
        egresos_usd: number;
      };
    } = {};

    pagos.forEach((p) => {
      const fecha = new Date(p.fecha);
      const hora = fecha.getHours();
      const fechaStr = fecha.toISOString().split('T')[0];

      if (!transacciones_por_hora[hora])
        transacciones_por_hora[hora] = { ingresos: 0, egresos: 0, count: 0 };
      transacciones_por_hora[hora].ingresos += Number(p.monto);
      transacciones_por_hora[hora].count++;

      if (!transacciones_por_fecha[fechaStr])
        transacciones_por_fecha[fechaStr] = {
          ingresos: 0,
          egresos: 0,
          ingresos_usd: 0,
          egresos_usd: 0,
        };
      transacciones_por_fecha[fechaStr].ingresos += Number(p.monto);
      transacciones_por_fecha[fechaStr].ingresos_usd += Number(
        p.monto_usd || 0,
      );
    });

    egresos.forEach((e) => {
      const fecha = new Date(e.fecha);
      const hora = fecha.getHours();
      const fechaStr = fecha.toISOString().split('T')[0];

      if (!transacciones_por_hora[hora])
        transacciones_por_hora[hora] = { ingresos: 0, egresos: 0, count: 0 };
      transacciones_por_hora[hora].egresos += Number(e.monto);
      transacciones_por_hora[hora].count++;

      if (!transacciones_por_fecha[fechaStr])
        transacciones_por_fecha[fechaStr] = {
          ingresos: 0,
          egresos: 0,
          ingresos_usd: 0,
          egresos_usd: 0,
        };
      transacciones_por_fecha[fechaStr].egresos += Number(e.monto);
      transacciones_por_fecha[fechaStr].egresos_usd += Number(e.monto_usd || 0);
    });

    pagos_todos.forEach((p) => {
      const fecha = new Date(p.fecha);
      const fechaStr = fecha.toISOString().split('T')[0];

      if (!transacciones_historico_por_fecha[fechaStr]) {
        transacciones_historico_por_fecha[fechaStr] = {
          ingresos: 0,
          egresos: 0,
          ingresos_usd: 0,
          egresos_usd: 0,
        };
      }
      transacciones_historico_por_fecha[fechaStr].ingresos += Number(p.monto);
      transacciones_historico_por_fecha[fechaStr].ingresos_usd += Number(
        p.monto_usd || 0,
      );
    });

    egresos_todos.forEach((e) => {
      const fecha = new Date(e.fecha);
      const fechaStr = fecha.toISOString().split('T')[0];

      if (!transacciones_historico_por_fecha[fechaStr]) {
        transacciones_historico_por_fecha[fechaStr] = {
          ingresos: 0,
          egresos: 0,
          ingresos_usd: 0,
          egresos_usd: 0,
        };
      }
      transacciones_historico_por_fecha[fechaStr].egresos += Number(e.monto);
      transacciones_historico_por_fecha[fechaStr].egresos_usd += Number(
        e.monto_usd || 0,
      );
    });

    return {
      total_ingresos,
      total_egresos,
      balance,
      total_ingresos_usd,
      total_egresos_usd,
      balance_usd,
      total_ingresos_historico,
      total_egresos_historico,
      balance_historico,
      total_ingresos_historico_usd,
      total_egresos_historico_usd,
      balance_historico_usd,
      cantidad_pagos: pagos.length,
      cantidad_egresos: egresos.length,
      promedio_diario_ingresos,
      promedio_diario_egresos,
      top_categorias_egresos: top_egresos,
      analisis_temporal: {
        por_hora: transacciones_por_hora,
        por_fecha: transacciones_por_fecha,
      },
      analisis_temporal_historico: {
        por_fecha: transacciones_historico_por_fecha,
      },
      pagos: pagos.slice(0, 10).map((p) => ({
        fecha: p.fecha,
        monto: Number(p.monto),
        monto_usd: Number(p.monto_usd || 0),
        tasa_cambio: Number(p.tasa_cambio || 1),
        concepto: p.concepto,
        paciente: p.plan_tratamiento?.paciente
          ? `${p.plan_tratamiento.paciente.nombre} ${p.plan_tratamiento.paciente.apellidos}`
          : 'N/A',
      })),
      egresos: egresos.slice(0, 10).map((e) => ({
        fecha: e.fecha,
        monto: Number(e.monto),
        monto_usd: Number(e.monto_usd || 0),
        tasa_cambio: Number(e.tasa_cambio || 1),
        concepto: e.concepto,
        plan_tratamiento_id: e.plan_tratamiento?.id || null,
        paciente: e.plan_tratamiento?.paciente
          ? `${e.plan_tratamiento.paciente.nombre || ''} ${e.plan_tratamiento.paciente.apellidos || ''}`.trim() ||
            'Sin paciente'
          : null,
        tratamiento: (e.plan_tratamiento as any)?.tratamiento?.nombre || null,
      })),
      movimientos_eliminados: {
        ingresos: {
          cantidad: pagos_eliminados.length,
          total: pagos_eliminados.reduce((sum, p) => sum + Number(p.monto), 0),
          total_usd: pagos_eliminados.reduce(
            (sum, p) => sum + Number(p.monto_usd || 0),
            0,
          ),
          detalles: pagos_eliminados.map((p) => ({
            fecha: p.fecha,
            monto: p.monto,
            monto_usd: p.monto_usd,
            concepto: p.concepto,
            fecha_eliminacion: p.eliminado_en,
          })),
        },
        egresos: {
          cantidad: egresos_eliminados.length,
          total: egresos_eliminados.reduce(
            (sum, e) => sum + Number(e.monto),
            0,
          ),
          total_usd: egresos_eliminados.reduce(
            (sum, e) => sum + Number(e.monto_usd || 0),
            0,
          ),
          detalles: egresos_eliminados.map((e) => ({
            fecha: e.fecha,
            monto: e.monto,
            monto_usd: e.monto_usd,
            concepto: e.concepto,
            fecha_eliminacion: e.eliminado_en,
          })),
        },
      },
    };
  }

  private async obtenerDatosAgenda(
    usuario_id: number,
    fecha_inicio: Date,
    fecha_fin: Date,
  ): Promise<any> {
    const citas = await this.cita_repositorio.find({
      where: {
        fecha: Between(fecha_inicio, fecha_fin),
        usuario: { id: usuario_id },
      },
      relations: [
        'paciente',
        'plan_tratamiento',
        'reservas_materiales',
        'reservas_materiales.material',
        'reservas_materiales.material.producto',
      ],
    });

    const citas_por_estado = {
      pendiente: citas.filter((c) => c.estado_pago === 'pendiente').length,
      pagado: citas.filter((c) => c.estado_pago === 'pagado').length,
      cancelado: citas.filter((c) => c.estado_pago === 'cancelado').length,
      sin_paciente: citas.filter((c) => !c.paciente).length,
    };

    const materiales_usados: { [key: string]: number } = {};
    citas.forEach((c) => {
      if (c.reservas_materiales) {
        c.reservas_materiales.forEach((r) => {
          const nombre = r.material?.producto?.nombre || 'Desconocido';
          materiales_usados[nombre] =
            (materiales_usados[nombre] || 0) + Number(r.cantidad_reservada);
        });
      }
    });

    return {
      total_citas: citas.length,
      citas_por_estado,
      materiales_mas_usados: Object.entries(materiales_usados)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nombre, cantidad]) => ({ nombre, cantidad })),
      proximas_citas: citas
        .filter((c) => new Date(c.fecha) > new Date())
        .slice(0, 10)
        .map((c) => ({
          fecha: c.fecha,
          descripcion: c.descripcion,
          paciente: c.paciente
            ? `${c.paciente.nombre} ${c.paciente.apellidos}`
            : 'Sin paciente',
          estado_pago: c.estado_pago,
          materiales: c.reservas_materiales?.length || 0,
        })),
    };
  }

  private async obtenerDatosTratamientos(
    usuario_id: number,
    fecha_inicio: Date,
    fecha_fin: Date,
  ): Promise<any> {
    const planes = await this.plan_repositorio.find({
      where: { usuario: { id: usuario_id } },
      relations: ['paciente', 'tratamiento', 'citas'],
    });

    const egresos_todos = await this.egreso_repositorio.find({
      where: {
        fecha: Between(fecha_inicio, fecha_fin),
        usuario: { id: usuario_id },
      },
      relations: [
        'plan_tratamiento',
        'plan_tratamiento.paciente',
        'plan_tratamiento.tratamiento',
      ],
      withDeleted: true,
    });

    const egresos_con_plan = egresos_todos.filter(
      (e) => e.plan_tratamiento?.id,
    );
    const egresos_por_tratamiento_map = new Map<
      number,
      {
        plan_id: number;
        paciente: string;
        tratamiento: string;
        cantidad: number;
        monto_total: number;
        monto_total_usd: number;
        cantidad_eliminados: number;
        monto_eliminados: number;
        monto_eliminados_usd: number;
      }
    >();

    egresos_con_plan.forEach((e) => {
      const plan_id = e.plan_tratamiento!.id;
      const paciente = e.plan_tratamiento?.paciente
        ? `${e.plan_tratamiento.paciente.nombre || ''} ${e.plan_tratamiento.paciente.apellidos || ''}`.trim() ||
          'Sin paciente'
        : 'Sin paciente';
      const tratamiento =
        (e.plan_tratamiento as any)?.tratamiento?.nombre || 'Sin tratamiento';

      if (!egresos_por_tratamiento_map.has(plan_id)) {
        egresos_por_tratamiento_map.set(plan_id, {
          plan_id,
          paciente,
          tratamiento,
          cantidad: 0,
          monto_total: 0,
          monto_total_usd: 0,
          cantidad_eliminados: 0,
          monto_eliminados: 0,
          monto_eliminados_usd: 0,
        });
      }

      const item = egresos_por_tratamiento_map.get(plan_id)!;
      item.cantidad += 1;
      item.monto_total += Number(e.monto || 0);
      item.monto_total_usd += Number(e.monto_usd || 0);

      if (e.eliminado_en) {
        item.cantidad_eliminados += 1;
        item.monto_eliminados += Number(e.monto || 0);
        item.monto_eliminados_usd += Number(e.monto_usd || 0);
      }
    });

    const egresos_por_tratamiento = Array.from(
      egresos_por_tratamiento_map.values(),
    )
      .sort((a, b) => b.monto_total - a.monto_total)
      .slice(0, 15);

    const planes_activos = planes.filter(
      (p) => !p.estado || p.estado === EstadoPlanTratamiento.PENDIENTE,
    );
    const planes_completados = planes.filter(
      (p) => p.estado === EstadoPlanTratamiento.COMPLETADO,
    );
    const planes_cancelados = planes.filter(
      (p) => p.estado === EstadoPlanTratamiento.CANCELADO,
    );

    const total_por_cobrar = planes_activos.reduce((sum, p) => {
      return sum + (Number(p.costo_total) - Number(p.total_abonado));
    }, 0);

    return {
      total_planes: planes.length,
      planes_activos: planes_activos.length,
      planes_completados: planes_completados.length,
      planes_cancelados: planes_cancelados.length,
      total_por_cobrar,
      tratamientos_mas_comunes: this.obtenerTratamientosMasComunes(planes),
      egresos_por_tratamiento,
      planes_recientes: planes.slice(0, 10).map((p) => ({
        paciente: p.paciente
          ? `${p.paciente.nombre || ''} ${p.paciente.apellidos || ''}`.trim() ||
            'Sin paciente'
          : 'Sin paciente',
        tratamiento: p.tratamiento?.nombre || 'Sin tratamiento',
        costo_total: Number(p.costo_total),
        abonado: Number(p.total_abonado),
        pendiente: Number(p.costo_total) - Number(p.total_abonado),
        estado: p.estado || 'pendiente',
      })),
    };
  }

  private obtenerTratamientosMasComunes(planes: PlanTratamiento[]): any[] {
    const conteo: { [key: string]: { nombre: string; cantidad: number } } = {};

    planes.forEach((p) => {
      const nombre = p.tratamiento?.nombre;
      if (!nombre) return;
      if (!conteo[nombre]) {
        conteo[nombre] = { nombre, cantidad: 0 };
      }
      conteo[nombre].cantidad++;
    });

    return Object.values(conteo)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  private async obtenerDatosInventario(
    usuario_id: number,
    fecha_inicio: Date,
    fecha_fin: Date,
  ): Promise<any> {
    const inventarios = await this.inventario_repositorio.find({
      where: {
        propietario: { id: usuario_id },
        activo: true,
      },
      relations: ['productos', 'productos.materiales', 'productos.activos'],
    });

    const inventarios_ids = inventarios.map((inv) => inv.id);

    let movimientos_kardex: Kardex[] = [];
    let auditoria_reciente: Auditoria[] = [];
    let bitacora_reciente: Bitacora[] = [];

    if (inventarios_ids.length > 0) {
      movimientos_kardex = await this.kardex_repositorio
        .createQueryBuilder('kardex')
        .leftJoinAndSelect('kardex.producto', 'producto')
        .where('kardex.inventario IN (:...ids)', { ids: inventarios_ids })
        .andWhere('kardex.fecha BETWEEN :inicio AND :fin', {
          inicio: fecha_inicio,
          fin: fecha_fin,
        })
        .orderBy('kardex.fecha', 'DESC')
        .getMany();

      auditoria_reciente = await this.auditoria_repositorio
        .createQueryBuilder('auditoria')
        .leftJoinAndSelect('auditoria.usuario', 'usuario')
        .where('auditoria.fecha BETWEEN :inicio AND :fin', {
          inicio: fecha_inicio,
          fin: fecha_fin,
        })
        .orderBy('auditoria.fecha', 'DESC')
        .take(20)
        .getMany();
      const bitacora_qb = this.bitacora_repositorio
        .createQueryBuilder('bitacora')
        .leftJoinAndSelect('bitacora.activo', 'activo')
        .leftJoinAndSelect('activo.producto', 'producto')
        .where('bitacora.inventario IN (:...ids)', { ids: inventarios_ids });
      try {
        bitacora_reciente = await bitacora_qb
          .andWhere('bitacora.fecha BETWEEN :inicio AND :fin', {
            inicio: fecha_inicio,
            fin: fecha_fin,
          })
          .orderBy('bitacora.fecha', 'DESC')
          .take(20)
          .getMany();
      } catch (e) {
        bitacora_reciente = await bitacora_qb
          .orderBy('bitacora.id', 'DESC')
          .take(20)
          .getMany();
      }
    }

    const entradas = movimientos_kardex.filter(
      (m) => m.operacion === TipoOperacionKardex.ENTRADA,
    );
    const salidas = movimientos_kardex.filter(
      (m) => m.operacion === TipoOperacionKardex.SALIDA,
    );
    const total_entradas = entradas.reduce(
      (sum, m) => sum + Number(m.cantidad),
      0,
    );
    const total_salidas = salidas.reduce(
      (sum, m) => sum + Number(m.cantidad),
      0,
    );
    const monto_entradas = entradas.reduce(
      (sum, m) => sum + Number(m.monto || 0),
      0,
    );
    const monto_salidas = salidas.reduce(
      (sum, m) => sum + Number(m.monto || 0),
      0,
    );

    const movimientos_por_tipo: {
      [key: string]: { cantidad: number; monto: number };
    } = {};
    movimientos_kardex.forEach((m) => {
      if (!movimientos_por_tipo[m.tipo]) {
        movimientos_por_tipo[m.tipo] = { cantidad: 0, monto: 0 };
      }
      movimientos_por_tipo[m.tipo].cantidad += Number(m.cantidad);
      movimientos_por_tipo[m.tipo].monto += Number(m.monto || 0);
    });

    const activos_por_estado: { [key: string]: number } = {};
    let total_activos = 0;
    if (inventarios_ids.length > 0) {
      const activos = await this.activo_repositorio
        .createQueryBuilder('activo')
        .leftJoin('activo.producto', 'producto')
        .leftJoin('producto.inventario', 'inventario')
        .where('inventario.id IN (:...ids)', { ids: inventarios_ids })
        .getMany();

      total_activos = activos.length;
      activos.forEach((a) => {
        const estado = a.estado || 'desconocido';
        activos_por_estado[estado] = (activos_por_estado[estado] || 0) + 1;
      });
    }

    const total_productos = inventarios.reduce((sum, inv) => {
      return sum + inv.productos.filter((p) => p.activo).length;
    }, 0);

    const productos_bajo_stock = inventarios.flatMap((inv) =>
      inv.productos.filter((p) => {
        if (!p.activo) return false;
        if (p.tipo === 'material') {
          const stock_actual = p.materiales
            .filter((m) => m.activo)
            .reduce((sum, m) => sum + Number(m.cantidad_actual), 0);
          return stock_actual < p.stock_minimo;
        }
        return false;
      }),
    );

    return {
      total_inventarios: inventarios.length,
      total_productos,
      total_activos,
      productos_bajo_stock: productos_bajo_stock.length,
      movimientos: {
        total_movimientos: movimientos_kardex.length,
        entradas: {
          cantidad: total_entradas,
          monto: monto_entradas,
          registros: entradas.length,
        },
        salidas: {
          cantidad: total_salidas,
          monto: monto_salidas,
          registros: salidas.length,
        },
        por_tipo: movimientos_por_tipo,
        detalles_kardex: movimientos_kardex.slice(0, 15).map((m) => ({
          fecha: m.fecha,
          producto: m.producto?.nombre,
          operacion: m.operacion,
          cantidad: m.cantidad,
          tipo: m.tipo,
          detalle: m.observaciones,
        })),
        auditoria: auditoria_reciente.map((a) => ({
          fecha: a.fecha,
          accion: a.accion,
          categoria: a.categoria,
          usuario: a.usuario?.nombre,
          detalle: a.categoria === 'ajuste' ? 'Ajuste de stock' : a.accion,
        })),
        bitacora: bitacora_reciente.map((b) => ({
          activo: b.activo?.producto?.nombre,
          estado_anterior: b.estado_anterior,
          estado_nuevo: b.estado_nuevo,
          observacion: b.motivo,
        })),
      },
      activos_por_estado,
      alertas: productos_bajo_stock.map((p) => ({
        nombre: p.nombre,
        stock_minimo: p.stock_minimo,
        stock_actual: p.materiales
          .filter((m) => m.activo)
          .reduce((sum, m) => sum + Number(m.cantidad_actual), 0),
      })),
    };
  }

  private async generarTextoConGemini(
    usuario_id: number,
    datos_reporte: any,
    areas: AreaReporte[],
    incluir_sugerencias: boolean,
  ): Promise<any> {
    const datos_json = JSON.stringify(datos_reporte, null, 2);

    const estructura_base = {
      resumen:
        'Un resumen ejecutivo de 2-3 párrafos con el estado general de la clínica.',
      finanzas:
        'Análisis específico de finanzas (si aplica), tendencias de ingresos/egresos.',
      agenda: 'Análisis de la agenda, citas, ausentismo, etc.',
      tratamientos: 'Análisis de tratamientos más comunes y rentabilidad.',
      inventario:
        'Análisis de estado de inventario, alertas de stock y movimientos.',
    };

    if (incluir_sugerencias) {
      estructura_base['conclusiones'] =
        'Conclusiones finales y recomendaciones prácticas.';
    }

    const estructura_json = JSON.stringify(estructura_base, null, 2);

    const prompt = `
Eres un asistente experto en análisis de datos para clínicas dentales. 
A continuación te proporciono datos de un reporte que incluye las siguientes áreas: ${areas.join(', ')}.

Fecha del reporte: ${new Date(datos_reporte.fecha_generacion)}
Período analizado: ${new Date(datos_reporte.periodo.inicio)} - ${new Date(datos_reporte.periodo.fin)}
Metadatos:
Clinica: ${datos_reporte.metadatos.nombre_clinica}
Usuario: ${datos_reporte.metadatos.nombre_usuario}
Pais: ${datos_reporte.metadatos.pais || 'No especificado'}
Moneda: ${datos_reporte.metadatos.moneda || 'Bs.'}

Datos del reporte:
${datos_json}

Por favor, genera un análisis profesional y coherente.
INSTRUCCIONES ESPECÍFICAS:
1. En INVENTARIO: Debes presentar la información de Kardex, Registro de Actividad y Bitácora utilizando TABLAS DE MARKDOWN para facilitar la lectura. Analiza patrones sospechosos en el registro de actividad.
2. En FINANZAS: Compara el BALANCE REAL actual vs el BALANCE HISTÓRICO (que incluye registros borrados). Analiza si las diferencias en ingresos/egresos sugieren robo hormiga o comportamiento sospechoso. Usa la moneda ${datos_reporte.metadatos.moneda || 'Bs.'}. También analiza los montos en Dólares (USD) si hay diferencias significativas en el tipo de cambio. Observa los patrones por hora y fecha si están disponibles para detectar anomalías temporales.
3. En TRATAMIENTOS: Analiza la eficiencia basada en tratamientos completados vs cancelados vs pendientes. Considera también egresos asociados a tratamientos (p.ej. devoluciones o ajustes) como un punto clave de auditoría.
4. En AGENDA: Menciona el uso de materiales en las citas si la información está disponible.

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido (sin bloques de código markdown) con la siguiente estructura:
${estructura_json}

Si un área no está incluida en los datos, puedes dejar el campo vacío o null.
El texto dentro de cada campo debe usar formato Markdown (incluyendo tablas cuando se solicite).
`;

    const respuesta = await this.gemini_servicio.generarContenido(
      usuario_id,
      prompt,
      false,
    );
    try {
      const jsonStr = respuesta
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Error al parsear respuesta de Gemini:', e);
      const fallback: any = {
        resumen: respuesta,
        finanzas: '',
        agenda: '',
        tratamientos: '',
        inventario: '',
      };
      if (incluir_sugerencias) {
        fallback.conclusiones = '';
      }
      return fallback;
    }
  }

  private async generarPDF(
    datos_reporte: any,
    analisis_gemini: any,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdf_buffer = Buffer.concat(buffers);
          resolve(pdf_buffer);
        });

        doc.font('Times-Roman');

        doc
          .fontSize(24)
          .text(datos_reporte.metadatos.nombre_clinica, { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(20).text('Reporte General', { align: 'center' });
        doc.moveDown();

        const fechaGen = new Date(datos_reporte.fecha_generacion);
        const inicio = new Date(datos_reporte.periodo.inicio);
        const fin = new Date(datos_reporte.periodo.fin);

        const formatoFecha = (d: Date) => {
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };

        const formatoFechaHoraAmigable = (d: Date) => {
          return new Intl.DateTimeFormat('es-BO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(d);
        };
        const fechaAmigable = formatoFechaHoraAmigable(fechaGen);
        const fechaFinal =
          fechaAmigable.charAt(0).toUpperCase() + fechaAmigable.slice(1);

        doc
          .fontSize(12)
          .text(`Generado por: ${datos_reporte.metadatos.nombre_usuario}`);
        doc.text(`Fecha: ${fechaFinal}`);
        doc.text(`Período: ${formatoFecha(inicio)} - ${formatoFecha(fin)}`);
        doc.moveDown(2);

        if (analisis_gemini.resumen) {
          doc.font('Times-Bold');
          doc.fontSize(16).text('Resumen Ejecutivo', { underline: true });
          doc.moveDown();
          this.agregarTextoMarkdown(doc, analisis_gemini.resumen);
          doc.moveDown(2);
        }

        if (datos_reporte.areas.finanzas) {
          await this.agregarSeccionFinanzas(
            doc,
            datos_reporte.areas.finanzas,
            analisis_gemini.finanzas,
          );
        }

        if (datos_reporte.areas.agenda) {
          await this.agregarSeccionAgenda(
            doc,
            datos_reporte.areas.agenda,
            analisis_gemini.agenda,
          );
        }

        if (datos_reporte.areas.tratamientos) {
          await this.agregarSeccionTratamientos(
            doc,
            datos_reporte.areas.tratamientos,
            analisis_gemini.tratamientos,
          );
        }

        if (datos_reporte.areas.inventario) {
          await this.agregarSeccionInventario(
            doc,
            datos_reporte.areas.inventario,
            analisis_gemini.inventario,
          );
        }

        if (analisis_gemini.conclusiones) {
          doc.addPage();
          doc.font('Times-Bold');
          doc
            .fontSize(16)
            .text('Conclusiones y Recomendaciones', { underline: true });
          doc.moveDown();
          this.agregarTextoMarkdown(doc, analisis_gemini.conclusiones);
        }

        doc.end();
      } catch (error) {
        reject(new InternalServerErrorException('Error al generar el PDF'));
      }
    });
  }

  private agregarTextoMarkdown(doc: PDFDocumentType, texto: string): void {
    const lineas = texto.split('\n');
    let skipLines = 0;

    for (let i = 0; i < lineas.length; i++) {
      if (skipLines > 0) {
        skipLines--;
        continue;
      }

      doc.x = doc.page.margins.left;
      const linea = lineas[i];

      if (!linea.trim()) {
        doc.moveDown(0.5);
        continue;
      }

      if (linea.trim().startsWith('|')) {
        const tableLines: string[] = [];
        let j = i;
        while (j < lineas.length && lineas[j].trim().startsWith('|')) {
          tableLines.push(lineas[j]);
          j++;
        }

        if (tableLines.length >= 2) {
          this.procesarTablaMarkdown(doc, tableLines);
          skipLines = tableLines.length - 1;
          continue;
        }
      }

      if (linea.trim().match(/^-{3,}$/) || linea.trim().match(/^\*{3,}$/)) {
        doc.moveDown(0.3);
        const posY = doc.y;
        doc
          .moveTo(doc.page.margins.left, posY)
          .lineTo(doc.page.width - doc.page.margins.right, posY)
          .stroke();
        doc.moveDown(0.5);
        continue;
      }

      const lineaLimpia = linea.trim();

      if (lineaLimpia.startsWith('# ') && !lineaLimpia.startsWith('## ')) {
        doc.font('Times-Bold');
        doc
          .fontSize(16)
          .text(lineaLimpia.substring(2), doc.page.margins.left, doc.y, {
            width:
              doc.page.width - doc.page.margins.left - doc.page.margins.right,
            continued: false,
          });
        doc.moveDown(0.6);
        doc.font('Times-Roman');
        doc.fontSize(11);
        continue;
      }
      if (lineaLimpia.startsWith('## ')) {
        doc.font('Times-Bold');
        doc
          .fontSize(14)
          .text(lineaLimpia.substring(3), doc.page.margins.left, doc.y, {
            width:
              doc.page.width - doc.page.margins.left - doc.page.margins.right,
            continued: false,
          });
        doc.moveDown(0.5);
        doc.font('Times-Roman');
        doc.fontSize(11);
        continue;
      }
      if (lineaLimpia.startsWith('### ')) {
        doc.font('Times-Bold');
        doc
          .fontSize(12)
          .text(lineaLimpia.substring(4), doc.page.margins.left, doc.y, {
            width:
              doc.page.width - doc.page.margins.left - doc.page.margins.right,
            continued: false,
          });
        doc.moveDown(0.3);
        doc.font('Times-Roman');
        doc.fontSize(11);
        continue;
      }
      if (lineaLimpia.startsWith('#### ')) {
        doc.font('Times-Bold');
        doc
          .fontSize(11)
          .text(lineaLimpia.substring(5), doc.page.margins.left, doc.y, {
            width:
              doc.page.width - doc.page.margins.left - doc.page.margins.right,
            continued: false,
          });
        doc.moveDown(0.3);
        doc.font('Times-Roman');
        doc.fontSize(11);
        continue;
      }

      if (linea.trim().startsWith('- ') || linea.trim().startsWith('* ')) {
        const texto_lista = linea.trim().substring(2);
        doc.fontSize(11);
        this.procesarLineaConFormato(doc, `  • ${texto_lista}`);
        doc.moveDown(0.2);
        continue;
      }
      const match_numerada = linea.trim().match(/^(\d+)\.\s+(.*)$/);
      if (match_numerada) {
        const numero = match_numerada[1];
        const texto_item = match_numerada[2];
        doc.fontSize(11);
        this.procesarLineaConFormato(doc, `  ${numero}. ${texto_item}`);
        doc.moveDown(0.2);
        continue;
      }
      doc.fontSize(11);
      this.procesarLineaConFormato(doc, linea);
      doc.moveDown(0.3);
    }
  }

  private procesarLineaConFormato(
    doc: PDFDocumentType,
    linea: string,
  ): void {
    const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
    let ultima_posicion = 0;
    let match;

    const partes: Array<{ texto: string; negrita: boolean; cursiva: boolean }> =
      [];

    while ((match = regex.exec(linea)) !== null) {
      if (match.index > ultima_posicion) {
        partes.push({
          texto: linea.substring(ultima_posicion, match.index),
          negrita: false,
          cursiva: false,
        });
      }

      if (match[1]) {
        partes.push({
          texto: match[1].slice(2, -2),
          negrita: true,
          cursiva: false,
        });
      } else if (match[2]) {
        partes.push({
          texto: match[2].slice(1, -1),
          negrita: false,
          cursiva: true,
        });
      }

      ultima_posicion = regex.lastIndex;
    }

    if (ultima_posicion < linea.length) {
      partes.push({
        texto: linea.substring(ultima_posicion),
        negrita: false,
        cursiva: false,
      });
    }

    if (partes.length === 0) {
      doc.text(linea, { align: 'left' });
      return;
    }

    partes.forEach((part, index) => {
      if (part.negrita) doc.font('Times-Bold');
      else if (part.cursiva) doc.font('Times-Italic');
      else doc.font('Times-Roman');

      doc.text(part.texto, {
        continued: index < partes.length - 1,
        align: 'left',
      });
    });
    doc.font('Times-Roman');
  }

  private renderTextoConFormatoEnCelda(
    doc: PDFDocumentType,
    texto: string,
    x: number,
    y: number,
    width: number,
  ): void {
    const prevX = doc.x;
    const prevY = doc.y;
    const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
    let ultima_posicion = 0;
    let match;
    const partes: Array<{ texto: string; negrita: boolean; cursiva: boolean }> =
      [];

    while ((match = regex.exec(texto)) !== null) {
      if (match.index > ultima_posicion) {
        partes.push({
          texto: texto.substring(ultima_posicion, match.index),
          negrita: false,
          cursiva: false,
        });
      }

      if (match[1]) {
        partes.push({
          texto: match[1].slice(2, -2),
          negrita: true,
          cursiva: false,
        });
      } else if (match[2]) {
        partes.push({
          texto: match[2].slice(1, -1),
          negrita: false,
          cursiva: true,
        });
      }

      ultima_posicion = regex.lastIndex;
    }

    if (ultima_posicion < texto.length) {
      partes.push({
        texto: texto.substring(ultima_posicion),
        negrita: false,
        cursiva: false,
      });
    }

    if (partes.length === 0) {
      doc.text(texto, x, y, { width, align: 'left' });
      doc.x = prevX;
      doc.y = prevY;
      return;
    }

    partes.forEach((part, index) => {
      if (part.negrita) doc.font('Times-Bold');
      else if (part.cursiva) doc.font('Times-Italic');
      else doc.font('Times-Roman');

      const opts: any = {
        width,
        align: 'left',
        continued: index < partes.length - 1,
      };
      if (index === 0) {
        doc.text(part.texto, x, y, opts);
      } else {
        doc.text(part.texto, opts);
      }
    });
    doc.font('Times-Roman');
    doc.x = prevX;
    doc.y = prevY;
  }

  private procesarTablaMarkdown(
    doc: PDFDocumentType,
    filasTabla: string[],
  ): void {
    if (filasTabla.length < 2) return;

    const encabezados = filasTabla[0]
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c);

    const filasDatos = filasTabla.slice(2).map((fila) =>
      fila
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c !== ''),
    );

    const startX = doc.page.margins.left;
    let currentY = doc.y;
    const usableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidth = usableWidth / encabezados.length;

    if (currentY + 30 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
    }

    doc.font('Times-Bold').fontSize(10);
    encabezados.forEach((header, index) => {
      doc.text(header, startX + index * columnWidth, currentY, {
        width: columnWidth - 5,
        align: 'left',
      });
    });

    currentY += 15;
    doc
      .moveTo(startX, currentY)
      .lineTo(doc.page.width - doc.page.margins.right, currentY)
      .stroke();
    currentY += 5;

    doc.font('Times-Roman').fontSize(10);
    filasDatos.forEach((fila) => {
      const rowHeight = fila.reduce((max, cell) => {
        const height = doc.heightOfString(cell || '', {
          width: columnWidth - 5,
        });
        return Math.max(max, height);
      }, 15);

      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
        doc.font('Times-Bold');
        encabezados.forEach((header, index) => {
          doc.text(header, startX + index * columnWidth, currentY, {
            width: columnWidth - 5,
            align: 'left',
          });
        });
        currentY += 15;
        doc
          .moveTo(startX, currentY)
          .lineTo(doc.page.width - doc.page.margins.right, currentY)
          .stroke();
        currentY += 5;
        doc.font('Times-Roman');
      }

      fila.forEach((celda, index) => {
        if (index < encabezados.length) {
          this.renderTextoConFormatoEnCelda(
            doc,
            celda || '',
            startX + index * columnWidth,
            currentY,
            columnWidth - 5,
          );
        }
      });
      currentY += rowHeight + 5;
    });
    doc.y = currentY + 5;
    doc.x = startX;
  }

  private formatearFechaLocal(fecha: Date | string): string {
    const d = new Date(fecha);
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  private async agregarSeccionFinanzas(
    doc: PDFDocumentType,
    datos: any,
    analisis: string,
  ): Promise<void> {
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    } else {
      doc.moveDown(2);
    }
    doc.font('Times-Bold');
    doc.fontSize(16).text('Finanzas', { underline: true });
    doc.moveDown();
    if (analisis) {
      this.agregarTextoMarkdown(doc, analisis);
      doc.moveDown();
    }
    doc.font('Times-Roman');
    doc.fontSize(12);
    doc.text(
      `Total Ingresos (Real): Bs. ${datos.total_ingresos.toFixed(2)} / $${datos.total_ingresos_usd.toFixed(2)}`,
    );
    doc.text(
      `Total Egresos (Real): Bs. ${datos.total_egresos.toFixed(2)} / $${datos.total_egresos_usd.toFixed(2)}`,
    );
    if (datos.balance >= 0) doc.fillColor('green');
    else doc.fillColor('red');
    doc.text(
      `Balance (Real): Bs. ${datos.balance.toFixed(2)} / $${datos.balance_usd.toFixed(2)}`,
    );
    doc.fillColor('black');
    doc.moveDown(0.5);
    doc.font('Times-Italic');
    doc.text(`Histórico (con eliminados):`, { indent: 10 });
    doc.text(
      `Ingresos: Bs. ${datos.total_ingresos_historico.toFixed(2)} / $${datos.total_ingresos_historico_usd.toFixed(2)}`,
      { indent: 20 },
    );
    doc.text(
      `Egresos: Bs. ${datos.total_egresos_historico.toFixed(2)} / $${datos.total_egresos_historico_usd.toFixed(2)}`,
      { indent: 20 },
    );
    doc.text(
      `Balance: Bs. ${datos.balance_historico.toFixed(2)} / $${datos.balance_historico_usd.toFixed(2)}`,
      { indent: 20 },
    );
    doc.font('Times-Roman');
    doc.moveDown();
    doc.text(`Cantidad de pagos: ${datos.cantidad_pagos}`);
    doc.text(`Cantidad de egresos: ${datos.cantidad_egresos}`);
    doc.text(
      `Promedio diario ingresos: Bs. ${datos.promedio_diario_ingresos.toFixed(2)}`,
    );
    doc.text(
      `Promedio diario egresos: Bs. ${datos.promedio_diario_egresos.toFixed(2)}`,
    );
    doc.moveDown();

    if (datos.pagos.length > 0 || datos.egresos.length > 0) {
      try {
        const graficos = await this.generarGraficoIngresosEgresos(datos);
        if (graficos.length > 0) {
          doc.font('Times-Bold');
          doc
            .fontSize(14)
            .text('Ingresos vs Egresos + Balance', { underline: true });
          doc.font('Times-Roman');
          doc.fontSize(10);
          doc.text('Real (sin eliminados) y Histórico (con eliminados)');
          doc.moveDown(0.5);
        }

        for (const grafico_buffer of graficos) {
          const posicion_y_actual = doc.y;
          if (posicion_y_actual > 520) {
            doc.addPage();
          }
          doc.image(grafico_buffer, {
            fit: [450, 230],
            align: 'center',
          });
          doc.moveDown(1.5);
        }
      } catch (error) {
        console.error('Error al generar gráfico de finanzas:', error);
      }
    }

    if (datos.pagos.length > 0) {
      doc.font('Times-Bold');
      doc.fontSize(14).text('Últimos Pagos:', { underline: true });
      doc.font('Times-Roman');
      doc.fontSize(10);
      datos.pagos.forEach((pago: any) => {
        const tc = pago.tasa_cambio ? ` (TC: ${pago.tasa_cambio})` : '';
        doc.text(
          `• ${this.formatearFechaLocal(pago.fecha)} - ${pago.paciente}: Bs. ${pago.monto.toFixed(2)} / $${pago.monto_usd.toFixed(2)}${tc}`,
        );
      });
    }

    if (datos.egresos.length > 0) {
      doc.moveDown();
      doc.font('Times-Bold');
      doc.fontSize(14).text('Últimos Egresos:', { underline: true });
      doc.font('Times-Roman');
      doc.fontSize(10);
      datos.egresos.forEach((egreso: any) => {
        const tc = egreso.tasa_cambio ? ` (TC: ${egreso.tasa_cambio})` : '';
        const tratamiento = egreso.plan_tratamiento_id
          ? ` - Tratamiento: ${egreso.tratamiento || '#' + egreso.plan_tratamiento_id}`
          : '';
        const paciente =
          egreso.plan_tratamiento_id && egreso.paciente
            ? ` (${egreso.paciente})`
            : '';
        doc.text(
          `• ${this.formatearFechaLocal(egreso.fecha)} - ${egreso.concepto}${tratamiento}${paciente}: Bs. ${egreso.monto.toFixed(2)} / $${egreso.monto_usd.toFixed(2)}${tc}`,
        );
      });
    }
  }

  private normalizarSeriePorFecha(
    por_fecha: Record<
      string,
      {
        ingresos: number;
        egresos: number;
        ingresos_usd?: number;
        egresos_usd?: number;
      }
    >,
  ): Array<{ key: string; ingresos: number; egresos: number }> {
    return Object.entries(por_fecha)
      .map(([key, v]) => ({
        key,
        ingresos: Number(v.ingresos || 0),
        egresos: Number(v.egresos || 0),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  private agruparSerieFinanzas(
    items: Array<{ key: string; ingresos: number; egresos: number }>,
    modo: 'dia' | 'mes',
  ): {
    labels: string[];
    ingresos: number[];
    egresos: number[];
    balance: number[];
  } {
    const map = new Map<string, { ingresos: number; egresos: number }>();

    for (const item of items) {
      const key = modo === 'mes' ? item.key.slice(0, 7) : item.key;
      if (!map.has(key)) map.set(key, { ingresos: 0, egresos: 0 });
      const acc = map.get(key)!;
      acc.ingresos += item.ingresos;
      acc.egresos += item.egresos;
    }

    const labels = Array.from(map.keys()).sort();
    const ingresos = labels.map((k) => map.get(k)!.ingresos);
    const egresos = labels.map((k) => map.get(k)!.egresos);
    const balance = labels.map((k, idx) => ingresos[idx] - egresos[idx]);
    return { labels, ingresos, egresos, balance };
  }

  private async generarGraficoIngresosEgresos(datos: any): Promise<Buffer[]> {
    const width = 1200;
    const height = 650;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: 'white',
    });

    const real_por_fecha =
      datos.analisis_temporal && datos.analisis_temporal.por_fecha
        ? datos.analisis_temporal.por_fecha
        : {};
    const historico_por_fecha =
      datos.analisis_temporal_historico &&
      datos.analisis_temporal_historico.por_fecha
        ? datos.analisis_temporal_historico.por_fecha
        : {};

    const serie_real = this.normalizarSeriePorFecha(real_por_fecha);
    const serie_historico = this.normalizarSeriePorFecha(historico_por_fecha);

    const modo_real: 'dia' | 'mes' = serie_real.length > 45 ? 'mes' : 'dia';
    const modo_historico: 'dia' | 'mes' =
      serie_historico.length > 45 ? 'mes' : 'dia';

    const real = this.agruparSerieFinanzas(serie_real, modo_real);
    const historico = this.agruparSerieFinanzas(
      serie_historico,
      modo_historico,
    );

    const crearConfig = (
      titulo: string,
      serie: {
        labels: string[];
        ingresos: number[];
        egresos: number[];
        balance: number[];
      },
      modo: 'dia' | 'mes',
    ) => {
      const labelEjeX = modo === 'mes' ? 'Mes' : 'Fecha';
      return {
        data: {
          labels: serie.labels,
          datasets: [
            {
              type: 'bar',
              label: 'Ingresos',
              data: serie.ingresos,
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2,
            },
            {
              type: 'bar',
              label: 'Egresos',
              data: serie.egresos,
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 2,
            },
            {
              type: 'line',
              label: 'Balance',
              data: serie.balance,
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderWidth: 3,
              pointRadius: 2,
              tension: 0.25,
            },
          ],
        },
        options: {
          responsive: false,
          devicePixelRatio: 2,
          plugins: {
            title: {
              display: true,
              text: titulo,
              font: { size: 24, weight: 'bold' },
              padding: 18,
            },
            legend: {
              position: 'bottom',
              labels: { font: { size: 14 }, padding: 16 },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value: any) {
                  return 'Bs. ' + Number(value).toFixed(0);
                },
                font: { size: 14 },
              },
            },
            x: {
              title: {
                display: true,
                text: labelEjeX,
                font: { size: 14, weight: 'bold' },
              },
              ticks: {
                font: { size: 12 },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: modo === 'mes' ? 12 : 15,
              },
            },
          },
        },
      };
    };

    const buffers: Buffer[] = [];
    if (real.labels.length > 0) {
      const config_real: any = {
        type: 'bar',
        ...crearConfig('Finanzas (Real - sin eliminados)', real, modo_real),
      };
      buffers.push(await chartJSNodeCanvas.renderToBuffer(config_real));
    }
    if (historico.labels.length > 0) {
      const config_hist: any = {
        type: 'bar',
        ...crearConfig(
          'Finanzas (Histórico - con eliminados)',
          historico,
          modo_historico,
        ),
      };
      buffers.push(await chartJSNodeCanvas.renderToBuffer(config_hist));
    }

    return buffers;
  }

  private async agregarSeccionAgenda(
    doc: PDFDocumentType,
    datos: any,
    analisis: string,
  ): Promise<void> {
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    } else {
      doc.moveDown(2);
    }
    doc.font('Times-Bold');
    doc.fontSize(16).text('Agenda', { underline: true });
    doc.moveDown();

    if (analisis) {
      this.agregarTextoMarkdown(doc, analisis);
      doc.moveDown();
    }

    doc.font('Times-Roman');
    doc.fontSize(12);
    doc.text(`Total de citas: ${datos.total_citas}`);
    doc.moveDown();
    if (datos.citas_por_estado && datos.total_citas > 0) {
      try {
        const grafico_buffer = await this.generarGraficoCitasPorEstado(
          datos.citas_por_estado,
        );
        const posicion_y_actual = doc.y;
        if (posicion_y_actual > 450) {
          doc.addPage();
        }

        doc.image(grafico_buffer, {
          fit: [400, 300],
          align: 'center',
        });
        doc.moveDown(2);
      } catch (error) {
        console.error('Error al generar gráfico de citas:', error);
      }
    }

    doc.font('Times-Bold');
    doc.fontSize(14).text('Citas por estado:');
    doc.font('Times-Roman');
    doc.fontSize(11);
    doc.text(`• Pendientes: ${datos.citas_por_estado.pendiente}`);
    doc.text(`• Pagadas: ${datos.citas_por_estado.pagado}`);
    doc.text(`• Canceladas: ${datos.citas_por_estado.cancelado}`);
    doc.text(`• Sin paciente: ${datos.citas_por_estado.sin_paciente}`);
    doc.moveDown();

    if (datos.proximas_citas.length > 0) {
      doc.font('Times-Bold');
      doc.fontSize(14).text('Próximas Citas:', { underline: true });
      doc.font('Times-Roman');
      doc.fontSize(10);
      datos.proximas_citas.forEach((cita: any) => {
        doc.text(
          `• ${this.formatearFechaLocal(cita.fecha)} - ${cita.paciente}`,
        );
      });
    }
  }

  private async generarGraficoCitasPorEstado(
    citas_por_estado: any,
  ): Promise<Buffer> {
    const width = 800;
    const height = 600;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: 'white',
    });

    const total_citas =
      (citas_por_estado.pendiente || 0) +
      (citas_por_estado.pagado || 0) +
      (citas_por_estado.cancelado || 0) +
      (citas_por_estado.sin_paciente || 0);

    const configuration: any = {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'Pagadas', 'Canceladas', 'Sin Paciente'],
        datasets: [
          {
            data: [
              citas_por_estado.pendiente || 0,
              citas_por_estado.pagado || 0,
              citas_por_estado.cancelado || 0,
              citas_por_estado.sin_paciente || 0,
            ],
            backgroundColor: [
              'rgba(234, 179, 8, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(156, 163, 175, 0.8)',
            ],
            borderColor: [
              'rgba(234, 179, 8, 1)',
              'rgba(34, 197, 94, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(156, 163, 175, 1)',
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: false,
        devicePixelRatio: 2,
        plugins: {
          title: {
            display: true,
            text: 'Distribución de Citas por Estado',
            font: { size: 24, weight: 'bold' },
            padding: 20,
          },
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 16 },
              padding: 20,
              generateLabels: function (chart: any) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map(function (label: string, i: number) {
                    const value = data.datasets[0].data[i];
                    const percentage =
                      total_citas > 0
                        ? ((value / total_citas) * 100).toFixed(2)
                        : '0.00';
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      hidden: false,
                      index: i,
                    };
                  });
                }
                return [];
              },
            },
          },
        },
      },
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
  }

  private async agregarSeccionTratamientos(
    doc: PDFDocumentType,
    datos: any,
    analisis: string,
  ): Promise<void> {
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    } else {
      doc.moveDown(2);
    }
    doc.font('Times-Bold');
    doc.fontSize(16).text('Tratamientos', { underline: true });
    doc.moveDown();

    if (analisis) {
      this.agregarTextoMarkdown(doc, analisis);
      doc.moveDown();
    }

    doc.font('Times-Roman');
    doc.fontSize(12);
    doc.text(`Total de planes: ${datos.total_planes}`);
    doc.text(`Planes activos: ${datos.planes_activos}`);
    doc.text(`Planes finalizados: ${datos.planes_finalizados}`);
    doc.text(`Total por cobrar: Bs. ${datos.total_por_cobrar.toFixed(2)}`);
    doc.moveDown();

    if (
      datos.tratamientos_mas_comunes &&
      datos.tratamientos_mas_comunes.length > 0
    ) {
      try {
        const grafico_buffer = await this.generarGraficoTratamientos(
          datos.tratamientos_mas_comunes,
        );
        const posicion_y_actual = doc.y;
        if (posicion_y_actual > 450) {
          doc.addPage();
        }

        doc.image(grafico_buffer, {
          fit: [450, 300],
          align: 'center',
        });
        doc.moveDown(2);
      } catch (error) {
        console.error('Error al generar gráfico de tratamientos:', error);
      }

      doc.font('Times-Bold');
      doc.fontSize(14).text('Tratamientos más comunes:', { underline: true });
      doc.font('Times-Roman');
      doc.fontSize(11);
      datos.tratamientos_mas_comunes.forEach((t: any) => {
        doc.text(`• ${t.nombre}: ${t.cantidad} veces`);
      });
    }

    if (
      datos.egresos_por_tratamiento &&
      Array.isArray(datos.egresos_por_tratamiento) &&
      datos.egresos_por_tratamiento.length > 0
    ) {
      doc.moveDown();
      doc.font('Times-Bold');
      doc
        .fontSize(14)
        .text('Egresos asociados a tratamientos:', { underline: true });
      doc.font('Times-Roman');
      doc.fontSize(11);
      doc.moveDown(0.3);

      const filas = datos.egresos_por_tratamiento as Array<any>;
      const tableLines: string[] = [];
      tableLines.push(
        '| Tratamiento | Paciente | Plan | # Egresos | Total Bs. | Total USD | Eliminados |',
      );
      tableLines.push('|---|---|---:|---:|---:|---:|---:|');
      for (const item of filas) {
        const plan = `#${item.plan_id}`;
        const cant = Number(item.cantidad || 0);
        const bs = Number(item.monto_total || 0).toFixed(2);
        const usd = Number(item.monto_total_usd || 0).toFixed(2);
        const elim = Number(item.cantidad_eliminados || 0);
        const tratamiento = (item.tratamiento || 'Sin tratamiento')
          .toString()
          .replace(/\|/g, '/');
        const paciente = (item.paciente || 'Sin paciente')
          .toString()
          .replace(/\|/g, '/');
        tableLines.push(
          `| ${tratamiento} | ${paciente} | ${plan} | ${cant} | ${bs} | ${usd} | ${elim} |`,
        );
      }
      this.procesarTablaMarkdown(doc, tableLines);
    }
  }

  private async generarGraficoTratamientos(
    tratamientos: any[],
  ): Promise<Buffer> {
    const width = 1000;
    const height = 600;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: 'white',
    });
    const top_tratamientos = tratamientos.slice(0, 10);
    const labels = top_tratamientos.map((t) => t.nombre);
    const datos = top_tratamientos.map((t) => t.cantidad);

    const configuration: any = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Cantidad de veces',
            data: datos,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: false,
        devicePixelRatio: 2,
        plugins: {
          title: {
            display: true,
            text: 'Tratamientos Más Comunes',
            font: { size: 24, weight: 'bold' },
            padding: 20,
          },
          legend: { display: false },
          datalabels: {
            display: true,
            color: '#000',
            anchor: 'end',
            align: 'right',
            font: { weight: 'bold', size: 14 },
            formatter: function (value: number) {
              return value.toString();
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 14 },
            },
          },
          y: {
            ticks: { font: { size: 14 } },
          },
        },
      },
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
  }

  private async agregarSeccionInventario(
    doc: PDFDocumentType,
    datos: any,
    analisis: string,
  ): Promise<void> {
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    } else {
      doc.moveDown(2);
    }
    doc.font('Times-Bold');
    doc.fontSize(16).text('Inventario', { underline: true });
    doc.moveDown();

    if (analisis) {
      this.agregarTextoMarkdown(doc, analisis);
      doc.moveDown();
    }

    doc.font('Times-Roman');
    doc.fontSize(12);
    doc.text(`Total de inventarios: ${datos.total_inventarios}`);
    doc.text(`Total de productos: ${datos.total_productos}`);
    doc.text(`Productos con stock bajo: ${datos.productos_bajo_stock}`);
    doc.moveDown();

    if (
      datos.activos_por_estado &&
      Object.keys(datos.activos_por_estado).length > 0
    ) {
      try {
        const grafico_buffer = await this.generarGraficoInventario(
          datos.activos_por_estado,
        );
        const posicion_y_actual = doc.y;
        if (posicion_y_actual > 450) {
          doc.addPage();
        }

        doc.image(grafico_buffer, {
          fit: [400, 300],
          align: 'center',
        });
        doc.moveDown(2);
      } catch (error) {
        console.error('Error al generar gráfico de inventario:', error);
      }
    }

    if (datos.alertas.length > 0) {
      doc.fillColor('red');
      doc.font('Times-Bold');
      doc.fontSize(14).text('Alertas de Stock Bajo:', { underline: true });
      doc.fillColor('black');
      doc.font('Times-Roman');
      doc.fontSize(10);

      doc.moveDown(0.5);
      const startX = doc.page.margins.left;
      let currentY = doc.y;

      doc.font('Times-Bold');
      doc.text('Producto', startX, currentY);
      doc.text('Stock Actual', startX + 250, currentY);
      doc.text('Mínimo', startX + 350, currentY);
      doc.text('Estado', startX + 450, currentY);

      doc
        .moveTo(startX, currentY + 15)
        .lineTo(doc.page.width - doc.page.margins.right, currentY + 15)
        .stroke();
      currentY += 20;
      doc.font('Times-Roman');

      datos.alertas.forEach((alerta: any) => {
        const maxY = doc.page.height - doc.page.margins.bottom - 40;
        if (currentY > maxY) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        doc.text(alerta.nombre, startX, currentY);
        doc.text(alerta.stock_actual.toString(), startX + 250, currentY);
        doc.text(alerta.stock_minimo.toString(), startX + 350, currentY);
        doc.fillColor('red');
        doc.text('BAJO', startX + 450, currentY);
        doc.fillColor('black');
        currentY += 15;
      });
      doc.y = currentY + 10;
      doc.x = doc.page.margins.left;
    }

    if (datos.movimientos) {
      doc.font('Times-Bold');
      doc.fontSize(14).text('Resumen de Movimientos:', { underline: true });
      doc.font('Times-Roman');
      doc.fontSize(11);
      doc.moveDown(0.5);

      doc.text(`• Total Movimientos: ${datos.movimientos.total_movimientos}`);
      doc.text(
        `• Entradas: ${datos.movimientos.entradas.cantidad} unidades (Bs. ${datos.movimientos.entradas.monto.toFixed(2)})`,
      );
      doc.text(
        `• Salidas: ${datos.movimientos.salidas.cantidad} unidades (Bs. ${datos.movimientos.salidas.monto.toFixed(2)})`,
      );
    }
  }

  private async generarGraficoInventario(
    activos_por_estado: any,
  ): Promise<Buffer> {
    const width = 600;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: 'white',
    });

    const labels = Object.keys(activos_por_estado);
    const data = Object.values(activos_por_estado);

    const configuration: any = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(234, 179, 8, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(156, 163, 175, 0.7)',
            ],
            borderColor: [
              'rgba(34, 197, 94, 1)',
              'rgba(234, 179, 8, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(156, 163, 175, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Estado de Activos',
            font: { size: 16 },
          },
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 } },
          },
          datalabels: {
            display: true,
            color: '#000',
            font: { weight: 'bold', size: 14 },
            formatter: function (value: number, ctx: any) {
              let sum = 0;
              const dataArr = ctx.chart.data.datasets[0].data;
              dataArr.map((data: number) => {
                sum += data;
              });
              const percentage = ((value * 100) / sum).toFixed(1) + '%';
              return percentage;
            },
          },
        },
      },
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
  }

  async generarYGuardarReporte(usuario_id: number, dto: GenerarReporteDto) {
    let fecha_inicio = new Date(0);
    if (dto.fecha_inicio) {
      const [year, month, day] = dto.fecha_inicio
        .toString()
        .split('-')
        .map(Number);
      fecha_inicio = new Date(year, month - 1, day);
    }

    let fecha_fin = new Date();
    if (dto.fecha_fin) {
      const [year, month, day] = dto.fecha_fin
        .toString()
        .split('-')
        .map(Number);
      fecha_fin = new Date(year, month - 1, day);
    }
    fecha_fin.setHours(23, 59, 59, 999);

    const usuario = await this.usuario_repositorio.findOne({
      where: { id: usuario_id },
    });
    const config_clinica = await this.configuracion_clinica_repositorio.findOne(
      { where: { usuario: { id: usuario_id } } },
    );

    const datos_reporte: any = {
      fecha_generacion: new Date(),
      periodo: {
        inicio: fecha_inicio,
        fin: fecha_fin,
      },
      metadatos: {
        nombre_usuario: usuario ? usuario.nombre : 'Usuario',
        nombre_clinica: config_clinica?.nombre_clinica || 'Clínica Dental',
        pais: usuario?.pais || 'Desconocido',
        moneda: usuario?.moneda || 'Bs.',
      },
      areas: {},
    };

    for (const area of dto.areas) {
      switch (area) {
        case AreaReporte.FINANZAS:
          datos_reporte.areas.finanzas = await this.obtenerDatosFinanzas(
            usuario_id,
            fecha_inicio,
            fecha_fin,
          );
          break;
        case AreaReporte.AGENDA:
          datos_reporte.areas.agenda = await this.obtenerDatosAgenda(
            usuario_id,
            fecha_inicio,
            fecha_fin,
          );
          break;
        case AreaReporte.TRATAMIENTOS:
          datos_reporte.areas.tratamientos =
            await this.obtenerDatosTratamientos(
              usuario_id,
              fecha_inicio,
              fecha_fin,
            );
          break;
        case AreaReporte.INVENTARIO:
          datos_reporte.areas.inventario = await this.obtenerDatosInventario(
            usuario_id,
            fecha_inicio,
            fecha_fin,
          );
          break;
      }
    }

    const incluir_sugerencias = dto.incluir_sugerencias !== false;
    const texto_gemini = await this.generarTextoConGemini(
      usuario_id,
      datos_reporte,
      dto.areas,
      incluir_sugerencias,
    );
    const pdf_buffer = await this.generarPDF(datos_reporte, texto_gemini);
    const timestamp = Date.now();
    const nombre_archivo = `reporte-${usuario_id}-${timestamp}`;
    const nombre_archivo_guardado =
      await this.almacenamiento_servicio.guardarArchivoDesdeBuffer(
        pdf_buffer,
        'pdf',
        TipoDocumento.REPORTE,
        nombre_archivo,
      );
    const reporte = new Reporte();
    const fecha_actual = new Date();
    const fecha_formateada = `${fecha_actual.getDate().toString().padStart(2, '0')}/${(fecha_actual.getMonth() + 1).toString().padStart(2, '0')}/${fecha_actual.getFullYear()}`;
    reporte.nombre = `Reporte ${fecha_formateada}`;
    reporte.areas = JSON.stringify(dto.areas);
    if (dto.fecha_inicio) {
      const [year, month, day] = dto.fecha_inicio
        .toString()
        .split('-')
        .map(Number);
      reporte.fecha_inicio = new Date(year, month - 1, day);
    }
    if (dto.fecha_fin) {
      const [year, month, day] = dto.fecha_fin
        .toString()
        .split('-')
        .map(Number);
      reporte.fecha_fin = new Date(year, month - 1, day);
    }
    reporte.ruta_archivo = nombre_archivo_guardado;

    reporte.analisis_gemini =
      typeof texto_gemini === 'object'
        ? texto_gemini.resumen + '\n\n' + texto_gemini.conclusiones
        : texto_gemini;

    reporte.usuario = { id: usuario_id } as any;

    await this.reporte_repositorio.save(reporte);

    return {
      id: reporte.id,
      nombre: reporte.nombre,
      areas: JSON.parse(reporte.areas),
      fecha_inicio: reporte.fecha_inicio,
      fecha_fin: reporte.fecha_fin,
      fecha_creacion: reporte.fecha_creacion,
      analisis_gemini: reporte.analisis_gemini,
    };
  }

  async obtenerReportesUsuario(usuario_id: number) {
    const reportes = await this.reporte_repositorio.find({
      where: { usuario: { id: usuario_id } },
      order: { fecha_creacion: 'DESC' },
    });

    return reportes.map((r) => {
      return {
        id: r.id,
        nombre: r.nombre,
        areas: JSON.parse(r.areas),
        fecha_inicio: r.fecha_inicio,
        fecha_fin: r.fecha_fin,
        fecha_creacion: r.fecha_creacion,
        analisis_gemini: r.analisis_gemini,
      };
    });
  }

  async obtenerArchivoReporte(usuario_id: number, reporte_id: number) {
    const reporte = await this.reporte_repositorio.findOne({
      where: { id: reporte_id, usuario: { id: usuario_id } },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    const archivo = await this.almacenamiento_servicio.obtenerStreamArchivo(
      reporte.ruta_archivo,
      TipoDocumento.REPORTE,
    );
    return { archivo, nombre: reporte.nombre };
  }

  async eliminarReporte(usuario_id: number, reporte_id: number) {
    const reporte = await this.reporte_repositorio.findOne({
      where: { id: reporte_id, usuario: { id: usuario_id } },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }
    await this.almacenamiento_servicio.eliminarArchivo(
      reporte.ruta_archivo,
      TipoDocumento.REPORTE,
    );
    await this.reporte_repositorio.remove(reporte);
  }
}
