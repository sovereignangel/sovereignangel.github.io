'use client'

import { useState } from 'react'
import SideNav from '@/components/portfolio/SideNav'
import Header from '@/components/portfolio/Header'
import AboutSection from '@/components/portfolio/AboutSection'
import InputsSection from '@/components/portfolio/InputsSection'
import OutputsSection from '@/components/portfolio/OutputsSection'
import ThesisSection from '@/components/portfolio/ThesisSection'
import Footer from '@/components/portfolio/Footer'

type Section = 'about' | 'inputs' | 'outputs' | 'thesis'

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('about')

  return (
    <>
      <SideNav activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="max-w-[640px] mx-auto py-20 px-6 max-[480px]:py-12 max-[480px]:px-5">
        <Header />
        {activeSection === 'about' && <AboutSection />}
        {activeSection === 'inputs' && <InputsSection />}
        {activeSection === 'outputs' && <OutputsSection />}
        {activeSection === 'thesis' && <ThesisSection />}
        <Footer />
      </div>
    </>
  )
}
