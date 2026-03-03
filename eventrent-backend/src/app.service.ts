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

  // 1. Ambil SEMUA event (Untuk Home Page)
  async getEvents() {
    try {
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, Mon YYYY - HH12.MI AM') as date, 
               e.location, e.image_url as img, c.name as category, e.price,
               e.description,  
               u.name as author 
        FROM events e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN users u ON e.created_by = u.id 
        ORDER BY e.date_time DESC
      `;
      const { rows } = await this.pool.query(query);
      return rows;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal mengambil data');
    }
  }

  // 2. Ambil Event KHUSUS User Login (Untuk Manage Event)
  async getMyEvents(userId: number) {
    try {
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, Mon YYYY - HH12.MI AM') as date, 
               e.location, e.image_url as img, c.name as category, e.price,
               e.description, 
               u.name as author
        FROM events e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.created_by = $1  
        ORDER BY e.created_at DESC
      `;
      const { rows } = await this.pool.query(query, [userId]);
      return rows;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal mengambil event saya');
    }
  }

  // 3. Create Event
  async createEvent(data: any) {
    try {
      const fullDateTime = `${data.date} ${data.time}`; 

      const query = `
        INSERT INTO events (title, date_time, location, description, price, image_url, category_id, created_by)
        VALUES (
            $1, $2, $3, $4, $5, 
            $6, 
            (SELECT id FROM categories WHERE name = $7 LIMIT 1), 
            $8
        )
        RETURNING *
      `;

      const values = [
        data.title, 
        fullDateTime, 
        data.location, 
        data.description, 
        data.price || 0, 
        data.img || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1000&q=80', 
        data.category, 
        data.userId 
      ];
      
      const res = await this.pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      console.error("Error Create Event:", err);
      throw new InternalServerErrorException('Gagal membuat event');
    }
  }

  // 4. Login Google
  async loginWithGoogle(user: { email: string; name: string; picture: string; googleId: string }) {
    try {
      const checkQuery = 'SELECT * FROM users WHERE email = $1';
      const checkRes = await this.pool.query(checkQuery, [user.email]);

      if (checkRes.rows.length > 0) {
        return checkRes.rows[0];
      } else {
        const insertQuery = `
          INSERT INTO users (email, name, picture, google_id)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const insertRes = await this.pool.query(insertQuery, [user.email, user.name, user.picture, user.googleId]);
        return insertRes.rows[0];
      }
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal memproses login');
    }
  }

  // 5. Hapus Event
  async deleteEvent(eventId: number, userId: number) {
    try {
      const query = 'DELETE FROM events WHERE id = $1 AND created_by = $2 RETURNING *';
      const res = await this.pool.query(query, [eventId, userId]);
      
      if (res.rowCount === 0) {
        throw new InternalServerErrorException('Event not found or unauthorized');
      }
      
      return { message: 'Event deleted successfully' };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal menghapus event');
    }
  }
}