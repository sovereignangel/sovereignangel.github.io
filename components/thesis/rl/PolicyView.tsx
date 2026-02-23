'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRLPolicyRules } from '@/hooks/useRLPolicyRules'
import { useRLTransitions } from '@/hooks/useRLTransitions'
import { evaluatePolicyRules } from '@/lib/rl-engine'
import PolicyRuleForm from './PolicyRuleForm'
import type { PolicyRule } from '@/lib/types'

export default function PolicyView() {
  const { user } = useAuth()
  const { rules, loading, save, remove } = useRLPolicyRules(user?.uid)
  const { transitions } = useRLTransitions(90)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<PolicyRule | undefined>()

  // Evaluate rules against transition data
  const evaluatedRules = useMemo(
    () => evaluatePolicyRules(rules, transitions),
    [rules, transitions]
  )

  const handleSave = async (data: Partial<PolicyRule>) => {
    await save(data, editingRule?.id)
    setShowForm(false)
    setEditingRule(undefined)
  }

  const handleEdit = (rule: PolicyRule) => {
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingRule(undefined)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-32 text-[10px] text-ink-muted font-sans">Loading policy rules...</div>
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-serif text-[11px] text-ink-muted">
            {evaluatedRules.length} rules {'\u00B7'} {evaluatedRules.filter(r => r.isActive).length} active
          </span>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditingRule(undefined); setShowForm(true) }}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
          >
            + Add Rule
          </button>
        )}
      </div>

      {/* Policy explanation */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          <strong>Policy {'\u03C0'}(a|s)</strong> = &ldquo;Given my current state, what action should I take?&rdquo;
          Define rules as state{'\u2192'}action mappings. The system evaluates them against your transition data
          to show which rules actually improve reward when followed.
        </p>
      </div>

      {/* Add/edit form */}
      {showForm && (
        <PolicyRuleForm
          rule={editingRule}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Rules list */}
      {evaluatedRules.map(rule => (
        <div key={rule.id} className="bg-white border border-rule rounded-sm p-2">
          {/* Rule header */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-serif text-[11px] font-semibold text-ink">{rule.name}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleEdit(rule)}
                className="font-mono text-[8px] text-ink-muted hover:text-ink px-1"
              >
                edit
              </button>
              <button
                onClick={() => rule.id && remove(rule.id)}
                className="font-mono text-[8px] text-red-ink/60 hover:text-red-ink px-1"
              >
                x
              </button>
            </div>
          </div>

          {/* Conditions */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            <span className="font-mono text-[9px] text-ink-muted">When:</span>
            {rule.conditions.map((cond, idx) => (
              <span key={idx} className="font-mono text-[9px] bg-cream px-1 py-0.5 rounded-sm border border-rule">
                {cond.component} {cond.operator} {cond.value}
              </span>
            ))}
            <span className="font-mono text-[9px] text-ink-muted">{'\u2192'}</span>
            <span className="font-mono text-[9px] uppercase px-1 py-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20">
              {rule.action}
            </span>
          </div>

          {/* Reasoning */}
          {rule.reasoning && (
            <p className="font-sans text-[9px] text-ink-muted mb-1.5 italic">{rule.reasoning}</p>
          )}

          {/* Evidence */}
          <div className="flex items-center gap-3 pt-1 border-t border-rule-light">
            <span className="font-mono text-[9px] text-ink-muted">
              Matched: <span className="font-semibold text-ink">{rule.matchCount}</span>
            </span>
            <span className="font-mono text-[9px] text-ink-muted">
              Followed: <span className="font-semibold text-ink">{rule.followedCount}</span>
              {rule.matchCount > 0 && (
                <span className="text-ink-faint"> ({Math.round(rule.followedCount / rule.matchCount * 100)}%)</span>
              )}
            </span>
            {rule.avgRewardWhenFollowed !== null && (
              <span className="font-mono text-[9px]">
                <span className="text-ink-muted">Followed avg: </span>
                <span className={rule.avgRewardWhenFollowed >= (rule.avgRewardWhenIgnored ?? 0) ? 'text-green-ink font-semibold' : 'text-red-ink font-semibold'}>
                  {rule.avgRewardWhenFollowed.toFixed(1)}
                </span>
              </span>
            )}
            {rule.avgRewardWhenIgnored !== null && (
              <span className="font-mono text-[9px]">
                <span className="text-ink-muted">Ignored avg: </span>
                <span className="text-ink font-semibold">{rule.avgRewardWhenIgnored.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
      ))}

      {evaluatedRules.length === 0 && !showForm && (
        <div className="text-center py-6 text-[11px] text-ink-muted font-sans">
          No policy rules defined yet. Add your first rule to start formalizing your strategy as {'\u03C0'}(a|s).
        </div>
      )}
    </div>
  )
}
