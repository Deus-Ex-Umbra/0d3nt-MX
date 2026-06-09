import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { resolveDocsDir } from '../../common/utils/docs-dir';

export enum TipoDocumento {
  ARCHIVO_ADJUNTO = 'archivos-adjuntos',
  REPORTE = 'reportes',
  PLANTILLA_CONSENTIMIENTO = 'plantillas-consentimiento',
  EDICION_IMAGEN = 'ediciones-imagenes',
  BACKUP = 'backups',
}

@Injectable()
export class AlmacenamientoServicio {
  private readonly ruta_base!: string;
  private readonly is_cloud: boolean;
  private readonly s3_client!: S3Client;
  private readonly bucket_name!: string;
  private readonly logger = new Logger(AlmacenamientoServicio.name);

  constructor(private readonly config_servicio: ConfigService) {
    this.is_cloud = this.config_servicio.get<string>('CLOUD') === 'true';

    if (this.is_cloud) {
      this.bucket_name =
        this.config_servicio.get<string>('AWS_S3_BUCKET_NAME')!;
      this.s3_client = new S3Client({
        region: this.config_servicio.get<string>('AWS_REGION')!,
        credentials: {
          accessKeyId: this.config_servicio.get<string>('AWS_ACCESS_KEY_ID')!,
          secretAccessKey: this.config_servicio.get<string>(
            'AWS_SECRET_ACCESS_KEY',
          )!,
        },
      });
      this.logger.log(
        `Modo almacenamiento: CLOUD (S3 Bucket: ${this.bucket_name})`,
      );
    } else {
      const rutaLegacy = path.resolve('./docs-0d3nt');
      this.ruta_base = resolveDocsDir(
        this.config_servicio.get<string>('DOCS_0D3NT_DIR'),
        this.config_servicio.get<string>('IS_SERVERLESS'),
      );
      this.migrarLegacySiCorresponde(rutaLegacy, this.ruta_base).catch(() => {
      });

      this.inicializarDirectorios();
      this.logger.log(`Modo almacenamiento: LOCAL (Ruta: ${this.ruta_base})`);
    }
  }

  private async migrarLegacySiCorresponde(
    rutaLegacy: string,
    rutaDestino: string,
  ): Promise<void> {
    try {
      if (!rutaLegacy || !rutaDestino) return;
      if (path.resolve(rutaLegacy) === path.resolve(rutaDestino)) return;
      if (!fs.existsSync(rutaLegacy)) return;
      if (fs.existsSync(rutaDestino)) return;

      await fsp.mkdir(path.dirname(rutaDestino), { recursive: true });
      try {
        fs.renameSync(rutaLegacy, rutaDestino);
        this.logger.log(
          `docs-0d3nt migrado: ${rutaLegacy} -> ${rutaDestino} (rename)`,
        );
        return;
      } catch {
      }

      await fsp.cp(rutaLegacy, rutaDestino, { recursive: true });
      await fsp.rm(rutaLegacy, { recursive: true, force: true });
      this.logger.log(
        `docs-0d3nt migrado: ${rutaLegacy} -> ${rutaDestino} (copy)`,
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo migrar docs-0d3nt legacy (${rutaLegacy} -> ${rutaDestino}).`,
      );
      this.logger.debug(error as any);
    }
  }

  private inicializarDirectorios(): void {
    if (this.is_cloud) return;

    if (!fs.existsSync(this.ruta_base)) {
      fs.mkdirSync(this.ruta_base, { recursive: true });
    }
    Object.values(TipoDocumento).forEach((tipo) => {
      const ruta = path.join(this.ruta_base, tipo);
      if (!fs.existsSync(ruta)) {
        fs.mkdirSync(ruta, { recursive: true });
      }
    });
  }

  private asegurarDirectorio(ruta: string): void {
    if (this.is_cloud) return;

    if (!fs.existsSync(ruta)) {
      fs.mkdirSync(ruta, { recursive: true });
    }
  }

  private obtenerRutaTipo(tipo: TipoDocumento): string {
    return this.is_cloud ? tipo : path.join(this.ruta_base, tipo);
  }

  private esErrorConCodigo(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === 'object' && error !== null && 'code' in error;
  }

  async guardarArchivo(
    contenido_base64: string,
    extension: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
    nombre_personalizado?: string,
  ): Promise<string> {
    try {
      const nombre_archivo = nombre_personalizado
        ? `${nombre_personalizado}.${extension}`
        : `${randomUUID()}.${extension}`;

      const buffer = Buffer.from(contenido_base64, 'base64');

      if (this.is_cloud) {
        const key = `${tipo}/${nombre_archivo}`;
        const mime_type = this.obtenerMimeType(extension);
        const command = new PutObjectCommand({
          Bucket: this.bucket_name,
          Key: key,
          Body: buffer,
          ContentType: mime_type,
          ContentDisposition: `inline`,
        });
        await this.s3_client.send(command);
      } else {
        const ruta_directorio = this.obtenerRutaTipo(tipo);
        await fsp.mkdir(ruta_directorio, { recursive: true });
        const ruta_completa = path.join(ruta_directorio, nombre_archivo);
        await fsp.writeFile(ruta_completa, buffer);
      }

      return nombre_archivo;
    } catch (error) {
      this.logger.error('Error al guardar archivo:', error);
      throw new InternalServerErrorException('Error al guardar el archivo');
    }
  }

  async guardarArchivoDesdeBuffer(
    buffer: Buffer,
    extension: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
    nombre_personalizado?: string,
  ): Promise<string> {
    try {
      const nombre_archivo = nombre_personalizado
        ? `${nombre_personalizado}.${extension}`
        : `${randomUUID()}.${extension}`;

      if (this.is_cloud) {
        const key = `${tipo}/${nombre_archivo}`;
        const mime_type = this.obtenerMimeType(extension);
        const command = new PutObjectCommand({
          Bucket: this.bucket_name,
          Key: key,
          Body: buffer,
          ContentType: mime_type,
          ContentDisposition: `inline`,
        });
        await this.s3_client.send(command);
      } else {
        const ruta_directorio = this.obtenerRutaTipo(tipo);
        await fsp.mkdir(ruta_directorio, { recursive: true });
        const ruta_completa = path.join(ruta_directorio, nombre_archivo);
        await fsp.writeFile(ruta_completa, buffer);
      }

      return nombre_archivo;
    } catch (error) {
      this.logger.error('Error al guardar archivo desde buffer:', error);
      throw new InternalServerErrorException('Error al guardar el archivo');
    }
  }

  async leerArchivo(
    nombre_archivo: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
  ): Promise<string> {
    try {
      if (this.is_cloud) {
        const buffer = await this.leerArchivoComoBuffer(nombre_archivo, tipo);
        return buffer.toString('base64');
      } else {
        const ruta_completa = path.join(
          this.obtenerRutaTipo(tipo),
          nombre_archivo,
        );

        try {
          const buffer = await fsp.readFile(ruta_completa);
          return buffer.toString('base64');
        } catch (error) {
          if (this.esErrorConCodigo(error) && error.code === 'ENOENT') {
            throw new InternalServerErrorException('Archivo no encontrado');
          }
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Error al leer archivo:', error);
      throw new InternalServerErrorException('Error al leer el archivo');
    }
  }

  async leerArchivoComoBuffer(
    nombre_archivo: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
  ): Promise<Buffer> {
    try {
      if (this.is_cloud) {
        const key = `${tipo}/${nombre_archivo}`;
        const command = new GetObjectCommand({
          Bucket: this.bucket_name,
          Key: key,
        });
        const response = await this.s3_client.send(command);
        const stream = response.Body as Readable;

        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on('error', (err) => reject(err));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      } else {
        const ruta_completa = path.join(
          this.obtenerRutaTipo(tipo),
          nombre_archivo,
        );

        try {
          return await fsp.readFile(ruta_completa);
        } catch (error) {
          if (this.esErrorConCodigo(error) && error.code === 'ENOENT') {
            throw new InternalServerErrorException('Archivo no encontrado');
          }
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Error al leer archivo como buffer:', error);
      throw new InternalServerErrorException('Error al leer el archivo');
    }
  }

  async obtenerStreamArchivo(
    nombre_archivo: string,
    tipo: TipoDocumento,
  ): Promise<Readable> {
    try {
      if (this.is_cloud) {
        const key = `${tipo}/${nombre_archivo}`;
        const command = new GetObjectCommand({
          Bucket: this.bucket_name,
          Key: key,
        });
        const response = await this.s3_client.send(command);
        return response.Body as Readable;
      } else {
        const ruta_completa = path.join(
          this.obtenerRutaTipo(tipo),
          nombre_archivo,
        );
        if (!fs.existsSync(ruta_completa)) {
          throw new InternalServerErrorException('Archivo no encontrado');
        }
        return fs.createReadStream(ruta_completa);
      }
    } catch (error) {
      this.logger.error('Error al obtener stream de archivo:', error);
      throw new InternalServerErrorException('Error al leer el archivo');
    }
  }

  async eliminarArchivo(
    nombre_archivo: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
  ): Promise<void> {
    try {
      if (this.is_cloud) {
        const key = `${tipo}/${nombre_archivo}`;
        const command = new DeleteObjectCommand({
          Bucket: this.bucket_name,
          Key: key,
        });
        await this.s3_client.send(command);
      } else {
        const ruta_completa = path.join(
          this.obtenerRutaTipo(tipo),
          nombre_archivo,
        );
        try {
          await fsp.unlink(ruta_completa);
        } catch (error) {
          if (!this.esErrorConCodigo(error) || error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
    } catch (error) {
      this.logger.error('Error al eliminar archivo:', error);
      throw new InternalServerErrorException('Error al eliminar el archivo');
    }
  }

  async obtenerUrlAcceso(
    nombre_archivo: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
  ): Promise<string> {
    try {
      if (this.is_cloud) {
        const cdn = this.config_servicio.get<string>('AWS_S3_CDN');
        if (cdn && cdn.trim() !== '') {
          return `${cdn}/${tipo}/${nombre_archivo}`;
        }

        const extension = (nombre_archivo.split('.').pop() || '').toLowerCase();
        const mime_type = this.obtenerMimeType(extension);

        const key = `${tipo}/${nombre_archivo}`;
        const command = new GetObjectCommand({
          Bucket: this.bucket_name,
          Key: key,
          ResponseContentType: mime_type,
          ResponseContentDisposition: 'inline',
        });

        return await getSignedUrl(this.s3_client, command, { expiresIn: 3600 });
      } else {
        const base_url = this.config_servicio.get<string>(
          'BASE_URL',
          'http://localhost:3000',
        );
        return `${base_url}/docs-0d3nt/${tipo}/${nombre_archivo}`;
      }
    } catch (error) {
      this.logger.error('Error al generar URL de acceso:', error);
      return '';
    }
  }

  async obtenerUrlAccesoSinCdn(
    nombre_archivo: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
  ): Promise<string> {
    try {
      if (!this.is_cloud) {
        return this.obtenerUrlAcceso(nombre_archivo, tipo);
      }

      const extension = (nombre_archivo.split('.').pop() || '').toLowerCase();
      const mime_type = this.obtenerMimeType(extension);

      const key = `${tipo}/${nombre_archivo}`;
      const command = new GetObjectCommand({
        Bucket: this.bucket_name,
        Key: key,
        ResponseContentType: mime_type,
        ResponseContentDisposition: 'inline',
      });

      return await getSignedUrl(this.s3_client, command, { expiresIn: 3600 });
    } catch (error) {
      this.logger.error('Error al generar URL de acceso (sin CDN):', error);
      return '';
    }
  }

  obtenerRutaArchivo(
    nombre_archivo: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
  ): string {
    if (this.is_cloud) {
      return `${tipo}/${nombre_archivo}`;
    }
    return path.join(this.obtenerRutaTipo(tipo), nombre_archivo);
  }

  async existeArchivo(
    nombre_archivo: string,
    tipo: TipoDocumento = TipoDocumento.ARCHIVO_ADJUNTO,
  ): Promise<boolean> {
    if (this.is_cloud) {
      try {
        const key = `${tipo}/${nombre_archivo}`;
        const command = new GetObjectCommand({
          Bucket: this.bucket_name,
          Key: key,
          Range: 'bytes=0-0',
        });
        await this.s3_client.send(command);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      const ruta_completa = path.join(
        this.obtenerRutaTipo(tipo),
        nombre_archivo,
      );
      return fs.existsSync(ruta_completa);
    }
  }

  async listarArchivos(tipo: TipoDocumento): Promise<string[]> {
    try {
      if (this.is_cloud) {
        this.logger.warn(
          'Listar archivos no implementado completamente para S3',
        );
        return [];
      } else {
        const ruta_directorio = this.obtenerRutaTipo(tipo);
        if (!fs.existsSync(ruta_directorio)) {
          return [];
        }
        return fs.readdirSync(ruta_directorio);
      }
    } catch (error) {
      this.logger.error('Error al listar archivos:', error);
      return [];
    }
  }

  obtenerRutaBase(): string {
    return this.ruta_base || '';
  }

  private obtenerMimeType(extension: string): string {
    const ext = extension.toLowerCase().replace('.', '');
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }
}
