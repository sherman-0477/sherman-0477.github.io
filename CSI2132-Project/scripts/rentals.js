// Main stuff
async function loadRentings() {
  const container = document.getElementById('rentingsTableContainer');
  container.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>`;
  try {
    const data = await fetch(`${API}/rentings`).then(r => r.json());
    const active = data.filter(r => r.status === 'Active');
    if (!active.length) {
      container.innerHTML = '<div class="alert alert-info">No active rentings.</div>';
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm table-striped table-hover align-middle">
          <thead class="table-dark">
            <tr>
              <th>ID</th><th>Customer</th><th>Room</th><th>Hotel</th>
              <th>Check-In</th><th>Check-Out</th>
              <th>Room Price</th><th>Total Paid</th><th>Employee</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${active.map(r => {
              const price    = parseFloat(r.roomPrice) || 0;
              const paid     = parseFloat(r.totalPaid)  || 0;
              const balance  = price - paid;
              const paidBadge = balance <= 0
                ? `<span class="badge bg-success">${formatMoney(paid)}</span>`
                : `<span class="badge bg-warning text-dark">${formatMoney(paid)} <small>(${formatMoney(balance)} due)</small></span>`;
              return `<tr>
                <td>${r.rentingID}</td>
                <td>${r.custFullName} <small class="text-muted">#${r.customerID}</small></td>
                <td>Room ${r.roomNumber}</td>
                <td>${r.hotelName}<br><small class="text-muted">${r.hotelCity || ''}</small></td>
                <td>${formatDate(r.checkInDate)}</td>
                <td>${formatDate(r.checkOutDate)}</td>
                <td>${formatMoney(price)}</td>
                <td>${paidBadge}</td>
                <td>${r.employeeFullName || '-'}</td>
                <td class="text-nowrap">
                  <button class="btn btn-xs btn-outline-warning me-1" onclick="quickPayment(${r.rentingID})">
                    <i class="bi bi-cash"></i>
                  </button>
                  <button class="btn btn-xs btn-outline-danger" onclick="quickCheckout(${r.rentingID})">
                    <i class="bi bi-box-arrow-right"></i>
                  </button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
  }
}

// Check in modal
let selectedBookingForCheckin = null;

function openCheckinModal() {
  selectedBookingForCheckin = null;
  document.getElementById('ci_search').value = '';
  document.getElementById('ci_results').innerHTML = '';
  document.getElementById('ci_selected').classList.add('d-none');
  document.getElementById('ci_confirmBtn').classList.add('d-none');
  document.getElementById('ci_employeeID').value = '';
  new bootstrap.Modal(document.getElementById('checkinModal')).show();
}

async function searchBookings() {
  const query = document.getElementById('ci_search').value.toLowerCase().trim();
  const container = document.getElementById('ci_results');
  if (!query) { container.innerHTML = ''; return; }

  try {
    const data = await fetch(`${API}/bookings`).then(r => r.json());
    const pending = data.filter(b =>
      b.status === 'Pending' &&
      (b.custFullName.toLowerCase().includes(query) ||
       String(b.bookingID).includes(query) ||
       String(b.customerID).includes(query))
    );

    if (!pending.length) {
      container.innerHTML = '<div class="alert alert-warning mt-2">No pending bookings found.</div>';
      return;
    }

    container.innerHTML = `
      <div class="list-group mt-2">
        ${pending.map(b => `
          <button class="list-group-item list-group-item-action" onclick="selectBookingCheckin(${b.bookingID})">
            <div class="d-flex justify-content-between">
              <strong>${b.custFullName}</strong>
              <span class="badge bg-warning text-dark">Booking #${b.bookingID}</span>
            </div>
            <small class="text-muted">Room ${b.roomNumber} - ${b.hotelName} | ${formatDate(b.checkInDate)} → ${formatDate(b.checkOutDate)}</small>
          </button>`).join('')}
      </div>`;
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger mt-2">Error: ${e.message}</div>`;
  }
}

async function selectBookingCheckin(bookingID) {
  const data = await fetch(`${API}/bookings`).then(r => r.json());
  const booking = data.find(b => b.bookingID === bookingID);
  if (!booking) return;
  selectedBookingForCheckin = booking;

  document.getElementById('ci_results').innerHTML = '';
  document.getElementById('ci_selected').classList.remove('d-none');
  document.getElementById('ci_confirmBtn').classList.remove('d-none');
  document.getElementById('ci_selectedInfo').innerHTML = `
    <strong>Booking #${booking.bookingID}</strong> - ${booking.custFullName}<br>
    Room ${booking.roomNumber} @ ${booking.hotelName}<br>
    ${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)}
    <span class="badge bg-primary ms-2">${formatMoney(booking.price)}/night</span>`;
}

async function submitCheckin() {
  if (!selectedBookingForCheckin) return;
  const employeeID = document.getElementById('ci_employeeID').value || null;

  try {
    const res = await fetch(`${API}/bookings/${selectedBookingForCheckin.bookingID}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeID: employeeID ? parseInt(employeeID) : null }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }

    bootstrap.Modal.getInstance(document.getElementById('checkinModal')).hide();
    showToast(`Check-in complete! Renting #${data.rentingID} created.`);
    loadRentings();
  } catch (e) { showToast(e.message, 'error'); }
}

// Walk in modal
function openWalkinModal() {
  ['wi_customerID','wi_employeeID','wi_roomID','wi_start','wi_end'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('wi_customerInfo').innerHTML = '';
  document.getElementById('wi_roomInfo').innerHTML = '';
  document.getElementById('wi_start').min = today;
  document.getElementById('wi_end').min   = today;
  new bootstrap.Modal(document.getElementById('walkinModal')).show();
}

async function lookupCustomerWI() {
  const id = document.getElementById('wi_customerID').value;
  const info = document.getElementById('wi_customerInfo');
  if (!id) return;
  try {
    const data = await fetch(`${API}/customers`).then(r => r.json());
    const c = data.find(x => String(x.customerID) === String(id));
    info.innerHTML = c
      ? `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${c.custFullName}</span>`
      : `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Not found</span>`;
  } catch (e) { info.textContent = 'Error'; }
}

async function lookupRoomWI() {
  const id = document.getElementById('wi_roomID').value;
  const info = document.getElementById('wi_roomInfo');
  if (!id) return;
  try {
    const data = await fetch(`${API}/rooms`).then(r => r.json());
    const r = data.find(x => String(x.roomID) === String(id));
    info.innerHTML = r
      ? `<span class="text-success"><i class="bi bi-check-circle me-1"></i>Room ${r.roomNumber} - ${r.hotelName} (${formatMoney(r.price)}/night)</span>`
      : `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Room not found</span>`;
  } catch (e) { info.textContent = 'Error'; }
}

async function submitWalkin() {
  const customerID  = document.getElementById('wi_customerID').value;
  const employeeID  = document.getElementById('wi_employeeID').value;
  const roomID      = document.getElementById('wi_roomID').value;
  const checkInDate = document.getElementById('wi_start').value;
  const checkOutDate= document.getElementById('wi_end').value;

  if (!customerID || !roomID || !checkInDate || !checkOutDate) {
    showToast('Please fill in all required fields.', 'error'); return;
  }
  if (checkOutDate <= checkInDate) {
    showToast('Check-out must be after check-in.', 'error'); return;
  }
  try {
    const res = await fetch(`${API}/rentings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerID:  parseInt(customerID),
        roomID:      parseInt(roomID),
        employeeID:  employeeID ? parseInt(employeeID) : null,
        checkInDate,
        checkOutDate,
      }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    bootstrap.Modal.getInstance(document.getElementById('walkinModal')).hide();
    showToast(`Walk-in renting #${data.rentingID} created successfully!`);
    loadRentings();
  } catch (e) { showToast(e.message, 'error'); }
}

// Payment modal
function openPaymentModal() {
  document.getElementById('pay_rentingID').value = '';
  document.getElementById('pay_amount').value    = '';
  document.getElementById('pay_rentingInfo').innerHTML = '';
  new bootstrap.Modal(document.getElementById('paymentModal')).show();
}

function quickPayment(rentingID) {
  document.getElementById('pay_rentingID').value = rentingID;
  document.getElementById('pay_rentingInfo').innerHTML = '';
  lookupRenting();
  new bootstrap.Modal(document.getElementById('paymentModal')).show();
}

async function lookupRenting() {
  const id   = document.getElementById('pay_rentingID').value;
  const info = document.getElementById('pay_rentingInfo');
  if (!id) return;
  try {
    const data = await fetch(`${API}/rentings`).then(r => r.json());
    const r = data.find(x => String(x.rentingID) === String(id));
    if (r) {
      const paid    = parseFloat(r.totalPaid) || 0;
      const price   = parseFloat(r.roomPrice) || 0;
      const balance = Math.max(0, price - paid);
      info.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${r.custFullName} - Room ${r.roomNumber} @ ${r.hotelName}<br>
        Room price: ${formatMoney(price)} | Paid: ${formatMoney(paid)} | <strong>Balance: ${formatMoney(balance)}</strong></span>`;
      if (!document.getElementById('pay_amount').value) {
        document.getElementById('pay_amount').value = balance.toFixed(2);
      }
    } else {
      info.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Renting not found or not active</span>`;
    }
  } catch (e) { info.textContent = 'Error'; }
}

async function submitPayment() {
  const rentingID     = document.getElementById('pay_rentingID').value;
  const amount        = document.getElementById('pay_amount').value;
  const paymentMethod = document.getElementById('pay_method').value;

  if (!rentingID || !amount) {
    showToast('Please enter renting ID and amount.', 'error'); return;
  }
  if (parseFloat(amount) <= 0) {
    showToast('Amount must be greater than zero.', 'error'); return;
  }
  try {
    const res = await fetch(`${API}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rentingID: parseInt(rentingID), amount: parseFloat(amount), paymentMethod }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
    showToast(`Payment of ${formatMoney(amount)} recorded.`);
    loadRentings();
  } catch (e) { showToast(e.message, 'error'); }
}

// Checkout modal
function openCheckoutModal() {
  document.getElementById('co_rentingID').value = '';
  document.getElementById('co_rentingInfo').innerHTML = '';
  new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}

function quickCheckout(rentingID) {
  document.getElementById('co_rentingID').value = rentingID;
  lookupRentingCO();
  new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}

async function lookupRentingCO() {
  const id   = document.getElementById('co_rentingID').value;
  const info = document.getElementById('co_rentingInfo');
  if (!id) return;
  try {
    const data = await fetch(`${API}/rentings`).then(r => r.json());
    const r = data.find(x => String(x.rentingID) === String(id));
    if (r) {
      const paid    = parseFloat(r.totalPaid) || 0;
      const price   = parseFloat(r.roomPrice) || 0;
      const balance = price - paid;
      info.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${r.custFullName} - Room ${r.roomNumber} @ ${r.hotelName}<br>
        Balance: <strong class="${balance > 0 ? 'text-danger' : 'text-success'}">${formatMoney(balance)}</strong></span>`;
    } else {
      info.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Renting not found</span>`;
    }
  } catch (e) { info.textContent = 'Error'; }
}

async function submitCheckout() {
  const rentingID = document.getElementById('co_rentingID').value;
  if (!rentingID) { showToast('Enter a renting ID.', 'error'); return; }
  try {
    const res = await fetch(`${API}/rentings/${rentingID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed', actualCheckOutDatetime: new Date().toISOString() }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
    showToast(`Renting #${rentingID} completed. Guest checked out.`);
    loadRentings();
  } catch (e) { showToast(e.message, 'error'); }
}