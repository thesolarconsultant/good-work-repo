/**
 * Drawn previews for the items that have no live snippet: the Studio systems
 * and the planned templates. Each one says what the thing is (a chat flow, a
 * call, a pipeline) instead of showing an empty striped box.
 */
const ICONS = {
  "sys-whatsapp": (
    <g fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 60c0-19 16-34 36-34s36 15 36 34-16 34-36 34c-6 0-12-1-17-4l-15 5 5-13c-6-6-9-13-9-22Z" stroke="var(--gw-accent-text)" />
      <circle cx="40" cy="60" r="3.5" fill="var(--gw-accent-text)" stroke="none" />
      <circle cx="54" cy="60" r="3.5" fill="var(--gw-accent-text)" stroke="none" />
      <circle cx="68" cy="60" r="3.5" fill="var(--gw-accent-text)" stroke="none" />
    </g>
  ),
  "sys-voice": (
    <g stroke="var(--gw-accent-text)" strokeWidth="5" strokeLinecap="round">
      {[20, 34, 48, 62, 76, 90].map((x, i) => (
        <line key={x} x1={x} x2={x} y1={60 - [10, 22, 34, 26, 16, 8][i]} y2={60 + [10, 22, 34, 26, 16, 8][i]} />
      ))}
    </g>
  ),
  "sys-brand": (
    <g>
      <circle cx="38" cy="46" r="16" fill="var(--gw-accent)" />
      <circle cx="70" cy="46" r="16" fill="#7a5cff" />
      <circle cx="38" cy="78" r="16" fill="var(--gw-paper)" />
      <circle cx="70" cy="78" r="16" fill="none" stroke="var(--gw-line-strong)" strokeWidth="2" />
    </g>
  ),
  "sys-automations": (
    <g fill="none" stroke="var(--gw-accent-text)" strokeWidth="2">
      <rect x="10" y="48" width="24" height="24" rx="6" />
      <rect x="76" y="22" width="24" height="24" rx="6" />
      <rect x="76" y="74" width="24" height="24" rx="6" />
      <path d="M34 60h16c8 0 8-26 16-26h10M50 60c8 0 8 26 16 26h10" strokeLinecap="round" />
    </g>
  ),
  "sys-crm-ui": (
    <g>
      {[14, 46, 78].map((x, c) => (
        <g key={x}>
          <rect x={x} y="22" width="26" height="6" rx="3" fill="var(--gw-line-strong)" />
          {Array.from({ length: 3 - c }).map((_, r) => (
            <rect key={r} x={x} y={36 + r * 22} width="26" height="16" rx="4" fill={c === 1 && r === 0 ? "var(--gw-accent)" : "var(--gw-bg-3)"} stroke="var(--gw-line-strong)" />
          ))}
        </g>
      ))}
    </g>
  ),
  "sys-console": (
    <g fill="none" stroke="var(--gw-accent-text)" strokeWidth="2">
      <rect x="14" y="24" width="82" height="72" rx="8" />
      <path d="M14 40h82M28 56h40M28 68h54M28 80h30" strokeLinecap="round" />
    </g>
  ),
};

export function SystemArt({ item }) {
  return (
    <div className="gw-art" aria-hidden="true">
      <svg viewBox="0 0 110 120" className="gw-art__icon">
        {ICONS[item.id] || ICONS["sys-console"]}
      </svg>
      <p className="gw-art__stack">{item.stack.slice(0, 3).join(" · ")}</p>
    </div>
  );
}

/** A page wireframe for a template that is planned but not built yet. */
export function PlannedArt() {
  return (
    <div className="gw-art gw-art--planned" aria-hidden="true">
      <svg viewBox="0 0 200 124" className="gw-art__page">
        <rect x="1" y="1" width="198" height="122" rx="8" fill="none" stroke="var(--gw-line-strong)" strokeDasharray="4 4" />
        <rect x="14" y="12" width="30" height="6" rx="3" fill="var(--gw-line-strong)" />
        <rect x="132" y="11" width="54" height="8" rx="4" fill="var(--gw-line-strong)" />
        <rect x="40" y="36" width="120" height="10" rx="5" fill="var(--gw-line-strong)" />
        <rect x="60" y="52" width="80" height="6" rx="3" fill="var(--gw-line)" />
        <rect x="80" y="66" width="40" height="10" rx="5" fill="var(--gw-accent-line)" />
        {[14, 76, 138].map((x) => (
          <rect key={x} x={x} y="88" width="48" height="24" rx="5" fill="none" stroke="var(--gw-line-strong)" />
        ))}
      </svg>
    </div>
  );
}
