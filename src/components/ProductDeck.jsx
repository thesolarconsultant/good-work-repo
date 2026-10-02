import OfferIcon from "./OfferIcon";
import { MockSite, MockChat, MockCall, MockConsole } from "./Mockups";

const PANELS = [
  { id: "site", icon: "built", Mock: MockSite },
  { id: "chat", icon: "whatsapp-bot", Mock: MockChat },
  { id: "call", icon: "voice-agent", Mock: MockCall },
  { id: "console", icon: "content-console", Mock: MockConsole },
];

/**
 * The hero's picture of a Goodwork build: the website, the WhatsApp agent
 * booking a visit, the voice agent on a call and the Content Console, stacked
 * like cards, each badged with its product icon.
 */
export default function ProductDeck() {
  return (
    <div
      className="gw-pdeck"
      role="img"
      aria-label="An example Goodwork build: the business website, a WhatsApp conversation booking a site visit, an AI voice agent answering a call, and the Content Console with posts ready to publish."
    >
      {PANELS.map(({ id, icon, Mock }, i) => (
        <div key={id} className={`gw-pdeck__panel gw-pdeck__panel--${id}`}>
          <div className="gw-pdeck__lift" style={{ "--i": i }}>
            <OfferIcon id={icon} className="gw-pdeck__badge" />
            <Mock />
          </div>
        </div>
      ))}
    </div>
  );
}
