import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsObject,
  IsEnum,
} from 'class-validator';
import { CategoriaSimboloOdontograma } from '../entidades/simbolo-odontograma.entidad';

export class CrearSimboloOdontogramaDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsString()
  imagen_base64: string;

  @IsOptional()
  @IsEnum(CategoriaSimboloOdontograma)
  categoria?: CategoriaSimboloOdontograma;

  @IsOptional()
  @IsString()
  color_primario?: string;

  @IsOptional()
  @IsString()
  color_secundario?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsObject()
  datos_canvas?: any;
}
