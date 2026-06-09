import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import {
  randomBytes,
  scryptSync,
  createCipheriv,
  createDecipheriv,
  createPublicKey,
  verify,
} from 'crypto';
import { EulaAceptacion } from './entidades/eula-aceptacion.entidad';
import { VlCredencial } from './entidades/vl-credencial.entidad';
import { EulaAceptacionInstalacion } from './entidades/eula-aceptacion-instalacion.entidad';
import { VlCredencialInstalacion } from './entidades/vl-credencial-instalacion.entidad';
import { AceptarEulaDto } from './dto/aceptar-eula.dto';
import { GuardarCredencialDto } from './dto/guardar-credencial.dto';
import { ActivarLicenciaClienteDto } from './dto/activar-licencia.dto';
import { AceptarEulaInstalacionDto } from './dto/aceptar-eula-instalacion.dto';
import { GuardarCredencialInstalacionDto } from './dto/guardar-credencial-instalacion.dto';
import { CrearSugerenciaClienteDto } from './dto/crear-sugerencia-cliente.dto';
import { SolicitarLicenciaInstalacionDto } from './dto/solicitar-licencia.dto';

type PaqueteActivacionVl = {
  mensaje?: string;
  llave_aes: string;
  c: string;
  t_auth: string;
  iv: string;
  s: string;
};

@Injectable()
export class LicenciamientoServicio {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(EulaAceptacion)
    private readonly eula_repo: Repository<EulaAceptacion>,
    @InjectRepository(VlCredencial)
    private readonly cred_repo: Repository<VlCredencial>,
    @InjectRepository(EulaAceptacionInstalacion)
    private readonly eula_inst_repo: Repository<EulaAceptacionInstalacion>,
    @InjectRepository(VlCredencialInstalacion)
    private readonly cred_inst_repo: Repository<VlCredencialInstalacion>,
  ) { }

  private async resolverTokenPlano(dto: GuardarCredencialInstalacionDto): Promise<string> {
    const tokenPlano = String(dto.token || '').trim();
    if (tokenPlano) return tokenPlano;
    throw new BadRequestException('Falta token.');
  }

  private obtenerClaveMaestra(): Buffer {
    const override = (this.config.get<string>('LICENCIAMIENTO_TOKEN_KEY') || '').trim();
    const base = override || (this.config.get<string>('JWT_SECRET') || '');
    if (!base) {
      throw new UnauthorizedException(
        'Falta configurar JWT_SECRET o LICENCIAMIENTO_TOKEN_KEY para cifrar credenciales.',
      );
    }
    return scryptSync(base, 'licenciamiento-vl-cred-v1', 32);
  }

  private cifrarTexto(texto: string): string {
    const key = this.obtenerClaveMaestra();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
  }

  private descifrarTexto(payload: string): string {
    const [version, ivB64, tagB64, ctB64] = String(payload || '').split(':');
    if (version !== 'v1' || !ivB64 || !tagB64 || !ctB64) {
      throw new BadRequestException('Formato de credencial cifrada inválido.');
    }
    const key = this.obtenerClaveMaestra();
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
    return plaintext.toString('utf8');
  }

  async obtenerEstadoEula(usuario_id: number) {
    if (process.env.LICENCIABLE === 'false') {
      return {
        aceptado: true,
        aceptado_en: new Date(),
        eula_version: 'bypass',
      };
    }

    const registro = await this.eula_repo.findOne({
      where: { usuario: { id: usuario_id } as any },
      order: { aceptado_en: 'DESC' },
    });

    return {
      aceptado: !!registro,
      aceptado_en: registro?.aceptado_en ?? null,
      eula_version: registro?.eula_version ?? null,
    };
  }

  async aceptarEula(usuario_id: number, dto: AceptarEulaDto, req: any) {
    const ip = (req?.ip || req?.headers?.['x-forwarded-for'] || null) as string | null;
    const userAgent = (req?.headers?.['user-agent'] || null) as string | null;

    const registro = this.eula_repo.create({
      usuario: { id: usuario_id } as any,
      ip,
      user_agent: userAgent,
      plataforma: dto.plataforma ?? null,
      hostname: dto.hostname ?? null,
      app_version: dto.app_version ?? null,
      eula_version: dto.eula_version ?? null,
      hash_aceptacion_local: dto.hash_aceptacion_local ?? null,
      dispositivo: dto.dispositivo ?? null,
    });

    const guardado = await this.eula_repo.save(registro);
    return {
      aceptado: true,
      aceptado_en: guardado.aceptado_en,
    };
  }

  private async assertEulaAceptado(usuario_id: number): Promise<void> {
    if (process.env.LICENCIABLE === 'false') return;
    const existe = await this.eula_repo.exist({
      where: { usuario: { id: usuario_id } as any },
    });
    if (!existe) {
      throw new ForbiddenException(
        'Debe aceptar el EULA antes de realizar operaciones de licencia.',
      );
    }
  }

  async obtenerEstadoCredencial(usuario_id: number) {
    await this.assertEulaAceptado(usuario_id);
    const cred = await this.cred_repo.findOne({
      where: { usuario: { id: usuario_id } as any },
    });
    return {
      configurada: !!cred,
      vl_api_base_url: cred?.vl_api_base_url ?? null,
      actualizado_en: cred?.actualizado_en ?? null,
    };
  }

  async guardarCredencial(usuario_id: number, dto: GuardarCredencialDto) {
    await this.assertEulaAceptado(usuario_id);
    const token_encriptado = this.cifrarTexto(dto.token.trim());

    const existente = await this.cred_repo.findOne({
      where: { usuario: { id: usuario_id } as any },
    });

    if (existente) {
      existente.token_encriptado = token_encriptado;
      existente.vl_api_base_url = dto.vl_api_base_url?.trim() || existente.vl_api_base_url;
      const guardado = await this.cred_repo.save(existente);
      return {
        configurada: true,
        actualizado_en: guardado.actualizado_en,
      };
    }

    const creado = await this.cred_repo.save(
      this.cred_repo.create({
        usuario: { id: usuario_id } as any,
        token_encriptado,
        vl_api_base_url: dto.vl_api_base_url?.trim() || null,
      }),
    );

    return {
      configurada: true,
      actualizado_en: creado.actualizado_en,
    };
  }

  private async obtenerCredencialDescifrada(usuario_id: number): Promise<{ token: string; baseUrl: string }> {
    const cred = await this.cred_repo.findOne({
      where: { usuario: { id: usuario_id } as any },
    });
    if (!cred) {
      throw new BadRequestException(
        'No hay credencial configurada. Guárdala antes de solicitar licencias.',
      );
    }
    const token = this.descifrarTexto(cred.token_encriptado);
    const baseUrl = this.normalizarVlBaseUrl(
      (
        cred.vl_api_base_url ||
        this.config.get<string>('VL_API_BASE_URL') ||
        this.config.get<string>('VL_BACKEND_BASE_URL') ||
        ''
      ).trim(),
    );
    if (!baseUrl) {
      throw new BadRequestException(
        'Falta configurar VL_API_BASE_URL/VL_BACKEND_BASE_URL o guardar vl_api_base_url en la credencial.',
      );
    }
    return { token, baseUrl };
  }

  private normalizarHwid(hwid: string): string {
    const normalizado = String(hwid || '').trim();
    if (!normalizado) {
      throw new BadRequestException('Falta hwid_cliente.');
    }
    if (normalizado.length > 128) {
      throw new BadRequestException('hwid_cliente demasiado largo.');
    }
    return normalizado;
  }

  private normalizarCodigoLicencia(codigo: string): string {
    const normalizado = String(codigo || '')
      .trim()
      .replace(/[\s-]+/g, '')
      .toLowerCase();

    if (!normalizado) {
      throw new BadRequestException('Falta codigo_32.');
    }
    if (!/^[a-f0-9]{32,64}$/.test(normalizado)) {
      throw new BadRequestException('codigo_32 inválido. Debe contener solo caracteres hexadecimales (32-64).');
    }

    return normalizado;
  }

  private obtenerBaseUrlVlDesdeEntorno(): string {
    return (
      (this.config.get<string>('VL_API_BASE_URL') || '').trim() ||
      (this.config.get<string>('VL_BACKEND_BASE_URL') || '').trim() ||
      ''
    );
  }

  private normalizarVlBaseUrl(baseUrl: string): string {
    const trimmed = String(baseUrl || '').trim();
    if (!trimmed) return '';

    const sinSlashFinal = trimmed.replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(sinSlashFinal)) {
      throw new BadRequestException(
        'VL_API_BASE_URL/vl_api_base_url inválida. Debe iniciar con http:// o https:// (ej: http://localhost:3001).',
      );
    }

    try {
      new URL(sinSlashFinal);
    } catch {
      throw new BadRequestException(
        'VL_API_BASE_URL/vl_api_base_url inválida. Verifica el formato de la URL.',
      );
    }

    return sinSlashFinal;
  }

  private normalizarLlavePublicaDesdeVl(valor: unknown): string | null {
    const raw = String(valor || '').trim();
    if (!raw) return null;

    if (raw.includes('BEGIN PUBLIC KEY')) {
      return raw;
    }
    try {
      const der = Buffer.from(raw, 'base64');
      if (!der?.length || der.length < 32) return null;
      const keyObj = createPublicKey({ key: der, format: 'der', type: 'spki' });
      const pem = keyObj.export({ format: 'pem', type: 'spki' }) as string;
      return pem.includes('BEGIN PUBLIC KEY') ? pem : null;
    } catch {
      return null;
    }
  }

  private async pingLlavePublicaVl(token: string, baseUrl: string): Promise<{ llave_publica: string } | null> {
    const url = `${baseUrl.replace(/\/$/, '')}/api/cliente/llave-publica`;
    const resp = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Whitelist-Key': token,
      },
      timeout: 15000,
    });
    const data = resp.data as any;
    const llave_publica = this.normalizarLlavePublicaDesdeVl(data?.llave_publica);
    if (!llave_publica) return null;
    return { llave_publica };
  }

  async obtenerEstadoInstalacion(
    hwid_cliente: string,
    opts?: { forzar_validacion?: boolean },
  ) {
    const hwid = this.normalizarHwid(hwid_cliente);

    if (process.env.LICENCIABLE === 'false') {
      return {
        hwid,
        eula_aceptado: true,
        eula_aceptado_en: new Date(),
        eula_version: 'bypass',
        credencial_configurada: true,
        credencial_valida: true,
        credencial_actualizado_en: new Date(),
        credencial_validado_en: new Date(),
        motivo: null,
      };
    }

    const eula = await this.eula_inst_repo.findOne({
      where: { hwid },
      order: { aceptado_en: 'DESC' },
    });

    const cred = await this.cred_inst_repo.findOne({ where: { hwid } });

    let credencial_valida = !!cred?.validado_en && !cred?.ultimo_error;
    let motivo: string | null = cred?.ultimo_error ?? null;
    let validado_en: Date | null = cred?.validado_en ?? null;

    if (cred && opts?.forzar_validacion) {
      const baseUrl = this.normalizarVlBaseUrl(
        (cred.vl_api_base_url || this.obtenerBaseUrlVlDesdeEntorno()).trim(),
      );
      try {
        if (!baseUrl) throw new BadRequestException('Falta configurar VL_API_BASE_URL.');
        const token = this.descifrarTexto(cred.token_encriptado);
        const ok = await this.pingLlavePublicaVl(token, baseUrl);
        if (!ok) throw new BadRequestException('Respuesta inválida al validar llave pública.');

        cred.validado_en = new Date();
        cred.ultimo_error = null;
        const guardado = await this.cred_inst_repo.save(cred);

        credencial_valida = true;
        motivo = null;
        validado_en = guardado.validado_en;
      } catch (err: any) {
        cred.validado_en = null;
        cred.ultimo_error = String(err?.response?.data?.message || err?.message || 'Llave inválida');
        await this.cred_inst_repo.save(cred);
        credencial_valida = false;
        motivo = cred.ultimo_error;
        validado_en = null;
      }
    }

    return {
      hwid,
      eula_aceptado: !!eula,
      eula_aceptado_en: eula?.aceptado_en ?? null,
      eula_version: eula?.eula_version ?? null,
      credencial_configurada: !!cred,
      credencial_valida,
      credencial_actualizado_en: cred?.actualizado_en ?? null,
      credencial_validado_en: validado_en,
      motivo,
    };
  }

  async aceptarEulaInstalacion(dto: AceptarEulaInstalacionDto, req: any) {
    const hwid = this.normalizarHwid(dto.hwid_cliente);
    const ip = (req?.ip || req?.headers?.['x-forwarded-for'] || null) as string | null;
    const userAgent = (req?.headers?.['user-agent'] || null) as string | null;

    const registro = this.eula_inst_repo.create({
      hwid,
      ip,
      user_agent: userAgent,
      plataforma: dto.plataforma ?? null,
      hostname: dto.hostname ?? null,
      app_version: dto.app_version ?? null,
      eula_version: dto.eula_version ?? null,
      hash_aceptacion_local: dto.hash_aceptacion_local ?? null,
      dispositivo: dto.dispositivo ?? null,
    });

    const guardado = await this.eula_inst_repo.save(registro);
    return { aceptado: true, aceptado_en: guardado.aceptado_en };
  }

  private async assertEulaAceptadoInstalacion(hwid: string): Promise<void> {
    if (process.env.LICENCIABLE === 'false') return;
    const existe = await this.eula_inst_repo.exist({ where: { hwid } });
    if (!existe) {
      throw new ForbiddenException('Debe aceptar el EULA antes de realizar operaciones de licencia.');
    }
  }

  async guardarCredencialInstalacion(dto: GuardarCredencialInstalacionDto) {
    const hwid = this.normalizarHwid(dto.hwid_cliente);
    await this.assertEulaAceptadoInstalacion(hwid);

    const tokenPlano = await this.resolverTokenPlano(dto);
    const token_encriptado = this.cifrarTexto(tokenPlano);
    const baseUrl = this.normalizarVlBaseUrl(
      (dto.vl_api_base_url?.trim() || this.obtenerBaseUrlVlDesdeEntorno()).trim(),
    );
    if (!baseUrl) {
      throw new BadRequestException('Falta configurar VL_API_BASE_URL o enviar vl_api_base_url.');
    }

    const existente = await this.cred_inst_repo.findOne({ where: { hwid } });
    const entidad = (existente ?? this.cred_inst_repo.create({ hwid } as any)) as VlCredencialInstalacion;
    entidad.token_encriptado = token_encriptado;
    entidad.vl_api_base_url = dto.vl_api_base_url?.trim() || entidad.vl_api_base_url || null;

    try {
      const ok = await this.pingLlavePublicaVl(tokenPlano, baseUrl);
      if (!ok) throw new BadRequestException('Respuesta inválida al validar llave pública.');
      entidad.validado_en = new Date();
      entidad.ultimo_error = null;
    } catch (err: any) {
      entidad.validado_en = null;
      entidad.ultimo_error = String(err?.response?.data?.message || err?.message || 'Llave inválida');
    }

    const guardado = (await this.cred_inst_repo.save(entidad)) as VlCredencialInstalacion;
    return {
      configurada: true,
      valida: !!guardado.validado_en && !guardado.ultimo_error,
      validado_en: guardado.validado_en,
      actualizado_en: guardado.actualizado_en,
      motivo: guardado.ultimo_error,
    };
  }

  private async obtenerCredencialInstalacionDescifrada(hwid: string): Promise<{ token: string; baseUrl: string }> {
    const cred = await this.cred_inst_repo.findOne({ where: { hwid } });
    if (!cred) {
      throw new BadRequestException('No hay credencial configurada para esta instalación.');
    }
    const token = this.descifrarTexto(cred.token_encriptado);
    const baseUrl = this.normalizarVlBaseUrl(
      (cred.vl_api_base_url || this.obtenerBaseUrlVlDesdeEntorno()).trim(),
    );
    if (!baseUrl) {
      throw new BadRequestException('Falta configurar VL_API_BASE_URL/VL_BACKEND_BASE_URL.');
    }
    return { token, baseUrl };
  }

  private async marcarCredencialInstalacionInvalida(hwid: string, motivo: string): Promise<void> {
    try {
      const cred = await this.cred_inst_repo.findOne({ where: { hwid } });
      if (!cred) return;
      cred.validado_en = null;
      cred.ultimo_error = motivo?.slice(0, 2000) || 'Llave inválida';
      await this.cred_inst_repo.save(cred);
    } catch {
    }
  }

  private lanzarErrorProxyVl(err: any, contexto: string): never {
    const status = err?.response?.status as number | undefined;
    const raw = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Error remoto en VL0d3ntApp';
    let mensaje = Array.isArray(raw) ? raw.join(' | ') : String(raw);
    const code = String(err?.code || '').toUpperCase();
    const urlIntentada = String(err?.config?.url || '').trim();
    const lowerMsg = mensaje.toLowerCase();
    if (status === 404 && lowerMsg.includes('licencia no encontrada')) {
      mensaje = 'Licencia inválida.';
    }

    if (status === 401 || status === 403) {
      throw new UnauthorizedException(mensaje);
    }
    if (!status) {
      if (code === 'ERR_INVALID_URL') {
        throw new BadRequestException(`${contexto}: URL de VL0d3ntApp inválida. ${mensaje}`);
      }

      const lowerTransport = mensaje.toLowerCase();
      const esTimeout = code === 'ECONNABORTED' || lowerTransport.includes('timeout');
      const esConexion =
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'EAI_AGAIN' ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT';

      if (esTimeout || esConexion) {
        const extraUrl = urlIntentada ? ` URL: ${urlIntentada}` : '';
        throw new BadGatewayException(
          `${contexto}: no se pudo conectar con VL0d3ntApp (${code || 'SIN_CODIGO'}). Verifica que el backend de VL esté en ejecución y que VL_API_BASE_URL sea correcta.${extraUrl}. ${mensaje}`,
        );
      }
    }

    const lower = mensaje.toLowerCase();
    const pareceCodigoInvalido =
      lower.includes('código') ||
      lower.includes('codigo') ||
      lower.includes('no encontrada') ||
      lower.includes('inválid') ||
      lower.includes('invalid');

    if (status === 400 || status === 404 || status === 409 || status === 422 || pareceCodigoInvalido) {
      throw new BadRequestException(mensaje);
    }

    if (status && status >= 500) {
      throw new BadGatewayException(`${contexto}: VL0d3ntApp respondió ${status}. ${mensaje}`);
    }

    throw new BadGatewayException(`${contexto}: no se pudo completar la operación. ${mensaje}`);
  }

  async activarLicenciaEnVlInstalacion(dto: ActivarLicenciaClienteDto) {
    const hwid = this.normalizarHwid(dto.hwid_cliente);
    const codigo_32 = this.normalizarCodigoLicencia(dto.codigo_32);
    const hash_aceptacion_local = String(dto.hash_aceptacion_local || '').trim();

    if (!hash_aceptacion_local) {
      throw new BadRequestException('Falta hash_aceptacion_local.');
    }

    await this.assertEulaAceptadoInstalacion(hwid);
    const { token, baseUrl } = await this.obtenerCredencialInstalacionDescifrada(hwid);

    const activarUrl = `${baseUrl.replace(/\/$/, '')}/api/cliente/activar`;
    let resp: any;
    try {
      resp = await axios.post(
        activarUrl,
        {
          codigo_32,
          hwid_cliente: hwid,
          hash_aceptacion_local,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Whitelist-Key': token,
          },
          timeout: 20000,
        },
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        const motivo = String(err?.response?.data?.message || err?.message || 'Llave inválida');
        await this.marcarCredencialInstalacionInvalida(hwid, motivo);
        throw new UnauthorizedException(motivo);
      }
      this.lanzarErrorProxyVl(err, 'Error al activar licencia');
    }
    const paquete = resp.data as PaqueteActivacionVl;
    const llaveOk = await this.pingLlavePublicaVl(token, baseUrl);
    if (!llaveOk) {
      throw new BadRequestException('Respuesta de llave pública inválida desde VL.');
    }
    this.verificarPaqueteEd25519(llaveOk.llave_publica, paquete);

    const payload = this.desencriptarPayload(paquete);
    const hwidAutorizado = String(payload?.hwid_autorizado || '');
    if (hwidAutorizado && hwidAutorizado !== hwid) {
      throw new BadRequestException('HWID no coincide con la licencia emitida.');
    }


    return {
      mensaje: paquete.mensaje || 'Activación exitosa',
      llave_publica: llaveOk.llave_publica,
      paquete: {
        llave_aes: paquete.llave_aes,
        c: paquete.c,
        t_auth: paquete.t_auth,
        iv: paquete.iv,
        s: paquete.s,
      },
      firma_valida: true,
    };
  }

  async crearSugerenciaEnVlInstalacion(dto: CrearSugerenciaClienteDto) {
    const hwid = this.normalizarHwid(dto.hwid_cliente);
    await this.assertEulaAceptadoInstalacion(hwid);
    const { token, baseUrl } = await this.obtenerCredencialInstalacionDescifrada(hwid);

    const url = `${baseUrl.replace(/\/$/, '')}/api/sugerencias`;
    let resp: any;
    try {
      resp = await axios.post(
        url,
        {
          categoria: dto.categoria,
          contenido: dto.contenido,
          imagenes: dto.imagenes || [],
          correo: dto.correo,
          celular: dto.celular,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Whitelist-Key': token,
          },
          timeout: 20000,
        },
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        const motivo = String(err?.response?.data?.message || err?.message || 'Llave inválida');
        await this.marcarCredencialInstalacionInvalida(hwid, motivo);
        throw new UnauthorizedException(motivo);
      }
      this.lanzarErrorProxyVl(err, 'Error al enviar sugerencia');
    }

    return resp.data;
  }

  async solicitarLicenciaEnVlInstalacion(dto: SolicitarLicenciaInstalacionDto) {
    const hwid = this.normalizarHwid(dto.hwid_cliente);
    await this.assertEulaAceptadoInstalacion(hwid);
    const { token, baseUrl } = await this.obtenerCredencialInstalacionDescifrada(hwid);

    const url = `${baseUrl.replace(/\/$/, '')}/api/licencias/solicitar`;
    let resp: any;
    try {
      resp = await axios.post(
        url,
        {
          hwid_cliente: hwid,
          origen: String(dto.origen || '').trim() || '0d3nt-electron',
          app_version: String(dto.app_version || '').trim() || undefined,
          plataforma: String(dto.plataforma || '').trim() || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Whitelist-Key': token,
          },
          timeout: 20000,
        },
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        const motivo = String(err?.response?.data?.message || err?.message || 'Llave inválida');
        await this.marcarCredencialInstalacionInvalida(hwid, motivo);
        throw new UnauthorizedException(motivo);
      }
      this.lanzarErrorProxyVl(err, 'Error al solicitar licencia');
    }

    const data = resp.data as any;
    return {
      id_licencia: data?.id_licencia,
      estado: data?.estado,
      fecha_creacion: data?.fecha_creacion,
    };
  }

  async obtenerEstadoSolicitudLicenciaEnVlInstalacion(datos: { hwid_cliente: string; id_licencia: string }) {
    const hwid = this.normalizarHwid(datos.hwid_cliente);
    await this.assertEulaAceptadoInstalacion(hwid);
    const { token, baseUrl } = await this.obtenerCredencialInstalacionDescifrada(hwid);

    const url = `${baseUrl.replace(/\/$/, '')}/api/licencias/solicitud/${encodeURIComponent(datos.id_licencia)}`;
    let resp: any;
    try {
      resp = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Whitelist-Key': token,
        },
        timeout: 20000,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        const motivo = String(err?.response?.data?.message || err?.message || 'Llave inválida');
        await this.marcarCredencialInstalacionInvalida(hwid, motivo);
        throw new UnauthorizedException(motivo);
      }
      this.lanzarErrorProxyVl(err, 'Error al consultar estado de solicitud');
    }

    return resp.data;
  }

  async obtenerLlavePublicaDesdeVl(usuario_id: number) {
    await this.assertEulaAceptado(usuario_id);
    const { token, baseUrl } = await this.obtenerCredencialDescifrada(usuario_id);

    const ok = await this.pingLlavePublicaVl(token, baseUrl);
    if (!ok) {
      throw new BadRequestException('Respuesta de llave pública inválida desde VL.');
    }
    return ok;
  }

  private verificarPaqueteEd25519(llavePublicaPem: string, paquete: PaqueteActivacionVl): void {
    const { c, t_auth, s } = paquete;
    if (!c || !t_auth || !s) {
      throw new BadRequestException('Paquete de activación incompleto.');
    }

    const data = Buffer.from(`${c}${t_auth}`, 'utf8');
    const signature = Buffer.from(s, 'hex');

    const keyObj = createPublicKey(llavePublicaPem);
    const ok = verify(null, data, keyObj, signature);
    if (!ok) {
      throw new BadRequestException('Firma Ed25519 inválida. Posible manipulación.');
    }
  }

  private desencriptarPayload(paquete: PaqueteActivacionVl): any {
    const key = Buffer.from(paquete.llave_aes, 'hex');
    const iv = Buffer.from(paquete.iv, 'hex');
    const tag = Buffer.from(paquete.t_auth, 'hex');
    const ciphertext = Buffer.from(paquete.c, 'hex');

    if (key.length !== 32) {
      throw new BadRequestException('llave_aes inválida (se esperaban 32 bytes).');
    }

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

    try {
      return JSON.parse(plaintext);
    } catch {
      throw new BadRequestException('Payload desencriptado no es JSON válido.');
    }
  }

  async activarLicenciaEnVl(usuario_id: number, dto: ActivarLicenciaClienteDto) {
    await this.assertEulaAceptado(usuario_id);
    const { token, baseUrl } = await this.obtenerCredencialDescifrada(usuario_id);

    const activarUrl = `${baseUrl.replace(/\/$/, '')}/api/cliente/activar`;

    let resp: any;
    try {
      resp = await axios.post(activarUrl, dto, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Whitelist-Key': token,
        },
        timeout: 20000,
      });
    } catch (err: any) {
      this.lanzarErrorProxyVl(err, 'Error al activar licencia');
    }

    const paquete = resp.data as PaqueteActivacionVl;
    const llaveResp = await this.obtenerLlavePublicaDesdeVl(usuario_id);
    const llavePem = this.normalizarLlavePublicaDesdeVl(llaveResp?.llave_publica);
    if (!llavePem) {
      throw new BadRequestException('Respuesta de llave pública inválida desde VL.');
    }

    this.verificarPaqueteEd25519(llavePem, paquete);

    const payload = this.desencriptarPayload(paquete);
    const hwidAutorizado = String(payload?.hwid_autorizado || '');
    if (hwidAutorizado && hwidAutorizado !== dto.hwid_cliente) {
      throw new BadRequestException('HWID no coincide con la licencia emitida.');
    }

    return {
      mensaje: paquete.mensaje || 'Activación exitosa',
      paquete: {
        llave_aes: paquete.llave_aes,
        c: paquete.c,
        t_auth: paquete.t_auth,
        iv: paquete.iv,
        s: paquete.s,
      },
      firma_valida: true,
    };
  }
}
