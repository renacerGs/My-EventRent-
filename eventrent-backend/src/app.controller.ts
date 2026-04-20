// src/app.controller.ts
import { Controller, Get, Post, Body, Query, Delete, Param, Put, Patch, HttpException, HttpStatus } from '@nestjs/common'; 
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BuyTicketDto } from './dto/buy-ticket.dto';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // --- EVENTS ---
  @ApiTags('Events') 
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

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menyalakan/mematikan visibilitas event di halaman utama (Public/Private)' })
  @Patch('events/:id/visibility')
  async toggleVisibility(@Param('id') id: number, @Query('userId') userId: number) {
    return await this.appService.toggleEventVisibility(id, userId);
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
  @ApiOperation({ summary: 'Membeli tiket (Checkout Public) atau RSVP (Personal Event)' })
  @ApiBody({ 
    description: 'Bisa menerima format Cart (Public Event) ATAU format RSVP (Personal Event)',
    type: BuyTicketDto
  })
  @Post('tickets/buy')
  async buyTicket(@Body() data: BuyTicketDto) { 
    let finalCart = data.cart;
    let finalAnswers = data.formAnswers || {};
    let email = data.guestEmail || data.guest_email;

    if (!finalCart && data.sessionId) {
      finalCart = [{
        sessionId: data.sessionId,
        quantity: typeof data.pax === 'string' ? parseInt(data.pax) : (data.pax || 1),
        price: 0
      }];
      
      finalAnswers = {
        ...data.custom_answers,
        "attendee_name": data.attendee_name,
        "greeting": data.greeting
      };
    }

    return await this.appService.buyTicket(
      data.userId || null, 
      data.eventId, 
      finalCart || [], 
      finalAnswers, 
      email
    );
  }

  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Mendapatkan daftar tiket yang dibeli user (My Tickets)' })
  @Get('tickets/my')
  async getMyTickets(@Query('userId') userId: number) {
    return await this.appService.getMyTickets(userId);
  }

  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Melacak/Mencari tiket (Guest Checkout) menggunakan Order ID dan Email' })
  @ApiBody({ schema: { example: { ticketId: "TKT-A9X2B1", email: "tamu@gmail.com" } } })
  @Post('tickets/track')
  async trackTicket(@Body() data: { ticketId: string; email: string }) { 
    return await this.appService.trackTicket(data.ticketId, data.email);
  }

  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Mendapatkan daftar peserta (Dashboard Panitia)' })
  @Get('events/:id/attendees')
  async getAttendees(@Param('id') id: number, @Query('userId') userId: number) {
    return await this.appService.getEventAttendees(id, userId);
  }

  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Melakukan validasi/scan kehadiran tiket' })
  @ApiBody({ schema: { example: { ticketId: "TKT-A9X2B1", eventId: 32, userId: 1 } } })
  @Post('tickets/scan')
  async scanTicket(@Body() body: { ticketId: string, eventId: number, userId: number }) {
    return this.appService.scanTicket(body.ticketId, body.eventId, body.userId);
  }

  // 👇👇👇 API AGENTS (KEPANITIAAN) 👇👇👇
  @ApiTags('Agents (Kepanitiaan)')
  @ApiOperation({ summary: 'Menambahkan agen baru ke dalam event' })
  @Post('events/:id/agents')
  async addAgent(
    @Param('id') eventId: number, 
    @Query('eoId') eoId: number, 
    @Body() body: { email: string; role?: string }
  ) {
    return await this.appService.addAgent(eventId, eoId, body.email, body.role);
  }

  @ApiTags('Agents (Kepanitiaan)')
  @ApiOperation({ summary: 'Mendapatkan daftar agen di sebuah event (Untuk Dashboard EO)' })
  @Get('events/:id/agents')
  async getEventAgents(@Param('id') eventId: number, @Query('eoId') eoId: number) {
    return await this.appService.getEventAgents(eventId, eoId);
  }

  @ApiTags('Agents (Kepanitiaan)')
  @ApiOperation({ summary: 'Mengubah peran (role) atau memberikan rating ke agen' })
  @Put('events/:id/agents/:agentId')
  async updateAgent(
    @Param('id') eventId: number, 
    @Param('agentId') agentId: number, 
    @Query('eoId') eoId: number, 
    @Body() body: { role?: string; rating_given?: number }
  ) {
    return await this.appService.updateAgent(eventId, eoId, agentId, body);
  }

  @ApiTags('Agents (Kepanitiaan)')
  @ApiOperation({ summary: 'Menghapus/memecat agen dari event' })
  @Delete('events/:id/agents/:agentId')
  async removeAgent(
    @Param('id') eventId: number, 
    @Param('agentId') agentId: number, 
    @Query('eoId') eoId: number
  ) {
    return await this.appService.removeAgent(eventId, eoId, agentId);
  }

  @ApiTags('Agents (Kepanitiaan)')
  @ApiOperation({ summary: 'Mendapatkan daftar event di mana user ditugaskan sebagai agen (Dashboard Agen)' })
  @Get('users/:id/assigned-events')
  async getAssignedEvents(@Param('id') agentId: number) {
    return await this.appService.getAssignedEvents(agentId);
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
  @ApiOperation({ summary: 'Verifikasi Kode OTP dari Email' })
  @ApiBody({ schema: { example: { email: "user@gmail.com", otpCode: "123456" } } })
  @Post('auth/verify-otp')
  async verifyOtp(@Body() body: { email: string; otpCode: string }) {
    return await this.appService.verifyOTP(body.email, body.otpCode);
  }

  @ApiTags('Authentication & Users')
  @ApiOperation({ summary: 'Kirim Ulang Kode OTP ke Email' })
  @ApiBody({ schema: { example: { email: "user@gmail.com" } } })
  @Post('auth/resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    return await this.appService.resendOTP(body.email);
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

  @ApiTags('Authentication & Users')
  @ApiOperation({ summary: 'Minta OTP untuk Lupa Password' })
  @Post('auth/forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return await this.appService.sendForgotPasswordOTP(body.email);
  }

  @ApiTags('Authentication & Users')
  @ApiOperation({ summary: 'Reset Password dengan OTP' })
  @Post('auth/reset-password')
  async resetPassword(@Body() body: { email: string; otpCode: string; newPassword: string }) {
    return await this.appService.resetPasswordWithOTP(body.email, body.otpCode, body.newPassword);
  }

  @Get('users/:id/scan-history')
  async getScanHistory(@Param('id') id: string) {
    return this.appService.getAgentScanHistory(Number(id));
  }

  // --- NOTIFICATIONS ---
  @ApiTags('Notifications')
  @Get('users/:id/notifications')
  async getNotifications(@Param('id') id: number) {
    return await this.appService.getNotifications(id);
  }

  @ApiTags('Notifications')
  @Post('notifications/:id/respond')
  async respondInvitation(
    @Param('id') notifId: number,
    @Query('userId') userId: number,
    @Body() body: { action: 'accept' | 'reject' }
  ) {
    return await this.appService.respondAgentInvitation(notifId, userId, body.action);
  }

  @ApiTags('Notifications')
  @Patch('notifications/:id/read')
  async markNotifRead(@Param('id') notifId: number, @Query('userId') userId: number) {
    return await this.appService.markNotificationRead(notifId, userId);
  }

  // --- REPORTS / KENDALA LAPANGAN ---
  @ApiTags('Reports')
  @Post('events/:id/reports')
  async createReport(@Param('id') eventId: number, @Body() body: { agentId: number, message: string }) {
    return await this.appService.createEventReport(eventId, body.agentId, body.message);
  }

  @ApiTags('Reports')
  @Get('events/:id/reports')
  async getReports(@Param('id') eventId: number, @Query('eoId') eoId: number) {
    return await this.appService.getEventReports(eventId, eoId);
  }

  @ApiTags('Reports')
  @Patch('reports/:id/resolve')
  async resolveReport(@Param('id') reportId: number, @Query('eoId') eoId: number) {
    return await this.appService.resolveEventReport(reportId, eoId);
  }

  // ==========================================
  // 👇 API RECRUITMENT (JOB BOARD) 👇
  // ==========================================

  @ApiTags('Recruitment')
  @ApiOperation({ summary: 'EO Bikin Lowongan Baru' })
  @Post('jobs')
  async createJob(@Body() body: any) {
    return await this.appService.createJobPosting(body);
  }

  @ApiTags('Recruitment')
  @ApiOperation({ summary: 'User Lihat Semua Lowongan (Mendukung Pagination)' })
  @Get('jobs')
  async getAllJobs(
    @Query('page') page?: string, 
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 10;
    return await this.appService.getAllActiveJobs(pageNum, limitNum);
  }

  @ApiTags('Recruitment')
  @ApiOperation({ summary: 'EO Lihat Lowongannya Sendiri di Dashboard' })
  @Get('events/:id/jobs')
  async getEventJobs(@Param('id') eventId: string, @Query('eoId') eoId: string) {
    return await this.appService.getJobsByEvent(Number(eventId), Number(eoId));
  }

  @ApiTags('Recruitment')
  @ApiOperation({ summary: 'User Ngirim Lamaran' })
  @Post('jobs/apply')
  async applyJob(@Body() body: any) {
    return await this.appService.applyForJob(body.jobId, body.userId);
  }

  @ApiTags('Recruitment')
  @ApiOperation({ summary: 'EO Lihat Daftar Pelamar' })
  @Get('events/:id/applicants')
  async getEventApplicants(@Param('id') eventId: string, @Query('eoId') eoId: string) {
    return await this.appService.getApplicantsByEvent(Number(eventId), Number(eoId));
  }

  @ApiTags('Recruitment')
  @ApiOperation({ summary: 'EO Terima/Tolak Pelamar' })
  @Post('jobs/respond')
  async respondApplicant(@Body() body: any) {
    return await this.appService.respondToApplicant(body.applicationId, body.action, body.eoId);
  }

  @ApiTags('Recruitment')
  @ApiOperation({ summary: 'EO Menghapus atau Membatalkan Lowongan' })
  @Delete('jobs/:id')
  async deleteJob(@Param('id') jobId: string, @Query('eoId') eoId: string) {
    return await this.appService.deleteJobPosting(Number(jobId), Number(eoId));
  }

  // ==========================================
  // 👇 API PAYOUT / PENGGAJIAN AGEN 👇
  // ==========================================

  @ApiTags('Payout')
  @ApiOperation({ summary: 'Daftar Gaji Agen di Event' })
  @Get('events/:id/payouts')
  async getPayouts(@Param('id') eventId: string, @Query('eoId') eoId: string) {
    return await this.appService.getEventPayouts(Number(eventId), Number(eoId));
  }

  @ApiTags('Payout')
  @ApiOperation({ summary: 'Tandai Gaji Agen Lunas' })
  @Post('events/:id/payouts/pay')
  async markPaid(
    @Param('id') eventId: string,
    @Body() body: { agentId: number, eoId: number, amount: number, proofUrl: string } 
  ) {
    return await this.appService.markAgentPaid(Number(eventId), body.agentId, body.eoId, body.amount, body.proofUrl);
  }

  // 👇 ENDPOINT BARU UNTUK HALAMAN DOMPET AGEN 👇
  @Get('users/:id/payouts')
  async getAgentWalletPayouts(@Param('id') userId: string) {
    return await this.appService.getAgentPayouts(Number(userId));
  }
}