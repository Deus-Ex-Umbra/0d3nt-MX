import { IsString, MaxLength } from 'class-validator';

export class ActivarLicenciaClienteDto {
  @IsString()
  @MaxLength(128)
  codigo_32: string;

  @IsString()
  @MaxLength(128)
  hwid_cliente: string;

  @IsString()
  @MaxLength(128)
  hash_aceptacion_local: string;
}
