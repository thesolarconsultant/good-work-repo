import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import Button from "../components/Button";
import NotFound from "./NotFound";
import { PostCard } from "./Learn";
import { LEARN, LEARN_BY_SLUG, LEARN_CATEGORIES } from "../data/learn";
import { article, breadcrumbs } from "../lib/schema";
import { longDate } from "../lib/format";

function Block({ b }) {
  if (b.type === "h2") return <h2>{b.text}</h2>;
  if (b.type === "ol")
    return (
      <ol>
        {b.items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ol>
    );
  if (b.type === "ul")
    return (
      <ul>
        {b.items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    );
  if (b.type === "cta")
    return (
      <p>
        <Button to={b.to} variant="secondary" arrow>
          {b.label}
        </Button>
      </p>
    );
  return <p>{b.text}</p>;
}

export default function LearnPost() {
  const { slug } = useParams();
  const post = LEARN_BY_SLUG[slug];
  if (!post) return <NotFound />;
  const cat = LEARN_CATEGORIES.find((c) => c.slug === post.category);
  const crumbs = [{ label: "Home", to: "/" }, { label: "Learn", to: "/learn" }, { label: cat.name, to: `/learn/category/${cat.slug}` }, { label: post.title }];
  const more = LEARN.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <Seo title={post.seo?.title || post.title} description={post.seo?.description || post.summary} type="article" schema={[article(post, `/learn/${post.slug}`), breadcrumbs(crumbs)]} />

      <article>
        <header className="gw-pagehead">
          <div className="gw-container--narrow">
            <nav aria-label="Breadcrumb">
              <ol className="gw-crumbs">
                {crumbs.map((c, i) => (
                  <li key={c.label}>{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
                ))}
              </ol>
            </nav>
            <p className="gw-eyebrow gw-eyebrow--accent gw-mt-3">{cat.name}</p>
            <h1 className="gw-h1 gw-mt-2" style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)" }}>
              {post.title}
            </h1>
            <p className="gw-lead gw-mt-3">{post.summary}</p>
            <p className="gw-post__meta gw-mt-3">
              <span>{post.author}</span>
              <span>{longDate(post.date)}</span>
              <span>{post.readTime}</span>
            </p>
          </div>
        </header>

        <section className="gw-section--tight">
          <div className="gw-container--narrow">
            {post.videoUrl && (
              <div className="gw-shot__frame gw-mt-2" style={{ aspectRatio: "16/9" }}>
                <video controls playsInline preload="metadata" src={post.videoUrl} style={{ width: "100%", height: "100%" }} />
              </div>
            )}
            <div className="gw-prose gw-mt-3">
              {post.body.map((b, i) => (
                <Block key={i} b={b} />
              ))}
            </div>
            {post.relatedProduct && (
              <div className="gw-card gw-card--accent gw-mt-5" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <div>
                  <p className="gw-eyebrow">Related product</p>
                  <p className="gw-h4 gw-mt-1">{post.relatedProduct.label}</p>
                </div>
                <Button to={post.relatedProduct.to} arrow>
                  Open {post.relatedProduct.label}
                </Button>
              </div>
            )}
          </div>
        </section>
      </article>

      <section className="gw-section gw-surface" aria-labelledby="more-title">
        <div className="gw-container">
          <p className="gw-eyebrow gw-eyebrow--accent">More from Learn</p>
          <h2 className="gw-h3 gw-mt-1" id="more-title">
            Keep reading
          </h2>
          <div className="gw-grid gw-grid--3 gw-mt-4">
            {more.map((p, i) => (
              <PostCard key={p.slug} post={p} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
