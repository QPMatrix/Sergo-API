import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import * as Joi from 'joi';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(4000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        KAFKA_BROKER: Joi.string().required(),
        KAFKA_CLIENT_ID: Joi.string().default('auth-service'),
        KAFKA_GROUP_ID: Joi.string().default('auth-group'),
      }),
    }),
    KafkaModule,
    AuthModule,
  ],
})
export class AppModule {}
