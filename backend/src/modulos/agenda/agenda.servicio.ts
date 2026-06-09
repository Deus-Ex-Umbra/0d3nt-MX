import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
  forwardRef,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm';
import { Cita } from './entidades/cita.entidad';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { ActualizarCitaDto } from './dto/actualizar-cita.dto';
import { Paciente } from '../pacientes/entidades/paciente.entidad';
import { PlanTratamiento } from '../tratamientos/entidades/plan-tratamiento.entidad';
import { FinanzasServicio } from '../finanzas/finanzas.servicio';
import { InventarioServicio } from '../inventario/inventario.servicio';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

const MESES_LARGOS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

@Injectable()
export class AgendaServicio {
  constructor(
    @InjectRepository(Cita)
    private readonly cita_repositorio: Repository<Cita>,
    @InjectRepository(Usuario)
    private readonly usuario_repositorio: Repository<Usuario>,
    @Inject(forwardRef(() => FinanzasServicio))
    private readonly finanzas_servicio: FinanzasServicio,
    @Inject(forwardRef(() => InventarioServicio))
    private readonly inventario_servicio: InventarioServicio,
  ) {}

  private async modoEdicionHistoricaActivo(
    usuario_id: number,
  ): Promise<boolean> {
    const usuario = await this.usuario_repositorio.findOne({
      where: { id: usuario_id },
      select: ['id', 'modo_edicion_historica'],
    });
    return !!usuario?.modo_edicion_historica;
  }

  private async validarFechaNoPasadaSiNoHistorico(
    usuario_id: number,
    fecha: Date,
  ): Promise<void> {
    const ahora = new Date();
    const fecha_cita = new Date(fecha);
    const permite = await this.modoEdicionHistoricaActivo(usuario_id);
    if (!permite && fecha_cita < ahora) {
      throw new ConflictException({
        message: 'No se pueden crear citas en el pasado.',
        code: 'AGENDA_PASADO',
        detalles: {
          tipo: 'AGENDA_PASADO',
          fecha: fecha_cita.toISOString(),
          ahora: ahora.toISOString(),
        },
      });
    }
  }

  private estadoOcupaTiempo(estado_pago: string | null | undefined): boolean {
    const estado = (estado_pago ?? '').toLowerCase();
    if (!estado) return true;
    return estado !== 'cancelado';
  }

  private calcularDuracionEnMinutos(horas: number, minutos: number): number {
    return horas * 60 + minutos;
  }

  private formatearHora(fecha: Date): string {
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  }

  private horaAMinutos(hhmm: string): number {
    const [h, m] = String(hhmm || '')
      .split(':')
      .map(Number);
    const hh = Number.isFinite(h) ? h : 0;
    const mm = Number.isFinite(m) ? m : 0;
    return hh * 60 + mm;
  }

  private minutosAHora(minutos: number): string {
    const m = Math.max(0, Math.floor(minutos));
    const hh = String(Math.floor(m / 60) % 24).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private formatearFecha(fecha: Date): string {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = MESES_LARGOS[fecha.getMonth()] ?? '';
    const anio = fecha.getFullYear();
    return `${dia} ${mes} ${anio}`.trim();
  }

  async obtenerDiasOcupados(
    usuario_id: number,
    ano: number,
    mes?: number,
  ): Promise<string[]> {
    const inicio = new Date(ano, mes ? mes - 1 : 0, 1);
    const fin = new Date(ano, mes ? mes : 12, 0, 23, 59, 59);

    const citas = await this.cita_repositorio
      .createQueryBuilder('cita')
      .select(['cita.fecha'])
      .where('cita.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .andWhere(
        '(cita.estado_pago IS NULL OR LOWER(cita.estado_pago) NOT IN (:...estados_no_ocupan))',
        {
          estados_no_ocupan: ['cancelado'],
        },
      )
      .orderBy('cita.fecha', 'ASC')
      .getMany();

    const fechasSet = new Set<string>();
    citas.forEach((cita) => {
      const fecha = new Date(cita.fecha);
      const anioStr = fecha.getFullYear();
      const mesStr = String(fecha.getMonth() + 1).padStart(2, '0');
      const diaStr = String(fecha.getDate()).padStart(2, '0');
      fechasSet.add(`${anioStr}-${mesStr}-${diaStr}`);
    });

    return Array.from(fechasSet);
  }

  async obtenerOcupacionPorMes(
    usuario_id: number,
    mes: number,
    ano: number,
  ): Promise<{
    ano: number;
    mes: number;
    dias: Record<string, Array<{ inicio: string; fin: string }>>;
  }> {
    if (!mes || mes < 1 || mes > 12) {
      throw new BadRequestException('Mes inválido. Debe estar entre 1 y 12.');
    }

    const inicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const fin = new Date(ano, mes, 0, 23, 59, 59, 999);

    const citas = await this.cita_repositorio
      .createQueryBuilder('cita')
      .select([
        'cita.fecha',
        'cita.horas_aproximadas',
        'cita.minutos_aproximados',
        'cita.estado_pago',
      ])
      .leftJoin('cita.usuario', 'usuario')
      .where('cita.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .andWhere('usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .andWhere(
        '(cita.estado_pago IS NULL OR LOWER(cita.estado_pago) NOT IN (:...estados_no_ocupan))',
        {
          estados_no_ocupan: ['cancelado'],
        },
      )
      .orderBy('cita.fecha', 'ASC')
      .getMany();

    const dias: Record<string, Array<{ inicio: string; fin: string }>> = {};

    for (const cita of citas) {
      const inicioCita = new Date(cita.fecha);

      const duracionMin = Math.max(
        1,
        this.calcularDuracionEnMinutos(
          Number((cita as any).horas_aproximadas || 0),
          Number((cita as any).minutos_aproximados || 0),
        ),
      );

      const finCita = new Date(inicioCita);
      finCita.setMinutes(finCita.getMinutes() + duracionMin);

      const finDia = new Date(inicioCita);
      finDia.setHours(23, 59, 59, 999);
      const finCitaClipped =
        finCita.getTime() > finDia.getTime() ? finDia : finCita;

      if (finCitaClipped.getTime() <= inicioCita.getTime()) continue;

      const anioStr = inicioCita.getFullYear();
      const mesStr = String(inicioCita.getMonth() + 1).padStart(2, '0');
      const diaStr = String(inicioCita.getDate()).padStart(2, '0');
      const clave = `${anioStr}-${mesStr}-${diaStr}`;

      if (!dias[clave]) dias[clave] = [];
      dias[clave].push({
        inicio: this.formatearHora(inicioCita),
        fin: this.formatearHora(finCitaClipped),
      });
    }

    for (const clave of Object.keys(dias)) {
      const intervalos = (dias[clave] || [])
        .map((i) => ({
          inicioMin: this.horaAMinutos(i.inicio),
          finMin: this.horaAMinutos(i.fin),
        }))
        .filter((i) => i.finMin > i.inicioMin)
        .sort((a, b) => a.inicioMin - b.inicioMin);

      const merged: Array<{ inicioMin: number; finMin: number }> = [];
      for (const it of intervalos) {
        const last = merged[merged.length - 1];
        if (!last || it.inicioMin > last.finMin) {
          merged.push({ ...it });
        } else {
          last.finMin = Math.max(last.finMin, it.finMin);
        }
      }

      dias[clave] = merged.map((m) => ({
        inicio: this.minutosAHora(m.inicioMin),
        fin: this.minutosAHora(m.finMin),
      }));
    }

    return { ano, mes, dias };
  }

  async validarDisponibilidad(
    usuario_id: number,
    fecha: Date,
    horas: number = 0,
    minutos: number = 30,
    cita_id_excluir?: number,
  ): Promise<{ disponible: boolean; citas_conflicto: Cita[]; detalles?: any }> {
    const ahora = new Date();
    const fecha_cita = new Date(fecha);
    if (!cita_id_excluir) {
      const permite = await this.modoEdicionHistoricaActivo(usuario_id);
      if (!permite && fecha_cita < ahora) {
        return {
          disponible: false,
          citas_conflicto: [],
          detalles: {
            tipo: 'AGENDA_PASADO',
            fecha: fecha_cita.toISOString(),
            ahora: ahora.toISOString(),
          },
        };
      }
    }

    const duracion_total_minutos = this.calcularDuracionEnMinutos(
      horas,
      minutos,
    );

    const fecha_fin_nueva_cita = new Date(fecha_cita);
    fecha_fin_nueva_cita.setMinutes(
      fecha_fin_nueva_cita.getMinutes() + duracion_total_minutos,
    );

    const fecha_inicio_busqueda = new Date(fecha_cita);
    fecha_inicio_busqueda.setHours(0, 0, 0, 0);

    const fecha_fin_busqueda = new Date(fecha_cita);
    fecha_fin_busqueda.setHours(23, 59, 59, 999);

    const condiciones: any = {
      fecha: Between(fecha_inicio_busqueda, fecha_fin_busqueda),
      usuario: { id: usuario_id },
    };

    if (cita_id_excluir) {
      condiciones.id = Not(cita_id_excluir);
    }

    const citas_del_dia = await this.cita_repositorio
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.paciente', 'paciente')
      .leftJoinAndSelect('cita.plan_tratamiento', 'plan_tratamiento')
      .withDeleted()
      .where('cita.fecha BETWEEN :fecha_inicio AND :fecha_fin', {
        fecha_inicio: fecha_inicio_busqueda,
        fecha_fin: fecha_fin_busqueda,
      })
      .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .andWhere(
        '(cita.estado_pago IS NULL OR LOWER(cita.estado_pago) NOT IN (:...estados_no_ocupan))',
        {
          estados_no_ocupan: ['cancelado'],
        },
      )
      .andWhere(cita_id_excluir ? 'cita.id != :cita_id_excluir' : '1=1', {
        cita_id_excluir,
      })
      .getMany();

    const citas_conflicto: Cita[] = [];
    const conflictos: Array<{
      inicio: string;
      fin: string;
      descripcion: string;
      cita_id?: number | null;
    }> = [];

    for (const cita_existente of citas_del_dia) {
      const fecha_inicio_existente = new Date(cita_existente.fecha);

      const duracion_existente = this.calcularDuracionEnMinutos(
        cita_existente.horas_aproximadas,
        cita_existente.minutos_aproximados,
      );

      const duracion_existente_valida = Math.max(1, duracion_existente);

      const fecha_fin_existente = new Date(fecha_inicio_existente);
      fecha_fin_existente.setMinutes(
        fecha_fin_existente.getMinutes() + duracion_existente_valida,
      );

      const hay_solapamiento =
        (fecha_cita >= fecha_inicio_existente &&
          fecha_cita < fecha_fin_existente) ||
        (fecha_fin_nueva_cita > fecha_inicio_existente &&
          fecha_fin_nueva_cita <= fecha_fin_existente) ||
        (fecha_cita <= fecha_inicio_existente &&
          fecha_fin_nueva_cita >= fecha_fin_existente);

      if (hay_solapamiento) {
        citas_conflicto.push(cita_existente);

        const descripcion = cita_existente.paciente
          ? `${cita_existente.paciente.nombre} ${cita_existente.paciente.apellidos} - ${cita_existente.descripcion}`
          : cita_existente.descripcion;

        conflictos.push({
          inicio: fecha_inicio_existente.toISOString(),
          fin: fecha_fin_existente.toISOString(),
          descripcion,
          cita_id: (cita_existente as any)?.id ?? null,
        });
      }
    }

    if (citas_conflicto.length > 0) {
      return {
        disponible: false,
        citas_conflicto,
        detalles: {
          tipo: 'AGENDA_SOLAPAMIENTO',
          nueva: {
            inicio: fecha_cita.toISOString(),
            fin: fecha_fin_nueva_cita.toISOString(),
            duracion_minutos: Math.max(1, duracion_total_minutos),
          },
          conflictos,
          sugerencia: {
            despues_de: fecha_fin_nueva_cita.toISOString(),
          },
        },
      };
    }

    return {
      disponible: true,
      citas_conflicto: [],
    };
  }

  async crear(usuario_id: number, crear_cita_dto: CrearCitaDto): Promise<Cita> {
    const {
      paciente_id,
      plan_tratamiento_id,
      estado_pago,
      monto_esperado,
      monto_esperado_usd,
      tasa_cambio,
      horas_aproximadas,
      minutos_aproximados,
      consumibles,
      activos_fijos,
      ...cita_data
    } = crear_cita_dto;

    await this.validarFechaNoPasadaSiNoHistorico(usuario_id, cita_data.fecha);

    if (plan_tratamiento_id && !paciente_id) {
      throw new BadRequestException(
        'Las citas asociadas a un plan de tratamiento deben tener paciente',
      );
    }

    if (!paciente_id && (estado_pago || monto_esperado)) {
      throw new BadRequestException(
        'Las citas sin paciente no pueden tener estado de pago ni monto esperado',
      );
    }

    if (!paciente_id && consumibles && consumibles.length > 0) {
      throw new BadRequestException(
        'Las citas sin paciente no pueden tener reservas de recursos',
      );
    }

    if (paciente_id) {
      const paciente_repo =
        this.cita_repositorio.manager.getRepository(Paciente);
      const paciente = await paciente_repo
        .createQueryBuilder('paciente')
        .innerJoin('paciente.usuario', 'usuario')
        .withDeleted()
        .where('paciente.id = :paciente_id', { paciente_id })
        .andWhere('usuario.id = :usuario_id', { usuario_id })
        .getOne();

      if (!paciente) {
        throw new BadRequestException(
          'El paciente indicado no existe o no le pertenece.',
        );
      }

      if (paciente.eliminado_en || paciente.paciente_eliminado) {
        throw new BadRequestException(
          'No se pueden crear citas para un paciente eliminado.',
        );
      }
    }

    const horas = horas_aproximadas !== undefined ? horas_aproximadas : 0;
    const minutos =
      minutos_aproximados !== undefined ? minutos_aproximados : 30;

    const estado_efectivo = paciente_id ? estado_pago || 'pendiente' : null;
    if (this.estadoOcupaTiempo(estado_efectivo)) {
      const validacion = await this.validarDisponibilidad(
        usuario_id,
        cita_data.fecha,
        horas,
        minutos,
      );
      if (!validacion.disponible) {
        throw new ConflictException({
          message: 'Conflicto de horarios.',
          code: 'AGENDA_CONFLICTO',
          detalles: validacion.detalles,
        });
      }
    }

    const fecha_inicio = new Date(cita_data.fecha);
    const fecha_fin = new Date(fecha_inicio);
    fecha_fin.setHours(fecha_fin.getHours() + horas);
    fecha_fin.setMinutes(fecha_fin.getMinutes() + minutos);

    const nueva_cita = this.cita_repositorio.create({
      ...cita_data,
      horas_aproximadas: horas,
      minutos_aproximados: minutos,
      usuario: { id: usuario_id } as Usuario,
    });

    if (paciente_id) {
      nueva_cita.paciente = { id: paciente_id } as Paciente;
      nueva_cita.estado_pago = estado_pago || 'pendiente';
      nueva_cita.monto_esperado = monto_esperado || 0;
      nueva_cita.monto_esperado_usd = monto_esperado_usd || 0;
      nueva_cita.tasa_cambio = tasa_cambio || 0;
      (nueva_cita as any).paciente_eliminado = false;
    }

    if (plan_tratamiento_id) {
      nueva_cita.plan_tratamiento = {
        id: plan_tratamiento_id,
      } as PlanTratamiento;
    }

    const cita_guardada = await this.cita_repositorio.save(nueva_cita);
    if (consumibles && consumibles.length > 0) {
      for (const consumible of consumibles) {
        try {
          await this.inventario_servicio.reservas.reservarMaterialCita(
            consumible.material_id,
            cita_guardada,
            consumible.cantidad,
            usuario_id,
          );
        } catch (error) {
          console.warn(
            `No se pudo reservar material ${consumible.material_id}:`,
            error.message,
          );
        }
      }
    }

    return cita_guardada;
  }

  async obtenerCitasPorMes(
    usuario_id: number,
    mes: number,
    ano: number,
    ligero: boolean = false,
  ): Promise<Cita[]> {
    const primer_dia = new Date(ano, mes - 1, 1);
    const ultimo_dia = new Date(ano, mes, 0, 23, 59, 59);

    if (ligero) {
      return this.cita_repositorio
        .createQueryBuilder('cita')
        .leftJoinAndSelect('cita.paciente', 'paciente')
        .withDeleted()
        .select([
          'cita.id',
          'cita.fecha',
          'cita.descripcion',
          'cita.estado_pago',
          'cita.monto_esperado',
          'cita.monto_esperado_usd',
          'cita.tasa_cambio',
          'cita.horas_aproximadas',
          'cita.minutos_aproximados',
          'cita.materiales_confirmados',
          'cita.paciente_eliminado',
          'paciente.id',
          'paciente.nombre',
          'paciente.apellidos',
          'paciente.paciente_eliminado',
        ])
        .where('cita.fecha BETWEEN :primer_dia AND :ultimo_dia', {
          primer_dia,
          ultimo_dia,
        })
        .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
        .andWhere('cita.eliminado_en IS NULL')
        .orderBy('cita.fecha', 'ASC')
        .getMany();
    }

    return this.cita_repositorio
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.paciente', 'paciente')
      .leftJoinAndSelect('cita.plan_tratamiento', 'plan_tratamiento')
      .leftJoinAndSelect('plan_tratamiento.paciente', 'plan_paciente')
      .withDeleted()
      .where('cita.fecha BETWEEN :primer_dia AND :ultimo_dia', {
        primer_dia,
        ultimo_dia,
      })
      .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .orderBy('cita.fecha', 'ASC')
      .getMany();
  }

  async actualizar(
    usuario_id: number,
    id: number,
    actualizar_cita_dto: ActualizarCitaDto,
  ): Promise<Cita> {
    const cita_actual = await this.cita_repositorio.findOne({
      where: { id, usuario: { id: usuario_id } },
      relations: ['plan_tratamiento', 'paciente'],
    });

    if (!cita_actual) {
      throw new NotFoundException(
        `Cita con ID "${id}" no encontrada o no le pertenece.`,
      );
    }

    if ((cita_actual as any).paciente_eliminado) {
      throw new BadRequestException(
        'No se puede modificar una cita asociada a un paciente eliminado.',
      );
    }

    if (
      cita_actual.materiales_confirmados &&
      actualizar_cita_dto.consumibles !== undefined
    ) {
      throw new BadRequestException(
        'No se pueden modificar los materiales de una cita ya confirmada',
      );
    }

    if (cita_actual.plan_tratamiento) {
      const paciente_actual_id = cita_actual.paciente?.id ?? null;
      if (
        actualizar_cita_dto.paciente_id !== undefined &&
        actualizar_cita_dto.paciente_id !== paciente_actual_id
      ) {
        throw new BadRequestException(
          'No se puede cambiar el paciente de una cita asociada a un plan de tratamiento',
        );
      }

      const plan_actual_id = cita_actual.plan_tratamiento?.id ?? null;
      if (
        actualizar_cita_dto.plan_tratamiento_id !== undefined &&
        actualizar_cita_dto.plan_tratamiento_id !== plan_actual_id
      ) {
        throw new BadRequestException(
          'No se puede cambiar el plan de tratamiento de una cita ya asociada',
        );
      }
    }

    if (
      actualizar_cita_dto.paciente_id !== undefined &&
      actualizar_cita_dto.paciente_id
    ) {
      const paciente_repo =
        this.cita_repositorio.manager.getRepository(Paciente);
      const paciente = await paciente_repo
        .createQueryBuilder('paciente')
        .innerJoin('paciente.usuario', 'usuario')
        .withDeleted()
        .where('paciente.id = :paciente_id', {
          paciente_id: actualizar_cita_dto.paciente_id,
        })
        .andWhere('usuario.id = :usuario_id', { usuario_id })
        .getOne();

      if (!paciente) {
        throw new BadRequestException(
          'El paciente indicado no existe o no le pertenece.',
        );
      }
      if (paciente.eliminado_en || paciente.paciente_eliminado) {
        throw new BadRequestException(
          'No se puede asociar la cita a un paciente eliminado.',
        );
      }
    }

    const fecha_en_dto =
      actualizar_cita_dto.fecha !== undefined
        ? new Date(actualizar_cita_dto.fecha)
        : null;
    const fecha_actual = new Date(cita_actual.fecha);
    const fecha_cambia =
      fecha_en_dto !== null &&
      fecha_en_dto.getTime() !== fecha_actual.getTime();

    if (fecha_cambia) {
      await this.validarFechaNoPasadaSiNoHistorico(usuario_id, fecha_en_dto);
    }

    if (!actualizar_cita_dto.paciente_id && cita_actual.paciente === null) {
      if (
        actualizar_cita_dto.estado_pago ||
        actualizar_cita_dto.monto_esperado
      ) {
        throw new BadRequestException(
          'Las citas sin paciente no pueden tener estado de pago ni monto esperado',
        );
      }
    }

    const cambio_fecha_o_duracion =
      fecha_cambia ||
      actualizar_cita_dto.horas_aproximadas !== undefined ||
      actualizar_cita_dto.minutos_aproximados !== undefined;

    let estado_efectivo: string | null | undefined = cita_actual.estado_pago;

    if (actualizar_cita_dto.paciente_id !== undefined) {
      if (!actualizar_cita_dto.paciente_id) {
        estado_efectivo = null;
      } else {
        estado_efectivo =
          actualizar_cita_dto.estado_pago ??
          cita_actual.estado_pago ??
          'pendiente';
      }
    } else if (cita_actual.paciente) {
      if (actualizar_cita_dto.estado_pago !== undefined) {
        estado_efectivo = actualizar_cita_dto.estado_pago;
      }
    }

    const ocupaba_antes = this.estadoOcupaTiempo(cita_actual.estado_pago);
    const ocupara_despues = this.estadoOcupaTiempo(estado_efectivo);
    const cambio_a_ocupar = !ocupaba_antes && ocupara_despues;

    const estado_anterior_norm_validacion = (
      cita_actual.estado_pago || ''
    ).toLowerCase();
    const estado_nuevo_norm_validacion = (estado_efectivo ?? '').toLowerCase();
    const cambio_desde_pagado_validacion =
      estado_anterior_norm_validacion === 'pagado' &&
      estado_nuevo_norm_validacion !== 'pagado';

    let pagos_vinculados_pre: any[] | null = null;

    if (cambio_desde_pagado_validacion) {
      pagos_vinculados_pre = await this.finanzas_servicio.obtenerPagosPorCita(
        usuario_id,
        id,
      );
      if (
        pagos_vinculados_pre.length > 0 &&
        !actualizar_cita_dto.accion_cancelacion_pago
      ) {
        throw new BadRequestException(
          'Debes elegir qué hacer con el pago registrado (mantener, reembolsar o eliminar) al cambiar una cita de Pagado a Pendiente o Cancelado.',
        );
      }
    }

    if (ocupara_despues && (cambio_fecha_o_duracion || cambio_a_ocupar)) {
      const nueva_fecha = actualizar_cita_dto.fecha || cita_actual.fecha;
      const nuevas_horas =
        actualizar_cita_dto.horas_aproximadas !== undefined
          ? actualizar_cita_dto.horas_aproximadas
          : cita_actual.horas_aproximadas;
      const nuevos_minutos =
        actualizar_cita_dto.minutos_aproximados !== undefined
          ? actualizar_cita_dto.minutos_aproximados
          : cita_actual.minutos_aproximados;

      const validacion = await this.validarDisponibilidad(
        usuario_id,
        nueva_fecha,
        nuevas_horas,
        nuevos_minutos,
        id,
      );

      if (!validacion.disponible) {
        throw new ConflictException({
          message: 'Conflicto de horarios.',
          code: 'AGENDA_CONFLICTO',
          detalles: validacion.detalles,
        });
      }
    }

    const estado_anterior = cita_actual.estado_pago;
    const datos_actualizar: any = {};

    if (fecha_cambia) {
      datos_actualizar.fecha = actualizar_cita_dto.fecha;
    }
    if (actualizar_cita_dto.descripcion !== undefined) {
      datos_actualizar.descripcion = actualizar_cita_dto.descripcion;
    }
    if (actualizar_cita_dto.horas_aproximadas !== undefined) {
      datos_actualizar.horas_aproximadas =
        actualizar_cita_dto.horas_aproximadas;
    }
    if (actualizar_cita_dto.minutos_aproximados !== undefined) {
      datos_actualizar.minutos_aproximados =
        actualizar_cita_dto.minutos_aproximados;
    }

    if (actualizar_cita_dto.paciente_id !== undefined) {
      datos_actualizar.paciente = actualizar_cita_dto.paciente_id
        ? ({ id: actualizar_cita_dto.paciente_id } as Paciente)
        : null;

      if (actualizar_cita_dto.paciente_id) {
        datos_actualizar.estado_pago =
          actualizar_cita_dto.estado_pago || 'pendiente';
        datos_actualizar.monto_esperado =
          actualizar_cita_dto.monto_esperado || 0;
        datos_actualizar.monto_esperado_usd =
          actualizar_cita_dto.monto_esperado_usd || 0;
        datos_actualizar.tasa_cambio = actualizar_cita_dto.tasa_cambio || 0;
      } else {
        datos_actualizar.estado_pago = null;
        datos_actualizar.monto_esperado = null;
        datos_actualizar.monto_esperado_usd = null;
        datos_actualizar.tasa_cambio = null;
      }
    } else if (cita_actual.paciente) {
      if (actualizar_cita_dto.estado_pago !== undefined) {
        datos_actualizar.estado_pago = actualizar_cita_dto.estado_pago;
      }
      if (actualizar_cita_dto.monto_esperado !== undefined) {
        datos_actualizar.monto_esperado = actualizar_cita_dto.monto_esperado;
      }
      if (actualizar_cita_dto.monto_esperado_usd !== undefined) {
        datos_actualizar.monto_esperado_usd =
          actualizar_cita_dto.monto_esperado_usd;
      }
      if (actualizar_cita_dto.tasa_cambio !== undefined) {
        datos_actualizar.tasa_cambio = actualizar_cita_dto.tasa_cambio;
      }
    }

    if (actualizar_cita_dto.plan_tratamiento_id !== undefined) {
      datos_actualizar.plan_tratamiento =
        actualizar_cita_dto.plan_tratamiento_id
          ? ({ id: actualizar_cita_dto.plan_tratamiento_id } as PlanTratamiento)
          : null;
    }

    const cita = await this.cita_repositorio.preload({
      id,
      ...datos_actualizar,
    });

    if (!cita) {
      throw new NotFoundException(`Cita con ID "${id}" no encontrada.`);
    }
    const cita_guardada = await this.cita_repositorio.save(cita);
    if (actualizar_cita_dto.consumibles !== undefined) {
      await this.inventario_servicio.reservas.actualizarRecursosCita(
        cita_guardada,
        actualizar_cita_dto.consumibles,
        usuario_id,
      );
    }

    const nuevo_estado = cita_guardada.estado_pago;
    const estado_anterior_norm = (estado_anterior || '').toLowerCase();
    const nuevo_estado_norm = (nuevo_estado || '').toLowerCase();
    const cambio_a_cancelado =
      estado_anterior_norm !== 'cancelado' && nuevo_estado_norm === 'cancelado';
    const cambio_desde_cancelado =
      estado_anterior_norm === 'cancelado' && nuevo_estado_norm !== 'cancelado';
    if (cambio_a_cancelado) {
      await this.inventario_servicio.reservas.cancelarReservasMaterialesCita(id);
      if (!cita_guardada.materiales_confirmados) {
        cita_guardada.materiales_confirmados = true;
        await this.cita_repositorio.save(cita_guardada);
      }
    }

    if (cambio_desde_cancelado) {
      const reservas = await this.inventario_servicio.reservas.obtenerReservasCita(
        id,
      );
      const tiene_consumos_confirmados = (reservas?.materiales ?? []).some(
        (rm) => (rm as any)?.estado === 'confirmada',
      );

      if (!tiene_consumos_confirmados && cita_guardada.materiales_confirmados) {
        cita_guardada.materiales_confirmados = false;
        await this.cita_repositorio.save(cita_guardada);
      }
    }

    const cambio_a_pagado =
      estado_anterior_norm !== 'pagado' && nuevo_estado_norm === 'pagado';
    const cambio_desde_pagado =
      estado_anterior_norm === 'pagado' && nuevo_estado_norm !== 'pagado';
    const sigue_pagado =
      estado_anterior_norm === 'pagado' && nuevo_estado_norm === 'pagado';
    const tiene_paciente = cita_guardada.paciente !== null;
    const tiene_monto =
      cita_guardada.monto_esperado && cita_guardada.monto_esperado > 0;

    if (cambio_a_pagado && tiene_paciente && tiene_monto) {
      await this.finanzas_servicio.registrarPago(usuario_id, {
        cita_id: id,
        fecha: new Date(),
        monto: Number(cita_guardada.monto_esperado),
        monto_usd: Number(cita_guardada.monto_esperado_usd || 0),
        tasa_cambio: Number(cita_guardada.tasa_cambio || 0),
        concepto: `Pago automático de cita: ${cita_guardada.descripcion}`,
      });
    }

    if (sigue_pagado && tiene_paciente) {
      const monto_anterior = Number((cita_actual as any).monto_esperado || 0);
      const monto_nuevo = Number((cita_guardada as any).monto_esperado || 0);
      const monto_usd_anterior = Number(
        (cita_actual as any).monto_esperado_usd || 0,
      );
      const monto_usd_nuevo = Number(
        (cita_guardada as any).monto_esperado_usd || 0,
      );
      const tasa_anterior = Number((cita_actual as any).tasa_cambio || 0);
      const tasa_nueva = Number((cita_guardada as any).tasa_cambio || 0);

      const cambio_montos =
        monto_anterior !== monto_nuevo ||
        monto_usd_anterior !== monto_usd_nuevo ||
        tasa_anterior !== tasa_nueva;

      if (cambio_montos) {
        const pagos_vinculados =
          await this.finanzas_servicio.obtenerPagosPorCita(usuario_id, id);
        const pago = pagos_vinculados?.[0];
        if (pago) {
          await this.finanzas_servicio.actualizarPago(usuario_id, pago.id, {
            monto: monto_nuevo,
            monto_usd: monto_usd_nuevo,
            tasa_cambio: tasa_nueva,
          });
        }
      }
    }

    if (cambio_desde_pagado) {
      const pagos_vinculados =
        pagos_vinculados_pre ??
        (await this.finanzas_servicio.obtenerPagosPorCita(usuario_id, id));
      if (pagos_vinculados.length > 0) {
        const accion = actualizar_cita_dto.accion_cancelacion_pago;
        if (accion) {
          switch (accion) {
            case 'eliminar':
              await this.finanzas_servicio.eliminarPagosPorCita(usuario_id, id);
              break;
            case 'reembolsar':
              await this.finanzas_servicio.reembolsarPagosPorCita(
                usuario_id,
                id,
                cita_guardada.descripcion,
              );
              break;
            case 'mantener':
              await this.finanzas_servicio.desvincularPagosDeCita(
                usuario_id,
                id,
              );
              break;
          }
        }
      }
    }

    const cita_actualizada = await this.cita_repositorio.findOne({
      where: { id, usuario: { id: usuario_id } },
      relations: ['paciente', 'plan_tratamiento', 'plan_tratamiento.paciente'],
    });

    if (!cita_actualizada) {
      throw new NotFoundException(
        `Cita con ID "${id}" no encontrada después de actualizar.`,
      );
    }

    return cita_actualizada;
  }

  async eliminar(usuario_id: number, id: number): Promise<void> {
    const cita = await this.cita_repositorio.findOne({
      where: { id, usuario: { id: usuario_id } },
    });
    if (!cita) {
      throw new NotFoundException(
        `Cita con ID "${id}" no encontrada o no le pertenece.`,
      );
    }

    await this.inventario_servicio.reservas.cancelarReservasMaterialesCita(id);
    await this.cita_repositorio.softDelete({ id, usuario: { id: usuario_id } });
  }

  async obtenerCitasSinPagar(usuario_id: number): Promise<Cita[]> {
    return this.cita_repositorio.find({
      where: [
        { estado_pago: 'pendiente', usuario: { id: usuario_id } },
        { estado_pago: 'cancelado', usuario: { id: usuario_id } },
      ],
      relations: ['paciente', 'plan_tratamiento'],
      order: { fecha: 'DESC' },
    });
  }

  async obtenerCitasSinPago(usuario_id: number): Promise<Cita[]> {
    return this.cita_repositorio
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.paciente', 'paciente')
      .leftJoinAndSelect('cita.plan_tratamiento', 'plan_tratamiento')
      .where('cita.paciente IS NOT NULL')
      .andWhere('cita.estado_pago != :estado', { estado: 'pagado' })
      .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .orderBy('cita.fecha', 'DESC')
      .getMany();
  }

  async obtenerPorId(usuario_id: number, id: number): Promise<Cita> {
    const cita = await this.cita_repositorio
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.paciente', 'paciente')
      .leftJoinAndSelect('cita.plan_tratamiento', 'plan_tratamiento')
      .leftJoinAndSelect('cita.reservas_materiales', 'reservas_materiales')
      .leftJoinAndSelect('reservas_materiales.material', 'material')
      .leftJoinAndSelect('material.producto', 'producto')
      .leftJoinAndSelect('producto.inventario', 'inventario')
      .where('cita.id = :id', { id })
      .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .withDeleted()
      .getOne();

    if (!cita) {
      throw new NotFoundException(
        `Cita con ID "${id}" no encontrada o no le pertenece.`,
      );
    }

    return cita;
  }

  async obtenerPorIdCompleto(usuario_id: number, id: number): Promise<Cita> {
    const cita = await this.cita_repositorio
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.paciente', 'paciente')
      .leftJoinAndSelect('cita.plan_tratamiento', 'plan_tratamiento')
      .leftJoinAndSelect('plan_tratamiento.paciente', 'plan_paciente')
      .leftJoinAndSelect('cita.reservas_materiales', 'reservas_materiales')
      .leftJoinAndSelect('reservas_materiales.material', 'material')
      .leftJoinAndSelect('material.producto', 'producto')
      .leftJoinAndSelect('producto.inventario', 'inventario')
      .where('cita.id = :id', { id })
      .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .withDeleted()
      .getOne();

    if (!cita) {
      throw new NotFoundException(
        `Cita con ID "${id}" no encontrada o no le pertenece.`,
      );
    }

    return cita;
  }

  async obtenerEspaciosLibres(
    usuario_id: number,
    mes: number,
    ano: number,
    fecha_inicio_filtro?: Date,
    fecha_fin_filtro?: Date,
  ): Promise<any[]> {
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);

    const primer_dia = new Date(ano, mes - 1, 1);
    const ultimo_dia = new Date(ano, mes, 0, 23, 59, 59);

    let fecha_inicio_busqueda: Date;

    if (fecha_inicio_filtro && fecha_fin_filtro) {
      fecha_inicio_busqueda =
        fecha_inicio_filtro < primer_dia ? primer_dia : fecha_inicio_filtro;
    } else {
      fecha_inicio_busqueda = primer_dia < ahora ? ahora : primer_dia;
    }

    const citas_mes = await this.cita_repositorio
      .createQueryBuilder('cita')
      .where('cita.fecha BETWEEN :primer_dia AND :ultimo_dia', {
        primer_dia,
        ultimo_dia,
      })
      .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .orderBy('cita.fecha', 'ASC')
      .getMany();

    const citas_mes_ocupantes = citas_mes.filter((cita) =>
      this.estadoOcupaTiempo(cita.estado_pago),
    );

    const espacios_libres: any[] = [];
    const fecha_actual = new Date(fecha_inicio_busqueda);
    fecha_actual.setHours(0, 0, 0, 0);

    while (fecha_actual <= ultimo_dia) {
      const inicio_dia = new Date(fecha_actual);
      inicio_dia.setHours(0, 0, 0, 0);

      const fin_dia = new Date(fecha_actual);
      fin_dia.setHours(23, 59, 59, 999);

      const citas_del_dia = citas_mes_ocupantes.filter((cita) => {
        const fecha_cita = new Date(cita.fecha);
        return fecha_cita.toDateString() === fecha_actual.toDateString();
      });

      if (citas_del_dia.length === 0) {
        const duracion_ms = fin_dia.getTime() - inicio_dia.getTime();
        const duracion_minutos = Math.floor(duracion_ms / 60000);

        if (duracion_minutos > 0) {
          espacios_libres.push({
            fecha: new Date(inicio_dia),
            duracion_minutos: duracion_minutos,
            horas_aproximadas: Math.floor(duracion_minutos / 60),
            minutos_aproximados: duracion_minutos % 60,
            descripcion: `Espacio libre - ${Math.floor(duracion_minutos / 60)}h ${duracion_minutos % 60}m`,
          });
        }
      } else {
        const eventos: Array<{
          fecha: Date;
          tipo: 'inicio' | 'fin';
          cita_id: number;
        }> = [];

        citas_del_dia.forEach((cita) => {
          const fecha_inicio = new Date(cita.fecha);
          const duracion_cita = this.calcularDuracionEnMinutos(
            cita.horas_aproximadas,
            cita.minutos_aproximados,
          );
          const fecha_fin = new Date(
            fecha_inicio.getTime() + duracion_cita * 60000,
          );

          eventos.push({
            fecha: fecha_inicio,
            tipo: 'inicio',
            cita_id: cita.id,
          });
          eventos.push({ fecha: fecha_fin, tipo: 'fin', cita_id: cita.id });
        });

        eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

        const hora_libre_inicio = new Date(inicio_dia);

        if (hora_libre_inicio < eventos[0].fecha) {
          const duracion_ms =
            eventos[0].fecha.getTime() - hora_libre_inicio.getTime();
          const duracion_minutos = Math.floor(duracion_ms / 60000);

          if (duracion_minutos > 0) {
            espacios_libres.push({
              fecha: new Date(hora_libre_inicio),
              duracion_minutos: duracion_minutos,
              horas_aproximadas: Math.floor(duracion_minutos / 60),
              minutos_aproximados: duracion_minutos % 60,
              descripcion: `Espacio libre - ${Math.floor(duracion_minutos / 60)}h ${duracion_minutos % 60}m`,
            });
          }
        }

        let citas_activas = 0;
        let ultima_hora_fin: Date | null = null;

        for (let i = 0; i < eventos.length; i++) {
          const evento = eventos[i];

          if (evento.tipo === 'inicio') {
            citas_activas++;
          } else {
            citas_activas--;
            ultima_hora_fin = evento.fecha;
          }

          if (citas_activas === 0 && ultima_hora_fin) {
            const siguiente_evento = eventos[i + 1];

            if (siguiente_evento) {
              const duracion_ms =
                siguiente_evento.fecha.getTime() - ultima_hora_fin.getTime();
              const duracion_minutos = Math.floor(duracion_ms / 60000);

              if (duracion_minutos > 0) {
                espacios_libres.push({
                  fecha: new Date(ultima_hora_fin),
                  duracion_minutos: duracion_minutos,
                  horas_aproximadas: Math.floor(duracion_minutos / 60),
                  minutos_aproximados: duracion_minutos % 60,
                  descripcion: `Espacio libre - ${Math.floor(duracion_minutos / 60)}h ${duracion_minutos % 60}m`,
                });
              }
            } else {
              const duracion_ms = fin_dia.getTime() - ultima_hora_fin.getTime();
              const duracion_minutos = Math.floor(duracion_ms / 60000);

              if (duracion_minutos > 0) {
                espacios_libres.push({
                  fecha: new Date(ultima_hora_fin),
                  duracion_minutos: duracion_minutos,
                  horas_aproximadas: Math.floor(duracion_minutos / 60),
                  minutos_aproximados: duracion_minutos % 60,
                  descripcion: `Espacio libre - ${Math.floor(duracion_minutos / 60)}h ${duracion_minutos % 60}m`,
                });
              }
            }
          }
        }
      }

      fecha_actual.setDate(fecha_actual.getDate() + 1);
      fecha_actual.setHours(0, 0, 0, 0);
    }

    return espacios_libres;
  }

  async filtrarCitas(
    usuario_id: number,
    fecha_inicio: Date,
    fecha_fin: Date,
  ): Promise<Cita[]> {
    return this.cita_repositorio
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.paciente', 'paciente')
      .leftJoinAndSelect('cita.plan_tratamiento', 'plan_tratamiento')
      .leftJoinAndSelect('plan_tratamiento.paciente', 'plan_paciente')
      .where('cita.fecha BETWEEN :fecha_inicio AND :fecha_fin', {
        fecha_inicio,
        fecha_fin,
      })
      .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
      .andWhere('cita.eliminado_en IS NULL')
      .orderBy('cita.fecha', 'ASC')
      .getMany();
  }

  async filtrarEspaciosLibres(
    usuario_id: number,
    fecha_inicio: Date,
    fecha_fin: Date,
  ): Promise<any[]> {
    const inicio_rango = new Date(fecha_inicio);
    const fin_rango = new Date(fecha_fin);

    if (!(fin_rango.getTime() > inicio_rango.getTime())) {
      return [];
    }

    const espacios_libres: any[] = [];

    const fecha_actual = new Date(inicio_rango);
    fecha_actual.setHours(0, 0, 0, 0);

    const ultimo_dia = new Date(fin_rango);
    ultimo_dia.setHours(0, 0, 0, 0);

    while (fecha_actual <= ultimo_dia) {
      const inicio_dia = new Date(fecha_actual);
      inicio_dia.setHours(0, 0, 0, 0);

      const fin_dia = new Date(fecha_actual);
      fin_dia.setHours(23, 59, 59, 999);

      const ventana_inicio = new Date(
        Math.max(inicio_dia.getTime(), inicio_rango.getTime()),
      );
      const ventana_fin = new Date(
        Math.min(fin_dia.getTime(), fin_rango.getTime()),
      );

      if (!(ventana_fin.getTime() > ventana_inicio.getTime())) {
        fecha_actual.setDate(fecha_actual.getDate() + 1);
        fecha_actual.setHours(0, 0, 0, 0);
        continue;
      }

      const citas_del_dia = await this.cita_repositorio
        .createQueryBuilder('cita')
        .where('cita.fecha BETWEEN :inicio_dia AND :fin_dia', {
          inicio_dia,
          fin_dia,
        })
        .andWhere('cita.usuario.id = :usuario_id', { usuario_id })
        .andWhere('cita.eliminado_en IS NULL')
        .orderBy('cita.fecha', 'ASC')
        .getMany();

      const citas_ocupantes = citas_del_dia.filter((cita) =>
        this.estadoOcupaTiempo(cita.estado_pago),
      );

      const intervalos_ocupados = citas_ocupantes
        .map((cita) => {
          const fecha_inicio_cita = new Date(cita.fecha);
          const duracion_cita = this.calcularDuracionEnMinutos(
            cita.horas_aproximadas,
            cita.minutos_aproximados,
          );
          const fecha_fin_cita = new Date(
            fecha_inicio_cita.getTime() + duracion_cita * 60000,
          );

          const inicio = new Date(
            Math.max(fecha_inicio_cita.getTime(), ventana_inicio.getTime()),
          );
          const fin = new Date(
            Math.min(fecha_fin_cita.getTime(), ventana_fin.getTime()),
          );

          if (!(fin.getTime() > inicio.getTime())) {
            return null;
          }

          return { inicio, fin };
        })
        .filter((x): x is { inicio: Date; fin: Date } => !!x)
        .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

      const intervalos_mergeados: Array<{ inicio: Date; fin: Date }> = [];

      for (const i of intervalos_ocupados) {
        const ultimo = intervalos_mergeados[intervalos_mergeados.length - 1];
        if (!ultimo) {
          intervalos_mergeados.push({
            inicio: new Date(i.inicio),
            fin: new Date(i.fin),
          });
          continue;
        }

        if (i.inicio.getTime() <= ultimo.fin.getTime()) {
          if (i.fin.getTime() > ultimo.fin.getTime()) {
            ultimo.fin = new Date(i.fin);
          }
        } else {
          intervalos_mergeados.push({
            inicio: new Date(i.inicio),
            fin: new Date(i.fin),
          });
        }
      }

      const crearEspacioLibre = (inicio: Date, fin: Date) => {
        const duracion_minutos = Math.floor(
          (fin.getTime() - inicio.getTime()) / 60000,
        );
        if (duracion_minutos <= 0) return;
        const horas = Math.floor(duracion_minutos / 60);
        const minutos = duracion_minutos % 60;
        espacios_libres.push({
          fecha: new Date(inicio),
          duracion_minutos,
          horas_aproximadas: horas,
          minutos_aproximados: minutos,
          descripcion: `Espacio libre - ${horas}h ${minutos}m`,
        });
      };

      if (intervalos_mergeados.length === 0) {
        crearEspacioLibre(ventana_inicio, ventana_fin);
      } else {
        let cursor = new Date(ventana_inicio);
        for (const ocupado of intervalos_mergeados) {
          if (cursor.getTime() < ocupado.inicio.getTime()) {
            crearEspacioLibre(cursor, ocupado.inicio);
          }
          if (ocupado.fin.getTime() > cursor.getTime()) {
            cursor = new Date(ocupado.fin);
          }
        }
        if (cursor.getTime() < ventana_fin.getTime()) {
          crearEspacioLibre(cursor, ventana_fin);
        }
      }

      fecha_actual.setDate(fecha_actual.getDate() + 1);
      fecha_actual.setHours(0, 0, 0, 0);
    }

    return espacios_libres;
  }
}
