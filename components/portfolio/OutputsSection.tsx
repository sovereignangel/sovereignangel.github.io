'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import SubTabs from './SubTabs'

const FunRouteBuilder = dynamic(() => import('./FunRouteBuilder'), {
  ssr: false,
  loading: () => <p className="text-sm text-[#888] italic">Loading route builder...</p>,
})

const projects = [
  {
    title: 'Options Analytics Dashboard',
    href: 'https://armstrong.loricorpuz.com',
    meta: 'F&F Investors',
    description: 'A decision-intelligence platform that fuses market data, analyst signals, and options pricing to surface asymmetric trades.',
    highlight: { metric: '10x returns', text: 'over 2 years live. Currently backtesting to 2012.' },
  },
  {
    title: 'Manifold Careers',
    href: 'https://manifold.loricorpuz.com',
    meta: 'AI Agent',
    description: 'An AI that scores job-resume fit, surfaces skill gaps, generates micro-projects to close them, and maps your fastest path to higher compensation.',
    highlight: { metric: 'Launching Feb 2026', text: 'at $30/month' },
    logo: '/manifoldlogo.svg',
  },
  {
    title: 'Ride Atlas',
    href: 'https://rideatlas.loricorpuz.com',
    meta: 'Bikepacking Planner',
    description: 'Plan bikepacking and bike touring adventures with friends—routes, logistics, and coordination in one place.',
    highlight: { metric: '$10–30', text: 'per plan' },
  },
  {
    title: 'Pocket Geneticist',
    meta: 'Personalized Wellness',
    description: 'Leverages your DNA to map an optimized plan for your greatest well-being—nutrition, fitness, and lifestyle tailored to your genome.',
  },
  {
    title: 'Neurostack',
    meta: 'EEG, N=1',
    description: 'A multimodal biosensing dashboard designed to make latent cognitive representations observable, reproducible, and learnable.',
  },
  {
    title: 'Bodhi Engine',
    href: 'https://bodhi.loricorpuz.com',
    meta: 'Contemplative Technology',
    description: 'Translating perennial wisdom into modern architecture for mind training.',
  },
  {
    title: 'Back of the Napkin',
    meta: 'AI Platform',
    description: 'An AI-powered platform that helps entrepreneurs rapidly validate, refine, and launch business ideas through real-time data, expert insights, and automated market analysis.',
  },
  {
    title: 'Prediction Markets',
    meta: 'Coming soon',
    description: 'Applied intelligence systems for extracting signal, belief dynamics, and edge from collective forecasts.',
  },
  {
    title: 'Scientific Frontier Daily',
    meta: 'Coming soon',
    description: 'A daily synthesis of ideas at the edge of science, AI, mind, and markets—compressed for signal, not noise.',
  },
]

export default function OutputsSection() {
  const [activeTab, setActiveTab] = useState('projects')

  return (
    <section>
      <SubTabs
        tabs={[
          { id: 'projects', label: 'Projects' },
          { id: 'blog', label: 'Blog' },
          { id: 'fun', label: 'Fun' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'projects' && (
        <div>
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

      {activeTab === 'blog' && (
        <p className="text-sm text-[#888] italic">Coming soon</p>
      )}

      {activeTab === 'fun' && (
        <FunRouteBuilder />
      )}
    </section>
  )
}
