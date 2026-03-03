import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AppService implements OnModuleInit {
  private pool: Pool;

  constructor() {
    // Pengaturan koneksi ke database Anda
    this.pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'eventrent_db',
      password: 'crissyen26', // <--- UBAH DI SINI
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

  // Mengambil data dari tabel events dan categories
  async getEvents() {
    try {
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
}