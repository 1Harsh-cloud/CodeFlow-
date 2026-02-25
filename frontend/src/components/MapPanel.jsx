import { useState, useCallback, useEffect } from 'react'
import CodeFlowGraph from './CodeFlowGraph'

const GITHUB_TOKEN_KEY = 'codeflow_github_token'

async function safeJson(res) {
  const text = await res.text()
  if (!text?.trim()) {
    throw new Error('Backend not responding. Start the backend: cd backend && python app.py')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid response from server. Is the backend running on port 5000?')
  }
}

function ReportMarkdown({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div className="prose prose-invert prose-sm max-w-none space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-semibold text-indigo-300 mt-4">{line.slice(3)}</h3>
        if (line.startsWith('### ')) return <h4 key={i} className="text-base font-medium text-slate-700 mt-3">{line.slice(4)}</h4>
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-medium text-slate-800">{line.slice(2, -2)}</p>
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-slate-600 text-sm leading-relaxed">{line}</p>
      })}
    </div>
  )
}

function Carousel3DCard({ question, answer, index, flipped, onFlip, onNavigate, position }) {
  const positionClass = position === 0 ? 'center' : position === -1 ? 'left-1' : position === -2 ? 'left-2' : position === 1 ? 'right-1' : position === 2 ? 'right-2' : 'hidden'
  const handleClick = () => {
    if (position === 0) onFlip()
    else onNavigate(index)
  }
  return (
    <div
      className={`carousel-3d-card ${positionClass} ${flipped ? 'flipped' : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      role="button"
      tabIndex={position === 0 ? 0 : -1}
      aria-label={position === 0 ? 'Flip card' : `Go to card ${index + 1}`}
    >
      <div className="carousel-3d-front">
        <div
          className="absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-lg"
          style={{ background: 'linear-gradient(135deg, #38bdf8, #ec4899)', boxShadow: '0 4px 12px rgba(236,72,153,0.4)' }}
        >
          {index + 1}
        </div>
        <p className="text-[#1e293b] font-semibold text-xl text-center leading-relaxed max-w-[90%]">{question}</p>
        <div className="mt-6 px-6 py-3 rounded-xl text-center text-sm font-medium" style={{ background: 'rgba(56,189,248,0.15)', color: '#0ea5e9' }}>
          Click to reveal answer
        </div>
      </div>
      <div className="carousel-3d-back">
        <div
          className="absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-lg"
          style={{ background: 'rgba(255,255,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
        >
          {index + 1}
        </div>
        <p className="text-white font-medium text-lg text-center leading-relaxed max-w-[90%]">{answer}</p>
      </div>
    </div>
  )
}

function Flashcard({ question, answer }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div
      className="cursor-pointer w-full min-h-[8rem] rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg"
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
      }}
    >
      <div className="p-4 flex flex-col justify-center min-h-[8rem]">
        {flipped ? (
          <p className="text-slate-700 text-sm leading-relaxed">{answer}</p>
        ) : (
          <>
            <p className="text-slate-800 font-medium text-sm flex-1">{question}</p>
            <span className="text-xs text-violet-600 mt-2">Click to reveal answer</span>
          </>
        )}
      </div>
    </div>
  )
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function FlashcardDeck({ cards, viewMode, onShuffle }) {
  const [idx, setIdx] = useState(0)
  const [flippedIdx, setFlippedIdx] = useState(-1)
  const [shuffled, setShuffled] = useState(cards)
  const card = shuffled[idx]

  const handleShuffle = () => {
    const newOrder = shuffleArray(cards)
    setShuffled(newOrder)
    setIdx(0)
    onShuffle?.(newOrder)
  }

  useEffect(() => {
    setShuffled(cards)
    setIdx(0)
    setFlippedIdx(-1)
  }, [cards])

  useEffect(() => {
    if (viewMode !== 'study') return
    const fn = (e) => {
      if (e.key === 'ArrowLeft') { setIdx((i) => Math.max(0, i - 1)); setFlippedIdx(-1) }
      if (e.key === 'ArrowRight') { setIdx((i) => Math.min(shuffled.length - 1, i + 1)); setFlippedIdx(-1) }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlippedIdx((p) => (p === idx ? -1 : idx)) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [viewMode, shuffled.length, idx])

  if (viewMode === 'study') {
    if (!card) return <p className="text-slate-500 text-sm">No cards to study.</p>
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 40%, #db2777 100%)' }}
      >
        <div className="text-center py-8">
          <h3 className="text-3xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #38bdf8, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            3D Carousel Flashcards
          </h3>
          <p className="text-white/80 text-base mb-2">Navigate through cards • Click center to flip</p>
          <button type="button" onClick={handleShuffle} className="text-sm text-white/70 hover:text-white underline">
            Shuffle cards
          </button>
        </div>
        <div className="carousel-3d-wrapper">
          <div className="carousel-3d">
            {shuffled.map((c, i) => (
              <Carousel3DCard
                key={i}
                question={c.question}
                answer={c.answer}
                index={i}
                flipped={flippedIdx === i}
                onFlip={() => setFlippedIdx((p) => (p === i ? -1 : i))}
                onNavigate={(j) => { setIdx(j); setFlippedIdx(-1) }}
                position={i - idx}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-center items-center gap-8 py-8">
          <button
            type="button"
            onClick={() => { setIdx((i) => Math.max(0, i - 1)); setFlippedIdx(-1) }}
            disabled={idx === 0}
            className="w-14 h-14 rounded-full border-none flex items-center justify-center text-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setFlippedIdx((p) => (p === idx ? -1 : idx))}
            className="px-8 py-4 text-lg font-bold border-none rounded-full cursor-pointer transition-all hover:-translate-y-1 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #38bdf8, #ec4899)', color: 'white', boxShadow: '0 8px 24px rgba(236,72,153,0.4)' }}
          >
            🔄 Flip Card
          </button>
          <button
            type="button"
            onClick={() => { setIdx((i) => Math.min(shuffled.length - 1, i + 1)); setFlippedIdx(-1) }}
            disabled={idx >= shuffled.length - 1}
            className="w-14 h-14 rounded-full border-none flex items-center justify-center text-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          >
            →
          </button>
        </div>
        <div className="text-center pb-6">
          <div className="text-white font-semibold text-lg mb-3 opacity-90">Card {idx + 1} of {shuffled.length}</div>
          <div className="w-full max-w-md h-1.5 mx-auto rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${((idx + 1) / shuffled.length) * 100}%`, background: 'linear-gradient(135deg, #38bdf8, #ec4899)', boxShadow: '0 0 10px rgba(236,72,153,0.6)' }}
            />
          </div>
        </div>
        <div className="text-center pb-8 text-white/60 text-sm">
          <span className="inline-block px-2 py-1 rounded-md mx-1 font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>←</span>
          <span className="inline-block px-2 py-1 rounded-md mx-1 font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>→</span>
          {' Navigate • '}
          <span className="inline-block px-2 py-1 rounded-md mx-1 font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>Space</span>
          {' Flip • Click side cards to jump'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={handleShuffle} className="px-3 py-1 rounded bg-slate-200 hover:bg-zinc-600 text-sm text-slate-700">
          Shuffle
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-360px)] overflow-y-auto">
        {shuffled.map((c, i) => (
          <Flashcard key={i} question={c.question} answer={c.answer} />
        ))}
      </div>
    </div>
  )
}

const MAP_TABS = ['Map', 'Report', 'Flashcards', 'Chat']

export default function MapPanel({ isLoading, error, setError }) {
  const [githubUrl, setGithubUrl] = useState('')
  const [mapData, setMapData] = useState(null)
  const [activeTab, setActiveTab] = useState('Map')
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [mapError, setMapError] = useState('')
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem(GITHUB_TOKEN_KEY) || '')
  const [repos, setRepos] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [connectError, setConnectError] = useState('')
  // Report & Flashcards
  const [report, setReport] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [loadingReport, setLoadingReport] = useState(false)
  const [loadingFlashcards, setLoadingFlashcards] = useState(false)
  const [reportError, setReportError] = useState('')
  const [flashcardsError, setFlashcardsError] = useState('')
  const [lastPayload, setLastPayload] = useState(null) // { type, githubUrl?, githubToken?, files? }
  const [reportLength, setReportLength] = useState(3) // max pages: 3, 6, 10, 13, 15
  const [flashcardCount, setFlashcardCount] = useState(10)
  const [flashcardMode, setFlashcardMode] = useState('medium') // easy | medium | hard | exam
  const [flashcardView, setFlashcardView] = useState('study') // 'study' | 'grid'
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')

  const API_BASE = import.meta.env.VITE_API_URL || ''

  // Check for OAuth callback (token or error in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('github_token')
    const err = params.get('github_error')
    if (token) {
      localStorage.setItem(GITHUB_TOKEN_KEY, token)
      setGithubToken(token)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (err) {
      setConnectError(err === 'config' ? 'GitHub OAuth not configured' : err === 'auth' ? 'Authorization failed' : 'Connection failed')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnectGitHub = async () => {
    setConnectError('')
    try {
      const res = await fetch(`${API_BASE}/api/github/auth-url`)
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Failed to get auth URL')
      window.location.href = data.authUrl
    } catch (e) {
      setConnectError(e.message)
    }
  }

  const handleDisconnect = () => {
    localStorage.removeItem(GITHUB_TOKEN_KEY)
    setGithubToken('')
    setRepos([])
    setConnectError('')
  }

  const fetchRepos = useCallback(async () => {
    if (!githubToken) return
    setLoadingRepos(true)
    setConnectError('')
    try {
      const res = await fetch(`${API_BASE}/api/github/repos`, {
        headers: { Authorization: `Bearer ${githubToken}` },
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Failed to fetch repos')
      setRepos(data.repos || [])
    } catch (e) {
      const msg = e?.message?.includes('fetch') || e?.message?.includes('Network') 
        ? 'Backend not reachable. Start it: cd backend && python app.py' 
        : e.message
      setConnectError(msg)
    } finally {
      setLoadingRepos(false)
    }
  }, [githubToken])

  useEffect(() => {
    if (githubToken) fetchRepos()
  }, [githubToken, fetchRepos])

  const loadMap = useCallback(async (payload) => {
    setIsLoadingMap(true)
    setMapError('')
    setReport('')
    setFlashcards([])
    setReportError('')
    setFlashcardsError('')
    setChatMessages([])
    setChatError('')
    try {
      let res
      if (payload.githubUrl) {
        const body = { githubUrl: payload.githubUrl, includeContent: true }
        if (githubToken) body.githubToken = githubToken
        setLastPayload({ type: 'github', githubUrl: payload.githubUrl, githubToken: githubToken || undefined })
        res = await fetch(`${API_BASE}/api/codebase-map`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else if (payload.formData) {
        payload.formData.append('includeContent', 'true')
        setLastPayload({ type: 'zip', files: null })
        res = await fetch(`${API_BASE}/api/codebase-map`, {
          method: 'POST',
          body: payload.formData,
        })
      }
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Failed to build map')
      setMapData(data)
      if (data.filesWithContent && payload.formData) {
        setLastPayload(p => ({ ...p, files: data.filesWithContent }))
      } else if (data.filesWithContent) {
        setLastPayload(p => (p ? { ...p, files: data.filesWithContent } : null))
      }
    } catch (err) {
      setMapError(err.message)
    } finally {
      setIsLoadingMap(false)
    }
  }, [githubToken])

  const handleGithubSubmit = (e) => {
    e.preventDefault()
    const url = githubUrl.trim()
    if (!url) return
    loadMap({ githubUrl: url })
  }

  const handleZipUpload = (e) => {
    const file = e.target?.files?.[0]
    if (!file?.name?.toLowerCase().endsWith('.zip')) {
      setMapError('Please select a .zip file')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    loadMap({ formData })
    e.target.value = ''
  }

  const buildReportPayload = () => {
    if (!lastPayload) return null
    if (lastPayload.type === 'github' && lastPayload.githubUrl) {
      return { githubUrl: lastPayload.githubUrl, githubToken: lastPayload.githubToken }
    }
    if (lastPayload.files && Array.isArray(lastPayload.files) && lastPayload.files.length > 0) {
      return { files: lastPayload.files }
    }
    return null
  }

  const exportReportMD = () => {
    if (!report) return
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project-report.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportReportPDF = async () => {
    if (!report) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - margin * 2
      let y = 20
      const lineHeight = 6
      const fontSmall = 10
      const fontHeading = 14
      const fontSub = 12

      doc.setFontSize(fontSmall)
      const lines = report.split('\n')
      for (const line of lines) {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        if (line.startsWith('## ')) {
          doc.setFontSize(fontHeading)
          doc.setFont(undefined, 'bold')
          doc.text(line.slice(3), margin, y)
          doc.setFont(undefined, 'normal')
          doc.setFontSize(fontSmall)
          y += lineHeight + 2
        } else if (line.startsWith('### ')) {
          doc.setFontSize(fontSub)
          doc.setFont(undefined, 'bold')
          doc.text(line.slice(4), margin, y)
          doc.setFont(undefined, 'normal')
          doc.setFontSize(fontSmall)
          y += lineHeight + 1
        } else if (line.trim() === '') {
          y += lineHeight * 0.5
        } else {
          const split = doc.splitTextToSize(line, maxWidth)
          doc.text(split, margin, y)
          y += split.length * lineHeight
        }
      }
      doc.save('project-report.pdf')
    } catch (e) {
      setReportError('PDF download failed: ' + (e.message || 'Try allowing popups for print-to-PDF'))
    }
  }

  const exportReportDocs = () => {
    if (!report) return
    const rtfHeader = '{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}\n\\f0\\fs24\n'
    const rtfFooter = '\n}'
    const escaped = report
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\par\n')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
    const rtf = rtfHeader + escaped + rtfFooter
    const blob = new Blob([rtf], { type: 'application/rtf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project-report.rtf'
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateReport = async () => {
    const payload = buildReportPayload()
    if (!payload) {
      setReportError('Load a codebase first (GitHub or zip)')
      return
    }
    setLoadingReport(true)
    setReportError('')
    try {
      const res = await fetch(`${API_BASE}/api/codebase-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, reportLength }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Failed to generate report')
      setReport(data.report || '')
    } catch (e) {
      const msg = e?.message?.toLowerCase?.()?.includes('failed to fetch') || e?.message?.toLowerCase?.()?.includes('network')
        ? 'Cannot reach backend. On Vercel: set VITE_API_URL to your Railway URL. On Railway: add your frontend URL to CORS_ORIGINS.'
        : e.message
      setReportError(msg)
    } finally {
      setLoadingReport(false)
    }
  }

  const generateFlashcards = async () => {
    const payload = buildReportPayload()
    if (!payload) {
      setFlashcardsError('Load a codebase first (GitHub or zip)')
      return
    }
    setLoadingFlashcards(true)
    setFlashcardsError('')
    try {
      const res = await fetch(`${API_BASE}/api/codebase-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, flashcardCount, flashcardMode }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Failed to generate flashcards')
      setFlashcards(data.flashcards || [])
    } catch (e) {
      setFlashcardsError(e.message)
    } finally {
      setLoadingFlashcards(false)
    }
  }

  const sendChat = async () => {
    const payload = buildReportPayload()
    if (!payload) {
      setChatError('Load a codebase first (GitHub or zip)')
      return
    }
    const msg = chatInput.trim()
    if (!msg) return
    setChatInput('')
    setChatError('')
    const userMsg = { role: 'user', content: msg }
    setChatMessages((prev) => [...prev, userMsg])
    setChatLoading(true)
    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }))
      history.push(userMsg)
      const res = await fetch(`${API_BASE}/api/codebase-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, message: msg, history }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Failed to get response')
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply || data.response || '' }])
    } catch (e) {
      setChatError(e.message)
      setChatMessages((prev) => prev.slice(0, -1))
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div
      id="tour-map"
      className="space-y-4 p-6 rounded-2xl"
      style={{ background: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #e0e7ff 100%)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GitHub import */}
        <div id="tour-map-github" className="p-4 rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl space-y-3">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Import from GitHub</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              id="tour-map-connect"
              type="button"
              onClick={handleConnectGitHub}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border ${
                githubToken
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              {githubToken ? 'Connected' : 'Connect GitHub'}
            </button>
            {githubToken && (
              <button type="button" onClick={handleDisconnect} className="text-xs text-slate-500 hover:text-slate-600">
                Disconnect
              </button>
            )}
          </div>
          {connectError && <p className="text-sm text-red-400">{connectError}</p>}
          {githubToken && repos.length > 0 && (
            <div>
              <label className="text-xs text-slate-500 block mb-1">Or pick from your repos</label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onChange={(e) => {
                  const url = e.target.value
                  if (url) loadMap({ githubUrl: url })
                }}
                disabled={isLoadingMap}
              >
                <option value="">— Select a repo —</option>
                {repos.map(r => (
                  <option key={r.html_url} value={r.html_url}>{r.full_name}</option>
                ))}
              </select>
              {loadingRepos && <p className="text-xs text-slate-500 mt-1">Loading repos...</p>}
            </div>
          )}
          <div id="tour-map-repo">
            <label className="text-xs text-slate-500 block mb-1">Or paste repo URL</label>
            <form onSubmit={handleGithubSubmit} className="flex gap-2">
              <input
                id="tour-map-url"
                type="url"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                id="tour-map-fetch"
                type="submit"
                disabled={isLoadingMap}
                className="px-4 py-2 rounded-lg disabled:opacity-50 font-medium text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
              >
                {isLoadingMap ? 'Fetching...' : 'Fetch'}
              </button>
            </form>
          </div>
        </div>

        {/* Zip upload */}
        <div id="tour-map-upload" className="p-4 rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Upload project (.zip)</h3>
          <label className="flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-200/80 hover:border-indigo-500/60 cursor-pointer transition-colors bg-white/50">
            <input
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              className="hidden"
            />
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-slate-600 text-sm">
              {isLoadingMap ? 'Processing...' : 'Click or drop .zip of your codebase'}
            </span>
          </label>
        </div>
      </div>

      {(mapError || mapData) && (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          {mapError && (
            <div className="p-3 bg-red-500/10 border-b border-slate-200 text-red-400 text-sm">
              {mapError}
            </div>
          )}
          {mapData?.nodes?.length > 0 && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-white/80">
                {MAP_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-100/50'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/30'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'Map' && (
                <div className="h-[calc(100vh-260px)] min-h-[600px]">
                  <CodeFlowGraph nodes={mapData.nodes} edges={mapData.edges} isConnected={!!mapData} />
                </div>
              )}

              {activeTab === 'Report' && (
                <div className="p-6 bg-slate-50 min-h-[400px]">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                    <h3 className="text-lg font-medium text-slate-800">Project Report</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Length:</span>
                        <select
                          value={reportLength}
                          onChange={(e) => setReportLength(Number(e.target.value))}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value={3}>1-3 pages</option>
                          <option value={6}>4-6 pages</option>
                          <option value={10}>7-10 pages</option>
                          <option value={13}>11-13 pages</option>
                          <option value={15}>14-15 pages</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={generateReport}
                        disabled={loadingReport || !buildReportPayload()}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-medium text-sm"
                      >
                        {loadingReport ? 'Generating...' : 'Generate Report'}
                      </button>
                      {report && (
                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200" title="Export report">
                          <button
                            type="button"
                            onClick={exportReportPDF}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-zinc-600 text-slate-800 text-xs font-medium"
                            title="Export as PDF"
                          >
                            PDF
                          </button>
                          <button
                            type="button"
                            onClick={exportReportMD}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-zinc-600 text-slate-800 text-xs font-medium"
                            title="Export as Markdown"
                          >
                            MD
                          </button>
                          <button
                            type="button"
                            onClick={exportReportDocs}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-zinc-600 text-slate-800 text-xs font-medium"
                            title="Export for Word/Google Docs"
                          >
                            Docs
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {reportError && <p className="text-red-400 text-sm mb-3">{reportError}</p>}
                  <div className="rounded-lg border border-slate-200 bg-white/50 p-4 max-h-[calc(100vh-320px)] overflow-y-auto">
                    {report ? <ReportMarkdown text={report} /> : (
                      <p className="text-slate-500 text-sm">Click &quot;Generate Report&quot; to create an AI summary of your codebase.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Flashcards' && (
                <div className="p-6 bg-slate-50 min-h-[400px]">
                  <div className="mb-4 space-y-3">
                    <h3 className="text-lg font-medium text-slate-800">Learning Flashcards</h3>
                    <p className="text-xs text-slate-500">Choose number of cards and difficulty before generating.</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Cards:</label>
                        <select
                          value={flashcardCount}
                          onChange={(e) => setFlashcardCount(Number(e.target.value))}
                          className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        >
                          <option value={5}>5 cards</option>
                          <option value={10}>10 cards</option>
                          <option value={15}>15 cards</option>
                          <option value={20}>20 cards</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Mode:</label>
                        <select
                          value={flashcardMode}
                          onChange={(e) => setFlashcardMode(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="exam">Exam</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={generateFlashcards}
                        disabled={loadingFlashcards || !buildReportPayload()}
                        className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 font-medium text-sm"
                      >
                        {loadingFlashcards ? 'Generating...' : 'Generate Flashcards'}
                      </button>
                    </div>
                  </div>
                  {flashcardsError && <p className="text-red-400 text-sm mb-3">{flashcardsError}</p>}
                  {flashcards.length > 0 ? (
                    <>
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setFlashcardView('study')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${flashcardView === 'study' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-zinc-600'}`}
                        >
                          Study (3D Carousel)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlashcardView('grid')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${flashcardView === 'grid' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-zinc-600'}`}
                        >
                          Grid
                        </button>
                      </div>
                      <FlashcardDeck cards={flashcards} viewMode={flashcardView} />
                    </>
                  ) : (
                    <p className="text-slate-500 text-sm">Click &quot;Generate Flashcards&quot; to create visual learning cards from your codebase.</p>
                  )}
                </div>
              )}

              {activeTab === 'Chat' && (
                <div className="p-6 bg-slate-50 flex flex-col h-[calc(100vh-260px)] min-h-[500px]">
                  <h3 className="text-lg font-medium text-slate-800 mb-3">AI Chat</h3>
                  <p className="text-xs text-slate-500 mb-3">Ask questions about your codebase. Load a repo or zip first.</p>
                  {chatError && <p className="text-red-400 text-sm mb-3">{chatError}</p>}
                  <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white/50 p-4 mb-4 space-y-3 min-h-0">
                    {chatMessages.length === 0 && (
                      <p className="text-slate-500 text-sm">Send a message to start chatting about your codebase.</p>
                    )}
                    {chatMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                            m.role === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-800 [&_pre]:bg-slate-100 [&_code]:bg-slate-100'
                          }`}
                        >
                          {m.role === 'assistant' ? <ReportMarkdown text={m.content} /> : m.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-lg px-4 py-2 text-sm bg-slate-200 text-slate-600">
                          Thinking...
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
                      placeholder="Ask about the codebase..."
                      disabled={chatLoading || !buildReportPayload()}
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={sendChat}
                      disabled={chatLoading || !chatInput.trim() || !buildReportPayload()}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-medium text-sm"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {mapData && mapData.nodes?.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No code structure found. Try a repo with .py, .js, .ts, .jsx, .tsx files.
            </div>
          )}
        </div>
      )}

      {!mapData && !mapError && (
        <div className="p-8 rounded-lg border border-dashed border-slate-200 text-center text-slate-500">
          <p className="mb-2">Import a GitHub repo or upload a .zip of your project</p>
          <p className="text-sm">Visualize folders → files → functions / routes / classes</p>
        </div>
      )}
    </div>
  )
}
