import { useEffect, useState } from "react";

const KEY = "gw:announce:dismissed:v1";

/**
 * Whether the announcement bar is showing. Everything that has to make room
 * for it (nav, page padding, scroll margins) reads the CSS variable this sets,
 * so nothing measures the DOM.
 */
export function useAnnouncement() {
  const [shown, setShown] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--gw-announce-offset", shown ? "var(--gw-announce-h)" : "0px");
  }, [shown]);

  const dismiss = () => {
    setShown(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Storage disabled: the bar simply comes back next visit.
    }
  };

  return [shown, dismiss];
}
