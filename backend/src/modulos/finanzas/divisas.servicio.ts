import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionClinica } from '../catalogo/entidades/configuracion-clinica.entidad';
import axios from 'axios';

@Injectable()
export class DivisasServicio {
  constructor(
    @InjectRepository(ConfiguracionClinica)
    private configRepo: Repository<ConfiguracionClinica>,
  ) {}

  async obtenerConfiguracion(
    usuario_id?: number,
  ): Promise<ConfiguracionClinica> {
    const where: any = {};
    if (usuario_id) where.usuario_id = usuario_id;

    let config = await this.configRepo.findOne({ where });
    if (!config) {
      config = this.configRepo.create({
        cambio_dolar: 1,
        usuario_id: usuario_id,
      });
      await this.configRepo.save(config);
    }
    return config;
  }

  async guardarApiKey(usuario_id: number, apiKey: string): Promise<void> {
    const config = await this.obtenerConfiguracion(usuario_id);
    config.exchange_rate_api_key = apiKey;
    config.exchange_rate_verificado = false;
    await this.configRepo.save(config);
  }

  async validarYObtenerTasa(
    usuario_id: number,
    apiKey: string | null,
    monedaLocal: string,
  ): Promise<{ tasa: number; verificado: boolean }> {
    const config = await this.obtenerConfiguracion(usuario_id);
    const keyToUse = apiKey || config?.exchange_rate_api_key;

    if (!keyToUse) {
      throw new BadRequestException('API Key no proporcionada ni configurada');
    }

    if (!monedaLocal) {
      throw new BadRequestException('Moneda local no especificada');
    }

    if (!apiKey && monedaLocal === 'USD') {
      return { tasa: 1, verificado: true };
    }

    try {
      const url = `https://v6.exchangerate-api.com/v6/${keyToUse}/latest/USD`;
      console.log(
        `Consultando tasa: ${url} (Key oculta: ${keyToUse.substring(0, 5)}...)`,
      );

      const response = await axios.get(url);

      if (response.data.result === 'success') {
        const rates = response.data.conversion_rates;
        const tasa = rates[monedaLocal];

        if (monedaLocal !== 'USD' && tasa === undefined) {
          throw new NotFoundException(
            `La moneda ${monedaLocal} no se encuentra disponible en la API.`,
          );
        }
        const tasaFinal = monedaLocal === 'USD' ? 1 : tasa;
        if (
          !apiKey ||
          apiKey === config.exchange_rate_api_key ||
          (apiKey && config.exchange_rate_api_key === apiKey)
        ) {
          config.exchange_rate_verificado = true;
          config.cambio_dolar = tasaFinal;
          await this.configRepo.save(config);
        }

        return { tasa: tasaFinal, verificado: true };
      } else {
        console.error('API Error Response:', response.data);
        throw new BadRequestException(
          `Error en la API: ${response.data['error-type']}`,
        );
      }
    } catch (error) {
      console.error('Error axios finanzas:', error);
      let mensaje = 'Error al consultar la tasa de cambio';

      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new InternalServerErrorException(
            'No hay conexión a internet o el servicio no responde',
          );
        }
        const status = error.response.status;
        const data = error.response.data;
        console.error(`Axios status: ${status}, data:`, data);

        if (status === 403) {
          mensaje = 'API Key inválida (403 Forbidden). Verifique su clave.';
        } else if (status === 404) {
          mensaje = 'Recurso no encontrado (404). Verifique la API Key.';
        } else if (data && data['error-type']) {
          const type = data['error-type'];
          if (type === 'invalid-key') mensaje = 'API Key inválida';
          if (type === 'inactive-account')
            mensaje = 'La cuenta de la API está inactiva';
          if (type === 'quota-reached')
            mensaje = 'Has superado tu cuota de solicitudes mensuales.';
        } else {
          mensaje = `Error de API (${status}): ${JSON.stringify(data)}`;
        }
      }
      throw new BadRequestException(mensaje);
    }
  }
}
