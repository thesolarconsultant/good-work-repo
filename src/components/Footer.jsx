import { Link } from "react-router-dom";

export default function Footer({ statement = "Got something worth making better" }) {
  return (
    <footer className="gw-footer">
      <div className="gw-container">
        <p className="gw-footer__statement">
          {statement}<span className="gw-dot"></span>
        </p>
        <div className="gw-footer__bottom">
          <div className="gw-footer__links">
            <Link to="/">Home</Link>
            <Link to="/work">Work</Link>
            <Link to="/services">Services</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <Link to="/contact" className="gw-button" style={{ background: "var(--gw-white)", color: "var(--gw-black)" }}>
            Start a project →
          </Link>
        </div>
      </div>
    </footer>
  );
}
