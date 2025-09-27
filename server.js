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
  // 🔍 Debug log for env values
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

// Create User API
app.post("/api/users", (req, res) => {
  const { name, email, comments } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Name and Email are required" });
  }

  const sql = "INSERT INTO users (name, email, comments, created_at) VALUES (?, ?, ?, NOW())";
  db.query(sql, [name, email, comments || null], (err, result) => {
    if (err) {
      console.error("❌ Error inserting user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, id: result.insertId, message: "User added successfully" });
  });
});

// Get Users API
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
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
