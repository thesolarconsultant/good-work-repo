import { lazy, Suspense } from "react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import AnnouncementBar from "./components/AnnouncementBar";
import { useAnnouncement } from "./lib/announcement";
import RouteManager from "./components/RouteManager";
import ScrollProgress from "./components/ScrollProgress";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import { organization } from "./lib/schema";

// Everything past the homepage is split out, so a first visit downloads the
// homepage and nothing else.
const Library = lazy(() => import("./pages/Library"));
const LibraryItem = lazy(() => import("./pages/LibraryItem"));
const Studio = lazy(() => import("./pages/Studio"));
const Systems = lazy(() => import("./pages/Systems"));
const SystemPage = lazy(() => import("./pages/SystemPage"));
const Services = lazy(() => import("./pages/Services"));
const BuiltByGoodwork = lazy(() => import("./pages/BuiltByGoodwork"));
const Crm = lazy(() => import("./pages/Crm"));
const Agency = lazy(() => import("./pages/Agency"));
const Managed = lazy(() => import("./pages/Managed"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Showcase = lazy(() => import("./pages/Showcase"));
const Learn = lazy(() => import("./pages/Learn"));
const LearnPost = lazy(() => import("./pages/LearnPost"));
const Docs = lazy(() => import("./pages/Docs"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Contact = lazy(() => import("./pages/Contact"));
const Legal = lazy(() => import("./pages/Legal"));
const Pitch = lazy(() => import("./pages/Pitch"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Static single-file previews (no server rewrites) build with VITE_HASH_ROUTER=1.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

// Routes that own the whole viewport: no nav, no footer.
const CHROMELESS = new Set(["/pitch"]);

const ORGANISATION = organization();

function Loading() {
  return (
    <div className="gw-route-loading" role="status" aria-label="Loading">
      <span className="gw-spinner" aria-hidden="true" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/library" element={<Library />} />
      <Route path="/library/:slug" element={<LibraryItem />} />
      <Route path="/studio" element={<Studio />} />
      <Route path="/systems" element={<Systems />} />
      <Route path="/systems/:slug" element={<SystemPage />} />
      <Route path="/services" element={<Services />} />
      <Route path="/built-by-goodwork" element={<BuiltByGoodwork />} />
      <Route path="/crm" element={<Crm />} />
      <Route path="/agency" element={<Agency />} />
      <Route path="/managed" element={<Managed />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/showcase" element={<Showcase />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/learn/category/:category" element={<Learn />} />
      <Route path="/learn/:slug" element={<LearnPost />} />
      <Route path="/docs" element={<Navigate to="/docs/getting-started" replace />} />
      <Route path="/docs/:slug" element={<Docs />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/legal/:slug" element={<Legal />} />
      <Route path="/pitch" element={<Pitch />} />

      {/* Old routes, kept alive so nothing indexed or bookmarked breaks. */}
      <Route path="/work" element={<Navigate to="/showcase" replace />} />
      <Route path="/case-studies" element={<Navigate to="/showcase" replace />} />
      <Route path="/content-console" element={<Navigate to="/systems/content-console" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function Chrome() {
  const { pathname } = useLocation();
  const [announce, dismiss] = useAnnouncement();

  if (CHROMELESS.has(pathname)) {
    return (
      <Suspense fallback={<Loading />}>
        <AppRoutes />
      </Suspense>
    );
  }

  return (
    <>
      <ScrollProgress />
      <a className="gw-skip" href="#gw-main">
        Skip to content
      </a>
      {announce && <AnnouncementBar onDismiss={dismiss} />}
      <Nav announce={announce} />

      <main id="gw-main" className={`gw-page${announce ? " gw-page--announce" : ""}`}>
        <div className="gw-route" key={pathname}>
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<Loading />}>
              <AppRoutes />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <RouteManager />
      <Chrome />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATION) }} />
    </Router>
  );
}
