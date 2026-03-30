import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { services } from '../data/servicesData';

function Services() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateBooking, language } = useBooking();

  const text = {
    en: { title: 'Select a Repair Service', price: 'Price', time: 'Est. Time', select: 'Select Service' },
    fr: { title: 'Choisissez un service de réparation', price: 'Prix', time: 'Durée estimée', select: 'Choisir' }
  };
  const t = text[language];

  useEffect(() => {
    const serviceKey = searchParams.get('service');
    if (serviceKey) updateBooking({ serviceKey });
  }, [searchParams, updateBooking]);

  const handleSelectService = (serviceKey) => {
    updateBooking({ serviceKey });
    navigate('/technicians');
  };

  return (
    <main className="page">
      <div className="container-xl">
        <h1 className="section-title">{t.title}</h1>
        <div className="row g-4">
          {services.map((service) => (
            <div key={service.key} className="col-sm-6 col-lg-3">
              <div className="rr-card">
                <img
                  src={service.image}
                  alt={service.name[language]}
                  className="rr-card-img"
                  onClick={() => handleSelectService(service.key)}
                />
                <div className="rr-card-body">
                  <h2>{service.name[language]}</h2>
                  <p className="mb-1">
                    <i className="bi bi-tag me-1"></i>
                    {t.price}: <strong>${service.price}</strong>
                  </p>
                  <p>
                    <i className="bi bi-clock me-1"></i>
                    {t.time}: <strong>{service.time[language]}</strong>
                  </p>
                  <button
                    className="btn btn-primary w-100 mt-1"
                    onClick={() => handleSelectService(service.key)}
                  >
                    {t.select}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Services;
