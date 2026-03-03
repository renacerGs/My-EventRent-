import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express'; // <--- 1. Import ini

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();

  // <--- 2. Tambahkan 2 baris ini biar bisa upload gambar (max 50MB)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(3000);
  console.log('Backend NestJS berjalan di http://localhost:3000');
}
bootstrap();