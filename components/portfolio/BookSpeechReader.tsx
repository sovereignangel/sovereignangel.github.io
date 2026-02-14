'use client'

import { useState, useEffect, useRef, useCallback, CSSProperties } from 'react'
import { saveAudioTransform, getRecentAudioTransforms } from '@/lib/firestore'
import type { AudioTransform } from '@/lib/types'

const SAMPLE_TEXT = `This is a diagnostic passage to verify the distillation engine is functioning correctly.

Radical transparency requires that you surface what you really think, even when it's uncomfortable. The goal is not to be right — it's to find what's true, and to do that as quickly as possible.

Every decision is a bet. The quality of your decisions improves when you systematically collect evidence, stress-test your reasoning against reality, and update your mental models based on outcomes rather than ego.

Pain plus reflection equals progress. Most people let pain stop them. The ones who succeed use it as a signal — an invitation to recalibrate and grow.`

interface BookMeta {
  title: string
  creator: string
  date: string
  description: string
}

async function proxyFetch(url: string): Promise<Response> {
  const res = await fetch(`/api/archive-proxy?url=${encodeURIComponent(url)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    const err = new Error(body.error || `Proxy returned ${res.status}`)
    ;(err as any).status = res.status
    throw err
  }
  return res
}

async function searchGutenberg(title: string): Promise<{ text: string; meta: { title: string; author: string; gutenbergId: number } } | null> {
  try {
    const searchRes = await proxyFetch(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`)
    const data = await searchRes.json()
    if (!data.results || data.results.length === 0) return null

    const book = data.results[0]
    const textUrl = book.formats?.['text/plain; charset=utf-8']
      || book.formats?.['text/plain']
      || book.formats?.['text/plain; charset=us-ascii']

    if (!textUrl) return null

    const textRes = await proxyFetch(textUrl)
    const text = await textRes.text()

    return {
      text,
      meta: {
        title: book.title || title,
        author: book.authors?.[0]?.name || 'Unknown Author',
        gutenbergId: book.id,
      },
    }
  } catch {
    return null
  }
}

export default function BookSpeechReader() {
  const [bookId, setBookId] = useState('')
  const [operatorName, setOperatorName] = useState('')
  const [investmentThesis, setInvestmentThesis] = useState('')
  const [text, setText] = useState('')
  const [displayText, setDisplayText] = useState('')
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [currentParagraph, setCurrentParagraph] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [rate, setRate] = useState(1.0)
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookMeta, setBookMeta] = useState<BookMeta | null>(null)
  const [mode, setMode] = useState<'input' | 'reading'>('input')
  const [progress, setProgress] = useState(0)
  const [ledger, setLedger] = useState<AudioTransform[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(true)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

  // Load fonts + keyframes
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!document.getElementById('spoken-archive-fonts')) {
      const link = document.createElement('link')
      link.id = 'spoken-archive-fonts'
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:wght@700;800&display=swap'
      document.head.appendChild(link)
    }
    if (!document.getElementById('spoken-archive-keyframes')) {
      const style = document.createElement('style')
      style.id = 'spoken-archive-keyframes'
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
      document.head.appendChild(style)
    }
  }, [])

  // Load voices
  useEffect(() => {
    if (!synth) return
    const loadVoices = () => {
      const v = synth.getVoices().filter((voice) => voice.lang.startsWith('en'))
      setVoices(v)
      if (v.length > 0 && !voice) {
        const preferred = v.find(
          (x) =>
            x.name.includes('Samantha') ||
            x.name.includes('Google UK English Female') ||
            x.name.includes('Microsoft Zira') ||
            x.name.includes('Natural')
        )
        setVoice(preferred || v[0])
      }
    }
    loadVoices()
    synth.onvoiceschanged = loadVoices
    return () => { synth.onvoiceschanged = null }
  }, [])

  // Load ledger
  useEffect(() => {
    getRecentAudioTransforms(20)
      .then(setLedger)
      .catch(() => {})
      .finally(() => setLedgerLoading(false))
  }, [])

  // Parse paragraphs
  useEffect(() => {
    if (displayText) {
      const paras = displayText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
      setParagraphs(paras)
    }
  }, [displayText])

  const extractId = (input: string) => {
    const trimmed = input.trim()
    const urlMatch = trimmed.match(/archive\.org\/details\/([^/?#]+)/)
    if (urlMatch) return urlMatch[1]
    if (/^[a-zA-Z0-9._-]+$/.test(trimmed)) return trimmed
    return trimmed
  }

  const recordTransform = async (meta: { bookId: string; bookTitle: string; bookAuthor: string; sourceType: 'archive' | 'gutenberg' | 'paste' }) => {
    try {
      await saveAudioTransform({
        operatorName: operatorName.trim() || 'Anonymous',
        investmentThesis: investmentThesis.trim(),
        ...meta,
      })
      const updated = await getRecentAudioTransforms(20)
      setLedger(updated)
    } catch {
      // Non-blocking — don't fail the reading experience
    }
  }

  const loadBookText = (bookText: string, title: string, creator: string, sourceId: string, source: 'archive' | 'gutenberg' | 'paste') => {
    const cleaned = bookText
      .replace(/\f/g, '\n\n')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (cleaned.length < 50) {
      throw new Error('Extracted text is insufficient. Try pasting the source material manually.')
    }

    setText(cleaned)
    setDisplayText(cleaned)
    setMode('reading')
    setCurrentParagraph(0)
    setBookMeta({ title, creator, date: '', description: '' })

    recordTransform({ bookId: sourceId, bookTitle: title, bookAuthor: creator, sourceType: source })
  }

  const fetchBook = async () => {
    if (!bookId.trim()) return
    setLoading(true)
    setError('')
    setBookMeta(null)

    const id = extractId(bookId)

    try {
      // Step 1: Get metadata from archive.org
      const metaRes = await proxyFetch(`https://archive.org/metadata/${id}`)
      const meta = await metaRes.json()

      if (!meta.metadata) throw new Error('Source not found on Internet Archive. Verify the identifier and retry.')

      const title = meta.metadata?.title || id
      const creator = meta.metadata?.creator || 'Unknown Author'

      setBookMeta({ title, creator, date: meta.metadata?.date || '', description: meta.metadata?.description || '' })

      const files = meta.files || []
      const textFile =
        files.find((f: { name: string }) => f.name.endsWith('_djvu.txt')) ||
        files.find((f: { name: string }) => f.name.endsWith('.txt') && !f.name.includes('_meta') && !f.name.includes('_files')) ||
        files.find((f: { name: string }) => f.name.endsWith('_chocr.html.gz'))

      if (!textFile) {
        throw new Error(
          'No extractable text found for this source. Try a different edition, or paste raw text directly below.'
        )
      }

      // Step 2: Try fetching text from archive.org
      try {
        const textUrl = `https://archive.org/download/${id}/${encodeURIComponent(textFile.name)}`
        const textRes = await proxyFetch(textUrl)
        const bookText = await textRes.text()
        loadBookText(bookText, title, creator, id, 'archive')
        return
      } catch (archiveErr) {
        // If 403 (restricted/lending-only), fall through to Gutenberg
        if ((archiveErr as any).status !== 403 && (archiveErr as any).message !== 'restricted') {
          throw archiveErr
        }
        // Fall through to Gutenberg search
      }

      // Step 3: Archive.org restricted — try Project Gutenberg
      setError('') // clear any intermediate error
      const gutResult = await searchGutenberg(title)

      if (gutResult) {
        loadBookText(gutResult.text, gutResult.meta.title, gutResult.meta.author, `gutenberg-${gutResult.meta.gutenbergId}`, 'gutenberg')
        return
      }

      // Step 4: Neither source had it
      throw new Error(
        `"${title}" is restricted on Internet Archive (lending-only) and not available on Project Gutenberg. ` +
        'Borrow it on archive.org, then copy & paste the text below.'
      )
    } catch (err) {
      setError(
        (err as Error).message ||
          'Extraction failed. This may be a network constraint. Try pasting text directly.'
      )
    } finally {
      setLoading(false)
    }
  }

  const loadPastedText = async () => {
    if (text.trim()) {
      setDisplayText(text)
      setMode('reading')
      setCurrentParagraph(0)

      await recordTransform({
        bookId: 'manual-paste',
        bookTitle: text.slice(0, 60).replace(/\n/g, ' ').trim() + '…',
        bookAuthor: operatorName.trim() || 'Anonymous',
        sourceType: 'paste',
      })
    }
  }

  const speak = useCallback(
    (fromParagraph = currentParagraph) => {
      if (!synth || paragraphs.length === 0) return
      synth.cancel()

      setCurrentParagraph(fromParagraph)
      setIsPlaying(true)
      setIsPaused(false)

      const speakParagraph = (index: number) => {
        if (index >= paragraphs.length) {
          setIsPlaying(false)
          return
        }

        const utt = new SpeechSynthesisUtterance(paragraphs[index])
        utt.rate = rate
        utt.pitch = 1.0
        if (voice) utt.voice = voice

        utt.onstart = () => {
          setCurrentParagraph(index)
          setProgress(((index + 1) / paragraphs.length) * 100)
          if (paragraphRefs.current[index]) {
            paragraphRefs.current[index]!.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            })
          }
        }

        utt.onend = () => {
          speakParagraph(index + 1)
        }

        utt.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            speakParagraph(index + 1)
          }
        }

        utteranceRef.current = utt
        synth.speak(utt)
      }

      speakParagraph(fromParagraph)
    },
    [synth, paragraphs, rate, voice, currentParagraph]
  )

  const pause = () => {
    if (synth) {
      synth.pause()
      setIsPaused(true)
    }
  }

  const resume = () => {
    if (synth) {
      synth.resume()
      setIsPaused(false)
    }
  }

  const stop = () => {
    if (synth) {
      synth.cancel()
      setIsPlaying(false)
      setIsPaused(false)
    }
  }

  const skipForward = () => {
    const next = Math.min(currentParagraph + 1, paragraphs.length - 1)
    if (isPlaying) {
      speak(next)
    } else {
      setCurrentParagraph(next)
      if (paragraphRefs.current[next]) {
        paragraphRefs.current[next]!.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const skipBack = () => {
    const prev = Math.max(currentParagraph - 1, 0)
    if (isPlaying) {
      speak(prev)
    } else {
      setCurrentParagraph(prev)
      if (paragraphRefs.current[prev]) {
        paragraphRefs.current[prev]!.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  // Update rate on the fly
  useEffect(() => {
    if (isPlaying && !isPaused) {
      speak(currentParagraph)
    }
  }, [rate, voice])

  // Cleanup
  useEffect(() => {
    return () => {
      if (synth) synth.cancel()
    }
  }, [])

  const rateLabel = (r: number) => {
    if (r <= 0.5) return 'Deliberate'
    if (r <= 0.8) return 'Measured'
    if (r <= 1.0) return 'Standard'
    if (r <= 1.5) return 'Accelerated'
    if (r <= 2.0) return 'Intensive'
    return 'Maximum'
  }

  const formatDate = (ts: any) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // INPUT MODE
  if (mode === 'input') {
    return (
      <div style={styles.root}>
        <div style={styles.grain} />
        <div style={styles.inputContainer}>
          <div style={styles.logoMark}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="6" width="14" height="28" rx="2" stroke="#8B6F47" strokeWidth="2" fill="none" />
              <rect x="22" y="6" width="14" height="28" rx="2" stroke="#8B6F47" strokeWidth="2" fill="none" />
              <path d="M18 10 L22 10" stroke="#8B6F47" strokeWidth="1.5" />
              <path d="M18 20 L22 20" stroke="#8B6F47" strokeWidth="1.5" />
              <path d="M18 30 L22 30" stroke="#8B6F47" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 style={styles.title}>Principle Distillation Engine</h1>
          <p style={styles.subtitle}>
            Convert raw text into internalized principles through auditory processing
          </p>

          {/* Operator identification */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Operator</label>
            <input
              style={styles.input}
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Investment Thesis</label>
            <textarea
              style={{ ...styles.textarea, minHeight: 60 }}
              value={investmentThesis}
              onChange={(e) => setInvestmentThesis(e.target.value)}
              placeholder="Why does this text matter to your development? What principle are you extracting?"
              rows={2}
            />
          </div>

          <div style={styles.sectionDivider} />

          {/* Archive fetch */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Source — Internet Archive ID or URL</label>
            <div style={styles.fetchRow}>
              <input
                style={styles.input}
                type="text"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                placeholder="e.g. thinkandgrowric00hill or https://archive.org/details/..."
                onKeyDown={(e) => e.key === 'Enter' && fetchBook()}
              />
              <button
                style={{
                  ...styles.fetchBtn,
                  opacity: loading ? 0.6 : 1,
                }}
                onClick={fetchBook}
                disabled={loading}
              >
                {loading ? (
                  <span style={styles.spinner} />
                ) : (
                  'Extract'
                )}
              </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            {bookMeta && (
              <div style={styles.metaCard}>
                <div style={styles.metaTitle}>{bookMeta.title}</div>
                <div style={styles.metaAuthor}>{bookMeta.creator}{bookMeta.date ? ` · ${bookMeta.date}` : ''}</div>
              </div>
            )}
          </div>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or paste source material directly</span>
          </div>

          <div style={styles.inputGroup}>
            <textarea
              style={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste any text here — a book chapter, memo, research paper, or anything you want to distill into principles..."
              rows={8}
            />
            <button
              style={{
                ...styles.loadBtn,
                opacity: text.trim() ? 1 : 0.4,
              }}
              onClick={loadPastedText}
              disabled={!text.trim()}
            >
              Begin Distillation
            </button>
          </div>

          <button
            style={styles.sampleBtn}
            onClick={() => {
              setText(SAMPLE_TEXT)
              setDisplayText(SAMPLE_TEXT)
              setMode('reading')
            }}
          >
            Run diagnostic with sample text
          </button>

          {/* Distillation Ledger */}
          <div style={styles.ledgerSection}>
            <div style={styles.ledgerHeader}>
              <span style={styles.ledgerTitle}>Distillation Ledger</span>
              <span style={styles.ledgerCount}>{ledger.length} entries</span>
            </div>
            {ledgerLoading ? (
              <p style={styles.ledgerEmpty}>Loading...</p>
            ) : ledger.length === 0 ? (
              <p style={styles.ledgerEmpty}>No distillations recorded yet. Begin your first extraction above.</p>
            ) : (
              <div style={styles.ledgerList}>
                {ledger.map((entry) => (
                  <div key={entry.id} style={styles.ledgerEntry}>
                    <div style={styles.ledgerEntryTop}>
                      <span style={styles.ledgerBookTitle}>{entry.bookTitle}</span>
                      <span style={styles.ledgerDate}>{formatDate(entry.createdAt)}</span>
                    </div>
                    {entry.bookAuthor && entry.sourceType === 'archive' && (
                      <span style={styles.ledgerAuthor}>{entry.bookAuthor}</span>
                    )}
                    <div style={styles.ledgerEntryBottom}>
                      <span style={styles.ledgerOperator}>{entry.operatorName}</span>
                      {entry.investmentThesis && (
                        <span style={styles.ledgerThesis}>— {entry.investmentThesis}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // READING MODE
  return (
    <div style={styles.root}>
      <div style={styles.grain} />

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => { stop(); setMode('input') }}>
          &larr; Return to Library
        </button>
        {bookMeta && (
          <div style={styles.headerMeta}>
            <span style={styles.headerTitle}>{bookMeta.title}</span>
            <span style={styles.headerAuthor}>{bookMeta.creator}</span>
          </div>
        )}
        <div style={styles.headerProgress}>
          {Math.round(progress)}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Text content */}
      <div style={styles.readingContainer} ref={containerRef}>
        <div style={styles.textBody}>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              ref={(el) => { paragraphRefs.current[i] = el }}
              style={{
                ...styles.paragraph,
                ...(i === currentParagraph && isPlaying ? styles.activeParagraph : {}),
                ...(i < currentParagraph && isPlaying ? styles.readParagraph : {}),
              }}
              onClick={() => {
                if (isPlaying) speak(i)
                else {
                  setCurrentParagraph(i)
                  setProgress(((i + 1) / paragraphs.length) * 100)
                }
              }}
            >
              {para}
            </p>
          ))}
          <div style={{ height: 200 }} />
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlsInner}>
          {/* Voice selector */}
          <div style={styles.controlRow}>
            <select
              style={styles.voiceSelect}
              value={voice?.name || ''}
              onChange={(e) => {
                const v = voices.find((x) => x.name === e.target.value)
                setVoice(v || null)
              }}
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Playback */}
          <div style={styles.playbackRow}>
            <button style={styles.skipBtn} onClick={skipBack} title="Previous principle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {!isPlaying ? (
              <button style={styles.playBtn} onClick={() => speak(currentParagraph)} title="Play">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : isPaused ? (
              <button style={styles.playBtn} onClick={resume} title="Resume">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button style={styles.playBtn} onClick={pause} title="Pause">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            )}

            <button style={styles.skipBtn} onClick={skipForward} title="Next principle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {isPlaying && (
              <button style={styles.stopBtn} onClick={stop} title="Stop">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            )}
          </div>

          {/* Speed */}
          <div style={styles.speedRow}>
            <span style={styles.speedLabel}>{rate.toFixed(1)}x · {rateLabel(rate)}</span>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.paraInfo}>
            Processing principle {currentParagraph + 1} of {paragraphs.length}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  root: {
    position: 'relative',
    minHeight: '80vh',
    background: 'linear-gradient(175deg, #F5F0E8 0%, #EDE6D8 40%, #E8DFD0 100%)',
    fontFamily: "'Crimson Pro', 'Georgia', serif",
    color: '#3D2E1F',
    overflow: 'hidden',
    borderRadius: 8,
  },
  grain: {
    position: 'absolute',
    inset: 0,
    opacity: 0.03,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat',
    pointerEvents: 'none',
    zIndex: 0,
  },

  // Input page
  inputContainer: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 560,
    margin: '0 auto',
    padding: '40px 24px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoMark: {
    marginBottom: 12,
    opacity: 0.8,
  },
  title: {
    fontFamily: "'Playfair Display', 'Georgia', serif",
    fontSize: 30,
    fontWeight: 700,
    color: '#2C1D0E',
    margin: 0,
    letterSpacing: '-0.02em',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7A6B5A',
    marginTop: 6,
    marginBottom: 32,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#6B5D4E',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: "'system-ui', sans-serif",
  },
  sectionDivider: {
    width: '100%',
    height: 1,
    background: '#C9B99A',
    margin: '20px 0',
    opacity: 0.5,
  },
  fetchRow: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: "'Crimson Pro', Georgia, serif",
    border: '1.5px solid #C9B99A',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.7)',
    color: '#3D2E1F',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  fetchBtn: {
    padding: '12px 20px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'system-ui', sans-serif",
    background: '#8B6F47',
    color: '#FFF',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.03em',
    minWidth: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFF',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
  error: {
    color: '#A0522D',
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'system-ui, sans-serif',
    background: 'rgba(160,82,45,0.08)',
    padding: '8px 12px',
    borderRadius: 6,
    lineHeight: 1.5,
  },
  metaCard: {
    marginTop: 10,
    padding: '12px 16px',
    background: 'rgba(139,111,71,0.08)',
    borderRadius: 6,
    borderLeft: '3px solid #8B6F47',
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#2C1D0E',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  metaAuthor: {
    fontSize: 13,
    color: '#7A6B5A',
    marginTop: 3,
  },
  divider: {
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    margin: '24px 0',
    borderTop: '1px solid #C9B99A',
    paddingTop: 0,
  },
  dividerText: {
    position: 'relative',
    top: -10,
    background: '#EDE6D8',
    padding: '0 14px',
    fontSize: 12,
    color: '#9A8B7A',
    fontFamily: 'system-ui, sans-serif',
    fontStyle: 'italic',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: "'Crimson Pro', Georgia, serif",
    border: '1.5px solid #C9B99A',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.7)',
    color: '#3D2E1F',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.7,
    boxSizing: 'border-box' as const,
  },
  loadBtn: {
    marginTop: 10,
    padding: '12px 28px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'system-ui', sans-serif",
    background: '#2C1D0E',
    color: '#F5F0E8',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  },
  sampleBtn: {
    marginTop: 16,
    padding: '8px 16px',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    background: 'transparent',
    color: '#8B6F47',
    border: '1px dashed #C9B99A',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Ledger
  ledgerSection: {
    width: '100%',
    marginTop: 36,
    borderTop: '2px solid #C9B99A',
    paddingTop: 20,
  },
  ledgerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  ledgerTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6B5D4E',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: 'system-ui, sans-serif',
  },
  ledgerCount: {
    fontSize: 11,
    color: '#9A8B7A',
    fontFamily: 'system-ui, sans-serif',
  },
  ledgerEmpty: {
    fontSize: 13,
    color: '#9A8B7A',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '16px 0',
  },
  ledgerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ledgerEntry: {
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.5)',
    borderRadius: 6,
    borderLeft: '3px solid #C9B99A',
  },
  ledgerEntryTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  ledgerBookTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#2C1D0E',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  ledgerDate: {
    fontSize: 11,
    color: '#9A8B7A',
    fontFamily: 'system-ui, sans-serif',
    flexShrink: 0,
    marginLeft: 8,
  },
  ledgerAuthor: {
    fontSize: 12,
    color: '#7A6B5A',
    display: 'block',
    marginBottom: 4,
  },
  ledgerEntryBottom: {
    fontSize: 12,
    color: '#6B5D4E',
    lineHeight: 1.5,
  },
  ledgerOperator: {
    fontWeight: 600,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  ledgerThesis: {
    fontStyle: 'italic',
    marginLeft: 4,
    color: '#7A6B5A',
  },

  // Reading page
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'rgba(237,230,216,0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(201,185,154,0.5)',
  },
  backBtn: {
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    background: 'none',
    border: 'none',
    color: '#8B6F47',
    cursor: 'pointer',
    fontWeight: 600,
    padding: '4px 0',
  },
  headerMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    padding: '0 12px',
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#2C1D0E',
    fontFamily: "'Playfair Display', Georgia, serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 280,
  },
  headerAuthor: {
    fontSize: 11,
    color: '#7A6B5A',
  },
  headerProgress: {
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    color: '#8B6F47',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  progressBar: {
    height: 3,
    background: 'rgba(201,185,154,0.4)',
    position: 'sticky',
    top: 42,
    zIndex: 10,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8B6F47, #A0845C)',
    transition: 'width 0.4s ease',
    borderRadius: '0 2px 2px 0',
  },

  readingContainer: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '24px 20px 200px',
    position: 'relative',
    zIndex: 1,
  },
  textBody: {
    lineHeight: 1.85,
    fontSize: 16,
  },
  paragraph: {
    marginBottom: 16,
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderLeft: '3px solid transparent',
    color: '#3D2E1F',
  },
  activeParagraph: {
    background: 'rgba(139,111,71,0.1)',
    borderLeftColor: '#8B6F47',
    color: '#2C1D0E',
  },
  readParagraph: {
    opacity: 0.45,
  },

  // Controls dock
  controls: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    background: 'linear-gradient(to top, rgba(237,230,216,0.98) 70%, rgba(237,230,216,0))',
    paddingTop: 24,
  },
  controlsInner: {
    maxWidth: 440,
    margin: '0 auto',
    padding: '0 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  controlRow: {
    width: '100%',
  },
  voiceSelect: {
    width: '100%',
    padding: '6px 10px',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    border: '1px solid #C9B99A',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.8)',
    color: '#3D2E1F',
    outline: 'none',
    cursor: 'pointer',
  },
  playbackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    justifyContent: 'center',
  },
  skipBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1.5px solid #C9B99A',
    background: 'rgba(255,255,255,0.6)',
    color: '#6B5D4E',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    background: '#8B6F47',
    color: '#FFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(139,111,71,0.35)',
    transition: 'all 0.2s',
  },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1.5px solid #C9B99A',
    background: 'rgba(255,255,255,0.6)',
    color: '#A0522D',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  speedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  speedLabel: {
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    color: '#6B5D4E',
    fontWeight: 600,
    minWidth: 110,
    fontVariantNumeric: 'tabular-nums',
  },
  slider: {
    flex: 1,
    height: 4,
    accentColor: '#8B6F47',
    cursor: 'pointer',
  },
  paraInfo: {
    fontSize: 11,
    color: '#9A8B7A',
    fontFamily: 'system-ui, sans-serif',
    fontVariantNumeric: 'tabular-nums',
  },
}
