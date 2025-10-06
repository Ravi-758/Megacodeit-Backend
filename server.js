const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg"); // ✅ PostgreSQL instead of mysql2
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// ✅ Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // from Neon dashboard
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

// ✅ Test connection once at startup
pool
  .connect()
  .then((client) => {
    console.log("✅ Connected to Neon PostgreSQL!");
    client.release();
  })
  .catch((err) => console.error("❌ Database connection error:", err.stack));

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Backend is running and connected to Neon PostgreSQL!");
});

// ✅ Contact form submission (INSERT)
app.post("/api/contact", async (req, res) => {
  const { name, email, message, comments } = req.body;
  const finalMessage = message || comments;

  if (!name || !email || !finalMessage) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (name, email, comments, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id",
      [name, email, finalMessage]
    );

    res.json({
      success: true,
      id: result.rows[0].id,
      message: "Contact saved successfully",
    });
  } catch (err) {
    console.error("❌ Error inserting contact:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ✅ Fetch all users (SELECT)
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
