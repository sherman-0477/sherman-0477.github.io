// Half of this is straight copy-pasted from my SEG3125 works
// To view things I've made in SEG3125, check out https://sherman-0477.github.io/

const API = 'http://localhost:3000/api';

// Date helpers. Makes it so you can't choose a past date for search/booking.
const today = new Date().toISOString().split('T')[0];
document.getElementById('s_start').min = today;
document.getElementById('s_end').min = today;

// Navigation
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('d-none'));
  const target = document.getElementById(sectionId);
  if (target) target.classList.remove('d-none');
  if (sectionId === 'sec-views') loadViews();
  if (sectionId === 'sec-staff') loadCrudTable();
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  if (hash) showSection(hash);
});

window.addEventListener('load', () => {
  const hash = window.location.hash.slice(1);
  showSection(hash || 'sec-search');
  populateDropdown();
});

// Data population for dropdowns
async function populateDropdown() {
  try {
    const [cities, chains] = await Promise.all([
      fetch(`${API}/cities`).then(r => r.json()),
      fetch(`${API}/chains/list`).then(r => r.json()),
    ]);
    const areaSelect = document.getElementById('s_area');
    cities.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      areaSelect.appendChild(opt);
    });
    const chainSelect = document.getElementById('s_chain');
    chains.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.chainID;
      opt.textContent = c.chainName;
      chainSelect.appendChild(opt);
    });
  } catch (e) {
    console.warn('Could not load dropdowns (is the server running?):', e.message);
  }
}

// Views
async function loadViews() {
  loadAvailableRoomsView();
  loadCapacityView();
}

async function loadAvailableRoomsView() {
  const container = document.getElementById('viewRoomsPerCity');
  try {
    const data = await fetch(`${API}/views/available-rooms`).then(r => r.json());
    if (!data.length) { container.innerHTML = '<p class="p-3 text-muted">No data available.</p>'; return; }
    container.innerHTML = `
      <table class="table table-sm table-striped table-hover mb-0">
        <thead class="table-dark"><tr><th>City</th><th class="text-end">Available Rooms</th></tr></thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.city || '-'}</td>
              <td class="text-end fw-bold">${row.totalRooms}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    container.innerHTML = `<p class="p-3 text-danger">Error: ${e.message}</p>`;
  }
}

async function loadCapacityView() {
  const container = document.getElementById('viewCapacityPerHotel');
  try {
    const data = await fetch(`${API}/views/capacity-per-hotel`).then(r => r.json());
    if (!data.length) { container.innerHTML = '<p class="p-3 text-muted">No data available.</p>'; return; }
    container.innerHTML = `
      <table class="table table-sm table-striped table-hover mb-0">
        <thead class="table-dark"><tr><th>Hotel</th><th>City</th><th class="text-end">Total Capacity</th></tr></thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.hotelName || `Hotel #${row.hotelID}`}</td>
              <td>${row.hotelAddress || '-'}</td>
              <td class="text-end fw-bold">${row.totalCapacity ?? 0}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    container.innerHTML = `<p class="p-3 text-danger">Error: ${e.message}</p>`;
  }
}

// Bootstrap toasts
function showToast(message, type = 'success') {
  const toastEl = document.getElementById('appToast');
  const toastBody = document.getElementById('toastBody');
  const toastTitle = document.getElementById('toastTitle');
  toastEl.className = 'toast';
  toastEl.classList.add(type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-success');
  toastEl.classList.add('text-white');
  toastTitle.textContent = type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Success';
  toastBody.textContent = message;
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
}

// Format conversions
function stars(n) {
  if (!n) return '-';
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function formatMoney(val) {
  if (val == null) return '-';
  return '$' + parseFloat(val).toFixed(2);
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString();
}

function clearSearch() {
  ['s_start','s_end','s_capacity','s_area','s_chain','s_category','s_price','s_rooms'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('searchCount').textContent = '';
}
