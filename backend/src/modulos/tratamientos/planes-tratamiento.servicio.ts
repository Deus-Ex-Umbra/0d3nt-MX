import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  PlanTratamiento,
  EstadoPlanTratamiento,
} from './entidades/plan-tratamiento.entidad';
import {
  MaterialPlantilla,
  TipoMaterialPlantilla,
} from './entidades/material-plantilla.entidad';
import { AsignarPlanTratamientoDto } from './dto/asignar-plan-tratamiento.dto';
import { PacientesServicio } from '../pacientes/pacientes.servicio';
import { TratamientosServicio } from './tratamientos.servicio';
import { AgendaServicio } from '../agenda/agenda.servicio';
import { Cita } from '../agenda/entidades/cita.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import {
  MaterialTratamiento,
  TipoMaterialTratamiento,
} from '../inventario/entidades/material-tratamiento.entidad';
import { MaterialCita } from '../inventario/entidades/material-cita.entidad';
import { Material } from '../inventario/entidades/material.entidad';
import { KardexServicio } from '../inventario/kardex.servicio';
import { TipoMovimientoKardex } from '../inventario/entidades/kardex.entidad';
import { ConfiguracionClinica } from '../catalogo/entidades/configuracion-clinica.entidad';

@Injectable()
export class PlanesTratamientoServicio {
  constructor(
    @InjectRepository(PlanTratamiento)
    private readonly plan_repositorio: Repository<PlanTratamiento>,
    @InjectRepository(MaterialPlantilla)
    private readonly material_plantilla_repositorio: Repository<MaterialPlantilla>,
    @InjectRepository(MaterialTratamiento)
    private readonly material_tratamiento_repositorio: Repository<MaterialTratamiento>,
    @InjectRepository(MaterialCita)
    private readonly material_cita_repositorio: Repository<MaterialCita>,
    @InjectRepository(Material)
    private readonly material_repositorio: Repository<Material>,
    @InjectRepository(Cita)
    private readonly cita_repositorio: Repository<Cita>,
    @InjectRepository(ConfiguracionClinica)
    private readonly configuracion_clinica_repositorio: Repository<ConfiguracionClinica>,
    private readonly pacientes_servicio: PacientesServicio,
    private readonly tratamientos_servicio: TratamientosServicio,
    @Inject(forwardRef(() => AgendaServicio))
    private readonly agenda_servicio: AgendaServicio,
    private readonly kardex_servicio: KardexServicio,
  ) {}

  private async obtenerCambioDolarActual(usuario_id: number): Promise<number> {
    const config = await this.configuracion_clinica_repositorio.findOne({
      where: { usuario_id },
    });
    const tasa = Number((config as any)?.cambio_dolar);
    if (!tasa || isNaN(tasa) || tasa <= 0) return 1;
    return tasa;
  }

  private asegurarPlanEditable(plan: PlanTratamiento): void {
    if (plan.paciente_eliminado) {
      throw new BadRequestException(
        'No se puede modificar ni reactivar este plan porque el paciente fue eliminado.\n' +
          'Las citas y tratamientos del paciente eliminado quedan en solo lectura por consistencia.',
      );
    }
  }

  private parsearFechaInicio(
    fecha_str: string,
    hora_str: string,
    fecha_iso?: string,
  ): Date {
    if (fecha_iso) {
      const d = new Date(fecha_iso);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const [anio, mes, dia] = fecha_str.split('-').map(Number);
    const [horas, minutos] = hora_str.split(':').map(Number);
    const fechaLocal = new Date(anio, mes - 1, dia, horas, minutos, 0, 0);
    return fechaLocal;
  }

  async asignarPlan(
    usuario_id: number,
    asignar_plan_dto: AsignarPlanTratamientoDto,
  ): Promise<PlanTratamiento> {
    const { paciente_id, tratamiento_id, fecha_inicio, hora_inicio } =
      asignar_plan_dto;
    const paciente = await this.pacientes_servicio.encontrarPorId(
      usuario_id,
      paciente_id,
    );
    const tratamiento_plantilla =
      await this.tratamientos_servicio.encontrarPorId(
        usuario_id,
        tratamiento_id,
      );

    const fecha_actual = this.parsearFechaInicio(
      fecha_inicio,
      hora_inicio,
      asignar_plan_dto.fecha_inicio_iso,
    );

    const intervalo_dias = tratamiento_plantilla.intervalo_dias || 0;
    const intervalo_semanas = tratamiento_plantilla.intervalo_semanas || 0;
    const intervalo_meses = tratamiento_plantilla.intervalo_meses || 0;
    const horas_citas = tratamiento_plantilla.horas_aproximadas_citas || 0;
    const minutos_citas = tratamiento_plantilla.minutos_aproximados_citas ?? 30;

    if (
      tratamiento_plantilla.numero_citas > 1 &&
      intervalo_dias === 0 &&
      intervalo_semanas === 0 &&
      intervalo_meses === 0
    ) {
      throw new BadRequestException(
        'No se puede asignar el plan: los intervalos entre citas (días, semanas, meses) no pueden ser todos 0. Ajusta la plantilla antes de asignarla.',
      );
    }

    const fechas_citas: Date[] = [];
    for (let i = 0; i < tratamiento_plantilla.numero_citas; i++) {
      const fecha_cita = new Date(fecha_actual);

      if (i > 0) {
        fecha_cita.setMonth(fecha_cita.getMonth() + i * intervalo_meses);
        fecha_cita.setDate(fecha_cita.getDate() + i * intervalo_semanas * 7);
        fecha_cita.setDate(fecha_cita.getDate() + i * intervalo_dias);
      }

      fechas_citas.push(fecha_cita);
    }

    const conflictos: Array<{
      fecha: Date;
      citas_conflicto: Cita[];
      detalles?: any;
    }> = [];

    for (const fecha of fechas_citas) {
      const validacion = await this.agenda_servicio.validarDisponibilidad(
        usuario_id,
        fecha,
        horas_citas,
        minutos_citas,
      );
      if (!validacion.disponible) {
        conflictos.push({
          fecha,
          citas_conflicto: validacion.citas_conflicto,
          detalles: validacion.detalles,
        });
      }
    }

    if (conflictos.length > 0) {
      throw new ConflictException({
        message:
          'No se puede asignar el plan de tratamiento debido a conflictos de horario.',
        code: 'PLANES_TRATAMIENTO_CONFLICTO',
        detalles: {
          tipo: 'PLANES_TRATAMIENTO_CONFLICTO',
          conflictos: conflictos.map((c) => ({
            fecha: new Date(c.fecha).toISOString(),
            detalles: c.detalles,
            citas: (c.citas_conflicto || []).map((cita) => ({
              id: (cita as any)?.id ?? null,
              descripcion: cita.paciente
                ? `${cita.paciente.nombre} ${cita.paciente.apellidos} - ${cita.descripcion}`
                : cita.descripcion,
            })),
          })),
        },
      });
    }

    let plan_guardado: PlanTratamiento | null = null;
    try {
      const cambio_dolar_actual =
        await this.obtenerCambioDolarActual(usuario_id);
      const costo_local = Number(tratamiento_plantilla.costo_total) || 0;
      const costo_usd_snapshot = Number(
        (costo_local / cambio_dolar_actual).toFixed(2),
      );

      const nuevo_plan = this.plan_repositorio.create({
        paciente,
        tratamiento: tratamiento_plantilla,
        costo_total: costo_local,
        costo_total_usd: costo_usd_snapshot,
        total_abonado: 0,
        total_abonado_usd: 0,
        auto_completar_al_100:
          (tratamiento_plantilla as any)?.auto_completar_al_100 !== false,
        usuario: { id: usuario_id } as Usuario,
      });

      plan_guardado = await this.plan_repositorio.save(nuevo_plan);

      const materiales_plantilla =
        await this.material_plantilla_repositorio.find({
          where: { tratamiento: { id: tratamiento_id } },
          relations: ['producto'],
        });
      const materiales_validos = materiales_plantilla.filter((m) => m.producto);
      const materiales_generales = materiales_validos.filter(
        (m) => m.tipo === TipoMaterialPlantilla.GENERAL,
      );

      for (const material of materiales_generales) {
        const material_tratamiento =
          this.material_tratamiento_repositorio.create({
            plan_tratamiento: plan_guardado,
            producto: material.producto,
            tipo: TipoMaterialTratamiento.UNICO,
            cantidad_planeada: material.cantidad,
            confirmado: false,
            momento_confirmacion: material.momento_confirmacion,
          });
        await this.material_tratamiento_repositorio.save(material_tratamiento);
      }

      const materiales_por_cita = materiales_validos.filter(
        (m) => m.tipo === TipoMaterialPlantilla.POR_CITA,
      );
      for (let i = 0; i < tratamiento_plantilla.numero_citas; i++) {
        const consumibles_cita: { material_id: number; cantidad: number }[] =
          [];
        for (const mat_plantilla of materiales_por_cita) {
          const materiales_disponibles = await this.material_repositorio.find({
            where: {
              producto: { id: mat_plantilla.producto.id },
              activo: true,
            },
            order: { fecha_vencimiento: 'ASC' },
          });

          if (materiales_disponibles.length > 0) {
            consumibles_cita.push({
              material_id: materiales_disponibles[0].id,
              cantidad: Number(mat_plantilla.cantidad),
            });
          }
        }

        await this.agenda_servicio.crear(usuario_id, {
          paciente_id: paciente.id,
          plan_tratamiento_id: plan_guardado.id,
          fecha: fechas_citas[i],
          descripcion: `${tratamiento_plantilla.nombre} - Cita ${i + 1}`,
          estado_pago: 'pendiente',
          horas_aproximadas: horas_citas,
          minutos_aproximados: minutos_citas,
          consumibles: consumibles_cita,
        });
      }

      return this.encontrarPlanPorId(usuario_id, plan_guardado.id);
    } catch (error) {
      if (plan_guardado?.id) {
        try {
          await this.plan_repositorio.delete(plan_guardado.id);
        } catch (cleanupError) {}
      }
      throw error;
    }
  }

  async obtenerTodos(usuario_id: number): Promise<PlanTratamiento[]> {
    return this.plan_repositorio
      .createQueryBuilder('plan')
      .innerJoin('plan.usuario', 'usuario')
      .leftJoinAndSelect('plan.paciente', 'paciente')
      .leftJoinAndSelect('plan.tratamiento', 'tratamiento')
      .leftJoinAndSelect('plan.citas', 'citas')
      .leftJoinAndSelect('plan.pagos', 'pagos')
      .leftJoinAndSelect('plan.egresos', 'egresos')
      .withDeleted()
      .where('usuario.id = :usuario_id', { usuario_id })
      .andWhere('plan.eliminado_en IS NULL')
      .orderBy('plan.id', 'DESC')
      .getMany();
  }

  async encontrarPlanPorId(
    usuario_id: number,
    id: number,
  ): Promise<PlanTratamiento> {
    const plan = await this.plan_repositorio
      .createQueryBuilder('plan')
      .innerJoin('plan.usuario', 'usuario')
      .leftJoinAndSelect('plan.paciente', 'paciente')
      .leftJoinAndSelect('plan.tratamiento', 'tratamiento')
      .leftJoinAndSelect('plan.citas', 'citas')
      .leftJoinAndSelect('plan.pagos', 'pagos')
      .leftJoinAndSelect('plan.egresos', 'egresos')
      .withDeleted()
      .where('plan.id = :id', { id })
      .andWhere('usuario.id = :usuario_id', { usuario_id })
      .andWhere('plan.eliminado_en IS NULL')
      .getOne();
    if (!plan) {
      throw new NotFoundException(
        `Plan de tratamiento con ID "${id}" no encontrado o no le pertenece.`,
      );
    }
    return plan;
  }

  async obtenerPlanesPorPaciente(
    usuario_id: number,
    paciente_id: number,
  ): Promise<PlanTratamiento[]> {
    return this.plan_repositorio
      .createQueryBuilder('plan')
      .innerJoin('plan.usuario', 'usuario')
      .leftJoinAndSelect('plan.paciente', 'paciente')
      .leftJoinAndSelect('plan.tratamiento', 'tratamiento')
      .leftJoinAndSelect('plan.citas', 'citas')
      .leftJoinAndSelect('plan.pagos', 'pagos')
      .leftJoinAndSelect('plan.egresos', 'egresos')
      .withDeleted()
      .where('usuario.id = :usuario_id', { usuario_id })
      .andWhere('plan.eliminado_en IS NULL')
      .andWhere('paciente.id = :paciente_id', { paciente_id })
      .orderBy('plan.id', 'DESC')
      .getMany();
  }

  async registrarAbono(
    usuario_id: number,
    plan_id: number,
    monto: number,
    monto_usd?: number,
  ): Promise<PlanTratamiento> {
    const plan = await this.encontrarPlanPorId(usuario_id, plan_id);
    this.asegurarPlanEditable(plan);
    plan.total_abonado = Number(plan.total_abonado) + Number(monto);
    if (monto_usd) {
      plan.total_abonado_usd =
        Number(plan.total_abonado_usd) + Number(monto_usd);
    }
    const auto_completar = (plan as any)?.auto_completar_al_100 !== false;
    if (
      auto_completar &&
      plan.total_abonado >= plan.costo_total &&
      plan.estado === EstadoPlanTratamiento.PENDIENTE
    ) {
      plan.estado = EstadoPlanTratamiento.COMPLETADO;
    }

    return this.plan_repositorio.save(plan);
  }

  async descontarAbono(
    usuario_id: number,
    plan_id: number,
    monto: number,
    monto_usd?: number,
  ): Promise<PlanTratamiento> {
    const plan = await this.encontrarPlanPorId(usuario_id, plan_id);
    this.asegurarPlanEditable(plan);
    plan.total_abonado = Math.max(
      0,
      Number(plan.total_abonado) - Number(monto),
    );
    if (monto_usd) {
      plan.total_abonado_usd = Math.max(
        0,
        Number(plan.total_abonado_usd) - Number(monto_usd),
      );
    }

    const auto_completar = (plan as any)?.auto_completar_al_100 !== false;
    if (
      auto_completar &&
      plan.estado === EstadoPlanTratamiento.COMPLETADO &&
      plan.total_abonado < plan.costo_total
    ) {
      plan.estado = EstadoPlanTratamiento.PENDIENTE;
    }
    return this.plan_repositorio.save(plan);
  }

  async eliminarPlan(
    usuario_id: number,
    id: number,
    citas?: string,
  ): Promise<void> {
    const plan = await this.plan_repositorio.findOne({
      where: { id, usuario: { id: usuario_id } },
      relations: ['citas'],
    });

    if (!plan) {
      throw new NotFoundException(
        `Plan de tratamiento con ID "${id}" no encontrado o no le pertenece.`,
      );
    }

    const accion_citas = (citas || 'borrar').toLowerCase();
    if (accion_citas !== 'borrar' && accion_citas !== 'mantener') {
      throw new BadRequestException(
        'Parámetro inválido "citas". Usa "borrar" o "mantener".',
      );
    }

    if (accion_citas === 'borrar') {
      for (const cita of plan.citas || []) {
        await this.agenda_servicio.eliminar(usuario_id, cita.id);
      }
    } else {
      for (const cita of plan.citas || []) {
        await this.cita_repositorio.update(
          { id: cita.id, usuario: { id: usuario_id } },
          { plan_tratamiento: null },
        );
      }
    }

    await this.plan_repositorio.softRemove(plan);
  }

  async obtenerMaterialesPlanTratamiento(
    usuario_id: number,
    plan_id: number,
  ): Promise<any> {
    const plan = await this.encontrarPlanPorId(usuario_id, plan_id);

    const materiales = await this.material_tratamiento_repositorio
      .createQueryBuilder('mt')
      .leftJoinAndSelect('mt.producto', 'producto')
      .leftJoinAndSelect('producto.inventario', 'inventario')
      .where('mt.plan_tratamientoId = :plan_id', { plan_id })
      .withDeleted()
      .getMany();

    return {
      materiales: materiales.map((material) => ({
        id: material.id,
        producto_id: material.producto?.id,
        inventario_id: material.producto?.inventario?.id,
        inventario_nombre:
          material.producto?.inventario?.nombre || 'Inventario Eliminado',
        producto_nombre: material.producto?.nombre || 'Producto Eliminado',
        cantidad_planeada: material.cantidad_planeada,
        cantidad_usada: material.cantidad_usada,
        confirmado: material.confirmado,
        momento_confirmacion: material.momento_confirmacion,
      })),
    };
  }

  async confirmarConsumiblesGenerales(
    usuario_id: number,
    plan_id: number,
  ): Promise<void> {
    const plan = await this.encontrarPlanPorId(usuario_id, plan_id);
    this.asegurarPlanEditable(plan);

    const materiales = await this.material_tratamiento_repositorio.find({
      where: {
        plan_tratamiento: { id: plan_id },
        confirmado: false,
      },
      relations: ['producto', 'producto.inventario', 'producto.materiales'],
    });

    for (const material_tratamiento of materiales) {
      if (!material_tratamiento.producto) continue;
      const cantidad_requerida = Number(material_tratamiento.cantidad_planeada);
      const materiales_fisicos = (
        material_tratamiento.producto.materiales || []
      )
        .filter((m: Material) => m.activo && Number(m.cantidad_actual) > 0)
        .sort((a: Material, b: Material) => {
          if (a.fecha_vencimiento && b.fecha_vencimiento) {
            return (
              new Date(a.fecha_vencimiento).getTime() -
              new Date(b.fecha_vencimiento).getTime()
            );
          }
          return 0;
        });

      let cantidad_restante = cantidad_requerida;

      for (const material_fisico of materiales_fisicos) {
        if (cantidad_restante <= 0) break;

        const disponible =
          Number(material_fisico.cantidad_actual) -
          Number(material_fisico.cantidad_reservada || 0);
        const a_descontar = Math.min(cantidad_restante, disponible);

        if (a_descontar > 0) {
          const stock_anterior = Number(material_fisico.cantidad_actual);
          const stock_nuevo = stock_anterior - a_descontar;
          await this.kardex_servicio.registrarSalida(
            material_tratamiento.producto.inventario,
            material_tratamiento.producto,
            TipoMovimientoKardex.CONSUMO_TRATAMIENTO,
            a_descontar,
            stock_anterior,
            stock_nuevo,
            usuario_id,
            {
              material: material_fisico,
              referencia_tipo: 'plan_tratamiento',
              referencia_id: plan_id,
              observaciones: `Consumible general confirmado para tratamiento #${plan_id}`,
            },
          );
          material_fisico.cantidad_actual = stock_nuevo;
          await this.material_repositorio.save(material_fisico);

          cantidad_restante -= a_descontar;
        }
      }
      material_tratamiento.confirmado = true;
      material_tratamiento.cantidad_usada =
        cantidad_requerida - cantidad_restante;
      await this.material_tratamiento_repositorio.save(material_tratamiento);
    }
  }

  async esPrimeraCita(
    plan_tratamiento_id: number,
    cita_id: number,
  ): Promise<boolean> {
    const citas = await this.plan_repositorio
      .createQueryBuilder('plan')
      .innerJoinAndSelect('plan.citas', 'cita')
      .where('plan.id = :plan_tratamiento_id', { plan_tratamiento_id })
      .andWhere('cita.materiales_confirmados = true')
      .andWhere('cita.eliminado_en IS NULL')
      .getOne();
    return !citas || citas.citas.length === 0;
  }

  async cambiarEstadoPlan(
    usuario_id: number,
    plan_id: number,
    nuevo_estado: EstadoPlanTratamiento,
  ): Promise<PlanTratamiento> {
    const plan = await this.encontrarPlanPorId(usuario_id, plan_id);
    this.asegurarPlanEditable(plan);

    const estado_anterior = plan.estado;
    if (estado_anterior === nuevo_estado) {
      return plan;
    }
    if (nuevo_estado === EstadoPlanTratamiento.CANCELADO) {
      for (const cita of plan.citas) {
        if (cita.estado_pago === 'pendiente' && !cita.eliminado_en) {
          try {
            await this.agenda_servicio.actualizar(usuario_id, cita.id, {
              estado_pago: 'cancelado',
            });
          } catch (error) {
            console.warn(`Error al cancelar cita ${cita.id}:`, error.message);
          }
        }
      }
    }

    if (
      nuevo_estado === EstadoPlanTratamiento.PENDIENTE &&
      estado_anterior === EstadoPlanTratamiento.CANCELADO
    ) {
      const citas_eliminadas = await this.cita_repositorio
        .createQueryBuilder('cita')
        .withDeleted()
        .where('"cita"."planTratamientoId" = :plan_id', { plan_id })
        .andWhere('cita.eliminado_en IS NOT NULL')
        .getMany();

      for (const cita of citas_eliminadas) {
        await this.cita_repositorio.restore(cita.id);
      }

      const citas_canceladas = await this.cita_repositorio.find({
        where: {
          plan_tratamiento: { id: plan_id },
          estado_pago: 'cancelado',
          eliminado_en: IsNull(),
        },
      });

      for (const cita of citas_canceladas) {
        try {
          const validacion = await this.agenda_servicio.validarDisponibilidad(
            usuario_id,
            cita.fecha,
            cita.horas_aproximadas,
            cita.minutos_aproximados,
            cita.id,
          );

          if (validacion.disponible) {
            await this.agenda_servicio.actualizar(usuario_id, cita.id, {
              estado_pago: 'pendiente',
            });
          } else {
            console.warn(
              `No se pudo restaurar cita ${cita.id} por conflicto de horario. Se mantendrá cancelada.`,
            );
          }
        } catch (error) {
          console.warn(`Error al restaurar cita ${cita.id}:`, error.message);
        }
      }
    }
    plan.estado = nuevo_estado;
    const plan_actualizado = await this.plan_repositorio.save(plan);
    return this.encontrarPlanPorId(usuario_id, plan_id);
  }
}
