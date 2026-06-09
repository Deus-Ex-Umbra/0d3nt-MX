import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearSugerenciaClienteDto {
  @IsString()
  @MaxLength(128)
  hwid_cliente: string;

  @IsString()
  @MaxLength(64)
  categoria: string;

  @IsString()
  @MaxLength(4096)
  contenido: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  imagenes?: string[];

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  celular?: string;
}
