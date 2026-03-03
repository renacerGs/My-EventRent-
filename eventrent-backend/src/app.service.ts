import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AppService implements OnModuleInit {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'eventrent_db',
      password: 'crissyen26', 
      port: 5432,
    });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
      console.log('Berhasil terhubung ke database PostgreSQL EventRent!');
    } catch (error) {
      console.error('Gagal terhubung ke database:', error);
    }
  }

  async getEvents() {
    try {
      // Query lo yang lama (tetap aman)
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, Mon YYYY - HH12.MI AM') as date, 
               e.location, e.image_url as img, c.name as category
        FROM events e
        JOIN categories c ON e.category_id = c.id
      `;
      const { rows } = await this.pool.query(query);
      return rows;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal mengambil data');
    }
  }

  // <--- BARU: Fungsi Login/Register User Google
  async loginWithGoogle(user: { email: string; name: string; picture: string; googleId: string }) {
    try {
      // 1. Cek dulu user sudah ada atau belum
      const checkQuery = 'SELECT * FROM users WHERE email = $1';
      const checkRes = await this.pool.query(checkQuery, [user.email]);

      if (checkRes.rows.length > 0) {
        // User lama -> Login sukses
        console.log('User lama login:', user.email);
        return checkRes.rows[0];
      } else {
        // User baru -> Simpan ke database
        const insertQuery = `
          INSERT INTO users (email, name, picture, google_id)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const insertRes = await this.pool.query(insertQuery, [
          user.email,
          user.name,
          user.picture,
          user.googleId
        ]);
        
        console.log('User baru terdaftar:', user.email);
        return insertRes.rows[0];
      }
    } catch (err) {
      console.error('Error saat login Google:', err);
      throw new InternalServerErrorException('Gagal memproses login');
    }
  }
}