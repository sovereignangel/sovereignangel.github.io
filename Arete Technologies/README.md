# Arete Technologies

A management company for a hedge fund, plus the **Mistral** LP kitesurf
retreat in France (July 2026).

## Files

- `Mistral Retreat.html` — landing page (entry point)
- `Arete Logo.html` — design canvas with logo exploration & retreat poster directions
- `retreat/brand.jsx` — brand tokens, lockup, icons, patterns, seal
- `retreat/poster.jsx` — responsive vintage poster (hero)
- `retreat/sections.jsx` — landing-page sections (Hero, Program, Rhythm, Coaches, Location, RSVP, FAQ, Footer)
- `logos.jsx` / `kiting.jsx` — design-canvas option components
- `design-canvas.jsx` — pan/zoom canvas component
- `BRAND.md` — design system, tokens, voice, motifs, open work

## Run locally

No build step. Serve any static file server from the repo root:

```
python3 -m http.server 8000
# then open http://localhost:8000/Mistral%20Retreat.html
```

(or `npx serve .`, `caddy file-server`, etc.)

## Working with Claude Code

When you open this folder in VS Code with the Claude extension, point
Claude at `BRAND.md` first — it has the tokens, voice, layout rules, and
the open work list. Then ask for whatever's next:

- "Read BRAND.md, then wire the RSVP form to a Cloudflare Worker."
- "Read BRAND.md, then add a mobile pass at 900px."
- "Read BRAND.md, then design the badge / name-tag / itinerary card stationery in the same system."
- "Read BRAND.md, then build out the Arete primary site using the Mistral aesthetic as a starting point."

## Stack

- React 18 (UMD) + Babel Standalone — inline JSX, no bundler.
- No npm, no build step. Edit JSX, refresh.
- Google Fonts: Cormorant Garamond, GFS Didot.

If you want to graduate to a real build, the JSX is plain React — drop
into Vite + React with minimal changes. The `window.X = X` exports are
how the no-bundler setup shares components across files; under Vite,
replace those with normal `export` / `import`.
