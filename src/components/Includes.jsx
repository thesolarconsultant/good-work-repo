/**
 * "What's included" beside "What's not". Exclusions sit right next to the
 * offer on purpose; they never go in small print.
 */
export default function Includes({ includes, excludes, includesTitle = "What's included", excludesTitle = "Not included", note, cols = false }) {
  return (
    <div className="gw-inc">
      <div className="gw-inc__col">
        <div className="gw-inc__head">
          <h3 className="gw-h4">{includesTitle}</h3>
          <span className="gw-badge gw-badge--library">{includes.length} items</span>
        </div>
        <ul className={`gw-list${cols ? " gw-list--cols" : ""}`}>
          {includes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="gw-inc__col gw-inc__col--x">
        <div className="gw-inc__head">
          <h3 className="gw-h4">{excludesTitle}</h3>
          <span className="gw-badge gw-badge--muted">Charged separately or not offered</span>
        </div>
        <ul className="gw-list gw-list--x">
          {excludes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        {note && <p className="gw-small gw-muted gw-mt-3">{note}</p>}
      </div>
    </div>
  );
}
