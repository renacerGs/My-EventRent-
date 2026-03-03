import { Injectable, OnModuleInit, InternalServerErrorException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt'; 

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

  // --- EVENTS ---

  async getEvents() {
    try {
      // TAMBAH e.views DISINI
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, Mon YYYY - HH12.MI AM') as date, 
               e.location, e.image_url as img, c.name as category, e.price,
               e.description, e.phone, e.stock, e.views, u.name as author 
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

  async getMyEvents(userId: number) {
    try {
      // TAMBAH e.views DISINI
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, Mon YYYY - HH12.MI AM') as date, 
               e.location, e.image_url as img, c.name as category, e.price,
               e.description, e.phone, e.stock, e.views, u.name as author
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

  // <--- BARU: Increment Views (Counter)
  async incrementView(eventId: number) {
    try {
      await this.pool.query('UPDATE events SET views = views + 1 WHERE id = $1', [eventId]);
      return { message: 'View counted' };
    } catch (err) {
      console.error(err);
      // Gak perlu throw error fatal, biar user gak sadar kalau counter error dikit
      return { message: 'Error counting view' };
    }
  }

  // ... (SISA KODE Create, Update, Delete, Auth, Profile, Tickets TETAP SAMA SEPERTI SEBELUMNYA) ...
  // Paste ulang kode Create, Update, Delete, Auth, Profile, BuyTicket, GetMyTickets, GetAttendees dari versi terakhir.
  // Biar gak kepanjangan di chat, asumsikan bagian bawahnya sama persis ya bro!
  
  // (Pastikan fungsi getEventAttendees ada di sini juga)
  async getEventAttendees(eventId: number, userId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event tidak ditemukan');
      
      if (eventCheck.rows[0].created_by != userId) {
        throw new UnauthorizedException('Anda bukan pemilik event ini!');
      }

      const query = `
        SELECT t.id as ticket_id, t.purchase_date, t.quantity, t.total_price,
               u.name as buyer_name, u.email as buyer_email, u.picture as buyer_pic
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.event_id = $1
        ORDER BY t.purchase_date DESC
      `;
      const { rows } = await this.pool.query(query, [eventId]);
      return rows;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error(err);
      throw new InternalServerErrorException('Gagal mengambil data peserta');
    }
  }

  async createEvent(data: any) {
    try {
      const fullDateTime = `${data.date} ${data.time}`; 
      const query = `
        INSERT INTO events (title, date_time, location, description, price, image_url, category_id, created_by, phone, stock)
        VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM categories WHERE name = $7 LIMIT 1), $8, $9, $10)
        RETURNING *
      `;
      const values = [
        data.title, fullDateTime, data.location, data.description, 
        data.price || 0, 
        data.img || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1000&q=80', 
        data.category, data.userId, data.phone || null,
        data.stock || 0 
      ];
      const res = await this.pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      console.error("Error Create Event:", err);
      throw new InternalServerErrorException('Gagal membuat event');
    }
  }

  async updateEvent(eventId: number, userId: number, data: any) {
    try {
      const fullDateTime = `${data.date} ${data.time}`; 
      const query = `
        UPDATE events 
        SET title = $1, date_time = $2, location = $3, description = $4, price = $5, 
            image_url = COALESCE($6, image_url), 
            category_id = (SELECT id FROM categories WHERE name = $7 LIMIT 1),
            phone = $8,
            stock = $9
        WHERE id = $10 AND created_by = $11
        RETURNING *
      `;
      const values = [
        data.title, fullDateTime, data.location, data.description, data.price, 
        data.img, data.category, data.phone, 
        data.stock, 
        eventId, userId
      ];
      const res = await this.pool.query(query, values);
      if (res.rowCount === 0) throw new InternalServerErrorException('Event not found or unauthorized');
      return res.rows[0];
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal update event');
    }
  }

  async deleteEvent(eventId: number, userId: number) {
    try {
      const query = 'DELETE FROM events WHERE id = $1 AND created_by = $2 RETURNING *';
      const res = await this.pool.query(query, [eventId, userId]);
      if (res.rowCount === 0) throw new InternalServerErrorException('Event not found or unauthorized');
      return { message: 'Event deleted successfully' };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal menghapus event');
    }
  }

  async loginWithGoogle(user: { email: string; name: string; picture: string; googleId: string }) {
    try {
      const checkQuery = 'SELECT * FROM users WHERE email = $1';
      const checkRes = await this.pool.query(checkQuery, [user.email]);

      if (checkRes.rows.length > 0) {
        return checkRes.rows[0];
      } else {
        const insertQuery = `INSERT INTO users (email, name, picture, google_id) VALUES ($1, $2, $3, $4) RETURNING *`;
        const insertRes = await this.pool.query(insertQuery, [user.email, user.name, user.picture, user.googleId]);
        return insertRes.rows[0];
      }
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal memproses login Google');
    }
  }

  async registerUser(data: { name: string; email: string; password: string }) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) throw new BadRequestException('Format email tidak valid!');
      if (data.password.length < 6) throw new BadRequestException('Password minimal 6 karakter!');
      const checkQuery = 'SELECT * FROM users WHERE email = $1';
      const checkRes = await this.pool.query(checkQuery, [data.email]);
      if (checkRes.rows.length > 0) throw new BadRequestException('Email is already registered!');
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const defaultPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;
      const insertQuery = `INSERT INTO users (name, email, password, picture) VALUES ($1, $2, $3, $4) RETURNING *`;
      const insertRes = await this.pool.query(insertQuery, [data.name, data.email, hashedPassword, defaultPic]);
      const { password, ...userWithoutPassword } = insertRes.rows[0];
      return userWithoutPassword;
  }

  async loginUser(data: { email: string; password: string }) {
      const query = 'SELECT * FROM users WHERE email = $1';
      const res = await this.pool.query(query, [data.email]);
      if (res.rows.length === 0) throw new UnauthorizedException('Invalid email or password');
      const user = res.rows[0];
      if (!user.password) throw new UnauthorizedException('Please login with Google');
      const isMatch = await bcrypt.compare(data.password, user.password);
      if (!isMatch) throw new UnauthorizedException('Invalid email or password');
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
  }

  async updateProfile(userId: number, data: { name: string; img?: string }) {
    try {
      const query = `UPDATE users SET name = $1, picture = COALESCE($2, picture) WHERE id = $3 RETURNING id, name, email, picture, google_id`;
      const res = await this.pool.query(query, [data.name, data.img || null, userId]);
      if (res.rowCount === 0) throw new InternalServerErrorException('User not found');
      return res.rows[0];
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal update profile');
    }
  }

  async changePassword(userId: number, data: { oldPass: string; newPass: string }) {
    try {
      const query = 'SELECT password FROM users WHERE id = $1';
      const res = await this.pool.query(query, [userId]);
      const user = res.rows[0];
      if (!user || !user.password) throw new BadRequestException('User tidak memiliki password (Login Google)');
      const isMatch = await bcrypt.compare(data.oldPass, user.password);
      if (!isMatch) throw new BadRequestException('Password lama salah!');
      const hashedNewPass = await bcrypt.hash(data.newPass, 10);
      await this.pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPass, userId]);
      return { message: 'Password berhasil diubah' };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      console.error(err);
      throw new InternalServerErrorException('Gagal ganti password');
    }
  }

  async buyTicket(userId: number, eventId: number, quantity: number) {
    try {
      const eventQuery = 'SELECT * FROM events WHERE id = $1';
      const eventRes = await this.pool.query(eventQuery, [eventId]);
      const event = eventRes.rows[0];
      if (!event) throw new BadRequestException('Event tidak ditemukan');
      if (event.stock < quantity) throw new BadRequestException(`Stok tidak cukup!`);
      await this.pool.query('UPDATE events SET stock = stock - $1 WHERE id = $2', [quantity, eventId]);
      const totalPrice = event.price * quantity;
      const insertQuery = `INSERT INTO tickets (event_id, user_id, quantity, total_price) VALUES ($1, $2, $3, $4) RETURNING *`;
      const ticketRes = await this.pool.query(insertQuery, [eventId, userId, quantity, totalPrice]);
      return ticketRes.rows[0];
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      console.error(err);
      throw new InternalServerErrorException('Gagal membeli tiket');
    }
  }

  async getMyTickets(userId: number) {
    try {
      const query = `
        SELECT t.id as ticket_id, t.purchase_date, t.quantity, t.total_price,
               e.id as event_id, e.title, e.image_url as img, TO_CHAR(e.date_time, 'Dy, Mon YYYY - HH12.MI AM') as date, e.location
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        WHERE t.user_id = $1
        ORDER BY t.purchase_date DESC
      `;
      const { rows } = await this.pool.query(query, [userId]);
      return rows;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal mengambil tiket saya');
    }
  }
}