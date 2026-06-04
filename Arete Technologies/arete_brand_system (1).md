# Arete Technologies — Brand System

A reference for applying the Arete Technologies brand across surfaces.
One mark, one motto, one inscription — four taglines in a single structural form.

---

## 1. Architecture

**Arete Technologies** is the parent house. Three ventures operate beneath it:

- **Armstrong** — a quantamental fund
- **Arete Salons** — gatherings of minds
- **Arete Mistral** — a kiteboarding retreat

The house is named for **ἀρετή** (Greek: *arete*) — excellence as the realization of potential through disciplined practice. *Technologies* is used in the original Greek sense of *technē* — the disciplined practices and instruments that produce excellence — not the contemporary "tech" sense.

---

## 2. The Lines

### House

| Element              | Line                       |
| -------------------- | -------------------------- |
| Tagline              | The long practice.         |
| Motto                | What compounds, endures.   |
| Inscription (Latin)  | Eadem mutata resurgo.      |
| Glyph (Greek)        | ἀρετή                      |

### Ventures

| Venture        | Medium        | Tagline                |
| -------------- | ------------- | ---------------------- |
| Armstrong      | capital       | The long arithmetic.   |
| Arete Salons   | conversation  | The long table.        |
| Arete Mistral  | craft         | The long horizon.      |

All four taglines follow the form ***The long [X]*** where X is a static noun naming the medium the venture compounds in. The tagline answers *what*; the motto answers *why*; the inscription carries the heritage.

---

## 3. The Mark

The mark is Bernoulli's ***spira mirabilis*** — the logarithmic spiral, defined by:

> **r = a · e^(bθ)**

The spiral's defining property is self-similarity: it grows without changing shape. It is the geometric form of compounding.

The mark is drawn with a single hairline burgundy stroke on cream, with a small filled dot at the limit point. The dot matters: the spiral approaches the center forever and never quite arrives — *arete* as the realization of potential rather than the arrival at it.

The mark never changes between ventures. Variation across venues happens at the wordmark and tagline, not at the mark.

### Standard Parameters

```js
const SPIRAL = {
  a: 0.5,           // initial radius scalar
  b: 0.205,         // growth rate
  thetaMin: -1.0,   // starting angle (radians)
  thetaMax: 8 * Math.PI, // ending angle — four full turns
  steps: 900        // polyline resolution
};
```

### Path Generator

```js
function spiralPath(cx, cy, a, b, thetaMin, thetaMax, steps) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const theta = thetaMin + (thetaMax - thetaMin) * (i / steps);
    const r = a * Math.exp(b * theta);
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    d += (i === 0 ? 'M ' : 'L ') + x.toFixed(3) + ' ' + y.toFixed(3) + ' ';
  }
  return d;
}
```

### SVG Markup

```html
<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-label="Arete Technologies">
  <path d="[generated]"
        fill="none"
        stroke="#7c2d2d"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"/>
  <circle cx="120" cy="120" r="2.6" fill="#7c2d2d"/>
</svg>
```

### Sizing Guide

| Context        | Render Size | Stroke Width |
| -------------- | ----------- | ------------ |
| Hero / cover   | 140–260px   | 1.4          |
| Section mark   | 90–120px    | 1.2          |
| Lockup mark    | 60–80px     | 1.0          |
| Favicon / 32   | 32px        | 1.3          |

Use `vector-effect="non-scaling-stroke"` so the stroke weight stays consistent regardless of SVG scale.

---

## 4. Surface Allocation

The rule of thumb: tagline answers *what*, motto answers *why*, inscription is heritage. Each line has a home; none of them appear everywhere.

| Surface                          | Line(s)                                  |
| -------------------------------- | ---------------------------------------- |
| Website hero                     | Wordmark + tagline                       |
| Pitch deck cover                 | Wordmark + tagline                       |
| Email footer                     | Wordmark + tagline (single line)         |
| Quarterly letter — open          | Wordmark only                            |
| Quarterly letter — close         | Motto                                    |
| Business card — front            | Wordmark                                 |
| Business card — back             | Motto                                    |
| Formal seal / founding documents | Latin inscription                        |
| Inside covers, section pages     | Greek glyph (ἀρετή)                      |

Latin in three places is brand cologne; Latin in one place is heritage. Same rule for Greek.

---

## 5. Design Tokens

### Colors

```css
:root {
  --cream:          #f5f1ea;  /* primary background */
  --paper:          #faf8f4;  /* card / document background */
  --ink:            #2a2522;  /* primary text */
  --ink-muted:      #6b5f55;  /* secondary text */
  --ink-soft:       #8a7f74;  /* tertiary text */
  --burgundy:       #7c2d2d;  /* brand accent, the mark */
  --burgundy-light: #9c4040;  /* hover, secondary accent */
  --rule:           #d8cfc1;  /* dividers, borders */
  --rule-soft:      #e8e0d2;  /* subtle dividers */
}
```

### Typography

```css
/* Serif — wordmarks, taglines, body */
font-family: 'Crimson Pro', Georgia, serif;

/* Monospace — labels, eyebrows, metadata */
font-family: 'IBM Plex Mono', monospace;

/* Sans — UI elements, descriptive text */
font-family: 'Inter', sans-serif;
```

Google Fonts import:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

### Type Scale

| Element             | Font            | Weight | Size      | Style                              |
| ------------------- | --------------- | ------ | --------- | ---------------------------------- |
| Wordmark — house    | Crimson Pro     | 600    | 52px      | normal                             |
| Wordmark — venture  | Crimson Pro     | 600    | 26–44px   | normal                             |
| Tagline             | Crimson Pro     | 400    | 18–22px   | italic                             |
| Motto               | Crimson Pro     | 400    | 14–16px   | italic                             |
| Eyebrow             | IBM Plex Mono   | 400    | 10px      | uppercase, 0.18em letter-spacing   |
| Body                | Crimson Pro     | 400    | 13–16px   | normal                             |
| Caption / metadata  | IBM Plex Mono   | 400    | 9–10px    | uppercase, 0.14em letter-spacing   |

Letter-spacing reduces slightly on the wordmark (`-0.015em`) to compensate for Crimson Pro's natural openness at display sizes.

---

## 6. Voice & Register

The lines are arranged in three depths of attention:

- **English** — the everyday voice (*The long practice. What compounds, endures.*)
- **Latin** — the heritage voice (*Eadem mutata resurgo.*)
- **Greek** — the philosophical root (ἀρετή)

Each language carries a different weight and surfaces in different places. Three languages, three registers, three depths — itself a small expression of *arete*.

---

## 7. Attributions

- **Spira mirabilis & inscription** — Jacob Bernoulli (1654–1705), Swiss mathematician. Bernoulli named the curve *spira mirabilis* — *the marvelous spiral* — and asked that it be engraved on his tomb at Basel Münster with the motto *eadem mutata resurgo*. The stonemason famously rendered an Archimedean spiral instead of the logarithmic one; the brand chooses the curve Bernoulli intended.
- **Arete (ἀρετή)** — classical Greek. Excellence, virtue, the realization of potential through habitual disciplined practice. Central to Aristotle's *Nicomachean Ethics*.
- The mark, taglines, and motto are the work of Arete Technologies. **MMXXVI**.

---

*What compounds, endures.*
