# e-Hotels Web Application

## Tech Stack
- **Frontend:** HTML + Bootstrap 5 + Vanilla JS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (your existing schema in `projdbSchema`)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your database connection
Open `server.js` and edit the connection block near the top:

```js
const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'postgres',   // ← your DB name
  user:     'postgres',   // ← your DB user
  password: '',           // ← your DB password
});
```

### 3. Import the database
Make sure your PostgreSQL server is running and the schema has been imported:

```bash
psql -U postgres -d postgres -f database.sql
```

### 4. Start the server
```bash
npm start
# or for auto-restart on changes:
npm run dev
```

### 5. Open the app
Visit: **http://localhost:3000**

---

## File Structure
```
├── server.js          ← Express backend + all API routes
├── index.html         ← Main HTML with all modals
├── package.json
├── scripts/
│   ├── main.js        ← Navigation, dropdowns, views, utilities
│   ├── rooms.js       ← Room search + booking modal
│   ├── crud.js        ← CRUD for customers/employees/hotels/rooms/chains
│   └── renting.js     ← Check-in, walk-in, payments, check-out
└── styles/
    └── styles.css
```

---

## Features

### Customer Flow
- Search rooms by: dates, capacity, city, hotel chain, stars, price, # of rooms
- Results update live on filter change
- Book a room → enter Customer ID (or register on the spot)

### Staff Flow (Staff Portal tab)
**Database Management tab:**
- Full CRUD for: Customers, Employees, Hotels, Rooms, Hotel Chains

**Rentings & Payments tab:**
- Check-In: search pending bookings by customer name → convert to renting
- Walk-In: create a renting directly (no prior booking)
- Record Payment: look up renting → enter amount + method
- Check-Out: mark renting as Completed

**Bookings tab:**
- View all bookings, cancel pending ones

### Views tab
- View 1: Available rooms per city (SQL view `AvailableRoomsPerCity`)
- View 2: Total capacity per hotel (SQL view `CapacityPerHotel`)

---

## API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/rooms/search` | Search available rooms |
| GET/POST/PUT/DELETE | `/api/customers/:id` | Customer CRUD |
| GET/POST/PUT/DELETE | `/api/employees/:id` | Employee CRUD |
| GET/POST/PUT/DELETE | `/api/hotels/:id` | Hotel CRUD |
| GET/POST/PUT/DELETE | `/api/rooms/:id` | Room CRUD |
| GET/POST/PUT/DELETE | `/api/chains/:id` | Chain CRUD |
| GET/POST | `/api/bookings` | List / create bookings |
| PUT | `/api/bookings/:id` | Update booking status |
| POST | `/api/bookings/:id/checkin` | Convert booking → renting |
| GET/POST | `/api/rentings` | List / create rentings |
| PUT | `/api/rentings/:id` | Update renting (status, checkout time) |
| POST | `/api/payments` | Record a payment |
| GET | `/api/views/available-rooms` | View 1 |
| GET | `/api/views/capacity-per-hotel` | View 2 |
