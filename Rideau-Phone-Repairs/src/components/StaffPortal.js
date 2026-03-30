import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllCustomers,
  insertCustomer,
  updateCustomer,
  deleteCustomer,
  clearAllCustomers,
} from '../db/database';
import { services, technicians } from '../data/servicesData';
import { isStaffAuthed, SESSION_KEY } from './StaffLogin';

// ── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['Pending', 'In Progress', 'Ready for Pickup', 'Completed', 'Cancelled'];

const STATUS_STYLES = {
  'Pending':           { bg: '#fff3cd', color: '#856404' },
  'In Progress':       { bg: '#cfe2ff', color: '#0a4a9c' },
  'Ready for Pickup':  { bg: '#d1f0e0', color: '#0a5c34' },
  'Completed':         { bg: '#d4edda', color: '#155724' },
  'Cancelled':         { bg: '#f8d7da', color: '#721c24' },
};

const EMPTY_FORM = {
  customer_name:   '',
  customer_email:  '',
  customer_phone:  '',
  phone_brand:     '',
  phone_model:     '',
  service_key:     '',
  service_name:    '',
  technician_key:  '',
  technician_name: '',
  drop_off_date:   '',
  issue_desc:      '',
  base_price:      '',
  total_price:     '',
  status:          'Pending',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: '#e9ecef', color: '#495057' };
  return (
    <span style={{
      background: style.bg,
      color:      style.color,
      fontWeight: 600,
      fontSize:   '0.75rem',
      padding:    '3px 10px',
      borderRadius: 20,
      whiteSpace: 'nowrap',
    }}>
      {status || 'Pending'}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

function StaffPortal() {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    if (!isStaffAuthed()) navigate('/staff');
  }, [navigate]);

  // ── State ──
  const [customers,    setCustomers]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortKey,      setSortKey]      = useState('id');
  const [sortDir,      setSortDir]      = useState('desc');

  // Modal state
  const [modalMode,    setModalMode]    = useState('create'); // 'create' | 'edit'
  const [editingId,    setEditingId]    = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [formError,    setFormError]    = useState('');
  const [saving,       setSaving]       = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  // Bootstrap modal reference
  const modalRef = useRef(null);
  const bsModal  = useRef(null);

  // ── Load Bootstrap Modal lazily ──
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    // Bootstrap is loaded via CDN on window
    bsModal.current = new window.bootstrap.Modal(el, { backdrop: 'static' });
    return () => { try { bsModal.current?.dispose(); } catch (_) {} };
  }, []);

  // ── Fetch records ──
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCustomers(await getAllCustomers());
    } catch (err) {
      setError('Failed to load records: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Service / technician selection auto-fills price ──
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'service_key') {
        const svc = services.find(s => s.key === value);
        if (svc) {
          next.service_name = svc.name.en;
          next.base_price   = String(svc.price);
          next.total_price  = String(Math.round(svc.price * 1.13));
        } else {
          next.service_name = '';
        }
      }

      if (name === 'technician_key') {
        const tech = technicians.find(t => t.key === value);
        next.technician_name = tech ? tech.name : '';
      }

      // Recalculate total when base_price is edited manually
      if (name === 'base_price') {
        const parsed = parseFloat(value);
        next.total_price = isNaN(parsed) ? '' : String(Math.round(parsed * 1.13));
      }

      return next;
    });
  };

  // ── Open modal ──
  const openCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    bsModal.current?.show();
  };

  const openEdit = (customer) => {
    setModalMode('edit');
    setEditingId(customer.id);
    setForm({
      customer_name:   customer.customer_name   || '',
      customer_email:  customer.customer_email  || '',
      customer_phone:  customer.customer_phone  || '',
      phone_brand:     customer.phone_brand     || '',
      phone_model:     customer.phone_model     || '',
      service_key:     customer.service_key     || '',
      service_name:    customer.service_name    || '',
      technician_key:  customer.technician_key  || '',
      technician_name: customer.technician_name || '',
      drop_off_date:   customer.drop_off_date   || '',
      issue_desc:      customer.issue_desc      || '',
      base_price:      String(customer.base_price  ?? ''),
      total_price:     String(customer.total_price ?? ''),
      status:          customer.status          || 'Pending',
    });
    setFormError('');
    bsModal.current?.show();
  };

  const closeModal = () => bsModal.current?.hide();

  // ── Save ──
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await insertCustomer({
          customerName:     form.customer_name,
          customerEmail:    form.customer_email,
          customerPhone:    form.customer_phone,
          phoneBrand:       form.phone_brand,
          phoneModel:       form.phone_model,
          serviceKey:       form.service_key,
          serviceName:      form.service_name,
          technicianKey:    form.technician_key,
          technicianName:   form.technician_name,
          dropOffDate:      form.drop_off_date,
          issueDescription: form.issue_desc,
          basePrice:        Number(form.base_price)  || 0,
          totalPrice:       Number(form.total_price) || 0,
          status:           form.status,
        });
      } else {
        await updateCustomer(editingId, form);
      }

      closeModal();
      load();
    } catch (err) {
      setFormError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const confirmDelete = (customer) =>
    setDeleteTarget({ id: customer.id, name: customer.customer_name });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCustomer(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  // ── Sorting ──
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <i className="bi bi-chevron-expand ms-1 text-white-50" style={{ fontSize: '0.7rem' }}></i>;
    return <i className={`bi bi-chevron-${sortDir === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '0.7rem' }}></i>;
  };

  // ── Filtered + sorted data ──
  const displayed = customers
    .filter(c => {
      const q = search.toLowerCase();
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;
      if (!q) return true;
      return (
        c.customer_name?.toLowerCase().includes(q)  ||
        c.customer_email?.toLowerCase().includes(q) ||
        c.phone_brand?.toLowerCase().includes(q)    ||
        c.phone_model?.toLowerCase().includes(q)    ||
        c.service_name?.toLowerCase().includes(q)   ||
        c.technician_name?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  // ── Sign out ──
  const handleSignOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/staff');
  };

  // ── Render ──
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

        {/* ── Page header ── */}
        <div className="portal-header">
          <div>
            <h1 className="portal-title">
              <i className="bi bi-shield-lock me-2"></i>Staff Portal
            </h1>
            <p className="portal-sub">Manage all customer repair bookings</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="portal-stat">
              <i className="bi bi-card-list me-1"></i>
              {customers.length} total booking{customers.length !== 1 ? 's' : ''}
            </span>
            <button className="btn btn-success" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1"></i>New Booking
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={handleSignOut}>
              <i className="bi bi-box-arrow-right me-1"></i>Sign Out
            </button>
          </div>
        </div>

        {/* ── Filters bar ── */}
        <div className="portal-filters">
          <div className="portal-search">
            <i className="bi bi-search portal-search-icon"></i>
            <input
              type="text"
              className="form-control portal-search-input"
              placeholder="Search by name, email, device, service…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="portal-search-clear" onClick={() => setSearch('')}>
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>

          <div className="portal-status-filters">
            {['All', ...STATUSES].map(s => (
              <button
                key={s}
                className={`portal-filter-pill ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="portal-stats-row">
          {STATUSES.map(s => {
            const count = customers.filter(c => c.status === s).length;
            const style = STATUS_STYLES[s];
            return (
              <div
                key={s}
                className={`portal-stat-chip ${filterStatus === s ? 'selected' : ''}`}
                style={{ '--chip-bg': style.bg, '--chip-color': style.color }}
                onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)}
              >
                <span className="chip-count">{count}</span>
                <span className="chip-label">{s}</span>
              </div>
            );
          })}
        </div>

        {/* ── Table ── */}
        {displayed.length === 0 ? (
          <div className="records-empty">
            <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: 'var(--border)' }}></i>
            <p className="mt-3">{search || filterStatus !== 'All' ? 'No records match your filters.' : 'No bookings yet.'}</p>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-responsive">
              <table className="table table-hover mb-0 portal-table">
                <thead>
                  <tr>
                    {[
                      { key: 'id',            label: '#' },
                      { key: 'customer_name', label: 'Customer' },
                      { key: 'phone_brand',   label: 'Device' },
                      { key: 'service_name',  label: 'Service' },
                      { key: 'technician_name', label: 'Technician' },
                      { key: 'drop_off_date', label: 'Drop-off' },
                      { key: 'total_price',   label: 'Total' },
                      { key: 'status',        label: 'Status' },
                    ].map(({ key, label }) => (
                      <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {label}<SortIcon col={key} />
                      </th>
                    ))}
                    <th style={{ width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(c => (
                    <tr key={c.id}>
                      <td className="text-muted" style={{ fontSize: '0.8rem' }}>{c.id}</td>
                      <td>
                        <div className="fw-semibold">{c.customer_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.customer_email}</div>
                      </td>
                      <td>{c.phone_brand} {c.phone_model}</td>
                      <td>{c.service_name}</td>
                      <td>{c.technician_name}</td>
                      <td>{c.drop_off_date || '—'}</td>
                      <td className="fw-semibold">${c.total_price}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm portal-btn-edit"
                            title="Edit"
                            onClick={() => openEdit(c)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="btn btn-sm portal-btn-delete"
                            title="Delete"
                            onClick={() => confirmDelete(c)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="portal-table-footer">
              Showing {displayed.length} of {customers.length} record{customers.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════
          Create / Edit Modal
      ════════════════════════════════════════════════════════════ */}
      <div className="modal fade" ref={modalRef} tabIndex="-1" aria-labelledby="bookingModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">

            <div className="modal-header" style={{ background: 'var(--brand)', color: '#fff' }}>
              <h5 className="modal-title fw-bold" id="bookingModalLabel">
                <i className={`bi ${modalMode === 'create' ? 'bi-plus-circle' : 'bi-pencil-square'} me-2`}></i>
                {modalMode === 'create' ? 'New Booking' : `Edit Booking #${editingId}`}
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>{formError}
                  </div>
                )}

                {/* ── Customer info ── */}
                <p className="modal-section-label">Customer Information</p>
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Full Name *</label>
                    <input name="customer_name" className="form-control" required
                      value={form.customer_name} onChange={handleFormChange} placeholder="Jane Smith" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Email *</label>
                    <input name="customer_email" type="email" className="form-control" required
                      value={form.customer_email} onChange={handleFormChange} placeholder="jane@example.com" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Phone *</label>
                    <input name="customer_phone" className="form-control" required
                      value={form.customer_phone} onChange={handleFormChange} placeholder="613-555-0100" />
                  </div>
                </div>

                {/* ── Device info ── */}
                <p className="modal-section-label">Device</p>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Brand *</label>
                    <input name="phone_brand" className="form-control" required
                      value={form.phone_brand} onChange={handleFormChange} placeholder="Apple" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Model *</label>
                    <input name="phone_model" className="form-control" required
                      value={form.phone_model} onChange={handleFormChange} placeholder="iPhone 15 Pro" />
                  </div>
                </div>

                {/* ── Repair details ── */}
                <p className="modal-section-label">Repair Details</p>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Service *</label>
                    <select name="service_key" className="form-select" required
                      value={form.service_key} onChange={handleFormChange}>
                      <option value="">— Select service —</option>
                      {services.map(s => (
                        <option key={s.key} value={s.key}>{s.name.en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Technician *</label>
                    <select name="technician_key" className="form-select" required
                      value={form.technician_key} onChange={handleFormChange}>
                      <option value="">— Select technician —</option>
                      {technicians.map(t => (
                        <option key={t.key} value={t.key}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Drop-off Date *</label>
                    <input name="drop_off_date" type="date" className="form-control" required
                      value={form.drop_off_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Base Price ($) *</label>
                    <input name="base_price" type="number" min="0" step="0.01" className="form-control" required
                      value={form.base_price} onChange={handleFormChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Total Price ($) *</label>
                    <input name="total_price" type="number" min="0" step="0.01" className="form-control" required
                      value={form.total_price} onChange={handleFormChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Issue Description</label>
                    <textarea name="issue_desc" className="form-control" rows="2"
                      value={form.issue_desc} onChange={handleFormChange}
                      placeholder="Optional notes about the issue…"></textarea>
                  </div>
                </div>

                {/* ── Status ── */}
                <p className="modal-section-label">Status</p>
                <div className="row g-3">
                  <div className="col-md-5">
                    <select name="status" className="form-select" value={form.status} onChange={handleFormChange}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-7 d-flex align-items-center">
                    <StatusBadge status={form.status} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                      Preview of badge that will appear in the table
                    </span>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success px-4" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                    : <><i className={`bi ${modalMode === 'create' ? 'bi-plus-lg' : 'bi-check-lg'} me-2`}></i>
                        {modalMode === 'create' ? 'Create Booking' : 'Save Changes'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          Delete Confirm Modal
      ════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div
          className="modal fade show d-block"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--danger)' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Delete Booking
                </h5>
              </div>
              <div className="modal-body pt-2">
                <p style={{ fontSize: '0.9rem' }}>
                  Are you sure you want to delete the booking for{' '}
                  <strong>{deleteTarget.name}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                  <i className="bi bi-trash me-1"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default StaffPortal;
