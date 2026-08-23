/**
 * A display heading with the brand gradient running through the letterforms.
 *
 * CSS cannot put a gradient into `-webkit-text-stroke`, so this stacks two
 * copies of the same text. The lower one paints the gradient across the glyph
 * *and* its stroke — `background-clip: text` covers both — and the upper one
 * refills the glyph interior in the ground colour, leaving only the stroke
 * showing. The result is an outline made of the brand gradient, and because
 * it is a real background it can be animated so the colours flow along the
 * wording.
 *
 * The second copy is aria-hidden, so the heading is still announced once.
 */
export default function Display({ as: Tag = "h2", className = "", children, ...rest }) {
  return (
    <Tag className={`gw-display gw-display--flow ${className}`.trim()} {...rest}>
      <span className="gw-display__ink">{children}</span>
      <span className="gw-display__core" aria-hidden="true">{children}</span>
    </Tag>
  );
}
