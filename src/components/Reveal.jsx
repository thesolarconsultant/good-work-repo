import { cloneElement, isValidElement } from "react";
import { useInView, usePrefersReducedMotion } from "../lib/motion";

/**
 * Scroll-reveal wrapper.
 *
 * Renders a plain element with `data-gw-reveal` set — all of the actual
 * animation lives in CSS, so this stays cheap and there's exactly one
 * IntersectionObserver per revealed block.
 *
 * `asChild` reuses the child element instead of adding a wrapper div, which
 * matters inside grids where an extra div would break the layout.
 *
 * variant: rise | fade | clip | left | right | scale | mask
 */
export default function Reveal({
  children,
  variant = "rise",
  delay = 0,
  threshold,
  as: Tag = "div",
  asChild = false,
  className = "",
  style,
  ...rest
}) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ threshold });

  // Reduced motion: render the content as-is, no observer-driven states.
  if (reduced) {
    if (asChild && isValidElement(children)) return children;
    return (
      <Tag className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  const revealProps = {
    ref,
    "data-gw-reveal": variant,
    "data-gw-visible": inView ? "true" : "false",
    style: delay ? { ...style, "--gw-reveal-delay": `${delay}ms` } : style,
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...revealProps,
      className: [children.props.className, className].filter(Boolean).join(" "),
      style: { ...children.props.style, ...revealProps.style },
    });
  }

  return (
    <Tag className={className} {...revealProps} {...rest}>
      {children}
    </Tag>
  );
}
