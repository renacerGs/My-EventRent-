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
      
      // --- AUTO MIGRATE: Persiapan Database buat Fitur Scanner & Form Options ---
      await this.pool.query(`
        ALTER TABLE tickets 
        ADD COLUMN IF NOT EXISTS is_scanned BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP;
        
        ALTER TABLE session_questions 
        ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
      `);
      console.log('Database Update: Fitur Scanner & Form Custom Options Ready! 🚀');

    } catch (error) {
      console.error('Gagal terhubung ke database:', error);
    }
  }

  // --- EVENTS ---

  async getEvents() {
    try {
      const query = `
        SELECT e.id, e.title, 
               TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start,
               TO_CHAR(e.event_end, 'Dy, DD Mon YYYY') as date_end,
               TO_CHAR(e.date_time, 'Dy, DD Mon YYYY') as date_old,
               e.name_place, e.city, e.place, e.location as old_location,
               e.image_url as img, c.name as category, 
               COALESCE((SELECT MIN(price) FROM event_sessions WHERE event_id = e.id), 0) as price,
               COALESCE((SELECT SUM(stock) FROM event_sessions WHERE event_id = e.id), 0) as stock,
               e.description, e.views, u.name as author 
        FROM events e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN users u ON e.created_by = u.id 
        ORDER BY e.created_at DESC
      `;
      const { rows } = await this.pool.query(query);
      return rows;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal mengambil data');
    }
  }

  async getEventById(eventId: number) {
    try {
      const eventQuery = `
        SELECT e.id, e.title, e.description, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start, 
               TO_CHAR(e.event_end, 'Dy, DD Mon YYYY') as date_end, e.place, e.name_place, e.city, e.province, e.map_url,
               e.image_url as img, c.name as category, e.phone as contact, u.name as organizer_name
        FROM events e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.id = $1
      `;
      const eventRes = await this.pool.query(eventQuery, [eventId]);
      
      if (eventRes.rows.length === 0) {
        throw new BadRequestException('Event tidak ditemukan');
      }

      const eventData = eventRes.rows[0];

      const sessionQuery = `
        SELECT id, name, description, TO_CHAR(session_date, 'Dy, DD Mon YYYY') as date, 
               start_time, end_time, contact_person, event_type, price, stock
        FROM event_sessions
        WHERE event_id = $1
        ORDER BY session_date ASC, start_time ASC
      `;
      const sessionRes = await this.pool.query(sessionQuery, [eventId]);
      const sessions = sessionRes.rows;

      for (let session of sessions) {
        const qQuery = `SELECT id, question_text, answer_type, is_required, options FROM session_questions WHERE session_id = $1`;
        const qRes = await this.pool.query(qQuery, [session.id]);
        session.questions = qRes.rows;
      }

      eventData.sessions = sessions;
      return eventData;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      console.error("Error getEventById:", err);
      throw new InternalServerErrorException('Gagal mengambil detail event');
    }
  }

  async getMyEvents(userId: number) {
    try {
      const query = `
        SELECT e.id, e.title, 
               TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start,
               TO_CHAR(e.event_end, 'Dy, DD Mon YYYY') as date_end,
               TO_CHAR(e.date_time, 'Dy, DD Mon YYYY') as date_old,
               e.name_place, e.city, e.place, e.location as old_location,
               e.image_url as img, c.name as category, 
               COALESCE((SELECT MIN(price) FROM event_sessions WHERE event_id = e.id), 0) as price,
               COALESCE((SELECT SUM(stock) FROM event_sessions WHERE event_id = e.id), 0) as stock,
               e.description, e.views, u.name as author
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
    const client = await this.pool.connect(); 
    try {
      await client.query('BEGIN'); 

      const eventQuery = `
        INSERT INTO events (
          title, description, event_start, event_end, category_id, 
          created_by, phone, place, name_place, city, province, map_url, image_url
        )
        VALUES (
          $1, $2, $3, $4, (SELECT id FROM categories WHERE name = $5 LIMIT 1), 
          $6, $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING id
      `;
      const eventValues = [
        data.title, data.description, data.eventStart || null, data.eventEnd || null, 
        data.category, data.userId, data.phone, data.location?.place, 
        data.location?.namePlace, data.location?.city, data.location?.province, 
        data.location?.mapUrl || null, 
        data.img || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1000&q=80'
      ];
      
      const eventRes = await client.query(eventQuery, eventValues);
      const eventId = eventRes.rows[0].id;

      if (data.sessions && data.sessions.length > 0) {
        for (const session of data.sessions) {
          const sessionQuery = `
            INSERT INTO event_sessions 
            (event_id, name, description, session_date, start_time, end_time, contact_person, event_type, price, stock)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
          `;
          const sessionValues = [
            eventId, session.name, session.description || session.ticketDesc, 
            session.date || null, session.startTime || '00:00', session.endTime || '00:00', 
            session.contactPerson, session.typeEvent, session.price || 0, session.stock || 0
          ];
          const sessionRes = await client.query(sessionQuery, sessionValues);
          const sessionId = sessionRes.rows[0].id;

          if (session.questions && session.questions.length > 0) {
            for (const q of session.questions) {
              const questionQuery = `
                INSERT INTO session_questions (session_id, question_text, answer_type, is_required, options)
                VALUES ($1, $2, $3, $4, $5)
              `;
              await client.query(questionQuery, [
                sessionId, 
                q.text, 
                q.type, 
                q.isRequired, 
                q.options ? JSON.stringify(q.options) : '[]'
              ]);
            }
          }
        }
      }

      await client.query('COMMIT'); 
      return { message: 'Event berhasil dibuat!', eventId };
    } catch (err) {
      await client.query('ROLLBACK'); 
      console.error("Transaction Error Create Event:", err);
      throw new InternalServerErrorException('Gagal membuat event beserta detailnya');
    } finally {
      client.release(); 
    }
  }

  async updateEvent(eventId: number, userId: number, data: any) {
    try {
      const query = `
        UPDATE events 
        SET title = $1, description = $2, event_start = $3, event_end = $4,
            organizer = $5, place = $6, name_place = $7, city = $8, province = $9,
            image_url = COALESCE($10, image_url), 
            category_id = (SELECT id FROM categories WHERE name = $11 LIMIT 1)
        WHERE id = $12 AND created_by = $13
        RETURNING *
      `;
      const values = [
        data.title, data.description, data.eventStart, data.eventEnd,
        data.organizer, data.location?.place, data.location?.namePlace, data.location?.city, data.location?.province,
        data.img, data.category, eventId, userId
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

  async toggleLike(userId: number, event_id: number) {
    try {
      const check = await this.pool.query('SELECT id FROM user_likes WHERE user_id = $1 AND event_id = $2', [userId, event_id]);
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
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date, 
               e.place as location, e.image_url as img, c.name as category, e.views
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

  // --- TICKETS, ATTENDEES, & SCANNER ---
  
  // PERBAIKAN: userId sekarang bisa bernilai null (untuk Guest Checkout)
  async buyTicket(userId: number | null, eventId: number, cart: any[], formAnswers: any) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN'); 

      const boughtTickets: number[] = [];

      for (const item of cart) {
        const sessionId = item.sessionId;
        const qty = item.qty;

        const sessionRes = await client.query('SELECT price, stock FROM event_sessions WHERE id = $1 FOR UPDATE', [sessionId]);
        if (sessionRes.rows.length === 0) throw new BadRequestException('Session tidak ditemukan');
        
        const session = sessionRes.rows[0];
        if (session.stock < qty) throw new BadRequestException(`Stok tiket tidak cukup untuk session ini!`);

        await client.query('UPDATE event_sessions SET stock = stock - $1 WHERE id = $2', [qty, sessionId]);

        const totalPrice = session.price * qty;
        const ticketRes = await client.query(
          `INSERT INTO tickets (event_id, session_id, user_id, quantity, total_price) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [eventId, sessionId, userId, qty, totalPrice]
        );
        const ticketId = ticketRes.rows[0].id;
        boughtTickets.push(ticketId);

        const qRes = await client.query('SELECT id, question_text FROM session_questions WHERE session_id = $1', [sessionId]);
        const dbQuestions = qRes.rows;

        const attendeesData: any[] = [];
        
        for (let i = 0; i < qty; i++) {
          const prefix = `cart-${item.id}-ticket-${i}`;
          const name = formAnswers[`${prefix}-nama`] || `Peserta ${i + 1}`;
          const email = formAnswers[`${prefix}-email`] || ``;
          
          const customAnswers: any[] = [];
          for (const q of dbQuestions) {
             const ans = formAnswers[`${prefix}-q${q.id}`];
             if (ans) {
                customAnswers.push({ question: q.question_text, answer: ans });
             }
          }

          attendeesData.push({ name, email, customAnswers });
        }

        await client.query(`UPDATE tickets SET attendee_data = $1 WHERE id = $2`, [JSON.stringify(attendeesData), ticketId]);
      }

      await client.query('COMMIT');
      return { message: 'Pembelian tiket berhasil', ticketIds: boughtTickets };

    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Error Buy Ticket Transaction:", err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Gagal memproses pembelian tiket');
    } finally {
      client.release();
    }
  }

  async getMyTickets(userId: number) {
    try {
      const query = `
        SELECT t.id as ticket_id, t.purchase_date, t.quantity, t.total_price, t.attendee_data, t.is_scanned,
               e.id as event_id, e.title, e.image_url as img, 
               TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as event_date, e.place as location,
               s.name as session_name, TO_CHAR(s.session_date, 'Dy, DD Mon YYYY') as session_date, 
               s.start_time, s.end_time
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN event_sessions s ON t.session_id = s.id
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
        SELECT t.id as ticket_id, t.purchase_date, t.quantity, t.total_price, t.attendee_data, t.is_scanned,
               u.name as buyer_name, u.email as buyer_email, u.picture as buyer_pic,
               s.name as session_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        JOIN event_sessions s ON t.session_id = s.id
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

  // --- FUNGSI VALIDASI SCANNER QR CODE ---
  async scanTicket(ticketId: number, eventId: number, userId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event tidak ditemukan');
      if (eventCheck.rows[0].created_by != userId) throw new UnauthorizedException('Akses ditolak! Kamu bukan panitia event ini.');

      const ticketRes = await this.pool.query(`
        SELECT t.id, t.is_scanned, t.scanned_at, t.quantity, t.attendee_data,
               u.name as buyer_name, s.name as session_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        JOIN event_sessions s ON t.session_id = s.id
        WHERE t.id = $1 AND t.event_id = $2
      `, [ticketId, eventId]);

      if (ticketRes.rows.length === 0) {
        return { valid: false, message: 'TIKET PALSU ATAU SALAH EVENT!' };
      }

      const ticket = ticketRes.rows[0];

      if (ticket.is_scanned) {
        const scanWaktu = new Date(ticket.scanned_at).toLocaleString('id-ID');
        return { 
          valid: false, 
          message: `TIKET SUDAH DIGUNAKAN pada ${scanWaktu}!`,
          data: ticket
        };
      }

      await this.pool.query('UPDATE tickets SET is_scanned = TRUE, scanned_at = NOW() WHERE id = $1', [ticketId]);

      return { 
        valid: true, 
        message: 'SCAN SUKSES! Tiket Valid.',
        data: ticket 
      };

    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      console.error(err);
      throw new InternalServerErrorException('Gagal memproses validasi tiket');
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