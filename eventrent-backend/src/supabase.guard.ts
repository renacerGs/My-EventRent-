// src/supabase.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class SupabaseGuard implements CanActivate {
  private supabase: SupabaseClient;
  private pool: Pool;

  constructor() {
    // 1. Koneksi ke Supabase (TAMBAHIN as string)
    this.supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_KEY as string
    );

    // 2. Koneksi ke Database PostgreSQL lu (TAMBAHIN as string juga)
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL as string,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 1. Cek apakah ada Token di Header?
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Akses ditolak! Token tidak ditemukan atau format salah.');
    }

    const token = authHeader.split(' ')[1];

    // 2. Tanya ke Supabase: Token ini valid gak?
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Token tidak valid atau sudah kadaluarsa!');
    }

    const email = user.email;

    // 3. CARI ID ANGKA DI DATABASE LOKAL LU BERDASARKAN EMAIL
    try {
      const { rows } = await this.pool.query(
        'SELECT id, email, name, role, picture, phone, bank_name, bank_account, bank_account_name FROM users WHERE email = $1', 
        [email]
      );

      if (rows.length === 0) {
        throw new UnauthorizedException('User belum terdaftar di database utama!');
      }

      // 4. Titipin data user (termasuk ID Angka) ke dalam request
      request.user = rows[0]; 

      return true; // Pintu dibuka, silakan masuk ke Controller!
    } catch (dbError) {
      console.error('Database Error di Guard:', dbError);
      throw new UnauthorizedException('Gagal memverifikasi user di database.');
    }
  }
}