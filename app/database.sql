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
    password VARCHAR(255) NOT NULL,
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
    price DECIMAL(10,2) NOT NULL
    installment_price DECIMAL(10,2) NOT NULL,
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