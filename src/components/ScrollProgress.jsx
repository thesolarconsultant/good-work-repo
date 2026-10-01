import { useScrollProgress } from "../lib/motion";

/**
 * The brand gradient, used as a reading-progress bar across the top of the
 * page. It's the one piece of chrome that's always on screen, so it's the
 * cheapest place to put the brand.
 */
export default function ScrollProgress() {
  const barRef = useScrollProgress();

  return (
    <div className="gw-progress" aria-hidden="true">
      <div className="gw-progress__bar" ref={barRef} style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
