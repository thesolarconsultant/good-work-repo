// Device photographs. A laptop and a phone were rendered in Higgsfield with a
// green screen (brand/devices/); scripts/build-devices.mjs puts each project's
// real screenshot on the laptop's screen and cuts the phone out with a clear
// screen for live markup (components/PhoneFrame.jsx). Nothing on a screen is
// generated.

/** Showcase projects photographed on the laptop, and the screenshot each shows. */
export const LAPTOP_SHOTS = {
  tsc: "/case-studies/tsc-home.jpg",
  "8energy": "/case-studies/8energy-home.jpg",
  keystone: "/case-studies/keystone-home.jpg",
};

/** The laptop photograph for a showcase project, or null when it has none. */
export const laptopPhoto = (id) => (LAPTOP_SHOTS[id] ? `/devices/${id}-laptop.jpg` : null);
