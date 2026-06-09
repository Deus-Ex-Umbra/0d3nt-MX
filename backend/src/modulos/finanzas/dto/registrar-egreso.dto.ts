import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegistrarEgresoDto {
  @ApiProperty({
    description:
      'ID del plan de tratamiento al que se asocia el egreso (opcional)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  plan_tratamiento_id?: number;

  @ApiProperty({
    description: 'ID de la cita a la que se asocia el egreso (opcional)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  cita_id?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concepto: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  fecha: Date;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  monto: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_usd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  tasa_cambio?: number;
}
