import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alergia } from './entidades/alergia.entidad';
import { Enfermedad } from './entidades/enfermedad.entidad';
import { Medicamento } from './entidades/medicamento.entidad';
import { ColorCategoria } from './entidades/color-categoria.entidad';
import { Etiqueta } from './entidades/etiqueta.entidad';
import { EtiquetaPlantilla } from './entidades/etiqueta-plantilla.entidad';
import { CrearAlergiaDto } from './dto/crear-alergia.dto';
import { CrearEnfermedadDto } from './dto/crear-enfermedad.dto';
import { CrearMedicamentoDto } from './dto/crear-medicamento.dto';
import { CrearColorCategoriaDto } from './dto/crear-color-categoria.dto';
import { CrearEtiquetaDto } from './dto/crear-etiqueta.dto';
import { ActualizarAlergiaDto } from './dto/actualizar-alergia.dto';
import { ActualizarEnfermedadDto } from './dto/actualizar-enfermedad.dto';
import { ActualizarMedicamentoDto } from './dto/actualizar-medicamento.dto';
import { ActualizarColorCategoriaDto } from './dto/actualizar-color-categoria.dto';
import { ActualizarEtiquetaDto } from './dto/actualizar-etiqueta.dto';
import { TamanoPapel } from './entidades/tamano-papel.entidad';
import { CrearTamanoPapelDto } from './dto/crear-tamano-papel.dto';
import { ActualizarTamanoPapelDto } from './dto/actualizar-tamano-papel.dto';
import { OnModuleInit } from '@nestjs/common';
import { ConfiguracionClinica } from './entidades/configuracion-clinica.entidad';
import { ActualizarConfiguracionClinicaDto } from './dto/actualizar-configuracion-clinica.dto';

@Injectable()
export class CatalogoServicio implements OnModuleInit {
  constructor(
    @InjectRepository(Alergia)
    private readonly alergia_repositorio: Repository<Alergia>,
    @InjectRepository(Enfermedad)
    private readonly enfermedad_repositorio: Repository<Enfermedad>,
    @InjectRepository(Medicamento)
    private readonly medicamento_repositorio: Repository<Medicamento>,
    @InjectRepository(ColorCategoria)
    private readonly color_repositorio: Repository<ColorCategoria>,
    @InjectRepository(Etiqueta)
    private readonly etiqueta_repositorio: Repository<Etiqueta>,
    @InjectRepository(EtiquetaPlantilla)
    private readonly etiqueta_plantilla_repositorio: Repository<EtiquetaPlantilla>,
    @InjectRepository(TamanoPapel)
    private readonly tamano_papel_repositorio: Repository<TamanoPapel>,
    @InjectRepository(ConfiguracionClinica)
    private readonly configuracion_clinica_repositorio: Repository<ConfiguracionClinica>,
  ) {}

  async onModuleInit() {
    await this.seedTamanosPapel();
  }

  private async seedTamanosPapel() {
    const existentes = await this.tamano_papel_repositorio.find();
    for (const e of existentes) {
      if (
        typeof e.ancho === 'number' &&
        typeof e.alto === 'number' &&
        e.ancho > 0 &&
        e.alto > 0 &&
        e.ancho < 50 &&
        e.alto < 60
      ) {
        const anchoMm = Math.round(e.ancho * 10);
        const altoMm = Math.round(e.alto * 10);
        e.ancho = anchoMm as any;
        e.alto = altoMm as any;
        if (!e.descripcion || /cm\b/i.test(e.descripcion)) {
          e.descripcion = `${anchoMm} × ${altoMm} mm`;
        }
        await this.tamano_papel_repositorio.save(e);
      }
    }
    const nombresNecesarios = ['Carta', 'Legal', 'A4'];
    const faltantes = nombresNecesarios.filter(
      (n) => !existentes.some((e) => e.nombre === n),
    );
    if (faltantes.length === 0) return;

    const definiciones: Record<
      string,
      { ancho: number; alto: number; descripcion: string }
    > = {
      Carta: {
        ancho: 216,
        alto: 279,
        descripcion: '216 × 279 mm (8.5" × 11")',
      },
      Legal: {
        ancho: 216,
        alto: 356,
        descripcion: '216 × 356 mm (8.5" × 14")',
      },
      A4: {
        ancho: 210,
        alto: 297,
        descripcion: '210 × 297 mm (8.27" × 11.7")',
      },
    };

    for (const nombre of faltantes) {
      const def = definiciones[nombre];
      if (!def) continue;
      const nuevo = this.tamano_papel_repositorio.create({
        nombre,
        ancho: def.ancho,
        alto: def.alto,
        descripcion: def.descripcion,
        protegido: true,
        activo: true,
      });
      await this.tamano_papel_repositorio.save(nuevo);
    }
  }

  private generarDescripcionTamano(ancho: number, alto: number): string {
    const anchoPulgadas = (ancho / 25.4).toFixed(2);
    const altoPulgadas = (alto / 25.4).toFixed(2);
    return `${ancho} × ${alto} mm (${anchoPulgadas}" × ${altoPulgadas}")`;
  }

  async crearTamanoPapel(dto: CrearTamanoPapelDto): Promise<TamanoPapel> {
    const existe = await this.tamano_papel_repositorio.findOne({
      where: { nombre: dto.nombre },
    });
    if (existe) throw new ConflictException('Este tamaño de papel ya existe');
    const descripcion = this.generarDescripcionTamano(dto.ancho, dto.alto);
    const tamano = this.tamano_papel_repositorio.create({
      ...dto,
      descripcion,
      protegido: false,
      activo: true,
    });
    return this.tamano_papel_repositorio.save(tamano);
  }

  async obtenerTamanosPapel(): Promise<TamanoPapel[]> {
    return this.tamano_papel_repositorio.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async actualizarTamanoPapel(
    id: number,
    dto: ActualizarTamanoPapelDto,
  ): Promise<TamanoPapel> {
    const existente = await this.tamano_papel_repositorio.findOne({
      where: { id },
    });
    if (!existente) throw new NotFoundException('Tamaño no encontrado');
    if (existente.protegido)
      throw new ConflictException(
        'Este tamaño está protegido y no puede modificarse',
      );
    Object.assign(existente, dto);
    existente.descripcion = this.generarDescripcionTamano(
      existente.ancho,
      existente.alto,
    );
    return this.tamano_papel_repositorio.save(existente);
  }

  async eliminarTamanoPapel(id: number): Promise<void> {
    const existente = await this.tamano_papel_repositorio.findOne({
      where: { id },
    });
    if (!existente) throw new NotFoundException('Tamaño no encontrado');
    if (existente.protegido)
      throw new ConflictException(
        'Este tamaño está protegido y no puede eliminarse',
      );
    const resultado = await this.tamano_papel_repositorio.softDelete(id);
    if (resultado.affected === 0)
      throw new NotFoundException('Tamaño no encontrado');
  }

  async crearAlergia(
    usuario_id: number,
    dto: CrearAlergiaDto,
  ): Promise<Alergia> {
    const existe = await this.alergia_repositorio.findOne({
      where: { nombre: dto.nombre, usuario_id },
    });
    if (existe) {
      throw new ConflictException('Esta alergia ya existe');
    }
    const alergia = this.alergia_repositorio.create({ ...dto, usuario_id });
    return this.alergia_repositorio.save(alergia);
  }

  async obtenerAlergias(usuario_id: number): Promise<Alergia[]> {
    return this.alergia_repositorio.find({
      where: { activo: true, usuario_id },
      order: { nombre: 'ASC' },
    });
  }

  async actualizarAlergia(
    usuario_id: number,
    id: number,
    dto: ActualizarAlergiaDto,
  ): Promise<Alergia> {
    const alergia = await this.alergia_repositorio.findOne({
      where: { id, usuario_id },
    });
    if (!alergia) {
      throw new NotFoundException('Alergia no encontrada');
    }
    Object.assign(alergia, dto);
    return this.alergia_repositorio.save(alergia);
  }

  async eliminarAlergia(usuario_id: number, id: number): Promise<void> {
    const resultado = await this.alergia_repositorio.softDelete({
      id,
      usuario_id,
    });
    if (resultado.affected === 0) {
      throw new NotFoundException('Alergia no encontrada');
    }
  }

  async crearEnfermedad(
    usuario_id: number,
    dto: CrearEnfermedadDto,
  ): Promise<Enfermedad> {
    const existe = await this.enfermedad_repositorio.findOne({
      where: { nombre: dto.nombre, usuario_id },
    });
    if (existe) {
      throw new ConflictException('Esta enfermedad ya existe');
    }
    const enfermedad = this.enfermedad_repositorio.create({
      ...dto,
      usuario_id,
    });
    return this.enfermedad_repositorio.save(enfermedad);
  }

  async obtenerEnfermedades(usuario_id: number): Promise<Enfermedad[]> {
    return this.enfermedad_repositorio.find({
      where: { activo: true, usuario_id },
      order: { nombre: 'ASC' },
    });
  }

  async actualizarEnfermedad(
    usuario_id: number,
    id: number,
    dto: ActualizarEnfermedadDto,
  ): Promise<Enfermedad> {
    const enfermedad = await this.enfermedad_repositorio.findOne({
      where: { id, usuario_id },
    });
    if (!enfermedad) {
      throw new NotFoundException('Enfermedad no encontrada');
    }
    Object.assign(enfermedad, dto);
    return this.enfermedad_repositorio.save(enfermedad);
  }

  async eliminarEnfermedad(usuario_id: number, id: number): Promise<void> {
    const resultado = await this.enfermedad_repositorio.softDelete({
      id,
      usuario_id,
    });
    if (resultado.affected === 0) {
      throw new NotFoundException('Enfermedad no encontrada');
    }
  }

  async crearMedicamento(
    usuario_id: number,
    dto: CrearMedicamentoDto,
  ): Promise<Medicamento> {
    const existe = await this.medicamento_repositorio.findOne({
      where: { nombre: dto.nombre, usuario_id },
    });
    if (existe) {
      throw new ConflictException('Este medicamento ya existe');
    }
    const medicamento = this.medicamento_repositorio.create({
      ...dto,
      usuario_id,
    });
    return this.medicamento_repositorio.save(medicamento);
  }

  async obtenerMedicamentos(usuario_id: number): Promise<Medicamento[]> {
    return this.medicamento_repositorio.find({
      where: { activo: true, usuario_id },
      order: { nombre: 'ASC' },
    });
  }

  async actualizarMedicamento(
    usuario_id: number,
    id: number,
    dto: ActualizarMedicamentoDto,
  ): Promise<Medicamento> {
    const medicamento = await this.medicamento_repositorio.findOne({
      where: { id, usuario_id },
    });
    if (!medicamento) {
      throw new NotFoundException('Medicamento no encontrado');
    }
    Object.assign(medicamento, dto);
    return this.medicamento_repositorio.save(medicamento);
  }

  async eliminarMedicamento(usuario_id: number, id: number): Promise<void> {
    const resultado = await this.medicamento_repositorio.softDelete({
      id,
      usuario_id,
    });
    if (resultado.affected === 0) {
      throw new NotFoundException('Medicamento no encontrado');
    }
  }

  async crearColor(
    usuario_id: number,
    dto: CrearColorCategoriaDto,
  ): Promise<ColorCategoria> {
    const color = this.color_repositorio.create({ ...dto, usuario_id });
    return this.color_repositorio.save(color);
  }

  async obtenerColores(usuario_id: number): Promise<ColorCategoria[]> {
    return this.color_repositorio.find({
      where: { activo: true, usuario_id },
      order: { nombre: 'ASC' },
    });
  }

  async actualizarColor(
    usuario_id: number,
    id: number,
    dto: ActualizarColorCategoriaDto,
  ): Promise<ColorCategoria> {
    const color = await this.color_repositorio.findOne({
      where: { id, usuario_id },
    });
    if (!color) {
      throw new NotFoundException('Color no encontrado');
    }
    Object.assign(color, dto);
    return this.color_repositorio.save(color);
  }

  async eliminarColor(usuario_id: number, id: number): Promise<void> {
    const resultado = await this.color_repositorio.softDelete({
      id,
      usuario_id,
    });
    if (resultado.affected === 0) {
      throw new NotFoundException('Color no encontrado');
    }
  }

  async crearEtiqueta(dto: CrearEtiquetaDto): Promise<Etiqueta> {
    const existe = await this.etiqueta_repositorio.findOne({
      where: { nombre: dto.nombre },
    });
    if (existe) {
      throw new ConflictException('Esta etiqueta ya existe');
    }
    const etiqueta = this.etiqueta_repositorio.create(dto);
    return this.etiqueta_repositorio.save(etiqueta);
  }

  async obtenerEtiquetas(): Promise<Etiqueta[]> {
    return this.etiqueta_repositorio.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async actualizarEtiqueta(
    id: number,
    dto: ActualizarEtiquetaDto,
  ): Promise<Etiqueta> {
    const etiqueta = await this.etiqueta_repositorio.preload({ id, ...dto });
    if (!etiqueta) {
      throw new NotFoundException('Etiqueta no encontrada');
    }
    return this.etiqueta_repositorio.save(etiqueta);
  }

  async eliminarEtiqueta(id: number): Promise<void> {
    const resultado = await this.etiqueta_repositorio.softDelete(id);
    if (resultado.affected === 0) {
      throw new NotFoundException('Etiqueta no encontrada');
    }
  }

  async crearEtiquetaPlantilla(
    usuario_id: number,
    dto: any,
  ): Promise<EtiquetaPlantilla> {
    const codigoNormalizado = this.normalizarCodigoEtiquetaPlantilla(
      dto?.codigo,
    );
    const existe = await this.etiqueta_plantilla_repositorio.findOne({
      where: { codigo: codigoNormalizado, usuario: { id: usuario_id } },
    });
    if (existe) {
      throw new ConflictException('Ya existe una etiqueta con este código');
    }
    const nueva_etiqueta = this.etiqueta_plantilla_repositorio.create({
      nombre: dto.nombre,
      codigo: codigoNormalizado,
      descripcion: dto.descripcion,
      usuario: { id: usuario_id } as any,
    });
    return this.etiqueta_plantilla_repositorio.save(nueva_etiqueta);
  }

  async obtenerEtiquetasPlantilla(
    usuario_id: number,
  ): Promise<EtiquetaPlantilla[]> {
    let etiquetas = await this.etiqueta_plantilla_repositorio.find({
      where: { usuario: { id: usuario_id }, activo: true },
      order: { nombre: 'ASC' },
    });

    if (etiquetas.length === 0) {
      await this.seedEtiquetasPlantilla(usuario_id);
      etiquetas = await this.etiqueta_plantilla_repositorio.find({
        where: { usuario: { id: usuario_id }, activo: true },
        order: { nombre: 'ASC' },
      });
    }

    return etiquetas;
  }

  private async seedEtiquetasPlantilla(usuario_id: number) {
    const etiquetas = [
      {
        nombre: 'Nombre del Paciente',
        codigo: '[PACIENTE_NOMBRE]',
        descripcion: 'Nombre del paciente',
      },
      {
        nombre: 'Apellidos del Paciente',
        codigo: '[PACIENTE_APELLIDOS]',
        descripcion: 'Apellidos del paciente',
      },
      {
        nombre: 'Teléfono del Paciente',
        codigo: '[PACIENTE_TELEFONO]',
        descripcion: 'Teléfono del paciente',
      },
      {
        nombre: 'Correo del Paciente',
        codigo: '[PACIENTE_CORREO]',
        descripcion: 'Correo del paciente',
      },
      {
        nombre: 'Dirección del Paciente',
        codigo: '[PACIENTE_DIRECCION]',
        descripcion: 'Dirección del paciente',
      },
      {
        nombre: 'Fecha Actual',
        codigo: '[FECHA_ACTUAL]',
        descripcion: 'Fecha del día de hoy',
      },
    ];

    for (const etiqueta of etiquetas) {
      try {
        await this.crearEtiquetaPlantilla(usuario_id, etiqueta);
      } catch (_) {}
    }
  }

  async actualizarEtiquetaPlantilla(
    id: number,
    usuario_id: number,
    dto: any,
  ): Promise<EtiquetaPlantilla> {
    const etiqueta = await this.etiqueta_plantilla_repositorio.findOne({
      where: { id, usuario: { id: usuario_id } },
    });
    if (!etiqueta) throw new NotFoundException('Etiqueta no encontrada');

    if (typeof dto?.codigo === 'string' && dto.codigo.trim() !== '') {
      const codigoNormalizado = this.normalizarCodigoEtiquetaPlantilla(
        dto.codigo,
      );
      const existe = await this.etiqueta_plantilla_repositorio.findOne({
        where: {
          codigo: codigoNormalizado,
          usuario: { id: usuario_id },
        },
      });
      if (existe && existe.id !== id) {
        throw new ConflictException('Ya existe una etiqueta con este código');
      }
      dto.codigo = codigoNormalizado;
    }

    Object.assign(etiqueta, dto);
    const etiqueta_actualizada =
      await this.etiqueta_plantilla_repositorio.save(etiqueta);
    return etiqueta_actualizada;
  }

  private normalizarCodigoEtiquetaPlantilla(codigo: unknown): string {
    const raw = typeof codigo === 'string' ? codigo : '';
    let valor = raw.trim();
    if (!valor) return '';
    if (valor.startsWith('{') && valor.endsWith('}')) {
      valor = valor.slice(1, -1).trim();
    }

    const tieneInicio = valor.startsWith('[');
    const tieneFin = valor.endsWith(']');
    if (tieneInicio) valor = valor.slice(1);
    if (tieneFin) valor = valor.slice(0, -1);

    valor = valor.trim().toUpperCase();
    return `[${valor}]`;
  }

  async eliminarEtiquetaPlantilla(
    id: number,
    usuario_id: number,
  ): Promise<void> {
    const resultado = await this.etiqueta_plantilla_repositorio.softDelete({
      id,
      usuario: { id: usuario_id },
    });
    if (resultado.affected === 0)
      throw new NotFoundException('Etiqueta no encontrada');
  }

  async obtenerConfiguracionClinica(
    usuario_id: number,
  ): Promise<ConfiguracionClinica> {
    let config = await this.configuracion_clinica_repositorio.findOne({
      where: { usuario_id },
    });
    if (!config) {
      const horarios_default = this.crearHorariosLaboralesDefault();
      config = this.configuracion_clinica_repositorio.create({
        usuario_id,
        mensaje_bienvenida_antes: 'Bienvenido, ',
        mensaje_bienvenida_despues: ', ¿qué hacemos hoy?',
        horarios_laborales: JSON.stringify(horarios_default),
      });
      config = await this.configuracion_clinica_repositorio.save(config);
    }
    return config;
  }

  async actualizarConfiguracionClinica(
    usuario_id: number,
    dto: ActualizarConfiguracionClinicaDto,
  ): Promise<ConfiguracionClinica> {
    if (typeof dto.horarios_laborales === 'string') {
      dto.horarios_laborales = this.normalizarHorariosLaborales(
        dto.horarios_laborales,
      );
    }

    let config = await this.configuracion_clinica_repositorio.findOne({
      where: { usuario_id },
    });
    if (!config) {
      config = this.configuracion_clinica_repositorio.create({
        usuario_id,
        ...dto,
      });
    } else {
      Object.assign(config, dto);
    }
    return this.configuracion_clinica_repositorio.save(config);
  }

  private crearHorariosLaboralesDefault(): Record<
    string,
    Array<{ inicio: string; fin: string }>
  > {
    const base = [
      { inicio: '08:00', fin: '12:00' },
      { inicio: '14:00', fin: '18:00' },
    ];

    return {
      domingo: [...base],
      lunes: [...base],
      martes: [...base],
      miércoles: [...base],
      jueves: [...base],
      viernes: [...base],
      sábado: [...base],
    };
  }

  private normalizarHorariosLaborales(rawJson: string): string {
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new BadRequestException(
        'horarios_laborales debe ser un JSON válido',
      );
    }

    const dias = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ] as const;
    const defaultObj = this.crearHorariosLaboralesDefault();

    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new BadRequestException(
        'horarios_laborales debe ser un objeto con días como claves',
      );
    }

    const timeRegex = /^\d{2}:\d{2}$/;
    const toMinutes = (hhmm: string): number => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };

    const normalized: Record<
      string,
      Array<{ inicio: string; fin: string }>
    > = {};

    for (const dia of dias) {
      const rangosRaw = parsed[dia];
      const rangos: Array<{ inicio: string; fin: string }> = Array.isArray(
        rangosRaw,
      )
        ? rangosRaw
        : (defaultObj as any)[dia];

      const cleaned = rangos
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({
          inicio:
            typeof (r as any).inicio === 'string'
              ? (r as any).inicio.trim()
              : '',
          fin: typeof (r as any).fin === 'string' ? (r as any).fin.trim() : '',
        }));

      for (const r of cleaned) {
        if (!timeRegex.test(r.inicio) || !timeRegex.test(r.fin)) {
          throw new BadRequestException(
            `Formato de hora inválido en ${dia}. Usa HH:MM`,
          );
        }
        const inicioMin = toMinutes(r.inicio);
        const finMin = toMinutes(r.fin);
        if (
          !(
            inicioMin >= 0 &&
            inicioMin <= 23 * 60 + 59 &&
            finMin >= 0 &&
            finMin <= 23 * 60 + 59
          )
        ) {
          throw new BadRequestException(`Hora fuera de rango en ${dia}`);
        }
        if (inicioMin >= finMin) {
          throw new BadRequestException(
            `El horario inicio debe ser menor que fin en ${dia}`,
          );
        }
      }

      cleaned.sort((a, b) => toMinutes(a.inicio) - toMinutes(b.inicio));

      for (let i = 1; i < cleaned.length; i++) {
        const prev = cleaned[i - 1];
        const curr = cleaned[i];
        if (toMinutes(prev.fin) > toMinutes(curr.inicio)) {
          throw new BadRequestException(
            `Hay solapamiento de horarios en ${dia}`,
          );
        }
      }

      normalized[dia] = cleaned;
    }

    return JSON.stringify(normalized);
  }

  async obtenerHoraServidor(): Promise<Date> {
    return new Date();
  }

  async inicializarCatalogosUsuario(usuario_id: number) {
    const alergias = [
      'Penicilina',
      'Amoxicilina',
      'Látex',
      'Anestesia Local',
      'AINES (Aspirina, Ibuprofeno)',
      'Sulfas',
      'Yodo',
      'Metales (Níquel)',
      'Mariscos/Pescado',
    ];
    for (const nombre of alergias) {
      try {
        await this.crearAlergia(usuario_id, { nombre });
      } catch (e) {}
    }
    const enfermedades = [
      'Hipertensión Arterial',
      'Diabetes Mellitus',
      'Asma',
      'Epilepsia/Convulsiones',
      'Hepatitis',
      'VIH/SIDA',
      'Problemas Cardíacos',
      'Hipotiroidismo / Hipertiroidismo',
      'Gastritis',
      'Insuficiencia Renal',
    ];
    for (const nombre of enfermedades) {
      try {
        await this.crearEnfermedad(usuario_id, { nombre });
      } catch (e) {}
    }
    const medicamentos = [
      'Amoxicilina 500mg',
      'Ibuprofeno 400mg',
      'Paracetamol 500mg',
      'Ketorolaco 20mg',
      'Diclofenaco',
      'Clindamicina 300mg',
      'Dexametasona',
      'Nistatina',
      'Clorhexidina',
    ];
    for (const nombre of medicamentos) {
      try {
        await this.crearMedicamento(usuario_id, { nombre });
      } catch (e) {}
    }
    const colores = [
      { nombre: 'Paciente Nuevo', color: '#3B82F6' },
      { nombre: 'Paciente Frecuente', color: '#10B981' },
      { nombre: 'VIP', color: '#EAB308' },
      { nombre: 'En Tratamiento', color: '#8B5CF6' },
      { nombre: 'Con Deuda', color: '#EF4444' },
      { nombre: 'Mantenimiento', color: '#06B6D4' },
      { nombre: 'Referido', color: '#F97316' },
      { nombre: 'Alta', color: '#64748B' },
    ];
    for (const c of colores) {
      try {
        await this.crearColor(usuario_id, c);
      } catch (e) {}
    }
    await this.seedEtiquetasPlantilla(usuario_id);
  }
}
