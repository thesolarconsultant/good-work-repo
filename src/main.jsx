import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted Poppins — bundled by Vite so it always loads, even with no
// network access to Google Fonts.
//
// Latin subsets only. The full imports also pulled in Devanagari, which is
// ~195kB of font this site has no glyphs for.
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";

import "./styles.css";
import "./styles/motion.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
