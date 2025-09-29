const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Function to handle DB connection & auto-reconnect
function handleDisconnect() {
  console.log("🔍 DB Config being used:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  db.connect((err) => {
    if (err) {
      console.error("❌ Error connecting to DB:", err);
      setTimeout(handleDisconnect, 2000); // Retry after 2s
    } else {
      console.log("✅ Connected to MySQL Database");
    }
  });

  db.on("error", (err) => {
    console.error("❌ DB Error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      throw err;
    }
  });

  return db;
}

// Create DB connection
const db = handleDisconnect();

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Backend is running and connected to MySQL!");
});


// ✅ Contact Form API
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const sql = "INSERT INTO users (name, email, comments, created_at) VALUES (?, ?, ?, NOW())";
  db.query(sql, [name, email, message], (err, result) => {
    if (err) {
      console.error("❌ Error inserting contact:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, id: result.insertId, message: "Contact saved successfully" });
  });
});


// ✅ Get all contacts/users
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users ORDER BY created_at DESC", (err, results) => {
    if (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, users: results });
  });
});


// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
