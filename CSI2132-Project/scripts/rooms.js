// Mostly copy-pasted from SEG3125
// Also technically W3Schools but my SEG TA just read off of W3Schools roflmao

const roomCache = new Map();           
let selectedRoomForBooking = null;
let bookingModalInstance   = null;     
let registerModalInstance  = null;

function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Room search controller
async function searchRooms() {
  const start    = document.getElementById('s_start').value;
  const end      = document.getElementById('s_end').value;
  const capacity = document.getElementById('s_capacity').value;
  const area     = document.getElementById('s_area').value;
  const chainId  = document.getElementById('s_chain').value;
  const minStars = document.getElementById('s_category').value;
  const maxPrice = document.getElementById('s_price').value;
  const minRooms = document.getElementById('s_rooms').value;

  const params = new URLSearchParams();
  if (start)    params.set('start', start);
  if (end)      params.set('end', end);
  if (capacity) params.set('capacity', capacity);
  if (area)     params.set('city', area);
  if (chainId)  params.set('chainId', chainId);
  if (minStars) params.set('stars', minStars);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (minRooms) params.set('minRooms', minRooms);

  const container = document.getElementById('searchResults');
  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <div class="mt-2 text-muted">Searching rooms...</div>
    </div>`;

  try {
    const res = await fetch(`${API}/rooms/search?${params}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const rooms = await res.json();

    // Populate cache
    roomCache.clear();
    rooms.forEach(r => roomCache.set(Number(r.roomID), r));

    const countEl = document.getElementById('searchCount');
    countEl.textContent = rooms.length
      ? `${rooms.length} room${rooms.length !== 1 ? 's' : ''} found`
      : '';

    if (!rooms.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            No rooms match your criteria. Try adjusting the filters.
          </div>
        </div>`;
      return;
    }

    container.innerHTML = rooms.map(room => renderRoomCard(room)).join('');
  } catch (e) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Could not load rooms. Is the server running?<br><small>${e.message}</small>
        </div>
      </div>`;
  }
}

// Room card renderer
function renderRoomCard(room) {
  const price = parseFloat(room.price) || 0;

  const amenityList = Array.isArray(room.amenities) && room.amenities.length
    ? room.amenities.map(a => `<span class="badge bg-light text-dark border me-1">${a}</span>`).join('')
    : '<span class="text-muted small">None listed</span>';

  const starCount = Number(room.starCount) || 0;
  const starStr   = starCount ? '★'.repeat(starCount) + '☆'.repeat(5 - starCount) : '-';

  const viewBadge   = room.viewType && room.viewType !== 'None'
    ? `<span class="badge bg-info text-dark me-1"><i class="bi bi-eye me-1"></i>${room.viewType}</span>` : '';
  const extBadge    = room.extendable
    ? `<span class="badge bg-secondary me-1"><i class="bi bi-arrows-expand me-1"></i>Extendable</span>` : '';
  const damageBadge = room.problemsDamages
    ? `<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-triangle me-1"></i>Issues noted</span>` : '';

  return `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm room-card">
        <div class="card-body d-flex flex-column">

          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="fw-bold mb-0">${room.hotelName || `Hotel #${room.hotelID}`}</h6>
              <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${room.hotelCity || '-'}</small>
            </div>
            <div class="text-end">
              <div class="h5 mb-0 text-primary fw-bold">
                ${formatMoney(price)}<small class="text-muted fs-6">/night</small>
              </div>
            </div>
          </div>

          <div class="mb-2">
            <span class="text-warning small">${starStr}</span>
            <span class="text-muted small ms-1">${room.chainName || ''}</span>
          </div>

          <div class="mb-2 d-flex flex-wrap gap-1">
            <span class="badge bg-primary"><i class="bi bi-people me-1"></i>${room.capacity}</span>
            <span class="badge bg-secondary"><i class="bi bi-door-open me-1"></i>Room ${room.roomNumber}</span>
            ${viewBadge}${extBadge}${damageBadge}
          </div>

          <div class="mb-2">
            <small class="text-muted d-block mb-1">Amenities:</small>
            <div>${amenityList}</div>
          </div>

          <div class="mt-auto pt-3 border-top d-flex gap-2">
            <button
              class="btn btn-primary btn-sm flex-grow-1"
              data-room-id="${room.roomID}"
              onclick="openBookingModal(this)">
              <i class="bi bi-calendar-plus me-1"></i>Book
            </button>
            <button
              class="btn btn-outline-secondary btn-sm"
              data-room-id="${room.roomID}"
              onclick="openRoomDetails(this)"
              title="Details">
              <i class="bi bi-info-circle"></i>
            </button>
          </div>

        </div>
        <div class="card-footer text-muted small d-flex justify-content-between">
          <span><i class="bi bi-building me-1"></i>${room.roomCount} rooms in hotel</span>
          <span>Room ID: ${room.roomID}</span>
        </div>
      </div>
    </div>`;
}

// Booking controller
function openBookingModal(btn) {
  const roomID = Number(btn.dataset.roomId);
  const room   = roomCache.get(roomID);

  if (!room) {
    showToast('Room data not found. Please search again.', 'error');
    return;
  }
  selectedRoomForBooking = room;
  document.getElementById('bookingRoomInfo').innerHTML = `
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <strong>Room ${room.roomNumber}</strong> - ${room.hotelName || `Hotel #${room.hotelID}`}
        <span class="text-muted">(${room.hotelCity || ''})</span>
      </div>
      <div>
        <span class="badge bg-primary me-1">${room.capacity}</span>
        <span class="text-primary fw-bold">${formatMoney(parseFloat(room.price))}/night</span>
      </div>
    </div>`;
  const todayStr  = getToday();
  const searchStart = document.getElementById('s_start').value;
  const searchEnd   = document.getElementById('s_end').value;

  const bkStart = document.getElementById('bk_start');
  const bkEnd   = document.getElementById('bk_end');
  bkStart.min   = todayStr;
  bkEnd.min     = todayStr;
  bkStart.value = searchStart || todayStr;
  bkEnd.value   = searchEnd   || '';

  // Clear previous input
  document.getElementById('bk_customerID').value    = '';
  document.getElementById('bk_customerInfo').innerHTML = '';

  if (!bookingModalInstance) {
    bookingModalInstance = new bootstrap.Modal(document.getElementById('bookingModal'), {
      backdrop: true,
      keyboard: true,
    });
  }
  bookingModalInstance.show();
}

// Customer search
async function lookupCustomer() {
  const id   = document.getElementById('bk_customerID').value.trim();
  const info = document.getElementById('bk_customerInfo');
  if (!id) { info.innerHTML = ''; return; }

  info.innerHTML = '<span class="text-muted">Looking up...</span>';
  try {
    const data     = await fetch(`${API}/customers`).then(r => r.json());
    const customer = data.find(c => String(c.customerID) === id);
    if (customer) {
      info.innerHTML = `
        <span class="text-success">
          <i class="bi bi-check-circle me-1"></i>
          <strong>${customer.custFullName}</strong> - ${customer.custIDType}: ${customer.custIDNumber}
        </span>`;
    } else {
      info.innerHTML = `
        <span class="text-danger">
          <i class="bi bi-x-circle me-1"></i>
          Customer #${id} not found.
          <a href="#" onclick="openRegisterCustomerModal(); return false;">Register new customer?</a>
        </span>`;
    }
  } catch (e) {info.innerHTML = `<span class="text-danger">Error: ${e.message}</span>`;}
}

// Booking submission
async function submitBooking() {
  const customerID = document.getElementById('bk_customerID').value.trim();
  const startDate  = document.getElementById('bk_start').value;
  const endDate    = document.getElementById('bk_end').value;

  if (!customerID)  { showToast('Please enter a Customer ID.', 'error'); return; }
  if (!startDate)   { showToast('Please select a check-in date.', 'error'); return; }
  if (!endDate)     { showToast('Please select a check-out date.', 'error'); return; }
  if (endDate <= startDate) { showToast('Check-out must be after check-in.', 'error'); return; }
  if (!selectedRoomForBooking) { showToast('No room selected.', 'error'); return; }

  try {
    const res = await fetch(`${API}/bookings`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerID:   parseInt(customerID),
        roomID:       selectedRoomForBooking.roomID,
        checkInDate:  startDate,
        checkOutDate: endDate,
      }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    bookingModalInstance.hide();
    showToast(`Booking #${data.bookingID} confirmed! Check-in: ${formatDate(data.checkInDate)}`);
    searchRooms(); // Refresh to reflect new availability
  } catch (e) {showToast(e.message, 'error');}
}

// Registration control
function openRegisterCustomerModal() {
  ['reg_name','reg_address','reg_idnumber'].forEach(id => {
    document.getElementById(id).value = '';
  });
  if (!registerModalInstance) {
    registerModalInstance = new bootstrap.Modal(document.getElementById('registerCustomerModal'));
  }
  registerModalInstance.show();
}

async function submitRegisterCustomer() {
  const custFullName = document.getElementById('reg_name').value.trim();
  const custAddress  = document.getElementById('reg_address').value.trim();
  const custIDType   = document.getElementById('reg_idtype').value;
  const custIDNumber = document.getElementById('reg_idnumber').value.trim();

  if (!custFullName) { showToast('Full name is required.', 'error'); return; }
  if (!custAddress)  { showToast('Address is required.', 'error'); return; }
  if (!custIDNumber) { showToast('ID number is required.', 'error'); return; }

  try {
    const res = await fetch(`${API}/customers`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custFullName, custAddress, custIDType, custIDNumber }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    registerModalInstance.hide();
    document.getElementById('bk_customerID').value = data.customerID;
    document.getElementById('bk_customerInfo').innerHTML = `
      <span class="text-success">
        <i class="bi bi-check-circle me-1"></i>
        <strong>${data.custFullName}</strong> registered (ID: ${data.customerID})
      </span>`;
    showToast(`Customer registered with ID ${data.customerID}`);
  } catch (e) {showToast(e.message, 'error');}
}

function openRoomDetails(btn) {
  const roomID = Number(btn.dataset.roomId);
  const room   = roomCache.get(roomID);
  if (!room) return;
  const amenities = Array.isArray(room.amenities) && room.amenities.length
    ? room.amenities.join(', ') : 'None';
  const starCount = Number(room.starCount) || 0;
  alert([
    `Room ${room.roomNumber} - ${room.hotelName || `Hotel #${room.hotelID}`}`,
    `Chain: ${room.chainName || '-'}`,
    `City: ${room.hotelCity || '-'}`,
    `Category: ${starCount ? '★'.repeat(starCount) : '-'}`,
    `Capacity: ${room.capacity}`,
    `Price: ${formatMoney(parseFloat(room.price))}/night`,
    `View: ${room.viewType || 'None'}`,
    `Extendable: ${room.extendable ? 'Yes' : 'No'}`,
    `Amenities: ${amenities}`,
    room.problemsDamages ? `Issues: ${room.problemsDamages}` : null,
  ].filter(Boolean).join('\n'));
}
