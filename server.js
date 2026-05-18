const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const { sendBookingConfirmation } = require("./config/mailer");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "app")));

// ========================
// FRONTEND ROUTES
// ========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "index.html"));
});
app.get("/rooms-page", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "rooms", "rooms.html"));
});

// ========================
// GET ALL ROOMS (rooms method - no date filter)
// ========================
app.get("/api/rooms", (req, res) => {
  const { guests, building } = req.query;
  let sql = `
    SELECT 
      rt.id_room_type,
      rt.room_type_name,
      rt.capacity,
      rt.facilities,
      rt.price,
      rt.installment_price,
      rt.building,
      rt.image_url,
      COUNT(r.id_room) as total_rooms
    FROM room_types rt
    JOIN rooms r ON rt.id_room_type = r.id_room_type
    WHERE r.status != 'maintenance'
  `;

  const params = [];
  if (guests) { sql += ` AND rt.capacity >= ?`; params.push(guests); }
  if (building) { sql += ` AND rt.building = ?`; params.push(building); }

  sql += ` GROUP BY 
    rt.id_room_type, 
    rt.room_type_name, 
    rt.capacity, 
    rt.facilities, 
    rt.price, 
    rt.installment_price, 
    rt.building, 
    rt.image_url`;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("FULL SQL ERROR:", err); // Look at your terminal for this!
      return res.status(500).json({ error: "Failed to fetch rooms" });
    }
    res.json(result);
  });
});

// ========================
// GET AVAILABLE ROOMS (date method - filtered)
// query params: check_in, check_out, guests
// ========================
app.get("/api/rooms/available", (req, res) => {
  const { check_in, check_out, guests, building } = req.query;

  if (!check_in || !check_out) {
    return res.status(400).json({ error: "check_in, check_out, and guests are required" });
  }

  let sql = `
    SELECT 
      rt.id_room_type,
      rt.room_type_name,
      rt.capacity,
      rt.facilities,
      rt.price,
      rt.installment_price,
      rt.building,
      rt.image_url,
      COUNT(r.id_room) as available_rooms
    FROM room_types rt
    JOIN rooms r ON rt.id_room_type = r.id_room_type
    WHERE r.status != 'maintenance'
    AND r.id_room NOT IN (
      SELECT id_room FROM bookings
      WHERE booking_status NOT IN ('cancelled')
      AND check_in < ? AND check_out > ?
    )
  `;

  const params = [check_out, check_in];
  if (guests) { sql += ` AND rt.capacity >= ?`; params.push(guests); }
  if (building) { sql += ` AND rt.building = ?`; params.push(building); }
  sql += ` GROUP BY rt.id_room_type`;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("SQL error:", err);
      return res.status(500).json({ error: "Failed to fetch available rooms" });
    }
    res.json(result);
  });
});

// ========================
// GET BOOKED DATES FOR A ROOM (for date picker modal)
// ========================
app.get("/api/rooms/:id/booked-dates", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT check_in, check_out
    FROM bookings
    WHERE id_room = ?
    AND booking_status NOT IN ('cancelled')
    AND check_out >= CURDATE()
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch booked dates" });
    res.json(result);
  });
});

// ========================
// CREATE BOOKING
// ========================
app.post("/api/bookings", (req, res) => {
  const { id_room_type, check_in, check_out, num_guests, total_price, email, first_name, last_name, phone } = req.body;

  const findUserSql = `SELECT id_user FROM users WHERE email = ?`;

  db.query(findUserSql, [email], (err, users) => {
    if (err) return res.status(500).json({ error: "Failed to find user" });

    const saveBooking = (id_user) => {
      const findRoomSql = `
        SELECT id_room FROM rooms
        WHERE id_room_type = ?
        AND status != 'maintenance'
        AND id_room NOT IN (
          SELECT id_room FROM bookings
          WHERE booking_status NOT IN ('cancelled')
          AND check_in < ? AND check_out > ?
        )
        LIMIT 1
      `;

      db.query(findRoomSql, [id_room_type, check_out, check_in], (err, rooms) => {
        if (err) return res.status(500).json({ error: "Failed to find room" });
        if (rooms.length === 0) return res.status(409).json({ error: "No rooms available for these dates" });

        const id_room = rooms[0].id_room;

        const insertSql = `
          INSERT INTO bookings (id_user, id_room, check_in, check_out, num_guests, total_price, booking_status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `;

        db.query(insertSql, [id_user, id_room, check_in, check_out, num_guests, total_price], (err, result) => {
          if (err) return res.status(500).json({ error: "Failed to create booking" });

          const id_booking = result.insertId;
          res.json({ id_booking, id_room });

          const detailSql = `
            SELECT b.*, r.room_number, rt.room_type_name
            FROM bookings b
            JOIN rooms r ON b.id_room = r.id_room
            JOIN room_types rt ON r.id_room_type = rt.id_room_type
            WHERE b.id_booking = ?
          `;

          db.query(detailSql, [id_booking], async (err, rows) => {
            if (!err && rows.length > 0) {
              try {
                await sendBookingConfirmation(email, rows[0]);
                console.log(`Confirmation email sent to ${email}`);
              } catch (mailErr) {
                console.error("Email failed:", mailErr);
              }
            }
          });
        });
      });
    };

    if (users.length > 0) {
      saveBooking(users[0].id_user);
    } else {
      const insertUserSql = `
        INSERT INTO users (name, email, phone, password)
        VALUES (?, ?, ?, NULL)
      `;
      const name = `${first_name} ${last_name}`;

      db.query(insertUserSql, [name, email, phone], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to create user" });
        saveBooking(result.insertId);
      });
    }
  });
});

// ========================
// GET BOOKING BY ID (for confirmation/details page)
// ========================
app.get("/api/bookings/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      b.*,
      r.room_number,
      rt.room_type_name,
      rt.facilities,
      rt.image_url,
      rt.price
    FROM bookings b
    JOIN rooms r ON b.id_room = r.id_room
    JOIN room_types rt ON r.id_room_type = rt.id_room_type
    WHERE b.id_booking = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch booking" });
    if (result.length === 0) return res.status(404).json({ error: "Booking not found" });
    res.json(result[0]);
  });
});

// ========================
// CREATE PAYMENT
// ========================
app.post("/api/payments", (req, res) => {
  const { id_booking, payment_method } = req.body;

  const sql = `
    INSERT INTO payments (id_booking, payment_method, payment_date, payment_status)
    VALUES (?, ?, CURDATE(), 'pending')
  `;

  db.query(sql, [id_booking, payment_method], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to record payment" });

    db.query(
      `UPDATE bookings SET booking_status = 'confirmed' WHERE id_booking = ?`,
      [id_booking],
      (err2) => {
        if (err2) return res.status(500).json({ error: "Payment recorded but booking status not updated" });
        res.json({ id_payment: result.insertId });
      }
    );
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

app.get("/api/room-types", (req, res) => {
  db.query("SELECT id_room_type, room_type_name FROM room_types", (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch room types" });
    res.json(result);
  });
});