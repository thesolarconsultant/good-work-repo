import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted Poppins — bundled by Vite so it always loads,
// even with no network access to Google Fonts.
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";

import "./styles.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
