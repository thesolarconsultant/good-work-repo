import { Link } from "react-router-dom";
import { useMagnetic, usePrefersReducedMotion } from "../lib/motion";

/**
 * The one button in the system. Renders as a router Link, a plain anchor or a
 * <button> depending on what it's given, so every call-to-action gets the same
 * magnetic lean and gradient sheen without duplicating markup.
 *
 * variant: solid | outline | light (light = white button for dark sections)
 */
export default function Button({
  children,
  to,
  href,
  variant = "solid",
  className = "",
  arrow = false,
  ...rest
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, onPointerMove, onPointerLeave } = useMagnetic({ enabled: !reduced });

  const classes = [
    "gw-button",
    variant === "outline" && "gw-button--outline",
    variant === "light" && "gw-button--light",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const props = {
    ref,
    className: classes,
    onPointerMove,
    onPointerLeave,
    ...rest,
  };

  const content = (
    <>
      <span className="gw-button__label">{children}</span>
      {arrow && (
        <span className="gw-button__arrow" aria-hidden="true">
          →
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} {...props}>
        {content}
      </a>
    );
  }
  return <button type="button" {...props}>{content}</button>;
}
