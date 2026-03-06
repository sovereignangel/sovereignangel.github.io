import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyAuth } from '@/lib/api-auth'
import { FieldValue } from 'firebase-admin/firestore'

const SEED_PAPERS = [
  {
    title: 'Implement PPO / DQN from Scratch',
    authors: ['Schulman et al.', 'Mnih et al.'],
    abstract: 'Implement Proximal Policy Optimization or Deep Q-Network from scratch using PyTorch and train on Gymnasium environments. Covers policy gradients, clipped surrogate objectives, experience replay, and target networks.',
    paperUrl: 'https://arxiv.org/abs/1707.06347',
    year: 2017,
    pillars: ['ai'],
    domain: 'classic-rl',
    keyConceptsToImplement: ['policy gradient', 'clipped surrogate', 'GAE', 'experience replay', 'target network'],
    difficulty: 'medium',
    estimatedHours: 8,
    blogTitle: 'PPO from Scratch: What the Training Loop Actually Does',
  },
  {
    title: 'Custom RL Environment: Attention Allocation',
    authors: ['Self-designed'],
    abstract: 'Design a custom Gymnasium environment for attention/time allocation across projects. Train an agent using Stable Baselines3 and evaluate different reward functions. Your differentiator: connects RL to the Thesis Engine reward shaping problem.',
    paperUrl: '',
    year: 2026,
    pillars: ['ai', 'mind'],
    domain: 'environment-design',
    keyConceptsToImplement: ['custom gym env', 'reward shaping', 'multi-objective reward', 'Stable Baselines3', 'evaluation metrics'],
    difficulty: 'medium',
    estimatedHours: 10,
    blogTitle: 'Designing My Own RL Environment: Attention as a Scarce Resource',
  },
  {
    title: 'Reproduce a Recent ML/RL Paper',
    authors: ['TBD — pick from professor feed'],
    abstract: 'Pick a recent ML or RL paper and reproduce results end-to-end. Document hyperparameters, training curves, and deviations from reported results. Focus on the gap between paper claims and actual reproducibility.',
    paperUrl: '',
    year: 2025,
    pillars: ['ai'],
    domain: 'reproducibility',
    keyConceptsToImplement: ['hyperparameter search', 'training curves', 'ablation study', 'reproducibility checklist'],
    difficulty: 'high',
    estimatedHours: 12,
    blogTitle: 'Paper Reproduction Log: What the Authors Didn\'t Tell You',
  },
  {
    title: 'Transformer Architecture from Scratch',
    authors: ['Vaswani et al.'],
    abstract: 'Implement a simplified Transformer (attention is all you need) from scratch in PyTorch. Train on a small dataset and analyze attention patterns. Covers multi-head attention, positional encoding, layer normalization.',
    paperUrl: 'https://arxiv.org/abs/1706.03762',
    year: 2017,
    pillars: ['ai'],
    domain: 'deep-learning-fundamentals',
    keyConceptsToImplement: ['multi-head attention', 'positional encoding', 'layer norm', 'attention visualization', 'masked self-attention'],
    difficulty: 'medium',
    estimatedHours: 8,
    blogTitle: 'The Annotated Transformer: Building Attention from First Principles',
  },
  {
    title: 'RL for Tool-Using Agents',
    authors: ['Schick et al.', 'Yao et al.'],
    abstract: 'Train an agent to choose tools or APIs to solve tasks (planning, information retrieval). Connects RL with modern AI agent architectures — ReAct, Toolformer, function calling.',
    paperUrl: 'https://arxiv.org/abs/2210.03629',
    year: 2023,
    pillars: ['ai'],
    domain: 'agent-architectures',
    keyConceptsToImplement: ['tool selection policy', 'ReAct loop', 'action space over APIs', 'reward from task completion', 'planning under uncertainty'],
    difficulty: 'high',
    estimatedHours: 12,
    blogTitle: 'Teaching an Agent to Use Tools: RL Meets Function Calling',
  },
  {
    title: 'Mechanistic Interpretability Experiment',
    authors: ['Neel Nanda', 'Anthropic interpretability team'],
    abstract: 'Replicate mechanistic interpretability work — analyze neuron activations in a trained model. Probe for features, circuits, and superposition. Alignment-style research thinking.',
    paperUrl: 'https://arxiv.org/abs/2211.00593',
    year: 2022,
    pillars: ['ai'],
    domain: 'interpretability',
    keyConceptsToImplement: ['activation patching', 'probing classifiers', 'feature visualization', 'superposition', 'circuit analysis'],
    difficulty: 'high',
    estimatedHours: 10,
    blogTitle: 'Looking Inside the Black Box: A Mechanistic Interpretability Experiment',
  },
  {
    title: 'Training Efficiency Experiment',
    authors: ['Self-designed'],
    abstract: 'Systematic experiment with training stability: batch sizes, learning rates, optimizers (Adam vs SGD vs AdaFactor), warmup schedules. Compare results across runs with proper statistical reporting.',
    paperUrl: '',
    year: 2026,
    pillars: ['ai'],
    domain: 'training-dynamics',
    keyConceptsToImplement: ['learning rate schedules', 'optimizer comparison', 'loss landscape', 'gradient statistics', 'Weights & Biases logging'],
    difficulty: 'medium',
    estimatedHours: 6,
    blogTitle: 'The Training Efficiency Handbook: What Actually Matters',
  },
  {
    title: 'Multi-Agent RL Simulation',
    authors: ['Lowe et al.', 'Lanctot et al.'],
    abstract: 'Create a simple environment where multiple agents interact (competition or cooperation). Implement MADDPG or independent learners. Study emergent behaviors and equilibria.',
    paperUrl: 'https://arxiv.org/abs/1706.02275',
    year: 2017,
    pillars: ['ai'],
    domain: 'multi-agent-rl',
    keyConceptsToImplement: ['MADDPG', 'centralized critic', 'decentralized execution', 'emergent communication', 'Nash equilibrium'],
    difficulty: 'high',
    estimatedHours: 12,
    blogTitle: 'When Agents Meet: Emergent Behavior in Multi-Agent RL',
  },
  {
    title: 'Offline RL: Learning from Logged Data',
    authors: ['Levine et al.', 'Kumar et al.'],
    abstract: 'Train policies from logged datasets instead of live environments. Implement Conservative Q-Learning (CQL) or Decision Transformer. Practical RL skills relevant to industry where online interaction is expensive.',
    paperUrl: 'https://arxiv.org/abs/2005.01643',
    year: 2020,
    pillars: ['ai'],
    domain: 'offline-rl',
    keyConceptsToImplement: ['CQL', 'Decision Transformer', 'distributional shift', 'behavior cloning baseline', 'D4RL benchmarks'],
    difficulty: 'high',
    estimatedHours: 10,
    blogTitle: 'Offline RL: Training Without the Environment',
  },
  {
    title: 'Open-Source Contribution to CleanRL',
    authors: ['Huang et al.'],
    abstract: 'Contribute improvements or experiments to CleanRL or similar RL library. Could be a new algorithm implementation, benchmark result, or documentation improvement. Signals collaboration with the research ecosystem.',
    paperUrl: 'https://github.com/vwxyzjn/cleanrl',
    year: 2022,
    pillars: ['ai'],
    domain: 'open-source',
    keyConceptsToImplement: ['single-file implementation', 'Weights & Biases integration', 'reproducible benchmarks', 'PR workflow', 'code review'],
    difficulty: 'medium',
    estimatedHours: 8,
    blogTitle: 'My First Open-Source RL Contribution: What I Learned',
  },
]

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  const today = new Date().toISOString().slice(0, 10)
  const colRef = adminDb.collection(`users/${auth.uid}/paper_implementations`)

  const batch = adminDb.batch()
  for (const paper of SEED_PAPERS) {
    const ref = colRef.doc()
    batch.set(ref, {
      ...paper,
      status: 'queued',
      queuedAt: today,
      actualHours: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()

  return NextResponse.json({ success: true, count: SEED_PAPERS.length })
}
