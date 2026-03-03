import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api') // <--- Ini yang membuat /api
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('events') // <--- Ini yang membuat /events
  async getEvents() {
    return await this.appService.getEvents();
  }
}