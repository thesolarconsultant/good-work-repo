import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import Button from "../components/Button";
import Price from "../components/Price";
import BuyButton from "../components/BuyButton";
import LibraryLayout from "../components/LibraryLayout";
import LibraryToc from "../components/LibraryToc";
import LibraryCard from "../components/LibraryCard";
import LibraryPreview, { PagePreview } from "../components/LibraryPreview";
import { SystemArt, PlannedArt } from "../components/LibraryArt";
import NotFound from "./NotFound";
import { useLibraryCode, tokensIn, standalonePreview } from "../lib/libraryCode";
import { useSession } from "../lib/auth";
import { ITEM_BY_SLUG, related, CATEGORY_NAME, neighbours, groupOf, isLive, stackLabel } from "../data/library";
import { OFFER, LICENCE_PRINCIPLES, UPDATE_PERIOD_MONTHS } from "../data/offers";
import { breadcrumbs, softwareProduct } from "../lib/schema";
import { track, EVENTS } from "../lib/analytics";
import { gbp, longDate } from "../lib/format";

const COMPLEXITY = {
  "drop-in": "Drop-in: paste the snippet. No script, no build step.",
  easy: "Easy: paste the snippet; a small script wires itself on load.",
  moderate: "Moderate: follows a setup guide and needs configuration or a provider account.",
};
const EXCERPT_LINES = 12;
const isColour = (v) => /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(v.trim());

function Icon({ name }) {
  const paths = {
    replay: <path d="M4 10a6 6 0 1 0 2-4.5M4 3v3.5h3.5" />,
    open: <path d="M8 4H4v12h12v-4M11 3h6v6M17 3l-8 8" />,
  };
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/**
 * One Library item, laid out like component-library documentation: title and
 * summary, a Preview/Code switch, numbered installation steps, the brand
 * tokens the snippet reads, the details, the licence, related items and a
 * previous/next pager. On wide screens a right-hand rail carries "On this
 * page" and the access card.
 */
export default function LibraryItem() {
  const { slug } = useParams();
  const item = ITEM_BY_SLUG[slug];
  const live = Boolean(item) && isLive(item);
  const { code } = useLibraryCode(live ? item.id : null, live);
  const tokens = useMemo(() => tokensIn(code), [code]);

  // Whether this visitor's key covers the item is the server's answer, not a
  // flag in the browser; the download link goes back through /api/download,
  // which checks the key again.
  const session = useSession();
  const owns = Boolean(item) && session.status === "authenticated" && session.entitlements.some((e) => e.productId === item.tier || e.productId === "studio");
  const download = owns && item.tier === "library" ? session.downloads.find((d) => d.product === "library") || null : null;

  const [tab, setTab] = useState("preview");
  const [device, setDevice] = useState("desktop");
  const [reload, setReload] = useState(0);
  const [copied, setCopied] = useState(false);
  const tabs = useRef(null);

  useEffect(() => {
    if (item) track(EVENTS.LIBRARY_DETAIL, { item: item.slug, from: "page" });
  }, [item]);

  if (!item) return <NotFound />;

  const offer = OFFER[item.tier];
  const group = groupOf(item);
  const { prev, next } = neighbours(item);
  const file = `snippets/${item.category}/${item.id}.html`;
  const hasCode = live;
  const planned = item.status === "coming-soon";

  const crumbs = [
    { label: "Home", to: "/" },
    { label: "Library", to: "/library" },
    { label: group ? group.title : CATEGORY_NAME[item.category], to: group ? group.to : `/library?category=${item.category}` },
    { label: item.name },
  ];

  const sections = [
    { id: "preview", label: hasCode ? "Preview and code" : "Preview" },
    { id: "installation", label: item.kind === "system" ? "Getting it" : "Installation" },
    ...(tokens.length ? [{ id: "tokens", label: "Brand tokens" }] : []),
    { id: "details", label: "Details" },
    { id: "licence", label: "Licence" },
    { id: "related", label: "Related" },
  ];

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      track(EVENTS.LIBRARY_COPY, { item: item.slug });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  // A new tab holding the snippet in a sandboxed frame, so it never runs with
  // this site's origin.
  function openStandalone() {
    if (!code) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.opener = null;
    w.document.title = item.name;
    w.document.body.style.margin = "0";
    const frame = w.document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("title", item.name);
    frame.srcdoc = standalonePreview(code, item.name);
    frame.style.cssText = "border:0;width:100vw;height:100vh;display:block";
    w.document.body.appendChild(frame);
    track(EVENTS.LIBRARY_PREVIEW, { item: item.slug, from: "open" });
  }

  function onTabKey(e) {
    if (!hasCode || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    const nextTab = tab === "preview" ? "code" : "preview";
    setTab(nextTab);
    tabs.current?.querySelector(`#tab-${nextTab}`)?.focus();
  }

  const rail = (
    <>
      <LibraryToc key={item.slug} sections={sections} />
      <div className={`gw-rail-card${owns ? " gw-rail-card--owned" : ""}`}>
        {owns ? (
          <>
            <p className="gw-eyebrow gw-eyebrow--accent">Included in your access</p>
            <p className="gw-rail-card__name">{offer.name}</p>
            {download ? (
              <Button href={download.href} download={download.filename} size="sm" block onClick={() => track(EVENTS.DOWNLOAD, { product: "library", from: item.slug })}>
                Download the bundle <span aria-hidden="true">↓</span>
              </Button>
            ) : (
              <Button to="/dashboard" size="sm" variant="secondary" block>
                Your dashboard
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="gw-eyebrow">{planned ? "Planned for" : "Included in"}</p>
            <p className="gw-rail-card__name">{offer.name}</p>
            <Price amount={offer.price} billing="one-time" />
            <Button href="#installation" size="sm" block>
              Get access
            </Button>
            <Button to={`/login?next=/library/${item.slug}`} variant="ghost" size="sm" block>
              Sign in
            </Button>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <Seo title={`${item.name} — Goodwork Library`} description={item.description} schema={[breadcrumbs(crumbs), softwareProduct(item, `/library/${item.slug}`)]} />

      <LibraryLayout currentSlug={item.slug} rail={rail}>
        <header className="gw-docs-head">
          <nav aria-label="Breadcrumb">
            <ol className="gw-crumbs">
              {crumbs.map((c, i) => (
                <li key={c.label}>{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
          <h1 className="gw-docs-title">{item.name}</h1>
          <p className="gw-docs-lead">{item.description}</p>
          <ul className="gw-docs-head__meta">
            <li>
              <Link to={group ? group.to : `/library?category=${item.category}`}>{CATEGORY_NAME[item.category]}</Link>
            </li>
            <li>{item.kind === "section" ? "Section" : item.kind === "component" ? "Component" : item.kind === "template" ? "Template" : "System"}</li>
            <li>{stackLabel(item)}</li>
            {item.version !== "planned" && <li className="gw-mono">v{item.version}</li>}
            {planned && (
              <li>
                <span className="gw-badge gw-badge--warn">Coming soon</span>
              </li>
            )}
            {item.tier === "studio" && (
              <li>
                <span className="gw-badge gw-badge--studio">Studio</span>
              </li>
            )}
          </ul>
        </header>

        {/* Preview and code */}
        <section id="preview" className="gw-docs-block" aria-label={hasCode ? "Preview and code" : "Preview"}>
          <div className="gw-tabs" ref={tabs}>
            <div className="gw-tabs__list" role="tablist" aria-label="Preview or code">
              <button type="button" role="tab" id="tab-preview" aria-selected={tab === "preview"} aria-controls="panel-preview" tabIndex={tab === "preview" ? 0 : -1} className="gw-tab" onClick={() => setTab("preview")} onKeyDown={onTabKey}>
                Preview
              </button>
              {hasCode && (
                <button type="button" role="tab" id="tab-code" aria-selected={tab === "code"} aria-controls="panel-code" tabIndex={tab === "code" ? 0 : -1} className="gw-tab" onClick={() => setTab("code")} onKeyDown={onTabKey}>
                  Code
                </button>
              )}
            </div>
            <div className="gw-tabs__tools">
              {item.href && (
                <div className="gw-seg" role="group" aria-label="Preview width">
                  <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
                    Desktop
                  </button>
                  <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
                    Mobile
                  </button>
                </div>
              )}
              {(live || item.href) && (
                <button type="button" className="gw-tool" onClick={() => setReload((r) => r + 1)} aria-label="Replay the preview" title="Replay">
                  <Icon name="replay" />
                </button>
              )}
              {live && code && (
                <button type="button" className="gw-tool" onClick={openStandalone} aria-label="Open the preview in a new tab" title="Open in a new tab">
                  <Icon name="open" />
                </button>
              )}
              {item.href && (
                <a className="gw-tool" href={item.href} target="_blank" rel="noopener noreferrer" aria-label="Open the template in a new tab" title="Open in a new tab" onClick={() => track(EVENTS.LIBRARY_PREVIEW, { item: item.slug, from: "open" })}>
                  <Icon name="open" />
                </a>
              )}
            </div>
          </div>

          <div role="tabpanel" id="panel-preview" aria-labelledby="tab-preview" hidden={tab !== "preview"}>
            <div className={`gw-stagebox${item.href && device === "mobile" ? " gw-stagebox--mobile" : ""}${item.href ? " gw-stagebox--page" : ""}`}>
              {live ? (
                <LibraryPreview id={item.id} name={item.name} eager reloadKey={reload} />
              ) : item.href ? (
                <PagePreview src={item.href} name={item.name} device={device} eager reloadKey={reload} />
              ) : item.image ? (
                <img className="gw-stagebox__img" src={item.image} alt={`${item.name} screenshot`} />
              ) : item.kind === "system" ? (
                <SystemArt item={item} />
              ) : (
                <PlannedArt />
              )}
            </div>
            {item.to && (
              <p className="gw-small gw-muted gw-mt-2">
                <Link className="gw-link" to={item.to}>
                  Read the full {item.name} page
                </Link>
              </p>
            )}
          </div>

          {hasCode && (
            <div role="tabpanel" id="panel-code" aria-labelledby="tab-code" hidden={tab !== "code"}>
              <CodePanel code={code} owns={owns} file={file} item={item} copy={copy} copied={copied} />
            </div>
          )}
        </section>

        {/* Installation */}
        <section className="gw-docs-block" aria-labelledby="installation">
          <h2 className="gw-docs-h2" id="installation">
            {item.kind === "system" ? "Getting it" : "Installation"}
          </h2>
          {planned ? (
            <div className="gw-notice gw-notice--info">
              <strong>Planned</strong>
              <span>
                This is on the way and not in the bundle yet. It isn't part of what you pay for today; it arrives as an update for anyone with {offer.name}.
              </span>
            </div>
          ) : (
            <ol className="gw-docs-steps">
              <li>
                <h3>{owns ? "You have access" : `Get ${offer.short} access`}</h3>
                {owns ? (
                  <>
                    <p>{item.kind === "system" ? "The Studio systems are released into your dashboard as they ship." : "It's in the Library bundle on your dashboard."}</p>
                    {download && (
                      <div className="gw-mt-2">
                        <Button href={download.href} download={download.filename} size="sm" onClick={() => track(EVENTS.DOWNLOAD, { product: "library", from: item.slug })}>
                          Download the bundle <span aria-hidden="true">↓</span>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      {gbp(offer.price)} one-time for {item.tier === "studio" ? "every Studio system, plus everything in the Library" : "every component, the starter and the templates as they ship"}, with {UPDATE_PERIOD_MONTHS} months of updates and a commercial licence
                      for finished sites.
                    </p>
                    <div className="gw-mt-2 gw-docs-steps__buy">
                      <BuyButton productId={offer.id} label={offer.primaryCta.label} size="md" />
                    </div>
                    <p className="gw-small gw-mt-2">
                      Already bought it? <Link className="gw-link" to={`/login?next=/library/${item.slug}`}>Sign in to download</Link>.
                    </p>
                  </>
                )}
              </li>
              {item.kind === "system" ? (
                <>
                  <li>
                    <h3>Read how it works</h3>
                    <p>
                      The <Link className="gw-link" to={item.to || "/systems"}>{item.name} page</Link> covers what it does, the journeys and the third-party accounts it needs.
                    </p>
                  </li>
                  <li>
                    <h3>Follow the setup guide</h3>
                    <p>Each system ships with a setup guide, system diagrams and an implementation checklist. Hosting, numbers, messaging and model usage are billed by their providers.</p>
                  </li>
                </>
              ) : item.kind === "template" ? (
                <>
                  <li>
                    <h3>Open the starter</h3>
                    <p>
                      It's one HTML file: the brand tokens at the top and a slot to paste Library sections into.{" "}
                      <a className="gw-link" href={item.href} target="_blank" rel="noopener noreferrer">
                        Open it in a new tab
                      </a>
                      .
                    </p>
                  </li>
                  <li>
                    <h3>Paste in sections</h3>
                    <p>
                      Pick <Link className="gw-link" to="/library?category=heroes">a hero</Link>, features, pricing and a footer, and paste each one into the slot in order.
                    </p>
                  </li>
                  <li>
                    <h3>Deploy it anywhere</h3>
                    <p>Any host that serves static files will do. There is no build step.</p>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <h3>Copy the snippet</h3>
                    <p>
                      In the bundle it's <code className="gw-inline-code">{file}</code>
                      {owns ? ", or copy it here." : ". Once you're signed in you can also copy it from the Code tab."}
                    </p>
                    {owns && code && (
                      <div className="gw-mt-2">
                        <Button variant="secondary" size="sm" onClick={copy}>
                          {copied ? "Copied" : "Copy code"}
                        </Button>
                      </div>
                    )}
                  </li>
                  <li>
                    <h3>Paste it where it should appear</h3>
                    <p>
                      Markup, styles{item.stack.includes("JavaScript") ? " and a small script" : ""} in one self-contained block. There's no build step and no dependency, so it works in plain HTML, React, Vue or a CMS block.
                    </p>
                  </li>
                  <li>
                    <h3>Point it at your brand</h3>
                    <p>
                      {tokens.length ? "Set the tokens below once on :root and every component follows." : "This one sets its own colours; change them in the snippet."} The{" "}
                      <Link className="gw-link" to="/docs/brand-tokens">brand tokens guide</Link> covers light themes and type.
                    </p>
                  </li>
                </>
              )}
            </ol>
          )}
        </section>

        {/* Brand tokens */}
        {tokens.length > 0 && (
          <section className="gw-docs-block" aria-labelledby="tokens">
            <h2 className="gw-docs-h2" id="tokens">
              Brand tokens
            </h2>
            <p className="gw-docs-section__lead">The custom properties this snippet reads. Each has a fallback, so it renders before you set anything.</p>
            <div className="gw-table-wrap">
              <table className="gw-table">
                <thead>
                  <tr>
                    <th scope="col">Token</th>
                    <th scope="col">Used for</th>
                    <th scope="col">Fallback</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <tr key={t.name}>
                      <td>
                        <code className="gw-inline-code">{t.name}</code>
                      </td>
                      <td>{t.use}</td>
                      <td className="gw-mono">
                        {t.fallback && isColour(t.fallback) && <span className="gw-swatch" style={{ background: t.fallback }} aria-hidden="true" />}
                        {t.fallback || "none"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Details */}
        <section className="gw-docs-block" aria-labelledby="details">
          <h2 className="gw-docs-h2" id="details">
            Details
          </h2>
          <dl className="gw-kv gw-kv--docs">
            <dt>Category</dt>
            <dd>
              <Link className="gw-link" to={group ? group.to : `/library?category=${item.category}`}>
                {CATEGORY_NAME[item.category]}
              </Link>
            </dd>
            <dt>Stack</dt>
            <dd>{item.stack.join(", ")}</dd>
            <dt>Dependencies</dt>
            <dd>{item.dependencies.length ? item.dependencies.join(", ") : "None"}</dd>
            <dt>Install</dt>
            <dd>{COMPLEXITY[item.complexity]}</dd>
            {item.bytes && (
              <>
                <dt>Size</dt>
                <dd>{item.bytes.toLocaleString("en-GB")} bytes</dd>
              </>
            )}
            {live && (
              <>
                <dt>In the bundle</dt>
                <dd>
                  <code className="gw-inline-code">{file}</code>
                </dd>
              </>
            )}
            <dt>Version</dt>
            <dd className="gw-mono">{item.version}</dd>
            <dt>Updated</dt>
            <dd>{item.version === "planned" ? "Not yet released" : longDate(item.updated)}</dd>
            {item.detail && (
              <>
                <dt>Notes</dt>
                <dd>
                  <ul className="gw-list gw-list--tight">
                    {item.detail.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </dd>
              </>
            )}
          </dl>
        </section>

        {/* Licence */}
        <section className="gw-docs-block" aria-labelledby="licence">
          <h2 className="gw-docs-h2" id="licence">
            Licence
          </h2>
          <ul className="gw-list gw-list--tight">
            {LICENCE_PRINCIPLES.slice(0, 4).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="gw-small gw-mt-2">
            <Link className="gw-link" to="/legal/licence">
              The full commercial licence
            </Link>
          </p>
        </section>

        {/* Related */}
        <section className="gw-docs-block" aria-labelledby="related">
          <h2 className="gw-docs-h2" id="related">
            Related
          </h2>
          <div className="gw-lib-grid gw-lib-grid--compact">
            {related(item, 3).map((r) => (
              <LibraryCard key={r.id} item={r} />
            ))}
          </div>
        </section>

        {/* Pager */}
        <nav className="gw-pager" aria-label="Previous and next in the Library">
          {prev ? (
            <Link className="gw-pager__link" to={`/library/${prev.slug}`} rel="prev">
              <span className="gw-pager__dir">← Previous</span>
              <span className="gw-pager__name">{prev.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link className="gw-pager__link gw-pager__link--next" to={`/library/${next.slug}`} rel="next">
              <span className="gw-pager__dir">Next →</span>
              <span className="gw-pager__name">{next.name}</span>
            </Link>
          )}
        </nav>
      </LibraryLayout>
    </>
  );
}

/**
 * The Code tab. Signed-in customers get the whole snippet and a copy button;
 * everyone else sees the opening lines and how to get the rest.
 */
function CodePanel({ code, owns, file, item, copy, copied }) {
  if (!code) {
    return (
      <div className="gw-code">
        <div className="gw-code__bar">
          <span>{file}</span>
        </div>
        <pre>
          <code>Loading…</code>
        </pre>
      </div>
    );
  }
  const lines = code.split("\n");
  if (owns) {
    return (
      <div className="gw-code">
        <div className="gw-code__bar">
          <span>
            {file} · {item.bytes.toLocaleString("en-GB")} bytes
          </span>
          <button type="button" className="gw-code__copy" onClick={copy}>
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
        <pre tabIndex={0} className="gw-code__full">
          <code>{code}</code>
        </pre>
      </div>
    );
  }
  return (
    <div className="gw-code gw-code--locked">
      <div className="gw-code__bar">
        <span>{file}</span>
        <span>
          {Math.min(EXCERPT_LINES, lines.length)} of {lines.length} lines
        </span>
      </div>
      <pre tabIndex={0}>
        <code>{lines.slice(0, EXCERPT_LINES).join("\n")}</code>
      </pre>
      <div className="gw-code__lock">
        <p className="gw-h4">The full source ships with {OFFER[item.tier].short} access</p>
        <p className="gw-small gw-body">Every component as a paste-ready file, the offline gallery, and updates for {UPDATE_PERIOD_MONTHS} months.</p>
        <div className="gw-actions" style={{ justifyContent: "center" }}>
          <Button href="#installation" size="sm">
            How to get it
          </Button>
          <Button to={`/login?next=/library/${item.slug}`} variant="secondary" size="sm">
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
