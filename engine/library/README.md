# OMNIV Motion Library

A living catalog of every motion, button, text effect and block in the OMNIV
engine. Each entry has a **live preview**, a **one-click copy**, and a
**view-the-code** panel, filterable by category (Buttons · Text · Data · Reveal
· Structure). Open `index.html` in a browser.

Every snippet is **drop-in vanilla** HTML/CSS/JS — it works the same in React,
Vue or a plain page — and reads its colour from `var(--accent, #FF5722)` with a
fallback, so it renders standalone and reskins the moment you point it at a
brand's tokens.

## Files
- `components.txt` — the source of truth. One snippet per `@@@ id :: Name :: Category :: description` block, followed by its raw HTML/CSS/JS.
- `build-library.mjs` — builds `index.html` from `components.txt`. Paths are relative, so `node build-library.mjs` regenerates in place.
- `index.html` — the generated gallery (published as an Artifact for browsing/sharing).

## Add a component
1. Append a block to `components.txt`:
   ```
   @@@ myfx :: My Effect :: Buttons :: One-line description.
   <style> … </style>
   <button class="myfx">…</button>
   <script> … </script>
   ```
   Use `var(--accent, #FF5722)` (never a raw brand colour) and make it loop so
   the preview demos itself. Escape any inner `</script>` if needed.
2. `node build-library.mjs`
3. Reopen `index.html`.

Each preview runs inside its own sandboxed `srcdoc` iframe, so what you see is
exactly the code the Copy button hands you — no leakage between components.
