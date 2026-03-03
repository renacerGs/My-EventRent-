import { Controller, Get, Post, Body } from '@nestjs/common'; 
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('events') 
  async getEvents() {
    return await this.appService.getEvents();
  }
  
  // Endpoint buat Login Google
  @Post('auth/google')
  async googleLogin(@Body() userData: { email: string; name: string; picture: string; googleId: string }) {
    return await this.appService.loginWithGoogle(userData);
  }
}