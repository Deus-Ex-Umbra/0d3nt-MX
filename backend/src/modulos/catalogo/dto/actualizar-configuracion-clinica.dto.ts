import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class ActualizarConfiguracionClinicaDto {
  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  logo_enlace?: string;

  @IsOptional()
  @IsString()
  nombre_clinica?: string;

  @IsOptional()
  @IsString()
  mensaje_bienvenida_antes?: string;

  @IsOptional()
  @IsString()
  mensaje_bienvenida_despues?: string;

  @IsOptional()
  @IsString()
  tema_personalizado?: string;

  @IsOptional()
  @IsString()
  horarios_laborales?: string;

  @IsOptional()
  @IsString()
  gemini_api_key?: string;

  @IsOptional()
  @IsString()
  gemini_url_base?: string;

  @IsOptional()
  @IsBoolean()
  gemini_verificado?: boolean;

  @IsOptional()
  @IsString()
  exchange_rate_api_key?: string;

  @IsOptional()
  @IsBoolean()
  exchange_rate_verificado?: boolean;

  @IsOptional()
  @IsNumber()
  cambio_dolar?: number;

  @IsOptional()
  @IsString()
  trabajar_con?: string;

  @IsOptional()
  @IsString()
  moneda_principal?: string;

  @IsOptional()
  @IsBoolean()
  moneda_configurada?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['cuadrado', 'circular'])
  modelo_dientes_odontograma?: string;
}
