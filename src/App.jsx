import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import Work from "./pages/Work";
import CaseStudies from "./pages/CaseStudies";
import ContentConsole from "./pages/ContentConsole";
import Services from "./pages/Services";
import Contact from "./pages/Contact";

// Static single-file previews (no server rewrites) build with VITE_HASH_ROUTER=1.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work" element={<Work />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/content-console" element={<ContentConsole />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}
