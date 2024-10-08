import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Connect the Kafka client
    await this.kafkaClient.connect();
  }

  emit(topic: string, message: any) {
    this.kafkaClient.emit(topic, message);
  }
}
