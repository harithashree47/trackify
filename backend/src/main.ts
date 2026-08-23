import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  // CORS for the frontend (http://localhost:5173)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve uploaded files (profile pictures) at /uploads/...
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger documentation -> http://localhost:3000/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Trackify API')
    .setDescription('Daily goal tracker backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`🚀 Trackify API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs on http://localhost:${port}/docs`);
}
bootstrap();
