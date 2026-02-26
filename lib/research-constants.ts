/**
 * Shared research constants used across Intelligence tab and Research NorthStar
 */

import type { ResearchProfessor, ResearchDomain } from '@/lib/types/research'
import type { DocumentSourceType } from '@/lib/types/reading'

// ─── Thesis Vector ──────────────────────────────────────────────────────────

export const CORE_QUESTION =
  'How does intelligence structure itself to expand agency over time?'

export const DIRECTION = 'Computational Cognitive Science × Reinforcement Learning'

export const DEFAULT_THESIS =
  'How does intelligence structure itself to expand agency over time? Computational Cognitive Science × Reinforcement Learning. Portfolio construction, venture building, and complex systems.'

// ─── Research Domains ───────────────────────────────────────────────────────

export const DOMAINS: ResearchDomain[] = [
  { key: 'empowerment', label: 'Empowerment Theory', description: 'Maximizing future controllable states — intrinsic reward without extrinsic signal' },
  { key: 'intrinsic', label: 'Intrinsic Motivation', description: 'Curiosity-driven RL, information gain, novelty seeking' },
  { key: 'hierarchical', label: 'Hierarchical RL', description: 'POMDPs, options framework, temporal abstraction' },
  { key: 'meta-rl', label: 'Meta-RL', description: 'Learning to learn — adaptive policy selection, fast generalization' },
  { key: 'active-inference', label: 'Active Inference', description: 'Free energy minimization, predictive processing, belief updating' },
  { key: 'world-models', label: 'World Models', description: 'Model-based planning, successor representations, cognitive maps' },
  { key: 'multi-objective', label: 'Multi-Objective RL', description: 'Neuromodulator-inspired multi-signal reward, distributional RL' },
]

// ─── Engine → Research Bridge ───────────────────────────────────────────────

export const BRIDGE_MAPPINGS = [
  { engine: 'Reward Function', research: 'Multi-objective RL, empowerment as intrinsic reward', domain: 'empowerment' },
  { engine: 'Daily Log → State', research: 'Computational model of human decision-making under uncertainty', domain: 'world-models' },
  { engine: 'RL Module', research: 'Successor representations, hierarchical POMDP exploration', domain: 'hierarchical' },
  { engine: 'Journal → Extraction', research: 'Natural language → structured state observation pipeline', domain: 'meta-rl' },
  { engine: 'Garmin / EEG', research: 'Neurofeedback RL, biometric reward shaping', domain: 'intrinsic' },
  { engine: 'Coherence (Theta)', research: 'Multi-objective alignment across time horizons', domain: 'multi-objective' },
]

// ─── Professors ─────────────────────────────────────────────────────────────

export const PROFESSORS: ResearchProfessor[] = [
  {
    id: 'gershman',
    name: 'Sam Gershman',
    institution: 'Harvard',
    field: 'Computational Neuroscience / RL',
    focus: ['Model-based vs model-free', 'Cognitive maps', 'Successor representations', 'Exploration'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=bVT6aqoAAAAJ',
    labUrl: 'https://gershmanlab.com',
    relevance: 'Cleanest overlap — empowerment, intrinsic motivation, cognitive control',
  },
  {
    id: 'tenenbaum',
    name: 'Josh Tenenbaum',
    institution: 'MIT',
    field: 'Computational Cognitive Science',
    focus: ['Probabilistic reasoning', 'Program induction', 'Concept learning', 'Structured world models'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=rRJ9wTJMUB8C',
    labUrl: 'https://cocosci.mit.edu',
    relevance: 'Internal generative models — world-model / meta-architecture thinking',
  },
  {
    id: 'griffiths',
    name: 'Tom Griffiths',
    institution: 'Princeton',
    field: 'Bayesian Cognition',
    focus: ['Decision-making under uncertainty', 'Human inference', 'Planning', 'Rational process models'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=eAaoj6sAAAAJ',
    labUrl: 'https://cocosci.princeton.edu',
    relevance: 'Strategic reasoning models, hierarchical RL + belief updating',
  },
  {
    id: 'littman',
    name: 'Michael Littman',
    institution: 'Brown',
    field: 'RL Theory',
    focus: ['Hierarchical RL', 'POMDPs', 'Multi-agent systems', 'RL foundations'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=Gx_JJ3gAAAAJ',
    labUrl: 'https://www.littmania.com',
    relevance: 'POMDP formalism, hierarchical decision-making theory',
  },
  {
    id: 'finn',
    name: 'Chelsea Finn',
    institution: 'Stanford',
    field: 'Meta-Learning',
    focus: ['Learning to learn', 'Adaptation', 'Fast generalization', 'Few-shot learning'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=vfPE6hgAAAAJ',
    labUrl: 'https://ai.stanford.edu/~cbfinn/',
    relevance: 'Meta-optimization, adaptive policy — learning how to learn',
  },
  {
    id: 'levine',
    name: 'Sergey Levine',
    institution: 'UC Berkeley',
    field: 'Reinforcement Learning',
    focus: ['Model-based RL', 'Offline RL', 'Decision transformers', 'Real-world RL'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=8R35rCwAAAAJ',
    labUrl: 'https://rail.eecs.berkeley.edu',
    relevance: 'Applied RL at scale, decision transformers',
  },
  {
    id: 'friston',
    name: 'Karl Friston',
    institution: 'UCL',
    field: 'Active Inference',
    focus: ['Free energy principle', 'Predictive processing', 'Agency under uncertainty'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=q_4u0aoAAAAJ',
    labUrl: 'https://www.fil.ion.ucl.ac.uk/~karl/',
    relevance: 'Philosophical alignment — agency as free energy minimization',
  },
  {
    id: 'abbeel',
    name: 'Pieter Abbeel',
    institution: 'UC Berkeley',
    field: 'Hierarchical RL / Robotics',
    focus: ['Imitation learning', 'Hierarchical RL', 'Scalable control', 'Foundation models for RL'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=vtwH6GkAAAAJ',
    labUrl: 'https://people.eecs.berkeley.edu/~pabbeel/',
    relevance: 'Hierarchical RL systems, scalable control architectures',
  },
  {
    id: 'sadigh',
    name: 'Dorsa Sadigh',
    institution: 'Stanford',
    field: 'Human-in-the-Loop RL',
    focus: ['Interactive learning', 'Alignment', 'Human-robot interaction', 'Preference learning'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=HbFHkJkAAAAJ',
    labUrl: 'https://iliad.stanford.edu',
    relevance: 'Agency + real-world decision systems, human-aligned RL',
  },
  {
    id: 'krakauer_d',
    name: 'David Krakauer',
    institution: 'Santa Fe Institute',
    field: 'Complex Systems + Intelligence',
    focus: ['Collective computation', 'Information theory', 'Adaptive systems', 'Cognitive evolution'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=0gVkfxIAAAAJ',
    labUrl: 'https://www.santafe.edu/people/profile/david-krakauer',
    relevance: 'Macro-level intelligence theory, complex adaptive systems',
  },
]

// ─── Foundation Reading Stack ───────────────────────────────────────────────

export interface FoundationItem {
  title: string
  author: string
  status: 'core' | 'queue' | 'done'
  sourceUrl: string
  sourceType: DocumentSourceType
}

export const FOUNDATION_STACK: FoundationItem[] = [
  {
    title: 'Reinforcement Learning: An Introduction',
    author: 'Sutton & Barto',
    status: 'core',
    sourceUrl: 'http://incompleteideas.net/book/RLbook2020.pdf',
    sourceType: 'direct_url',
  },
  {
    title: 'Theoretical Neuroscience',
    author: 'Dayan & Abbott',
    status: 'core',
    sourceUrl: 'https://archive.org/download/theoretical-neuroscience/Theoretical%20Neuroscience.pdf',
    sourceType: 'archive_org',
  },
  {
    title: 'Vision (Levels of Analysis)',
    author: 'David Marr',
    status: 'core',
    sourceUrl: 'https://archive.org/download/marrvision/marr-vision.pdf',
    sourceType: 'archive_org',
  },
  {
    title: 'Empowerment — An Introduction',
    author: 'Klyubin, Polani, Nehaniv',
    status: 'queue',
    sourceUrl: 'https://arxiv.org/pdf/0811.4376',
    sourceType: 'arxiv_pdf',
  },
  {
    title: 'Curiosity-Driven Exploration by Self-Supervised Prediction',
    author: 'Pathak et al.',
    status: 'queue',
    sourceUrl: 'https://arxiv.org/pdf/1705.05363',
    sourceType: 'arxiv_pdf',
  },
  {
    title: 'Active Inference: The Free Energy Principle in Mind, Brain, and Behavior',
    author: 'Friston et al.',
    status: 'queue',
    sourceUrl: 'https://arxiv.org/pdf/2201.04011',
    sourceType: 'arxiv_pdf',
  },
  {
    title: 'The Successor Representation in Human Reinforcement Learning',
    author: 'Momennejad et al.',
    status: 'queue',
    sourceUrl: 'https://www.biorxiv.org/content/10.1101/083824v2.full.pdf',
    sourceType: 'direct_url',
  },
]

// ─── Research Keywords ──────────────────────────────────────────────────────

export const RESEARCH_KEYWORDS = [
  'empowerment', 'agency', 'reward function', 'reinforcement learning', 'rl',
  'pomdp', 'hierarchy', 'meta-learning', 'world model', 'active inference',
  'bayesian', 'exploration', 'intrinsic motivation', 'curiosity', 'successor',
  'cognitive', 'intelligence', 'phd', 'research', 'professor', 'paper',
  'gershman', 'tenenbaum', 'griffiths', 'littman', 'finn', 'friston',
  'thesis engine', 'decision architecture', 'credit assignment', 'belief',
  'dopamine', 'neuroscience', 'consciousness', 'eeg', 'representation',
]

export const EMERGENCE_KEYWORDS = [
  'complexity', 'emergence', 'phase transition', 'scaling law', 'power law',
  'chaos', 'entropy', 'self-organization', 'critical', 'fractal', 'nonlinear',
  'attractor', 'bifurcation', 'santa fe', 'krakauer', 'complex adaptive',
  'dissipative', 'far from equilibrium', 'thermodynamics', 'information theory',
  'network effect', 'percolation', 'renormalization', 'universality',
]

export const MIND_KEYWORDS = [
  'journal', 'belief', 'decision', 'calibration', 'confidence', 'psycap',
  'nervous system', 'regulation', 'sleep', 'energy', 'hope', 'efficacy',
  'resilience', 'optimism', 'coherence', 'pattern', 'habit', 'reflection',
]
