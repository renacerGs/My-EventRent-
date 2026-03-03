import { Controller, Get, Post, Body, Query, Delete, Param, Put } from '@nestjs/common'; 
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('events') 
  async getEvents() {
    return await this.appService.getEvents();
  }

  @Get('events/my')
  async getMyEvents(@Query('userId') userId: number) {
    return await this.appService.getMyEvents(userId);
  }

  @Post('events')
  async createEvent(@Body() eventData: any) {
    return await this.appService.createEvent(eventData);
  }

  @Delete('events/:id')
  async deleteEvent(@Param('id') id: number, @Query('userId') userId: number) {
    return await this.appService.deleteEvent(id, userId);
  }

  @Put('events/:id')
  async updateEvent(@Param('id') id: number, @Query('userId') userId: number, @Body() eventData: any) {
    return await this.appService.updateEvent(id, userId, eventData);
  }

  // <--- Endpoint Beli Tiket (Update menerima quantity)
  @Post('tickets/buy')
  async buyTicket(@Body() data: { userId: number; eventId: number; quantity: number }) {
    // Default quantity = 1 kalau tidak dikirim
    const qty = data.quantity || 1;
    return await this.appService.buyTicket(data.userId, data.eventId, qty);
  }

  // <--- BARU: Endpoint Tiket Saya
  @Get('tickets/my')
  async getMyTickets(@Query('userId') userId: number) {
    return await this.appService.getMyTickets(userId);
  }
  
  // --- AUTH ENDPOINTS ---

  @Post('auth/google')
  async googleLogin(@Body() userData: { email: string; name: string; picture: string; googleId: string }) {
    return await this.appService.loginWithGoogle(userData);
  }

  // <--- PINTU REGISTER YANG SEBELUMNYA HILANG --->
  @Post('auth/register')
  async register(@Body() userData: { name: string; email: string; password: string }) {
    return await this.appService.registerUser(userData);
  }

  // <--- PINTU LOGIN MANUAL YANG SEBELUMNYA HILANG --->
  @Post('auth/login')
  async login(@Body() userData: { email: string; password: string }) {
    return await this.appService.loginUser(userData);
  }

  @Put('users/:id')
  async updateProfile(@Param('id') id: number, @Body() data: { name: string; img?: string }) {
    return await this.appService.updateProfile(id, data);
  }

  // <--- BARU: Ganti Password
  @Put('users/:id/password')
  async changePassword(@Param('id') id: number, @Body() data: { oldPass: string; newPass: string }) {
    return await this.appService.changePassword(id, data);
  }
}