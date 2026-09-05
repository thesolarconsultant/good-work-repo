import Deck from "../components/deck/Deck";
import Display from "../components/Display";
import Headline from "../components/Headline";
import Button from "../components/Button";
import Stamp from "../components/Stamp";
import Stat from "../components/Stat";
import Shot from "../components/Shot";
import { CASE_STUDIES } from "../data/caseStudies";
import { CONSOLE_OUTCOMES } from "../data/console";
import { DISCIPLINES } from "../data/disciplines";
import { PACKAGES, ADDONS } from "../data/packages";
import { PROCESS } from "../data/process";

// A live, presenter-driven pitch for GOOD WORK. itself — built to be shown
// on a laptop or shared screen, not read cold. Every case-study fact, every
// Content Console figure and every step of the process is pulled from the
// same data the public site uses, so the deck can never say something the
// site doesn't also say.

const tsc = CASE_STUDIES.find((c) => c.id === "tsc");
const eightEnergy = CASE_STUDIES.find((c) => c.id === "8energy");

const PROBLEMS = [
  "The website needs a developer just to change a sentence.",
  "The last post went up months ago, because writing one is always last on the list.",
  "A call missed at 6pm is a lead gone to whoever answers next.",
  "A quote takes three days to go out — long enough for the customer to have found someone else.",
];

function ProofSlide({ cs, reverse = false }) {
  const shot = (
    <Shot
      src={cs.shots[0].src}
      alt={cs.shots[0].caption}
      caption={cs.shots[0].caption}
      sizes="(max-width: 820px) 100vw, 560px"
    />
  );
  const copy = (
    <div>
      <span className="gw-deck__kicker">Proof — {cs.name}</span>
      <Headline onMount as="h2" className="gw-h2" lines={[cs.name]} />
      <p className="gw-deck__lede" style={{ marginInline: 0 }}>
        {cs.lede}
      </p>
      <div className="gw-facts gw-facts--pair" style={{ marginTop: "1.5rem" }}>
        {cs.facts.slice(0, 2).map((f, i) => (
          <Stat key={f.label} figure={f.figure} label={f.label} delay={i * 90} />
        ))}
      </div>
    </div>
  );
  return <div className="gw-deck__proof">{reverse ? [shot, copy] : [copy, shot]}</div>;
}

const SLIDES = [
  {
    label: "Open",
    content: (
      <>
        <Stamp size={104} />
        <Headline
          onMount
          as="h1"
          className="gw-h1 gw-stack-lg"
          lines={["We make businesses", "look and work better."]}
        />
        <p className="gw-deck__lede">
          Brand. Websites. Systems. Built properly, once, and kept running after launch.
        </p>
      </>
    ),
  },
  {
    label: "The problem",
    content: (
      <>
        <span className="gw-deck__kicker">The problem</span>
        <Headline onMount as="h2" className="gw-h2" lines={["Weak websites.", "Disconnected systems.", "Inconsistent marketing."]} />
        <p className="gw-deck__lede">
          Good businesses get let down by all three — not from lack of effort, but because nobody
          made the pieces work together.
        </p>
      </>
    ),
  },
  {
    label: "What that costs you",
    content: (
      <>
        <span className="gw-deck__kicker">What that actually looks like</span>
        <Display as="h2">Money on<br />the table</Display>
        <ul className="gw-deck__list">
          {PROBLEMS.map((p, i) => (
            <li key={p} style={{ "--gw-deck-i": i }}>{p}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    label: `Proof — ${tsc.name}`,
    content: <ProofSlide cs={tsc} />,
  },
  {
    label: `Proof — ${eightEnergy.name}`,
    content: <ProofSlide cs={eightEnergy} reverse />,
  },
  {
    label: "What we do",
    content: (
      <>
        <span className="gw-deck__kicker">What we do</span>
        <Headline onMount as="h2" className="gw-h2" lines={["Four disciplines.", "One standard."]} />
        <div className="gw-deck__grid4">
          {DISCIPLINES.map((d, i) => (
            <div className="gw-deck__card" key={d.title} style={{ "--gw-deck-i": i }}>
              <strong>{d.title}</strong>
              <span>{d.desc}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    label: "The Content Console",
    content: (
      <>
        <span className="gw-deck__kicker">The centrepiece</span>
        <Headline onMount as="h2" className="gw-h2" lines={["Your business,", "never quiet."]} />
        <Shot
          src="/console/tsc-console-pipeline.jpg"
          alt="The Content Console's pipeline, showing a real client's backlog, drafts and published posts."
          className="gw-deck__shot--tight"
          sizes="(max-width: 820px) 100vw, 560px"
        />
        <div className="gw-facts" style={{ marginTop: "1.5rem" }}>
          {CONSOLE_OUTCOMES.map((o, i) => (
            <Stat key={o.label} figure={o.figure} label={o.label} delay={i * 90} />
          ))}
        </div>
      </>
    ),
  },
  {
    label: "How it runs",
    content: (
      <>
        <span className="gw-deck__kicker">How it runs</span>
        <Headline onMount as="h2" className="gw-h2" lines={["Four steps.", "No agency theatre."]} />
        <div className="gw-deck__grid4">
          {PROCESS.map((p, i) => (
            <div className="gw-deck__card" key={p.title} style={{ "--gw-deck-i": i }}>
              <strong>{p.mark}. {p.title}</strong>
              <span>{p.desc}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    label: "The packages",
    content: (
      <>
        <span className="gw-deck__kicker">How it's packaged</span>
        <Headline onMount as="h2" className="gw-h2" lines={["Look good.", "Work properly.", "Automate it.", "Hand you control."]} />
        <div className="gw-deck__grid4">
          {PACKAGES.map((pkg, i) => (
            <div className="gw-deck__card gw-deck__card--pkg" key={pkg.id} style={{ "--gw-deck-i": i }}>
              <strong>{pkg.name}</strong>
              <span className="gw-deck__pkg-price">
                {pkg.setup}
                <small>+ {pkg.monthly}</small>
              </span>
              <span className="gw-deck__pkg-purpose">{pkg.purpose}</span>
              <span>&ldquo;{pkg.pitch}&rdquo;</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    label: "Add-ons",
    content: (
      <>
        <span className="gw-deck__kicker">Two ways to go further</span>
        <Headline onMount as="h2" className="gw-h2" lines={["If you need it."]} />
        <div className="gw-deck__grid2">
          {ADDONS.map((a, i) => (
            <div className="gw-deck__card gw-deck__card--pkg" key={a.id} style={{ "--gw-deck-i": i }}>
              <strong>{a.name}</strong>
              <span className="gw-deck__pkg-price">{a.monthly}</span>
              <span className="gw-deck__pkg-purpose">{a.purpose}</span>
              <span>&ldquo;{a.pitch}&rdquo;</span>
              {a.note && <span className="gw-deck__pkg-note">{a.note}</span>}
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    label: "Close",
    content: (
      <>
        <Stamp size={104} />
        <Headline onMount as="h2" className="gw-h1 gw-stack-lg" lines={["This could be", "your project next."]} />
        <p className="gw-deck__lede">
          One conversation to understand what's leaking, one scope and one fixed price before
          anything starts.
        </p>
        <div className="gw-deck__actions">
          <Button to="/services" variant="light" arrow>
            See services
          </Button>
          <Button to="/contact" variant="outline" arrow>
            Start a project
          </Button>
        </div>
      </>
    ),
  },
];

export default function Pitch() {
  return (
    <Deck
      slides={SLIDES}
      title="The GOOD WORK. Pitch"
      description="A presenter-led walkthrough of what GOOD WORK. does, built from the same case studies and figures published on the site."
    />
  );
}
