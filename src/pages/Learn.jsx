import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import NotFound from "./NotFound";
import { LEARN, LEARN_CATEGORIES } from "../data/learn";
import { breadcrumbs } from "../lib/schema";
import { longDate } from "../lib/format";

export function PostCard({ post, delay = 0 }) {
  const cat = LEARN_CATEGORIES.find((c) => c.slug === post.category);
  return (
    <Reveal variant="rise" delay={delay} asChild>
      <article className="gw-post" aria-labelledby={`post-${post.slug}`}>
        <div className="gw-post__thumb" aria-hidden="true">
          {post.thumbnail ? <img src={post.thumbnail} alt="" loading="lazy" /> : <span className="gw-eyebrow">{post.format === "video" ? "Video" : "Article"}</span>}
        </div>
        <div className="gw-post__meta">
          <span>{cat?.name}</span>
          <span>{longDate(post.date)}</span>
          <span>{post.readTime}</span>
        </div>
        <h3 className="gw-post__title" id={`post-${post.slug}`}>
          <Link to={`/learn/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="gw-post__summary">{post.summary}</p>
        {post.relatedProduct && (
          <Link to={post.relatedProduct.to} className="gw-small gw-link">
            Related: {post.relatedProduct.label}
          </Link>
        )}
      </article>
    </Reveal>
  );
}

export default function Learn() {
  const { category } = useParams();
  const cat = category ? LEARN_CATEGORIES.find((c) => c.slug === category) : null;
  if (category && !cat) return <NotFound />;
  const posts = cat ? LEARN.filter((p) => p.category === cat.slug) : LEARN;
  const crumbs = [{ label: "Home", to: "/" }, { label: "Learn", to: "/learn" }, ...(cat ? [{ label: cat.name }] : [])];

  return (
    <>
      <Seo title={cat ? `${cat.name} — Learn` : "Learn — guides, build demonstrations and product releases"} description="Founder-led guides and build notes on website builds, components, AI agents, content systems, brand systems, CRM and sales operations, and agency building. Each piece links to the product or service it relates to." schema={breadcrumbs(crumbs)} />

      <PageHeader crumbs={crumbs} eyebrow="Learn" lines={cat ? [cat.name] : ["Guides, build notes", "and releases."]} lead={cat ? `Everything filed under ${cat.name}.` : "Weekly, founder-led and specific. How the systems are built, how to use them, and what changed. No filler."}>
        <div className="gw-chips" role="navigation" aria-label="Learn categories">
          <Link to="/learn" className={`gw-chip${!cat ? " gw-chip--on" : ""}`} aria-current={!cat ? "page" : undefined}>
            All
          </Link>
          {LEARN_CATEGORIES.map((c) => {
            const n = LEARN.filter((p) => p.category === c.slug).length;
            return (
              <Link key={c.slug} to={`/learn/category/${c.slug}`} className={`gw-chip${cat?.slug === c.slug ? " gw-chip--on" : ""}`} aria-current={cat?.slug === c.slug ? "page" : undefined}>
                {c.name}
                <span className="gw-chip__n">{n}</span>
              </Link>
            );
          })}
        </div>
      </PageHeader>

      <section className="gw-section--tight" aria-labelledby="posts-title">
        <div className="gw-container">
          <h2 className="gw-sr-only" id="posts-title">
            Posts
          </h2>
          {posts.length ? (
            <div className="gw-grid gw-grid--3">
              {posts.map((p, i) => (
                <PostCard key={p.slug} post={p} delay={i * 60} />
              ))}
            </div>
          ) : (
            <div className="gw-lib-empty">
              <p className="gw-h3">Nothing published here yet.</p>
              <p className="gw-body gw-mt-2">This category is planned for the weekly schedule. The first entries land with the Library release.</p>
              <div className="gw-actions gw-mt-3" style={{ justifyContent: "center" }}>
                <Button to="/learn" variant="secondary">
                  See everything published
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
