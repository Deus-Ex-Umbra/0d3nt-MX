import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  ValidateIf,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReservaConsumibleDto {
  @ApiProperty({ description: 'ID del material (entidad) a reservar' })
  @IsInt()
  material_id: number;

  @ApiProperty({ description: 'Cantidad a reservar' })
  @IsNumber()
  @Min(0)
  cantidad: number;
}

export class ReservaActivoDto {
  @ApiProperty({ description: 'ID del activo fijo a reservar' })
  @IsInt()
  activo_id: number;
}

export class CrearCitaDto {
  @ApiProperty({
    required: false,
    description:
      'ID del paciente (obligatorio si se quiere monto y estado de pago)',
  })
  @IsOptional()
  @IsInt()
  paciente_id?: number;

  @ApiProperty({
    required: false,
    description: 'ID del plan de tratamiento al que pertenece la cita',
  })
  @IsOptional()
  @IsInt()
  plan_tratamiento_id?: number;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  fecha: Date;

  @ApiProperty()
  @IsString()
  descripcion: string;

  @ApiProperty({
    required: false,
    enum: ['pendiente', 'pagado', 'cancelado'],
    description: 'Solo para citas con paciente',
  })
  @ValidateIf((o) => o.paciente_id !== undefined && o.paciente_id !== null)
  @IsOptional()
  @IsIn(['pendiente', 'pagado', 'cancelado'])
  estado_pago?: string;

  @ApiProperty({ required: false, description: 'Solo para citas con paciente' })
  @ValidateIf((o) => o.paciente_id !== undefined && o.paciente_id !== null)
  @IsOptional()
  @IsNumber()
  monto_esperado?: number;

  @ApiProperty({ required: false, description: 'Monto esperado en USD' })
  @IsOptional()
  @IsNumber()
  monto_esperado_usd?: number;

  @ApiProperty({ required: false, description: 'Tasa de cambio aplicada' })
  @IsOptional()
  @IsNumber()
  tasa_cambio?: number;

  @ApiProperty({
    required: false,
    description: 'Horas aproximadas de duración',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  horas_aproximadas?: number;
  @ApiProperty({
    required: false,
    description: 'Minutos aproximados de duración',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minutos_aproximados?: number;

  @ApiProperty({
    required: false,
    enum: ['mantener', 'reembolsar', 'eliminar'],
    description:
      'Acción a tomar con el pago si se cambia una cita desde pagado a pendiente o cancelado',
  })
  @IsOptional()
  @IsString()
  @IsIn(['mantener', 'reembolsar', 'eliminar'])
  accion_cancelacion_pago?: string;

  @ApiProperty({
    required: false,
    description: 'Consumibles a reservar para esta cita',
    type: [ReservaConsumibleDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservaConsumibleDto)
  consumibles?: ReservaConsumibleDto[];
  @ApiProperty({
    required: false,
    description: 'Activos fijos a reservar para esta cita',
    type: [ReservaActivoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservaActivoDto)
  activos_fijos?: ReservaActivoDto[];
}
