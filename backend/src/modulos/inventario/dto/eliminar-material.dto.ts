import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EliminarMaterialDto {
  @ApiProperty({ description: 'Motivo de la eliminación (requerido)' })
  @IsString()
  @IsNotEmpty()
  motivo: string;
}
