import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Services from './components/Services';
import Technicians from './components/Technicians';
import BookRepair from './components/BookRepair';
import Payment from './components/Payment';
import Records from './components/Records';
import StaffLogin from './components/StaffLogin';
import StaffPortal from './components/StaffPortal';
import './styles/App.css';

function App() {
  return (
    <Router>
      <BookingProvider>
        <Navbar />
        <Routes>
          <Route path="/"             element={<Home />}        />
          <Route path="/services"     element={<Services />}    />
          <Route path="/technicians"  element={<Technicians />} />
          <Route path="/bookrepair"   element={<BookRepair />}  />
          <Route path="/payment"      element={<Payment />}     />
          <Route path="/records"      element={<Records />}     />
          <Route path="/staff"        element={<StaffLogin />}  />
          <Route path="/staff/portal" element={<StaffPortal />} />
        </Routes>
      </BookingProvider>
    </Router>
  );
}

export default App;
