import { Module } from '@nestjs/common';
import { AutenticacionServicio } from './autenticacion.servicio';
import { AutenticacionControlador } from './autenticacion.controlador';
import { UsuariosModule } from '../usuarios/usuarios.modulo';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtEstrategia } from './estrategias/jwt.estrategia';
import { LocalEstrategia } from './estrategias/local.estrategia';
import type { StringValue } from 'ms';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config_servicio: ConfigService) => {
        const secret = config_servicio.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'La clave secreta JWT_SECRET no está definida en el .env',
          );
        }
        const tiempo_expiracion_raw = (
          config_servicio.get<string>('JWT_EXPIRATION_TIME', '30d') || ''
        ).trim();
        let expiresIn: number | StringValue;
        if (/^\d+$/.test(tiempo_expiracion_raw)) {
          expiresIn = Number(tiempo_expiracion_raw);
        } else if (/^\d+(ms|s|m|h|d|w|y)$/.test(tiempo_expiracion_raw)) {
          expiresIn = tiempo_expiracion_raw as StringValue;
        } else {
          console.warn(
            `JWT_EXPIRATION_TIME inválido ('${tiempo_expiracion_raw}'). Usando valor por defecto '30d'.`,
          );
          expiresIn = '30d' as StringValue;
        }
        console.log('JWT configurado correctamente');
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  providers: [AutenticacionServicio, LocalEstrategia, JwtEstrategia],
  controllers: [AutenticacionControlador],
})
export class AutenticacionModule {}
