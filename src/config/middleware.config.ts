import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import express from 'express';

// function setupGlobalPrefix(app: INestApplication) {
//   app.setGlobalPrefix('api');
// }

function setupGlobalPipes(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not defined in DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert string to numbers, etc.
      },
    }),
  );
}

function setupCors(app: INestApplication) {
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
}

function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Nest-js Swagger Api')
    .setDescription('Swagger Example Api Description')
    .setVersion('1.0')
    .addServer('http://localhost:3001')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, options);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  SwaggerModule.setup('docs', app, documentFactory, customOptions);
}

function setupMiddleware(app: INestApplication) {
  app.use(express.urlencoded({ extended: true }));
}

export function setupMiddlewares(app: INestApplication) {
  //   setupGlobalPrefix(app);
  setupCors(app);
  setupGlobalPipes(app);
  setupMiddleware(app);
  setupSwagger(app);
}
