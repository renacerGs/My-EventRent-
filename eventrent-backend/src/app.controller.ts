import { Controller, Get, Post, Body, Query, Delete, Param, Put } from '@nestjs/common'; 
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // --- EVENTS ---
  @Get('events') 
  async getEvents() {
    return await this.appService.getEvents();
  }

  @Get('events/my')
  async getMyEvents(@Query('userId') userId: number) {
    return await this.appService.getMyEvents(userId);
  }

  @Get('events/:id')
  async getEventById(@Param('id') id: number) {
    return await this.appService.getEventById(id);
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

  @Post('events/:id/view')
  async incrementView(@Param('id') id: number) {
    return await this.appService.incrementView(id);
  }

  // --- LIKES ---
  @Post('likes/toggle')
  async toggleLike(@Body() data: { userId: number; eventId: number }) {
    // Pastikan mengirim data.eventId ke service
    return await this.appService.toggleLike(data.userId, data.eventId);
  }

  @Get('likes/my')
  async getMyLikes(@Query('userId') userId: number) {
    // Nama fungsi ini harus ada di app.service.ts
    return await this.appService.getMyLikes(userId);
  }

  // --- TICKETS ---
  @Post('tickets/buy')
  async buyTicket(@Body() data: { userId: number; eventId: number; cart: any[]; formAnswers: any }) {
    return await this.appService.buyTicket(data.userId, data.eventId, data.cart, data.formAnswers || {});
  }

  @Get('tickets/my')
  async getMyTickets(@Query('userId') userId: number) {
    return await this.appService.getMyTickets(userId);
  }

  @Get('events/:id/attendees')
  async getAttendees(@Param('id') id: number, @Query('userId') userId: number) {
    return await this.appService.getEventAttendees(id, userId);
  }
  
  // --- AUTH & USERS ---
  @Post('auth/google')
  async googleLogin(@Body() userData: any) {
    return await this.appService.loginWithGoogle(userData);
  }

  @Post('auth/register')
  async register(@Body() userData: any) {
    return await this.appService.registerUser(userData);
  }

  @Post('auth/login')
  async login(@Body() userData: any) {
    return await this.appService.loginUser(userData);
  }

  @Put('users/:id')
  async updateProfile(@Param('id') id: number, @Body() data: any) {
    return await this.appService.updateProfile(id, data);
  }

  @Put('users/:id/password')
  async changePassword(@Param('id') id: number, @Body() data: any) {
    return await this.appService.changePassword(id, data);
  }
} 