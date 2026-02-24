'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { updateUser } from '@/lib/firestore'
import type { UserProfile, UserSettings } from '@/lib/types'
import Image from 'next/image'

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

const SPINE_OPTIONS = ['Armstrong', 'Manifold', 'Deep Tech Fund', 'Jobs']

const THESIS_OPTIONS = [
  'I am building a bootstrapped micro PE holdco that incubates, operates, and captures equity across asymmetric AI-native ventures — funded by revenue first, outside capital only after proof.',
  'I am an AI-native builder who spots market inefficiencies at the intersection of AI + capital markets, ships solutions rapidly through public learning, captures value through products and capital leverage.',
  'Custom',
]

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(profile?.settings || {
    dailyReminder: '8:00 AM',
    weeklyReminder: 'Sunday 7:00 PM',
    focusHoursPerDay: 6,
    revenueAskQuotaPerDay: 2,
    sleepTarget: 7.5,
    maxProjects: 2,
    twentyFourHourRuleActive: true,
  })
  const [spineProject, setSpineProject] = useState(profile?.spineProject || 'Armstrong')
  const [thesisStatement, setThesisStatement] = useState(profile?.thesisStatement || THESIS_OPTIONS[0])
  const [isCustomThesis, setIsCustomThesis] = useState(false)
  const [timezone, setTimezone] = useState(profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setSettings(profile.settings)
      setSpineProject(profile.spineProject)
      setTimezone(profile.timezone)
      setThesisStatement(profile.thesisStatement || THESIS_OPTIONS[0])
      setIsCustomThesis(!THESIS_OPTIONS.slice(0, -1).includes(profile.thesisStatement))
    }
  }, [profile])

  const save = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return
    setSaving(true)
    await updateUser(user.uid, updates)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
  }, [user])

  const updateSettings = (key: keyof UserSettings, value: unknown) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    save({ settings: newSettings })
  }

  const labelClass = "font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-0.5"
  const inputClass = "w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
  const selectClass = "w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-[16px] font-bold text-ink tracking-tight">Settings</h2>
        <span className="font-mono text-[9px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Personal */}
        <div className="bg-paper border border-rule rounded-sm p-3">
          <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule-light">
            Personal
          </h3>
          <div className="flex items-center gap-2 mb-2">
            {user?.photoURL && (
              <Image
                src={user.photoURL}
                alt={user.displayName || ''}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <div>
              <p className="font-sans text-[11px] font-medium text-ink">{user?.displayName}</p>
              <p className="font-mono text-[9px] text-ink-muted">{user?.email}</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value)
                save({ timezone: e.target.value })
              }}
              className={selectClass}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Spine Project */}
        <div className="bg-paper border border-rule rounded-sm p-3">
          <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule-light">
            Spine Project
          </h3>
          <div className="space-y-2">
            <div>
              <label className={labelClass}>Active Spine</label>
              <select
                value={spineProject}
                onChange={(e) => {
                  setSpineProject(e.target.value)
                  save({ spineProject: e.target.value })
                }}
                className={selectClass}
              >
                {SPINE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Daily Allocation (hours)</label>
              <input
                type="number"
                value={settings.focusHoursPerDay}
                onChange={(e) => updateSettings('focusHoursPerDay', parseFloat(e.target.value) || 0)}
                className={inputClass}
                step="0.5"
              />
            </div>
          </div>
        </div>

        {/* Thesis */}
        <div className="col-span-2 bg-paper border border-rule rounded-sm p-3">
          <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule-light">
            Thesis
          </h3>
          <div className="space-y-2">
            <div>
              <label className={labelClass}>North Star Statement</label>
              <select
                value={isCustomThesis ? 'Custom' : thesisStatement}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'Custom') {
                    setIsCustomThesis(true)
                  } else {
                    setIsCustomThesis(false)
                    setThesisStatement(val)
                    save({ thesisStatement: val })
                  }
                }}
                className={selectClass}
              >
                {THESIS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'Custom' ? 'Custom...' : opt.length > 90 ? opt.slice(0, 90) + '...' : opt}
                  </option>
                ))}
              </select>
            </div>
            {isCustomThesis && (
              <div>
                <label className={labelClass}>Custom Thesis</label>
                <textarea
                  value={thesisStatement}
                  onChange={(e) => setThesisStatement(e.target.value)}
                  onBlur={() => save({ thesisStatement })}
                  rows={3}
                  placeholder="Your north star thesis statement..."
                  className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy resize-none"
                />
              </div>
            )}
            <p className="font-mono text-[8px] text-ink-faint">
              This anchors your daily reward computation and weekly synthesis.
            </p>
          </div>
        </div>

        {/* Thresholds & Rules */}
        <div className="bg-paper border border-rule rounded-sm p-3">
          <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule-light">
            Thresholds &amp; Rules
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Max Projects</label>
              <input
                type="number"
                value={settings.maxProjects}
                onChange={(e) => updateSettings('maxProjects', parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ask Quota / Day</label>
              <input
                type="number"
                value={settings.revenueAskQuotaPerDay}
                onChange={(e) => updateSettings('revenueAskQuotaPerDay', parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sleep Target (hrs)</label>
              <input
                type="number"
                value={settings.sleepTarget}
                onChange={(e) => updateSettings('sleepTarget', parseFloat(e.target.value) || 0)}
                className={inputClass}
                step="0.5"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pb-1">
                <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted">24h Spike</label>
                <button
                  onClick={() => updateSettings('twentyFourHourRuleActive', !settings.twentyFourHourRuleActive)}
                  className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                    settings.twentyFourHourRuleActive ? 'bg-burgundy text-paper border-burgundy' : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {settings.twentyFourHourRuleActive ? 'Active' : 'Off'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Integration */}
        <div className="bg-paper border border-rule rounded-sm p-3">
          <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule-light">
            Telegram Signal Bot
          </h3>
          <div className="space-y-2">
            <p className="font-sans text-[9px] text-ink-muted leading-relaxed">
              Send signals from Telegram: <code className="font-mono text-[8px] bg-cream px-1 py-0.5 rounded-sm">/signal #ai Your observation</code>
            </p>
            <div>
              <label className={labelClass}>Chat ID</label>
              <input
                type="text"
                value={settings.telegramChatId || ''}
                onChange={(e) => updateSettings('telegramChatId', e.target.value)}
                placeholder="Send /id to your bot"
                className={inputClass}
              />
              <p className="font-mono text-[8px] text-ink-faint mt-0.5">
                Open your bot in Telegram → send /id
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[8px] text-ink-muted">Webhook:</span>
              <code className="font-mono text-[7px] text-ink-faint bg-cream px-1.5 py-0.5 rounded-sm truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/webhook` : '/api/telegram/webhook'}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
