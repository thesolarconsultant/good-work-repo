import { useEffect, useState } from "react";
import { useInView, usePrefersReducedMotion } from "../lib/motion";

/**
 * A heading whose lines rise out from behind their own baseline, one after
 * the other. Each line is its own overflow-hidden block, which is what makes
 * the letters appear to be revealed rather than merely moved.
 *
 * `onMount` is for above-the-fold headings — waiting for a scroll event that
 * will never come would leave the hero blank.
 */
export default function Headline({
  lines,
  as: Tag = "h1",
  className = "",
  stagger = 90,
  onMount = false,
}) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.3 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!onMount) return;
    // One frame's delay so the browser paints the "before" state first,
    // otherwise there's nothing to transition from.
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [onMount]);

  const visible = reduced || (onMount ? mounted : inView);

  return (
    <Tag
      className={`${className} gw-lines`}
      ref={onMount ? undefined : ref}
      data-gw-visible={visible ? "true" : "false"}
    >
      {lines.map((line, i) => (
        <span className="gw-line" key={i}>
          <span style={{ "--gw-line-delay": `${i * stagger}ms` }}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
