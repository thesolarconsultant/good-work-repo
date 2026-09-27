import Shot from "./Shot";

/**
 * The hero visual: the actual product surfaces, layered. A real website
 * built on the system, a real Content Console screen, a WhatsApp-style
 * qualification exchange and a CRM pipeline. No abstract object.
 */
export default function HeroStack() {
  return (
    <div className="gw-stack" aria-label="A website, the Content Console, a WhatsApp conversation and a CRM pipeline, layered">
      <div className="gw-stack__layer gw-stack__browser">
        <div className="gw-stack__bar" aria-hidden="true">
          <i /><i /><i />
          <span className="gw-stack__url">thesolarconsultant.uk</span>
        </div>
        <Shot src="/case-studies/tsc-home.jpg" alt="A website built on the Goodwork system" sizes="(max-width: 980px) 70vw, 440px" priority />
      </div>

      <div className="gw-stack__layer gw-stack__console">
        <span className="gw-stack__tag" aria-hidden="true">Content Console</span>
        <Shot src="/console/tsc-console-pipeline.jpg" alt="The Content Console pipeline board" sizes="(max-width: 980px) 58vw, 360px" priority />
      </div>

      <div className="gw-stack__layer gw-stack__chat" aria-label="WhatsApp bot qualifying an enquiry">
        <span className="gw-stack__bubble">Hi, thinking about solar but not sure where to start.</span>
        <span className="gw-stack__bubble gw-stack__bubble--out">Good place to start. Is this for your own home?</span>
        <span className="gw-stack__bubble">Own home, 3 bed.</span>
        <span className="gw-stack__bubble gw-stack__bubble--out">Tomorrow 2pm or Thursday 10am for a call?</span>
      </div>

      <div className="gw-stack__layer gw-stack__crm" aria-label="CRM pipeline">
        <div className="gw-stack__cols">
          <div className="gw-stack__col"><b>New</b><i className="gw-stack__lead gw-stack__lead--hot" /><i className="gw-stack__lead" /><i className="gw-stack__lead" /></div>
          <div className="gw-stack__col"><b>Qualified</b><i className="gw-stack__lead" /><i className="gw-stack__lead gw-stack__lead--hot" /></div>
          <div className="gw-stack__col"><b>Booked</b><i className="gw-stack__lead" /></div>
        </div>
        <span className="gw-stack__caption" aria-hidden="true">Pipeline</span>
      </div>
    </div>
  );
}
