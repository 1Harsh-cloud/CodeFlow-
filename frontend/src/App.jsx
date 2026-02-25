import { useState, useRef } from 'react'
import FileUpload from './components/FileUpload'
import TextInput from './components/TextInput'
import CodeEditor from './components/CodeEditor'
import ExecutionPanel from './components/ExecutionPanel'
import TabNav from './components/TabNav'
import PlayPanel from './components/PlayPanel'
import GameOutputPanel from './components/GameOutputPanel'
import ReadyToPlay from './components/ReadyToPlay'
import MapPanel from './components/MapPanel'
import GeneratePanel from './components/GeneratePanel'
import ExplainPanel from './components/ExplainPanel'
import TutorialTour from './components/TutorialTour'
import { PRESET_GAMES } from './presetGames'

const TABS = {
  EXPLAIN: 'explain',
  GENERATE: 'generate',
  PLAY: 'play',
  MAP: 'map',
}

function App() {
  const [activeTab, setActiveTab] = useState(TABS.MAP)
  const [code, setCode] = useState('')
  const [lineByLine, setLineByLine] = useState([])
  const [output, setOutput] = useState('')
  const [stdin, setStdin] = useState('')
  // Separate state for Generate vs Explain - they should not share
  const [generateCode, setGenerateCode] = useState('')
  const [generateOutput, setGenerateOutput] = useState('')
  const [generateStdin, setGenerateStdin] = useState('')
  const [explainCode, setExplainCode] = useState('')
  const [explainOutput, setExplainOutput] = useState('')
  const [explainStdin, setExplainStdin] = useState('')
  const [gameHtml, setGameHtml] = useState('')
  const [gameDescription, setGameDescription] = useState('')
  const [gameHtmlToShow, setGameHtmlToShow] = useState('')
  const [playLineByLine, setPlayLineByLine] = useState([])
  const [playLineByLineLoading, setPlayLineByLineLoading] = useState(false)
  const [playLineByLineError, setPlayLineByLineError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [generateLanguage, setGenerateLanguage] = useState('python')
  const [explainLanguage, setExplainLanguage] = useState('python')
  const tutorialRef = useRef(null)

  const API_BASE = import.meta.env.VITE_API_URL || ''

  const parseApiError = (err) => {
    if (err?.message?.includes('Unexpected token') || err?.message?.includes('is not valid JSON')) {
      return 'Backend not running. Start it: cd backend && python app.py'
    }
    return err?.message || 'Request failed'
  }

  const handleExplain = async (codeToExplain) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToExplain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Explain failed')
      setLineByLine(data.lineByLine ?? [])
      setExplainCode(data.code ?? codeToExplain)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file) => {
    setIsLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setExplainCode(data.code)
      setLineByLine(data.lineByLine ?? [])
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async (prompt, language = 'python') => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generate failed')
      setGenerateCode(data.code)
      setGenerateOutput('')
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateGame = async (prompt, presetKey) => {
    setError('')
    setGameHtml('')
    setGameHtmlToShow('')
    setGameDescription(prompt)

    if (presetKey && PRESET_GAMES[presetKey]) {
      const html = PRESET_GAMES[presetKey]
      setGameHtml(html)
      setGameHtmlToShow(html)
      setPlayLineByLine([])
      setPlayLineByLineError('')
      setPlayLineByLineLoading(true)
      fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: html }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.lineByLine?.length) setPlayLineByLine(d.lineByLine)
          else setPlayLineByLineError(d?.error || 'Could not generate explanation')
        })
        .catch((e) => setPlayLineByLineError(e?.message || 'Request failed'))
        .finally(() => setPlayLineByLineLoading(false))
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/generate-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const text = await res.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(text || 'Server returned invalid response. Backend may have timed out.')
      }
      if (!res.ok) throw new Error(data.error || data.message || `Generate failed (${res.status})`)
      if (data.html) {
        setGameHtml(data.html)
        setGameHtmlToShow(data.html)
        setPlayLineByLine([])
        setPlayLineByLineError('')
        setPlayLineByLineLoading(true)
        fetch(`${API_BASE}/api/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.html }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.lineByLine?.length) setPlayLineByLine(d.lineByLine)
            else setPlayLineByLineError(d?.error || 'Could not generate explanation')
          })
          .catch((e) => setPlayLineByLineError(e?.message || 'Request failed'))
          .finally(() => setPlayLineByLineLoading(false))
      }
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunGame = (html) => {
    setGameHtmlToShow(html || gameHtml)
  }

  const handleImprovePrompt = async (prompt) => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/improve-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Improve failed')
      return data.improvedPrompt || ''
    } catch (err) {
      setError(parseApiError(err))
      return ''
    }
  }

  const doExecute = async (codeVal, stdinVal, setOutputFn, lang = 'python') => {
    setError('')
    setOutputFn('')
    if (lang === 'html') {
      const blob = new Blob([codeVal], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setOutputFn('Preview opened in new tab')
      return
    }
    if (lang === 'css') {
      const html = `<!DOCTYPE html><html><head><style>${codeVal}</style></head><body><h1>Heading</h1><p>Paragraph</p><div class="box">Box</div><button>Button</button></body></html>`
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setOutputFn('Preview opened in new tab')
      return
    }
    if ((codeVal.includes('input(') || codeVal.includes('input (')) && !stdinVal.trim()) {
      setError('Input box is empty. Add your values above (one per line), then click Run Code.')
      setOutputFn('Input box is empty. Add values in the Input box above Run Code (one per line), then run again.')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeVal, stdin: stdinVal, language: lang }),
      })
      const data = await res.json()
      if (data.error) {
        setOutputFn(data.error)
        setError(data.error)
      } else {
        setOutputFn(data.output || '(no output)')
      }
    } catch (err) {
      setError(parseApiError(err))
      setOutputFn(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecute = async (lang = 'python') => doExecute(code, stdin, setOutput, lang)
  const handleExecuteGenerate = async (lang = 'python') => doExecute(generateCode, generateStdin, setGenerateOutput, lang)
  const handleExecuteExplain = async (lang = 'python') => doExecute(explainCode, explainStdin, setExplainOutput, lang)

  return (
    <div className="min-h-screen text-slate-800">
      <TutorialTour ref={tutorialRef} setActiveTab={setActiveTab} TABS={TABS} />
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-indigo-600">Code</span><span className="text-slate-900">Flow</span>
          </h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => tutorialRef.current?.startTour?.()}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Tutorial
            </button>
            <p className="text-sm text-slate-500">Code explanation & playground</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs: Explain vs Generate */}
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

        <div className={`grid gap-6 mt-4 ${activeTab === TABS.MAP ? 'grid-cols-1' : [TABS.GENERATE, TABS.EXPLAIN].includes(activeTab) ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Explain tab: full-width ExplainPanel */}
          {activeTab === TABS.EXPLAIN && (
            <div className="col-span-full">
              <ExplainPanel
                onExplain={() => handleExplain(explainCode)}
                onFileUpload={handleFileUpload}
                onExecute={handleExecuteExplain}
                onLanguageChange={setExplainLanguage}
                language={explainLanguage}
                code={explainCode}
                setCode={setExplainCode}
                output={explainOutput}
                stdin={explainStdin}
                onStdinChange={setExplainStdin}
                lineByLine={lineByLine}
                isLoading={isLoading}
                error={error}
              />
            </div>
          )}

          {/* Generate tab: full-width GeneratePanel with its own 2fr 3fr layout */}
          {activeTab === TABS.GENERATE && (
            <div className="col-span-full">
              <GeneratePanel
                onGenerate={handleGenerate}
                onExecute={handleExecuteGenerate}
                onLanguageChange={setGenerateLanguage}
                language={generateLanguage}
                code={generateCode}
                setCode={setGenerateCode}
                output={generateOutput}
                stdin={generateStdin}
                onStdinChange={setGenerateStdin}
                isLoading={isLoading}
                error={error}
              />
            </div>
          )}

          {/* Left: Input Section - for Play only (Explain has its own panel) */}
          {activeTab !== TABS.GENERATE && activeTab !== TABS.EXPLAIN && (
          <div className={`space-y-4 ${activeTab === TABS.MAP ? 'col-span-full' : ''}`}>
            {activeTab === TABS.MAP && (
              <MapPanel isLoading={isLoading} error={error} setError={setError} />
            )}
            {activeTab === TABS.PLAY && (
              <div
                id="tour-play"
                className="space-y-4 p-6 rounded-2xl"
                style={{ background: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #e0e7ff 100%)' }}
              >
                <PlayPanel
                  onGenerateGame={handleGenerateGame}
                  onImprovePrompt={handleImprovePrompt}
                  onRunGame={handleRunGame}
                  isLoading={isLoading}
                  gameDescription={gameDescription}
                  gameHtml={gameHtml}
                />

            {activeTab !== TABS.MAP && activeTab !== TABS.EXPLAIN && error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {activeTab !== TABS.MAP && activeTab !== TABS.GENERATE && (
              <>
            {/* Code Editor — bigger when showing generated game code (code matters more) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200/60">
                <h3 className="text-sm font-medium text-slate-600">
                  {activeTab === TABS.PLAY && gameHtml ? (
                    <>Generated Game Code <span className="text-indigo-600">— Review & edit before running</span></>
                  ) : (
                    'Code Editor'
                  )}
                </h3>
              </div>
              <CodeEditor
                value={activeTab === TABS.PLAY && gameHtml ? gameHtml : code}
                onChange={activeTab === TABS.PLAY && gameHtml ? setGameHtml : setCode}
                language={activeTab === TABS.PLAY && gameHtml ? 'html' : 'python'}
                height={activeTab === TABS.PLAY && gameHtml ? 380 : 280}
              />
            </div>

            {/* Run Button */}
            {activeTab === TABS.PLAY && gameHtml ? (
              <button
                onClick={() => handleRunGame(gameHtml)}
                className="w-full py-3 px-4 rounded-xl font-medium transition-all text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
              >
                ▶ Run Game
              </button>
            ) : (
              <button
                onClick={() => handleExecute()}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-medium transition-all text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
              >
                {isLoading ? 'Running...' : '▶ Run Code'}
              </button>
            )}
              </>
            )}
              </div>
            )}
          </div>
          )}

          {/* Right: Output Section — Play tab: purple theme; else default */}
          {activeTab !== TABS.MAP && activeTab !== TABS.GENERATE && activeTab !== TABS.EXPLAIN && (
          <div
            className="flex flex-col min-h-[calc(100vh-12rem)] rounded-[32px] border border-slate-200/80 shadow-xl overflow-hidden backdrop-blur-sm"
            style={{
              background: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #e0e7ff 100%)'
            }}
          >
            {activeTab === TABS.PLAY && gameHtml ? (
              <div className="flex-1 min-h-0 flex flex-col p-6 overflow-auto">
                <GameOutputPanel html={gameHtmlToShow} description={gameDescription} gameCode={gameHtml} className="flex-1 min-h-0 flex flex-col shrink-0" />
                <div className="shrink-0 mt-4 rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl overflow-hidden flex flex-col max-h-[400px] min-h-0">
                  <div className="px-5 py-4 border-b border-slate-200/60 shrink-0">
                    <h3 className="text-slate-800 font-semibold text-sm tracking-tight">Line-by-line explanation</h3>
                    <p className="text-slate-500 text-xs mt-0.5">AI-powered breakdown of each line of your game code only</p>
                  </div>
                  {playLineByLine.length > 0 ? (
                    <div className="line-by-line-scroll space-y-3 flex-1 min-h-0 overflow-y-auto p-4">
                      {playLineByLine.map(({ line, code: lineCode, explanation }) => (
                        <div key={line} className="p-4 rounded-xl bg-slate-100/80 border border-slate-200/50 shrink-0">
                          <div className="flex gap-3 mb-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-600 font-mono text-xs font-semibold shrink-0">L{line}</span>
                            <code className="text-xs text-slate-800 font-mono break-words min-w-0 flex-1 leading-relaxed">{lineCode?.trim() || '(empty)'}</code>
                          </div>
                          <p className="text-sm text-slate-600 pl-10 leading-relaxed">{explanation}</p>
                        </div>
                      ))}
                    </div>
                  ) : playLineByLineError ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                      <p className="text-slate-600 text-sm">{playLineByLineError}</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                      <span className="inline-block w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mr-2" />
                      <p className="text-slate-500 text-sm">Generating explanation… (20–45 sec)</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === TABS.PLAY && !gameHtml && !code.trim() ? (
              <ReadyToPlay />
            ) : null}
            {(activeTab !== TABS.PLAY || (activeTab === TABS.PLAY && !gameHtml && code.trim())) && (
              <div className="flex-1 flex flex-col p-6">
                <ExecutionPanel
                  output={output}
                  stdin={stdin}
                  onStdinChange={setStdin}
                  showGameInput={!(activeTab === TABS.PLAY && !gameHtml && (code.includes('input(') || code.includes('input (')))}
                />
              </div>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
