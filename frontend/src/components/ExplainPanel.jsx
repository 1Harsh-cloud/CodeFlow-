import { useRef } from 'react'
import CodeEditor from './CodeEditor'

const LANGUAGES = [
  { value: 'python', label: 'Python', monaco: 'python' },
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { value: 'java', label: 'Java', monaco: 'java' },
  { value: 'c', label: 'C', monaco: 'c' },
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
]

export default function ExplainPanel({
  onExplain,
  onFileUpload,
  onExecute,
  onLanguageChange,
  language = 'python',
  code,
  setCode,
  output,
  stdin,
  onStdinChange,
  lineByLine,
  isLoading,
  error,
}) {
  const inputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileUpload?.(file)
    e.target.value = ''
  }

  return (
    <div
      id="tour-explain"
      className="p-6 rounded-2xl grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-8"
      style={{ background: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #e0e7ff 100%)' }}
    >
      {/* Left: Upload + Explain + Line-by-line */}
      <div className="flex flex-col gap-6 min-h-0">
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-6 shadow-xl shrink-0">
          <div className="mb-4">
            <h2 className="text-slate-800 font-semibold text-base tracking-tight">Explain Your Code</h2>
            <p className="text-slate-500 text-sm mt-1">
              Upload a file or paste code in the editor for an AI-powered line-by-line breakdown.
            </p>
          </div>
          <div
            id="tour-exp-upload"
            onClick={() => !isLoading && inputRef.current?.click()}
            className="flex items-center justify-center gap-3 p-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500/50 cursor-pointer transition-colors bg-white/50 mb-4"
          >
            <input
              ref={inputRef}
              type="file"
              accept="*"
              onChange={handleFileChange}
              className="hidden"
            />
            <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-slate-600 text-sm">
              {isLoading ? 'Processing...' : 'Click to upload any file (code, PDF, Word, docs)'}
            </span>
          </div>
          <button
            id="tour-exp-btn"
            type="button"
            onClick={() => onExplain?.(code)}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Explaining...</span>
              </>
            ) : (
              <>
                <span>→</span>
                <span>Explain Code in Editor</span>
              </>
            )}
          </button>
        </div>

        {/* Line-by-line - stretches to match Output bottom, scrolls INSIDE */}
        <div id="tour-exp-linebyline" className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-xl flex flex-col flex-1 min-h-[279px] max-h-[511px] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/60 shrink-0">
            <h3 className="text-slate-800 font-semibold text-sm tracking-tight">Line-by-line explanation</h3>
            <p className="text-slate-500 text-xs mt-0.5">AI-powered breakdown of each line</p>
          </div>
          {lineByLine.length > 0 ? (
            <div className="line-by-line-scroll space-y-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
              {lineByLine.map(({ line, code: lineCode, explanation }) => (
                <div key={line} className="p-4 rounded-xl bg-slate-100/80 border border-slate-200/50 shrink-0 hover:border-slate-300/50 transition-colors">
                  <div className="flex gap-3 mb-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-600 font-mono text-xs font-semibold shrink-0">L{line}</span>
                    <code className="text-xs text-slate-800 font-mono break-words min-w-0 flex-1 leading-relaxed">{lineCode?.trim() || '(empty)'}</code>
                  </div>
                  <p className="text-sm text-slate-600 pl-10 leading-relaxed">{explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-1">No explanation yet</p>
              <p className="text-slate-500 text-sm max-w-[260px] leading-relaxed">
                Paste code in the editor, then click <span className="text-indigo-600 font-medium">&quot;Explain Code in Editor&quot;</span> to get AI-powered line-by-line breakdowns.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Editor + Input + Output */}
      <div className="flex flex-col gap-6 min-w-0">
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 overflow-hidden shadow-xl shrink-0">
          <div className="flex flex-col gap-1 px-4 py-3 bg-slate-100/80 border-b border-slate-200/60">
            <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-medium text-sm">Code Editor</span>
              <select
                value={language}
                onChange={(e) => onLanguageChange?.(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            {['python', 'javascript', 'java', 'c', 'cpp'].includes(language) ? (
              <button
                id="tour-exp-run"
                onClick={() => onExecute?.(language)}
                disabled={isLoading}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold text-white text-sm transition-colors"
              >
                ▶ Run Code
              </button>
            ) : null}
            </div>
            {['c', 'cpp', 'java'].includes(language) && (
              <p className="text-slate-500 text-xs">C/C++/Java: Add RAPIDAPI_KEY (Judge0 CE) to .env for cloud run. Or install gcc/Java.</p>
            )}
          </div>
          <div className="p-0">
            <CodeEditor value={code} onChange={setCode} language={LANGUAGES.find((l) => l.value === language)?.monaco || 'python'} height={280} />
          </div>
        </div>

        <div id="tour-exp-input" className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-xl shrink-0">
          <h3 className="text-slate-600 font-semibold text-sm mb-2">Input (for input() prompts)</h3>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange?.(e.target.value)}
            placeholder="Code uses input()? Leave empty if not needed. Otherwise: one value per line"
            className="w-full min-h-[70px] p-3 rounded-xl bg-white border border-slate-200 font-mono text-sm text-slate-800 focus:border-indigo-500/50 outline-none resize-y placeholder:text-slate-500"
            rows={3}
          />
        </div>

        <div id="tour-exp-output" className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-xl shrink-0">
          <h3 className="text-slate-600 font-semibold text-sm mb-2">Output</h3>
          <div className="h-[216px] p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm overflow-auto">
            <pre className="whitespace-pre-wrap text-slate-700">{output || 'Run code to see output.'}</pre>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
