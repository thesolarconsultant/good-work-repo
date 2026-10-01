import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import NotFound from "./NotFound";
import { LEGAL, LEGAL_BY_SLUG } from "../data/legal";
import { breadcrumbs } from "../lib/schema";
import { longDate } from "../lib/format";

export default function Legal() {
  const { slug } = useParams();
  const page = LEGAL_BY_SLUG[slug];
  if (!page) return <NotFound />;
  const crumbs = [{ label: "Home", to: "/" }, { label: "Legal" }, { label: page.title }];

  return (
    <>
      <Seo title={page.title} description={page.summary} schema={breadcrumbs(crumbs)} noindex={page.review} />

      <section className="gw-pagehead">
        <div className="gw-container">
          <nav aria-label="Breadcrumb">
            <ol className="gw-crumbs">
              {crumbs.map((c, i) => (
                <li key={c.label}>{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
          <p className="gw-eyebrow gw-eyebrow--accent gw-mt-3">Legal · updated {longDate(page.updated)}</p>
          <h1 className="gw-h1 gw-mt-2" style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)" }}>
            {page.title}
          </h1>
          <p className="gw-lead gw-max gw-mt-3">{page.summary}</p>
          {page.review && (
            <div className="gw-notice gw-mt-4" style={{ maxWidth: 720 }}>
              <strong>Draft for solicitor review</strong>
              <span>{page.reviewNote}</span>
            </div>
          )}
        </div>
      </section>

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-lib-detail" style={{ "--gw-detail": "minmax(220px,0.5fr) minmax(0,1.5fr)" }}>
            <aside className="gw-aside" aria-label="Legal pages">
              <nav className="gw-toc">
                {LEGAL.map((l) => (
                  <Link key={l.slug} to={`/legal/${l.slug}`} aria-current={l.slug === page.slug ? "page" : undefined}>
                    {l.title}
                  </Link>
                ))}
              </nav>
            </aside>
            <div className="gw-prose">
              {page.sections.map((s) => (
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
                </section>
              ))}
              <p className="gw-small gw-muted gw-mt-5">
                Questions about any of this: <a className="gw-link" href="mailto:hello@goodwork.agency">hello@goodwork.agency</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
