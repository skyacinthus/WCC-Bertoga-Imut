const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// 1. SET EJS AS THE TEMPLATING ENGINE
app.set('view engine', 'ejs');
// Point 'views' to your 'app' folder where index.ejs lives
app.set('views', path.join(__dirname, 'app'));

app.use(cors());
app.use(express.json());

// 2. SERVE STATIC FILES
// This ensures your CSS/Images in image_e0291d.png are found
app.use(express.static(path.join(__dirname, "app")));

// =========================
// FRONTEND ROUTES
// =========================

app.get("/", (req, res) => {
  // Use res.render instead of res.sendFile for EJS
  res.render("index"); 
});

// Route for the dedicated rooms page
app.get("/rooms-page", (req, res) => {
  res.render("rooms/rooms"); 
});


// =========================
// API ROOMS (Backend)
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