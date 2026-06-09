import { IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class CrearNuevaVersionDto {
  @IsOptional()
  @IsBoolean()
  clonar?: boolean;

  @IsOptional()
  @IsEnum(['adulto', 'nino'])
  tipo?: 'adulto' | 'nino';
}
