import { Controller, Get, Post, Body, Query, Delete, Param, Put } from '@nestjs/common'; 
import { AppService } from './app.service';

// <--- 1. IMPORT DECORATOR SWAGGER --->
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // --- EVENTS ---
  @ApiTags('Events') // Kelompokkan ke folder "Events" di UI Swagger
  @ApiOperation({ summary: 'Mendapatkan semua event' })
  @Get('events') 
  async getEvents() {
    return await this.appService.getEvents();
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mendapatkan event yang dibuat oleh user tertentu' })
  @ApiQuery({ name: 'userId', required: true, type: Number, description: 'ID dari user pembuat event' })
  @Get('events/my')
  async getMyEvents(@Query('userId') userId: number) {
    return await this.appService.getMyEvents(userId);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mendapatkan detail satu event beserta sesinya' })
  @ApiParam({ name: 'id', required: true, description: 'ID Event' })
  @Get('events/:id')
  async getEventById(@Param('id') id: number) {
    return await this.appService.getEventById(id);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Membuat event baru' })
  @Post('events')
  async createEvent(@Body() eventData: any) {
    return await this.appService.createEvent(eventData);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menghapus event' })
  @Delete('events/:id')
  async deleteEvent(@Param('id') id: number, @Query('userId') userId: number) {
    return await this.appService.deleteEvent(id, userId);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mengubah data event' })
  @Put('events/:id')
  async updateEvent(@Param('id') id: number, @Query('userId') userId: number, @Body() eventData: any) {
    return await this.appService.updateEvent(id, userId, eventData);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menambah jumlah tayangan (views) event' })
  @Post('events/:id/view')
  async incrementView(@Param('id') id: number) {
    return await this.appService.incrementView(id);
  }

  // --- LIKES ---
  @ApiTags('Likes (Wishlist)')
  @ApiOperation({ summary: 'Menambah atau menghapus event dari wishlist' })
  @ApiBody({ schema: { example: { userId: 1, eventId: 32 } } })
  @Post('likes/toggle')
  async toggleLike(@Body() data: { userId: number; eventId: number }) {
    return await this.appService.toggleLike(data.userId, data.eventId);
  }

  @ApiTags('Likes (Wishlist)')
  @ApiOperation({ summary: 'Mendapatkan daftar wishlist user' })
  @Get('likes/my')
  async getMyLikes(@Query('userId') userId: number) {
    return await this.appService.getMyLikes(userId);
  }

  // --- TICKETS ---
  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Membeli tiket (Checkout)' })
  @ApiBody({ 
    description: 'Data pembelian tiket termasuk jawaban form',
    schema: { 
      example: { 
        userId: 1, 
        eventId: 32, 
        cart: [{ sessionId: 2, quantity: 2, price: 200000 }], 
        formAnswers: { "2": { "No HP": "08123" } } 
      } 
    } 
  })
  @Post('tickets/buy')
  async buyTicket(@Body() data: { userId: number; eventId: number; cart: any[]; formAnswers: any }) {
    return await this.appService.buyTicket(data.userId, data.eventId, data.cart, data.formAnswers || {});
  }

  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Mendapatkan daftar tiket yang dibeli user (My Tickets)' })
  @Get('tickets/my')
  async getMyTickets(@Query('userId') userId: number) {
    return await this.appService.getMyTickets(userId);
  }

  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Mendapatkan daftar peserta (Dashboard Panitia)' })
  @Get('events/:id/attendees')
  async getAttendees(@Param('id') id: number, @Query('userId') userId: number) {
    return await this.appService.getEventAttendees(id, userId);
  }

  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Melakukan validasi/scan kehadiran tiket' })
  @ApiBody({ schema: { example: { ticketId: 39, eventId: 32, userId: 1 } } })
  @Post('tickets/scan')
  async scanTicket(@Body() body: { ticketId: number, eventId: number, userId: number }) {
    return this.appService.scanTicket(body.ticketId, body.eventId, body.userId);
  }
  
  // --- AUTH & USERS ---
  @ApiTags('Authentication & Users')
  @ApiOperation({ summary: 'Login menggunakan akun Google' })
  @Post('auth/google')
  async googleLogin(@Body() userData: any) {
    return await this.appService.loginWithGoogle(userData);
  }

  @ApiTags('Authentication & Users')
  @ApiOperation({ summary: 'Registrasi user baru manual' })
  @Post('auth/register')
  async register(@Body() userData: any) {
    return await this.appService.registerUser(userData);
  }

  @ApiTags('Authentication & Users')
  @ApiOperation({ summary: 'Login manual (Email & Password)' })
  @Post('auth/login')
  async login(@Body() userData: any) {
    return await this.appService.loginUser(userData);
  }

  @ApiTags('Authentication & Users')
  @ApiOperation({ summary: 'Update profil (Nama & Foto)' })
  @Put('users/:id')
  async updateProfile(@Param('id') id: number, @Body() data: any) {
    return await this.appService.updateProfile(id, data);
  }

  @ApiTags('Authentication & Users')
  @ApiOperation({ summary: 'Ganti Password' })
  @Put('users/:id/password')
  async changePassword(@Param('id') id: number, @Body() data: any) {
    return await this.appService.changePassword(id, data);
  }
}