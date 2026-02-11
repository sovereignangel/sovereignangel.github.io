interface ProgressBarProps {
  current: number
  target: number
  label?: string
  showValues?: boolean
}

export default function ProgressBar({ current, target, label, showValues = true }: ProgressBarProps) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0

  return (
    <div>
      {(label || showValues) && (
        <div className="flex justify-between items-baseline mb-1">
          {label && (
            <span className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">
              {label}
            </span>
          )}
          {showValues && (
            <span className="font-mono text-[11px] text-ink-light">
              {current} / {target}
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-rule-light rounded-sm overflow-hidden">
        <div
          className="h-full bg-navy rounded-sm transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
