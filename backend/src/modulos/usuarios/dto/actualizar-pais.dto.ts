import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActualizarPaisDto {
  @ApiProperty({ description: 'País de residencia' })
  @IsNotEmpty()
  @IsString()
  pais: string;

  @ApiProperty({ description: 'Código telefónico del país', required: false })
  @IsOptional()
  @IsString()
  codigo_pais?: string;
}
