import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { services } from '../data/servicesData';

function Home() {
  const navigate = useNavigate();
  const { language, updateBooking } = useBooking();

  const text = {
    en: {
      title: 'Rideau Phone Repairs',
      subtitle: 'Fast, reliable phone repair you can count on.',
      businessHours: 'Business Hours',
      weekday: 'Mon – Fri',
      weekdayHours: '9 am – 5 pm',
      saturday: 'Saturday',
      saturdayHours: '10 am – 6 pm',
      ourServices: 'Our Services',
      bookRepair: 'Book a Repair'
    },
    fr: {
      title: 'Rideau Phone Repairs',
      subtitle: 'Des réparations rapides et fiables sur lesquelles vous pouvez compter.',
      businessHours: "Heures d'ouverture",
      weekday: 'Lun – Ven',
      weekdayHours: '9 h – 17 h',
      saturday: 'Samedi',
      saturdayHours: '10 h – 18 h',
      ourServices: 'Nos services',
      bookRepair: 'Prendre un rendez-vous'
    }
  };
  const t = text[language];

  const handleServiceClick = (serviceKey) => {
    updateBooking({ serviceKey });
    navigate(`/services?service=${serviceKey}`);
  };

  return (
    <main className="page">
      <div className="container-xl">

        {/* Hero */}
        <div className="hero-section">
          <div className="row align-items-center">
            <div className="col-lg-7 mb-4 mb-lg-0">
              <h1>{t.title}</h1>
              <h2>{t.subtitle}</h2>
              <button
                className="btn btn-light mt-3 fw-semibold"
                style={{ color: 'var(--brand)', fontSize: '0.95rem' }}
                onClick={() => navigate('/services')}
              >
                <i className="bi bi-arrow-right-circle me-2"></i>
                {t.bookRepair}
              </button>
            </div>
            <div className="col-lg-4 offset-lg-1">
              <div className="hours-card">
                <h2><i className="bi bi-clock me-2"></i>{t.businessHours}</h2>
                <p><span className="fw-semibold">{t.weekday}:</span> {t.weekdayHours}</p>
                <p><span className="fw-semibold">{t.saturday}:</span> {t.saturdayHours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services grid */}
        <h2 className="section-title">{t.ourServices}</h2>
        <div className="row g-3 mb-4">
          {services.map((service) => (
            <div key={service.key} className="col-6 col-md-3">
              <div className="preview-card h-100" onClick={() => handleServiceClick(service.key)}>
                <img src={service.image} alt={service.name[language]} />
                <p>{service.name[language]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-2">
          <button
            className="btn btn-primary px-5 py-2"
            style={{ fontSize: '1rem' }}
            onClick={() => navigate('/services')}
          >
            {t.bookRepair}
          </button>
        </div>

      </div>
    </main>
  );
}

export default Home;
