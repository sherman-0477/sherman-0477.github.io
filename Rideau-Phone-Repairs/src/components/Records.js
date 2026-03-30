import React, { useEffect, useState, useCallback } from 'react';
import { getAllCustomers, deleteCustomer, clearAllCustomers } from '../db/database';

function Records() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getAllCustomers();
      setCustomers(rows);
    } catch (err) {
      setError('Failed to load records: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking record?')) return;
    await deleteCustomer(id);
    load();
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL booking records? This cannot be undone.')) return;
    await clearAllCustomers();
    load();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <main className="page">
      <div className="container-xl text-center py-5">
        <div className="spinner-border" style={{ color: 'var(--brand)' }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    </main>
  );

  if (error) return (
    <main className="page">
      <div className="container-xl">
        <div className="alert alert-danger">{error}</div>
      </div>
    </main>
  );

  return (
    <main className="page">
      <div className="container-xl">
        <div className="records-header">
          <h1 className="section-title mb-0">
            <i className="bi bi-table me-2"></i>Customer Booking Records
          </h1>
          {customers.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleClearAll}>
              <i className="bi bi-trash me-1"></i>Clear All
            </button>
          )}
        </div>

        {customers.length === 0 ? (
          <div className="records-empty">
            <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: 'var(--border)' }}></i>
            <p className="mt-3">No booking records yet.</p>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Device</th>
                    <th>Service</th>
                    <th>Technician</th>
                    <th>Drop-off</th>
                    <th>Total</th>
                    <th>Booked At</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="text-muted">{c.id}</td>
                      <td className="fw-semibold">{c.customer_name}</td>
                      <td>{c.customer_email}</td>
                      <td>{c.customer_phone}</td>
                      <td>{c.phone_brand} {c.phone_model}</td>
                      <td>
                        <span className="badge" style={{ background: 'var(--brand-xlight)', color: 'var(--brand)', fontWeight: 600 }}>
                          {c.service_name}
                        </span>
                      </td>
                      <td>{c.technician_name}</td>
                      <td>{formatDate(c.drop_off_date)}</td>
                      <td className="fw-semibold">${c.total_price}</td>
                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>{c.created_at}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Records;
