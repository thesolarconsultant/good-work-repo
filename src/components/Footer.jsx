import { Link } from "react-router-dom";
import Button from "./Button";
import Headline from "./Headline";
import Reveal from "./Reveal";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/case-studies", label: "Case studies" },
  { to: "/content-console", label: "Content Console" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
];

export default function Footer({ statement = "Got something worth making better" }) {
  return (
    <footer className="gw-footer">
      <div className="gw-container">
        <Headline
          as="p"
          className="gw-footer__statement"
          lines={[
            <>
              {statement}
              <span className="gw-dot" />
            </>,
          ]}
        />
        <Reveal variant="rise" delay={120}>
          <div className="gw-footer__bottom">
            <div className="gw-footer__links">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to}>
                  {l.label}
                </Link>
              ))}
            </div>
            <Button to="/contact" variant="light" arrow>
              Start a project
            </Button>
          </div>
        </Reveal>
        <Reveal variant="fade" delay={200}>
          <p className="gw-footer__fine">
            © {new Date().getFullYear()} GOOD WORK. — Brand, websites and systems.{" "}
            <a href="mailto:hello@goodwork.agency">hello@goodwork.agency</a>
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
