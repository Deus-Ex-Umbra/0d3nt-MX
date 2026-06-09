import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { MigracionEstadoServicio } from './migracion-estado.servicio';

@Injectable()
export class BloqueoMigracionGuard implements CanActivate {
  constructor(private readonly estado: MigracionEstadoServicio) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.estado.estaEnProgreso()) return true;

    const req = context.switchToHttp().getRequest<any>();
    const method = String(req?.method || '').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    const url = String(req?.originalUrl || req?.url || '');
    if (url.startsWith('/api/migracion')) return true;

    throw new HttpException(
      {
        message:
          'Migración en curso. Operaciones de escritura deshabilitadas temporalmente.',
        code: 'MIGRACION_EN_PROGRESO',
      },
      423,
    );
  }
}
