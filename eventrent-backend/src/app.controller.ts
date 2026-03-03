import { Controller, Get, Post, Body, Query, Delete, Param } from '@nestjs/common'; // <--- Delete & Param ditambahkan
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 1. Ambil Semua Event (Untuk Home)
  @Get('events') 
  async getEvents() {
    return await this.appService.getEvents();
  }

  // 2. Ambil Event Milik Sendiri (Untuk Manage)
  @Get('events/my')
  async getMyEvents(@Query('userId') userId: number) {
    return await this.appService.getMyEvents(userId);
  }

  // 3. Create Event Baru
  @Post('events')
  async createEvent(@Body() eventData: any) {
    return await this.appService.createEvent(eventData);
  }
  
  // 4. Login Google
  @Post('auth/google')
  async googleLogin(@Body() userData: { email: string; name: string; picture: string; googleId: string }) {
    return await this.appService.loginWithGoogle(userData);
  }

  // 5. Delete Event (INI YANG HILANG DI KODEMU)
  @Delete('events/:id')
  async deleteEvent(@Param('id') id: number, @Query('userId') userId: number) {
    return await this.appService.deleteEvent(id, userId);
  }
}