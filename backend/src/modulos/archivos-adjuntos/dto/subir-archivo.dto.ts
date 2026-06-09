import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class SubirArchivoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre_archivo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipo_mime: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'Contenido del archivo en formato Base64',
    required: false,
  })
  @IsString()
  @IsOptional()
  contenido_base64?: string;

  @ApiProperty()
  @IsInt()
  paciente_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  plan_tratamiento_id?: number;
}
