import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entidades/usuario.entidad';
import * as bcrypt from 'bcrypt';
import { RegistroUsuarioDto } from '../autenticacion/dto/registro-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { ActualizarPaisDto } from './dto/actualizar-pais.dto';
import { ActualizarMonedaDto } from './dto/actualizar-moneda.dto';
import {
  AlmacenamientoServicio,
  TipoDocumento,
} from '../almacenamiento/almacenamiento.servicio';
import { OdontogramaServicio } from '../odontograma/odontograma.servicio';
import { SIMBOLOS_PREDETERMINADOS } from '../odontograma/simbolos-predeterminados';
import { CatalogoServicio } from '../catalogo/catalogo.servicio';

@Injectable()
export class UsuariosServicio {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuario_repositorio: Repository<Usuario>,
    private readonly almacenamiento_servicio: AlmacenamientoServicio,
    private readonly odontograma_servicio: OdontogramaServicio,
    private readonly catalogo_servicio: CatalogoServicio,
  ) {}

  async crear(
    registro_usuario_dto: RegistroUsuarioDto,
  ): Promise<Omit<Usuario, 'contrasena'>> {
    const { nombre, correo, contrasena, pais, codigo_pais } =
      registro_usuario_dto;

    const usuario_existente = await this.usuario_repositorio.findOne({
      where: { correo },
    });

    if (usuario_existente) {
      throw new ConflictException(
        'Ya existe una cuenta con este correo electrónico',
      );
    }

    const salt = await bcrypt.genSalt();
    const contrasena_hasheada = await bcrypt.hash(contrasena, salt);

    const nuevo_usuario = this.usuario_repositorio.create({
      nombre,
      correo,
      contrasena: contrasena_hasheada,
      pais: pais || 'Bolivia',
      codigo_pais: codigo_pais || '+591',
    });

    const usuario_guardado = await this.usuario_repositorio.save({
      ...nuevo_usuario,
      moneda_pais_iso: null,
    });
    await this.seedSimbologiaInicial(usuario_guardado.id);
    await this.catalogo_servicio.inicializarCatalogosUsuario(
      usuario_guardado.id,
    );
    const { contrasena: _, ...usuario_sin_contrasena } = usuario_guardado;
    return usuario_sin_contrasena;
  }

  private async seedSimbologiaInicial(usuario_id: number) {
    try {
      for (const simbolo of SIMBOLOS_PREDETERMINADOS) {
        try {
          await this.odontograma_servicio.crearSimbolo(usuario_id, {
            ...simbolo,
            activo: true,
          });
        } catch (error) {
          console.error(
            `Error al crear símbolo predeterminado ${simbolo.nombre}:`,
            error,
          );
        }
      }
    } catch (e) {
      console.error('Error general al sembrar simbología predeterminada:', e);
    }
  }

  async encontrarPorCorreoConContrasena(
    correo: string,
  ): Promise<Usuario | null> {
    return this.usuario_repositorio.findOne({ where: { correo } });
  }

  async encontrarPorId(id: number): Promise<Omit<Usuario, 'contrasena'>> {
    const usuario = await this.usuario_repositorio.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }
    const { contrasena, ...resultado } = usuario;

    if (resultado.avatar_ruta) {
      const avatarUrl =
        await this.almacenamiento_servicio.obtenerUrlAcceso(
          resultado.avatar_ruta,
          TipoDocumento.ARCHIVO_ADJUNTO,
        );
      (resultado as any).avatar_url = avatarUrl;
      (resultado as any).avatar = avatarUrl;
    } else {
      (resultado as any).avatar_url = null;
      (resultado as any).avatar = null;
    }

    return resultado;
  }

  private async encontrarPorIdConContrasena(id: number): Promise<Usuario> {
    const usuario = await this.usuario_repositorio.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }
    return usuario;
  }

  async actualizar(
    id: number,
    actualizar_usuario_dto: ActualizarUsuarioDto,
  ): Promise<Omit<Usuario, 'contrasena'>> {
    const { avatar, eliminar_avatar, ...resto_dto } = actualizar_usuario_dto;

    const usuario = await this.usuario_repositorio.preload({
      id,
      ...resto_dto,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }
    if (eliminar_avatar) {
      if (usuario.avatar_ruta) {
        try {
          await this.almacenamiento_servicio.eliminarArchivo(
            usuario.avatar_ruta,
            TipoDocumento.ARCHIVO_ADJUNTO,
          );
        } catch (_) {
        }
      }
      (usuario as any).avatar_ruta = null;
    } else if (typeof avatar === 'string' && avatar.trim() !== '') {
      try {
        let extension = 'png';
        let contenido = avatar;

        if (contenido.startsWith('data:')) {
          const matches = contenido.match(/^data:([^;]+);base64,/);
          if (matches && matches[1]) {
            const mime = matches[1];
            const ext = mime.split('/')[1];
            if (ext) extension = ext === 'jpeg' ? 'jpg' : ext;
          }
          contenido = contenido.replace(/^data:([^;]+);base64,/, '');
        }

        const ruta = await this.almacenamiento_servicio.guardarArchivo(
          contenido,
          extension,
          TipoDocumento.ARCHIVO_ADJUNTO,
        );

        if (usuario.avatar_ruta) {
          try {
            await this.almacenamiento_servicio.eliminarArchivo(
              usuario.avatar_ruta,
              TipoDocumento.ARCHIVO_ADJUNTO,
            );
          } catch (_) {
          }
        }

        (usuario as any).avatar_ruta = ruta;
        (usuario as any).avatar = undefined;
      } catch (_) {}
    }

    const usuario_actualizado = await this.usuario_repositorio.save(usuario);
    const { contrasena, ...resultado } = usuario_actualizado;

    if (resultado.avatar_ruta) {
      const avatarUrl =
        await this.almacenamiento_servicio.obtenerUrlAcceso(
          resultado.avatar_ruta,
          TipoDocumento.ARCHIVO_ADJUNTO,
        );
      (resultado as any).avatar_url = avatarUrl;
      (resultado as any).avatar = avatarUrl;
    } else {
      (resultado as any).avatar_url = null;
      (resultado as any).avatar = null;
    }

    return resultado;
  }

  async actualizarPais(
    id: number,
    dto: ActualizarPaisDto,
  ): Promise<Omit<Usuario, 'contrasena'>> {
    const usuario = await this.usuario_repositorio.preload({
      id,
      pais: dto.pais,
      codigo_pais: dto.codigo_pais,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }

    const usuario_actualizado = await this.usuario_repositorio.save(usuario);
    const { contrasena, ...resultado } = usuario_actualizado;
    return resultado;
  }

  async actualizarMoneda(
    id: number,
    dto: ActualizarMonedaDto,
  ): Promise<Omit<Usuario, 'contrasena'>> {
    const usuario = await this.usuario_repositorio.preload({
      id,
      moneda: dto.moneda,
      moneda_pais_iso: dto.moneda_pais_iso ?? null,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }

    const usuario_actualizado = await this.usuario_repositorio.save(usuario);
    const { contrasena, ...resultado } = usuario_actualizado;
    return resultado;
  }

  async establecerModoEdicionHistorica(
    id: number,
    valor: boolean,
  ): Promise<void> {
    await this.usuario_repositorio.update(
      { id },
      { modo_edicion_historica: valor },
    );
  }

  async cambiarContrasena(
    id: number,
    cambiar_contrasena_dto: CambiarContrasenaDto,
  ): Promise<void> {
    const { contrasena_actual, nueva_contrasena } = cambiar_contrasena_dto;
    const usuario = await this.encontrarPorIdConContrasena(id);

    const es_valida = await bcrypt.compare(
      contrasena_actual,
      usuario.contrasena,
    );
    if (!es_valida) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const salt = await bcrypt.genSalt();
    usuario.contrasena = await bcrypt.hash(nueva_contrasena, salt);

    await this.usuario_repositorio.save(usuario);
  }

  async obtenerTodos(): Promise<Usuario[]> {
    return this.usuario_repositorio.find({
      select: ['id', 'nombre', 'correo'],
      order: { nombre: 'ASC' },
    });
  }
}
