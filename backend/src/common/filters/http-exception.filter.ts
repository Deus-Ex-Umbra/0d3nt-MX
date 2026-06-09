import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ha ocurrido un error inesperado al procesar su solicitud.';
    let errorType = 'Error Interno';
    let extra: Record<string, any> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        const responseObj = errorResponse as any;
        if (responseObj.message) {
          if (Array.isArray(responseObj.message)) {
            message = responseObj.message.join(', ');
          } else {
            message = responseObj.message;
          }
        }

        if (responseObj.error) {
          errorType = responseObj.error;
        }

        const { message: _m, error: _e, statusCode: _s, ...rest } = responseObj;
        if (Object.keys(rest).length > 0) {
          extra = rest;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Excepción no controlada: ${exception.message}`,
        exception.stack,
      );
      message = exception.message;
      errorType = exception.name;
    } else {
      this.logger.error('Excepción desconocida lanzada', exception);
      message = 'Error crítico desconocido.';
    }

    if (errorType === 'Unauthorized' || message === 'Unauthorized') {
      message =
        'No autorizado. Por favor verifique sus credenciales o inicie sesión nuevamente.';
      errorType = 'No Autorizado';
    }
    if (errorType === 'Forbidden' || message === 'Forbidden') {
      message =
        'Acceso denegado. No tiene permisos suficientes para realizar esta acción.';
      errorType = 'Prohibido';
    }
    if (
      status === HttpStatus.NOT_FOUND &&
      (message.startsWith('Cannot') || message === 'Not Found')
    ) {
      message = `El recurso solicitado no fue encontrado.`;
      errorType = 'No Encontrado';
    }

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorType,
      message: message,
      ...(extra ?? {}),
    };

    response.status(status).json(responseBody);
  }
}
