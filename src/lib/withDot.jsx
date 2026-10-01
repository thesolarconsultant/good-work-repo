/**
 * A heading's closing full stop becomes the brand's coral dot. The last word
 * and the dot are kept together, so the dot never wraps onto a line alone.
 */
export function withDot(line) {
  if (typeof line !== "string" || !line.endsWith(".")) return line;
  const text = line.slice(0, -1);
  const cut = text.lastIndexOf(" ") + 1;
  return (
    <>
      {text.slice(0, cut)}
      <span className="gw-nowrap">
        {text.slice(cut)}
        <span className="gw-dot" aria-hidden="true" />
      </span>
    </>
  );
}
