// Structured data builders. Only ever describe content that is visibly on the
// page that emits it.

import { SITE_URL, SITE_NAME, CONTACT_EMAIL, DESCRIPTION } from "./site";

export const ORG_ID = `${SITE_URL}/#organisation`;

export function organization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    description: DESCRIPTION,
    areaServed: "GB",
    logo: `${SITE_URL}/og.png`,
    knowsAbout: [
      "Website component library",
      "Website templates with source code",
      "AI website systems",
      "WhatsApp bot for business",
      "AI voice agent setup",
      "Embedded CRM for small business",
      "Agency systems and automation",
    ],
  };
}

export function website() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": ORG_ID },
  };
}

/** A Product with one Offer, for the offer pages and the pricing page. */
export function productOffer(offer, { path } = {}) {
  const url = `${SITE_URL}${path || offer.route}`;
  return {
    "@context": "https://schema.org",
    "@type": offer.kind === "service" ? "Service" : "Product",
    "@id": `${url}#offer`,
    name: offer.name,
    description: offer.outcome,
    url,
    brand: { "@id": ORG_ID },
    provider: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: String(offer.price),
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      url,
      seller: { "@id": ORG_ID },
    },
  };
}

export function faqPage(faq) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function breadcrumbs(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.to ? { item: `${SITE_URL}${c.to}` } : {}),
    })),
  };
}

export function article(post, path) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: `${SITE_URL}${path}`,
  };
}

export function itemList(name, path, items) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: `${SITE_URL}${path}`,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.url ? { url: it.url } : {}),
    })),
  };
}

export function softwareProduct(item, path) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: item.name,
    description: item.description,
    url: `${SITE_URL}${path}`,
    programmingLanguage: item.stack,
    isPartOf: { "@type": "Product", name: item.tier === "studio" ? "Goodwork Studio" : "Goodwork Library" },
    provider: { "@id": ORG_ID },
  };
}
