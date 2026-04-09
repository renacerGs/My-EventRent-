// src/dto/buy-ticket.dto.ts
import { IsInt, IsEmail, IsOptional, IsString, IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuyTicketDto {
  @ApiProperty({ description: 'ID Event' })
  @IsInt({ message: 'eventId harus berupa angka' })
  eventId!: number; // 👈 FIX: Cuma ditambahin tanda seru (!) di sini bro

  // 👇 Opsional, karena kalau user udah login, userId yang dipakai
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({ description: 'Email tamu (wajib untuk kirim E-Ticket)' })
  @IsOptional() // Opsional karena pakai "guestEmail" atau "guest_email"
  @IsEmail({}, { message: 'Format email tidak valid' })
  guestEmail?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  guest_email?: string;

  // --- 👇 KHUSUS UNTUK PUBLIC EVENT 👇 ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  cart?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  formAnswers?: any;

  // --- 👇 KHUSUS UNTUK PERSONAL/WEDDING RSVP 👇 ---
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sessionId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  pax?: any; // Kita biarkan any/string dulu karena dari form kadang berupa string "2"

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attendee_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  greeting?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  custom_answers?: any;
}