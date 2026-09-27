/**
 * Native <details> accordion: keyboard-accessible, works without JavaScript,
 * and every answer is in the DOM for search engines, which is what makes the
 * FAQPage structured data honest.
 */
export default function FaqList({ items, openFirst = false }) {
  return (
    <div className="gw-faq">
      {items.map((item, i) => (
        <details key={item.q} open={openFirst && i === 0 ? true : undefined}>
          <summary>{item.q}</summary>
          <div className="gw-faq__a">
            <p>{item.a}</p>
            {item.review && (
              <p className="gw-small gw-mt-2" style={{ color: "var(--gw-warn)" }}>
                Draft wording, subject to legal review.
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
