import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SolicitarLicenciaInstalacionDto {
  @IsString()
  @MaxLength(128)
  hwid_cliente: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  origen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  app_version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  plataforma?: string;
}
