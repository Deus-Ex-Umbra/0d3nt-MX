import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.modulo';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as path from 'path';
import { resolveDocsDir } from './common/utils/docs-dir';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const origenesPermitidos = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://backend-0d3nt-nr.vercel.app',
    'https://demo-0d3nt-nr.vercel.app'
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      console.log(`[CORS DETECTADO] Origen entrante: '${origin}'`);
      if (!origin || origin === 'null') return callback(null, true);
      if (origenesPermitidos.has(origin)) return callback(null, true);
      return callback(new Error('Origen no permitido'), false);
    },
    credentials: true,
  });

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  const docsDir = resolveDocsDir(
    process.env.DOCS_0D3NT_DIR,
    process.env.IS_SERVERLESS,
  );

  app.use('/docs-0d3nt', express.static(docsDir));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API de Clínica Dental')
    .setDescription(
      'Documentación de la API para el sistema de gestión de clínica dental.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/documentacion', app, document);

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto, '0.0.0.0');
  console.log(`Servidor corriendo en http://localhost:${puerto}`);
  console.log(
    `Documentación disponible en http://localhost:${puerto}/api/documentacion`,
  );
}
bootstrap();