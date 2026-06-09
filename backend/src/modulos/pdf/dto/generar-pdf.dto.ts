import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class MargenesDto {
  @ApiProperty({ description: 'Margen superior en mm' })
  @IsNumber()
  @Min(0)
  top: number;

  @ApiProperty({ description: 'Margen derecho en mm' })
  @IsNumber()
  @Min(0)
  right: number;

  @ApiProperty({ description: 'Margen inferior en mm' })
  @IsNumber()
  @Min(0)
  bottom: number;

  @ApiProperty({ description: 'Margen izquierdo en mm' })
  @IsNumber()
  @Min(0)
  left: number;
}

class ConfiguracionPdfDto {
  @ApiProperty({ description: 'Ancho de página en mm' })
  @IsNumber()
  @Min(1)
  widthMm: number;

  @ApiProperty({ description: 'Alto de página en mm' })
  @IsNumber()
  @Min(1)
  heightMm: number;

  @ApiProperty({ description: 'Márgenes en mm' })
  @IsObject()
  @ValidateNested()
  @Type(() => MargenesDto)
  margenes: MargenesDto;
}

export class GenerarPdfDto {
  @ApiProperty({ description: 'Contenido HTML a convertir en PDF' })
  @IsString()
  contenido_html: string;

  @ApiProperty({ description: 'Configuración del documento' })
  @IsObject()
  @ValidateNested()
  @Type(() => ConfiguracionPdfDto)
  config: ConfiguracionPdfDto;
}
