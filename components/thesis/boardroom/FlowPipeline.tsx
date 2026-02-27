'use client'

interface FlowStage {
  id: string
  label: string
  count: number
  alert?: number   // count of items needing attention
  scrollTo: string // section id to scroll to
  ready?: number   // items ready to advance to next stage
}

interface FlowPipelineProps {
  stages: FlowStage[]
  activeSection?: string
  onStageClick: (sectionId: string) => void
}

export default function FlowPipeline({ stages, activeSection, onStageClick }: FlowPipelineProps) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto">
      {stages.map((stage, i) => {
        const isActive = activeSection === stage.scrollTo
        const hasAlert = stage.alert != null && stage.alert > 0
        const hasReady = stage.ready != null && stage.ready > 0

        return (
          <div key={stage.id} className="flex items-center shrink-0">
            <button
              onClick={() => onStageClick(stage.scrollTo)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm transition-colors ${
                isActive
                  ? 'bg-burgundy-bg border border-burgundy/20'
                  : 'hover:bg-cream/50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isActive ? 'bg-burgundy' : hasAlert ? 'bg-amber-ink' : 'bg-ink-faint'
              }`} />
              <span className={`font-mono text-[9px] uppercase font-semibold ${
                isActive ? 'text-burgundy' : 'text-ink-muted'
              }`}>
                {stage.label}
              </span>
              {stage.count > 0 && !hasAlert && (
                <span className={`font-mono text-[9px] font-semibold ${
                  isActive ? 'text-burgundy' : 'text-ink-muted'
                }`}>
                  {stage.count}
                </span>
              )}
              {hasAlert && (
                <span className="font-mono text-[9px] font-semibold text-amber-ink">
                  {stage.alert}
                </span>
              )}
            </button>
            {/* Gate indicator between stages */}
            {i < stages.length - 1 && (
              <div className="flex items-center mx-0.5">
                {hasReady ? (
                  <span className="font-mono text-[8px] text-green-ink" title={`${stage.ready} ready to advance`}>
                    →{stage.ready}
                  </span>
                ) : (
                  <span className="text-[9px] text-ink-faint">&rarr;</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
