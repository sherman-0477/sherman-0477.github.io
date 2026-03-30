import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { technicians } from '../data/servicesData';

function Technicians() {
  const navigate = useNavigate();
  const { updateBooking, language } = useBooking();

  const text = {
    en: { title: 'Choose Your Technician', availableOn: 'Available', select: 'Select Technician' },
    fr: { title: 'Choisissez votre technicien', availableOn: 'Disponible', select: 'Choisir' }
  };
  const t = text[language];

  const handleSelectTechnician = (technicianKey) => {
    updateBooking({ technicianKey });
    navigate('/bookrepair');
  };

  // Generate initials avatar letter from name
  const getInitial = (name) => name.charAt(0).toUpperCase();

  return (
    <main className="page">
      <div className="container-xl">
        <h1 className="section-title">{t.title}</h1>
        <div className="row g-4 justify-content-center">
          {technicians.map((tech) => (
            <div key={tech.key} className="col-sm-6 col-lg-4">
              <div className="tech-card d-flex flex-column">
                <div className="tech-avatar">{getInitial(tech.name)}</div>
                <h2>{tech.name}</h2>
                <p className="avail-label"><i className="bi bi-calendar3 me-1"></i>{t.availableOn}</p>
                <p className="avail-days">{tech.available[language]}</p>
                <button
                  className="btn btn-primary mt-auto"
                  onClick={() => handleSelectTechnician(tech.key)}
                >
                  {t.select}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Technicians;
