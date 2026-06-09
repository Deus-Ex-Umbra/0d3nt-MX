import { PartialType } from '@nestjs/mapped-types';
import { CrearSimboloOdontogramaDto } from './crear-simbolo-odontograma.dto';

export class ActualizarSimboloOdontogramaDto extends PartialType(
  CrearSimboloOdontogramaDto,
) {}
