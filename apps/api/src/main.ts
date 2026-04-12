import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { getJwtSecret, isUsingDevJwtSecret } from './auth/jwt-secret';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL nao configurado. API nao conectara ao banco.');
    process.exit(1);
  }

  try {
    getJwtSecret();
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'JWT_SECRET invalido.');
    process.exit(1);
  }

  if (isUsingDevJwtSecret()) {
    logger.warn('JWT_SECRET nao configurado. Usando segredo local apenas para desenvolvimento.');
  }

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const rawOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (rawOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Orbitus Classroom RPG API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`API rodando em http://localhost:${port}`);
  logger.log(`Swagger em http://localhost:${port}/api/docs`);
}
bootstrap();
