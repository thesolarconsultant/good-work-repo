import Reveal from "./Reveal";

/** Eyebrow, heading, lead: the opening of every section, in one place. */
export default function SectionHead({ eyebrow, title, lead, align = "left", as: Tag = "h2", children, className = "" }) {
  return (
    <Reveal variant="rise" className={`${align === "center" ? "gw-center " : ""}${className}`.trim()}>
      {eyebrow && <p className="gw-eyebrow gw-eyebrow--accent">{eyebrow}</p>}
      <Tag className="gw-h2 gw-mt-2" style={{ maxWidth: align === "center" ? "22ch" : "24ch", marginInline: align === "center" ? "auto" : undefined }}>
        {title}
      </Tag>
      {lead && <p className="gw-lead gw-max gw-mt-3">{lead}</p>}
      {children}
    </Reveal>
  );
}
