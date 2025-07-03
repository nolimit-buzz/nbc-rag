import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // <-- Change to specific domain(s) in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // if you're using cookies/auth
  });
  await app.listen(process.env.PORT || 3000);
  
}
bootstrap();
