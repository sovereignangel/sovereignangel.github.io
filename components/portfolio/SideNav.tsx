'use client'

type Section = 'about' | 'inputs' | 'outputs' | 'thesis'

interface SideNavProps {
  activeSection: Section
  onSectionChange: (section: Section) => void
}

export default function SideNav({ activeSection, onSectionChange }: SideNavProps) {
  const sections: { id: Section; label: string }[] = [
    { id: 'about', label: 'About' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'outputs', label: 'Outputs' },
    { id: 'thesis', label: 'Thesis' },
  ]

  return (
    <nav className="fixed top-20 right-12 flex flex-col gap-3 text-right max-[900px]:static max-[900px]:flex-row max-[900px]:justify-center max-[900px]:gap-6 max-[900px]:mb-8 max-[900px]:pt-4 max-[900px]:px-6 max-[900px]:text-center max-[480px]:flex-wrap max-[480px]:gap-4 z-10">
      {sections.map((section) => (
        <a
          key={section.id}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onSectionChange(section.id)
          }}
          className={`text-sm no-underline transition-colors duration-200 ${
            activeSection === section.id
              ? 'text-[#1a1a1a] font-medium'
              : section.id === 'thesis'
              ? 'text-navy hover:text-navy-light font-medium'
              : 'text-[#999] hover:text-[#666]'
          }`}
        >
          {section.label}
        </a>
      ))}
    </nav>
  )
}
