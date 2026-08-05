'use client'

import { useState, useEffect, useCallback } from 'react'
import HuntGame, {
  MODES, Mode, ALL_TEAM_KEYS, REAL_END, fmtHM, isFrozenNow,
  readConfig, writeConfig, resetTeam, earnedFrom, teamKeyFor,
  SectionHead, P,
} from '../cph/HuntGame'

const btn = (tone: 'primary' | 'plain' | 'danger', disabled = false): React.CSSProperties => ({
  display: 'block', width: '100%', padding: '11px 12px', marginBottom: 8, borderRadius: 2,
  fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1,
  WebkitTapHighlightColor: 'transparent',
  ...(tone === 'primary'
    ? { background: '#2d5f3f', color: '#faf8f4', border: '1px solid #2d5f3f' }
    : tone === 'danger'
      ? { background: 'transparent', color: '#8c2d2d', border: '1px solid #8c2d2d' }
      : { background: '#faf8f4', color: '#2a2522', border: '1px solid #d8d0c8' }),
})

const label: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9a928a', letterSpacing: 1, textTransform: 'uppercase',
}
const value: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, color: '#2a2522',
}

function Console({
  testFrozen, setTestFrozen, notify,
}: {
  testFrozen: boolean
  setTestFrozen: (v: boolean) => void
  notify: () => void
}) {
  const [started, setStarted] = useState<string | null>(null)
  const [liveMode, setLiveMode] = useState<Mode | null>(null)
  const [testStarted, setTestStarted] = useState<string | null>(null)
  const [scores, setScores] = useState<{ name: string; score: number }[]>([])
  const [busy, setBusy] = useState('')
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [now, setNow] = useState(0)

  const refresh = useCallback(async () => {
    const cfg = await readConfig('live')
    setStarted(cfg.started || null)
    const m = cfg.mode
    setLiveMode(m === 'pairs' || m === 'trios' ? m : null)
    const tcfg = await readConfig('test')
    setTestStarted(tcfg.started || null)

    const teams = m === 'pairs' || m === 'trios' ? MODES[m].teams : []
    const rows = await Promise.all(teams.map(async t => {
      const r = await fetch(`/api/cph-hunt?team=${teamKeyFor('live', t.storageKey)}`, { cache: 'no-store' })
      const d = await r.json()
      return { name: t.name, score: earnedFrom(d.checks || {}, d.counts || {}) }
    }))
    setScores(rows)
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(() => { refresh(); setNow(n => n + 1) }, 20_000)
    return () => clearInterval(id)
  }, [refresh])

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name)
    await fn()
    await refresh()
    notify()
    setBusy('')
  }

  const unlock = () => run('unlock', () => writeConfig('live', 'started', new Date().toISOString()))
  const relock = () => run('relock', () => writeConfig('live', 'started', null))
  const setLiveFormat = (m: Mode | null) => run('format', () => writeConfig('live', 'mode', m))
  const startTest = () => run('starttest', () => writeConfig('test', 'started', new Date().toISOString()))
  const resetTest = () => run('resettest', async () => {
    await Promise.all(ALL_TEAM_KEYS.map(k => resetTeam('test', k)))
    await writeConfig('test', 'mode', null)
    await writeConfig('test', 'started', null)
    setTestFrozen(false)
  })
  const wipeLive = () => run('wipelive', async () => {
    await Promise.all(ALL_TEAM_KEYS.map(k => resetTeam('live', k)))
    await writeConfig('live', 'started', null)
    await writeConfig('live', 'final', null)
    setConfirmWipe(false)
  })

  const frozenNow = isFrozenNow()

  return (
    <div>
      <SectionHead>Live Game · {'/cph'}</SectionHead>
      <div style={{ border: '1px solid #d8d0c8', borderRadius: 2, padding: '10px 12px', marginBottom: 12, background: '#faf8f4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={label}>Status</span>
          <span style={{ ...value, color: started ? '#2d5f3f' : '#8a6d2f' }}>{started ? 'OPEN — players can play' : 'WAITING — "get ready" screen'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={label}>Opened at</span>
          <span style={value}>{started ? new Date(new Date(started).getTime() + 2 * 3600 * 1000).toISOString().slice(11, 16) + ' CPH' : '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={label}>Freeze</span>
          <span style={{ ...value, color: frozenNow ? '#8c2d2d' : '#2a2522' }}>{fmtHM(REAL_END)} CPH {frozenNow ? '· FROZEN NOW' : ''}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={label}>Format</span>
          <span style={value}>{liveMode ? MODES[liveMode].label : 'not chosen'}</span>
        </div>
      </div>

      {!started ? (
        <button style={btn('primary', busy === 'unlock')} onClick={unlock} disabled={!!busy}>
          {busy === 'unlock' ? 'Opening…' : 'OPEN THE HUNT ON /cph'}
        </button>
      ) : (
        <button style={btn('plain', busy === 'relock')} onClick={relock} disabled={!!busy}>
          {busy === 'relock' ? 'Closing…' : 'Close again (back to "get ready")'}
        </button>
      )}
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9a928a', lineHeight: 1.4, marginBottom: 14 }}>
        Opening flips every phone on /cph from the waiting screen to the live checklist within 15 seconds. The {fmtHM(REAL_END)} freeze applies either way.
      </div>

      <SectionHead>Format for the live game</SectionHead>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        {(Object.keys(MODES) as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setLiveFormat(m)}
            disabled={!!busy}
            style={{
              flex: 1, padding: '9px 6px', borderRadius: 2, cursor: 'pointer',
              fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 12, fontWeight: 700,
              background: liveMode === m ? '#7c2d2d' : 'transparent',
              color: liveMode === m ? '#faf8f4' : '#9a928a',
              border: `1px solid ${liveMode === m ? '#7c2d2d' : '#d8d0c8'}`,
            }}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>
      <button style={btn('plain', busy === 'format')} onClick={() => setLiveFormat(null)} disabled={!!busy}>
        Clear format (players choose on /cph)
      </button>

      {scores.length > 0 && (
        <>
          <SectionHead>Live scores</SectionHead>
          <div style={{ border: '1px solid #d8d0c8', borderRadius: 2, padding: '8px 12px', marginBottom: 14, background: '#faf8f4' }}>
            {scores.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 12, fontWeight: 600, color: '#2a2522' }}>{s.name}</span>
                <span style={value}>{s.score} pts</span>
              </div>
            ))}
            <div style={{ ...label, marginTop: 4 }}>refreshes every 20s{now ? '' : ''}</div>
          </div>
        </>
      )}

      <SectionHead>Sandbox · {'/cpht'}</SectionHead>
      <P>The tab beside this one is a full working copy of the hunt, writing to separate test records that never touch the live scores. Walk the whole game through here first.</P>
      <div style={{ border: '1px solid #d8d0c8', borderRadius: 2, padding: '10px 12px', marginBottom: 10, background: '#faf8f4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={label}>Sandbox is</span>
          <span style={{ ...value, color: testFrozen ? '#8c2d2d' : testStarted ? '#2d5f3f' : '#8a6d2f' }}>
            {testFrozen ? 'FROZEN — endgame screen' : testStarted ? 'RUNNING — checklist live' : 'PREVIEW — pre-start screen'}
          </span>
        </div>
      </div>

      {!testStarted ? (
        <>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9a928a', lineHeight: 1.4, marginBottom: 8 }}>
            The Preview tab is showing exactly what players see on /cph right now, before the start.
          </div>
          <button style={btn('primary', busy === 'starttest')} onClick={startTest} disabled={!!busy}>
            {busy === 'starttest' ? 'Starting…' : 'START THE SANDBOX HUNT'}
          </button>
        </>
      ) : (
        <button style={btn('plain')} onClick={() => setTestFrozen(!testFrozen)}>
          {testFrozen ? 'Un-freeze the sandbox' : 'Preview the TIME\'S UP freeze screen'}
        </button>
      )}
      <button style={btn('plain', busy === 'resettest')} onClick={resetTest} disabled={!!busy}>
        {busy === 'resettest' ? 'Resetting…' : 'Reset sandbox back to preview'}
      </button>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9a928a', lineHeight: 1.4, marginBottom: 14 }}>
        Reset wipes sandbox scores and format, un-freezes, and returns the Preview tab to the pre-start screen. The live game is untouched.
      </div>

      <div style={{ borderTop: '2px solid #8c2d2d', marginTop: 18, paddingTop: 10 }}>
        <SectionHead>Danger zone</SectionHead>
        <P>Wipes every live team&apos;s checkboxes, counts and saved result, and returns /cph to the waiting screen.</P>
        {!confirmWipe ? (
          <button style={btn('danger')} onClick={() => setConfirmWipe(true)} disabled={!!busy}>
            Reset the LIVE game
          </button>
        ) : (
          <>
            <button style={btn('danger', busy === 'wipelive')} onClick={wipeLive} disabled={!!busy}>
              {busy === 'wipelive' ? 'Wiping…' : 'Tap again to confirm — this erases live scores'}
            </button>
            <button style={btn('plain')} onClick={() => setConfirmWipe(false)}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function CphtPage() {
  const [testFrozen, setTestFrozen] = useState(false)
  // Bumped after every console action so the game panel re-reads config at once
  const [version, setVersion] = useState(0)
  return (
    <HuntGame
      env="test"
      testFrozen={testFrozen}
      configVersion={version}
      adminPanel={
        <Console
          testFrozen={testFrozen}
          setTestFrozen={setTestFrozen}
          notify={() => setVersion(v => v + 1)}
        />
      }
    />
  )
}
