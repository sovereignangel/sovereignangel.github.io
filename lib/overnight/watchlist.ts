/**
 * Market Signal Watchlist
 * Top 10 investors and founders whose thinking shapes markets
 */

import type { WatchlistEntry } from '@/lib/types/overnight'

export const WATCHLIST: WatchlistEntry[] = [
  {
    name: 'Bill Gurley',
    role: 'Investor (Benchmark)',
    blogUrl: 'https://abovethecrowd.com',
    twitterHandle: 'bgurley',
    rssFeedUrl: 'https://abovethecrowd.com/feed/',
    pillars: ['markets'],
  },
  {
    name: 'William Ackman',
    role: 'Investor (Pershing Square)',
    twitterHandle: 'BillAckman',
    pillars: ['markets'],
  },
  {
    name: 'Patrick Collison',
    role: 'Founder/CEO (Stripe)',
    blogUrl: 'https://patrickcollison.com',
    twitterHandle: 'patrickc',
    pillars: ['ai', 'markets'],
  },
  {
    name: 'Dario Amodei',
    role: 'CEO (Anthropic)',
    blogUrl: 'https://darioamodei.com',
    twitterHandle: 'DarioAmodei',
    pillars: ['ai'],
  },
  {
    name: 'Howard Marks',
    role: 'Investor (Oaktree Capital)',
    blogUrl: 'https://www.oaktreecapital.com/insights',
    rssFeedUrl: 'https://www.oaktreecapital.com/insights/feed',
    pillars: ['markets'],
  },
  {
    name: 'Andrej Karpathy',
    role: 'AI Researcher / Founder',
    blogUrl: 'https://karpathy.github.io',
    twitterHandle: 'kaborsky',
    pillars: ['ai'],
  },
  {
    name: 'Chamath Palihapitiya',
    role: 'Investor (Social Capital)',
    twitterHandle: 'chaaborgy',
    pillars: ['markets', 'ai'],
  },
  {
    name: 'Sam Altman',
    role: 'CEO (OpenAI)',
    blogUrl: 'https://blog.samaltman.com',
    twitterHandle: 'sama',
    rssFeedUrl: 'https://blog.samaltman.com/feed',
    pillars: ['ai', 'markets'],
  },
  {
    name: 'Ray Dalio',
    role: 'Founder (Bridgewater)',
    twitterHandle: 'RayDalio',
    pillars: ['markets', 'mind'],
  },
  {
    name: 'Ilya Sutskever',
    role: 'Co-founder (Safe Superintelligence)',
    twitterHandle: 'iaborsky',
    pillars: ['ai'],
  },
]

/**
 * Research paper queries by domain
 * Three domains: cognitive science + AI/RL, markets/econometrics + AI/RL, blends
 */
export const RESEARCH_QUERIES = {
  'cognitive-science-ai': [
    { query: 'cat:cs.AI+AND+ti:reinforcement+learning+cognitive', label: 'Cognitive RL' },
    { query: 'cat:cs.AI+AND+ti:active+inference', label: 'Active Inference' },
    { query: 'cat:q-bio.NC+AND+ti:neural+computation+learning', label: 'Neural Computation' },
    { query: 'cat:cs.AI+AND+ti:reward+learning+brain', label: 'Reward & Brain' },
    { query: 'cat:cs.LG+AND+ti:meta+learning', label: 'Meta-Learning' },
  ],
  'markets-econometrics-ai': [
    { query: 'cat:q-fin.ST+AND+ti:reinforcement+learning', label: 'RL Trading' },
    { query: 'cat:q-fin.PM+AND+ti:portfolio+optimization', label: 'Portfolio Optimization' },
    { query: 'cat:stat.ML+AND+ti:time+series+forecasting', label: 'Time Series ML' },
    { query: 'cat:q-fin.CP+AND+ti:deep+learning', label: 'Deep Finance' },
    { query: 'cat:econ.EM+AND+ti:machine+learning', label: 'ML Econometrics' },
  ],
  'blend': [
    { query: 'cat:cs.AI+AND+ti:decision+making+under+uncertainty', label: 'Decision Under Uncertainty' },
    { query: 'cat:cs.MA+AND+ti:multi+agent+reinforcement', label: 'Multi-Agent RL' },
    { query: 'cat:cs.AI+AND+ti:causal+inference+reinforcement', label: 'Causal RL' },
    { query: 'cat:cs.LG+AND+ti:world+model', label: 'World Models' },
  ],
}
