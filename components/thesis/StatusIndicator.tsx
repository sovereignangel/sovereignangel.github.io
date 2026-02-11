interface StatusIndicatorProps {
  status: 'regulated' | 'slightly_spiked' | 'spiked' | 'spine' | 'pre_launch' | 'backup' | 'archived' | 'optionality' | 'open' | 'neutral' | 'tense'
  label?: string
  size?: 'sm' | 'md'
}

const statusStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  regulated: { bg: 'bg-green-bg', text: 'text-green-ink', border: 'border-green-ink/20', label: 'Regulated' },
  slightly_spiked: { bg: 'bg-amber-bg', text: 'text-amber-ink', border: 'border-amber-ink/20', label: 'Slightly Spiked' },
  spiked: { bg: 'bg-red-bg', text: 'text-red-ink', border: 'border-red-ink/20', label: 'Spiked' },
  spine: { bg: 'bg-green-bg', text: 'text-green-ink', border: 'border-green-ink/20', label: 'Spine' },
  pre_launch: { bg: 'bg-amber-bg', text: 'text-amber-ink', border: 'border-amber-ink/20', label: 'Pre-launch' },
  optionality: { bg: 'bg-amber-bg', text: 'text-amber-ink', border: 'border-amber-ink/20', label: 'Optionality' },
  backup: { bg: 'bg-navy-bg', text: 'text-navy', border: 'border-navy/20', label: 'Backup' },
  archived: { bg: 'bg-red-bg', text: 'text-red-ink', border: 'border-red-ink/20', label: 'Archived' },
  open: { bg: 'bg-green-bg', text: 'text-green-ink', border: 'border-green-ink/20', label: 'Open' },
  neutral: { bg: 'bg-amber-bg', text: 'text-amber-ink', border: 'border-amber-ink/20', label: 'Neutral' },
  tense: { bg: 'bg-red-bg', text: 'text-red-ink', border: 'border-red-ink/20', label: 'Tense' },
}

export default function StatusIndicator({ status, label, size = 'sm' }: StatusIndicatorProps) {
  const style = statusStyles[status] || statusStyles.neutral
  const displayLabel = label || style.label

  return (
    <span className={`inline-flex items-center font-serif uppercase tracking-wider border rounded-sm ${style.bg} ${style.text} ${style.border} ${
      size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-3 py-1'
    }`}>
      {displayLabel}
    </span>
  )
}
