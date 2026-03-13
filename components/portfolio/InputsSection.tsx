'use client'

import { useState } from 'react'
import Image from 'next/image'
import SubTabs from './SubTabs'

export default function InputsSection() {
  const [activeTab, setActiveTab] = useState('classes')

  return (
    <section className="bg-[#faf8f4]/90 backdrop-blur-sm rounded-sm p-5 -mx-5">
      <SubTabs
        tabs={[
          { id: 'classes', label: 'Classes' },
          { id: 'content', label: 'Writing' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'classes' && (
        <div>
          <div className="mb-7">
            <h3 className="text-[17px] font-medium mb-1">
              <a
                href="https://online.stanford.edu/courses/xcs224r-deep-reinforcement-learning"
                className="text-[#1a1a1a] no-underline border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stanford CS224R — Deep Reinforcement Learning
              </a>
            </h3>
            <p className="text-[13px] text-[#888] mb-2">In Progress</p>
          </div>

          <div className="mb-7">
            <h3 className="text-[17px] font-medium mb-1">
              <a
                href="https://introtodeeplearning.com/"
                className="text-[#1a1a1a] no-underline border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                MIT 6.S191 — Deep Learning
              </a>
            </h3>
            <p className="text-[13px] text-[#888] mb-2">
              2nd Place, Final Project Competition · Jan 9, 2026
            </p>
            <p className="text-[#555] text-[15px] mb-4">
              Built a proof-of-concept demonstrating the feasibility of decoding dreams from fMRI data using deep learning and Stable Diffusion.
            </p>
            <div className="flex gap-3 mt-4">
              {['MITDL0.jpg', 'MITDL3.jpg', 'MITDL4.jpg'].map((src) => (
                <Image
                  key={src}
                  src={`/${src}`}
                  alt="MIT Deep Learning"
                  width={200}
                  height={140}
                  className="w-[calc(33.333%-8px)] h-[140px] object-cover rounded grayscale-[10%]"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div>
          <p className="text-[19px] font-medium text-[#1a1a1a] tracking-tight mb-4 font-serif">
            Writing
          </p>
          <div className="space-y-5">
            <div>
              <a
                href="/blog/building-a-macro-signal-pipeline"
                className="text-[17px] font-medium text-[#1a1a1a] no-underline border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors duration-200"
              >
                Building a Macro Signal Pipeline from Scratch
              </a>
              <p className="text-[13px] text-[#888] mt-1">March 12, 2026 · 8 min</p>
              <p className="text-[15px] text-[#555] mt-1">
                How I&apos;m building systematic infrastructure to translate macroeconomic data into actionable investment signals.
              </p>
            </div>
          </div>
          <a
            href="/blog"
            className="inline-block mt-6 text-[13px] text-[#999] hover:text-[#1a1a1a] transition-colors no-underline border-b border-[#ddd] hover:border-[#1a1a1a]"
          >
            All posts →
          </a>
        </div>
      )}


    </section>
  )
}
