import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { ShotPicture } from "./Shot";
import { SHOWCASE } from "../data/showcase";
import { laptopPhoto } from "../data/devices";

// The three projects on the home page, each on a laptop: the device photograph
// from data/devices.js when there is one, otherwise the real screenshot in a
// laptop drawn in CSS.
const PICKS = ["tsc", "8energy", "keystone"];

const DROP = new Set(["Brand", "Brand guidelines"]);

export default function ShowcasePanels() {
  const items = PICKS.map((id) => SHOWCASE.find((x) => x.id === id))
    .filter(Boolean)
    .map((s) => ({ ...s, photo: laptopPhoto(s.id), caption: s.systems.filter((x) => !DROP.has(x)).slice(0, 3).join(" · ") }));

  return (
    <div className="gw-showpanels">
      {items.map((it, i) => (
        <Reveal key={it.id} variant="rise" delay={i * 90} asChild>
          <Link to={`/showcase#${it.id}`} className="gw-showpanel">
            {it.photo ? (
              <span className="gw-showpanel__stage gw-showpanel__stage--photo">
                <ShotPicture src={it.photo} alt={`${it.name}: the homepage on a laptop`} sizes="(max-width: 860px) 92vw, 380px" />
              </span>
            ) : (
              <span className="gw-showpanel__stage">
                <span className="gw-laptop">
                  <span className="gw-laptop__screen">
                    <ShotPicture src={it.shots[0].src} alt={`${it.name}: ${it.shots[0].caption}`} sizes="(max-width: 860px) 90vw, 360px" />
                  </span>
                  <span className="gw-laptop__base" />
                </span>
              </span>
            )}
            <span className="gw-showpanel__name">
              {it.name} <span className="gw-muted">· {it.status}</span>
            </span>
            <span className="gw-showpanel__caption">{it.caption}</span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
