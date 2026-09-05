import { lazy, Suspense } from "react";
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import ScrollProgress from "./components/ScrollProgress";
import RouteManager from "./components/RouteManager";
import Home from "./pages/Home";
import { SITE_URL } from "./lib/site";

// Everything past the landing page is split out, so a first visit downloads
// the homepage and nothing else.
const Work = lazy(() => import("./pages/Work"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const ContentConsole = lazy(() => import("./pages/ContentConsole"));
const Services = lazy(() => import("./pages/Services"));
const Contact = lazy(() => import("./pages/Contact"));
const Pitch = lazy(() => import("./pages/Pitch"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Static single-file previews (no server rewrites) build with VITE_HASH_ROUTER=1.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

// Routes that own the whole viewport themselves — no site nav, no reading
// progress bar, no page padding. The pitch deck is full-screen by design.
const CHROMELESS = new Set(["/pitch"]);

const ORGANISATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organisation`,
  name: "GOOD WORK.",
  url: SITE_URL,
  email: "hello@goodwork.agency",
  description:
    "A UK creative agency building brand, websites and business systems — and keeping them running after launch.",
  areaServed: "GB",
  knowsAbout: ["Brand identity", "Web design", "Business systems", "Marketing automation"],
};

/** Keyed on pathname so each route animates in as it mounts. */
function RouteFrame({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="gw-route" key={pathname}>
      {children}
    </div>
  );
}

const AppRoutes = (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/work" element={<Work />} />
    <Route path="/case-studies" element={<CaseStudies />} />
    <Route path="/content-console" element={<ContentConsole />} />
    <Route path="/services" element={<Services />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/pitch" element={<Pitch />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

function Chrome() {
  const { pathname } = useLocation();

  if (CHROMELESS.has(pathname)) {
    return (
      <Suspense fallback={<div className="gw-route-loading" aria-hidden="true" />}>
        {AppRoutes}
      </Suspense>
    );
  }

  return (
    <>
      <ScrollProgress />
      <a className="gw-skip" href="#gw-main">
        Skip to content
      </a>
      <Nav />

      <main id="gw-main" className="gw-page">
        <RouteFrame>
          {/* Reserves a viewport of height while a route chunk loads, so the
              footer never flashes up under a half-built page. */}
          <Suspense fallback={<div className="gw-route-loading" aria-hidden="true" />}>
            {AppRoutes}
          </Suspense>
        </RouteFrame>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <RouteManager />
      <Chrome />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATION) }}
      />
    </Router>
  );
}
