'use client'

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import SubTabs from './SubTabs'

const BookSpeechReader = dynamic(() => import('./BookSpeechReader'), { ssr: false })

export default function InputsSection() {
  const [activeTab, setActiveTab] = useState('classes')

  return (
    <section>
      <SubTabs
        tabs={[
          { id: 'classes', label: 'Classes' },
          { id: 'content', label: 'Content' },
          { id: 'audio', label: 'Principle Distillation' },
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
        <div className="mt-6 overflow-hidden rounded">
          <iframe
            src="https://v2-embednotion.com/1cc74dadd2774eb2a53eb5f57279f6e7"
            className="w-[142%] h-[850px] border-none origin-top-left scale-[0.7]"
          />
        </div>
      )}

      {activeTab === 'audio' && (
        <div className="mt-4 -mx-6">
          <BookSpeechReader />
        </div>
      )}
    </section>
  )
}
