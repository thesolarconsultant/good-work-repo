import LibraryCard from "./LibraryCard";
import Button from "./Button";

export function LibrarySkeleton({ n = 6 }) {
  return (
    <div className="gw-lib-grid" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="gw-skeleton">
          <div className="gw-skeleton__preview" />
          <div className="gw-skeleton__line" />
          <div className="gw-skeleton__line gw-skeleton__line--short" />
        </div>
      ))}
    </div>
  );
}

export default function LibraryGrid({ items, eagerCount = 3, onReset }) {
  if (items.length === 0) {
    return (
      <div className="gw-lib-empty" role="status">
        <p className="gw-h3">Nothing matches those filters.</p>
        <p className="gw-body gw-mt-2">Try a broader category, or clear the search.</p>
        {onReset && (
          <div className="gw-actions gw-mt-3" style={{ justifyContent: "center" }}>
            <Button variant="secondary" onClick={onReset}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="gw-lib-grid">
      {items.map((item, i) => (
        <LibraryCard key={item.id} item={item} eager={i < eagerCount} />
      ))}
    </div>
  );
}
