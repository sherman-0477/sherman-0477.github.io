//Constraints for dates. Found a guide on StackOverflow.
var state = {
  step: 1,
  serviceKey: "",
  staffChosen: [],
  date: "",
  timeSlot: "",
  name: "",
  email: "",
  phone: ""
};

function money(n) {
  return "$" + Number(n).toFixed(2);
}

function setStep(nextStep) {
  state.step = nextStep;

  var i;
  for (i = 1; i <= 5; i++) {
    var el = document.getElementById("step-" + i);
    if (!el) continue;
    if (i === nextStep) el.classList.remove("d-none");
    else el.classList.add("d-none");
  }

  var hr2 = document.getElementById("hr-2");
  var hr3 = document.getElementById("hr-3");
  var hr4 = document.getElementById("hr-4");

  if (hr2) (nextStep >= 2) ? hr2.classList.remove("d-none") : hr2.classList.add("d-none");
  if (hr3) (nextStep >= 3) ? hr3.classList.remove("d-none") : hr3.classList.add("d-none");
  if (hr4) (nextStep >= 4) ? hr4.classList.remove("d-none") : hr4.classList.add("d-none");

  updateBreadcrumb();
  updateConfirm();
  updateSummary();
  updateButtons();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateBreadcrumb() {
  var crumbs = document.querySelectorAll("#progressBreadcrumb li");
  var i;
  for (i = 0; i < crumbs.length; i++) {
    var li = crumbs[i];
    var s = Number(li.getAttribute("data-step"));
    var isActive = (s === state.step);

    if (isActive) {
      li.classList.add("active");
      li.classList.remove("text-muted");
      li.setAttribute("aria-current", "page");
    } else {
      li.classList.remove("active");
      li.classList.add("text-muted");
      li.setAttribute("aria-current", "false");
    }
  }
}

function updateSummary() {
  var box = document.getElementById("selectionSummary");
  if (!box) return;

  var svc = services[state.serviceKey];
  var parts = [];

  if (svc) parts.push("You chose: " + svc.label + " (" + money(svc.price) + ")");
  if (state.staffChosen.length) parts.push("Staff: " + state.staffChosen.join(", "));
  if (state.date && state.timeSlot) parts.push("When: " + state.date + " • " + state.timeSlot);

  if (!parts.length) {
    box.classList.add("d-none");
    box.textContent = "";
    return;
  }

  box.classList.remove("d-none");
  box.textContent = parts.join(" | ");
}

function renderServices() {
  var list = document.getElementById("serviceList");
  if (!list) return;

  list.innerHTML = "";

  for (var key in services) {
    if (!Object.prototype.hasOwnProperty.call(services, key)) continue;

    var svc = services[key];

    var item = document.createElement("label");
    item.className = "list-group-item list-group-item-action d-flex gap-3 align-items-start";

    item.innerHTML =
      '<input class="form-check-input mt-1" type="radio" name="serviceRadio" value="' + svc.key + '" aria-label="' + svc.label + '">' +
      '<div class="flex-grow-1">' +
        '<div class="d-flex justify-content-between align-items-center">' +
          '<div class="fw-semibold">' + svc.label + '</div>' +
          '<div class="badge text-bg-primary">' + money(svc.price) + '</div>' +
        '</div>' +
        '<div class="small text-muted">' + svc.desc + '</div>' +
      '</div>';

    list.appendChild(item);
  }

  list.addEventListener("change", function (e) {
    if (e.target && e.target.name === "serviceRadio") {
      state.serviceKey = e.target.value;

      
      state.staffChosen = [];
      state.date = "";
      state.timeSlot = "";

      var d = document.getElementById("appointmentDate");
      var t = document.getElementById("timeSlot");
      if (d) d.value = "";
      if (t) t.value = "";

      renderStaff();
      updateSummary();
      updateConfirm();
      updateButtons();
    }
  });
}
// Logic for creating the staff membes for specific repair
function renderStaff() {
  var grid = document.getElementById("staffGrid");
  if (!grid) return;

  grid.innerHTML = "";
  var svcKey = state.serviceKey;

  for (var i = 0; i < staff.length; i++) {
    var person = staff[i];
    var canDo = svcKey ? !!person.skills[svcKey] : true;
    if (!canDo) continue;

    var col = document.createElement("div");
    col.className = "col-12 col-md-4";

    col.innerHTML =
      '<div class="card h-100">' +
        '<div class="card-body">' +
          '<div class="d-flex align-items-center gap-2 mb-2">' +
            '<img src="images/' + person.name.toLowerCase() + '.jpeg" alt="' + person.name + '" class="rounded-circle me-2" style="width:40px; height:40px; object-fit:cover;">' + '<div>' +
              '<div class="fw-semibold">' + person.name + '</div>' +
              '<div class="text-muted small">' + person.role + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="form-check">' +
            '<input class="form-check-input" type="checkbox" value="' + person.name + '" id="staff-' + person.name + '">' +
            '<label class="form-check-label" for="staff-' + person.name + '">Request this staff member</label>' +
          '</div>' +
        '</div>' +
      '</div>';

    grid.appendChild(col);
  }

  var checkboxes = grid.querySelectorAll('input[type="checkbox"]');
  for (i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener("change", function () {
      var chosen = [];
      var checked = grid.querySelectorAll('input[type="checkbox"]:checked');
      for (var j = 0; j < checked.length; j++) chosen.push(checked[j].value);
      state.staffChosen = chosen;
      updateSummary();
      updateConfirm();
      updateButtons();
    });
  }
}

function updateConfirm() {
  var svc = services[state.serviceKey];

  document.getElementById("confirmService").textContent = svc
    ? (svc.label + " (" + money(svc.price) + ")")
    : "—";

  document.getElementById("confirmStaff").textContent =
    state.staffChosen.length ? state.staffChosen.join(", ") : "No preference";

  document.getElementById("confirmDateTime").textContent =
    (state.date && state.timeSlot) ? (state.date + " • " + state.timeSlot) : "—";

  var contactLine =
    (state.name && state.email && state.phone)
      ? (state.name + " • " + state.email + " • " + state.phone)
      : "—";

  document.getElementById("confirmContact").textContent = contactLine;
}

function setupDateMin() {
  var dateInput = document.getElementById("appointmentDate");
  if (!dateInput) return;
  dateInput.min = new Date().toISOString().split("T")[0];
}

function setupPhoneConstraints() {
  var phone = document.getElementById("contactPhone");
  if (!phone) return;

  
  phone.addEventListener("input", function () {
    var digitsOnly = phone.value.replace(/\D/g, "").slice(0, 10);
    phone.value = digitsOnly;
    state.phone = digitsOnly;
    updateButtons();
    updateConfirm();
  });
}

function isContactValid() {
  var form = document.getElementById("contactForm");
  if (!form) return false;
  return form.checkValidity();
}

function updateButtons() {
  var next1 = document.getElementById("nextFromServices");
  if (next1) next1.disabled = !state.serviceKey;

  var next3 = document.getElementById("nextFromDate");
  if (next3) next3.disabled = !(state.date && state.timeSlot);

  var next4 = document.getElementById("nextFromContact");
  if (next4) next4.disabled = !isContactValid();
}


// Logic for the navigation of buttons
function bindNavButtons() {
  document.getElementById("nextFromServices").addEventListener("click", function () { setStep(2); });
  document.getElementById("backToServices").addEventListener("click", function () { setStep(1); });

  document.getElementById("nextFromStaff").addEventListener("click", function () { setStep(3); });
  document.getElementById("backToStaff").addEventListener("click", function () { setStep(2); });

  document.getElementById("nextFromDate").addEventListener("click", function () { setStep(4); });
  document.getElementById("backToDate").addEventListener("click", function () { setStep(3); });

  document.getElementById("backToContact").addEventListener("click", function () { setStep(4); });

  document.getElementById("nextFromContact").addEventListener("click", function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    form.classList.add("was-validated");

    if (form.checkValidity()) {
      setStep(5);
    } else {
      updateButtons();
    }
  });

  document.getElementById("submitBooking").addEventListener("click", function () {
    document.getElementById("successAlert").classList.remove("d-none");
  });
}

// Logic for setting up the appointment with calendar and timing
function bindInputs() {
  var dateInput = document.getElementById("appointmentDate");
  var timeSlot = document.getElementById("timeSlot");

  dateInput.addEventListener("change", function () {
    state.date = dateInput.value;
    updateSummary();
    updateConfirm();
    updateButtons();
  });

  timeSlot.addEventListener("change", function () {
    state.timeSlot = timeSlot.value;
    updateSummary();
    updateConfirm();
    updateButtons();
  });

  // Logic for filling in the contact information
  var name = document.getElementById("contactName");
  var email = document.getElementById("contactEmail");
  var phone = document.getElementById("contactPhone");
  var form = document.getElementById("contactForm");

  function syncContact() {
    state.name = name.value.trim();
    state.email = email.value.trim();
    state.phone = phone.value.trim();
    updateSummary();
    updateConfirm();
    updateButtons();
  }

  name.addEventListener("input", syncContact);
  email.addEventListener("input", syncContact);
  phone.addEventListener("input", syncContact);

  name.addEventListener("blur", syncContact);
  email.addEventListener("blur", syncContact);
  phone.addEventListener("blur", syncContact);

  form.addEventListener("submit", function (e) { e.preventDefault(); });
}

document.addEventListener("DOMContentLoaded", function () {
  setupDateMin();
  setupPhoneConstraints();

  renderServices();
  renderStaff();

  bindNavButtons();
  bindInputs();

  setStep(1);
  updateButtons();
});