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
    this.supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_KEY as string
    );

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

    try {
      // 3. CARI DATA DI DATABASE LOKAL
      const { rows } = await this.pool.query(
        'SELECT id, email, name, role, picture, phone, bank_name, bank_account, bank_account_name FROM users WHERE email = $1', 
        [email]
      );

      // 🔥 4. JURUS AUTO-HEAL: JIKA GHOST USER (TIDAK ADA DI TABEL LOKAL), INSERT OTOMATIS! 🔥
      if (rows.length === 0) {
        console.warn(`[Auto-Heal] User ${email} tidak ditemukan di tabel public.users. Membuat profil otomatis...`);
        
        const meta = user.user_metadata || {};
        const fullName = meta.custom_full_name || meta.full_name || meta.name || 'User Baru';
        const avatarUrl = meta.custom_avatar_url || meta.picture || meta.avatar_url || '';

        try {
          // 👇 KUNCI PERBAIKANNYA DI SINI BRO! 👇
          // Kita HAPUS 'id' dari kolom insert. Biar database Postgres lu yang otomatis ngasih angka ID-nya!
          const insertRes = await this.pool.query(
            `INSERT INTO users (email, name, picture) 
             VALUES ($1, $2, $3) 
             RETURNING id, email, name, role, picture, phone, bank_name, bank_account, bank_account_name`,
            [email, fullName, avatarUrl]
          );

          request.user = insertRes.rows[0]; 
          return true; 
        } catch (insertError) {
          console.error('Gagal melakukan auto-heal pada user:', insertError);
          throw new UnauthorizedException('Gagal sinkronisasi data akun. Hubungi Admin.');
        }
      }

      // 5. Titipin data user ke dalam request jika sudah ada
      request.user = rows[0]; 

      return true; // Pintu dibuka, silakan masuk ke Controller!
    } catch (dbError) {
      // Abaikan UnauthorizedException agar tetap terlempar ke frontend dengan benar
      if (dbError instanceof UnauthorizedException) throw dbError;
      
      console.error('Database Error di Guard:', dbError);
      throw new UnauthorizedException('Gagal memverifikasi user di database.');
    }
  }
}