'use client'

import { useState } from 'react'
import Image from 'next/image'
import SubTabs from './SubTabs'

const capabilities = [
  {
    title: 'Signal & screening pipelines',
    desc: 'Automated candidate surfacing from any universe — equities, options, dividends, alt data.',
  },
  {
    title: 'Risk & position sizing engines',
    desc: 'Rule-based systems that enforce your conviction framework without manual calculation.',
  },
  {
    title: 'Portfolio monitoring dashboards',
    desc: 'Surfaces what needs attention, not just what moved.',
  },
  {
    title: 'Data infrastructure',
    desc: 'ETL pipelines from market data feeds, broker APIs, and alternative sources.',
  },
  {
    title: 'AI analysis workflows',
    desc: 'LLM-powered extraction of signal from earnings calls, filings, and news.',
  },
]

const caseStudies = [
  {
    name: 'Dividend capture fund',
    meta: 'Emerging hedge fund · ~$1.5M AUM',
    summary:
      'Built the full automation stack for a dividend capture strategy — weekly candidate screening, position sizing, trade monitoring, and next-morning exit execution.',
    before: '4–6 hours/day of manual screening and execution',
    after: '30-minute daily review',
  },
  {
    name: 'Options analytics platform',
    meta: 'Personal R&D · live 2 years',
    summary:
      'Decision-intelligence system fusing market data, analyst signals, and options pricing to surface asymmetric trade opportunities.',
    highlight: { metric: '10x returns', text: 'over 2 years live. Currently backtesting to 2012.' },
  },
]

const projects = [
  {
    title: 'Options Analytics Dashboard',
    href: 'https://armstrong.loricorpuz.com',
    meta: 'F&F Investors',
    description:
      'A decision-intelligence platform that fuses market data, analyst signals, and options pricing to surface asymmetric trades.',
    highlight: { metric: '10x returns', text: 'over 2 years live. Currently backtesting to 2012.' },
  },
  {
    title: 'Manifold Careers',
    href: 'https://manifold.loricorpuz.com',
    meta: 'AI Agent',
    description:
      'An AI that scores job-resume fit, surfaces skill gaps, generates micro-projects to close them, and maps your fastest path to higher compensation.',
    highlight: { metric: 'Launching Feb 2026', text: 'at $30/month' },
    logo: '/manifoldlogo.svg',
  },
  {
    title: 'Ride Atlas',
    href: 'https://rideatlas.loricorpuz.com',
    meta: 'Bikepacking Planner',
    description:
      'Plan bikepacking and bike touring adventures with friends—routes, logistics, and coordination in one place.',
    highlight: { metric: '$10–30', text: 'per plan' },
  },
  {
    title: 'Bodhi Engine',
    href: 'https://bodhi.loricorpuz.com',
    meta: 'Contemplative Technology',
    description: 'Translating perennial wisdom into modern architecture for mind training.',
  },
  {
    title: 'Pocket Geneticist',
    meta: 'Personalized Wellness · Concept',
    description:
      'Leverages your DNA to map an optimized plan for your greatest well-being—nutrition, fitness, and lifestyle tailored to your genome.',
  },
  {
    title: 'Neurostack',
    meta: 'EEG, N=1 · Concept',
    description:
      'A multimodal biosensing dashboard designed to make latent cognitive representations observable, reproducible, and learnable.',
  },
  {
    title: 'Prediction Markets',
    meta: 'Coming soon',
    description:
      'Applied intelligence systems for extracting signal, belief dynamics, and edge from collective forecasts.',
  },
]

export default function OutputsSection() {
  const [activeTab, setActiveTab] = useState('services')

  return (
    <section className="bg-[#faf8f4]/90 backdrop-blur-sm rounded-sm p-5 -mx-5">
      <SubTabs
        tabs={[
          { id: 'services', label: 'Services' },
          { id: 'projects', label: 'Past Work' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'services' && (
        <div>
          <p className="text-[19px] font-medium text-[#1a1a1a] tracking-tight mb-4">
            I build automation systems for discretionary hedge funds.
          </p>

          <p className="text-[#333] mb-3">
            If your strategy works but execution is manual — screening takes hours, sizing is
            inconsistent, you can&apos;t scale without hiring — I architect the systems that
            industrialize your edge.
          </p>

          <p className="text-[#333] mb-7">
            Delivered as a fixed-scope engagement: I scope the system, build it, and hand it off
            production-ready.
          </p>

          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#1a1a1a] mb-3">
            What I build
          </h3>
          <div className="mb-8">
            {capabilities.map((cap, i) => (
              <div key={i} className="flex gap-3 mb-3">
                <span className="text-[#bbb] text-[15px] mt-[1px] shrink-0">—</span>
                <div>
                  <span className="text-[15px] text-[#1a1a1a] font-medium">{cap.title}</span>
                  <span className="text-[15px] text-[#555]"> — {cap.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#1a1a1a] mb-4">
            Case studies
          </h3>
          <div className="mb-8">
            {caseStudies.map((cs, i) => (
              <div key={i} className={i < caseStudies.length - 1 ? 'mb-6' : ''}>
                <h4 className="text-[17px] font-medium text-[#1a1a1a] mb-0.5">{cs.name}</h4>
                <p className="text-[13px] text-[#888] mb-2">{cs.meta}</p>
                <p className="text-[15px] text-[#555] mb-2.5">{cs.summary}</p>
                {cs.before && cs.after && (
                  <div className="text-sm text-[#444] py-3 px-4 bg-gradient-to-br from-[#f8f9fa] to-white border-l-[3px] border-[#1a1a1a] rounded-r">
                    <span className="text-[#888]">Before:</span>{' '}
                    <span className="text-[#555]">{cs.before}</span>
                    <span className="mx-2 text-[#ccc]">·</span>
                    <span className="text-[#888]">After:</span>{' '}
                    <span className="font-semibold text-[#1a1a1a]">{cs.after}</span>
                  </div>
                )}
                {cs.highlight && (
                  <div className="text-sm text-[#444] py-3 px-4 bg-gradient-to-br from-[#f8f9fa] to-white border-l-[3px] border-[#1a1a1a] rounded-r">
                    <span className="font-semibold text-[#1a1a1a] tracking-tight">
                      {cs.highlight.metric}
                    </span>{' '}
                    {cs.highlight.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-[15px] text-[#555]">
            Running a strategy that works but bottlenecked by process?{' '}
            <a
              href="mailto:loricorpuz@gmail.com"
              className="text-[#1a1a1a] border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors duration-200 no-underline"
            >
              loricorpuz@gmail.com
            </a>
          </p>
        </div>
      )}

      {activeTab === 'projects' && (
        <div>
          <p className="text-[13px] text-[#888] italic mb-5">
            Side projects built to learn edges of AI, markets, and product engineering.
          </p>
          {projects.map((project, i) => (
            <div key={i} className={`${i < projects.length - 1 ? 'mb-7' : ''}`}>
              <h3 className="text-[17px] font-medium mb-1">
                {project.logo && (
                  <Image
                    src={project.logo}
                    alt={project.title}
                    width={20}
                    height={20}
                    className="inline-block mr-2 align-middle h-5 w-auto"
                  />
                )}
                {project.href ? (
                  <a
                    href={project.href}
                    className="text-[#1a1a1a] no-underline border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.title}
                  </a>
                ) : (
                  project.title
                )}
              </h3>
              <p className="text-[13px] text-[#888] mb-1.5">{project.meta}</p>
              <p className="text-[#555] text-[15px]">{project.description}</p>
              {project.highlight && (
                <div className="mt-2.5 text-sm text-[#444] py-3 px-4 bg-gradient-to-br from-[#f8f9fa] to-white border-l-[3px] border-[#1a1a1a] rounded-r">
                  <span className="font-semibold text-[#1a1a1a] tracking-tight">
                    {project.highlight.metric}
                  </span>{' '}
                  {project.highlight.text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
