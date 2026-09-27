import { Link } from "react-router-dom";

/**
 * The one button. Renders as a router Link, a plain anchor or a <button>
 * depending on what it's given, so every call-to-action shares one style.
 *
 * variant: primary | secondary | paper | ghost
 * size:    sm | md | lg
 */
export default function Button({
  children,
  to,
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  block = false,
  className = "",
  type = "button",
  ...rest
}) {
  const classes = [
    "gw-btn",
    `gw-btn--${variant}`,
    size !== "md" && `gw-btn--${size}`,
    block && "gw-btn--block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <span className="gw-btn__arrow" aria-hidden="true">
          →
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
