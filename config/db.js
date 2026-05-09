const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotel_db"
});

db.connect((err) => {
  if (err) {
    console.log("Database couldn't connect");
  } else {
    console.log("Database connected");
  }
});

module.exports = db;