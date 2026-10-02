import FRAME from "../data/phoneFrame.json";

const S = FRAME.screen;
const GEOMETRY = {
  "--pf-ratio": `${FRAME.width} / ${FRAME.height}`,
  "--pf-left": `${S.left}%`,
  "--pf-top": `${S.top}%`,
  "--pf-width": `${S.width}%`,
  "--pf-height": `${S.height}%`,
  "--pf-radius": `${S.radius}cqw`,
};

/**
 * The phone photographed in Higgsfield, cut out with a clear screen
 * (scripts/build-devices.mjs), around live markup: the children fill the
 * screen, and the photograph's bezel and camera island sit on top of them.
 * Give the wrapper a width; the height follows the photograph. Extra props,
 * a ref included, go to the screen, which is what scrolls.
 */
export default function PhoneFrame({ children, className = "", screenClassName = "", ref, ...rest }) {
  return (
    <div className={`gw-pframe ${className}`.trim()} style={GEOMETRY}>
      <div className={`gw-pframe__screen ${screenClassName}`.trim()} ref={ref} {...rest}>
        {children}
      </div>
      <img className="gw-pframe__body" src={FRAME.src} width={FRAME.width} height={FRAME.height} alt="" loading="lazy" decoding="async" />
    </div>
  );
}
