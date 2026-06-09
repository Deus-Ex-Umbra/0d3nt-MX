import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export enum TipoAjuste {
  INCREMENTO = 'incremento',
  DECREMENTO = 'decremento',
  ESTABLECER = 'establecer',
}

export class AjustarStockDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsInt()
  producto_id: number;

  @ApiPropertyOptional({
    description: 'ID del material específico (para productos con lote/serie)',
  })
  @IsOptional()
  @IsInt()
  material_id?: number;

  @ApiProperty({ enum: TipoAjuste, description: 'Tipo de ajuste' })
  @IsEnum(TipoAjuste)
  tipo_ajuste: TipoAjuste;

  @ApiProperty({ description: 'Cantidad a ajustar o nueva cantidad' })
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiProperty({ description: 'Motivo del ajuste (requerido para auditoría)' })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({
    description: 'Generar movimiento financiero (para incrementar/disminuir)',
  })
  @IsOptional()
  generar_movimiento_financiero?: boolean;

  @ApiPropertyOptional({ description: 'Monto del movimiento financiero' })
  @IsOptional()
  monto?: number;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Fecha del ajuste' })
  @IsOptional()
  @IsDateString()
  fecha?: string;
}
