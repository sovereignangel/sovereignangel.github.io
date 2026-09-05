// armstrong.aretetec.com/variantperception — the Variant Perception
// architecture page. Served as standalone HTML (route handler, no site
// chrome); source of truth is variant-perception/architecture-diagram.html —
// copy it here verbatim when it changes.

export const dynamic = 'force-static'

const HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Variant Perception Sandbox</title>
<style>
  :root {
    --paper: #f7f6f2;
    --surface: #fffefb;
    --ink: #241f1c;
    --muted: #6f6a60;
    --rule: #d9d4c9;
    --accent: #7c2d2d;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper: #171512;
      --surface: #201d19;
      --ink: #e9e5dd;
      --muted: #9a938a;
      --rule: #3a352e;
      --accent: #c97b6d;
    }
  }
  :root[data-theme="dark"] {
    --paper: #171512;
    --surface: #201d19;
    --ink: #e9e5dd;
    --muted: #9a938a;
    --rule: #3a352e;
    --accent: #c97b6d;
  }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font-family: Georgia, "Times New Roman", serif; line-height: 1.55;
  }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 36px 20px 56px; }
  .kicker {
    font-family: ui-monospace, Menlo, monospace; font-size: 12px;
    letter-spacing: 2.5px; text-transform: uppercase; color: var(--muted);
  }
  h1 { font-size: 34px; margin: 8px 0 4px; font-weight: 700; }
  .motto {
    margin: 18px 0 26px; padding: 12px 18px;
    border-left: 4px solid var(--accent); background: var(--surface);
    font-size: 20px; font-style: italic;
  }
  figure { margin: 0; background: var(--surface); border: 1px solid var(--rule); padding: 14px; }
  svg { display: block; max-width: 100%; height: auto; }
  figcaption { font-size: 14px; color: var(--muted); margin-top: 10px; max-width: 90ch; }
  .foot { margin-top: 18px; font-size: 13px; color: var(--muted); font-family: ui-monospace, Menlo, monospace; }
</style>

<div class="wrap">
  <div class="kicker">Variant Perception · Three Planes, One Commons · rev. 2026-09-05</div>
  <h1>The Sandbox and Its Clients</h1>
  <p class="motto">&ldquo;Signals cross planes as artifacts, never as code.&rdquo;</p>

  <figure>
    <svg viewBox="0 0 1000 670" role="img" aria-label="Variant Perception sandbox architecture: collectors write scoped prefixes into a data commons; the lab reads the commons read-only and publishes versioned artifacts into a signals prefix; Armstrong, Alamo Bernal, and the independent researcher each pull pinned, validated artifacts; code paths into clients and client data into the commons are forbidden.">
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor"/>
        </marker>
        <marker id="ahb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/>
        </marker>
      </defs>

      <!-- ── Producers ── -->
      <text x="110" y="78" font-size="12" text-anchor="middle" fill="var(--muted)" font-family="monospace" letter-spacing="2">PRODUCERS</text>
      <rect x="20" y="96" width="180" height="60" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="110" y="121" font-size="13" text-anchor="middle" fill="currentColor" font-weight="bold">AIS collector</text>
      <text x="110" y="140" font-size="11" text-anchor="middle" fill="var(--muted)">VP-plane · chokepoints</text>

      <rect x="20" y="196" width="180" height="60" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="110" y="221" font-size="13" text-anchor="middle" fill="currentColor" font-weight="bold">Weather / ONI pulls</text>
      <text x="110" y="240" font-size="11" text-anchor="middle" fill="var(--muted)">VP-plane · ERA5, ENSO</text>

      <rect x="20" y="296" width="180" height="60" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text x="110" y="321" font-size="13" text-anchor="middle" fill="currentColor" font-weight="bold">IBKR gateway box</text>
      <text x="110" y="340" font-size="11" text-anchor="middle" fill="var(--muted)">Armstrong-owned · Hetzner</text>

      <!-- ── Commons ── -->
      <rect x="300" y="64" width="220" height="330" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <text x="410" y="92" font-size="13" text-anchor="middle" fill="currentColor" font-weight="bold" font-family="monospace" letter-spacing="1">DATA COMMONS · R2 · NEUTRAL</text>

      <rect x="316" y="112" width="188" height="42" fill="none" stroke="var(--muted)" stroke-width="1.2"/>
      <text x="410" y="138" font-size="13" text-anchor="middle" fill="currentColor" font-family="monospace">vp-ais</text>
      <rect x="316" y="168" width="188" height="42" fill="none" stroke="var(--muted)" stroke-width="1.2"/>
      <text x="410" y="194" font-size="13" text-anchor="middle" fill="currentColor" font-family="monospace">vp-weather</text>
      <rect x="316" y="224" width="188" height="42" fill="none" stroke="var(--muted)" stroke-width="1.2"/>
      <text x="410" y="250" font-size="13" text-anchor="middle" fill="currentColor" font-family="monospace">vp-market-eod</text>

      <line x1="316" y1="282" x2="504" y2="282" stroke="var(--rule)" stroke-width="1"/>
      <rect x="316" y="292" width="188" height="42" fill="none" stroke="var(--accent)" stroke-width="2"/>
      <text x="410" y="312" font-size="13" text-anchor="middle" fill="var(--accent)" font-family="monospace" font-weight="bold">vp-signals</text>
      <text x="410" y="327" font-size="10" text-anchor="middle" fill="var(--accent)">versioned artifacts · per-bucket tokens</text>

      <!-- producer writes (solid, scoped) -->
      <line x1="200" y1="128" x2="313" y2="132" stroke="currentColor" stroke-width="1.4" marker-end="url(#ah)"/>
      <text x="256" y="118" font-size="11" text-anchor="middle" fill="var(--muted)">write · token for vp-ais only</text>
      <line x1="200" y1="226" x2="313" y2="192" stroke="currentColor" stroke-width="1.4" marker-end="url(#ah)"/>
      <text x="256" y="200" font-size="11" text-anchor="middle" fill="var(--muted)">write · scoped</text>
      <line x1="200" y1="326" x2="313" y2="250" stroke="currentColor" stroke-width="1.4" marker-end="url(#ah)"/>
      <text x="262" y="304" font-size="11" text-anchor="middle" fill="var(--muted)">write · scoped</text>

      <!-- ── The Lab ── -->
      <rect x="300" y="470" width="220" height="118" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <text x="410" y="497" font-size="13" text-anchor="middle" fill="currentColor" font-weight="bold" font-family="monospace" letter-spacing="1">VARIANT PERCEPTION LAB</text>
      <text x="410" y="516" font-size="11" text-anchor="middle" fill="var(--muted)">variant-perception · private, no prod credentials</text>
      <text x="410" y="534" font-size="11" text-anchor="middle" fill="var(--muted)">experiments · backtests · registries</text>
      <text x="410" y="552" font-size="11" text-anchor="middle" fill="var(--muted)">laptop now · own Hetzner box at graduation</text>

      <line x1="452" y1="470" x2="452" y2="397" stroke="currentColor" stroke-width="1.4" stroke-dasharray="6 4" marker-end="url(#ah)"/>
      <text x="462" y="437" font-size="11" fill="var(--muted)">reads · read-only key</text>
      <line x1="368" y1="470" x2="368" y2="337" stroke="var(--accent)" stroke-width="2" marker-end="url(#ahb)"/>
      <text x="358" y="437" font-size="11" text-anchor="end" fill="var(--accent)">publishes artifact</text>
      <text x="358" y="451" font-size="11" text-anchor="end" fill="var(--accent)">versioned + schema'd</text>

      <!-- ── Clients ── -->
      <text x="840" y="60" font-size="12" text-anchor="middle" fill="var(--muted)" font-family="monospace" letter-spacing="2">CLIENTS OF THE SANDBOX</text>
      <rect x="700" y="76" width="280" height="96" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <text x="840" y="102" font-size="14" text-anchor="middle" fill="currentColor" font-weight="bold">ARMSTRONG</text>
      <text x="840" y="121" font-size="11" text-anchor="middle" fill="var(--muted)">production fund · sealed plane</text>
      <text x="840" y="138" font-size="11" text-anchor="middle" fill="var(--muted)">DeepOps · IBKR box · bundle deploys only</text>
      <text x="840" y="155" font-size="11" text-anchor="middle" fill="var(--muted)">own Vercel · own database · Hetzner VPS</text>

      <rect x="700" y="248" width="280" height="96" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <text x="840" y="274" font-size="14" text-anchor="middle" fill="currentColor" font-weight="bold">ALAMO BERNAL</text>
      <text x="840" y="293" font-size="11" text-anchor="middle" fill="var(--muted)">client production · contractual wall</text>
      <text x="840" y="310" font-size="11" text-anchor="middle" fill="var(--muted)">strictest plane · own infra</text>
      <text x="840" y="327" font-size="11" text-anchor="middle" fill="var(--muted)">own Vercel · own database · DigitalOcean VPS</text>

      <rect x="700" y="420" width="280" height="96" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <text x="840" y="446" font-size="14" text-anchor="middle" fill="currentColor" font-weight="bold">INDEPENDENT RESEARCHER</text>
      <text x="840" y="465" font-size="11" text-anchor="middle" fill="var(--muted)">Complexity Econ · public plane</text>
      <text x="840" y="482" font-size="11" text-anchor="middle" fill="var(--muted)">loricorpuz.com · papers · Abu Dhabi</text>
      <text x="840" y="499" font-size="11" text-anchor="middle" fill="var(--muted)">Website Vercel · lib/commons · aggregates only</text>

      <!-- artifact pulls (dashed accent) -->
      <line x1="504" y1="300" x2="696" y2="140" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#ahb)"/>
      <text x="600" y="204" font-size="11" fill="var(--accent)" transform="rotate(-22 600 204)">pulls · pinned + validated</text>
      <line x1="504" y1="313" x2="696" y2="296" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#ahb)"/>
      <text x="600" y="294" font-size="11" fill="var(--accent)" transform="rotate(-5 600 294)">pulls · pinned + validated</text>
      <line x1="504" y1="326" x2="696" y2="452" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#ahb)"/>
      <text x="586" y="398" font-size="11" fill="var(--accent)" transform="rotate(30 586 398)">pulls · public-safe aggregates</text>

      <!-- forbidden paths -->
      <line x1="520" y1="520" x2="648" y2="520" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 4"/>
      <circle cx="660" cy="520" r="11" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <line x1="653" y1="513" x2="667" y2="527" stroke="currentColor" stroke-width="1.6"/>
      <line x1="667" y1="513" x2="653" y2="527" stroke="currentColor" stroke-width="1.6"/>
      <text x="594" y="545" font-size="11" text-anchor="middle" fill="var(--muted)">no code · no push · no deploy to any client</text>
      <text x="594" y="560" font-size="11" text-anchor="middle" fill="var(--muted)">promotion = rewrite via bundle</text>

      <line x1="696" y1="330" x2="580" y2="352" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 4"/>
      <circle cx="568" cy="354" r="11" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <line x1="561" y1="347" x2="575" y2="361" stroke="currentColor" stroke-width="1.6"/>
      <line x1="575" y1="347" x2="561" y2="361" stroke="currentColor" stroke-width="1.6"/>
      <text x="636" y="372" font-size="11" text-anchor="middle" fill="var(--muted)">client data never enters the commons</text>

      <!-- legend -->
      <line x1="30" y1="626" x2="80" y2="626" stroke="currentColor" stroke-width="1.4" marker-end="url(#ah)"/>
      <text x="88" y="630" font-size="11" fill="var(--muted)">write, key scoped to one prefix</text>
      <line x1="300" y1="626" x2="350" y2="626" stroke="currentColor" stroke-width="1.4" stroke-dasharray="6 4" marker-end="url(#ah)"/>
      <text x="358" y="630" font-size="11" fill="var(--muted)">read-only pull</text>
      <line x1="480" y1="626" x2="530" y2="626" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="6 4" marker-end="url(#ahb)"/>
      <text x="538" y="630" font-size="11" fill="var(--muted)">artifact path — the only plane crossing</text>
      <circle cx="790" cy="626" r="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <line x1="784" y1="620" x2="796" y2="632" stroke="currentColor" stroke-width="1.4"/>
      <line x1="796" y1="620" x2="784" y2="632" stroke="currentColor" stroke-width="1.4"/>
      <text x="806" y="630" font-size="11" fill="var(--muted)">forbidden</text>
    </svg>
    <figcaption>
      The sandbox serves three clients through one interface. Collectors write scoped prefixes into the commons;
      the lab reads everything read-only and may write exactly one place — signals/, as versioned, schema'd
      artifacts. Armstrong, Alamo Bernal, and the public research program each choose what to pull, pinned and
      validated on their side. The two crossed circles are the constitution: research can never push code into a
      client, and client data can never flow back into shared storage. A wrong signal is a bad opinion in a file —
      never bad code in a system that trades. The commons is Cloudflare R2 in a neutral account — per-bucket tokens, zero egress, effectively $0 for years.
    </figcaption>
  </figure>

  <p class="foot">source of truth: variant-perception/ARCHITECTURE.md · decided 2026-09-05</p>
</div>
</html>`

export function GET() {
  return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
