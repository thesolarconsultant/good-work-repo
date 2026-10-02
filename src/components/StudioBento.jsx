import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import OfferIcon from "./OfferIcon";
import PhoneFrame from "./PhoneFrame";
import { MockChat, MockCall, MockConsole, MockBrand, MockFlow } from "./Mockups";
import { STUDIO_FEATURES } from "../data/offers";

const MOCKS = {
  "whatsapp-bot": MockChat,
  "voice-agent": MockCall,
  "content-console": MockConsole,
  "brand-guide": MockBrand,
  automations: MockFlow,
};

// Systems whose screen is shown on the photographed phone rather than loose.
const ON_PHONE = new Set(["whatsapp-bot"]);

/**
 * The five Studio systems as a bento of working screens: each tile names the
 * system, says what it does and shows it doing it. Each links to the system's
 * page. Meant for a dark block.
 */
export default function StudioBento() {
  return (
    <div className="gw-bento">
      {STUDIO_FEATURES.map((f, i) => {
        const Mock = MOCKS[f.id];
        return (
          <Reveal key={f.id} variant="rise" delay={Math.min(i * 70, 280)} asChild>
            <Link to={f.to} className={`gw-bento__tile gw-bento__tile--${f.id}`}>
              <span className="gw-bento__head">
                <OfferIcon id={f.id} />
                <span>
                  <b>{f.name}</b>
                  <small>{f.copy}</small>
                </span>
              </span>
              <span className="gw-bento__stage">
                {Mock && ON_PHONE.has(f.id) ? (
                  <PhoneFrame className="gw-bento__phone">
                    <Mock />
                  </PhoneFrame>
                ) : (
                  Mock && <Mock />
                )}
              </span>
              <span className="gw-bento__go">See the system →</span>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
