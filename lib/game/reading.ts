/**
 * Canon — what to read next, per mastery.
 *
 * Not a reading list. The reading list already exists: the complexity
 * economics library lives in lib/complexecon/pathway.ts with tiers and
 * verified sources, and reading sessions live in Firestore behind /read. This
 * module only answers the board's question, which is narrower and more useful
 * on a single screen: given where you stand in a tree, what are the next
 * three things worth opening.
 *
 * So the CEcon canon is derived from the existing library rather than retyped
 * — one list, two views. Quant and Signal have no library of their own yet, so
 * theirs is written here, from the priority matrix in DeepOps/armstrong_primer.md
 * where finance-adapted classical ML is Tier 1 and everything else waits.
 */

import { LIBRARY } from '@/lib/complexecon/pathway'
import type { TreeId } from './trees'

export interface CanonItem {
  title: string
  author: string
  year: string
  /** Why this one, in a handful of words. */
  why: string
  href?: string
}

export interface Canon {
  tree: TreeId
  label: string
  /** Where the full list lives. */
  moreHref: string
  moreLabel: string
  items: CanonItem[]
}

/** Spine items from the complexity library, in the order the pathway reads them. */
function ceconSpine(): CanonItem[] {
  const wanted = ['complexity', 'performativity', 'inequality']
  const picked: CanonItem[] = []
  for (const topic of LIBRARY) {
    if (!wanted.includes(topic.id)) continue
    for (const item of topic.items) {
      if (item.tier !== 'spine') continue
      picked.push({
        title: item.title,
        author: item.author,
        year: item.year,
        why: item.note,
        href: '/complexecon',
      })
    }
  }
  return picked.slice(0, 4)
}

export const CANON: Canon[] = [
  {
    tree: 'cecon',
    label: 'Complexity Economics',
    moreHref: '/complexecon',
    moreLabel: 'Full library',
    items: ceconSpine(),
  },
  {
    tree: 'quant',
    label: 'Quant',
    moreHref: '/read',
    moreLabel: 'Reading',
    items: [
      {
        title: 'Advances in Financial Machine Learning',
        author: 'López de Prado',
        year: '2018',
        why: 'Purged and embargoed CV, triple-barrier, meta-labelling. Tier 1 — nothing else counts until this holds.',
      },
      {
        title: 'Machine Learning for Asset Managers',
        author: 'López de Prado',
        year: '2020',
        why: 'Deflated Sharpe and denoising — the gate the L2 rung is written against.',
      },
      {
        title: 'Deep Hedging',
        author: 'Buehler et al.',
        year: '2019',
        why: 'The most directly applicable RL innovation to a LEAP book in a decade.',
      },
      {
        title: 'Forecasting: Principles and Practice',
        author: 'Hyndman & Athanasopoulos',
        year: '2021',
        why: 'Stationarity and cointegration, free online. The gap the macro-signals work keeps hitting.',
      },
    ],
  },
  {
    tree: 'signal',
    label: 'Finding Signal',
    moreHref: '/read',
    moreLabel: 'Reading',
    items: [
      {
        title: 'The Deflated Sharpe Ratio',
        author: 'Bailey & López de Prado',
        year: '2014',
        why: 'What a signal has to survive before it is allowed to cost you time.',
      },
      {
        title: '…and the Cross-Section of Expected Returns',
        author: 'Harvey, Liu & Zhu',
        year: '2016',
        why: 'Multiple testing in factor discovery — why the kill ratio has to exceed one.',
      },
      {
        title: 'Why Most Published Research Findings Are False',
        author: 'Ioannidis',
        year: '2005',
        why: 'The base rate you are working against, stated plainly.',
      },
      {
        title: 'The Preregistration Revolution',
        author: 'Nosek et al.',
        year: '2018',
        why: 'The discipline PJ-2 depends on, and the reason it is written before the result.',
      },
    ],
  },
]
