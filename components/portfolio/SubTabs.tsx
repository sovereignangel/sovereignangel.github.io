'use client'

interface SubTabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (id: string) => void
}

export default function SubTabs({ tabs, activeTab, onTabChange }: SubTabsProps) {
  return (
    <div className="flex gap-6 mb-8 pb-3 border-b border-[#eee]">
      {tabs.map((tab) => (
        <a
          key={tab.id}
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onTabChange(tab.id)
          }}
          className={`text-sm no-underline transition-colors duration-200 ${
            activeTab === tab.id
              ? 'text-[#1a1a1a] font-medium'
              : 'text-[#999] hover:text-[#666]'
          }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
  )
}
