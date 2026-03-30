import React from 'react';
import { NavLink } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { isStaffAuthed } from './StaffLogin';

function Navbar() {
  const { language, toggleLanguage } = useBooking();

  const text = {
    en: {
      home: 'Home', services: 'Services', technicians: 'Technicians',
      book: 'Book Repair', payment: 'Payment', records: 'Records',
      staff: 'Staff Portal', switchTo: 'FR'
    },
    fr: {
      home: 'Accueil', services: 'Services', technicians: 'Techniciens',
      book: 'Réserver', payment: 'Paiement', records: 'Dossiers',
      staff: 'Portail', switchTo: 'EN'
    }
  };
  const t = text[language];

  const staffAuthed = isStaffAuthed();

  return (
    <header>
      <nav className="navbar navbar-expand-lg site-navbar">
        <div className="container-xl">
          <NavLink className="navbar-brand" to="/">
            <i className="bi bi-phone-fill me-2" style={{ color: 'rgba(255,255,255,0.7)' }}></i>
            Rideau Phone Repairs
          </NavLink>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ borderColor: 'rgba(255,255,255,0.3)' }}
          >
            <i className="bi bi-list" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
              {[
                { to: '/',            label: t.home },
                { to: '/services',    label: t.services },
                { to: '/technicians', label: t.technicians },
                { to: '/bookrepair',  label: t.book },
                { to: '/payment',     label: t.payment },
                { to: '/records',     label: t.records },
              ].map(({ to, label }) => (
                <li className="nav-item" key={to}>
                  <NavLink className="nav-link" to={to}>{label}</NavLink>
                </li>
              ))}

              {/* Staff portal link */}
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to={staffAuthed ? '/staff/portal' : '/staff'}
                  style={({ isActive }) => isActive ? {} : {}}
                >
                  <i className="bi bi-shield-lock me-1"></i>{t.staff}
                </NavLink>
              </li>

              <li className="nav-item ms-lg-2">
                <button type="button" className="lang-toggle-btn" onClick={toggleLanguage}>
                  {t.switchTo}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
