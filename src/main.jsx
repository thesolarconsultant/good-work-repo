import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted Poppins (OFL), bundled by Vite so it always loads. Latin subsets
// only. Weights 400/500/600/700/800 — the whole site uses these five.
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";

import "./styles.css";
import "./styles/motion.css";
import "./styles/flow.css";
import "./styles/deck.css";
import "./styles/phoneStory.css";
import "./styles/mock.css";
import "./styles/sections.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
