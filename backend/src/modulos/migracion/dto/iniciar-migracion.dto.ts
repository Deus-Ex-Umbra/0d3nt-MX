import { IsIn, IsOptional, IsString } from 'class-validator';

export type FormatoMigracion = 'zip' | 'rar' | 'tar.gz';

export class IniciarMigracionDto {
  @IsOptional()
  @IsString()
  @IsIn(['zip', 'rar', 'tar.gz'])
  formato?: FormatoMigracion;
}
