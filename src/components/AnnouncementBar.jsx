import { Link } from "react-router-dom";
import { ANNOUNCEMENT } from "../data/nav";

export default function AnnouncementBar({ onDismiss }) {
  return (
    <div className="gw-announce" role="region" aria-label="Announcement">
      <div className="gw-container gw-announce__inner">
        <p className="gw-announce__text gw-announce__text--long">{ANNOUNCEMENT.text}</p>
        <p className="gw-announce__text gw-announce__text--short">{ANNOUNCEMENT.short}</p>
        <Link className="gw-announce__link" to={ANNOUNCEMENT.link.to}>
          {ANNOUNCEMENT.link.label} →
        </Link>
        <button type="button" className="gw-announce__close" aria-label="Dismiss announcement" onClick={onDismiss}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
