import { useState } from 'react'
import CodeEditor from './CodeEditor'

const LANGUAGES = [
  { value: 'python', label: 'Python', monaco: 'python' },
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { value: 'java', label: 'Java', monaco: 'java' },
  { value: 'c', label: 'C', monaco: 'c' },
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
]

const EXAMPLES = [
  {
    id: 'bst',
    label: 'Binary Search Tree',
    prompt: 'Implement a binary search tree with insert, delete, and search operations. Use built-in demo data only - do NOT use input(). Output only the final result, no debug or separators.',
    icon: 'BST',
  },
  {
    id: 'binary',
    label: 'Binary Search',
    prompt: 'Implement binary search. Use built-in demo data only - do NOT use input(). Include a sorted list and target in the code. Output only the result, no debug or separators.',
    icon: 'BS',
  },
  {
    id: 'dfs',
    label: 'Depth First Search',
    prompt: 'Implement DFS for graph traversal. Use a built-in demo graph - do NOT use input(). Print/output only the traversal result, no separators or debug output.',
    icon: 'DFS',
  },
  {
    id: 'merge',
    label: 'Merge Sort',
    prompt: 'Implement merge sort. Use a built-in demo list - do NOT use input(). Exactly 2 output statements: original list, then sorted list. No other output - no debug, no separators, no step-by-step.',
    icon: 'MS',
  },
  {
    id: 'quick',
    label: 'Quick Sort',
    prompt: 'Implement quick sort. Use a built-in demo list - do NOT use input(). Output only the original list and then the sorted list. No debug output or separators.',
    icon: 'QS',
  },
]

export default function GeneratePanel({
  onGenerate,
  onExecute,
  onLanguageChange,
  language = 'python',
  code,
  setCode,
  output,
  stdin,
  onStdinChange,
  isLoading,
  error,
}) {
  const [prompt, setPrompt] = useState('')

  const selectedLang = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0]
  const canRun = ['python', 'javascript', 'java', 'c', 'cpp'].includes(language)

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (prompt.trim()) onGenerate?.(prompt, language)
  }

  return (
    <div
      className="p-6 rounded-2xl grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6"
      style={{ background: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #e0e7ff 100%)' }}
    >
      {/* Left: Prompt + Examples */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <label className="block text-slate-800 font-semibold text-base">
              What do you want to build?
            </label>
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
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe what you want to build...

Example: Implement a linked list with insert and delete operations

Try: Binary search with user input
Try: Python function to calculate factorial
Try: Linear search in a list`}
            className="w-full h-[180px] rounded-xl bg-white/80 border border-slate-300 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30 outline-none p-4 text-slate-800 text-[15px] resize-y transition-all placeholder:text-slate-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="w-full mt-4 py-3.5 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>→</span>
                <span>Generate Code</span>
              </>
            )}
          </button>
        </div>

        <div>
          <p className="text-slate-500 font-semibold text-sm mb-3">Quick Start Examples</p>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  setPrompt(ex.prompt)
                  onStdinChange?.('')
                }}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:border-slate-300 hover:translate-x-1 transition-all text-left group shadow-lg"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                    style={{
                    background: ex.id === 'bst' ? 'linear-gradient(135deg, #10b981, #059669)' :
                      ex.id === 'binary' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                        ex.id === 'dfs' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' :
                          ex.id === 'merge' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                            'linear-gradient(135deg, #ec4899, #db2777)',
                  }}
                >
                  {ex.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-slate-800 font-semibold">{ex.label}</h3>
                  <p className="text-slate-500 text-sm truncate">Click to try →</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Editor + Input + Output */}
      <div className="flex flex-col gap-4">
        {/* Code Editor Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm overflow-hidden shadow-xl">
          <div className="flex flex-col gap-1 px-4 py-3 bg-slate-100/80 border-b border-slate-200/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium text-sm">Code Editor · {selectedLang.label}</span>
              {canRun ? (
              <button
                onClick={() => onExecute?.(language)}
                disabled={isLoading}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold text-white text-sm transition-colors"
              >
                ▶ Run Code
              </button>
            ) : (
              <span className="text-slate-500 text-xs">Run supported for Python, JS, Java, C, C++</span>
            )}
            </div>
            {['c', 'cpp', 'java'].includes(language) && (
              <p className="text-slate-500 text-xs">C/C++/Java: Add RAPIDAPI_KEY (Judge0 CE) to .env for cloud run. Or install gcc/Java locally.</p>
            )}
          </div>
          <div className="p-0">
            <CodeEditor value={code} onChange={setCode} language={selectedLang.monaco} height={280} />
          </div>
        </div>

        {/* Input Box */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-xl">
          <h3 className="text-slate-600 font-semibold text-sm mb-2">Input (for input() prompts)</h3>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange?.(e.target.value)}
            placeholder="Code uses input()? Leave empty if not needed. Otherwise: one value per line (e.g. 1 3 5 7 9 then 7)"
            className="w-full min-h-[70px] p-3 rounded-xl bg-white border border-slate-200 font-mono text-sm text-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 outline-none resize-y placeholder:text-slate-500"
            rows={3}
          />
        </div>

        {/* Output Card - fixed height, scrolls inside */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-xl shrink-0">
          <h3 className="text-slate-600 font-semibold text-sm mb-2">Output</h3>
          <div className="line-by-line-scroll h-[280px] min-h-0 overflow-y-auto overflow-x-hidden p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm">
            <pre className="whitespace-pre-wrap text-slate-700">{output || 'Run code to see output here.'}</pre>
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
