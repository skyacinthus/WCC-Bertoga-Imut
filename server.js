const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "app")));

// =========================
// FRONTEND ROUTES (Sending HTML files)
// =========================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "index.html")); 
});

// Route for the dedicated rooms page
app.get("/rooms-page", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "rooms", "rooms.html")); 
});


// =========================
// API ROOMS (Backend remains the same)
// =========================
app.get("/api/rooms", (req, res) => {
  const sql = `
    SELECT 
      rooms.id_room,
      rooms.room_number,
      rooms.status,
      room_types.room_type_name,
      room_types.capacity,
      room_types.facilities,
      room_types.price
    FROM rooms
    JOIN room_types
    ON rooms.id_room_type = room_types.id_room_type
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error mengambil data");
    } else {
      res.json(result);
    }
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});