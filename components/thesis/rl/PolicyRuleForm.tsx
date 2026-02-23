'use client'

import { useState } from 'react'
import type { PolicyRule, PolicyCondition, PolicyConditionOperator } from '@/lib/types'
import type { ActionType } from '@/lib/types'

const ACTIONS: ActionType[] = ['ship', 'ask', 'signal', 'regulate', 'explore', 'compound']
const COMPONENTS = ['ge', 'gi', 'gvc', 'kappa', 'optionality', 'gd', 'gn', 'j', 'sigma', 'gate'] as const
const OPERATORS: PolicyConditionOperator[] = ['>', '<', '>=', '<=']

interface PolicyRuleFormProps {
  rule?: PolicyRule
  onSave: (data: Partial<PolicyRule>) => void
  onCancel: () => void
}

export default function PolicyRuleForm({ rule, onSave, onCancel }: PolicyRuleFormProps) {
  const [name, setName] = useState(rule?.name || '')
  const [action, setAction] = useState<ActionType>(rule?.action || 'ship')
  const [reasoning, setReasoning] = useState(rule?.reasoning || '')
  const [conditions, setConditions] = useState<PolicyCondition[]>(
    rule?.conditions || [{ component: 'ge', operator: '>', value: 0.5 }]
  )

  const addCondition = () => {
    setConditions([...conditions, { component: 'ge', operator: '>', value: 0.5 }])
  }

  const removeCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx))
  }

  const updateCondition = (idx: number, field: keyof PolicyCondition, val: string | number) => {
    setConditions(conditions.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  const handleSubmit = () => {
    if (!name.trim() || conditions.length === 0) return
    onSave({
      name: name.trim(),
      action,
      reasoning: reasoning.trim(),
      conditions,
    })
  }

  return (
    <div className="bg-cream border border-rule rounded-sm p-3 space-y-2">
      <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
        {rule ? 'Edit Policy Rule' : 'New Policy Rule'}
      </h4>

      {/* Name */}
      <div>
        <label className="font-sans text-[10px] text-ink-muted block mb-0.5">Rule Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Regulate when energy low"
          className="w-full font-sans text-[10px] bg-white border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
        />
      </div>

      {/* Conditions */}
      <div>
        <label className="font-sans text-[10px] text-ink-muted block mb-0.5">
          When (all conditions must be true):
        </label>
        {conditions.map((cond, idx) => (
          <div key={idx} className="flex items-center gap-1 mb-1">
            <select
              value={cond.component}
              onChange={e => updateCondition(idx, 'component', e.target.value)}
              className="font-mono text-[10px] bg-white border border-rule rounded-sm px-1 py-0.5"
            >
              {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={cond.operator}
              onChange={e => updateCondition(idx, 'operator', e.target.value)}
              className="font-mono text-[10px] bg-white border border-rule rounded-sm px-1 py-0.5 w-10"
            >
              {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={cond.value}
              onChange={e => updateCondition(idx, 'value', parseFloat(e.target.value) || 0)}
              className="font-mono text-[10px] bg-white border border-rule rounded-sm px-1 py-0.5 w-14"
            />
            {conditions.length > 1 && (
              <button
                onClick={() => removeCondition(idx)}
                className="font-mono text-[10px] text-red-ink hover:text-red-ink/80 px-1"
              >
                x
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addCondition}
          className="font-serif text-[9px] text-burgundy hover:text-burgundy/80"
        >
          + Add condition
        </button>
      </div>

      {/* Action */}
      <div>
        <label className="font-sans text-[10px] text-ink-muted block mb-0.5">Then do:</label>
        <div className="flex gap-1 flex-wrap">
          {ACTIONS.map(a => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border transition-colors ${
                action === a
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-white text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <div>
        <label className="font-sans text-[10px] text-ink-muted block mb-0.5">Reasoning</label>
        <textarea
          value={reasoning}
          onChange={e => setReasoning(e.target.value)}
          placeholder="Why this rule? What's the evidence or intuition?"
          className="w-full font-sans text-[10px] bg-white border border-rule rounded-sm px-1.5 py-1 min-h-[40px] resize-y focus:outline-none focus:border-burgundy"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1">
        <button
          onClick={handleSubmit}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
        >
          {rule ? 'Update' : 'Save Rule'}
        </button>
        <button
          onClick={onCancel}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:border-ink-faint transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
