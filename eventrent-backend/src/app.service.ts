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
      // PERBAIKAN: Tambahkan 'DD' agar angka tanggal ikut terkirim ke frontend
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, DD Mon YYYY - HH12.MI AM') as date, 
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
      // PERBAIKAN: Tambahkan 'DD' agar angka tanggal ikut terkirim ke frontend
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, DD Mon YYYY - HH12.MI AM') as date, 
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

  async incrementView(eventId: number) {
    try {
      await this.pool.query('UPDATE events SET views = views + 1 WHERE id = $1', [eventId]);
      return { message: 'View counted' };
    } catch (err) {
      console.error(err);
      return { message: 'Error counting view' };
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

  // --- LIKES FEATURE ---

  async toggleLike(userId: number, event_id: number) {
    try {
      const check = await this.pool.query(
        'SELECT id FROM user_likes WHERE user_id = $1 AND event_id = $2',
        [userId, event_id]
      );

      if (check.rows.length > 0) {
        await this.pool.query('DELETE FROM user_likes WHERE user_id = $1 AND event_id = $2', [userId, event_id]);
        return { liked: false };
      } else {
        await this.pool.query('INSERT INTO user_likes (user_id, event_id) VALUES ($1, $2)', [userId, event_id]);
        return { liked: true };
      }
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal memproses Like');
    }
  }

  async getMyLikes(userId: number) {
    try {
      // PERBAIKAN: Tambahkan 'DD' di format tanggal MyLikes
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, DD Mon YYYY - HH12.MI AM') as date, 
               e.location, e.image_url as img, c.name as category, e.price, e.views
        FROM events e
        JOIN user_likes ul ON e.id = ul.event_id
        JOIN categories c ON e.category_id = c.id
        WHERE ul.user_id = $1
        ORDER BY ul.created_at DESC
      `;
      const { rows } = await this.pool.query(query, [userId]);
      return rows;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal mengambil daftar Like');
    }
  }

  // --- TICKETS & ATTENDEES ---

  async buyTicket(userId: number, eventId: number, quantity: number) {
    try {
      const eventRes = await this.pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
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
      // PERBAIKAN: Tambahkan 'DD' di format tanggal MyTickets
      const query = `
        SELECT t.id as ticket_id, t.purchase_date, t.quantity, t.total_price,
               e.id as event_id, e.title, e.image_url as img, TO_CHAR(e.date_time, 'Dy, DD Mon YYYY - HH12.MI AM') as date, e.location
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

  async getEventAttendees(eventId: number, userId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event tidak ditemukan');
      if (eventCheck.rows[0].created_by != userId) throw new UnauthorizedException('Bukan pemilik event!');

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
      throw new InternalServerErrorException('Gagal mengambil data peserta');
    }
  }

  // --- AUTH & PROFILE ---

  async loginWithGoogle(user: any) {
    try {
      const checkRes = await this.pool.query('SELECT * FROM users WHERE email = $1', [user.email]);
      if (checkRes.rows.length > 0) return checkRes.rows[0];
      
      const defaultPic = user.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede,b6e3f4`;
      
      const insertRes = await this.pool.query(
        `INSERT INTO users (email, name, picture, google_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [user.email, user.name, defaultPic, user.googleId]
      );
      return insertRes.rows[0];
    } catch (err) {
      throw new InternalServerErrorException('Gagal login Google');
    }
  }

  async registerUser(data: any) {
    const checkRes = await this.pool.query('SELECT * FROM users WHERE email = $1', [data.email]);
    if (checkRes.rows.length > 0) throw new BadRequestException('Email sudah terdaftar!');
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const defaultPic = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede,b6e3f4`;
    
    const insertRes = await this.pool.query(
      `INSERT INTO users (name, email, password, picture) VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.name, data.email, hashedPassword, defaultPic]
    );
    const { password, ...user } = insertRes.rows[0];
    return user;
  }

  async loginUser(data: any) {
    const res = await this.pool.query('SELECT * FROM users WHERE email = $1', [data.email]);
    if (res.rows.length === 0) throw new UnauthorizedException('Email/Password salah');
    const user = res.rows[0];
    if (!user.password) throw new UnauthorizedException('Gunakan Login Google');
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Email/Password salah');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: number, data: any) {
    const res = await this.pool.query(
      `UPDATE users SET name = $1, picture = COALESCE($2, picture) WHERE id = $3 RETURNING id, name, email, picture`,
      [data.name, data.img || null, userId]
    );
    return res.rows[0];
  }

  async changePassword(userId: number, data: any) {
    const res = await this.pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = res.rows[0];
    if (!user?.password) throw new BadRequestException('User tidak punya password');
    if (!(await bcrypt.compare(data.oldPass, user.password))) throw new BadRequestException('Password lama salah!');
    const hashedNew = await bcrypt.hash(data.newPass, 10);
    await this.pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNew, userId]);
    return { message: 'Berhasil diubah' };
  }
}