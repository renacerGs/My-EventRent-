CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category_id INT REFERENCES categories(id),
    date_time TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    created_by INT REFERENCES users(id)
);

-- Masukkan Kategori
INSERT INTO categories (name) VALUES ('Music'), ('Food'), ('Tech'), ('Religious');

-- Masukkan Data Dummy Event (Agar langsung tampil di web)
INSERT INTO events (title, category_id, date_time, location, image_url) VALUES 
('Summer Music Fest 2026', 1, '2026-01-20 09:00:00', 'The Park, bla bla blaa', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'),
('Jazz Night Concert', 1, '2026-02-15 19:00:00', 'City Hall', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'),
('Tech Innovators Expo', 3, '2026-03-10 10:00:00', 'Convention Center', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'),
('Street Food Carnival', 2, '2026-04-05 16:00:00', 'Town Square', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80');