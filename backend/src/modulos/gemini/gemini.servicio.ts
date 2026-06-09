import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { ConfiguracionClinica } from '../catalogo/entidades/configuracion-clinica.entidad';

type RespuestaGemini = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

@Injectable()
export class GeminiServicio {
  private readonly api_key_env: string;
  private readonly url_base_default =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor(
    private readonly config_servicio: ConfigService,
    @InjectRepository(ConfiguracionClinica)
    private readonly configuracion_clinica_repositorio: Repository<ConfiguracionClinica>,
  ) {
    this.api_key_env = this.config_servicio.get<string>('GEMINI_API_KEY') || '';
  }

  private async obtenerConfiguracion(usuario_id: number) {
    const config = await this.configuracion_clinica_repositorio.findOne({
      where: { usuario_id },
    });

    const api_key = config?.gemini_api_key || this.api_key_env;
    const url_base = config?.gemini_url_base || this.url_base_default;

    if (!api_key) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY no está configurada (ni en .env ni en configuración de clínica)',
      );
    }

    return { api_key, url_base };
  }

  private obtenerRutaChromium(): string | undefined {
    const rutaConfigurada =
      this.config_servicio.get<string>('CHROMIUM_EXECUTABLE_PATH')?.trim() ||
      this.config_servicio.get<string>('PUPPETEER_EXECUTABLE_PATH')?.trim();

    return rutaConfigurada || undefined;
  }

  private async ejecutarSolicitudGemini(
    url: string,
    body: Record<string, unknown>,
    logPrefix: string,
    mensajeUsuario: string,
  ): Promise<string> {
    const executablePath = this.obtenerRutaChromium();
    let browser: puppeteer.Browser | undefined;

    try {
      browser = await puppeteer.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const pagina = await browser.newPage();
      await pagina.goto('about:blank');

      const resultado = await pagina.evaluate(
        async ({ requestUrl, requestBody }) => {
          try {
            const respuesta = await fetch(requestUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });

            return {
              ok: respuesta.ok,
              status: respuesta.status,
              body: await respuesta.text(),
            };
          } catch (error) {
            return {
              ok: false,
              status: 0,
              body: JSON.stringify({
                error:
                  error instanceof Error ? error.message : 'Error desconocido',
              }),
            };
          }
        },
        { requestUrl: url, requestBody: body },
      );

      let payload: RespuestaGemini | null = null;

      try {
        payload = JSON.parse(resultado.body) as RespuestaGemini;
      } catch {
        payload = null;
      }

      if (!resultado.ok) {
        console.error(logPrefix, payload?.error || resultado.body);
        throw new InternalServerErrorException(mensajeUsuario);
      }

      const texto = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!texto) {
        console.error(logPrefix, payload || resultado.body);
        throw new InternalServerErrorException(mensajeUsuario);
      }

      return texto;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      console.error(logPrefix, error instanceof Error ? error.message : error);
      throw new InternalServerErrorException(mensajeUsuario);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async generarContenido(
    usuario_id: number,
    prompt: string,
    usar_pensamiento = true,
  ): Promise<string> {
    const { api_key, url_base } = await this.obtenerConfiguracion(usuario_id);

    const data: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {},
    };

    if (!usar_pensamiento) {
      data.generationConfig = { stopSequences: [], temperature: 0 };
    }

    return this.ejecutarSolicitudGemini(
      `${url_base}?key=${api_key}`,
      data,
      'Error al comunicarse con Gemini via Puppeteer:',
      'No se pudo generar contenido desde Gemini.',
    );
  }

  async analizarImagen(
    usuario_id: number,
    imagen_base64: string,
    prompt: string,
  ): Promise<string> {
    const { api_key, url_base } = await this.obtenerConfiguracion(usuario_id);

    const data = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imagen_base64,
              },
            },
            { text: prompt },
          ],
        },
      ],
    };

    return this.ejecutarSolicitudGemini(
      `${url_base}?key=${api_key}`,
      data,
      'Error al analizar la imagen con Gemini via Puppeteer:',
      'No se pudo analizar la imagen con Gemini.',
    );
  }
}
