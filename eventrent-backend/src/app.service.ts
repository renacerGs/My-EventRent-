import { Injectable, OnModuleInit, InternalServerErrorException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt'; 
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv'; 
import * as QRCode from 'qrcode';

dotenv.config(); 

@Injectable()
export class AppService implements OnModuleInit {
  private pool: Pool;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL, 
      ssl: {
        rejectUnauthorized: false,
      },
    });

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
      }
    });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
      console.log('Berhasil terhubung ke database PostgreSQL EventRent!');
      console.log('Database Check: OK! 🚀 (Alphanumeric Ticket Code Ready)');
    } catch (error) {
      console.error('Gagal terhubung ke database:', error);
    }
  }

  // 👇 FUNGSI BARU: GENERATOR KODE TIKET ALPHANUMERIC
  private generateTicketCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TKT-${code}`; // Hasil: TKT-A9X2B1
  }

  // --- EVENTS ---

  async getEvents() {
    try {
      const query = `
        SELECT e.id, e.title, 
               TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start,
               TO_CHAR(e.event_end, 'Dy, DD Mon YYYY') as date_end,
               e.name_place, e.city, e.place, e.location as old_location,
               e.image_url as img, c.name as category, e.is_private,
               COALESCE((SELECT MIN(price) FROM event_sessions WHERE event_id = e.id), 0) as price,
               COALESCE((SELECT SUM(stock) FROM event_sessions WHERE event_id = e.id), 0) as stock,
               e.description, e.views, u.name as author 
        FROM events e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN users u ON e.created_by = u.id 
        WHERE e.is_private = FALSE OR e.is_private IS NULL
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
               e.image_url as img, c.name as category, e.phone as contact, u.name as organizer_name,
               e.is_private, e.event_details
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
               start_time, end_time, contact_person, event_type, price, stock,
               name_place, place, city, province, map_url 
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

      const greetingsQuery = `
        SELECT name, greeting, time FROM (
          SELECT DISTINCT ON (attendee_email, greeting) 
                 attendee_name as name, 
                 greeting, 
                 TO_CHAR(purchase_date, 'DD Mon YYYY, HH24:MI') as time, 
                 purchase_date
          FROM tickets
          WHERE event_id = $1 AND greeting IS NOT NULL AND BTRIM(greeting) != ''
        ) sub
        ORDER BY purchase_date DESC
      `;
      const greetingsRes = await this.pool.query(greetingsQuery, [eventId]);
      eventData.greetings = greetingsRes.rows;

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
               e.name_place, e.city, e.place, e.location as old_location,
               e.image_url as img, c.name as category, e.is_private,
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
          created_by, phone, place, name_place, city, province, map_url, image_url, is_private, event_details
        )
        VALUES (
          $1, $2, $3, $4, (SELECT id FROM categories WHERE name = $5 LIMIT 1), 
          $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        RETURNING id
      `;
      const eventValues = [
        data.title, data.description, data.eventStart || null, data.eventEnd || null, 
        data.category, data.userId, data.phone, data.location?.place, 
        data.location?.namePlace, data.location?.city, data.location?.province, 
        data.location?.mapUrl || null, 
        data.img || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1000&q=80',
        data.isPrivate ? true : false,
        data.eventDetails ? JSON.stringify(data.eventDetails) : '{}' 
      ];
      
      const eventRes = await client.query(eventQuery, eventValues);
      const eventId = eventRes.rows[0].id;

      if (data.sessions && data.sessions.length > 0) {
        for (const session of data.sessions) {
          const sessionQuery = `
            INSERT INTO event_sessions 
            (event_id, name, description, session_date, start_time, end_time, contact_person, event_type, price, stock, name_place, place, city, province, map_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id
          `;
          const sessionValues = [
            eventId, session.name, session.description || session.ticketDesc, 
            session.date || null, session.startTime || '00:00', session.endTime || '00:00', 
            session.contactPerson, session.typeEvent, session.price || 0, session.stock || 0,
            session.location?.namePlace || null, session.location?.place || null, 
            session.location?.city || null, session.location?.province || null, session.location?.mapUrl || null
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
                sessionId, q.text, q.type, q.isRequired, q.options ? JSON.stringify(q.options) : '[]'
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
            category_id = (SELECT id FROM categories WHERE name = $11 LIMIT 1),
            is_private = $14,
            event_details = COALESCE($15, event_details)
        WHERE id = $12 AND created_by = $13
        RETURNING *
      `;
      const values = [
        data.title, data.description, data.eventStart, data.eventEnd,
        data.organizer, data.location?.place, data.location?.namePlace, data.location?.city, data.location?.province,
        data.img, data.category, eventId, userId, data.isPrivate ? true : false,
        data.eventDetails ? JSON.stringify(data.eventDetails) : null
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
  
  async buyTicket(userId: number | null, eventId: number, cart: any[], formAnswers: any, guestEmail?: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN'); 

      const boughtTickets: string[] = []; // 👈 FIX: Diubah jadi array of strings (TKT-XXX)
      let totalTransactionPrice = 0;

      const evRes = await client.query('SELECT title FROM events WHERE id = $1', [eventId]);
      const eventTitle = evRes.rows.length > 0 ? evRes.rows[0].title : 'Event';

      let targetEmail = guestEmail;
      if (userId) {
        const uRes = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (uRes.rows.length > 0) targetEmail = uRes.rows[0].email;
      }

      const isAttending = formAnswers.isAttending !== false; 
      
      if (!isAttending) {
        const firstSessionRes = await client.query('SELECT id FROM event_sessions WHERE event_id = $1 LIMIT 1', [eventId]);
        const dummySessionId = firstSessionRes.rows[0]?.id || null;
        
        const ticketCode = this.generateTicketCode(); // Generate code

        await client.query(
          `INSERT INTO tickets (event_id, session_id, user_id, price, guest_email, attendee_name, attendee_email, custom_answers, pax, greeting, is_attending, ticket_code) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [eventId, dummySessionId, userId, 0, targetEmail || null, formAnswers.attendee_name || 'Tamu', formAnswers.email || targetEmail || '', '[]', 0, formAnswers.greeting, false, ticketCode]
        );
        
        await client.query('COMMIT');
        return { message: 'Terima kasih atas doa dan ucapan Anda', ticketIds: [] };
      }

      // Proses normal jika HADIR
      for (const item of cart) {
        const sessionId = item.sessionId;
        const qty = item.qty || item.quantity || 1; 
        const paxPerTicket = Number(item.pax || formAnswers.pax || 1);
        const totalStockNeeded = qty * paxPerTicket;

        const sessionRes = await client.query('SELECT price, stock FROM event_sessions WHERE id = $1 FOR UPDATE', [sessionId]);
        if (sessionRes.rows.length === 0) throw new BadRequestException('Session tidak ditemukan');
        
        const session = sessionRes.rows[0];
        if (session.stock < totalStockNeeded) throw new BadRequestException(`Stok tiket tidak cukup untuk session ini! (Dibutuhkan: ${totalStockNeeded})`);

        await client.query('UPDATE event_sessions SET stock = stock - $1 WHERE id = $2', [totalStockNeeded, sessionId]);

        const qRes = await client.query('SELECT id, question_text FROM session_questions WHERE session_id = $1', [sessionId]);
        const dbQuestions = qRes.rows;

        // Generate Tiket Beserta TICKET CODE
        for (let i = 0; i < qty; i++) {
          const prefix = `cart-${item.id}-ticket-${i}`;
          
          const name = formAnswers[`${prefix}-nama`] || formAnswers.attendee_name || `Tamu ${i + 1}`;
          const email = formAnswers[`${prefix}-email`] || formAnswers.email || targetEmail || ``;
          const pax = paxPerTicket; 
          const greeting = formAnswers[`${prefix}-greeting`] || formAnswers.greeting || null;
          
          const ticketCode = this.generateTicketCode(); // 👈 FIX: Generate kode acak di sini!
          
          const customAnswers: any[] = [];
          for (const q of dbQuestions) {
             const ans = formAnswers[`${prefix}-q${q.id}`] || formAnswers[q.id];
             if (ans) {
                customAnswers.push({ question: q.question_text, answer: ans });
             }
          }

          const singlePrice = session.price;
          totalTransactionPrice += Number(singlePrice);

          // 👈 FIX: Masukin ticket_code ke query INSERT
          const ticketRes = await client.query(
            `INSERT INTO tickets (event_id, session_id, user_id, price, guest_email, attendee_name, attendee_email, custom_answers, pax, greeting, is_attending, ticket_code) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING ticket_code`,
            [eventId, sessionId, userId, singlePrice, targetEmail || null, name, email, JSON.stringify(customAnswers), pax, greeting, true, ticketCode]
          );
          
          const newTicketCode = ticketRes.rows[0].ticket_code;
          boughtTickets.push(newTicketCode);
        }
      }

      await client.query('COMMIT');

      // Kirim email QR Code pakai Array Kode (TKT-XXX)
      if (targetEmail && boughtTickets.length > 0) {
        this.sendEmailReceipt(targetEmail, eventTitle, boughtTickets, totalTransactionPrice, eventId)
          .catch(e => console.error("Gagal mengirim email struk:", e)); 
      }

      return { message: 'Pembelian tiket/RSVP berhasil', ticketIds: boughtTickets };

    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Error Buy Ticket Transaction:", err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Gagal memproses pembelian tiket');
    } finally {
      client.release();
    }
  }

  // 👇 GANTI WARNA JADI OREN (#FF6B35) 👇
  private async sendEmailReceipt(targetEmail: string, eventTitle: string, ticketCodes: string[], totalPrice: number, eventId: number) {
    let qrCodesHtml = '';
    const emailAttachments: any[] = []; 

    for (const code of ticketCodes) {
      const qrPayload = JSON.stringify({ ticketId: code, eventId: eventId });
      const qrDataUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', margin: 2, color: { dark: '#000000', light: '#ffffff' } });
      const uniqueCid = `qr-ticket-${code}@eventrent.com`;

      // 🔥 DESAIN TIKET HORIZONTAL ALA KONSER (TEMA OREN) 🔥
      qrCodesHtml += `
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 650px; margin: 20px auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.15); border-collapse: collapse; border: 1px solid #e2e8f0;">
          <tr>
            <td width="65%" style="padding: 30px; vertical-align: middle;">
              <h4 style="color: #FF6B35; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Admit One</h4>
              <h2 style="color: #0f172a; margin: 0 0 15px 0; font-size: 26px; line-height: 1.2; font-weight: 900;">${eventTitle}</h2>
              
              <p style="color: #64748b; font-size: 13px; margin: 0 0 25px 0; line-height: 1.5;">
                Tunjukkan QR Code di pintu masuk.<br/>Tiket ini bersifat rahasia dan hanya berlaku 1 kali scan.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: #94a3b8; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Status</p>
                    <h3 style="color: #10b981; font-size: 18px; margin: 5px 0 0 0; text-transform: uppercase;">PAID / LUNAS</h3>
                  </td>
                </tr>
              </table>
            </td>
            
            <td width="35%" style="background-color: #FF6B35; padding: 25px 20px; text-align: center; vertical-align: middle; border-left: 2px dashed rgba(255,255,255,0.4);">
              <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Entry Pass</h3>
              
              <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; display: inline-block; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <img src="cid:${uniqueCid}" alt="QR Code" style="width: 110px; height: 110px; display: block;" />
              </div>
              
              <p style="color: #ffffff; margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 16px; letter-spacing: 1.5px; font-weight: bold; background-color: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; display: inline-block;">
                ${code}
              </p>
            </td>
          </tr>
        </table>
      `;

      emailAttachments.push({
        filename: `qr-ticket-${code}.png`,
        path: qrDataUrl, 
        cid: uniqueCid 
      });
    }

    const mailOptions = {
      from: '"EventRent System" <noreply@eventrent.com>',
      to: targetEmail,
      subject: `🎟️ E-Ticket Anda: ${eventTitle}`,
      attachments: emailAttachments, 
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          
          <div style="text-align: center; padding: 20px 0;">
             <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">YOUR EVENT TICKETS</h1>
             <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Terima kasih telah melakukan pemesanan!</p>
          </div>
          
          ${qrCodesHtml}
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 15px; color: #334155;">Total Pembayaran Keseluruhan:</p>
            <h2 style="margin: 5px 0 0 0; color: #FF6B35; font-size: 24px;">Rp ${totalPrice.toLocaleString('id-ID')}</h2>
          </div>
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; line-height: 1.6;">
            Email ini dikirim secara otomatis oleh sistem.<br/>
            <strong>Powered by EventRent</strong>
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  // 👇 FIX: Di query trackTicket, getMyTickets, getEventAttendees kita alias ticket_code AS ticket_id 👇
  async trackTicket(ticketCode: string, email: string) {
    try {
      const checkQuery = `
        SELECT t.event_id, t.purchase_date::text as exact_time
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.ticket_code = $1 AND (t.guest_email = $2 OR u.email = $2)
      `;
      const checkRes = await this.pool.query(checkQuery, [ticketCode, email]);
      
      if (checkRes.rows.length === 0) throw new NotFoundException('Tiket tidak ditemukan. Pastikan Order ID dan Email sudah benar.');

      const { event_id, exact_time } = checkRes.rows[0];

      const query = `
        SELECT t.ticket_code as ticket_id, t.purchase_date, t.price, 
               t.attendee_name, t.attendee_email, t.custom_answers, t.is_scanned, t.pax, t.greeting, t.is_attending,
               e.id as event_id, e.title, e.image_url as img, 
               TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as event_date, e.place as location,
               s.name as session_name, TO_CHAR(s.session_date, 'Dy, DD Mon YYYY') as session_date, 
               s.start_time, s.end_time
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN event_sessions s ON t.session_id = s.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.event_id = $1 AND t.purchase_date::text = $2 AND (t.guest_email = $3 OR u.email = $3)
        ORDER BY t.id ASC
      `;
      const { rows } = await this.pool.query(query, [event_id, exact_time, email]);
      return rows; 
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Gagal melacak tiket di server.');
    }
  }

  async getMyTickets(userId: number) {
    try {
      const query = `
        SELECT t.ticket_code as ticket_id, t.purchase_date, t.price, 
               t.attendee_name, t.attendee_email, t.custom_answers, t.is_scanned, t.pax, t.greeting, t.is_attending,
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
      throw new InternalServerErrorException('Gagal mengambil tiket saya');
    }
  }

  async getEventAttendees(eventId: number, userId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event tidak ditemukan');
      if (eventCheck.rows[0].created_by != userId) throw new UnauthorizedException('Bukan pemilik event!');

      const query = `
        SELECT t.ticket_code as ticket_id, t.purchase_date, t.price,
               t.attendee_name, t.attendee_email, t.custom_answers, t.is_scanned, t.pax, t.greeting, t.is_attending,
               u.name as buyer_name, COALESCE(u.email, t.guest_email) as buyer_email, u.picture as buyer_pic,
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

  // 👇 FIX: Pakai ticketCode untuk validasi scan 👇
  async scanTicket(ticketCode: string, eventId: number, userId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event tidak ditemukan');
      if (eventCheck.rows[0].created_by != userId) throw new UnauthorizedException('Akses ditolak! Kamu bukan panitia event ini.');

      const ticketRes = await this.pool.query(`
        SELECT t.id, t.is_scanned, t.scanned_at, t.price, t.pax, t.greeting, t.is_attending,
               t.attendee_name, t.attendee_email, t.custom_answers, t.ticket_code,
               u.name as buyer_name, COALESCE(u.email, t.guest_email) as buyer_email, s.name as session_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        JOIN event_sessions s ON t.session_id = s.id
        WHERE t.ticket_code = $1 AND t.event_id = $2
      `, [ticketCode, eventId]);

      if (ticketRes.rows.length === 0) return { valid: false, message: 'TIKET PALSU ATAU SALAH EVENT!' };

      const ticket = ticketRes.rows[0];

      if (!ticket.is_attending) {
        return { valid: false, message: 'TAMU INI TELAH MENGKONFIRMASI TIDAK HADIR.' };
      }

      if (ticket.is_scanned) {
        const scanWaktu = new Date(ticket.scanned_at).toLocaleString('id-ID');
        return { valid: false, message: `TIKET SUDAH DIGUNAKAN pada ${scanWaktu}!`, data: ticket };
      }

      await this.pool.query('UPDATE tickets SET is_scanned = TRUE, scanned_at = NOW() WHERE ticket_code = $1', [ticketCode]);
      return { valid: true, message: 'SCAN SUKSES! Tiket Valid.', data: ticket };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
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
      
      const newUser = insertRes.rows[0];

      await this.pool.query(
        `UPDATE tickets SET user_id = $1 WHERE guest_email = $2 AND user_id IS NULL`,
        [newUser.id, newUser.email]
      );
      console.log(`[Auth] Auto-merged guest tickets for: ${newUser.email}`);

      return newUser;
    } catch (err) {
      console.error(err);
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
    
    const newUser = insertRes.rows[0];

    await this.pool.query(
      `UPDATE tickets SET user_id = $1 WHERE guest_email = $2 AND user_id IS NULL`,
      [newUser.id, newUser.email]
    );
    console.log(`[Auth] Auto-merged guest tickets for: ${newUser.email}`);

    const { password, ...user } = newUser;
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