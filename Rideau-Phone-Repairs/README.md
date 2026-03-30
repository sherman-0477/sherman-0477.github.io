# Rideau Repairs - Web Application

A React-based web application for managing phone repair bookings with an Express.js backend and SQLite database.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for cloning the repository)

You can verify your installation by running:
```bash
node --version
npm --version
```

## Installation

### Step 1: Clone or Download the Repository
```bash
git clone <repository-url>
cd Lab8-Group8
```

### Step 2: Install Root Dependencies
Install the dependencies for the main project:
```bash
npm install
```

This will install dependencies including:
- React and React DOM
- React Router for navigation
- Express and CORS for backend
- SQLite3 for database management
- Concurrently for running multiple processes

### Step 3: Install Server Dependencies
Navigate to the server directory and install its dependencies:
```bash
cd server
npm install
cd ..
```

## Getting Started

### Quick Start - Run Both Frontend and Backend

To start the complete application (frontend React app + backend server), run:

```bash
npm start
```

This command:
- **Backend Server**: Starts on `http://localhost:4000`
- **Frontend React App**: Starts on `http://localhost:3000`
- **Database**: SQLite database (`bookings.db`) is created in the `/server` directory

The React application will automatically open in your default browser.

### Run Only the Backend Server

To start just the backend server:
```bash
npm run server
```

Access the API at: `http://localhost:4000`

### Run Only the Frontend Client

To start just the React frontend:
```bash
npm run client
```

Access the app at: `http://localhost:3000`

## Project Structure

```
Lab8-Group8/
├── public/                 # Static assets
│   └── index.html         # HTML template
├── src/                   # React frontend source code
│   ├── components/        # React components
│   │   ├── Home.js
│   │   ├── Services.js
│   │   ├── Technicians.js
│   │   ├── BookRepair.js
│   │   ├── Payment.js
│   │   └── Navbar.js
│   ├── context/           # React context for state management
│   │   └── BookingContext.js
│   ├── data/              # Data files
│   │   └── servicesData.js
│   ├── db/                # Frontend database utilities
│   │   └── database.js
│   ├── styles/            # CSS stylesheets
│   ├── App.js             # Main App component
│   └── index.js           # React entry point
├── server/                # Express backend
│   ├── index.js           # Server entry point
│   ├── package.json       # Server dependencies
│   └── bookings.db        # SQLite database (auto-created)
├── package.json           # Root project configuration
└── README.md              # This file
```

## Available Scripts

### In the root directory:

- **`npm start`** - Run both server and client concurrently
- **`npm run server`** - Start backend server only (port 4000)
- **`npm run client`** - Start React frontend only (port 3000)
- **`npm run build`** - Build production-ready React app
- **`npm test`** - Run React tests

### In the server directory:

- **`npm start`** - Start the Express server

## API Endpoints

The backend API runs on `http://localhost:4000` and provides endpoints for:

- **Bookings**: Create, retrieve, and manage phone repair bookings
- **Services**: Get available repair services
- **Technicians**: Get available technicians list

For detailed API documentation, refer to the server's `index.js` file.

## Database

The application uses **SQLite3** for data persistence. The database file (`bookings.db`) is automatically created when the server starts.

### Database Tables:

- **bookings**: Stores customer repair booking information including:
  - Customer details (name, email, phone)
  - Phone information (brand, model)
  - Repair details (type, technician, dates)
  - Issue description

The schema is automatically created on first server startup.

## Troubleshooting

### Issue: Port 3000 or 4000 Already in Use

**Solution**: Kill the process using that port or change the port in the configuration.

On Windows (PowerShell):
```powershell
# Find process on port 4000
Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess
# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### Issue: Database Connection Error

**Solution**: Ensure the `/server` directory has write permissions. Delete `bookings.db` and restart the server to recreate it.

### Issue: Dependencies Not Installing

**Solution**: Clear npm cache and reinstall:
```bash
npm cache clean --force
rm -r node_modules package-lock.json
npm install
```

### Issue: Module Not Found Errors

**Solution**: Run `npm install` in both the root directory and `/server` directory:
```bash
npm install
cd server && npm install && cd ..
```

### Issue: React App Not Loading on localhost:3000

**Solution**: Make sure the backend server is running first:
```bash
npm start
```

## Support

If you encounter any issues, please check:
1. Node.js and npm are properly installed
2. All dependencies are installed (`npm install`)
3. No ports 3000 or 4000 are in use
4. You're in the correct project directory

## License

ISC

