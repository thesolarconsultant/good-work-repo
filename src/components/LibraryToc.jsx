import { useEffect, useState } from "react";

/**
 * "On this page": anchor links to the page's sections, with the one being
 * read highlighted as the reader scrolls.
 */
export default function LibraryToc({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    const seen = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = sections.find((s) => seen.get(s.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-90px 0px -55% 0px", threshold: 0 },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="gw-toc" aria-label="On this page">
      <p className="gw-toc__title">On this page</p>
      <ul>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
