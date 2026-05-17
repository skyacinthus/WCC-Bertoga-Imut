CREATE DATABASE IF NOT EXISTS staylounge_db;

USE staylounge_db;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS users;

-- ========================
-- USERS
-- ========================
CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(20)
);

-- ========================
-- ROOM TYPES
-- ========================
CREATE TABLE room_types (
    id_room_type INT AUTO_INCREMENT PRIMARY KEY,
    room_type_name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    facilities TEXT,
    price DECIMAL(10,2) NOT NULL,
    installment_price DECIMAL(10,2),
    building VARCHAR(50),

    image_url VARCHAR(255)
);

-- ========================
-- ROOMS
-- ========================
CREATE TABLE rooms (
    id_room INT AUTO_INCREMENT PRIMARY KEY,
    id_room_type INT,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',

    FOREIGN KEY (id_room_type)
    REFERENCES room_types(id_room_type)
);

-- ========================
-- BOOKINGS
-- ========================
CREATE TABLE bookings (
    id_booking INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT,
    id_room INT,

    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    num_guests INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,

    booking_status ENUM(
        'pending',
        'confirmed',
        'cancelled',
        'completed'
    ) DEFAULT 'pending',

    FOREIGN KEY (id_user)
    REFERENCES users(id_user),

    FOREIGN KEY (id_room)
    REFERENCES rooms(id_room)
);

-- ========================
-- PAYMENTS
-- ========================
CREATE TABLE payments (
    id_payment INT AUTO_INCREMENT PRIMARY KEY,
    id_booking INT,

    payment_method VARCHAR(50),
    payment_date DATE,

    payment_status ENUM(
        'pending',
        'paid',
        'failed'
    ) DEFAULT 'pending',

    FOREIGN KEY (id_booking)
    REFERENCES bookings(id_booking)
);

-- ========================
-- ROOM TYPES
-- ========================
INSERT INTO room_types (room_type_name, capacity, facilities, price, installment_price, building, image_url) VALUES
('Family - Alodie 1',      4, 'AC, WiFi, Breakfast, Pet Friendly, Kids Playground',        500000.00, 450000.00, 'Alodie 1', 'public/img1.jpg'),
('Non Family - Alodie 1',  2, 'AC, WiFi, Breakfast, Pet Friendly, Kids Playground',                               350000.00, 300000.00, 'Alodie 1', 'public/img2.jpg'),
('White - Alodie 1',       2, 'AC, WiFi, Breakfast, Pet Friendly, Kids Playground',                      450000.00, 400000.00, 'Alodie 1', 'public/img3.jpg'),
('Kiddos - Alodie 1',      2, 'AC, WiFi, Breakfast, Pet Friendly, Kids Playground',              350000.00, 300000.00, 'Alodie 1', 'public/img4.jpg'),
('Classic - Alodie 1',     2, 'AC, WiFi, Breakfast, Pet Friendly, Kids Playground',                               350000.00, 300000.00, 'Alodie 1', 'public/img5.jpg'),
('Non Family - Alodie 2',  2, 'AC, WiFi, Breakfast, Kids Playground',                               350000.00, 300000.00, 'Alodie 2', 'public/img6.jpg'),
('Classic - Alodie 2',     2, 'AC, WiFi, Breakfast, Kids Playground',                  450000.00, 400000.00, 'Alodie 2', 'public/img7.jpg');

-- ========================
-- ROOMS
-- ========================
INSERT INTO rooms (id_room_type, room_number, status) VALUES
(1, 'A1-F01',  'available'),
(2, 'A1-NF01', 'available'),
(3, 'A1-W01',  'available'),
(4, 'A1-K01',  'available'),
(4, 'A1-K02',  'available'),
(5, 'A1-C01',  'available'),
(6, 'A2-NF01', 'available'),
(6, 'A2-NF02', 'available'),
(6, 'A2-NF03', 'available'),
(7, 'A2-C01',  'available');