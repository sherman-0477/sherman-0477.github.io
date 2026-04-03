const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;
const S = '"projdbSchema"';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database connection pool
// Edit these values to match your local PostgreSQL setup
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'eHotels',   // Should be eHotels. Change if your DB name is different
  user: 'postgres',       // change to your DB user
  password: 'password',           // change to your DB password
});

// Views (easiest first)
app.get('/api/views/available-rooms', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${S}."AvailableRoomsPerCity" ORDER BY city`);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/views/capacity-per-hotel', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${S}."CapacityPerHotel" ORDER BY "hotelName"`);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get dropdown data
app.get('/api/cities', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT "hotelCity" FROM ${S}."Hotel" WHERE "hotelCity" IS NOT NULL ORDER BY "hotelCity"`
    );
    res.json(result.rows.map(r => r.hotelCity));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/chains/list', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT "chainID", "chainName" FROM ${S}."Chain" ORDER BY "chainName"`
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/hotels/list', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT "hotelID", "hotelName", "hotelCity" FROM ${S}."Hotel" ORDER BY "hotelName"`
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Search
app.get('/api/rooms/search', async (req, res) => {
  try {
    const { start, end, capacity, city, chainId, stars, maxPrice, minRooms } = req.query;
    const params = [];
    const conditions = [];

    if (start && end) {
      params.push(start, end);
      conditions.push(`r."roomID" NOT IN (
        SELECT "roomID" FROM ${S}."Booking"
        WHERE status NOT IN ('Cancelled','Completed')
          AND "checkOutDate" > $${params.length - 1}::date
          AND "checkInDate"  < $${params.length}::date
      ) AND r."roomID" NOT IN (
        SELECT "roomID" FROM ${S}."Renting"
        WHERE status = 'Active'
          AND "checkOutDate" > $${params.length - 1}::date
          AND "checkInDate"  < $${params.length}::date
      )`);
    }

    if (capacity) {
      params.push(capacity);
      conditions.push(`LOWER(r.capacity) = LOWER($${params.length})`);
    }
    if (city) {
      params.push(city);
      conditions.push(`h."hotelCity" = $${params.length}`);
    }
    if (chainId) {
      params.push(parseInt(chainId));
      conditions.push(`h."chainID" = $${params.length}`);
    }
    if (stars) {
      params.push(parseInt(stars));
      conditions.push(`h."starCount" >= $${params.length}`);
    }
    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      conditions.push(`r.price::numeric <= $${params.length}`);
    }
    if (minRooms) {
      params.push(parseInt(minRooms));
      conditions.push(`h."roomCount" >= $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const sql = `
      SELECT
        r."roomID", r."roomNumber", r.price::numeric as price,
        r."viewType", r.extendable, r."problemsDamages", r.capacity,
        h."hotelID", h."hotelName", h."hotelCity", h."starCount", h."roomCount",
        ch."chainID", ch."chainName",
        COALESCE(
          json_agg(a."amenityName" ORDER BY a."amenityName") FILTER (WHERE a."amenityName" IS NOT NULL),
          '[]'
        ) AS amenities
      FROM ${S}."Room" r
      JOIN ${S}."Hotel" h ON h."hotelID" = r."hotelID"
      JOIN ${S}."Chain" ch ON ch."chainID" = h."chainID"
      LEFT JOIN ${S}."Room_Amenity" ra ON ra."roomID" = r."roomID"
      LEFT JOIN ${S}."Amenity" a ON a."amenityID" = ra."amenityID"
      ${where}
      GROUP BY r."roomID", h."hotelID", ch."chainID"
      ORDER BY r.price::numeric ASC
    `;

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Booking controller
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c."custFullName",
             r."roomNumber", h."hotelName", h."hotelCity",
             r.price::numeric as price
      FROM ${S}."Booking" b
      JOIN ${S}."Customer" c ON c."customerID" = b."customerID"
      JOIN ${S}."Room" r ON r."roomID" = b."roomID"
      JOIN ${S}."Hotel" h ON h."hotelID" = r."hotelID"
      ORDER BY b."bookingDatetime" DESC
    `);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { customerID, roomID, checkInDate, checkOutDate } = req.body;
    const result = await pool.query(`
      INSERT INTO ${S}."Booking" ("customerID","roomID","checkInDate","checkOutDate")
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [customerID, roomID, checkInDate, checkOutDate]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE ${S}."Booking" SET status=$1 WHERE "bookingID"=$2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${S}."Booking" WHERE "bookingID"=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Convert booking → renting (check-in)
app.post('/api/bookings/:id/checkin', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeID } = req.body;

    const bookingRes = await client.query(
      `SELECT * FROM ${S}."Booking" WHERE "bookingID"=$1`, [req.params.id]
    );
    if (!bookingRes.rows.length) throw new Error('Booking not found');
    const booking = bookingRes.rows[0];
    if (booking.status !== 'Pending') throw new Error('Booking is not in Pending status');

    const rentingRes = await client.query(`
      INSERT INTO ${S}."Renting"
        ("bookingID","customerID","roomID","employeeID","checkInDate","checkOutDate","status")
      VALUES ($1,$2,$3,$4,$5,$6,'Active') RETURNING *
    `, [booking.bookingID, booking.customerID, booking.roomID, employeeID || null,
        booking.checkInDate, booking.checkOutDate]);

    await client.query('COMMIT');
    res.json(rentingRes.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// Rentings
app.get('/api/rentings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rt.*, c."custFullName", e."employeeFullName",
             r."roomNumber", h."hotelName", h."hotelCity",
             r.price::numeric as "roomPrice",
             COALESCE((
               SELECT SUM(p.amount::numeric)
               FROM ${S}."Payment" p WHERE p."rentingID" = rt."rentingID"
             ), 0) as "totalPaid"
      FROM ${S}."Renting" rt
      JOIN ${S}."Customer" c ON c."customerID" = rt."customerID"
      JOIN ${S}."Room" r ON r."roomID" = rt."roomID"
      JOIN ${S}."Hotel" h ON h."hotelID" = r."hotelID"
      LEFT JOIN ${S}."Employee" e ON e."employeeID" = rt."employeeID"
      ORDER BY rt."actualCheckInDatetime" DESC
    `);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rentings', async (req, res) => {
  try {
    const { customerID, roomID, employeeID, checkInDate, checkOutDate } = req.body;
    const result = await pool.query(`
      INSERT INTO ${S}."Renting"
        ("customerID","roomID","employeeID","checkInDate","checkOutDate","status")
      VALUES ($1,$2,$3,$4,$5,'Active') RETURNING *
    `, [customerID, roomID, employeeID || null, checkInDate, checkOutDate]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/rentings/:id', async (req, res) => {
  try {
    const { status, actualCheckOutDatetime } = req.body;
    const fields = [];
    const vals = [];
    if (status) { vals.push(status); fields.push(`status=$${vals.length}`); }
    if (actualCheckOutDatetime) {
      vals.push(actualCheckOutDatetime);
      fields.push(`"actualCheckOutDatetime"=$${vals.length}`);
    }
    vals.push(req.params.id);
    const result = await pool.query(
      `UPDATE ${S}."Renting" SET ${fields.join(',')} WHERE "rentingID"=$${vals.length} RETURNING *`,
      vals
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Payment
app.post('/api/payments', async (req, res) => {
  try {
    const { rentingID, amount, paymentMethod } = req.body;
    const result = await pool.query(`
      INSERT INTO ${S}."Payment" ("rentingID", amount, "paymentDatetime", "paymentMethod")
      VALUES ($1, $2::money, CURRENT_TIMESTAMP, $3) RETURNING *
    `, [rentingID, amount, paymentMethod]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/payments/:rentingId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, amount::numeric as amount FROM ${S}."Payment" WHERE "rentingID"=$1`,
      [req.params.rentingId]
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Customers CRUD
// Everything that follows is just ctrl-c ctrl-v simulator
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ${S}."Customer" ORDER BY "custFullName"`
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { custFullName, custAddress, custIDType, custIDNumber } = req.body;
    const result = await pool.query(`
      INSERT INTO ${S}."Customer" ("custFullName","custAddress","custIDType","custIDNumber")
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [custFullName, custAddress, custIDType, custIDNumber]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { custFullName, custAddress, custIDType, custIDNumber } = req.body;
    const result = await pool.query(`
      UPDATE ${S}."Customer"
      SET "custFullName"=$1,"custAddress"=$2,"custIDType"=$3,"custIDNumber"=$4
      WHERE "customerID"=$5 RETURNING *
    `, [custFullName, custAddress, custIDType, custIDNumber, req.params.id]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${S}."Customer" WHERE "customerID"=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Employees CRUD
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, h."hotelName",
        COALESCE(json_agg(er.role) FILTER (WHERE er.role IS NOT NULL), '[]') as roles
      FROM ${S}."Employee" e
      LEFT JOIN ${S}."Hotel" h ON h."hotelID" = e."hotelID"
      LEFT JOIN ${S}."EmployeeRole" er ON er."employeeID" = e."employeeID"
      GROUP BY e."employeeID", h."hotelName"
      ORDER BY e."employeeFullName"
    `);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { hotelID, employeeFullName, employeeAddress, employeeSSN, roles } = req.body;
    const empRes = await client.query(`
      INSERT INTO ${S}."Employee" ("hotelID","employeeFullName","employeeAddress","employeeSSN")
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [hotelID, employeeFullName, employeeAddress, employeeSSN]);
    const empID = empRes.rows[0].employeeID;

    if (roles && roles.length) {
      for (const role of roles) {
        await client.query(
          `INSERT INTO ${S}."EmployeeRole" ("employeeID","role") VALUES ($1,$2)`,
          [empID, role]
        );
      }
    }
    await client.query('COMMIT');
    res.json(empRes.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.put('/api/employees/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { hotelID, employeeFullName, employeeAddress, employeeSSN, roles } = req.body;
    const empRes = await client.query(`
      UPDATE ${S}."Employee"
      SET "hotelID"=$1,"employeeFullName"=$2,"employeeAddress"=$3,"employeeSSN"=$4
      WHERE "employeeID"=$5 RETURNING *
    `, [hotelID, employeeFullName, employeeAddress, employeeSSN, req.params.id]);

    if (roles !== undefined) {
      await client.query(`DELETE FROM ${S}."EmployeeRole" WHERE "employeeID"=$1`, [req.params.id]);
      for (const role of roles) {
        await client.query(
          `INSERT INTO ${S}."EmployeeRole" ("employeeID","role") VALUES ($1,$2)`,
          [req.params.id, role]
        );
      }
    }
    await client.query('COMMIT');
    res.json(empRes.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${S}."Employee" WHERE "employeeID"=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hotels CRUD
app.get('/api/hotels', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, ch."chainName",
        COALESCE(json_agg(DISTINCT he.email) FILTER (WHERE he.email IS NOT NULL), '[]') as emails,
        COALESCE(json_agg(DISTINCT hp."phoneNumber") FILTER (WHERE hp."phoneNumber" IS NOT NULL), '[]') as phones
      FROM ${S}."Hotel" h
      JOIN ${S}."Chain" ch ON ch."chainID" = h."chainID"
      LEFT JOIN ${S}."HotelEmail" he ON he."hotelID" = h."hotelID"
      LEFT JOIN ${S}."HotelPhone" hp ON hp."hotelID" = h."hotelID"
      GROUP BY h."hotelID", ch."chainName"
      ORDER BY h."hotelName"
    `);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hotels', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { chainID, hotelName, hotelAddress, hotelCity, starCount, emails, phones } = req.body;
    const hotelRes = await client.query(`
      INSERT INTO ${S}."Hotel" ("chainID","hotelName","hotelAddress","hotelCity","starCount")
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [chainID, hotelName, hotelAddress, hotelCity, starCount || null]);
    const hotelID = hotelRes.rows[0].hotelID;

    for (const email of (emails || [])) {
      await client.query(`INSERT INTO ${S}."HotelEmail" ("hotelID","email") VALUES ($1,$2)`, [hotelID, email]);
    }
    for (const phone of (phones || [])) {
      await client.query(`INSERT INTO ${S}."HotelPhone" ("hotelID","phoneNumber") VALUES ($1,$2)`, [hotelID, phone]);
    }
    await client.query('COMMIT');
    res.json(hotelRes.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.put('/api/hotels/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { chainID, hotelName, hotelAddress, hotelCity, starCount, managerID, emails, phones } = req.body;
    const hotelRes = await client.query(`
      UPDATE ${S}."Hotel"
      SET "chainID"=$1,"hotelName"=$2,"hotelAddress"=$3,"hotelCity"=$4,"starCount"=$5,"managerID"=$6
      WHERE "hotelID"=$7 RETURNING *
    `, [chainID, hotelName, hotelAddress, hotelCity, starCount || null, managerID || null, req.params.id]);

    if (emails !== undefined) {
      await client.query(`DELETE FROM ${S}."HotelEmail" WHERE "hotelID"=$1`, [req.params.id]);
      for (const email of emails) {
        await client.query(`INSERT INTO ${S}."HotelEmail" ("hotelID","email") VALUES ($1,$2)`, [req.params.id, email]);
      }
    }
    if (phones !== undefined) {
      await client.query(`DELETE FROM ${S}."HotelPhone" WHERE "hotelID"=$1`, [req.params.id]);
      for (const phone of phones) {
        await client.query(`INSERT INTO ${S}."HotelPhone" ("hotelID","phoneNumber") VALUES ($1,$2)`, [req.params.id, phone]);
      }
    }
    await client.query('COMMIT');
    res.json(hotelRes.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.delete('/api/hotels/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${S}."Hotel" WHERE "hotelID"=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Chains CRUD
app.get('/api/chains', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ch.*,
        COALESCE(json_agg(DISTINCT ce.email) FILTER (WHERE ce.email IS NOT NULL), '[]') as emails,
        COALESCE(json_agg(DISTINCT cp."phoneNumber") FILTER (WHERE cp."phoneNumber" IS NOT NULL), '[]') as phones
      FROM ${S}."Chain" ch
      LEFT JOIN ${S}."ChainEmail" ce ON ce."chainID" = ch."chainID"
      LEFT JOIN ${S}."ChainPhone" cp ON cp."chainID" = ch."chainID"
      GROUP BY ch."chainID"
      ORDER BY ch."chainName"
    `);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chains', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { chainName, centralOfficeAddress, emails, phones } = req.body;
    const chainRes = await client.query(`
      INSERT INTO ${S}."Chain" ("chainName","centralOfficeAddress")
      VALUES ($1,$2) RETURNING *
    `, [chainName, centralOfficeAddress]);
    const chainID = chainRes.rows[0].chainID;

    for (const email of (emails || [])) {
      await client.query(`INSERT INTO ${S}."ChainEmail" ("chainID","email") VALUES ($1,$2)`, [chainID, email]);
    }
    for (const phone of (phones || [])) {
      await client.query(`INSERT INTO ${S}."ChainPhone" ("chainID","phoneNumber") VALUES ($1,$2)`, [chainID, phone]);
    }
    await client.query('COMMIT');
    res.json(chainRes.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.put('/api/chains/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { chainName, centralOfficeAddress, emails, phones } = req.body;
    const chainRes = await client.query(`
      UPDATE ${S}."Chain" SET "chainName"=$1,"centralOfficeAddress"=$2
      WHERE "chainID"=$3 RETURNING *
    `, [chainName, centralOfficeAddress, req.params.id]);

    if (emails !== undefined) {
      await client.query(`DELETE FROM ${S}."ChainEmail" WHERE "chainID"=$1`, [req.params.id]);
      for (const email of emails) {
        await client.query(`INSERT INTO ${S}."ChainEmail" ("chainID","email") VALUES ($1,$2)`, [req.params.id, email]);
      }
    }
    if (phones !== undefined) {
      await client.query(`DELETE FROM ${S}."ChainPhone" WHERE "chainID"=$1`, [req.params.id]);
      for (const phone of phones) {
        await client.query(`INSERT INTO ${S}."ChainPhone" ("chainID","phoneNumber") VALUES ($1,$2)`, [req.params.id, phone]);
      }
    }
    await client.query('COMMIT');
    res.json(chainRes.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.delete('/api/chains/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${S}."Chain" WHERE "chainID"=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Rooms CRUD
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, r.price::numeric as price, h."hotelName", h."hotelCity",
        COALESCE(
          json_agg(a."amenityName" ORDER BY a."amenityName") FILTER (WHERE a."amenityName" IS NOT NULL),
          '[]'
        ) as amenities
      FROM ${S}."Room" r
      JOIN ${S}."Hotel" h ON h."hotelID" = r."hotelID"
      LEFT JOIN ${S}."Room_Amenity" ra ON ra."roomID" = r."roomID"
      LEFT JOIN ${S}."Amenity" a ON a."amenityID" = ra."amenityID"
      GROUP BY r."roomID", h."hotelName", h."hotelCity"
      ORDER BY h."hotelName", r."roomNumber"
    `);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { hotelID, roomNumber, price, viewType, extendable, problemsDamages, capacity } = req.body;
    const result = await pool.query(`
      INSERT INTO ${S}."Room"
        ("hotelID","roomNumber","price","viewType","extendable","problemsDamages","capacity")
      VALUES ($1,$2,$3::money,$4,$5,$6,$7) RETURNING *, price::numeric as price
    `, [hotelID, roomNumber, price, viewType || 'None', extendable || false, problemsDamages || null, capacity || 'Other']);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { hotelID, roomNumber, price, viewType, extendable, problemsDamages, capacity } = req.body;
    const result = await pool.query(`
      UPDATE ${S}."Room"
      SET "hotelID"=$1,"roomNumber"=$2,"price"=$3::money,"viewType"=$4,
          "extendable"=$5,"problemsDamages"=$6,"capacity"=$7
      WHERE "roomID"=$8 RETURNING *, price::numeric as price
    `, [hotelID, roomNumber, price, viewType, extendable, problemsDamages || null, capacity, req.params.id]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${S}."Room" WHERE "roomID"=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Format helpers
function moneyToFloat(val) {
  if (val == null) return null;
  return parseFloat(String(val).replace(/[^0-9.-]/g, ''));
}

function roomOut(r) {
  return { ...r, price: moneyToFloat(r.price) };
}

// Starting the app
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
