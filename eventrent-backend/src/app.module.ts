import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'), 
      // 👇 FORMAT PALING DEWA & AMAN BUAT EXPRESS V5 👇
      exclude: ['/api', '/api/*path', '/api-docs', '/api-docs/*path'], 
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}