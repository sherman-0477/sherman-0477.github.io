import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

function BookRepair() {
  const navigate = useNavigate();
  const { bookingData, updateBooking, findServiceByKey, findTechnicianByKey, language } = useBooking();

  const text = {
    en: {
      title: 'Repair Request Form',
      name: 'Full Name', email: 'Email Address', phoneNumber: 'Phone Number',
      phoneBrand: 'Phone Brand', phoneModel: 'Phone Model',
      repairType: 'Repair Type', technician: 'Technician', notSelected: 'Not selected',
      dropOffDate: 'Drop-off Date', describeIssue: 'Describe Issue (optional)',
      submit: 'Continue to Payment', cancel: 'Cancel'
    },
    fr: {
      title: 'Formulaire de demande de réparation',
      name: 'Nom complet', email: 'Adresse courriel', phoneNumber: 'Numéro de téléphone',
      phoneBrand: 'Marque du téléphone', phoneModel: 'Modèle du téléphone',
      repairType: 'Type de réparation', technician: 'Technicien', notSelected: 'Non sélectionné',
      dropOffDate: 'Date de dépôt', describeIssue: 'Décrivez le problème (optionnel)',
      submit: 'Continuer vers le paiement', cancel: 'Annuler'
    }
  };
  const t = text[language];

  const [formData, setFormData] = useState({
    customerName:     bookingData.customerName     || '',
    customerEmail:    bookingData.customerEmail    || '',
    customerPhone:    bookingData.customerPhone    || '',
    phoneBrand:       bookingData.phoneBrand       || '',
    phoneModel:       bookingData.phoneModel       || '',
    dropOffDate:      bookingData.dropOffDate      || '',
    issueDescription: bookingData.issueDescription || ''
  });

  const selectedService = findServiceByKey(bookingData.serviceKey);
  const selectedTech    = findTechnicianByKey(bookingData.technicianKey);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateBooking(formData);

    const payload = {
      ...formData,
      repairType:  selectedService?.name[language] || null,
      technician:  selectedTech?.name || null,
      basePrice:   selectedService?.price || 0,
      totalPrice:  selectedService?.price || 0
    };

    try {
      const response = await fetch('http://localhost:4000/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Network response was not ok');
      navigate('/payment');
    } catch (error) {
      console.error(error);
      alert('Failed to save booking');
    }
  };

  return (
    <main className="page">
      <div className="container-xl">
        <div className="row justify-content-center">
          <div className="col-lg-8">

            <h1 className="section-title mb-4">{t.title}</h1>

            <div className="form-card">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">

                  {/* Name */}
                  <div className="col-md-6">
                    <label htmlFor="customerName" className="form-label">{t.name}</label>
                    <input
                      type="text" id="customerName" className="form-control"
                      value={formData.customerName} onChange={handleChange} required
                      placeholder="Jane Smith"
                    />
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label htmlFor="customerEmail" className="form-label">{t.email}</label>
                    <input
                      type="email" id="customerEmail" className="form-control"
                      value={formData.customerEmail} onChange={handleChange} required
                      placeholder="jane@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-md-6">
                    <label htmlFor="customerPhone" className="form-label">{t.phoneNumber}</label>
                    <input
                      type="text" id="customerPhone" className="form-control"
                      value={formData.customerPhone} onChange={handleChange} required
                      placeholder="613-555-0100"
                    />
                  </div>

                  {/* Drop-off date */}
                  <div className="col-md-6">
                    <label htmlFor="dropOffDate" className="form-label">{t.dropOffDate}</label>
                    <input
                      type="date" id="dropOffDate" className="form-control"
                      value={formData.dropOffDate} onChange={handleChange} required
                    />
                  </div>

                  {/* Phone brand */}
                  <div className="col-md-6">
                    <label htmlFor="phoneBrand" className="form-label">{t.phoneBrand}</label>
                    <input
                      type="text" id="phoneBrand" className="form-control"
                      value={formData.phoneBrand} onChange={handleChange} required
                      placeholder="Apple"
                    />
                  </div>

                  {/* Phone model */}
                  <div className="col-md-6">
                    <label htmlFor="phoneModel" className="form-label">{t.phoneModel}</label>
                    <input
                      type="text" id="phoneModel" className="form-control"
                      value={formData.phoneModel} onChange={handleChange} required
                      placeholder="iPhone 15 Pro"
                    />
                  </div>

                  {/* Repair type (read-only) */}
                  <div className="col-md-6">
                    <label className="form-label">{t.repairType}</label>
                    <div className={`selected-value ${selectedService ? '' : 'empty'}`}>
                      <i className={`bi ${selectedService ? 'bi-tools' : 'bi-x-circle'}`}></i>
                      {selectedService ? selectedService.name[language] : t.notSelected}
                    </div>
                  </div>

                  {/* Technician (read-only) */}
                  <div className="col-md-6">
                    <label className="form-label">{t.technician}</label>
                    <div className={`selected-value ${selectedTech ? '' : 'empty'}`}>
                      <i className={`bi ${selectedTech ? 'bi-person-check' : 'bi-x-circle'}`}></i>
                      {selectedTech ? selectedTech.name : t.notSelected}
                    </div>
                  </div>

                  {/* Issue description */}
                  <div className="col-12">
                    <label htmlFor="issueDescription" className="form-label">{t.describeIssue}</label>
                    <textarea
                      id="issueDescription" className="form-control"
                      rows="3" value={formData.issueDescription} onChange={handleChange}
                      placeholder="e.g. cracked screen, battery drains fast…"
                    ></textarea>
                  </div>

                </div>

                <hr className="divider" />

                <div className="d-flex gap-3 justify-content-end">
                  <button type="button" className="btn btn-danger px-4" onClick={() => navigate('/')}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-success px-4">
                    <i className="bi bi-arrow-right-circle me-2"></i>{t.submit}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

export default BookRepair;
