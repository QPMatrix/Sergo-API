import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auth Service')
    .setDescription('Auth API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access_token',
    )
    .setVersion('1.0')
    .setContact('Hasan Diab', 'https://qpmatrix.tech', 'hasan@qpmatrix.tech')
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, doc);
  console.log(`Listening on port ${configService.get('PORT')}`);
  await app.listen(configService.get('PORT'));
}
bootstrap();
