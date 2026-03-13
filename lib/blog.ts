export interface BlogPost {
  slug: string
  title: string
  subtitle: string
  date: string
  readTime: string
  tags: string[]
  content: string
}

export const posts: BlogPost[] = [
  {
    slug: 'building-a-macro-signal-pipeline',
    title: 'Building a Macro Signal Pipeline from Scratch',
    subtitle: 'How I\'m building systematic infrastructure to translate macroeconomic data into actionable investment signals',
    date: '2026-03-12',
    readTime: '8 min',
    tags: ['macro', 'signals', 'python', 'FRED'],
    content: `
The best systematic investors don't predict the future. They build machines that listen to the present better than anyone else.

This is the first post in a series documenting my build of a macro signal pipeline — a system that ingests economic data, computes systematic signals, and eventually feeds portfolio construction decisions. The goal isn't a backtest that looks good on paper. It's a living system I can monitor, debug, and evolve as markets shift.

## Why Macro?

Most retail quants start with equities — stock screening, momentum factors, mean reversion. That's fine, but macro is where the real leverage is. A single insight about the trajectory of interest rates or inflation expectations can reposition an entire portfolio. Bridgewater, the world's largest hedge fund, built their entire operation on this premise.

Macro signals also have a structural advantage: the data is public, the release schedules are known, and the relationships between economic variables and asset prices are grounded in actual economic theory — not just statistical patterns that can evaporate.

## The Architecture

The pipeline has four layers:

**1. Data Ingestion**
Pull time-series data from FRED (Federal Reserve Economic Data), which hosts 800,000+ economic series. Key indicators I'm starting with:

- **Yield curve**: 10Y-2Y Treasury spread (recession signal)
- **Inflation expectations**: 5Y breakeven inflation rate
- **Labor market**: Initial jobless claims, nonfarm payrolls
- **Growth**: Real GDP growth, ISM Manufacturing PMI
- **Credit conditions**: High-yield OAS spread

Each series has different release frequencies (daily, weekly, monthly, quarterly) and revision patterns. The pipeline needs to handle all of this cleanly.

**2. Signal Construction**
Raw economic data isn't a signal. A signal requires:

- **Normalization**: Z-score the series against its own history (how unusual is today's reading?)
- **Momentum**: Is the indicator improving or deteriorating? Rate of change matters more than level.
- **Regime context**: A 3% unemployment rate means something different in an expansion vs. coming off a recession.

The first signal I'm building: **yield curve slope → equity risk premium**. The thesis is simple — when the yield curve inverts (10Y yield drops below 2Y), it signals that the bond market expects economic contraction. Historically, equity returns in the 12-18 months following inversion have been significantly below average.

**3. Backtesting**
Every signal gets tested against actual asset returns. But backtesting is where most quants fool themselves. Common traps:

- **Look-ahead bias**: Using data that wasn't available at the time of the signal
- **Survivorship bias**: Only testing on assets that still exist
- **Overfitting**: Tuning parameters until the backtest looks perfect (and the live performance collapses)

My framework computes: Sharpe ratio, maximum drawdown, hit rate, and average win/loss ratio. If a signal can't clear a 0.3 Sharpe ratio out of sample, it doesn't make the cut.

**4. Monitoring & Diagnostics**
A signal that worked historically but isn't monitored in production is useless. The final layer is a dashboard that shows:

- Current signal readings and historical context
- Regime classification (expansion, contraction, transition)
- Signal performance attribution (which signals are contributing to returns?)

## What I'm Building This Week

The immediate deliverables:

1. **FRED API wrapper** — clean Python module that handles rate limiting, caching, and data alignment across different frequencies
2. **Yield curve signal** — first end-to-end signal from raw data to backtest results
3. **Visualization** — charts that show the signal alongside actual equity returns

## The Bigger Picture

This pipeline is one piece of a larger thesis: that an individual with good engineering skills and economic intuition can build systematic investment infrastructure that was previously only accessible to institutional investors. The data is available. The compute is cheap. The missing piece is the discipline to build it properly — with real statistical rigor, not curve-fitted noise.

Every week I'll publish what I've built, what I've learned, and what broke. The code will be open. The research will be transparent. If the signals work, they work. If they don't, that's information too.

Next week: implementing the yield curve signal and running the first backtest.

---

*This is week 1 of a 16-week series building a systematic macro investment framework. Follow along for weekly research posts on signals, portfolio construction, and the engineering behind it all.*
`,
  },
]

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}
