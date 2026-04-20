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
      max: 5, 
      idleTimeoutMillis: 30000, 
      connectionTimeoutMillis: 5000, 
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

  private generateTicketCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TKT-${code}`; 
  }

  // --- EVENTS ---

  async getEvents() {
    try {
      const query = `
        SELECT e.id, e.title, 
               TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start,
               TO_CHAR(e.event_end, 'Dy, DD Mon YYYY') as date_end,
               e.name_place, e.city, e.place, 
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
               e.name_place, e.city, e.place, 
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

  async toggleEventVisibility(eventId: number, userId: number) {
    try {
      const checkRes = await this.pool.query('SELECT is_private FROM events WHERE id = $1 AND created_by = $2', [eventId, userId]);
      
      if (checkRes.rows.length === 0) {
        throw new UnauthorizedException('Event tidak ditemukan atau bukan milikmu!');
      }

      const currentStatus = checkRes.rows[0].is_private;
      const newStatus = !currentStatus;

      const updateRes = await this.pool.query(
        'UPDATE events SET is_private = $1 WHERE id = $2 RETURNING id, is_private',
        [newStatus, eventId]
      );

      return { 
        message: newStatus ? 'Event disembunyikan (Private)' : 'Event ditampilkan (Public)',
        isPrivate: updateRes.rows[0].is_private 
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error("Error toggleEventVisibility:", err);
      throw new InternalServerErrorException('Gagal mengubah visibilitas event');
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

      const boughtTickets: string[] = []; 
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
        
        const ticketCode = this.generateTicketCode(); 

        await client.query(
          `INSERT INTO tickets (event_id, session_id, user_id, price, guest_email, attendee_name, attendee_email, custom_answers, pax, greeting, is_attending, ticket_code) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [eventId, dummySessionId, userId, 0, targetEmail || null, formAnswers.attendee_name || 'Tamu', formAnswers.email || targetEmail || '', '[]', 0, formAnswers.greeting, false, ticketCode]
        );
        
        await client.query('COMMIT');
        return { message: 'Terima kasih atas doa dan ucapan Anda', ticketIds: [] };
      }

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

        for (let i = 0; i < qty; i++) {
          const prefix = `cart-${item.id}-ticket-${i}`;
          
          const name = formAnswers[`${prefix}-nama`] || formAnswers.attendee_name || `Tamu ${i + 1}`;
          const email = formAnswers[`${prefix}-email`] || formAnswers.email || targetEmail || ``;
          const pax = paxPerTicket; 
          const greeting = formAnswers[`${prefix}-greeting`] || formAnswers.greeting || null;
          
          const ticketCode = this.generateTicketCode(); 
          
          const customAnswers: any[] = [];
          for (const q of dbQuestions) {
             const ans = formAnswers[`${prefix}-q${q.id}`] || formAnswers[q.id];
             if (ans) {
                customAnswers.push({ question: q.question_text, answer: ans });
             }
          }

          const singlePrice = session.price;
          totalTransactionPrice += Number(singlePrice);

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

  private async sendEmailReceipt(targetEmail: string, eventTitle: string, ticketCodes: string[], totalPrice: number, eventId: number) {
    let qrCodesHtml = '';
    const emailAttachments: any[] = []; 

    for (const code of ticketCodes) {
      const qrPayload = JSON.stringify({ ticketId: code, eventId: eventId });
      const qrDataUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', margin: 2, color: { dark: '#000000', light: '#ffffff' } });
      const uniqueCid = `qr-ticket-${code}@eventrent.com`;

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
      // 1. Cek apakah dia Pemilik Event (EO)
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event tidak ditemukan');
      
      const isOwner = eventCheck.rows[0].created_by == userId;

      // 2. Cek apakah dia Agen di event ini (Jika bukan owner)
      let isAgent = false;
      if (!isOwner) {
        const agentCheck = await this.pool.query(
          'SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2 AND is_accepted = TRUE',
          [eventId, userId]
        );
        isAgent = agentCheck.rows.length > 0;
      }

      // 3. Tolak kalau bukan EO dan bukan Agen
      if (!isOwner && !isAgent) {
        throw new UnauthorizedException('Akses ditolak! Bukan panitia atau pemilik event.');
      }

      const query = `
        SELECT t.ticket_code as ticket_id, t.purchase_date, t.price,
               t.attendee_name, t.attendee_email, t.custom_answers, t.is_scanned, t.pax, t.greeting, t.is_attending,
               u.name as buyer_name, COALESCE(u.email, t.guest_email) as buyer_email, u.picture as buyer_pic,
               s.name as session_name,
               scanner.name as scanned_by_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        JOIN event_sessions s ON t.session_id = s.id
        LEFT JOIN users scanner ON t.scanned_by = scanner.id 
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

  async scanTicket(ticketCode: string, eventId: number, userId: number) {
    try {
      // 1. Cek apakah dia Pemilik Event (EO)
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event tidak ditemukan');
      
      const isOwner = eventCheck.rows[0].created_by == userId;

      // 2. Cek apakah dia Agen di event ini (Jika bukan owner)
      let isAgent = false;
      if (!isOwner) {
        const agentCheck = await this.pool.query('SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
        isAgent = agentCheck.rows.length > 0;
      }

      // 3. Kalau bukan bos dan bukan agen, tolak!
      if (!isOwner && !isAgent) {
        throw new UnauthorizedException('Akses ditolak! Kamu bukan pembuat event atau panitia di event ini.');
      }

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

      await this.pool.query(
        'UPDATE tickets SET is_scanned = TRUE, scanned_at = NOW(), scanned_by = $2 WHERE ticket_code = $1', 
        [ticketCode, userId]
      );
      
      return { valid: true, message: 'SCAN SUKSES! Tiket Valid.', data: ticket };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Gagal memproses validasi tiket');
    }
  }

  // --- AGENTS (PANITIA/EO) ---

  async addAgent(eventId: number, eoId: number, agentEmail: string, role: string = 'Agen') {
    try {
      const eventCheck = await this.pool.query('SELECT id, title FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (eventCheck.rows.length === 0) throw new UnauthorizedException('Bukan pemilik event!');

      const userRes = await this.pool.query('SELECT id FROM users WHERE email = $1', [agentEmail]);
      if (userRes.rows.length === 0) throw new BadRequestException('Email tidak ditemukan. Pastikan agen sudah daftar akun EventRent.');
      const agentId = userRes.rows[0].id;

      if (agentId == eoId) throw new BadRequestException('Anda adalah pembuat event, tidak perlu ditambahkan sebagai agen.');

      const checkAgent = await this.pool.query('SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2', [eventId, agentId]);
      if (checkAgent.rows.length > 0) throw new BadRequestException('Agen ini sudah terdaftar di event ini!');

      const insertRes = await this.pool.query(
        'INSERT INTO event_agents (event_id, user_id, role, is_accepted) VALUES ($1, $2, $3, FALSE) RETURNING *',
        [eventId, agentId, role]
      );
      
      const eventTitle = eventCheck.rows[0].title;
      await this.pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id)
         VALUES ($1, $2, $3, 'INVITATION_AGENT', $4)`,
        [agentId, 'Undangan Kepanitiaan Baru 🎫', `Anda diundang menjadi ${role} untuk event: ${eventTitle}.`, eventId]
      );

      return { message: 'Undangan kepanitiaan berhasil dikirim ke agen!', data: insertRes.rows[0] };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      console.error(err);
      throw new InternalServerErrorException('Gagal menambahkan agen');
    }
  }

  async getEventAgents(eventId: number, eoId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT id FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (eventCheck.rows.length === 0) throw new UnauthorizedException('Bukan pemilik event!');

      const query = `
        SELECT ea.user_id as id, ea.role, ea.rating_given, ea.created_at, ea.is_accepted, 
               u.name, u.email, u.picture, u.bank_name, u.bank_account, u.bank_account_name, u.phone
        FROM event_agents ea
        JOIN users u ON ea.user_id = u.id
        WHERE ea.event_id = $1
        ORDER BY ea.created_at DESC
      `;
      const { rows } = await this.pool.query(query, [eventId]);
      return rows;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Gagal mengambil daftar agen');
    }
  }

  async removeAgent(eventId: number, eoId: number, agentId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT id, title FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (eventCheck.rows.length === 0) throw new UnauthorizedException('Bukan pemilik event!');
      
      const eventTitle = eventCheck.rows[0].title;

      const delRes = await this.pool.query('DELETE FROM event_agents WHERE event_id = $1 AND user_id = $2 RETURNING id', [eventId, agentId]);
      if (delRes.rowCount === 0) throw new BadRequestException('Agen tidak ditemukan di event ini');

      await this.pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id)
         VALUES ($1, $2, $3, 'INFO', $4)`,
        [agentId, 'Pemberhentian Tugas 🛑', `Anda telah diberhentikan dari kepanitiaan untuk event: ${eventTitle}.`, eventId]
      );

      return { message: 'Agen berhasil diberhentikan dan notifikasi telah dikirim.' };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Gagal menghapus agen');
    }
  }

  async updateAgent(eventId: number, eoId: number, agentId: number, data: { role?: string, rating_given?: number }) {
    try {
      const eventCheck = await this.pool.query('SELECT id FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (eventCheck.rows.length === 0) throw new UnauthorizedException('Bukan pemilik event!');

      const updateRes = await this.pool.query(
        `UPDATE event_agents SET 
         role = COALESCE($1, role), 
         rating_given = COALESCE($2, rating_given) 
         WHERE event_id = $3 AND user_id = $4 RETURNING *`,
        [data.role, data.rating_given, eventId, agentId]
      );

      if (updateRes.rowCount === 0) throw new BadRequestException('Agen tidak ditemukan');
      return { message: 'Data agen diperbarui', data: updateRes.rows[0] };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Gagal mengupdate data agen');
    }
  }

  async getAssignedEvents(agentId: number) {
    try {
      const query = `
        SELECT e.id, e.title, e.image_url as img, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start, 
               e.place as location, ea.role, ea.rating_given, u.name as organizer_name
        FROM event_agents ea
        JOIN events e ON ea.event_id = e.id
        JOIN users u ON e.created_by = u.id
        WHERE ea.user_id = $1 AND ea.is_accepted = TRUE 
        ORDER BY e.event_start ASC
      `;
      const { rows } = await this.pool.query(query, [agentId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Gagal mengambil daftar tugas agen');
    }
  }

  // --- AUTH & PROFILE ---

  async loginWithGoogle(user: any) {
    try {
      const checkRes = await this.pool.query('SELECT * FROM users WHERE email = $1', [user.email]);
      if (checkRes.rows.length > 0) return checkRes.rows[0];
      
      const defaultPic = user.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede,b6e3f4`;
      
      const insertRes = await this.pool.query(
        `INSERT INTO users (email, name, picture, google_id, is_verified) VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
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
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60000); 

    const insertRes = await this.pool.query(
      `INSERT INTO users (name, email, password, picture, is_verified, otp_code, otp_expires_at) 
       VALUES ($1, $2, $3, $4, FALSE, $5, $6) RETURNING *`,
      [data.name, data.email, hashedPassword, defaultPic, otpCode, otpExpiresAt]
    );
    
    const newUser = insertRes.rows[0];

    const mailOptions = {
      from: '"EventRent Team" <noreply@eventrent.com>',
      to: data.email,
      subject: 'Kode Verifikasi Akun EventRent 🎟️',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Halo ${data.name}, selamat datang!</h2>
          <p>Ini adalah kode verifikasi OTP kamu untuk EventRent:</p>
          <h1 style="color: #EE7354; letter-spacing: 5px; font-size: 36px; background-color: #fefce8; padding: 10px; border-radius: 8px; display: inline-block;">${otpCode}</h1>
          <p style="color: #555;">Kode ini hanya berlaku 15 menit. Jangan bagikan kepada siapapun!</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (mailError) {
      console.error('Gagal kirim email OTP:', mailError);
    }

    await this.pool.query(
      `UPDATE tickets SET user_id = $1 WHERE guest_email = $2 AND user_id IS NULL`,
      [newUser.id, newUser.email]
    );
    console.log(`[Auth] Auto-merged guest tickets for: ${newUser.email}`);

    return {
      success: true,
      message: 'Registrasi berhasil. Silakan cek email untuk kode verifikasi.',
      userId: newUser.id,
      email: newUser.email
    };
  }

  async verifyOTP(email: string, otpCode: string) {
    const res = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) throw new BadRequestException('User tidak ditemukan');
    
    const user = res.rows[0];

    if (user.is_verified) throw new BadRequestException('Akun ini sudah terverifikasi');
    if (user.otp_code !== otpCode) throw new BadRequestException('Kode OTP salah!');
    if (new Date() > new Date(user.otp_expires_at)) throw new BadRequestException('Kode OTP sudah kedaluwarsa. Silakan minta kode baru.');

    const updateRes = await this.pool.query(
      `UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1 RETURNING *`,
      [user.id]
    );

    const verifiedUser = updateRes.rows[0];
    const { password, ...userWithoutPassword } = verifiedUser;
    
    return {
      success: true,
      message: 'Verifikasi berhasil! Silakan login.',
      user: userWithoutPassword
    };
  }

  async resendOTP(email: string) {
    const res = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) throw new BadRequestException('User tidak ditemukan');
    
    const user = res.rows[0];
    if (user.is_verified) throw new BadRequestException('Akun ini sudah terverifikasi');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60000); 

    await this.pool.query(
      `UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3`,
      [otpCode, otpExpiresAt, user.id]
    );

    const mailOptions = {
      from: '"EventRent Team" <noreply@eventrent.com>',
      to: email,
      subject: 'KODE BARU: Verifikasi Akun EventRent 🎟️',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Halo ${user.name}, ini kode OTP barumu.</h2>
          <h1 style="color: #EE7354; letter-spacing: 5px; font-size: 36px; background-color: #fefce8; padding: 10px; border-radius: 8px; display: inline-block;">${otpCode}</h1>
          <p style="color: #555;">Kode ini berlaku 15 menit.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (mailError) {
      console.error('Gagal kirim ulang email OTP:', mailError);
      throw new InternalServerErrorException('Gagal mengirim email OTP.');
    }

    return { success: true, message: 'Kode OTP baru telah dikirim ke email.' };
  }

  async loginUser(data: any) {
    const res = await this.pool.query('SELECT * FROM users WHERE email = $1', [data.email]);
    if (res.rows.length === 0) throw new UnauthorizedException('Email/Password salah');
    const user = res.rows[0];
    
    if (!user.is_verified) {
      throw new UnauthorizedException('Akun belum terverifikasi! Silakan cek email Anda untuk OTP.');
    }

    if (!user.password) throw new UnauthorizedException('Gunakan Login Google');
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Email/Password salah');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: number, data: any) {
    const res = await this.pool.query(
      `UPDATE users 
       SET name = $1, 
           picture = COALESCE($2, picture),
           bank_name = COALESCE($3, bank_name),
           bank_account = COALESCE($4, bank_account),
           bank_account_name = COALESCE($5, bank_account_name),
           phone = COALESCE($6, phone)
       WHERE id = $7 
       RETURNING id, name, email, picture, bank_name, bank_account, bank_account_name, phone`,
      [data.name, data.img || null, data.bank_name, data.bank_account, data.bank_account_name, data.phone, userId]
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

  // --- RIWAYAT SCAN AGEN ---
  async getAgentScanHistory(userId: number) {
    try {
      const query = `
        SELECT 
          t.ticket_code as ticket_id, 
          t.attendee_name, 
          e.title as event_title, 
          s.name as session_name, 
          TO_CHAR(t.scanned_at, 'HH24:MI') as scan_time, 
          TO_CHAR(t.scanned_at, 'DD Mon YYYY') as scan_date,
          t.scanned_at as raw_date,
          'success' as status
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN event_sessions s ON t.session_id = s.id
        WHERE t.scanned_by = $1
        ORDER BY t.scanned_at DESC
      `;
      const { rows } = await this.pool.query(query, [userId]);
      return rows;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Gagal mengambil riwayat scan agen');
    }
  }

  // --- NOTIFICATIONS SYSTEM ---
  async getNotifications(userId: number) {
    try {
      const { rows } = await this.pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Gagal mengambil notifikasi');
    }
  }

  async respondAgentInvitation(notifId: number, userId: number, action: 'accept' | 'reject') {
    try {
      const notifRes = await this.pool.query('SELECT related_event_id FROM notifications WHERE id = $1 AND user_id = $2', [notifId, userId]);
      if (notifRes.rows.length === 0) throw new BadRequestException('Notifikasi tidak valid');
      
      const eventId = notifRes.rows[0].related_event_id;

      const eventInfo = await this.pool.query('SELECT created_by, title FROM events WHERE id = $1', [eventId]);
      const eoId = eventInfo.rows[0].created_by;
      const eventTitle = eventInfo.rows[0].title;

      const agentInfo = await this.pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      const agentName = agentInfo.rows[0].name;

      if (action === 'accept') {
        await this.pool.query('UPDATE event_agents SET is_accepted = TRUE WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
        
        await this.pool.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id)
           VALUES ($1, $2, $3, 'INFO', $4)`,
          [eoId, 'Undangan Agen Diterima! 🎉', `Agen ${agentName} telah menerima undangan untuk menjadi panitia di event: ${eventTitle}.`, eventId]
        );
      } else {
        await this.pool.query('DELETE FROM event_agents WHERE event_id = $1 AND user_id = $2', [eventId, userId]);

        await this.pool.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id)
           VALUES ($1, $2, $3, 'INFO', $4)`,
          [eoId, 'Undangan Agen Ditolak ❌', `Agen ${agentName} menolak tawaran untuk menjadi panitia di event: ${eventTitle}.`, eventId]
        );
      }

      await this.pool.query('UPDATE notifications SET is_read = TRUE, type = $1 WHERE id = $2', [action === 'accept' ? 'INVITATION_ACCEPTED' : 'INVITATION_REJECTED', notifId]);

      return { message: action === 'accept' ? 'Undangan berhasil diterima! Selamat bertugas.' : 'Undangan berhasil ditolak.' };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Gagal memproses undangan');
    }
  }

  async markNotificationRead(notifId: number, userId: number) {
    await this.pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [notifId, userId]);
    return { success: true };
  }

  // --- EVENT REPORTS SYSTEM ---
  async createEventReport(eventId: number, agentId: number, message: string) {
    try {
      await this.pool.query(
        'INSERT INTO event_reports (event_id, agent_id, message) VALUES ($1, $2, $3)',
        [eventId, agentId, message]
      );

      const eventRes = await this.pool.query('SELECT created_by, title FROM events WHERE id = $1', [eventId]);
      const eoId = eventRes.rows[0].created_by;
      const eventTitle = eventRes.rows[0].title;

      const agentRes = await this.pool.query('SELECT name FROM users WHERE id = $1', [agentId]);
      const agentName = agentRes.rows[0]?.name || 'Agen';

      await this.pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id)
         VALUES ($1, $2, $3, 'REPORT_ISSUE', $4)`,
        [eoId, `⚠️ Ada Kendala di: ${eventTitle}`, `Agen ${agentName} melaporkan masalah. Segera cek Dashboard Event!`, eventId]
      );

      return { success: true, message: 'Laporan berhasil dikirim' };
    } catch (err) {
      throw new InternalServerErrorException('Gagal mengirim laporan');
    }
  }

  async getEventReports(eventId: number, eoId: number) {
    try {
      const check = await this.pool.query('SELECT id FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (check.rows.length === 0) throw new UnauthorizedException('Akses ditolak');

      const query = `
        SELECT r.id, r.message, r.status, r.created_at, u.name as agent_name, u.picture as agent_pic
        FROM event_reports r
        JOIN users u ON r.agent_id = u.id
        WHERE r.event_id = $1
        ORDER BY r.created_at DESC
      `;
      const { rows } = await this.pool.query(query, [eventId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Gagal mengambil laporan');
    }
  }

  async resolveEventReport(reportId: number, eoId: number) {
    try {
      const check = await this.pool.query(`
        SELECT r.id FROM event_reports r
        JOIN events e ON r.event_id = e.id
        WHERE r.id = $1 AND e.created_by = $2
      `, [reportId, eoId]);
      
      if (check.rows.length === 0) throw new UnauthorizedException('Akses ditolak');

      await this.pool.query("UPDATE event_reports SET status = 'RESOLVED' WHERE id = $1", [reportId]);
      return { success: true, message: 'Laporan ditandai selesai' };
    } catch (err) {
      throw new InternalServerErrorException('Gagal menyelesaikan laporan');
    }
  }

  // ==========================================
  // FITUR RECRUITMENT (JOB BOARD) - FIX UNTUK POSTGRES
  // ==========================================

  // 1. EO Bikin Lowongan
  async createJobPosting(data: any) {
    try {
      const query = `
        INSERT INTO job_postings (event_id, eo_id, role, quota, fee, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        RETURNING *
      `;
      const values = [data.eventId, data.eoId, data.role, data.quota, data.fee, data.description];
      const res = await this.pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new InternalServerErrorException('Gagal membuat lowongan kerja');
    }
  }

  // Tambahkan parameter default page dan limit
  async getAllActiveJobs(page: number = 1, limit: number = 10) {
    try {
      // Hitung Offset
      const offset = (page - 1) * limit; 
      
      const query = `
        SELECT j.*, e.title as event_title, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as event_date
        FROM job_postings j
        JOIN events e ON j.event_id = e.id
        WHERE j.is_active = TRUE
        ORDER BY j.created_at DESC
        LIMIT $1 OFFSET $2 -- 👇 PENTING UNTUK PAGINATION 👇
      `;
      const { rows } = await this.pool.query(query, [limit, offset]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Gagal mengambil daftar lowongan');
    }
  }

  // 3. EO Lihat Lowongannya Sendiri di Dashboard
  async getJobsByEvent(eventId: number, eoId: number) {
    try {
      const query = `
        SELECT * FROM job_postings 
        WHERE event_id = $1 AND eo_id = $2
        ORDER BY created_at DESC
      `;
      const { rows } = await this.pool.query(query, [eventId, eoId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Gagal mengambil lowongan EO');
    }
  }

  // 4. User Ngirim Lamaran
  async applyForJob(jobId: number, userId: number) {
    try {
      const query = `
        INSERT INTO job_applications (job_id, user_id, status)
        VALUES ($1, $2, 'PENDING')
        RETURNING *
      `;
      const { rows } = await this.pool.query(query, [jobId, userId]);
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') { 
        throw new BadRequestException('Lu udah pernah ngelamar di posisi ini bro!');
      }
      throw new InternalServerErrorException('Gagal mengirim lamaran');
    }
  }

  // 5. EO Lihat Daftar Pelamar
  async getApplicantsByEvent(eventId: number, eoId: number) {
    try {
      const query = `
        SELECT a.id, a.status, a.user_id, 
               u.name as user_name, u.picture as user_pic,
               j.role as role_applied
        FROM job_applications a
        JOIN users u ON a.user_id = u.id
        JOIN job_postings j ON a.job_id = j.id
        WHERE j.event_id = $1 AND j.eo_id = $2
        ORDER BY a.created_at DESC
      `;
      const { rows } = await this.pool.query(query, [eventId, eoId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Gagal mengambil daftar pelamar');
    }
  }

  // 6. EO Terima/Tolak Pelamar
  async respondToApplicant(applicationId: number, action: string, eoId: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const updateQuery = `
        UPDATE job_applications 
        SET status = $1 
        WHERE id = $2 
        RETURNING user_id, job_id
      `;
      const appRes = await client.query(updateQuery, [action, applicationId]);
      
      if (appRes.rows.length === 0) throw new BadRequestException('Lamaran tidak ditemukan');
      
      const applicantId = appRes.rows[0].user_id;
      const jobId = appRes.rows[0].job_id;

      const jobRes = await client.query(`
        SELECT j.role, j.event_id, e.title as event_name 
        FROM job_postings j
        JOIN events e ON j.event_id = e.id
        WHERE j.id = $1 AND j.eo_id = $2
      `, [jobId, eoId]);

      if (jobRes.rows.length === 0) throw new UnauthorizedException('Bukan lowongan milik lu bro');
      
      const jobInfo = jobRes.rows[0];

      if (action === 'ACCEPTED') {
        const checkAgent = await client.query('SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2', [jobInfo.event_id, applicantId]);
        
        if (checkAgent.rows.length === 0) {
          await client.query(
            `INSERT INTO event_agents (event_id, user_id, role, is_accepted) VALUES ($1, $2, $3, TRUE)`,
            [jobInfo.event_id, applicantId, jobInfo.role]
          );
        }

        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id)
           VALUES ($1, $2, $3, 'JOB_ACCEPTED', $4)`,
          [applicantId, 'Lamaran Diterima! 🎉', `Selamat! Lo diterima sebagai ${jobInfo.role} di event ${jobInfo.event_name}. Cek Daftar Tugas lu sekarang!`, jobInfo.event_id]
        );
      } 
      else if (action === 'REJECTED') {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id)
           VALUES ($1, $2, $3, 'JOB_REJECTED', $4)`,
          [applicantId, 'Lamaran Ditolak 😔', `Maaf bro, lamaran lu untuk posisi ${jobInfo.role} di event ${jobInfo.event_name} belum bisa diterima. Tetap semangat!`, jobInfo.event_id]
        );
      }

      await client.query('COMMIT');
      return { message: `Pelamar berhasil ${action}` };

    } catch (err) {
      await client.query('ROLLBACK');
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Gagal memproses lamaran');
    } finally {
      client.release();
    }
  }

  // ==========================================
  // FITUR PENGGAJIAN AGEN (PAYOUT)
  // ==========================================

  async getEventPayouts(eventId: number, eoId: number) {
    try {
      const check = await this.pool.query('SELECT id FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (check.rows.length === 0) throw new UnauthorizedException('Akses ditolak. Lu bukan EO event ini.');

      const query = `
        SELECT 
          ea.user_id as agent_id, 
          ea.role, 
          u.name as agent_name, 
          u.picture as agent_pic, 
          u.bank_name, 
          u.bank_account, 
          u.bank_account_name,
          COALESCE(p.amount, 0) as amount_paid,
          COALESCE(p.status, 'PENDING') as status,
          p.paid_at
        FROM event_agents ea
        JOIN users u ON ea.user_id = u.id
        LEFT JOIN agent_payouts p ON p.event_id = ea.event_id AND p.agent_id = ea.user_id
        WHERE ea.event_id = $1 AND ea.is_accepted = TRUE
      `;
      const { rows } = await this.pool.query(query, [eventId]);
      return rows;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Gagal mengambil data penggajian');
    }
  }

  async markAgentPaid(eventId: number, agentId: number, eoId: number, amount: number, proofUrl: string) { // <-- Tambah parameter
    try {
      const check = await this.pool.query('SELECT id, title FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (check.rows.length === 0) throw new UnauthorizedException('Akses ditolak.');
      const eventTitle = check.rows[0].title;

      // Validasi Anti Double-Payout
      const checkPaid = await this.pool.query(
        `SELECT id FROM agent_payouts WHERE event_id = $1 AND agent_id = $2 AND status = 'PAID'`,
        [eventId, agentId]
      );
      if (checkPaid.rows.length > 0) {
        throw new BadRequestException('Bro, agen ini sudah lu bayar lunas sebelumnya!');
      }

      // 👇 INSERT dengan tambahan proof_url 👇
      const query = `
        INSERT INTO agent_payouts (event_id, agent_id, amount, status, paid_at, proof_url)
        VALUES ($1, $2, $3, 'PAID', NOW(), $4)
        RETURNING *;
      `;
      const res = await this.pool.query(query, [eventId, agentId, amount, proofUrl]);

      // 👇 Update pesan notifikasi biar lebih profesional 👇
      await this.pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id)
         VALUES ($1, $2, $3, 'PAYOUT_SUCCESS', $4)`,
        [agentId, 'Gajian Cair! 💸', `EO telah mengirimkan honor Rp ${amount.toLocaleString('id-ID')} untuk event ${eventTitle}. Cek riwayat untuk melihat bukti transfer.`, eventId]
      );

      return { message: 'Berhasil ditandai lunas dan bukti tersimpan!', data: res.rows[0] };
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Gagal memproses pembayaran agen');
    }
  }

  async deleteJobPosting(jobId: number, eoId: number) {
    try {
      // 1. Cek dulu apakah lowongan ini emang punya EO yang request
      const checkQuery = 'SELECT id FROM job_postings WHERE id = $1 AND eo_id = $2';
      const checkRes = await this.pool.query(checkQuery, [jobId, eoId]);

      if (checkRes.rows.length === 0) {
        throw new UnauthorizedException('Lowongan tidak ditemukan atau lo bukan pemiliknya bro.');
      }

      // 2. Eksekusi Hapus (Ingat: Foreign Key di job_applications harus ON DELETE CASCADE biar lamarannya ikut kehapus)
      const deleteQuery = 'DELETE FROM job_postings WHERE id = $1 AND eo_id = $2 RETURNING id';
      await this.pool.query(deleteQuery, [jobId, eoId]);

      return { success: true, message: 'Lowongan berhasil dibatalkan/dihapus!' };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('Error deleteJobPosting:', err);
      throw new InternalServerErrorException('Gagal menghapus lowongan kerja.');
    }
  }
}