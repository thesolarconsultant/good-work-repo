import { COMPARISON, COMPARISON_COLUMNS, OFFER } from "../data/offers";
import { priceLabel } from "../lib/format";

function Cell({ value }) {
  if (value === true) {
    return (
      <span className="gw-compare__yes" aria-label="Included">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M2.5 6.5l2.5 2.5 4.5-5" />
        </svg>
      </span>
    );
  }
  if (value === false) return <span className="gw-compare__no">—</span>;
  return <span>{value}</span>;
}

function cellText(value) {
  return value === true ? "Included" : value === false ? "Not included" : value;
}

/**
 * Grouped comparison of the four primary offers. A real table on wide
 * screens; stacked per-offer cards on narrow ones, from the same data.
 */
export default function ComparisonTable() {
  const cols = COMPARISON_COLUMNS.map((id) => OFFER[id]);
  return (
    <>
      <table className="gw-compare">
        <caption className="gw-sr-only">Comparison of Goodwork Library, Studio, Built by Goodwork and Build Your Agency</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="gw-eyebrow">What you're buying</span>
            </th>
            {cols.map((o) => (
              <th scope="col" key={o.id}>
                <span className="gw-compare__col">
                  <b>{o.short}</b>
                  <small>{priceLabel(o.price, o.billing)}</small>
                  <small>{o.who}</small>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((group) => (
            <GroupRows key={group.group} group={group} cols={cols} />
          ))}
        </tbody>
      </table>

      <div className="gw-compare-cards">
        {cols.map((o) => (
          <article key={o.id} className="gw-compare-card" aria-labelledby={`cmp-${o.id}`}>
            <p className="gw-eyebrow">{o.who}</p>
            <h3 className="gw-h3 gw-mt-1" id={`cmp-${o.id}`}>
              {o.short}
            </h3>
            <p className="gw-mono gw-small gw-mt-1">{priceLabel(o.price, o.billing)}</p>
            {COMPARISON.map((group) => (
              <div key={group.group} className="gw-compare-card__group">
                <h4>{group.group}</h4>
                {group.rows.map((r) => (
                  <div key={r.label} className="gw-compare-card__row">
                    <span>{r.label}</span>
                    <span>{cellText(r[o.id])}</span>
                  </div>
                ))}
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}

function GroupRows({ group, cols }) {
  return (
    <>
      <tr className="gw-compare__group">
        <th scope="rowgroup" colSpan={cols.length + 1}>
          {group.group}
        </th>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.label}>
          <td>{r.label}</td>
          {cols.map((o) => (
            <td key={o.id}>
              <Cell value={r[o.id]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
