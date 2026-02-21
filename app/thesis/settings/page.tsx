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
  const [timezone, setTimezone] = useState(profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setSettings(profile.settings)
      setSpineProject(profile.spineProject)
      setTimezone(profile.timezone)
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-[20px] font-bold text-ink tracking-tight">Settings</h2>
        <span className="font-mono text-[10px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="space-y-6">
        {/* Personal */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Personal
          </h3>
          <div className="flex items-center gap-4 mb-4">
            {user?.photoURL && (
              <Image
                src={user.photoURL}
                alt={user.displayName || ''}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div>
              <p className="font-sans text-[14px] font-medium text-ink">{user?.displayName}</p>
              <p className="font-mono text-[12px] text-ink-muted">{user?.email}</p>
            </div>
          </div>
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value)
                save({ timezone: e.target.value })
              }}
              className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Spine Project */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Spine Project
          </h3>
          <div className="space-y-3">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Active Spine</label>
              <select
                value={spineProject}
                onChange={(e) => {
                  setSpineProject(e.target.value)
                  save({ spineProject: e.target.value })
                }}
                className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              >
                {SPINE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Daily Allocation (hours)</label>
              <input
                type="number"
                value={settings.focusHoursPerDay}
                onChange={(e) => updateSettings('focusHoursPerDay', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                step="0.5"
              />
            </div>
          </div>
        </div>

        {/* Thresholds & Rules */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Thresholds &amp; Rules
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Max Projects</label>
              <input
                type="number"
                value={settings.maxProjects}
                onChange={(e) => updateSettings('maxProjects', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Revenue Ask Quota / Day</label>
              <input
                type="number"
                value={settings.revenueAskQuotaPerDay}
                onChange={(e) => updateSettings('revenueAskQuotaPerDay', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Sleep Target (hrs)</label>
              <input
                type="number"
                value={settings.sleepTarget}
                onChange={(e) => updateSettings('sleepTarget', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                step="0.5"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pb-2">
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">24h Spike Rule</label>
                <button
                  onClick={() => updateSettings('twentyFourHourRuleActive', !settings.twentyFourHourRuleActive)}
                  className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                    settings.twentyFourHourRuleActive ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                  }`}
                >
                  {settings.twentyFourHourRuleActive ? 'Active' : 'Off'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Integration */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Telegram Signal Bot
          </h3>
          <div className="space-y-3">
            <p className="font-sans text-[10px] text-ink-muted leading-relaxed">
              Send signals directly from Telegram. Message your bot with <code className="font-mono text-[9px] bg-cream px-1 py-0.5 rounded-sm">/signal #ai Your observation</code> to create an external signal.
            </p>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Telegram Chat ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.telegramChatId || ''}
                  onChange={(e) => updateSettings('telegramChatId', e.target.value)}
                  placeholder="Send /id to your bot to get this"
                  className="flex-1 font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                />
              </div>
              <p className="font-mono text-[8px] text-ink-faint mt-1">
                Open your Thesis Engine bot in Telegram and send /id to get your chat ID.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="font-mono text-[9px] text-ink-muted">Webhook:</span>
              <code className="font-mono text-[8px] text-ink-faint bg-cream px-2 py-1 rounded-sm">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/webhook` : '/api/telegram/webhook'}
              </code>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Data &amp; Export
          </h3>
          <p className="font-sans text-[12px] text-ink-muted mb-3">
            Export functionality coming in Phase 2.
          </p>
        </div>
      </div>
    </div>
  )
}
