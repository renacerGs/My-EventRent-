// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express'; 
import { ValidationPipe } from '@nestjs/common'; 
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Variabel untuk nyimpen memori Vercel biar nggak loading lama tiap ada request
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors();

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: false, 
      transform: true, 
    }));

    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    const config = new DocumentBuilder()
      .setTitle('EventRent API')
      .setDescription('Dokumentasi resmi untuk API EventRent')
      .setVersion('1.0')
      .build();
      
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    // 👇 FIX: Jangan gunakan app.listen di sini, cukup inisialisasi mesinnya saja
    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

// 👇 JALUR 1: VERCEL SERVERLESS (Tanpa Port, Langsung Tembak Handler) 👇
// Vercel akan otomatis ngebaca fungsi ini pas deploy
export default async function (req: any, res: any) {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}

// 👇 JALUR 2: LOKAL DEVELOPMENT (Buat di Laptop Lu Sendiri) 👇
// Kalau environment-nya BUKAN Vercel, dia bakal jalanin port kayak biasa
if (!process.env.VERCEL) {
  bootstrap().then(app => {
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Backend NestJS berjalan di port ${port}`);
      console.log(`📄 Swagger UI siap meluncur di http://localhost:${port}/api-docs`);
    });
  });
}