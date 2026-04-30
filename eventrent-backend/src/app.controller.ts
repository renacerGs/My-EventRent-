import { Controller, Get, Post, Body, Query, Delete, Param, Put, Patch, UseGuards, Req } from '@nestjs/common'; 
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BuyTicketDto } from './dto/buy-ticket.dto';

import { SupabaseGuard } from './supabase.guard'; 

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ==========================================
  // --- FITUR EVENTS ---
  // ==========================================
  @ApiTags('Events') 
  @ApiOperation({ summary: 'Mendapatkan semua event' })
  @Get('events') 
  async getEvents() {
    return await this.appService.getEvents(); 
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mendapatkan event yang dibuat oleh user tertentu' })
  @UseGuards(SupabaseGuard)
  @Get('events/my')
  async getMyEvents(@Req() req) {
    return await this.appService.getMyEvents(req.user.id);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mendapatkan detail satu event beserta sesinya' })
  @Get('events/:id')
  async getEventById(@Param('id') id: number) {
    return await this.appService.getEventById(id);
  }

  // 🔥 ENDPOINT SESSIONS KHUSUS MOBILE (FLUTTER)
  @ApiTags('Events')
  @ApiOperation({ summary: 'Ambil sesi event (Khusus Mobile)' })
  @Get('events/:id/sessions')
  async getEventSessionsMobile(@Param('id') eventId: string) {
    return await this.appService.getEventSessions(Number(eventId));
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Membuat event baru' })
  @UseGuards(SupabaseGuard)
  @Post('events')
  async createEvent(@Req() req, @Body() eventData: any) {
    eventData.userId = req.user.id; 
    return await this.appService.createEvent(eventData);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mengubah data event' })
  @UseGuards(SupabaseGuard)
  @Put('events/:id')
  async updateEvent(@Param('id') id: number, @Req() req, @Body() eventData: any) {
    return await this.appService.updateEvent(id, req.user.id, eventData);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menghapus event' })
  @UseGuards(SupabaseGuard)
  @Delete('events/:id')
  async deleteEvent(@Param('id') id: number, @Req() req) {
    return await this.appService.deleteEvent(id, req.user.id);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menambah jumlah tayangan (views) event' })
  @Post('events/:id/view')
  async incrementView(@Param('id') id: number) {
    return await this.appService.incrementView(id);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menyalakan/mematikan visibilitas event' })
  @UseGuards(SupabaseGuard) 
  @Patch('events/:id/visibility')
  async toggleVisibility(@Param('id') id: number, @Req() req) {
    return await this.appService.toggleEventVisibility(id, req.user.id);
  }

  // ==========================================
  // --- FITUR LIKES ---
  // ==========================================
  @ApiTags('Likes')
  @UseGuards(SupabaseGuard)
  @Post('likes/toggle')
  async toggleLike(@Req() req, @Body() data: { eventId: number }) {
    return await this.appService.toggleLike(req.user.id, data.eventId);
  }

  @ApiTags('Likes')
  @UseGuards(SupabaseGuard)
  @Get('likes/my')
  async getMyLikes(@Req() req) {
    return await this.appService.getMyLikes(req.user.id);
  }

  // ==========================================
  // --- FITUR ORDERS (PESANAN SAYA) ---
  // ==========================================
  @ApiTags('Orders')
  @ApiOperation({ summary: 'Bikin pesanan baru & dapatkan Token Midtrans' })
  @UseGuards(SupabaseGuard)
  @Post('orders/checkout')
  async checkoutOrder(@Req() req, @Body() data: any) {
    return await this.appService.createCheckoutOrder(req.user.id, data);
  }

  @ApiTags('Orders')
  @ApiOperation({ summary: 'Ambil daftar riwayat pesanan (My Orders)' })
  @UseGuards(SupabaseGuard)
  @Get('orders/my')
  async getMyOrders(@Req() req) {
    return await this.appService.getMyOrders(req.user.id);
  }

  // ==========================================
  // --- FITUR TICKETS & ATTENDEES ---
  // ==========================================
  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Membeli tiket (Bebas Satpam biar Guest bisa beli)' })
  @Post('tickets/buy')
  async buyTicket(@Body() data: any) { 
    let finalCart = data.cart;
    let finalAnswers = data.formAnswers || {};
    let email = data.guestEmail || data.guest_email;

    if (!finalCart && data.sessionId) {
      finalCart = [{
        sessionId: data.sessionId,
        quantity: typeof data.pax === 'string' ? parseInt(data.pax) : (data.pax || 1),
        price: 0
      }];
      finalAnswers = { ...data.custom_answers, "attendee_name": data.attendee_name, "greeting": data.greeting };
    }

    const safeUserId = typeof data.userId === 'number' || typeof data.userId === 'string' ? data.userId : null;
    return await this.appService.buyTicket(safeUserId, data.eventId, finalCart || [], finalAnswers, email, data.orderId);
  }

  @ApiTags('Tickets')
  @UseGuards(SupabaseGuard)
  @Get('tickets/my')
  async getMyTickets(@Req() req) {
    return await this.appService.getMyTickets(req.user.id);
  }

  @ApiTags('Tickets')
  @Post('tickets/track')
  async trackTicket(@Body() data: { ticketId: string; email: string }) { 
    return await this.appService.trackTicket(data.ticketId, data.email);
  }

  @ApiTags('Tickets')
  @UseGuards(SupabaseGuard)
  @Post('tickets/scan')
  async scanTicket(@Req() req, @Body() body: { ticketId: string, eventId: number }) {
    return this.appService.scanTicket(body.ticketId, body.eventId, req.user.id);
  }

  @ApiTags('Tickets')
  @UseGuards(SupabaseGuard)
  @Get('events/:id/attendees')
  async getAttendees(@Param('id') id: number, @Req() req) {
    return await this.appService.getEventAttendees(id, req.user.id);
  }

  // 🔥 ENDPOINT TIKET KHUSUS MOBILE (FLUTTER) - UDAH DI-UPGRADE!
  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Ambil list peserta untuk Event Dashboard Agen (Khusus Mobile)' })
  @UseGuards(SupabaseGuard) // 👈 Satpam tetep nyala
  @Get('events/:eventId/tickets')
  async getEventTickets(@Param('eventId') eventId: string, @Req() req) {
    return this.appService.getEventAttendees(Number(eventId), req.user.id);
  }

  // ==========================================
  // --- FITUR AGENTS (KEPANITIAAN) ---
  // ==========================================
  @ApiTags('Agents')
  @UseGuards(SupabaseGuard)
  @Post('events/:id/agents')
  async addAgent(@Param('id') eventId: number, @Req() req, @Body() body: { email: string; role?: string }) {
    return await this.appService.addAgent(eventId, req.user.id, body.email, body.role);
  }

  @ApiTags('Agents')
  @UseGuards(SupabaseGuard)
  @Get('events/:id/agents')
  async getEventAgents(@Param('id') eventId: number, @Req() req) {
    return await this.appService.getEventAgents(eventId, req.user.id);
  }

  @ApiTags('Agents')
  @UseGuards(SupabaseGuard)
  @Put('events/:id/agents/:agentId')
  async updateAgent(@Param('id') eventId: number, @Param('agentId') agentId: number, @Req() req, @Body() body: { role?: string; rating_given?: number }) {
    return await this.appService.updateAgent(eventId, req.user.id, agentId, body);
  }

  @ApiTags('Agents')
  @UseGuards(SupabaseGuard)
  @Delete('events/:id/agents/:agentId')
  async removeAgent(@Param('id') eventId: number, @Param('agentId') agentId: number, @Req() req) {
    return await this.appService.removeAgent(eventId, req.user.id, agentId);
  }

  @ApiTags('Agents')
  @UseGuards(SupabaseGuard)
  @Get('users/:id/assigned-events')
  async getAssignedEvents(@Req() req) {
    return await this.appService.getAssignedEvents(req.user.id);
  }

  // ==========================================
  // --- FITUR USERS & PROFILES ---
  // ==========================================
  @ApiTags('Users')
  @UseGuards(SupabaseGuard)
  @Put('users/:id')
  async updateProfile(@Req() req, @Body() data: any) {
    return await this.appService.updateProfile(req.user.id, data);
  }

  @ApiTags('Users')
  @ApiOperation({ summary: 'Menghapus akun permanen (User & Storage)' })
  @UseGuards(SupabaseGuard)
  @Delete('users/me')
  async deleteMyAccount(@Req() req) {
    return await this.appService.deleteUserAccount(req.user.id, req.user.email);
  }

  @UseGuards(SupabaseGuard)
  @Get('users/:id/scan-history')
  async getScanHistory(@Req() req) {
    return this.appService.getAgentScanHistory(req.user.id);
  }

  @ApiTags('Authentication & Users')
  @UseGuards(SupabaseGuard)
  @Get('auth/me')
  async getMe(@Req() req) {
    return req.user;
  }

  // ==========================================
  // --- FITUR NOTIFICATIONS ---
  // ==========================================
  
  // 🔥 ENDPOINT GET NOTIF (DIPAKAI MOBILE & WEB)
  @ApiTags('Notifications')
  @UseGuards(SupabaseGuard)
  @Get('notifications')
  async getMyNotifications(@Req() req) {
    return await this.appService.getMyNotifications(req.user.id);
  }

  // 🔥 ENDPOINT RESPOND NOTIF (KHUSUS MOBILE FLUTTER)
  @ApiTags('Notifications')
  @ApiOperation({ summary: 'Merespon undangan notifikasi (Khusus Mobile)' })
  @UseGuards(SupabaseGuard) // ⚠️ WAJIB PAKE GUARD BIAR TAU SIAPA YANG LOGIN
  @Post('notifications/respond')
  async respondNotif(@Req() req, @Body() body: { notifId: number; action: string }) {
    // KITA TEMBAK LANGSUNG KE FUNGSI ASLI YANG NGE-UPDATE DATABASE!
    return await this.appService.respondAgentInvitation(
      body.notifId, 
      req.user.id, 
      body.action as 'accept' | 'reject'
    );
  }

  // Rute notifikasi lama (tetap dibiarkan biar web nggak error kalau masih pakai ini)
  @ApiTags('Notifications')
  @UseGuards(SupabaseGuard)
  @Get('users/:id/notifications')
  async getNotifications(@Req() req) {
    return await this.appService.getNotifications(req.user.id);
  }

  @ApiTags('Notifications')
  @UseGuards(SupabaseGuard)
  @Post('notifications/:id/respond')
  async respondInvitation(@Param('id') notifId: number, @Req() req, @Body() body: { action: 'accept' | 'reject' }) {
    return await this.appService.respondAgentInvitation(notifId, req.user.id, body.action);
  }

  @ApiTags('Notifications')
  @UseGuards(SupabaseGuard)
  @Patch('notifications/:id/read')
  async markNotifRead(@Param('id') notifId: number, @Req() req) {
    return await this.appService.markNotificationRead(notifId, req.user.id);
  }

  // 🔥 ENDPOINT BARU: HAPUS SPESIFIK NOTIFIKASI 🔥
  @ApiTags('Notifications')
  @ApiOperation({ summary: 'Menghapus banyak notifikasi berdasarkan ID' })
  @UseGuards(SupabaseGuard)
  @Delete('notifications')
  async deleteNotifications(@Req() req, @Body() body: { notifIds: number[] }) {
    return await this.appService.deleteNotifications(body.notifIds, req.user.id);
  }

  // 🔥 ENDPOINT BARU: HAPUS SEMUA NOTIFIKASI 🔥
  @ApiTags('Notifications')
  @ApiOperation({ summary: 'Menghapus SEMUA notifikasi milik user yang login' })
  @UseGuards(SupabaseGuard)
  @Delete('notifications/all')
  async deleteAllNotifications(@Req() req) {
    return await this.appService.deleteAllNotifications(req.user.id);
  }

<<<<<<< HEAD
=======

>>>>>>> 2e9381a26812cf273ff9347d1cfcb3ca2295dac0
  // ==========================================
  // --- FITUR REPORTS / KENDALA ---
  // ==========================================
  @ApiTags('Reports')
  @UseGuards(SupabaseGuard)
  @Post('events/:id/reports')
  async createReport(@Param('id') eventId: number, @Req() req, @Body() body: { message: string }) {
    return await this.appService.createEventReport(eventId, req.user.id, body.message);
  }

  @ApiTags('Reports')
  @UseGuards(SupabaseGuard)
  @Get('events/:id/reports')
  async getReports(@Param('id') eventId: number, @Req() req) {
    return await this.appService.getEventReports(eventId, req.user.id);
  }

  @ApiTags('Reports')
  @UseGuards(SupabaseGuard)
  @Patch('reports/:id/resolve')
  async resolveReport(@Param('id') reportId: number, @Req() req) {
    return await this.appService.resolveEventReport(reportId, req.user.id);
  }

  // ==========================================
  // --- FITUR RECRUITMENT (JOB BOARD) ---
  // ==========================================
  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard)
  @Post('jobs')
  async createJob(@Req() req, @Body() body: any) {
    body.eoId = req.user.id;
    return await this.appService.createJobPosting(body);
  }

  @ApiTags('Recruitment')
  @Get('jobs')
  async getAllJobs(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 10;
    return await this.appService.getAllActiveJobs(pageNum, limitNum);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard)
  @Get('events/:id/jobs')
  async getEventJobs(@Param('id') eventId: string, @Req() req) {
    return await this.appService.getJobsByEvent(Number(eventId), req.user.id);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard)
  @Put('jobs/:id')
  async updateJob(@Param('id') jobId: string, @Req() req, @Body() body: any) {
    return await this.appService.updateJobPosting(Number(jobId), req.user.id, body);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard)
  @Post('jobs/apply')
  async applyJob(@Req() req, @Body() body: any) {
    return await this.appService.applyForJob(body.jobId, req.user.id);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard)
  @Get('events/:id/applicants')
  async getEventApplicants(@Param('id') eventId: string, @Req() req) {
    return await this.appService.getApplicantsByEvent(Number(eventId), req.user.id);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard)
  @Post('jobs/respond')
  async respondApplicant(@Req() req, @Body() body: any) {
    return await this.appService.respondToApplicant(body.applicationId, body.action, req.user.id);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard)
  @Delete('jobs/:id')
  async deleteJob(@Param('id') jobId: string, @Req() req) {
    return await this.appService.deleteJobPosting(Number(jobId), req.user.id);
  }

  // ==========================================
  // --- FITUR PAYOUT / PENGGAJIAN AGEN ---
  // ==========================================
  @ApiTags('Payout')
  @UseGuards(SupabaseGuard)
  @Get('events/:id/payouts')
  async getPayouts(@Param('id') eventId: string, @Req() req) {
    return await this.appService.getEventPayouts(Number(eventId), req.user.id);
  }

  @ApiTags('Payout')
  @UseGuards(SupabaseGuard)
  @Post('events/:id/payouts/pay')
  async markPaid(@Param('id') eventId: string, @Req() req, @Body() body: { agentId: number, amount: number, proofUrl: string }) {
    return await this.appService.markAgentPaid(Number(eventId), body.agentId, req.user.id, body.amount, body.proofUrl);
  }

  @UseGuards(SupabaseGuard)
  @Get('users/:id/payouts')
  async getAgentWalletPayouts(@Req() req) {
    return await this.appService.getAgentPayouts(req.user.id);
  }

  // ==========================================
  // --- FITUR PAYMENTS (MIDTRANS) & WEBHOOK ---
  // ==========================================
  @ApiTags('Payments')
  @Post('payment/test-midtrans')
  async testMidtrans(@Body() body: { orderId: string, amount: number, name: string, email: string, enabledPayments: string[] }) {
    return await this.appService.createMidtransTransaction(
      body.orderId, body.amount, { name: body.name, email: body.email }, body.enabledPayments
    );
  }

  @ApiTags('Payments')
  @Post('payment/webhook')
  async midtransWebhook(@Body() payload: any) {
    return await this.appService.handleMidtransWebhook(payload);
  }
}