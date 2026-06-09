import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class AceptarEulaDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  eula_version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  hash_aceptacion_local?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  plataforma?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  hostname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  app_version?: string;

  @IsOptional()
  @IsObject()
  dispositivo?: Record<string, any>;
}
