import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PiezaAfectadaDto {
  @IsNumber()
  numero_pieza: number;

  @IsArray()
  @IsString({ each: true })
  partes: string[];
}

export class TransformacionDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  escala: number;

  @IsOptional()
  @IsBoolean()
  espejo_x?: boolean;

  @IsOptional()
  @IsBoolean()
  espejo_y?: boolean;

  @IsNumber()
  @IsOptional()
  rotacion?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  hover_color?: string;

  @IsOptional()
  @IsEnum(['REALIZADO', 'POR_REALIZAR'])
  estado?: 'REALIZADO' | 'POR_REALIZAR';
}

export class CrearOdontogramaDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsEnum(['adulto', 'nino'])
  tipo?: 'adulto' | 'nino';

  @IsOptional()
  datos_pintado?: any;

  @IsOptional()
  configuracion_dientes?: any;
}

export class AplicarSimboloDto {
  @IsNumber()
  simbolo_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PiezaAfectadaDto)
  piezas_afectadas: PiezaAfectadaDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TransformacionDto)
  transformacion?: TransformacionDto;
}

export class ActualizarAplicacionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PiezaAfectadaDto)
  piezas_afectadas?: PiezaAfectadaDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TransformacionDto)
  transformacion?: TransformacionDto;
}
