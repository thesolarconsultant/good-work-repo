import { usePointerGlow, usePrefersReducedMotion } from "../lib/motion";

/**
 * A card that lights up under the cursor. The pointer position is written to
 * CSS custom properties and the gradient itself is drawn in CSS, so moving the
 * mouse never triggers a React render.
 */
export default function GlowCard({ children, className = "", ...rest }) {
  const reduced = usePrefersReducedMotion();
  const { ref, onPointerMove, onPointerLeave } = usePointerGlow(!reduced);

  return (
    <div
      ref={ref}
      className={`gw-card gw-glow ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...rest}
    >
      {children}
    </div>
  );
}
