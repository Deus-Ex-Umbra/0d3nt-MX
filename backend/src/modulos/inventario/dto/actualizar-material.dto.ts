import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';

export class ActualizarMaterialDto {
  @ApiPropertyOptional({
    description:
      'Nueva fecha de vencimiento (ISO). Enviar null para limpiar el vencimiento.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf(
    (o) => o.fecha_vencimiento !== null && o.fecha_vencimiento !== undefined,
  )
  @IsDateString()
  fecha_vencimiento?: string | null;
}
