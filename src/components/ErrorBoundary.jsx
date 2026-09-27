import { Component } from "react";
import Button from "./Button";

/**
 * Catches a render error in a route and shows a usable page instead of a
 * blank one. The error is logged for the platform's console; nothing about
 * it is shown to the visitor beyond the fact that something went wrong.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("route error:", error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    // A navigation away from the broken route gets a fresh attempt.
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="gw-section gw-error">
        <div className="gw-container--narrow">
          <p className="gw-eyebrow gw-eyebrow--accent">Something broke</p>
          <h1 className="gw-h2 gw-mt-2">This page hit an error.</h1>
          <p className="gw-lead gw-mt-2 gw-max">
            The rest of the site is fine. Try reloading, or head back to the homepage. If it keeps
            happening, email hello@goodwork.agency and say which page it was.
          </p>
          <div className="gw-actions gw-mt-4">
            <Button href={typeof window !== "undefined" ? window.location.pathname : "/"} variant="primary">
              Reload this page
            </Button>
            <Button to="/" variant="secondary">
              Back to home
            </Button>
          </div>
        </div>
      </section>
    );
  }
}
