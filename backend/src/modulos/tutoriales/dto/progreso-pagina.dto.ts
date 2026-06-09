export class TutorialInfoDto {
  nombre: string;
  titulo: string;
  completado: boolean;
  bloqueado: boolean;
  condicion_bloqueo?: string;
}

export class ProgresoTutorialesPaginaDto {
  pagina: string;
  total_tutoriales: number;
  tutoriales_completados: number;
  porcentaje_completado: number;
  tutoriales: TutorialInfoDto[];
}

import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsObject,
} from 'class-validator';

export class ObtenerProgresoPaginaDto {
  @IsNotEmpty()
  @IsString()
  pagina: string;

  @IsNotEmpty()
  @IsArray()
  tutoriales: { nombre: string; titulo: string }[];

  @IsOptional()
  @IsObject()
  condiciones_bloqueo?: Record<
    string,
    { bloqueado: boolean; mensaje?: string }
  >;
}
