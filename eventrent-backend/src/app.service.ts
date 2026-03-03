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
               e.phone, -- <--- TAMBAH INI
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
               e.phone, -- <--- TAMBAH INI JUGA
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
        INSERT INTO events (title, date_time, location, description, price, image_url, category_id, created_by, phone)
        VALUES (
            $1, $2, $3, $4, $5, 
            $6, 
            (SELECT id FROM categories WHERE name = $7 LIMIT 1), 
            $8,
            $9 -- <--- Placeholder baru untuk phone
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
        data.userId,
        data.phone || null // <--- Masukkan data phone dari frontend
      ];
      
      const res = await this.pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      console.error("Error Create Event:", err);
      throw new InternalServerErrorException('Gagal membuat event');
    }
  }

  // 4. Update Event
  async updateEvent(eventId: number, userId: number, data: any) {
    try {
      const fullDateTime = `${data.date} ${data.time}`; 
      
      const query = `
        UPDATE events 
        SET title = $1, 
            date_time = $2, 
            location = $3, 
            description = $4, 
            price = $5, 
            image_url = COALESCE($6, image_url), 
            category_id = (SELECT id FROM categories WHERE name = $7 LIMIT 1),
            phone = $8 -- <--- Update kolom phone
        WHERE id = $9 AND created_by = $10
        RETURNING *
      `;

      const values = [
        data.title, 
        fullDateTime, 
        data.location, 
        data.description, 
        data.price, 
        data.img, 
        data.category,
        data.phone, // <--- Data phone baru
        eventId,
        userId
      ];

      const res = await this.pool.query(query, values);

      if (res.rowCount === 0) {
        throw new InternalServerErrorException('Event not found or unauthorized');
      }

      return res.rows[0];
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal update event');
    }
  }

  // ... (Fungsi loginWithGoogle dan deleteEvent TETAP SAMA, tidak perlu diubah)
  // Login Google
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

  // Hapus Event
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