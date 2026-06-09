import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GuardarCredencialInstalacionDto {
  @IsString()
  @MaxLength(128)
  hwid_cliente: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  token?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  vl_api_base_url?: string;
}

