// src/app.controller.ts
import { Controller, Get, Post, Body, Query, Delete, Param, Put, Patch, UseGuards, Req } from '@nestjs/common'; 
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BuyTicketDto } from './dto/buy-ticket.dto';

// 👇 IMPORT SATPAM KITA (Pastikan path-nya sesuai dengan lokasi file supabase.guard.ts lu ya!)
import { SupabaseGuard } from './supabase.guard'; 

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ==========================================
  // --- EVENTS ---
  // ==========================================
  @ApiTags('Events') 
  @ApiOperation({ summary: 'Mendapatkan semua event' })
  @Get('events') 
  async getEvents() {
    return await this.appService.getEvents(); // Public (Bebas akses)
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mendapatkan event yang dibuat oleh user tertentu' })
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('events/my')
  async getMyEvents(@Req() req) {
    return await this.appService.getMyEvents(req.user.id);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mendapatkan detail satu event beserta sesinya' })
  @Get('events/:id')
  async getEventById(@Param('id') id: number) {
    return await this.appService.getEventById(id); // Public (Bebas akses)
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Membuat event baru' })
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('events')
  async createEvent(@Req() req, @Body() eventData: any) {
    eventData.userId = req.user.id; // Otomatis pakai ID dari token
    return await this.appService.createEvent(eventData);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menghapus event' })
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Delete('events/:id')
  async deleteEvent(@Param('id') id: number, @Req() req) {
    return await this.appService.deleteEvent(id, req.user.id);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Mengubah data event' })
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Put('events/:id')
  async updateEvent(@Param('id') id: number, @Req() req, @Body() eventData: any) {
    return await this.appService.updateEvent(id, req.user.id, eventData);
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menambah jumlah tayangan (views) event' })
  @Post('events/:id/view')
  async incrementView(@Param('id') id: number) {
    return await this.appService.incrementView(id); // Public
  }

  @ApiTags('Events')
  @ApiOperation({ summary: 'Menyalakan/mematikan visibilitas event' })
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Patch('events/:id/visibility')
  async toggleVisibility(@Param('id') id: number, @Req() req) {
    return await this.appService.toggleEventVisibility(id, req.user.id);
  }

  // ==========================================
  // --- LIKES ---
  // ==========================================
  @ApiTags('Likes')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('likes/toggle')
  async toggleLike(@Req() req, @Body() data: { eventId: number }) {
    return await this.appService.toggleLike(req.user.id, data.eventId);
  }

  @ApiTags('Likes')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('likes/my')
  async getMyLikes(@Req() req) {
    return await this.appService.getMyLikes(req.user.id);
  }

  // ==========================================
  // --- TICKETS ---
  // ==========================================
  @ApiTags('Tickets')
  @ApiOperation({ summary: 'Membeli tiket (Bebas Satpam biar Guest bisa beli)' })
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
      finalAnswers = { ...data.custom_answers, "attendee_name": data.attendee_name, "greeting": data.greeting };
    }

    // 🔥 FIX ERROR 500 UUID: Kalau userId bentuknya string(UUID), kita null-kan biar database nggak crash.
    const safeUserId = typeof data.userId === 'number' ? data.userId : null;

    return await this.appService.buyTicket(safeUserId, data.eventId, finalCart || [], finalAnswers, email);
  }

  @ApiTags('Tickets')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('tickets/my')
  async getMyTickets(@Req() req) {
    return await this.appService.getMyTickets(req.user.id);
  }

  @ApiTags('Tickets')
  @Post('tickets/track')
  async trackTicket(@Body() data: { ticketId: string; email: string }) { 
    return await this.appService.trackTicket(data.ticketId, data.email); // Public
  }

  @ApiTags('Tickets')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('events/:id/attendees')
  async getAttendees(@Param('id') id: number, @Req() req) {
    return await this.appService.getEventAttendees(id, req.user.id);
  }

  @ApiTags('Tickets')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('tickets/scan')
  async scanTicket(@Req() req, @Body() body: { ticketId: string, eventId: number }) {
    return this.appService.scanTicket(body.ticketId, body.eventId, req.user.id);
  }

  // ==========================================
  // --- AGENTS (KEPANITIAAN) ---
  // ==========================================
  @ApiTags('Agents')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('events/:id/agents')
  async addAgent(@Param('id') eventId: number, @Req() req, @Body() body: { email: string; role?: string }) {
    return await this.appService.addAgent(eventId, req.user.id, body.email, body.role);
  }

  @ApiTags('Agents')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('events/:id/agents')
  async getEventAgents(@Param('id') eventId: number, @Req() req) {
    return await this.appService.getEventAgents(eventId, req.user.id);
  }

  @ApiTags('Agents')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Put('events/:id/agents/:agentId')
  async updateAgent(@Param('id') eventId: number, @Param('agentId') agentId: number, @Req() req, @Body() body: { role?: string; rating_given?: number }) {
    return await this.appService.updateAgent(eventId, req.user.id, agentId, body);
  }

  @ApiTags('Agents')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Delete('events/:id/agents/:agentId')
  async removeAgent(@Param('id') eventId: number, @Param('agentId') agentId: number, @Req() req) {
    return await this.appService.removeAgent(eventId, req.user.id, agentId);
  }

  @ApiTags('Agents')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM (Dan Fix UUID di URL)
  @Get('users/:id/assigned-events')
  async getAssignedEvents(@Req() req) {
    return await this.appService.getAssignedEvents(req.user.id);
  }

  // ==========================================
  // --- USERS & PROFILES ---
  // ==========================================
  @ApiTags('Users')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM (Fix UUID di URL)
  @Put('users/:id')
  async updateProfile(@Req() req, @Body() data: any) {
    return await this.appService.updateProfile(req.user.id, data);
  }

  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM (Fix UUID di URL)
  @Get('users/:id/scan-history')
  async getScanHistory(@Req() req) {
    return this.appService.getAgentScanHistory(req.user.id);
  }

  @ApiTags('Authentication & Users')
  @UseGuards(SupabaseGuard)
  @Get('auth/me')
  async getMe(@Req() req) {
    // Karena Satpam udah ngebawa data lengkap, kita tinggal lempar balik ke Frontend
    return req.user;
  }

  // ==========================================
  // --- NOTIFICATIONS ---
  // ==========================================
  @ApiTags('Notifications')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM (Fix UUID di URL)
  @Get('users/:id/notifications')
  async getNotifications(@Req() req) {
    return await this.appService.getNotifications(req.user.id);
  }

  @ApiTags('Notifications')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('notifications/:id/respond')
  async respondInvitation(@Param('id') notifId: number, @Req() req, @Body() body: { action: 'accept' | 'reject' }) {
    return await this.appService.respondAgentInvitation(notifId, req.user.id, body.action);
  }

  @ApiTags('Notifications')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Patch('notifications/:id/read')
  async markNotifRead(@Param('id') notifId: number, @Req() req) {
    return await this.appService.markNotificationRead(notifId, req.user.id);
  }

  // ==========================================
  // --- REPORTS / KENDALA ---
  // ==========================================
  @ApiTags('Reports')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('events/:id/reports')
  async createReport(@Param('id') eventId: number, @Req() req, @Body() body: { message: string }) {
    return await this.appService.createEventReport(eventId, req.user.id, body.message);
  }

  @ApiTags('Reports')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('events/:id/reports')
  async getReports(@Param('id') eventId: number, @Req() req) {
    return await this.appService.getEventReports(eventId, req.user.id);
  }

  @ApiTags('Reports')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Patch('reports/:id/resolve')
  async resolveReport(@Param('id') reportId: number, @Req() req) {
    return await this.appService.resolveEventReport(reportId, req.user.id);
  }

  // ==========================================
  // --- RECRUITMENT (JOB BOARD) ---
  // ==========================================
  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
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
    return await this.appService.getAllActiveJobs(pageNum, limitNum); // Public (biar gampang dicari)
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('events/:id/jobs')
  async getEventJobs(@Param('id') eventId: string, @Req() req) {
    return await this.appService.getJobsByEvent(Number(eventId), req.user.id);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('jobs/apply')
  async applyJob(@Req() req, @Body() body: any) {
    return await this.appService.applyForJob(body.jobId, req.user.id);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('events/:id/applicants')
  async getEventApplicants(@Param('id') eventId: string, @Req() req) {
    return await this.appService.getApplicantsByEvent(Number(eventId), req.user.id);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('jobs/respond')
  async respondApplicant(@Req() req, @Body() body: any) {
    return await this.appService.respondToApplicant(body.applicationId, body.action, req.user.id);
  }

  @ApiTags('Recruitment')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Delete('jobs/:id')
  async deleteJob(@Param('id') jobId: string, @Req() req) {
    return await this.appService.deleteJobPosting(Number(jobId), req.user.id);
  }

  // ==========================================
  // --- PAYOUT / PENGGAJIAN AGEN ---
  // ==========================================
  @ApiTags('Payout')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Get('events/:id/payouts')
  async getPayouts(@Param('id') eventId: string, @Req() req) {
    return await this.appService.getEventPayouts(Number(eventId), req.user.id);
  }

  @ApiTags('Payout')
  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM
  @Post('events/:id/payouts/pay')
  async markPaid(@Param('id') eventId: string, @Req() req, @Body() body: { agentId: number, amount: number, proofUrl: string }) {
    return await this.appService.markAgentPaid(Number(eventId), body.agentId, req.user.id, body.amount, body.proofUrl);
  }

  @UseGuards(SupabaseGuard) // 🔥 DIJAGA SATPAM (Fix UUID URL)
  @Get('users/:id/payouts')
  async getAgentWalletPayouts(@Req() req) {
    return await this.appService.getAgentPayouts(req.user.id);
  }

  // ==========================================
  // --- PAYMENTS (MIDTRANS) ---
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