import { Injectable, OnModuleInit, InternalServerErrorException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv'; 
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config(); 

@Injectable()
export class AppService implements OnModuleInit {
  private pool: Pool;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: false },
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
      console.log('Successfully connected to EventRent PostgreSQL database!');
      console.log('Database Check: OK! 🚀 (Alphanumeric Ticket Code Ready)');
    } catch (error) {
      console.error('Failed to connect to database:', error);
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

  // ==========================================
  // FITUR EVENTS
  // ==========================================

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
      throw new InternalServerErrorException('Failed to fetch data');
    }
  }

  async getEventById(eventId: number) {
    try {
      const eventQuery = `
        SELECT e.id, e.title, e.description, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start, 
               TO_CHAR(e.event_end, 'Dy, DD Mon YYYY') as date_end, e.place, e.name_place, e.city, e.province, e.map_url,
               e.image_url as img, c.name as category, e.phone as contact, u.name as organizer_name,
               e.is_private, e.event_details,
               e.payment_methods as "paymentMethods"
        FROM events e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.id = $1
      `;
      const eventRes = await this.pool.query(eventQuery, [eventId]);
      
      if (eventRes.rows.length === 0) throw new BadRequestException('Event not found');

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
      throw new InternalServerErrorException('Failed to fetch event details');
    }
  }

  async getEventSessions(eventId: number) {
    try {
      if (!eventId || isNaN(eventId)) {
        return []; 
      }
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

      return sessions;
    } catch (err) {
      console.error("Error getEventSessions:", err);
      throw new InternalServerErrorException('Failed to fetch event sessions data');
    }
  }

  async getMyEvents(userId: number) {
    try {
      const query = `
        SELECT e.id, e.title, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start,
               TO_CHAR(e.event_end, 'Dy, DD Mon YYYY') as date_end, e.name_place, e.city, e.place, 
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
      throw new InternalServerErrorException('Failed to fetch your events');
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
          created_by, phone, place, name_place, city, province, map_url, image_url, is_private, event_details,
          payment_methods
        )
        VALUES (
          $1, $2, $3, $4, (SELECT id FROM categories WHERE name = $5 LIMIT 1), 
          $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
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
        data.eventDetails ? JSON.stringify(data.eventDetails) : '{}',
        data.paymentMethods ? JSON.stringify(data.paymentMethods) : '{"qris":true,"transferBank":false}'
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
      return { message: 'Event successfully created!', eventId };
    } catch (err) {
      await client.query('ROLLBACK'); 
      console.error("Transaction Error Create Event:", err);
      throw new InternalServerErrorException('Failed to create event and its details');
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
            event_details = COALESCE($15, event_details),
            payment_methods = COALESCE($16, payment_methods)
        WHERE id = $12 AND created_by = $13
        RETURNING *
      `;
      const values = [
        data.title, data.description, data.eventStart, data.eventEnd,
        data.organizer, data.location?.place, data.location?.namePlace, data.location?.city, data.location?.province,
        data.img, data.category, eventId, userId, data.isPrivate ? true : false,
        data.eventDetails ? JSON.stringify(data.eventDetails) : null,
        data.paymentMethods ? JSON.stringify(data.paymentMethods) : null
      ];
      const res = await this.pool.query(query, values);
      if (res.rowCount === 0) throw new InternalServerErrorException('Event not found or unauthorized');
      return res.rows[0];
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to update event');
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
      throw new InternalServerErrorException('Failed to delete event');
    }
  }

  async toggleEventVisibility(eventId: number, userId: number) {
    try {
      const checkRes = await this.pool.query('SELECT is_private FROM events WHERE id = $1 AND created_by = $2', [eventId, userId]);
      
      if (checkRes.rows.length === 0) throw new UnauthorizedException('Event not found or unauthorized access!');

      const currentStatus = checkRes.rows[0].is_private;
      const newStatus = !currentStatus;

      const updateRes = await this.pool.query(
        'UPDATE events SET is_private = $1 WHERE id = $2 RETURNING id, is_private',
        [newStatus, eventId]
      );

      return { 
        message: newStatus ? 'Event is now hidden (Private)' : 'Event is now visible (Public)',
        isPrivate: updateRes.rows[0].is_private 
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error("Error toggleEventVisibility:", err);
      throw new InternalServerErrorException('Failed to change event visibility');
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
      throw new InternalServerErrorException('Failed to process Like action');
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
      throw new InternalServerErrorException('Failed to fetch liked events');
    }
  }

  // ==========================================
  // FITUR TICKETS, ATTENDEES, & SCANNER
  // ==========================================
  
  async buyTicket(userId: number | null, eventId: number, cart: any[], formAnswers: any, guestEmail?: string, orderId?: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN'); 

      if (orderId) {
        const checkOrder = await client.query('SELECT payment_status FROM orders WHERE order_id = $1 FOR UPDATE', [orderId]);
        if (checkOrder.rows.length > 0 && checkOrder.rows[0].payment_status === 'SUCCESS') {
          await client.query('ROLLBACK');
          console.log(`[BLOCKED] Order ${orderId} has already been printed. Preventing double print!`);
          return { message: 'Ticket has already been printed.', ticketIds: [] };
        }
      }

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
          [eventId, dummySessionId, userId, 0, targetEmail || null, formAnswers.attendee_name || 'Guest', formAnswers.email || targetEmail || '', '[]', 0, formAnswers.greeting, false, ticketCode]
        );
        
        if (orderId) {
          await client.query(`UPDATE orders SET payment_status = 'SUCCESS' WHERE order_id = $1`, [orderId]);
        }

        await client.query('COMMIT');
        return { message: 'Thank you for your RSVP and wishes.', ticketIds: [] };
      }

      for (const item of cart) {
        const sessionId = item.sessionId;
        const qty = item.qty || item.quantity || 1; 
        const paxPerTicket = Number(item.pax || formAnswers.pax || 1);
        const totalStockNeeded = qty * paxPerTicket;

        const sessionRes = await client.query('SELECT price, stock FROM event_sessions WHERE id = $1 FOR UPDATE', [sessionId]);
        if (sessionRes.rows.length === 0) throw new BadRequestException('Session not found');
        
        const session = sessionRes.rows[0];
        if (session.stock < totalStockNeeded) throw new BadRequestException(`Insufficient ticket stock for this session! (Required: ${totalStockNeeded})`);

        await client.query('UPDATE event_sessions SET stock = stock - $1 WHERE id = $2', [totalStockNeeded, sessionId]);

        const qRes = await client.query('SELECT id, question_text FROM session_questions WHERE session_id = $1', [sessionId]);
        const dbQuestions = qRes.rows;

        for (let i = 0; i < qty; i++) {
          const prefix = `cart-${item.id}-ticket-${i}`;
          
          const name = formAnswers[`${prefix}-nama`] || formAnswers.attendee_name || `Guest ${i + 1}`;
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

      if (orderId) {
        await client.query(`UPDATE orders SET payment_status = 'SUCCESS' WHERE order_id = $1`, [orderId]);
      }

      await client.query('COMMIT');

      if (targetEmail && boughtTickets.length > 0) {
        this.sendEmailReceipt(targetEmail, eventTitle, boughtTickets, totalTransactionPrice, eventId)
          .catch(e => console.error("Gagal mengirim email struk:", e)); 
      }

      return { message: 'Ticket purchase/RSVP successful', ticketIds: boughtTickets };

    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Error Buy Ticket Transaction:", err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to process ticket purchase');
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
              <p style="color: #64748b; font-size: 13px; margin: 0 0 25px 0; line-height: 1.5;">Please present this QR Code at the entrance.<br/>This ticket is strictly confidential and valid for one-time scan only.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: #94a3b8; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Status</p>
                    <h3 style="color: #10b981; font-size: 18px; margin: 5px 0 0 0; text-transform: uppercase;">PAID</h3>
                  </td>
                </tr>
              </table>
            </td>
            <td width="35%" style="background-color: #FF6B35; padding: 25px 20px; text-align: center; vertical-align: middle; border-left: 2px dashed rgba(255,255,255,0.4);">
              <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Entry Pass</h3>
              <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; display: inline-block; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <img src="cid:${uniqueCid}" alt="QR Code" style="width: 110px; height: 110px; display: block;" />
              </div>
              <p style="color: #ffffff; margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 16px; letter-spacing: 1.5px; font-weight: bold; background-color: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; display: inline-block;">${code}</p>
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
      subject: `🎟️ Your E-Ticket: ${eventTitle}`,
      attachments: emailAttachments, 
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="text-align: center; padding: 20px 0;">
             <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">YOUR EVENT TICKETS</h1>
             <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Thank you for your order!</p>
          </div>
          ${qrCodesHtml}
          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 15px; color: #334155;">Total Payment:</p>
            <h2 style="margin: 5px 0 0 0; color: #FF6B35; font-size: 24px;">Rp ${totalPrice.toLocaleString('id-ID')}</h2>
          </div>
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
      
      if (checkRes.rows.length === 0) throw new NotFoundException('Ticket not found. Please ensure Order ID and Email are correct.');

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
      throw new InternalServerErrorException('Failed to track ticket on the server.');
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
      throw new InternalServerErrorException('Failed to fetch your tickets');
    }
  }

  async getEventAttendees(eventId: number, userId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event not found');
      
      const isOwner = eventCheck.rows[0].created_by == userId;

      let isAgent = false;
      if (!isOwner) {
        const agentCheck = await this.pool.query(
          'SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2 AND is_accepted = TRUE',
          [eventId, userId]
        );
        isAgent = agentCheck.rows.length > 0;
      }

      if (!isOwner && !isAgent) throw new UnauthorizedException('Access denied! You are not a committee member or event owner.');

      const query = `
        SELECT t.ticket_code as ticket_id, t.purchase_date, t.price,
               t.attendee_name, t.attendee_email, t.custom_answers, t.is_scanned, t.pax, t.greeting, t.is_attending,
               u.name as buyer_name, COALESCE(u.email, t.guest_email) as buyer_email, u.picture as buyer_pic,
               s.name as session_name, scanner.name as scanned_by_name
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
      throw new InternalServerErrorException('Failed to fetch attendee data');
    }
  }

  async scanTicket(ticketCode: string, eventId: number, userId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
      if (eventCheck.rows.length === 0) throw new BadRequestException('Event not found');
      
      const isOwner = eventCheck.rows[0].created_by == userId;

      let isAgent = false;
      if (!isOwner) {
        const agentCheck = await this.pool.query('SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
        isAgent = agentCheck.rows.length > 0;
      }

      if (!isOwner && !isAgent) throw new UnauthorizedException('Access denied! You are not a committee member for this event.');

      const ticketRes = await this.pool.query(`
        SELECT t.id, t.is_scanned, t.scanned_at, t.price, t.pax, t.greeting, t.is_attending,
               t.attendee_name, t.attendee_email, t.custom_answers, t.ticket_code,
               u.name as buyer_name, COALESCE(u.email, t.guest_email) as buyer_email, s.name as session_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        JOIN event_sessions s ON t.session_id = s.id
        WHERE t.ticket_code = $1 AND t.event_id = $2
      `, [ticketCode, eventId]);

      if (ticketRes.rows.length === 0) return { valid: false, message: 'FAKE TICKET OR WRONG EVENT!' };

      const ticket = ticketRes.rows[0];

      if (!ticket.is_attending) return { valid: false, message: 'THIS GUEST HAS CONFIRMED NOT ATTENDING.' };

      if (ticket.is_scanned) {
        const scanWaktu = new Date(ticket.scanned_at).toLocaleString('id-ID');
        return { valid: false, message: `TICKET HAS ALREADY BEEN USED on ${scanWaktu}!`, data: ticket };
      }

      await this.pool.query(
        'UPDATE tickets SET is_scanned = TRUE, scanned_at = NOW(), scanned_by = $2 WHERE ticket_code = $1', 
        [ticketCode, userId]
      );
      
      return { valid: true, message: 'SCAN SUCCESS! Ticket is Valid.', data: ticket };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to process ticket validation');
    }
  }

  // ==========================================
  // FITUR AGENTS (PANITIA/EO)
  // ==========================================

  async addAgent(eventId: number, eoId: number, agentEmail: string, role: string = 'Agent') {
    try {
      const eventCheck = await this.pool.query('SELECT id, title FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (eventCheck.rows.length === 0) throw new UnauthorizedException('Not the event owner!');

      const userRes = await this.pool.query('SELECT id FROM users WHERE email = $1', [agentEmail]);
      if (userRes.rows.length === 0) throw new BadRequestException('Email not found.');
      const agentId = userRes.rows[0].id;

      if (agentId == eoId) throw new BadRequestException('You are the event creator.');

      const checkAgent = await this.pool.query('SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2', [eventId, agentId]);
      if (checkAgent.rows.length > 0) throw new BadRequestException('Agent is already registered!');

      const insertRes = await this.pool.query(
        'INSERT INTO event_agents (event_id, user_id, role, is_accepted) VALUES ($1, $2, $3, FALSE) RETURNING *',
        [eventId, agentId, role]
      );
      
      const eventTitle = eventCheck.rows[0].title;
      await this.pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id)
         VALUES ($1, $2, $3, 'INVITATION_AGENT', $4)`,
        [agentId, 'Committee Invitation 🎫', `You are invited to be ${role} for the event: ${eventTitle}.`, eventId]
      );

      return { message: 'Invitation successfully sent!', data: insertRes.rows[0] };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to add agent');
    }
  }

  async getEventAgents(eventId: number, eoId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT id FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (eventCheck.rows.length === 0) throw new UnauthorizedException('Not the event owner!');

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
      throw new InternalServerErrorException('Failed to fetch agents list');
    }
  }

  async removeAgent(eventId: number, eoId: number, agentId: number) {
    try {
      const eventCheck = await this.pool.query('SELECT id, title FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (eventCheck.rows.length === 0) throw new UnauthorizedException('Not the event owner!');
      
      const eventTitle = eventCheck.rows[0].title;

      const delRes = await this.pool.query('DELETE FROM event_agents WHERE event_id = $1 AND user_id = $2 RETURNING id', [eventId, agentId]);
      if (delRes.rowCount === 0) throw new BadRequestException('Agent not found');

      await this.pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id)
         VALUES ($1, $2, $3, 'INFO', $4)`,
        [agentId, 'Task Dismissal 🛑', `You have been dismissed from the committee for event: ${eventTitle}.`, eventId]
      );

      return { message: 'Agent successfully dismissed.' };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to remove agent');
    }
  }

  async updateAgent(eventId: number, eoId: number, agentId: number, data: { role?: string, rating_given?: number }) {
    try {
      const eventCheck = await this.pool.query('SELECT id, title FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (eventCheck.rows.length === 0) throw new UnauthorizedException('Not the event owner!');
      
      const eventTitle = eventCheck.rows[0].title;

      const updateRes = await this.pool.query(
        `UPDATE event_agents SET role = COALESCE($1, role), rating_given = COALESCE($2, rating_given) 
         WHERE event_id = $3 AND user_id = $4 RETURNING *`,
        [data.role, data.rating_given, eventId, agentId]
      );

      if (updateRes.rowCount === 0) throw new BadRequestException('Agent not found');

      // 🔥 FIX LOGIKA NOTIFIKASI RATING 🔥
      // Pastiin rating BUKAN null, BUKAN undefined, dan angkanya LEBIH DARI 0
      if (data.rating_given !== undefined && data.rating_given !== null && Number(data.rating_given) > 0) {
        try {
          await this.pool.query(
            `INSERT INTO notifications (user_id, title, message, type, related_event_id)
             VALUES ($1, $2, $3, 'NEW_RATING', $4)`,
            [
              agentId, 
              'New Rating Received! 🌟', 
              `Awesome! You received a ${data.rating_given}.0 Star rating for your work at event ${eventTitle}. Keep it up!`, 
              eventId
            ]
          );
        } catch (error) {
          console.error("Gagal mengirim notifikasi rating ke agen:", error);
        }
      }

      return { message: 'Agent data updated', data: updateRes.rows[0] };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to update agent');
    }
  }

  async getAssignedEvents(agentId: number) {
    try {
      const query = `
        SELECT * FROM (
          SELECT e.id, e.title, e.image_url as img, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start, 
                 e.event_start as raw_date,
                 e.place as location, ea.role, ea.rating_given, u.name as organizer_name,
                 (
                   SELECT TO_CHAR(MIN(start_time), 'HH24:MI') 
                   FROM event_sessions 
                   WHERE event_id = e.id
                 ) as time_start
          FROM event_agents ea
          JOIN events e ON ea.event_id = e.id
          JOIN users u ON e.created_by = u.id
          WHERE ea.user_id = $1 AND ea.is_accepted = TRUE 

          UNION

          SELECT e.id, e.title, e.image_url as img, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as date_start, 
                 e.event_start as raw_date,
                 e.place as location, 'Event Owner' as role, NULL as rating_given, u.name as organizer_name,
                 (
                   SELECT TO_CHAR(MIN(start_time), 'HH24:MI') 
                   FROM event_sessions 
                   WHERE event_id = e.id
                 ) as time_start
          FROM events e
          JOIN users u ON e.created_by = u.id
          WHERE e.created_by = $1
        ) as combined_events
        ORDER BY raw_date ASC
      `;
      const { rows } = await this.pool.query(query, [agentId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch assigned tasks');
    }
  }

  async updateProfile(userId: number, data: any) {
    const res = await this.pool.query(
      `UPDATE users 
       SET name = $1, picture = COALESCE($2, picture), bank_name = COALESCE($3, bank_name),
           bank_account = COALESCE($4, bank_account), bank_account_name = COALESCE($5, bank_account_name), phone = COALESCE($6, phone)
       WHERE id = $7 
       RETURNING id, name, email, picture, bank_name, bank_account, bank_account_name, phone`,
      [data.name, data.img || null, data.bank_name, data.bank_account, data.bank_account_name, data.phone, userId]
    );
    return res.rows[0];
  }

  async deleteUserAccount(userId: number, email: string) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new InternalServerErrorException('Supabase Admin configuration is missing!');
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY 
    );

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN'); 

      const userRes = await client.query('SELECT picture FROM users WHERE id = $1', [userId]);
      const pictureUrl = userRes.rows[0]?.picture;

      if (pictureUrl && pictureUrl.includes('supabase')) {
        const pathname = new URL(pictureUrl).pathname;
        const filePath = pathname.substring(pathname.indexOf('avatars/') + 8); 
        await supabaseAdmin.storage.from('avatars').remove([filePath.split('?')[0]]);
      }

      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      if (authUsers?.users) {
        const targetUser = authUsers.users.find(u => u.email === email);
        if (targetUser) await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
      }

      await client.query('COMMIT'); 
      return { success: true, message: 'Account and photo successfully destroyed permanently!' };
      
    } catch (err: any) {
      await client.query('ROLLBACK');
      
      if (err.code === '23503') {
        throw new BadRequestException('Failed: This account cannot be deleted because it is still actively used as an Event creator, agent, or has ongoing tickets.');
      }

      console.error('Error hapus akun:', err);
      throw new InternalServerErrorException('A server error occurred while deleting the account.');
    } finally {
      client.release();
    }
  }

  async getAgentScanHistory(userId: number) {
    try {
      const query = `
        SELECT t.ticket_code as ticket_id, t.attendee_name, e.title as event_title, s.name as session_name, 
               TO_CHAR(t.scanned_at, 'HH24:MI') as scan_time, TO_CHAR(t.scanned_at, 'DD Mon YYYY') as scan_date,
               t.scanned_at as raw_date, 'success' as status
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN event_sessions s ON t.session_id = s.id
        WHERE t.scanned_by = $1
        ORDER BY t.scanned_at DESC
      `;
      const { rows } = await this.pool.query(query, [userId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch scan history');
    }
  }

  // ==========================================
  // FITUR NOTIFICATIONS SYSTEM
  // ==========================================

  async getNotifications(userId: number) {
    try {
      const { rows } = await this.pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  async getMyNotifications(userId: number) {
    try {
      const res = await this.pool.query(
        `SELECT id, title, message, type, is_read, related_event_id, created_at 
         FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );
      return res.rows;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return []; 
    }
  }

  async respondToNotification(notifId: number, action: string) {
    try {
      await this.pool.query(`UPDATE notifications SET is_read = true WHERE id = $1`, [notifId]);
      if (action === 'accept') {
        return { message: 'Invitation successfully accepted!' };
      } else {
        return { message: 'Invitation successfully declined.' };
      }
    } catch (error) {
      console.error('Error respond notification:', error);
      throw new InternalServerErrorException('Failed to respond to notification');
    }
  }

  async respondAgentInvitation(notifId: number, userId: number, action: 'accept' | 'reject') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const notifRes = await client.query('SELECT related_event_id FROM notifications WHERE id = $1 AND user_id = $2', [notifId, userId]);
      if (notifRes.rows.length === 0) throw new BadRequestException('Invalid notification');
      
      const eventId = notifRes.rows[0].related_event_id;

      const eventInfo = await client.query('SELECT created_by, title FROM events WHERE id = $1', [eventId]);
      const eoId = eventInfo.rows[0].created_by;
      const eventTitle = eventInfo.rows[0].title;

      const agentInfo = await client.query('SELECT name FROM users WHERE id = $1', [userId]);
      const agentName = agentInfo.rows[0].name;

      if (action === 'accept') {
        await client.query('UPDATE event_agents SET is_accepted = TRUE WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id)
           VALUES ($1, $2, $3, 'INFO', $4)`,
          [eoId, 'Agent Invitation Accepted! 🎉', `Agent ${agentName} accepted the invitation for event: ${eventTitle}.`, eventId]
        );
      } else {
        await client.query('DELETE FROM event_agents WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id)
           VALUES ($1, $2, $3, 'INFO', $4)`,
          [eoId, 'Agent Invitation Declined ❌', `Agent ${agentName} declined the offer for event: ${eventTitle}.`, eventId]
        );
      }

      const newType = action === 'accept' ? 'INVITATION_ACCEPTED' : 'INVITATION_REJECTED';
      await client.query('UPDATE notifications SET is_read = TRUE, type = $1 WHERE id = $2', [newType, notifId]);

      await client.query('COMMIT');
      return { message: action === 'accept' ? 'Invitation successfully accepted!' : 'Invitation successfully declined.' };
    } catch (err) {
      await client.query('ROLLBACK');
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to process invitation');
    } finally {
      client.release();
    }
  }

  async markNotificationRead(notifId: number, userId: number) {
    await this.pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [notifId, userId]);
    return { success: true };
  }

  async markAllNotificationsRead(userId: number) {
    try {
      await this.pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', 
        [userId]
      );
      return { success: true, message: 'All notifications successfully marked as read!' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to update notification status');
    }
  }

  async deleteNotifications(notifIds: number[], userId: number) {
    try {
      const query = 'DELETE FROM notifications WHERE id = ANY($1::int[]) AND user_id = $2 RETURNING id';
      const res = await this.pool.query(query, [notifIds, userId]);
      
      return { 
        message: 'Notifications successfully deleted!', 
        deleted_count: res.rowCount 
      };
    } catch (error) {
      console.error("Error Delete Notif:", error);
      throw new InternalServerErrorException('Failed to delete notifications');
    }
  }

  async deleteAllNotifications(userId: number) {
    try {
      const query = 'DELETE FROM notifications WHERE user_id = $1';
      await this.pool.query(query, [userId]);
      return { message: 'All notifications successfully cleared!' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to clear notifications');
    }
  }

  // ==========================================
  // FITUR EVENT REPORTS SYSTEM
  // ==========================================

  async createEventReport(eventId: number, agentId: number, message: string) {
    try {
      await this.pool.query('INSERT INTO event_reports (event_id, agent_id, message) VALUES ($1, $2, $3)', [eventId, agentId, message]);

      const eventRes = await this.pool.query('SELECT created_by, title FROM events WHERE id = $1', [eventId]);
      const eoId = eventRes.rows[0].created_by;
      const eventTitle = eventRes.rows[0].title;

      const agentRes = await this.pool.query('SELECT name FROM users WHERE id = $1', [agentId]);
      const agentName = agentRes.rows[0]?.name || 'Agent';

      await this.pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id)
         VALUES ($1, $2, $3, 'REPORT_ISSUE', $4)`,
        [eoId, `⚠️ Issue Reported at: ${eventTitle}`, `Agent ${agentName} reported an issue!`, eventId]
      );

      return { success: true, message: 'Report successfully submitted' };
    } catch (err) {
      throw new InternalServerErrorException('Failed to submit report');
    }
  }

  async getEventReports(eventId: number, eoId: number) {
    try {
      const check = await this.pool.query('SELECT id FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (check.rows.length === 0) throw new UnauthorizedException('Access denied');

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
      throw new InternalServerErrorException('Failed to fetch reports');
    }
  }

  async resolveEventReport(reportId: number, eoId: number) {
    try {
      const check = await this.pool.query(`
        SELECT r.id FROM event_reports r
        JOIN events e ON r.event_id = e.id
        WHERE r.id = $1 AND e.created_by = $2
      `, [reportId, eoId]);
      if (check.rows.length === 0) throw new UnauthorizedException('Access denied');

      await this.pool.query("UPDATE event_reports SET status = 'RESOLVED' WHERE id = $1", [reportId]);
      return { success: true, message: 'Report marked as resolved' };
    } catch (err) {
      throw new InternalServerErrorException('Failed to resolve report');
    }
  }

  // ==========================================
  // FITUR RECRUITMENT (JOB BOARD)
  // ==========================================

  async createJobPosting(data: any) {
    try {
      const query = `
        INSERT INTO job_postings (event_id, eo_id, role, quota, fee, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        RETURNING *
      `;
      const res = await this.pool.query(query, [data.eventId, data.eoId, data.role, data.quota, data.fee, data.description]);
      return res.rows[0];
    } catch (err) {
      throw new InternalServerErrorException('Failed to create job posting');
    }
  }

  async updateJobPosting(jobId: number, eoId: number, data: any) {
    try {
      const res = await this.pool.query(
        `UPDATE job_postings SET role = $1, quota = $2, fee = $3, description = $4 WHERE id = $5 AND eo_id = $6 RETURNING *`,
        [data.role, data.quota, data.fee, data.description, jobId, eoId]
      );
      if (res.rowCount === 0) throw new Error('Job posting not found');
      return res.rows[0];
    } catch (error) {
      throw new Error('Failed to update job posting');
    }
  }

  async getAllActiveJobs(userId: number, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit; 
      
      const query = `
        SELECT j.*, e.title as event_title, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as event_date,
               e.image_url as event_img, e.city as event_location, u.name as eo_name, u.picture as eo_pic,
               COALESCE(
                 (SELECT 'ALREADY_JOINED' FROM event_agents WHERE event_id = e.id AND user_id = $1 LIMIT 1),
                 (SELECT status FROM job_applications WHERE job_id = j.id AND user_id = $1 LIMIT 1)
               ) as user_status
        FROM job_postings j
        JOIN events e ON j.event_id = e.id
        JOIN users u ON j.eo_id = u.id
        WHERE j.is_active = TRUE AND e.event_end >= CURRENT_DATE 
        ORDER BY j.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const { rows } = await this.pool.query(query, [userId, limit, offset]);
      return rows; 
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch job postings');
    }
  }

  async getJobsByEvent(eventId: number, eoId: number) {
    try {
      const { rows } = await this.pool.query('SELECT * FROM job_postings WHERE event_id = $1 AND eo_id = $2 ORDER BY created_at DESC', [eventId, eoId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch EO job postings');
    }
  }

  async applyForJob(jobId: number, userId: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN'); 
      
      // 1. Cari tau job ini buat event yang mana
      const jobRes = await client.query('SELECT event_id FROM job_postings WHERE id = $1', [jobId]);
      if (jobRes.rows.length === 0) throw new BadRequestException('Job posting not found');
      const targetEventId = jobRes.rows[0].event_id;

      // 🔥 SATPAM PENJAGA: Cek apakah dia udah jadi Agen di event ini? 🔥
      const checkAgent = await client.query('SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2', [targetEventId, userId]);
      if (checkAgent.rows.length > 0) {
        throw new BadRequestException('Kamu sudah terdaftar sebagai panitia/agen di event ini!');
      }

      // 3. Kalau aman (bukan agen), baru lanjut masukin lamaran
      const query = `INSERT INTO job_applications (job_id, user_id, status) VALUES ($1, $2, 'PENDING') RETURNING *`;
      const { rows } = await client.query(query, [jobId, userId]);
      const application = rows[0];

      // 4. Kirim notif ke EO
      const infoQuery = `
        SELECT j.eo_id, j.event_id, j.role, u.name as applicant_name, e.title as event_title
        FROM job_postings j
        JOIN users u ON u.id = $2
        JOIN events e ON j.event_id = e.id
        WHERE j.id = $1
      `;
      const infoRes = await client.query(infoQuery, [jobId, userId]);
      
      if (infoRes.rows.length > 0) {
        const info = infoRes.rows[0];
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id)
           VALUES ($1, $2, $3, 'NEW_APPLICANT', $4)`,
          [info.eo_id, 'New Applicant! 🚀', `${info.applicant_name} applied for the ${info.role} position at event ${info.event_title}.`, info.event_id]
        );
      }

      await client.query('COMMIT');
      return application;
    } catch (err: any) {
      await client.query('ROLLBACK');
      // Tangkap pesan error dari satpam biar dilempar ke Frontend
      if (err instanceof BadRequestException) throw err;
      if (err.code === '23505') throw new BadRequestException('Kamu sudah pernah melamar untuk posisi ini!');
      throw new InternalServerErrorException('Failed to submit application');
    } finally {
      client.release();
    }
  }

  async getApplicantsByEvent(eventId: number, eoId: number) {
    try {
      const query = `
        SELECT a.id, a.status, a.user_id, u.name as user_name, u.picture as user_pic, j.role as role_applied
        FROM job_applications a
        JOIN users u ON a.user_id = u.id
        JOIN job_postings j ON a.job_id = j.id
        WHERE j.event_id = $1 AND j.eo_id = $2
        ORDER BY a.created_at DESC
      `;
      const { rows } = await this.pool.query(query, [eventId, eoId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch applicants list');
    }
  }

  async respondToApplicant(applicationId: number, action: string, eoId: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const updateQuery = `UPDATE job_applications SET status = $1 WHERE id = $2 RETURNING user_id, job_id`;
      const appRes = await client.query(updateQuery, [action, applicationId]);
      
      if (appRes.rows.length === 0) throw new BadRequestException('Application not found');
      const { user_id: applicantId, job_id: jobId } = appRes.rows[0];

      const jobRes = await client.query(`
        SELECT j.role, j.event_id, e.title as event_name 
        FROM job_postings j JOIN events e ON j.event_id = e.id WHERE j.id = $1 AND j.eo_id = $2
      `, [jobId, eoId]);

      if (jobRes.rows.length === 0) throw new UnauthorizedException('Not your job posting');
      const jobInfo = jobRes.rows[0];

      if (action === 'ACCEPTED') {
        const checkAgent = await client.query('SELECT id FROM event_agents WHERE event_id = $1 AND user_id = $2', [jobInfo.event_id, applicantId]);
        if (checkAgent.rows.length === 0) {
          await client.query(`INSERT INTO event_agents (event_id, user_id, role, is_accepted) VALUES ($1, $2, $3, TRUE)`, [jobInfo.event_id, applicantId, jobInfo.role]);
        }
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id) VALUES ($1, $2, $3, 'JOB_ACCEPTED', $4)`,
          [applicantId, 'Application Accepted! 🎉', `Congratulations! You are accepted as ${jobInfo.role} for event ${jobInfo.event_name}.`, jobInfo.event_id]
        );
      } else if (action === 'REJECTED') {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, related_event_id) VALUES ($1, $2, $3, 'JOB_REJECTED', $4)`,
          [applicantId, 'Application Rejected 😔', `Sorry, your application for ${jobInfo.role} at event ${jobInfo.event_name} has not been accepted.`, jobInfo.event_id]
        );
      }

      await client.query('COMMIT');
      return { message: `Applicant successfully ${action.toLowerCase()}` };
    } catch (err) {
      await client.query('ROLLBACK');
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to process application');
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
      if (check.rows.length === 0) throw new UnauthorizedException('Access denied.');

      const query = `
        SELECT ea.user_id as agent_id, ea.role, u.name as agent_name, u.picture as agent_pic, 
               u.bank_name, u.bank_account, u.bank_account_name,
               COALESCE(p.amount, 0) as amount_paid, COALESCE(p.status, 'PENDING') as status, p.paid_at
        FROM event_agents ea
        JOIN users u ON ea.user_id = u.id
        LEFT JOIN agent_payouts p ON p.event_id = ea.event_id AND p.agent_id = ea.user_id
        WHERE ea.event_id = $1 AND ea.is_accepted = TRUE
      `;
      const { rows } = await this.pool.query(query, [eventId]);
      return rows;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to fetch payout data');
    }
  }

  async markAgentPaid(eventId: number, agentId: number, eoId: number, amount: number, proofUrl: string) { 
    try {
      const check = await this.pool.query('SELECT id, title FROM events WHERE id = $1 AND created_by = $2', [eventId, eoId]);
      if (check.rows.length === 0) throw new UnauthorizedException('Access denied.');
      
      const checkPaid = await this.pool.query(`SELECT id FROM agent_payouts WHERE event_id = $1 AND agent_id = $2 AND status = 'PAID'`, [eventId, agentId]);
      if (checkPaid.rows.length > 0) throw new BadRequestException('This agent has already been fully paid!');

      const query = `INSERT INTO agent_payouts (event_id, agent_id, amount, status, paid_at, proof_url) VALUES ($1, $2, $3, 'PAID', NOW(), $4) RETURNING *;`;
      const res = await this.pool.query(query, [eventId, agentId, amount, proofUrl]);

      await this.pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id) VALUES ($1, $2, $3, 'PAYOUT_SUCCESS', $4)`,
        [agentId, 'Wages Disbursed! 💸', `The EO sent your honorarium of Rp ${amount.toLocaleString('id-ID')} for event ${check.rows[0].title}.`, eventId]
      );

      return { message: 'Successfully marked as paid and proof saved!', data: res.rows[0] };
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to process agent payment');
    }
  }

  async deleteJobPosting(jobId: number, eoId: number) {
    try {
      const checkRes = await this.pool.query('SELECT id FROM job_postings WHERE id = $1 AND eo_id = $2', [jobId, eoId]);
      if (checkRes.rows.length === 0) throw new UnauthorizedException('Job posting not found.');

      await this.pool.query('DELETE FROM job_postings WHERE id = $1 AND eo_id = $2 RETURNING id', [jobId, eoId]);
      return { success: true, message: 'Job posting successfully deleted!' };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException('Failed to delete job posting.');
    }
  }

  async getAgentPayouts(agentId: number) {
    try {
      const query = `
        SELECT ap.id, ap.event_id, e.title AS event_title, ap.amount, ap.status, ap.paid_at, ap.proof_url 
        FROM agent_payouts ap
        JOIN events e ON ap.event_id = e.id 
        WHERE ap.agent_id = $1 AND ap.status = 'PAID'
        ORDER BY ap.paid_at DESC
      `;
      const result = await this.pool.query(query, [agentId]);
      return result.rows; 
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch agent income');
    }
  }
  
  // ==========================================
  // FITUR PEMBAYARAN LOKAL (CAHAYA) & ORDERS
  // ==========================================

  private generateCahayaSignature(payload: Record<string, any>): string {
    const sortedKeys = Object.keys(payload)
      .filter((key) => payload[key] !== null && payload[key] !== '' && key !== 'key_sign')
      .sort();

    const stringToSign = sortedKeys
      .map((key) => `${key}=${payload[key]}`)
      .join('&');

    const rawKey = process.env.CAHAYA_PRIVATE_KEY || '';
    if (!rawKey) throw new InternalServerErrorException('Cahaya private key is not set in .env');

    try {
      const keyBuffer = Buffer.from(rawKey.replace(/\s+/g, ''), 'base64');
      const privateKey = crypto.createPrivateKey({
        key: keyBuffer,
        format: 'der',
        type: 'pkcs8' 
      });

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(stringToSign);
      return sign.sign(privateKey, 'base64');

    } catch (err) {
      console.error('Crypto Parsing Error:', err);
      throw new InternalServerErrorException('Private Key format in .env is broken or incompatible with OpenSSL.');
    }
  }

  async createCahayaTransaction(orderId: string, amount: number, ip: string) {
    try {
      const CAHAYA_URL = process.env.CAHAYA_URL || 'https://api-pay.cahayatech.com';
      const APP_ID = process.env.CAHAYA_APP_ID || '';
      const MERCHANT_NO = process.env.CAHAYA_MERCHANT_NO || '';
      const TERMINAL_NO = process.env.CAHAYA_TERMINAL_NO || '';

      const reqTime = Date.now().toString();
      const reqId = crypto.randomBytes(16).toString('hex'); 

      const reqParamsObj = {
        pay_ver: "100",
        merchant_order_no: orderId,
        merchant_no: MERCHANT_NO,
        terminal_no: TERMINAL_NO,
        terminal_time: Math.floor(Date.now() / 1000).toString(),
        pay_type: "2", 
        // 🔥 TRIK Rp 1: Semua tagihan ke Cahaya Pay dipaksa jadi 1 Rupiah buat testing
        total_fee: "1", 
        terminal_ip: ip || "127.0.0.1", 
        notify_url: `${process.env.BACKEND_URL || 'https://my-event-rent.vercel.app'}/api/payment/webhook`
      };

      const payload = {
        req_ver: "1.0",
        req_mode: "0",
        app_id: APP_ID,
        sign_type: "RSA2",
        req_time: reqTime,
        req_id: reqId,
        req_params: JSON.stringify(reqParamsObj)
      };

      const signature = this.generateCahayaSignature(payload);
      const finalPayload = { ...payload, key_sign: signature };

      const response = await fetch(`${CAHAYA_URL}/open/payment/prepay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });

      const rawResponse = await response.text();
      const resData = JSON.parse(rawResponse);
      
      if (resData.resp_code === '10000') {
        const responseParams = JSON.parse(resData.resp_params);
        return { 
          checkout_url: responseParams.qr_code, 
          out_trade_no: responseParams.out_trade_no 
        };
      } else {
        throw new BadRequestException(`Cahaya Pay Error: ${resData.resp_msg} (Code: ${resData.resp_code})`);
      }
    } catch (err) {
      console.error("Payment API Error Detail:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Cahaya Pay API';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async handleCahayaWebhook(payload: any) {
    try {
      if (payload.req_params) {
        const params = typeof payload.req_params === 'string' ? JSON.parse(payload.req_params) : payload.req_params;
        
        if (params.order_state === 'PAYSUCCESS') {
          const orderId = params.merchant_order_no;

          const orderRes = await this.pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
          if (orderRes.rows.length === 0) return { return_code: "02", return_msg: "Order not found" };

          const order = orderRes.rows[0];

          if (order.payment_status === 'SUCCESS') return { return_code: "01", return_msg: "success" };

          const details = typeof order.ticket_details === 'string' ? JSON.parse(order.ticket_details) : order.ticket_details;

          await this.buyTicket(
            order.user_id, 
            order.event_id, 
            details.cart, 
            details.formAnswers, 
            details.buyerEmail, 
            orderId
          ).catch(err => console.error("Failed to auto-generate tickets via Webhook:", err));
          
        } else if (params.order_state === 'PAYERROR') {
          await this.pool.query(`UPDATE orders SET payment_status = 'FAILED' WHERE order_id = $1`, [params.merchant_order_no]);
        }
      }
      return { return_code: "01", return_msg: "success" };
    } catch (error) {
      console.error("Webhook Cahaya Error:", error);
      return { return_code: "02", return_msg: "failed" }; 
    }
  }

  // ==========================================
  // FITUR JEMPUT BOLA: CEK STATUS MANUAL KE CAHAYA
  // ==========================================
  async checkCahayaPaymentStatus(orderId: string) {
    const client = await this.pool.connect();
    try {
      const orderRes = await client.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
      if (orderRes.rows.length === 0) throw new NotFoundException('Order not found');
      const order = orderRes.rows[0];

      if (order.payment_status === 'SUCCESS') {
        return { status: 'SUCCESS', message: 'Order has already been paid.' };
      }

      const details = typeof order.ticket_details === 'string' ? JSON.parse(order.ticket_details) : order.ticket_details;
      const outTradeNo = details.cahaya_out_trade_no;

      const CAHAYA_URL = process.env.CAHAYA_URL || 'https://api-pay.cahayatech.com';
      const APP_ID = process.env.CAHAYA_APP_ID || '250906140916234819';
      const MERCHANT_NO = process.env.CAHAYA_MERCHANT_NO || '820250906000001';
      const TERMINAL_NO = process.env.CAHAYA_TERMINAL_NO || '10005965';

      const reqParamsObj: any = {
        pay_ver: "100",
        merchant_order_no: orderId,
        merchant_no: MERCHANT_NO,
        terminal_no: TERMINAL_NO,
        terminal_time: Math.floor(Date.now() / 1000).toString(),
      };

      if (outTradeNo) {
        reqParamsObj.out_trade_no = outTradeNo;
      }

      const payload = {
        req_ver: "1.0",
        req_mode: "0",
        app_id: APP_ID,
        sign_type: "RSA2",
        req_time: Date.now().toString(),
        req_id: crypto.randomBytes(16).toString('hex'),
        req_params: JSON.stringify(reqParamsObj)
      };

      const signature = this.generateCahayaSignature(payload);
      const finalPayload = { ...payload, key_sign: signature };

      const response = await fetch(`${CAHAYA_URL}/open/payment/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });

      const resData = await response.json();
      
      if (resData.resp_code === '10000') {
        const responseParams = JSON.parse(resData.resp_params);
        
        if (responseParams.order_state === 'PAYSUCCESS') {
          await this.buyTicket(
            order.user_id, 
            order.event_id, 
            details.cart, 
            details.formAnswers, 
            details.buyerEmail, 
            orderId
          ).catch(err => console.error("Failed to auto-generate tickets via Query Check:", err));

          return { status: 'SUCCESS', message: 'Payment confirmed! Tickets are being sent to your email.' };
        } else {
          return { status: 'PENDING', message: 'Payment not detected yet. Please try again later.' };
        }
      } else {
        return { status: 'PENDING', message: `Cahaya Pay: ${resData.resp_msg}` };
      }
    } catch (err) {
      console.error("Check Status Error:", err);
      throw new InternalServerErrorException('Failed to check payment status from Cahaya');
    } finally {
      client.release();
    }
  }

  // ========================================================
  // 1. FUNGSI UTAMA CHECKOUT (HYBRID: CAHAYA PAY & MANUAL)
  // ========================================================
  async createCheckoutOrder(userId: number, data: any, ip: string = '127.0.0.1') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const orderId = `ORD${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
      
      let totalPrice = 0;
      if (data.cart && data.cart.length > 0) {
        for (const item of data.cart) {
          const sessionRes = await client.query('SELECT price FROM event_sessions WHERE id = $1', [item.sessionId]);
          const itemPrice = sessionRes.rows.length > 0 ? Number(sessionRes.rows[0].price) : 0;
          totalPrice += itemPrice * Number(item.qty || 1);
        }
      }

      let checkoutUrl: string | null = null;
      let outTradeNo: string | null = null; 
      let paymentStatus = 'PENDING';

      if (totalPrice > 0) {
        if (data.paymentMethod === 'MANUAL_TRANSFER') {
          checkoutUrl = 'MANUAL_TRANSFER'; 
          
          const targetEmail = data.buyerEmail || 'customer@example.com';

          // 🔥 AMBIL DATA REKENING EO DARI DATABASE EVENTS
          const eventRes = await client.query('SELECT payment_methods FROM events WHERE id = $1', [data.eventId]);
          let bankDetails = null;
          if (eventRes.rows.length > 0 && eventRes.rows[0].payment_methods) {
             const pm = typeof eventRes.rows[0].payment_methods === 'string'
               ? JSON.parse(eventRes.rows[0].payment_methods)
               : eventRes.rows[0].payment_methods;
             bankDetails = pm?.bankDetails;
          }
          
          if (targetEmail && targetEmail !== 'customer@example.com') {
            await this.sendManualTransferEmail(targetEmail, orderId, totalPrice, bankDetails);
          } else {
            console.warn(`Warning: Buyer email is empty for Order ID ${orderId}`);
          }
        } else {
          const pgData = await this.createCahayaTransaction(orderId, totalPrice, ip);
          checkoutUrl = pgData.checkout_url; 
          outTradeNo = pgData.out_trade_no; 
        }
      }

      await client.query(
        `INSERT INTO orders (order_id, user_id, event_id, total_price, snap_token, payment_status, ticket_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId, 
          userId, 
          data.eventId, 
          totalPrice, 
          checkoutUrl, 
          paymentStatus, 
          JSON.stringify({ 
            cart: data.cart, 
            formAnswers: data.formAnswers, 
            paymentMethod: data.paymentMethod,
            buyerEmail: data.buyerEmail, 
            cahaya_out_trade_no: outTradeNo 
          })
        ]
      );
      
      await client.query('COMMIT');
      return { 
        message: 'Order successfully created', 
        orderId: orderId, 
        checkoutUrl: checkoutUrl 
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Checkout Error:", err);
      throw new InternalServerErrorException(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      client.release();
    }
  }

  // ========================================================
  // 2. FUNGSI KIRIM EMAIL INSTRUKSI TRANSFER MANUAL
  // ========================================================
  private async sendManualTransferEmail(email: string, orderId: string, amount: number, bankDetails?: any) {
    try {
      const uploadLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/upload-proof/${orderId}`; 

      // 🔥 Gunakan detail bank EO, fallback jika kosong
      const bankName = bankDetails?.bankName || 'BANK BCA';
      const accNumber = bankDetails?.accountNumber || '123-456-7890';
      const accName = bankDetails?.accountName || 'Admin EventRent';

      const mailOptions = {
        from: `"${process.env.EMAIL_NAME || 'EventRent'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `[Payment Instruction] Order ${orderId}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-size: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
            <h2 style="color: #0f172a;">Hello! Thank you for your order.</h2>
            <p>We have received your order <b>${orderId}</b>. Please complete your bank transfer:</p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 2px dashed #cbd5e1; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Total Amount</p>
              <h1 style="color: #FF6B35; margin: 10px 0; font-size: 32px;">Rp ${amount.toLocaleString('id-ID')}</h1>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
              <p style="margin: 0; font-weight: bold; color: #1e293b; text-transform: uppercase;">${bankName} (${accNumber})</p>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b; text-transform: uppercase;">A.N. ${accName}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="font-size: 14px; color: #475569;">Already transferred? Click the button below to upload your proof:</p>
              <a href="${uploadLink}" target="_blank" rel="noopener noreferrer" style="background-color: #FF6B35; color: white; padding: 16px 30px; text-decoration: none; border-radius: 12px; font-weight: 900; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);">Upload Proof Now</a>
            </div>

            <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">If the button is not clickable, open this link:<br>${uploadLink}</p>
          </div>
        `
      };
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Gagal mengirim email instruksi:", error);
    }
  }

  async getMyOrders(userId: number) {
    try {
      const query = `
        SELECT o.*, e.title as event_title, e.image_url as event_img, TO_CHAR(e.event_start, 'Dy, DD Mon YYYY') as event_date
        FROM orders o JOIN events e ON o.event_id = e.id WHERE o.user_id = $1
        ORDER BY CASE WHEN o.payment_status = 'PENDING' THEN 1 ELSE 2 END ASC, o.created_at DESC
      `;
      const { rows } = await this.pool.query(query, [userId]);
      return rows;
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch orders list');
    }
  }

  async getOrderPaymentInfo(orderId: string) {
    try {
      const res = await this.pool.query(
        `SELECT order_id, total_price, payment_status, proof_url 
         FROM orders WHERE order_id = $1`, 
        [orderId]
      );
      if (res.rowCount === 0) throw new NotFoundException('Order not found');
      return res.rows[0];
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch billing info');
    }
  }

  async getEventTickets(eventId: number) {
    try {
      const res = await this.pool.query(
        `SELECT id, ticket_code, attendee_name, attendee_email, pax, is_attending, custom_answers, purchase_date 
         FROM tickets WHERE event_id = $1 ORDER BY purchase_date DESC`, [eventId]
      );
      return res.rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch participants data');
    }
  }

  // ========================================================
  // FUNGSI UPDATE BUKTI TRANSFER MANUAL
  // ========================================================
  async updateOrderProof(orderId: string, proofUrl: string) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        `UPDATE orders 
         SET payment_status = 'WAITING_VERIFICATION', proof_url = $1 
         WHERE order_id = $2 RETURNING *`,
        [proofUrl, orderId]
      );

      if (res.rowCount === 0) {
        throw new NotFoundException('Order not found');
      }

      return { 
        message: 'Transfer proof successfully uploaded. Waiting for admin verification.', 
        order: res.rows[0] 
      };
    } catch (err) {
      console.error("Update Proof Error:", err);
      throw new InternalServerErrorException('Failed to upload transfer proof');
    } finally {
      client.release();
    }
  }

  // ========================================================
  // FUNGSI VERIFIKASI PEMBAYARAN MANUAL OLEH EO/ADMIN
  // ========================================================
  async verifyManualPayment(orderId: string, isApproved: boolean) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const orderRes = await client.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
      if (orderRes.rowCount === 0) throw new NotFoundException('Order not found');
      const order = orderRes.rows[0];

      if (order.payment_status === 'SUCCESS') {
        throw new BadRequestException('This order has already been fully paid.');
      }

      // JIKA DITOLAK
      if (!isApproved) {
        await client.query(
          `UPDATE orders SET payment_status = 'PENDING', proof_url = NULL WHERE order_id = $1`,
          [orderId]
        );
        await client.query('COMMIT');
        return { message: 'Transfer proof rejected. Status reverted to PENDING.' };
      }

      // JIKA DITERIMA -> UBAH JADI SUCCESS
      await client.query(
        `UPDATE orders SET payment_status = 'SUCCESS' WHERE order_id = $1`,
        [orderId]
      );

      // GENERATE TIKET OTOMATIS & KIRIM EMAIL BARCODE
      if (order.ticket_details) {
        const details = typeof order.ticket_details === 'string' ? JSON.parse(order.ticket_details) : order.ticket_details;
        const cart = details.cart || [];
        const formAnswers = details.formAnswers || {};
        const buyerEmail = details.buyerEmail || null; 

        const boughtTickets: string[] = [];
        let totalTransactionPrice = 0;

        const evRes = await client.query('SELECT title FROM events WHERE id = $1', [order.event_id]);
        const eventTitle = evRes.rows.length > 0 ? evRes.rows[0].title : 'Event';

        // Tentukan email tujuan pengiriman
        let targetEmail = buyerEmail;
        if (!targetEmail && order.user_id) {
          const uRes = await client.query('SELECT email FROM users WHERE id = $1', [order.user_id]);
          if (uRes.rows.length > 0) targetEmail = uRes.rows[0].email;
        }
        
        for (const item of cart) {
          const sessionRes = await client.query('SELECT price FROM event_sessions WHERE id = $1 FOR UPDATE', [item.sessionId]);
          const singlePrice = sessionRes.rows.length > 0 ? Number(sessionRes.rows[0].price) : 0;

          for (let i = 0; i < item.qty; i++) {
            const formKeyPrefix = `cart-${item.id}-ticket-${i}`;
            const attendeeName = formAnswers[`${formKeyPrefix}-nama`] || 'Guest';
            const attendeeEmail = formAnswers[`${formKeyPrefix}-email`] || '';
            
            const ticketCode = this.generateTicketCode();
            totalTransactionPrice += singlePrice;

            const ticketRes = await client.query(
              `INSERT INTO tickets (order_id, event_id, session_id, user_id, attendee_name, attendee_email, is_scanned, ticket_code, guest_email, price, is_attending)
               VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, true) RETURNING ticket_code`,
              [orderId, order.event_id, item.sessionId, order.user_id, attendeeName, attendeeEmail, ticketCode, targetEmail || null, singlePrice]
            );

            boughtTickets.push(ticketRes.rows[0].ticket_code);

            await client.query(`UPDATE event_sessions SET stock = stock - 1 WHERE id = $1`, [item.sessionId]);
          }
        }
        
        // PANGGIL FUNGSI KIRIM EMAIL
        if (targetEmail && boughtTickets.length > 0) {
          this.sendEmailReceipt(targetEmail, eventTitle, boughtTickets, totalTransactionPrice, order.event_id)
            .catch(e => console.error("Gagal mengirim email struk untuk verifikasi manual:", e)); 
        }
      }

      await client.query('COMMIT');
      return { message: 'Payment accepted. Tickets generated & email sent!' };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Verify Payment Error:", err);
      throw new InternalServerErrorException(err instanceof Error ? err.message : 'Failed to verify payment');
    } finally {
      client.release();
    }
  }
}