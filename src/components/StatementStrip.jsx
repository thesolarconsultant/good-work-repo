import Reveal from "./Reveal";

/** Three short promises, set as big as the screen allows; the middle one in the gradient. */
export default function StatementStrip() {
  return (
    <Reveal variant="rise">
      <ul className="gw-statement">
        <li>Pay once</li>
        <li>
          <em className="gw-grad">Own the build</em>
        </li>
        <li>Run it yourself, or let us</li>
      </ul>
    </Reveal>
  );
}
