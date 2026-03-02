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

var HOLIDAYS = ["2026-01-01", "2026-12-25"]; // can ad dmore but for simplicitys sake only 2

// Staff off dates, can ad dmore but for simplicitys sake only a few
var STAFF_OFF_DATES = {
  Shehzad: ["2026-03-02","2026-03-05","2026-03-11","2026-03-17","2026-03-21","2026-03-26"],
  Pirana:  ["2026-06-03","2026-06-07","2026-06-12","2026-06-17","2026-06-21"],
  Sherman: ["2026-09-01","2026-09-04","2026-09-09","2026-09-13","2026-09-17","2026-09-22"]
};

function isWeekend(iso) {
  var p = iso.split("-");
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getDay();
  return d === 0 || d === 6;
}

function showDateError(msg) {
  var el = document.getElementById("dateConstraintMsg");
  if (!el) {
    el = document.createElement("div");
    el.id = "dateConstraintMsg";
    el.className = "text-danger small mt-1";
    document.getElementById("appointmentDate").parentNode.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = "block";
}

function clearDateError() {
  var el = document.getElementById("dateConstraintMsg");
  if (el) el.style.display = "none";
}

function validateDateOrClear() {
  var dateInput = document.getElementById("appointmentDate");
  if (!dateInput) return;

  var iso = dateInput.value;
  if (!iso) return;

  //weekends
  if (isWeekend(iso)) {
    dateInput.value = "";
    state.date = "";
    showDateError("Weekends are not available. Pick a weekday.");
    updateButtons(); updateSummary(); updateConfirm();
    return;
  }

  //holidays
  if (HOLIDAYS.indexOf(iso) !== -1) {
    dateInput.value = "";
    state.date = "";
    showDateError("That date is a holiday. Pick another date.");
    updateButtons(); updateSummary(); updateConfirm();
    return;
  }

  //staff off dates
  if (state.staffChosen && state.staffChosen.length) {
    for (var i = 0; i < state.staffChosen.length; i++) {
      var name = state.staffChosen[i];
      var off = STAFF_OFF_DATES[name] || [];
      if (off.indexOf(iso) !== -1) {
        dateInput.value = "";
        state.date = "";
        showDateError(name + " is off that day. Pick another date or change staff.");
        updateButtons(); updateSummary(); updateConfirm();
        return;
      }
    }
  }

  //valid
  clearDateError();
  state.date = iso;
  updateButtons(); updateSummary(); updateConfirm();
}

function money(n) {
    return "$" + Number(n).toFixed(2);
}

function setStep(nextStep) {
  state.step = nextStep;
  updateBreadcrumb();
  updateConfirm();
  updateSummary();
  updateButtons();
}

function updateBreadcrumb() {
    var crumbs = document.querySelectorAll("#progressBreadcrumb li");
    for (var i = 0; i < crumbs.length; i++) {
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
            '<img src="images/' + person.name.toLowerCase() + '.jpeg" alt="' + person.name + '" class="rounded-circle me-2" style="width:40px; height:40px; object-fit:cover;">' +
            '<div>' +
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
			validateDateOrClear();
            updateSummary();
            updateConfirm();
            updateButtons();
        });
    }
}

function updateConfirm() {
    var svc = services[state.serviceKey];
    document.getElementById("confirmService").textContent = svc ? (svc.label + " (" + money(svc.price) + ")") : "—";
    document.getElementById("confirmStaff").textContent = state.staffChosen.length ? state.staffChosen.join(", ") : "No preference";
    document.getElementById("confirmDateTime").textContent = (state.date && state.timeSlot) ? (state.date + " • " + state.timeSlot) : "—";
    var contactLine = (state.name && state.email && state.phone) ? (state.name + " • " + state.email + " • " + state.phone) : "—";
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

function scrollToStep(n) {
  var el = document.getElementById("step-" + n);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindNavButtons() {
  var nextFromServices = document.getElementById("nextFromServices");
  if (nextFromServices) nextFromServices.addEventListener("click", function () {
    setStep(2);
    scrollToStep(2);
  });

  var backToServices = document.getElementById("backToServices");
  if (backToServices) backToServices.addEventListener("click", function () {
    setStep(1);
    scrollToStep(1);
  });

  var nextFromStaff = document.getElementById("nextFromStaff");
  if (nextFromStaff) nextFromStaff.addEventListener("click", function () {
    setStep(3);
    scrollToStep(3);
  });

  var backToStaff = document.getElementById("backToStaff");
  if (backToStaff) backToStaff.addEventListener("click", function () {
    setStep(2);
    scrollToStep(2);
  });

  var nextFromDate = document.getElementById("nextFromDate");
  if (nextFromDate) nextFromDate.addEventListener("click", function () {
    setStep(4);
    scrollToStep(4);
  });

  var backToDate = document.getElementById("backToDate");
  if (backToDate) backToDate.addEventListener("click", function () {
    setStep(3);
    scrollToStep(3);
  });

  var nextFromContact = document.getElementById("nextFromContact");
  if (nextFromContact) nextFromContact.addEventListener("click", function () {
    var form = document.getElementById("contactForm");
    if (form) form.classList.add("was-validated");

    if (form && form.checkValidity()) {
      setStep(5);
      scrollToStep(5);
    } else {
      updateButtons();
    }
  });

  var backToContact = document.getElementById("backToContact");
  if (backToContact) backToContact.addEventListener("click", function () {
    setStep(4);
    scrollToStep(4);
  });

  var submitBooking = document.getElementById("submitBooking");
  if (submitBooking) submitBooking.addEventListener("click", function () {
    var success = document.getElementById("successAlert");
    if (success) success.classList.remove("d-none");
  });
}

function bindInputs() {
    var dateInput = document.getElementById("appointmentDate");
    var timeSlot = document.getElementById("timeSlot");
	if (dateInput) {
	  dateInput.addEventListener("change", function () {
        validateDateOrClear();
      });
    }
    //dateInput.addEventListener("change", function () { validateDateOrClear();});
    timeSlot.addEventListener("change", function () { state.timeSlot = timeSlot.value; updateSummary(); updateConfirm(); updateButtons(); });

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

function bindNavbarLinks() {
    var links = document.querySelectorAll("[data-nav-step]");
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener("click", function (e) {
            e.preventDefault();
            var step = Number(this.getAttribute("data-nav-step"));
            var el = document.getElementById("step-" + step);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }
}

function bindFieldReactivity() {
    var fields = document.querySelectorAll("input.form-control, select.form-select, textarea.form-control");
    for (var i = 0; i < fields.length; i++) {
        fields[i].addEventListener("focus", function () { this.classList.add("field-active"); });
        fields[i].addEventListener("blur", function () { this.classList.remove("field-active"); });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    setupDateMin();
    setupPhoneConstraints();
    renderServices();
    renderStaff();
    bindNavButtons();
    bindInputs();
    bindNavbarLinks();
    bindFieldReactivity();
    setStep(1);
    updateButtons();
});

document.addEventListener("DOMContentLoaded", function() {
    const cardNumber = document.getElementById('cardNumber');
    const expiryDate = document.getElementById('expiryDate');
    const cvv = document.getElementById('cvv');
    const nextFromPayment = document.getElementById('nextFromPayment');
    var sb = document.getElementById("submitBooking");
	if (sb) sb.disabled = true;

    function validatePayment() {
        const cardValid = /^\d{16}$/.test(cardNumber.value);
        const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate.value);
        const cvvValid = /^\d{3}$/.test(cvv.value);
        nextFromPayment.disabled = !(cardValid && expiryValid && cvvValid);
    }

    cardNumber.addEventListener("input", validatePayment);
    expiryDate.addEventListener("input", validatePayment);
    cvv.addEventListener("input", validatePayment);
    validatePayment();

    nextFromPayment.addEventListener("click", function() {
        setStep(6);
        document.getElementById("submitBooking").disabled = false;
    });
});
