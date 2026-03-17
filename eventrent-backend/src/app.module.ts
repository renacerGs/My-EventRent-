import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'), 
      // 👇 INI DIA FORMAT VERSI TERBARUNYA (Pake :path*) 👇
      exclude: ['/api/:path*', '/api-docs/:path*'], 
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}