'use client'

import { useState, useEffect, useRef, useCallback, CSSProperties } from 'react'

const SAMPLE_TEXT = `This is a sample passage to test the reader. You can replace this by entering an Internet Archive book identifier above, or by pasting your own text below.

The Internet Archive is a non-profit library of millions of free books, movies, software, music, websites, and more. Founded in 1996, it has grown to become one of the largest digital libraries in the world.

To use this reader with an Internet Archive book, find a book on archive.org, copy its identifier from the URL (the part after /details/), and paste it in the field above. The reader will attempt to fetch the plain text version of the book.

Alternatively, you can paste any text directly into the text area below and use the speech controls to have it read aloud to you.`

interface BookMeta {
  title: string
  creator: string
  date: string
  description: string
}

export default function BookSpeechReader() {
  const [bookId, setBookId] = useState('')
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

  const proxyFetch = async (url: string) => {
    const proxies = [
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    ]

    let lastError: Error | undefined
    try {
      const res = await fetch(url, { mode: 'cors' })
      if (res.ok) return res
    } catch {
      // Direct failed, try proxies
    }

    for (const makeProxy of proxies) {
      try {
        const res = await fetch(makeProxy(url))
        if (res.ok) return res
      } catch (e) {
        lastError = e as Error
      }
    }
    throw lastError || new Error('All fetch attempts failed')
  }

  const fetchBook = async () => {
    if (!bookId.trim()) return
    setLoading(true)
    setError('')
    setBookMeta(null)

    const id = extractId(bookId)

    try {
      const metaRes = await proxyFetch(`https://archive.org/metadata/${id}`)
      const meta = await metaRes.json()

      if (!meta.metadata) throw new Error('Book not found on Internet Archive. Check the ID and try again.')

      setBookMeta({
        title: meta.metadata?.title || id,
        creator: meta.metadata?.creator || 'Unknown Author',
        date: meta.metadata?.date || '',
        description: meta.metadata?.description || '',
      })

      const files = meta.files || []
      const textFile =
        files.find((f: { name: string }) => f.name.endsWith('_djvu.txt')) ||
        files.find((f: { name: string }) => f.name.endsWith('.txt') && !f.name.includes('_meta') && !f.name.includes('_files')) ||
        files.find((f: { name: string }) => f.name.endsWith('_chocr.html.gz'))

      if (!textFile) {
        throw new Error(
          'No plain text version available for this book. Try a different edition, or copy the text from the Archive\'s web reader and paste it below.'
        )
      }

      const textUrl = `https://archive.org/download/${id}/${encodeURIComponent(textFile.name)}`
      const textRes = await proxyFetch(textUrl)

      const bookText = await textRes.text()
      const cleaned = bookText
        .replace(/\f/g, '\n\n')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      if (cleaned.length < 50) {
        throw new Error('The text file appears to be empty or very short. Try pasting text manually.')
      }

      setText(cleaned)
      setDisplayText(cleaned)
      setMode('reading')
      setCurrentParagraph(0)
    } catch (err) {
      setError(
        (err as Error).message ||
          'Failed to fetch book. This may be due to browser restrictions. Try pasting text manually.'
      )
    } finally {
      setLoading(false)
    }
  }

  const loadPastedText = () => {
    if (text.trim()) {
      setDisplayText(text)
      setMode('reading')
      setCurrentParagraph(0)
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
    if (r <= 0.5) return 'Slow'
    if (r <= 0.8) return 'Relaxed'
    if (r <= 1.0) return 'Normal'
    if (r <= 1.5) return 'Brisk'
    if (r <= 2.0) return 'Fast'
    return 'Rapid'
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
          <h1 style={styles.title}>Spoken Archive</h1>
          <p style={styles.subtitle}>
            Turn any Internet Archive book into a listening experience
          </p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Internet Archive Book ID or URL</label>
            <div style={styles.fetchRow}>
              <input
                style={styles.input}
                type="text"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                placeholder="e.g. alice_in_wonderland or https://archive.org/details/..."
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
                  'Fetch'
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
            <span style={styles.dividerText}>or paste text directly</span>
          </div>

          <div style={styles.inputGroup}>
            <textarea
              style={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste any text here — a book chapter, article, essay, or anything you'd like read aloud..."
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
              Start Reading
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
            Try with sample text
          </button>
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
          &larr; Back
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
            <button style={styles.skipBtn} onClick={skipBack} title="Previous paragraph">
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

            <button style={styles.skipBtn} onClick={skipForward} title="Next paragraph">
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
            Paragraph {currentParagraph + 1} of {paragraphs.length}
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
    marginBottom: 8,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#6B5D4E',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: "'system-ui', sans-serif",
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
    boxSizing: 'border-box',
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
    minWidth: 90,
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
