import { useState } from 'react'

export default function GameOutputPanel({ html, description, gameCode, className = '' }) {
  const [showCode, setShowCode] = useState(false)
  const codeToShow = gameCode || html

  if (!html) {
    return (
      <div>
        <h3 className="text-sm font-medium text-slate-600 mb-2">Game Output</h3>
        <div className="min-h-[300px] p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
          Generate a game and click Run Game to play here.
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <h3 className="text-sm font-medium text-slate-600 shrink-0">Game Output — Play here</h3>
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-200 bg-white mt-2 flex flex-col shadow-inner">
        <iframe
          title="Your Game"
          srcDoc={html}
          className="w-full flex-1 min-h-0 border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <div className="shrink-0 mt-2">
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-sm text-amber-600 hover:text-amber-700 mb-2"
        >
          {showCode ? '▼ Hide' : '▶ View'} Code behind the game
        </button>
        {showCode && codeToShow && (
          <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden max-h-[300px] overflow-y-auto">
            <pre className="p-4 text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
              {codeToShow}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
