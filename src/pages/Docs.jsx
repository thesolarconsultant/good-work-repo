import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import Button from "../components/Button";
import NotFound from "./NotFound";
import { DOCS, DOC } from "../data/docs";
import { breadcrumbs } from "../lib/schema";
import { OFFER } from "../data/offers";

export default function Docs() {
  const { slug } = useParams();
  const doc = DOC[slug];
  if (!doc) return <NotFound />;
  const crumbs = [{ label: "Home", to: "/" }, { label: "Docs", to: "/docs/getting-started" }, { label: doc.title }];

  return (
    <>
      <Seo title={`${doc.title} — Goodwork documentation`} description={doc.summary} schema={breadcrumbs(crumbs)} />

      <section className="gw-pagehead">
        <div className="gw-container">
          <nav aria-label="Breadcrumb">
            <ol className="gw-crumbs">
              {crumbs.map((c, i) => (
                <li key={c.label}>{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
          <p className="gw-eyebrow gw-eyebrow--accent gw-mt-3">Documentation</p>
          <h1 className="gw-h1 gw-mt-2" style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)" }}>
            {doc.title}
          </h1>
          <p className="gw-lead gw-max gw-mt-3">{doc.summary}</p>
        </div>
      </section>

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-lib-detail" style={{ "--gw-detail": "minmax(220px,0.5fr) minmax(0,1.5fr)" }}>
            <aside className="gw-aside" aria-label="Documentation pages">
              <nav className="gw-toc">
                {DOCS.map((d) => (
                  <Link key={d.slug} to={`/docs/${d.slug}`} aria-current={d.slug === doc.slug ? "page" : undefined}>
                    {d.title}
                  </Link>
                ))}
              </nav>
              <div className="gw-card gw-card--flat">
                <p className="gw-eyebrow">Customer downloads</p>
                <p className="gw-small gw-body gw-mt-1">Source bundles are delivered through the customer dashboard. Sign in with the access key from your purchase email; every download is authorised on the server when you ask for it.</p>
                <div className="gw-mt-2">
                  <Button to="/login" variant="secondary" size="sm">
                    Sign in
                  </Button>
                </div>
              </div>
            </aside>
            <div className="gw-prose">
              {doc.sections.map((s) => (
                <section key={s.h}>
                  <h2>{s.h}</h2>
                  {s.p?.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {s.ol && (
                    <ol>
                      {s.ol.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ol>
                  )}
                  {s.code && (
                    <pre tabIndex={0}>
                      <code>{s.code}</code>
                    </pre>
                  )}
                </section>
              ))}
              <div className="gw-card gw-card--flat gw-mt-5">
                <p className="gw-eyebrow">Related</p>
                <div className="gw-chips gw-mt-2">
                  {doc.related.map((r) => (
                    <Link key={r.to} to={r.to} className="gw-chip">
                      {r.label}
                    </Link>
                  ))}
                  <Link to="/library" className="gw-chip">
                    Goodwork Library, £{OFFER.library.price}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
