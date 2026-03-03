const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Konfigurasi Koneksi ke PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'eventrent_db',
    password: '123', // <-- UBAH BAGIAN INI
    port: 5432,
});

// Cek koneksi saat server menyala
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Gagal terhubung ke database:', err.stack);
    }
    console.log('Berhasil terhubung ke database PostgreSQL EventRent!');
    release();
});

// API Endpoint untuk mengambil data Event
app.get('/api/events', async (req, res) => {
    try {
        const query = `
            SELECT e.id, e.title, TO_CHAR(e.date_time, 'Dy, Mon YYYY - HH12.MI AM') as date, 
                   e.location, e.image_url as img, c.name as category
            FROM events e
            JOIN categories c ON e.category_id = c.id
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend API berjalan di http://localhost:${PORT}`);
});