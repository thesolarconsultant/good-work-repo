import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import Button from "../components/Button";
import Price from "../components/Price";
import Reveal from "../components/Reveal";
import BuyButton from "../components/BuyButton";
import LibraryCard from "../components/LibraryCard";
import LibraryPreview from "../components/LibraryPreview";
import { useLibraryCode } from "../lib/libraryCode";
import { useSession } from "../lib/auth";
import NotFound from "./NotFound";
import { ITEM_BY_SLUG, related, CATEGORY_NAME, STATUS_LABEL } from "../data/library";
import { OFFER, LICENCE_PRINCIPLES, UPDATE_PERIOD_MONTHS } from "../data/offers";
import { breadcrumbs, softwareProduct } from "../lib/schema";
import { track, EVENTS } from "../lib/analytics";
import { longDate } from "../lib/format";

const COMPLEXITY = {
  "drop-in": { label: "Drop-in", note: "Paste the snippet. No script, no build step." },
  easy: { label: "Easy", note: "Paste the snippet; a small script wires itself on load." },
  moderate: { label: "Moderate", note: "Follows a setup guide; needs configuration or a provider account." },
};

export default function LibraryItem() {
  const { slug } = useParams();
  const item = ITEM_BY_SLUG[slug];
  const [device, setDevice] = useState("desktop");
  const live = item && item.status === "available" && (item.kind === "component" || item.kind === "section");
  const { code } = useLibraryCode(live ? item.id : null, Boolean(live));
  // Whether this visitor's key covers the item is the server's answer, not a
  // flag in the browser; the download link goes back through /api/download,
  // which checks the key again.
  const session = useSession();
  const [copied, setCopied] = useState(false);
  const owns = Boolean(item) && session.status === "authenticated" && session.entitlements.some((e) => e.productId === item.tier || e.productId === "studio");
  const download = owns && item.tier === "library" ? session.downloads.find((d) => d.product === "library") || null : null;

  useEffect(() => {
    if (item) track(EVENTS.LIBRARY_DETAIL, { item: item.slug, from: "page" });
  }, [item]);

  if (!item) return <NotFound />;

  const tierOffer = OFFER[item.tier];
  const crumbs = [
    { label: "Home", to: "/" },
    { label: "Library", to: "/library" },
    { label: CATEGORY_NAME[item.category], to: `/library?category=${item.category}` },
    { label: item.name },
  ];
  const excerpt = code ? code.split("\n").slice(0, 14).join("\n") : "";
  const truncated = code ? code.split("\n").length > 14 : false;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      track(EVENTS.LIBRARY_COPY, { item: item.slug });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Seo title={`${item.name} — Goodwork Library`} description={item.description} schema={[breadcrumbs(crumbs), softwareProduct(item, `/library/${item.slug}`)]} />

      <section className="gw-pagehead">
        <div className="gw-container">
          <nav aria-label="Breadcrumb">
            <ol className="gw-crumbs">
              {crumbs.map((c, i) => (
                <li key={c.label}>{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
          <div className="gw-pagehead__row gw-mt-3">
            <div style={{ maxWidth: 760 }}>
              <div className="gw-chips">
                <span className={`gw-badge gw-badge--${item.tier}`}>Included in {item.tier === "studio" ? "Studio" : "Library"}</span>
                <span className={`gw-badge${item.status === "coming-soon" ? " gw-badge--warn" : ""}`}>{STATUS_LABEL[item.status]}</span>
                <span className="gw-badge gw-badge--muted">{item.kind}</span>
              </div>
              <h1 className="gw-h1 gw-mt-3" style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)" }}>
                {item.name}
              </h1>
              <p className="gw-lead gw-max gw-mt-3">{item.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="gw-section--tight">
        <div className="gw-container">
          <div className="gw-lib-detail">
            <div className="gw-lib-detail__main">
              {/* Preview */}
              <div className="gw-device" id="preview">
                <div className="gw-device__bar">
                  <p className="gw-eyebrow">Preview · sandboxed</p>
                  {(live || item.href) && (
                    <div className="gw-seg" role="group" aria-label="Preview size">
                      <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
                        Desktop
                      </button>
                      <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
                        Mobile
                      </button>
                    </div>
                  )}
                </div>
                <div className={`gw-device__frame${device === "mobile" ? " gw-device__frame--mobile" : ""}`}>
                  {live ? (
                    <LibraryPreview id={item.id} name={item.name} eager scale={device === "mobile" ? 0.9 : 1.15} />
                  ) : item.href ? (
                    <iframe title={`${item.name} preview`} src={item.href} loading="lazy" sandbox="allow-scripts allow-same-origin" />
                  ) : item.image ? (
                    <img src={item.image} alt={`${item.name} screenshot`} />
                  ) : (
                    <div className="gw-lib-card__ph">{item.status === "coming-soon" ? "Planned · no preview yet" : "Preview on the system page"}</div>
                  )}
                </div>
                {item.href && (
                  <p className="gw-small gw-muted">
                    <a className="gw-link" href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => track(EVENTS.LIBRARY_PREVIEW, { item: item.slug })}>
                      Open the live preview in a new tab
                    </a>
                  </p>
                )}
                {item.to && (
                  <p className="gw-small gw-muted">
                    <Link className="gw-link" to={item.to}>
                      Read the full {item.name} page
                    </Link>
                  </p>
                )}
              </div>

              {/* What's included */}
              <Reveal variant="rise">
                <h2 className="gw-h3">What's included</h2>
                <ul className="gw-list gw-mt-3">
                  {(item.detail || [
                    live ? "The complete snippet: markup, styles and any script, self-contained." : "The system source, setup guide and implementation checklist.",
                    "Reads your brand tokens (accent, surfaces, type) with safe fallbacks.",
                    "Responsive by default; tested at phone, tablet and desktop widths.",
                    "Installation and customisation guidance in the documentation.",
                    `Updates for ${UPDATE_PERIOD_MONTHS} months from purchase.`,
                  ]).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </Reveal>

              {/* Source: an excerpt for visitors; the whole snippet, with copy, once the server confirms access. */}
              {live && code && (
                <Reveal variant="rise">
                  <div className="gw-code">
                    <div className="gw-code__bar">
                      <span>
                        {owns ? "Full source" : "Source excerpt"} · {item.bytes.toLocaleString("en-GB")} bytes
                      </span>
                      {owns ? (
                        <button type="button" className="gw-code__copy" onClick={copy}>
                          {copied ? "Copied" : "Copy code"}
                        </button>
                      ) : (
                        <span>Full source with {tierOffer.short} access</span>
                      )}
                    </div>
                    <pre tabIndex={0} className={owns ? "gw-code__full" : undefined}>
                      <code>
                        {owns ? code : excerpt}
                        {!owns && truncated ? "\n…" : ""}
                      </code>
                    </pre>
                  </div>
                </Reveal>
              )}

              {/* Related */}
              <Reveal variant="rise">
                <h2 className="gw-h3">Related items</h2>
                <div className="gw-lib-grid gw-mt-3">
                  {related(item, 3).map((r) => (
                    <LibraryCard key={r.id} item={r} />
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Spec + purchase */}
            <aside className="gw-aside" aria-label="Product details">
              {owns ? (
                <div className="gw-card gw-card--accent">
                  <p className="gw-eyebrow gw-eyebrow--accent">Included in your access</p>
                  <h2 className="gw-h4 gw-mt-1">{tierOffer.name}</h2>
                  {download ? (
                    <>
                      <p className="gw-small gw-body gw-mt-2">
                        This item ships in the {download.name} bundle: {download.items} components as paste-ready files, plus the offline gallery.
                      </p>
                      <div className="gw-mt-3" style={{ display: "grid", gap: "0.6rem" }}>
                        <Button href={download.href} download={download.filename} block onClick={() => track(EVENTS.DOWNLOAD, { product: download.product, from: item.slug })}>
                          Download the bundle <span aria-hidden="true">↓</span>
                        </Button>
                        <Button to="/dashboard" variant="secondary" block>
                          Your dashboard
                        </Button>
                      </div>
                      <p className="gw-small gw-muted gw-mt-2">
                        <span className="gw-mono">v{download.version}</span> · checked on the server for every download.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="gw-small gw-body gw-mt-2">The system source is released into your dashboard as it ships; you'll be emailed when it does.</p>
                      <div className="gw-mt-3">
                        <Button to="/dashboard" variant="secondary" block>
                          Your dashboard
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="gw-card">
                  <p className="gw-eyebrow">{item.status === "coming-soon" ? "Planned item" : "Get this item"}</p>
                  <h2 className="gw-h4 gw-mt-1">Included in {tierOffer.name}</h2>
                  <div className="gw-mt-2">
                    <Price amount={tierOffer.price} billing="one-time" />
                  </div>
                  <p className="gw-small gw-muted gw-mt-2">{tierOffer.line}</p>
                  <div className="gw-mt-3" style={{ display: "grid", gap: "0.6rem" }}>
                    <BuyButton productId={tierOffer.id} label={tierOffer.primaryCta.label} size="md" block />
                    <Button to={`/login?next=/library/${item.slug}`} variant="secondary" block>
                      Sign in to download
                    </Button>
                  </div>
                  <p className="gw-small gw-muted gw-mt-2">
                    Downloads are authorised server-side against your purchase. Nothing here is a public download link.
                  </p>
                </div>
              )}

              <div className="gw-card gw-card--flat">
                <dl className="gw-kv">
                  <dt>Category</dt>
                  <dd>
                    <Link className="gw-link" to={`/library?category=${item.category}`}>
                      {CATEGORY_NAME[item.category]}
                    </Link>
                  </dd>
                  <dt>Stack</dt>
                  <dd>{item.stack.join(", ")}</dd>
                  <dt>Dependencies</dt>
                  <dd>{item.dependencies.length ? item.dependencies.join(", ") : "None"}</dd>
                  <dt>Install</dt>
                  <dd>
                    {COMPLEXITY[item.complexity].label}. {COMPLEXITY[item.complexity].note}
                  </dd>
                  <dt>Version</dt>
                  <dd className="gw-mono">{item.version}</dd>
                  <dt>Updated</dt>
                  <dd>{item.version === "planned" ? "Not yet released" : longDate(item.updated)}</dd>
                  <dt>Docs</dt>
                  <dd>
                    <Link className="gw-link" to={item.kind === "system" ? item.to || "/docs/getting-started" : "/docs/installing-components"}>
                      {item.kind === "system" ? "System page" : "Installing components"}
                    </Link>
                  </dd>
                </dl>
              </div>

              <div className="gw-card gw-card--flat">
                <h3 className="gw-h4">Licence summary</h3>
                <ul className="gw-list gw-list--tight gw-mt-2">
                  {LICENCE_PRINCIPLES.slice(0, 4).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="gw-small gw-mt-2">
                  <Link className="gw-link" to="/legal/licence">
                    Full commercial licence
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
