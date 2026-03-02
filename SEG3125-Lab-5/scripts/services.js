// Services shown on the home menu 
//service + price
var services = {
  brakeTune: {
    key: "brakeTune",
    label: "Brake Tune",
    price: 35,
    desc: "Brake adjustment, pad check, quick safety test."
  },
  flatFix: {
    key: "flatFix",
    label: "Flat Fix",
    price: 25,
    desc: "Tube swap / patch, tire inspection, inflation."
  },
  fullMaintenance: {
    key: "fullMaintenance",
    label: "Full Maintenance",
    price: 90,
    desc: "Drivetrain clean, brake + derailleur tune, bolt check."
  }
};

// Staff + which services they can do (filtering)
var staff = [
  {
    name: "Sherman",
    role: "Senior Mechanic",
    skills: { brakeTune: true, flatFix: false, fullMaintenance: true }
  },
  {
    name: "Shehzad",
    role: "Service Tech",
    skills: { brakeTune: false, flatFix: true, fullMaintenance: true }
  },
  {
    name: "Pirana",
    role: "Mechanic",
    skills: { brakeTune: true, flatFix: true, fullMaintenance: false }
  }
];