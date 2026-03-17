import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express'; 

// <--- 1. IMPORT LIBRARY SWAGGER NESTJS --->
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();

  // Settingan biar bisa upload gambar (max 50MB)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // <--- 2. KONFIGURASI TAMPILAN SWAGGER --->
  const config = new DocumentBuilder()
    .setTitle('EventRent API')
    .setDescription('Dokumentasi resmi untuk API EventRent')
    .setVersion('1.0')
    .build();
    
  // <--- 3. JALANKAN SWAGGER DI ENDPOINT '/api-docs' --->
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 👇👇👇 PERUBAHAN PORT UNTUK CLOUD (RENDER) 👇👇👇
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // '0.0.0.0' wajib biar Render bisa buka pintunya
  
  console.log(`🚀 Backend NestJS berjalan di port ${port}`);
  console.log(`📄 Swagger UI siap meluncur`);
}
bootstrap();