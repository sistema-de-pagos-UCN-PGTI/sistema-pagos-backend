import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './config/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * The port on which the application will listen.
 * @type {number}
 */
const port: number | 10000 = Number(process.env.APP_PORT) || 10000;

/**
 * The bootstrap function initializes the application.
 * @async
 */
async function bootstrap() {
  /**
   * The Nest application instance.
   * @type {INestApplication}
   */
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Proyecto Gestión De Pagos')
    .setDescription('Descripción')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(port);
}
bootstrap()
  .then(() => {
    console.log(`App listening on port: ${port}\n`);
  })
  .catch((err) => {
    console.error(err);
    setTimeout(() => {
      process.exit(1);
    }, 0);
  });
