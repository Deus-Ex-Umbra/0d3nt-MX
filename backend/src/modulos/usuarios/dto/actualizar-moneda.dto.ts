import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActualizarMonedaDto {
  @ApiProperty({ description: 'Moneda visual preferida del usuario' })
  @IsNotEmpty()
  @IsString()
  moneda: string;

  @ApiProperty({
    description: 'ISO del país usado para la moneda visual',
    required: false,
  })
  @IsOptional()
  @IsString()
  moneda_pais_iso?: string;
}
