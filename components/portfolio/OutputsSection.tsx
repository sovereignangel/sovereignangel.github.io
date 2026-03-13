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
    name: 'Options analytics platform',
    meta: 'Personal R&D · live 2 years',
    summary:
      'Decision-intelligence system fusing market data, analyst signals, and options pricing to surface asymmetric trade opportunities.',
    highlight: { metric: '10x returns', text: 'over 2 years live. Currently backtesting to 2012.' },
  },
]

const projects = [
  {
    title: 'Manifold Careers',
    href: 'https://manifold.loricorpuz.com',
    description:
      'AI agent that scores job-resume fit, surfaces skill gaps, generates micro-projects to close them, and maps your fastest path to higher compensation. Built Jan–Feb 2026. Killed: red ocean, low motivation to develop moat, accelerated progress with investment engineering projects for hedge funds.',
    status: 'Killed',
    logo: '/manifoldlogo.svg',
  },
  {
    title: 'Options Analytics Platform',
    href: 'https://armstrong.loricorpuz.com',
    description:
      'Decision-intelligence system fusing market data, analyst signals, and options pricing to surface asymmetric trade opportunities.',
    status: 'Live',
  },
  {
    title: 'Ride Atlas',
    href: 'https://rideatlas.loricorpuz.com',
    description:
      'Plan bikepacking and bike touring adventures with friends — routes, logistics, and coordination in one place.',
    status: 'Live',
  },
  {
    title: 'Back of the Napkin',
    description:
      'Quick-sketch financial models for evaluating venture ideas — unit economics, TAM sizing, and scenario analysis in minutes.',
    status: 'In Development',
  },
  {
    title: 'Bodhi Engine',
    href: 'https://bodhi.loricorpuz.com',
    description: 'Translating perennial wisdom into modern architecture for mind training.',
    status: 'Concept',
  },
  {
    title: 'Arc',
    href: 'https://arc.loricorpuz.com',
    description:
      'One daily score across everything that matters — sleep, focus, learning, alignment. Not what you did, whether it moved the needle.',
    status: 'Concept',
  },
  {
    title: 'Neurostack',
    description:
      'A multimodal biosensing dashboard designed to make latent cognitive representations observable, reproducible, and learnable.',
    status: 'Concept',
  },
]

export default function OutputsSection() {
  const [activeTab, setActiveTab] = useState('services')

  return (
    <section className="bg-[#faf8f4]/50 backdrop-blur-sm rounded-sm p-5 -mx-5 font-serif">
      <SubTabs
        tabs={[
          { id: 'services', label: 'Services' },
          { id: 'projects', label: 'Projects' },
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
            Products and side projects across AI, markets, and cognitive science.
          </p>
          {projects.map((project, i) => (
            <div key={i} className={`${i < projects.length - 1 ? 'mb-7' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[17px] font-medium">
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
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-sm border ${
                  project.status === 'Live'
                    ? 'text-[#2d5f3f] border-[#2d5f3f]/20 bg-[#2d5f3f08]'
                    : project.status === 'In Beta'
                    ? 'text-[#8a6d2f] border-[#8a6d2f]/20 bg-[#8a6d2f08]'
                    : project.status === 'In Development'
                    ? 'text-[#8a6d2f] border-[#8a6d2f]/20 bg-[#8a6d2f08]'
                    : project.status === 'Killed'
                    ? 'text-[#8c2d2d] border-[#8c2d2d]/20 bg-[#8c2d2d08]'
                    : 'text-[#888] border-[#ddd] bg-white'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-[#555] text-[15px]">{project.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
