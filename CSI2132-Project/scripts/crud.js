let crudCurrentData = [];
let crudEditingID   = null;
let crudHotels      = [];
let crudChains      = [];

// Main stuff
const ENTITY_CONFIG = {
  customers: {
    label: 'Customer',
    idField: 'customerID',
    endpoint: 'customers',
    columns: [
      { key: 'customerID', label: 'ID' },
      { key: 'custFullName', label: 'Full Name' },
      { key: 'custAddress', label: 'Address' },
      { key: 'custIDType', label: 'ID Type' },
      { key: 'custIDNumber', label: 'ID Number' },
      { key: 'registrationDate', label: 'Registered', format: formatDate },
    ],
    formFields: () => `
      <div class="mb-3"><label class="form-label">Full Name *</label>
        <input class="form-control" id="f_custFullName" required></div>
      <div class="mb-3"><label class="form-label">Address *</label>
        <input class="form-control" id="f_custAddress" required></div>
      <div class="row g-2">
        <div class="col-6"><label class="form-label">ID Type *</label>
          <select class="form-select" id="f_custIDType">
            <option>SSN</option><option>SIN</option><option>Driver's License</option><option>Passport</option>
          </select></div>
        <div class="col-6"><label class="form-label">ID Number *</label>
          <input class="form-control" id="f_custIDNumber" required></div>
      </div>`,
    getPayload: () => ({
      custFullName: v('f_custFullName'),
      custAddress:  v('f_custAddress'),
      custIDType:   v('f_custIDType'),
      custIDNumber: v('f_custIDNumber'),
    }),
    fillForm: (row) => {
      sv('f_custFullName', row.custFullName);
      sv('f_custAddress',  row.custAddress);
      sv('f_custIDType',   row.custIDType);
      sv('f_custIDNumber', row.custIDNumber);
    },
  },

  employees: {
    label: 'Employee',
    idField: 'employeeID',
    endpoint: 'employees',
    columns: [
      { key: 'employeeID', label: 'ID' },
      { key: 'employeeFullName', label: 'Full Name' },
      { key: 'hotelName', label: 'Hotel' },
      { key: 'employeeAddress', label: 'Address' },
      { key: 'roles', label: 'Roles', format: (r) => Array.isArray(r) ? r.join(', ') : r || '-' },
    ],
    formFields: () => `
      <div class="mb-3"><label class="form-label">Full Name *</label>
        <input class="form-control" id="f_employeeFullName" required></div>
      <div class="mb-3"><label class="form-label">Address *</label>
        <input class="form-control" id="f_employeeAddress" required></div>
      <div class="mb-3"><label class="form-label">SSN/SIN *</label>
        <input class="form-control" id="f_employeeSSN" required></div>
      <div class="mb-3"><label class="form-label">Hotel *</label>
        <select class="form-select" id="f_hotelID">
          ${crudHotels.map(h => `<option value="${h.hotelID}">${h.hotelName} - ${h.hotelCity || ''}</option>`).join('')}
        </select></div>
      <div class="mb-3"><label class="form-label">Roles (comma-separated)</label>
        <input class="form-control" id="f_roles" placeholder="e.g. Manager, Receptionist"></div>`,
    getPayload: () => ({
      employeeFullName: v('f_employeeFullName'),
      employeeAddress:  v('f_employeeAddress'),
      employeeSSN:      v('f_employeeSSN'),
      hotelID:          parseInt(v('f_hotelID')),
      roles: v('f_roles').split(',').map(r => r.trim()).filter(Boolean),
    }),
    fillForm: (row) => {
      sv('f_employeeFullName', row.employeeFullName);
      sv('f_employeeAddress',  row.employeeAddress);
      sv('f_employeeSSN',      row.employeeSSN);
      sv('f_hotelID',          row.hotelID);
      sv('f_roles', Array.isArray(row.roles) ? row.roles.join(', ') : '');
    },
  },

  hotels: {
    label: 'Hotel',
    idField: 'hotelID',
    endpoint: 'hotels',
    columns: [
      { key: 'hotelID', label: 'ID' },
      { key: 'hotelName', label: 'Name' },
      { key: 'chainName', label: 'Chain' },
      { key: 'hotelCity', label: 'City' },
      { key: 'starCount', label: 'Stars', format: (v) => v ? '★'.repeat(v) : '-' },
      { key: 'roomCount', label: 'Rooms' },
    ],
    formFields: () => `
      <div class="mb-3"><label class="form-label">Hotel Name *</label>
        <input class="form-control" id="f_hotelName" required></div>
      <div class="row g-2 mb-3">
        <div class="col-8"><label class="form-label">Address *</label>
          <input class="form-control" id="f_hotelAddress" required></div>
        <div class="col-4"><label class="form-label">City *</label>
          <input class="form-control" id="f_hotelCity" required></div>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6"><label class="form-label">Hotel Chain *</label>
          <select class="form-select" id="f_chainID">
            ${crudChains.map(c => `<option value="${c.chainID}">${c.chainName}</option>`).join('')}
          </select></div>
        <div class="col-6"><label class="form-label">Star Rating</label>
          <select class="form-select" id="f_starCount">
            <option value="">-</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
          </select></div>
      </div>
      <div class="mb-3"><label class="form-label">Contact Emails (comma-separated)</label>
        <input class="form-control" id="f_emails" placeholder="hotel@example.com"></div>
      <div class="mb-3"><label class="form-label">Phone Numbers (comma-separated)</label>
        <input class="form-control" id="f_phones" placeholder="613-555-0100"></div>`,
    getPayload: () => ({
      hotelName:    v('f_hotelName'),
      hotelAddress: v('f_hotelAddress'),
      hotelCity:    v('f_hotelCity'),
      chainID:      parseInt(v('f_chainID')),
      starCount:    v('f_starCount') ? parseInt(v('f_starCount')) : null,
      emails: v('f_emails').split(',').map(e => e.trim()).filter(Boolean),
      phones: v('f_phones').split(',').map(p => p.trim()).filter(Boolean),
    }),
    fillForm: (row) => {
      sv('f_hotelName',    row.hotelName);
      sv('f_hotelAddress', row.hotelAddress);
      sv('f_hotelCity',    row.hotelCity);
      sv('f_chainID',      row.chainID);
      sv('f_starCount',    row.starCount || '');
      sv('f_emails', Array.isArray(row.emails) ? row.emails.join(', ') : '');
      sv('f_phones', Array.isArray(row.phones) ? row.phones.join(', ') : '');
    },
  },

  rooms: {
    label: 'Room',
    idField: 'roomID',
    endpoint: 'rooms',
    columns: [
      { key: 'roomID', label: 'ID' },
      { key: 'roomNumber', label: 'Room #' },
      { key: 'hotelName', label: 'Hotel' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'price', label: 'Price', format: formatMoney },
      { key: 'viewType', label: 'View' },
      { key: 'extendable', label: 'Extendable', format: v => v ? 'Yes' : 'No' },
    ],
    formFields: () => `
      <div class="row g-2 mb-3">
        <div class="col-8"><label class="form-label">Hotel *</label>
          <select class="form-select" id="f_hotelID">
            ${crudHotels.map(h => `<option value="${h.hotelID}">${h.hotelName} - ${h.hotelCity || ''}</option>`).join('')}
          </select></div>
        <div class="col-4"><label class="form-label">Room Number *</label>
          <input type="number" class="form-control" id="f_roomNumber" required></div>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6"><label class="form-label">Price ($/night) *</label>
          <input type="number" step="0.01" class="form-control" id="f_price" required></div>
        <div class="col-6"><label class="form-label">Capacity *</label>
          <select class="form-select" id="f_capacity">
            <option>Single</option><option>Double</option><option>Triple</option><option>Quad</option><option>Suite</option><option>Other</option>
          </select></div>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6"><label class="form-label">View Type</label>
          <select class="form-select" id="f_viewType">
            <option value="None">None</option><option>Sea View</option><option>Mountain View</option><option>City View</option><option>Garden View</option>
          </select></div>
        <div class="col-6 d-flex align-items-end pb-1">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="f_extendable">
            <label class="form-check-label" for="f_extendable">Extendable (extra bed)</label>
          </div>
        </div>
      </div>
      <div class="mb-3"><label class="form-label">Problems / Damages</label>
        <textarea class="form-control" id="f_problemsDamages" rows="2" placeholder="Leave blank if none"></textarea></div>`,
    getPayload: () => ({
      hotelID:         parseInt(v('f_hotelID')),
      roomNumber:      parseInt(v('f_roomNumber')),
      price:           parseFloat(v('f_price')),
      capacity:        v('f_capacity'),
      viewType:        v('f_viewType'),
      extendable:      document.getElementById('f_extendable').checked,
      problemsDamages: v('f_problemsDamages') || null,
    }),
    fillForm: (row) => {
      sv('f_hotelID',         row.hotelID);
      sv('f_roomNumber',      row.roomNumber);
      sv('f_price',           parseFloat(row.price).toFixed(2));
      sv('f_capacity',        row.capacity);
      sv('f_viewType',        row.viewType);
      sv('f_problemsDamages', row.problemsDamages || '');
      document.getElementById('f_extendable').checked = row.extendable;
    },
  },

  chains: {
    label: 'Hotel Chain',
    idField: 'chainID',
    endpoint: 'chains',
    columns: [
      { key: 'chainID', label: 'ID' },
      { key: 'chainName', label: 'Name' },
      { key: 'centralOfficeAddress', label: 'Office Address' },
      { key: 'hotelCount', label: 'Hotels' },
    ],
    formFields: () => `
      <div class="mb-3"><label class="form-label">Chain Name *</label>
        <input class="form-control" id="f_chainName" required></div>
      <div class="mb-3"><label class="form-label">Central Office Address *</label>
        <input class="form-control" id="f_centralOfficeAddress" required></div>
      <div class="mb-3"><label class="form-label">Contact Emails (comma-separated)</label>
        <input class="form-control" id="f_emails" placeholder="chain@example.com"></div>
      <div class="mb-3"><label class="form-label">Phone Numbers (comma-separated)</label>
        <input class="form-control" id="f_phones" placeholder="613-555-0100"></div>`,
    getPayload: () => ({
      chainName:             v('f_chainName'),
      centralOfficeAddress:  v('f_centralOfficeAddress'),
      emails: v('f_emails').split(',').map(e => e.trim()).filter(Boolean),
      phones: v('f_phones').split(',').map(p => p.trim()).filter(Boolean),
    }),
    fillForm: (row) => {
      sv('f_chainName',            row.chainName);
      sv('f_centralOfficeAddress', row.centralOfficeAddress);
      sv('f_emails', Array.isArray(row.emails) ? row.emails.join(', ') : '');
      sv('f_phones', Array.isArray(row.phones) ? row.phones.join(', ') : '');
    },
  },
};

// Load table
async function loadCrudTable() {
  const entity = currentEntity();
  const config = ENTITY_CONFIG[entity];
  const container = document.getElementById('crudTableContainer');

  try {
    [crudHotels, crudChains] = await Promise.all([
      fetch(`${API}/hotels/list`).then(r => r.json()),
      fetch(`${API}/chains/list`).then(r => r.json()),
    ]);
  } catch (e) { /* ignore if server not up */ }

  container.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>`;

  try {
    const data = await fetch(`${API}/${config.endpoint}`).then(r => r.json());
    crudCurrentData = data;
    if (!data.length) {
      container.innerHTML = `<div class="alert alert-info">No ${config.label.toLowerCase()}s found. Add one above.</div>`;
      return;
    }
    const thead = config.columns.map(c => `<th>${c.label}</th>`).join('') + '<th>Actions</th>';
    const tbody = data.map(row => {
      const cells = config.columns.map(c => {
        const val = row[c.key];
        const display = c.format ? c.format(val) : (val ?? '-');
        return `<td>${display}</td>`;
      }).join('');
      const id = row[config.idField];
      return `<tr>
        ${cells}
        <td class="text-nowrap">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal('${entity}', ${id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCrud('${entity}', ${id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm table-striped table-hover align-middle">
          <thead class="table-dark"><tr>${thead}</tr></thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>`;
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
  }
}

// Add modal
async function openAddModal() {
  const entity = currentEntity();
  const config = ENTITY_CONFIG[entity];
  crudEditingID = null;

  document.getElementById('crudModalTitle').textContent = `Add ${config.label}`;
  document.getElementById('crudModalBody').innerHTML = config.formFields();
  new bootstrap.Modal(document.getElementById('crudModal')).show();
}

// Edit modal
function openEditModal(entity, id) {
  const config = ENTITY_CONFIG[entity];
  const row = crudCurrentData.find(r => String(r[config.idField]) === String(id));
  if (!row) return;
  crudEditingID = id;

  document.getElementById('crudModalTitle').textContent = `Edit ${config.label} #${id}`;
  document.getElementById('crudModalBody').innerHTML = config.formFields();
  config.fillForm(row);
  new bootstrap.Modal(document.getElementById('crudModal')).show();
}

// Save handler
async function saveCrudForm() {
  const entity = currentEntity();
  const config = ENTITY_CONFIG[entity];
  const payload = config.getPayload();
  const hasEmpty = Object.values(payload).some(v =>
    typeof v === 'string' && v.trim() === '' && !['problemsDamages'].includes(v)
  );
  try {
    const url = crudEditingID
      ? `${API}/${config.endpoint}/${crudEditingID}`
      : `${API}/${config.endpoint}`;
    const method = crudEditingID ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    bootstrap.Modal.getInstance(document.getElementById('crudModal')).hide();
    showToast(`${config.label} ${crudEditingID ? 'updated' : 'created'} successfully.`);
    loadCrudTable();
  } catch (e) { showToast(e.message, 'error'); }
}

// Delete handler
async function deleteCrud(entity, id) {
  const config = ENTITY_CONFIG[entity];
  if (!confirm(`Delete this ${config.label.toLowerCase()} (ID: ${id})? This cannot be undone.`)) return;
  try {
    const res = await fetch(`${API}/${config.endpoint}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast(`${config.label} deleted.`);
    loadCrudTable();
  } catch (e) { showToast(e.message, 'error'); }
}

// Booking table
async function loadBookings() {
  const container = document.getElementById('bookingsTableContainer');
  container.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>`;
  try {
    const data = await fetch(`${API}/bookings`).then(r => r.json());
    if (!data.length) { container.innerHTML = '<div class="alert alert-info">No bookings found.</div>'; return; }
    const statusBadge = s => {
      const map = { Pending: 'warning', Active: 'success', Completed: 'secondary', Cancelled: 'danger' };
      return `<span class="badge bg-${map[s] || 'dark'}">${s}</span>`;
    };

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm table-striped table-hover align-middle">
          <thead class="table-dark">
            <tr><th>ID</th><th>Customer</th><th>Room</th><th>Hotel</th><th>Check-In</th><th>Check-Out</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${data.map(b => `<tr>
              <td>${b.bookingID}</td>
              <td>${b.custFullName} <small class="text-muted">#${b.customerID}</small></td>
              <td>Room ${b.roomNumber}</td>
              <td>${b.hotelName}<br><small class="text-muted">${b.hotelCity || ''}</small></td>
              <td>${formatDate(b.checkInDate)}</td>
              <td>${formatDate(b.checkOutDate)}</td>
              <td>${statusBadge(b.status)}</td>
              <td class="text-nowrap">
                ${b.status === 'Pending' ? `
                  <button class="btn btn-xs btn-outline-danger" onclick="cancelBooking(${b.bookingID})">
                    <i class="bi bi-x"></i> Cancel
                  </button>` : ''}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { container.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`; }
}

async function cancelBooking(id) {
  if (!confirm(`Cancel booking #${id}?`)) return;
  try {
    const res = await fetch(`${API}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelled' }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast(`Booking #${id} cancelled.`);
    loadBookings();
  } catch (e) { showToast(e.message, 'error'); }
}

const v  = id => (document.getElementById(id) || {}).value || '';
const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };

function currentEntity() {
  return document.getElementById('crudEntity').value;
}