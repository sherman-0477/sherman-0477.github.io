import initSqlJs from 'sql.js';

const STORAGE_KEY = 'rideauRepairsDB';

let db = null;

/**
 * Load sql.js wasm and initialize (or restore) the SQLite database.
 * Subsequent calls return the cached instance.
 */
export async function getDB() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file) => {
      // Use a fixed wasm file in public/ to avoid 404/HTML loading into the wasm loader.
      // If PUBLIC_URL is set (e.g. for GitHub pages), prefix it. Otherwise serve from root.
      const base = process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '';
      return `${base}/sql-wasm.wasm`.replace(/\/\/+/, '/');
    },
  });

  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    const binary = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
    db = new SQL.Database(binary);
  } else {
    db = new SQL.Database();
  }

  _createSchema();
  _runMigrations();
  return db;
}

/** Persist the current database state to localStorage. */
export function saveDB() {
  if (!db) return;
  const data   = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(STORAGE_KEY, base64);
}

/** Create tables if they don't already exist. */
function _createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name   TEXT    NOT NULL,
      customer_email  TEXT    NOT NULL,
      customer_phone  TEXT    NOT NULL,
      phone_brand     TEXT    NOT NULL,
      phone_model     TEXT    NOT NULL,
      service_key     TEXT    NOT NULL,
      service_name    TEXT    NOT NULL,
      technician_key  TEXT    NOT NULL,
      technician_name TEXT    NOT NULL,
      drop_off_date   TEXT    NOT NULL,
      issue_desc      TEXT,
      base_price      REAL    NOT NULL,
      total_price     REAL    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'Pending',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  saveDB();
}

/**
 * Add columns introduced after the initial schema.
 * SQLite has no IF NOT EXISTS for ALTER TABLE so we swallow the
 * "duplicate column" error when the column already exists.
 */
function _runMigrations() {
  try {
    db.run(`ALTER TABLE customers ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending'`);
    saveDB();
  } catch (_) {
    // column already present — nothing to do
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function _rowsFromResult(result) {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Insert a completed booking. Returns rowid of the new record. */
export async function insertCustomer(booking) {
  const database = await getDB();

  database.run(
    `INSERT INTO customers
       (customer_name, customer_email, customer_phone,
        phone_brand, phone_model,
        service_key, service_name,
        technician_key, technician_name,
        drop_off_date, issue_desc,
        base_price, total_price, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      booking.customerName,
      booking.customerEmail,
      booking.customerPhone,
      booking.phoneBrand,
      booking.phoneModel,
      booking.serviceKey       || '',
      booking.serviceName      || '',
      booking.technicianKey    || '',
      booking.technicianName   || '',
      booking.dropOffDate,
      booking.issueDescription || '',
      booking.basePrice,
      booking.totalPrice,
      booking.status           || 'Pending',
    ]
  );

  saveDB();
  return database.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
}

/** Retrieve all records, newest first. */
export async function getAllCustomers() {
  const database = await getDB();
  return _rowsFromResult(
    database.exec('SELECT * FROM customers ORDER BY id DESC')
  );
}

/** Retrieve a single record by id. Returns null if not found. */
export async function getCustomerById(id) {
  const database = await getDB();
  const rows = _rowsFromResult(
    database.exec('SELECT * FROM customers WHERE id = ?', [id])
  );
  return rows[0] || null;
}

/**
 * Update an existing booking record.
 * @param {number} id     - Record to update.
 * @param {object} fields - Column-keyed update object (snake_case).
 */
export async function updateCustomer(id, fields) {
  const database = await getDB();

  database.run(
    `UPDATE customers SET
       customer_name   = ?,
       customer_email  = ?,
       customer_phone  = ?,
       phone_brand     = ?,
       phone_model     = ?,
       service_key     = ?,
       service_name    = ?,
       technician_key  = ?,
       technician_name = ?,
       drop_off_date   = ?,
       issue_desc      = ?,
       base_price      = ?,
       total_price     = ?,
       status          = ?
     WHERE id = ?`,
    [
      fields.customer_name,
      fields.customer_email,
      fields.customer_phone,
      fields.phone_brand,
      fields.phone_model,
      fields.service_key,
      fields.service_name,
      fields.technician_key,
      fields.technician_name,
      fields.drop_off_date,
      fields.issue_desc      || '',
      Number(fields.base_price),
      Number(fields.total_price),
      fields.status          || 'Pending',
      id,
    ]
  );

  saveDB();
}

/** Delete a single record by id. */
export async function deleteCustomer(id) {
  const database = await getDB();
  database.run('DELETE FROM customers WHERE id = ?', [id]);
  saveDB();
}

/** Wipe every record (keeps table structure). */
export async function clearAllCustomers() {
  const database = await getDB();
  database.run('DELETE FROM customers');
  saveDB();
}
