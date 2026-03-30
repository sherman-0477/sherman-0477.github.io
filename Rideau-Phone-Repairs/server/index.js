const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// conncet to the database
const dbPath = path.resolve(__dirname, 'bookings.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database Opening Error: ", err);
    else console.log("Database Connected At:", dbPath)
});

// testing line to see port
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// creating table
db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        phone_brand TEXT NOT NULL,
        phone_model TEXT NOT NULL,
        repair_type TEXT,
        technician  TEXT,
        drop_off_date  TEXT NOT NULL,
        issue_description TEXT,
        base_price  REAL,
        total_price REAL,
        created_at  TEXT NOT NULL
)`);

// save the booking
app.post('/bookings', (req, res) => {
    console.log("POST /bookings received:", req.body);
    const b = req.body;
    db.run(`INSERT INTO bookings (
        customer_name, customer_email, customer_phone, phone_brand,
        phone_model, repair_type, technician, drop_off_date, 
        issue_description, base_price, total_price, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            b.customerName,
            b.customerEmail,
            b.customerPhone,
            b.phoneBrand,
            b.phoneModel,
            b.repairType,
            b.technician,
            b.dropOffDate,
            b.issueDescription,
            b.basePrice,
            b.totalPrice,
            new Date().toISOString()
        ],
        function(err) {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ id: this.lastID });
        });
});

// get all the bookings
app.get('/bookings', (req, res) => {
    db.all(`SELECT * FROM bookings`, [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

