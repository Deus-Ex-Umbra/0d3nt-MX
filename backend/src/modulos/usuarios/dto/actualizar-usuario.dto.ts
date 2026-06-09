import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ActualizarUsuarioDto {
  @ApiProperty({ description: 'Nuevo nombre del usuario', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({
    description: 'Nueva imagen de avatar del usuario en formato Base64',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'Permite eliminar el avatar actual del usuario',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  eliminar_avatar?: boolean;

  @ApiProperty({ description: 'País del usuario', required: false })
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiProperty({ description: 'Código de país del usuario', required: false })
  @IsOptional()
  @IsString()
  codigo_pais?: string;

  @ApiProperty({ description: 'Moneda preferida del usuario', required: false })
  @IsOptional()
  @IsString()
  moneda?: string;

  @ApiProperty({
    description: 'ISO del país asociado a la moneda visual',
    required: false,
  })
  @IsOptional()
  @IsString()
  moneda_pais_iso?: string;

  @ApiProperty({
    description: 'Activa el modo de edición histórica para el usuario',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  modo_edicion_historica?: boolean;
}
