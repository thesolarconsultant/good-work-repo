import { useCallback, useEffect, useRef, useState } from "react";

// Video generation takes minutes, not seconds.
const POLL_MS = 4000;
const GIVE_UP_MS = 6 * 60 * 1000;

/**
 * Live Higgsfield B-roll, on the page that claims we do it.
 *
 * The whole panel is self-gating: it asks /api/broll for the preset list on
 * mount, and if that 404s (function not deployed) or 503s (no credentials),
 * it renders nothing at all. So the site behaves exactly as it does today
 * until the function is deployed with a key.
 *
 * Prompts live on the server — the browser only ever sends a preset id.
 */
export default function BrollStudio() {
  const [presets, setPresets] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | working | done | error
  const [video, setVideo] = useState(null);
  const [message, setMessage] = useState("");
  const abortRef = useRef(null);
  const timerRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/broll", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.presets?.length) {
          setPresets(data.presets);
          setChosen(data.presets[0].id);
        }
      })
      .catch(() => {
        // Not deployed, or offline. Either way the panel stays hidden.
      });
    return () => controller.abort();
  }, []);

  // Stop polling if the visitor navigates away mid-generation.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      clearTimeout(timerRef.current);
    },
    [],
  );

  const generate = useCallback(async () => {
    if (!chosen) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("working");
    setVideo(null);
    setMessage("Sending the prompt with the brand style file attached…");

    try {
      const res = await fetch("/api/broll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presetId: chosen }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        setPhase("error");
        setMessage("That's a few clips in a short space of time — give it an hour, or get in touch and we'll show you properly.");
        return;
      }
      if (!res.ok) throw new Error(`start failed: ${res.status}`);

      const { id } = await res.json();
      const startedAt = Date.now();
      setMessage("Generating. This takes a couple of minutes — the shot is being composed against the style file.");

      const poll = async () => {
        if (controller.signal.aborted) return;
        if (Date.now() - startedAt > GIVE_UP_MS) {
          setPhase("error");
          setMessage("This one's taking longer than it should. Worth trying again in a minute.");
          return;
        }

        const check = await fetch(`/api/broll?id=${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        if (!check.ok) throw new Error(`poll failed: ${check.status}`);
        const data = await check.json();

        if (data.status === "completed" && data.url) {
          setVideo(data.url);
          setPhase("done");
          setMessage("Done — generated just now, from the same style file every clip uses.");
          return;
        }
        if (data.status === "failed") {
          setPhase("error");
          setMessage(
            data.reason === "nsfw"
              ? "That generation was rejected by the safety filter. Try another preset."
              : "That generation failed. Try again, or try another preset.",
          );
          return;
        }
        timerRef.current = setTimeout(poll, POLL_MS);
      };

      timerRef.current = setTimeout(poll, POLL_MS);
    } catch (error) {
      if (error.name === "AbortError") return;
      setPhase("error");
      setMessage("Couldn't reach the generator. Try again shortly.");
    }
  }, [chosen]);

  if (!presets) return null;

  const working = phase === "working";

  return (
    <div className="gw-broll">
      <div className="gw-broll__head">
        <p className="gw-label">Try it — live</p>
        <h3 className="gw-h3 gw-stack-sm">Generate a clip on our brand style file</h3>
        <p className="gw-body gw-stack-sm">
          Pick a shot. The prompt goes out with the same colour grade, camera language and
          avoid-list baked in that every client clip uses — this is the real pipeline, not a
          recording of it.
        </p>
      </div>

      <div className="gw-broll__presets" role="radiogroup" aria-label="Choose a shot">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={chosen === p.id}
            disabled={working}
            className={`gw-broll__preset${chosen === p.id ? " gw-broll__preset--active" : ""}`}
            onClick={() => setChosen(p.id)}
          >
            <span className="gw-broll__preset-label">{p.label}</span>
            <span className="gw-broll__preset-note">{p.note}</span>
          </button>
        ))}
      </div>

      <div className="gw-broll__actions">
        <button type="button" className="gw-button gw-button--light" onClick={generate} disabled={working}>
          <span className="gw-button__label">{working ? "Generating…" : "Generate the shot"}</span>
          {!working && <span className="gw-button__arrow" aria-hidden="true">→</span>}
        </button>
        {working && <span className="gw-broll__spinner" aria-hidden="true" />}
      </div>

      <p className="gw-broll__status" role="status" aria-live="polite">
        {message}
      </p>

      {video && (
        <video
          className="gw-broll__video"
          src={video}
          controls
          autoPlay
          loop
          muted
          playsInline
        />
      )}
    </div>
  );
}
