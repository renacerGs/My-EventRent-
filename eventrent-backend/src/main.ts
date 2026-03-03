import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Mengizinkan Frontend (React) untuk mengambil data dari sini
  app.enableCors();

  await app.listen(3000);
  console.log('Backend NestJS berjalan di http://localhost:3000');
}
bootstrap();