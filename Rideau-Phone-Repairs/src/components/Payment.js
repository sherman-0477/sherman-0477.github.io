import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { insertCustomer } from '../db/database';

function Payment() {
  const navigate = useNavigate();
  const { bookingData, clearBooking, findServiceByKey, findTechnicianByKey, language } = useBooking();

  const text = {
    en: {
      summary: 'Repair Summary', brand: 'Phone Brand', model: 'Phone Model',
      tech: 'Technician', repair: 'Repair', date: 'Drop-off Date',
      price: 'Price (before tax)', total: 'Total (incl. 13% HST)',
      paymentMethod: 'Payment Details', cardNumber: 'Card Number',
      expiry: 'Expiry Date', cvv: 'CVV', confirm: 'Confirm & Pay', cancel: 'Cancel',
      saved: 'Repair booking and payment confirmed!'
    },
    fr: {
      summary: 'Résumé', brand: 'Marque', model: 'Modèle',
      tech: 'Technicien', repair: 'Réparation', date: 'Date de dépôt',
      price: 'Prix (avant taxe)', total: 'Total (TVH 13% incluse)',
      paymentMethod: 'Détails de paiement', cardNumber: 'Numéro de carte',
      expiry: "Date d'expiration", cvv: 'CVV', confirm: 'Confirmer', cancel: 'Annuler',
      saved: 'Réservation et paiement confirmés !'
    }
  };
  const t = text[language];

  const [paymentDetails, setPaymentDetails] = useState({ cardNumber: '', expiryDate: '', cvv: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = findServiceByKey(bookingData.serviceKey);
  const selectedTech    = findTechnicianByKey(bookingData.technicianKey);
  const basePrice  = selectedService ? selectedService.price : 0;
  const totalPrice = Math.round(basePrice * 1.13);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString + 'T00:00:00');
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [id]: value }));
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await insertCustomer({
        customerName:     bookingData.customerName,
        customerEmail:    bookingData.customerEmail,
        customerPhone:    bookingData.customerPhone,
        phoneBrand:       bookingData.phoneBrand,
        phoneModel:       bookingData.phoneModel,
        serviceKey:       bookingData.serviceKey,
        serviceName:      selectedService ? selectedService.name.en : '',
        technicianKey:    bookingData.technicianKey,
        technicianName:   selectedTech    ? selectedTech.name : '',
        dropOffDate:      bookingData.dropOffDate,
        issueDescription: bookingData.issueDescription,
        basePrice,
        totalPrice,
      });
      alert(t.saved);
      clearBooking();
      navigate('/');
    } catch (err) {
      console.error('Failed to save booking:', err);
      alert(t.saved);
      clearBooking();
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <div className="container-xl">
        <h1 className="section-title mb-4">
          {language === 'fr' ? 'Paiement' : 'Payment'}
        </h1>
        <div className="row g-4">

          {/* Summary */}
          <div className="col-lg-5">
            <div className="summary-card">
              <h2><i className="bi bi-receipt me-2"></i>{t.summary}</h2>

              {[
                { label: t.brand,  value: bookingData.phoneBrand  || '—', icon: 'bi-phone' },
                { label: t.model,  value: bookingData.phoneModel   || '—', icon: 'bi-phone-flip' },
                { label: t.tech,   value: selectedTech?.name       || '—', icon: 'bi-person' },
                { label: t.repair, value: selectedService?.name[language] || '—', icon: 'bi-tools' },
                { label: t.date,   value: formatDate(bookingData.dropOffDate), icon: 'bi-calendar3' },
              ].map(({ label, value, icon }) => (
                <div className="summary-row" key={label}>
                  <span className="label"><i className={`bi ${icon} me-2`}></i>{label}</span>
                  <span className="value">{value}</span>
                </div>
              ))}

              <div className="summary-row">
                <span className="label">{t.price}</span>
                <span className="value">${basePrice}</span>
              </div>

              <div className="total-row">
                <span>{t.total}</span>
                <span>${totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Payment form */}
          <div className="col-lg-7">
            <div className="payment-form-card">
              <h2><i className="bi bi-credit-card me-2"></i>{t.paymentMethod}</h2>

              <form onSubmit={handleConfirm}>
                <div className="mb-3">
                  <label htmlFor="cardNumber" className="form-label fw-semibold" style={{ color: 'var(--brand)', fontSize: '0.9rem' }}>
                    {t.cardNumber}
                  </label>
                  <input
                    type="text" id="cardNumber" className="form-control"
                    value={paymentDetails.cardNumber} onChange={handleChange}
                    placeholder="1234 5678 9012 3456" required
                  />
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-7">
                    <label htmlFor="expiryDate" className="form-label fw-semibold" style={{ color: 'var(--brand)', fontSize: '0.9rem' }}>
                      {t.expiry}
                    </label>
                    <input
                      type="text" id="expiryDate" className="form-control"
                      value={paymentDetails.expiryDate} onChange={handleChange}
                      placeholder="MM / YY" required
                    />
                  </div>
                  <div className="col-5">
                    <label htmlFor="cvv" className="form-label fw-semibold" style={{ color: 'var(--brand)', fontSize: '0.9rem' }}>
                      {t.cvv}
                    </label>
                    <input
                      type="text" id="cvv" className="form-control"
                      value={paymentDetails.cvv} onChange={handleChange}
                      placeholder="123" required
                    />
                  </div>
                </div>

                <div className="d-flex gap-3 justify-content-end">
                  <button type="button" className="btn btn-danger px-4" onClick={() => navigate('/')}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-success px-4" disabled={isSubmitting}>
                    <i className="bi bi-lock me-2"></i>
                    {isSubmitting ? '…' : t.confirm}
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

export default Payment;
