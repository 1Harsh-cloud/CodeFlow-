import { useState } from 'react'

const PRESETS = [
  { key: 'guess', label: '🎯 Number Guess', prompt: 'guess' },
  { key: 'rps', label: '✂️ Rock Paper Scissors', prompt: 'rps' },
  { key: 'story', label: '🌲 Text Adventure', prompt: 'story' },
  { key: 'quiz', label: '❓ Code Quiz', prompt: 'quiz' },
  { key: 'trivia', label: '🔢 Number Trivia', prompt: 'trivia' },
]

const GAME_IDEAS = [
  { label: 'Pick a game idea…', value: '' },
  { label: '🦩 Flamingo in pond, collect fish, avoid crocodiles ⚡', value: 'Flamingo platformer in a pond with lily pads, collect fish, avoid crocodiles', presetKey: 'flamingo' },
  { label: '🐍 Snake game, grow by eating apples ⚡', value: 'Classic Snake game, use arrow keys, grow when eating apples, don\'t hit walls or yourself', presetKey: 'snake' },
  { label: '👾 Mario platformer, coins, enemies, jump ⚡', value: 'Mario-style platformer with coins, goombas, platforms, gravity and jump', presetKey: 'mario' },
  { label: '🏎️ Racing game one ⚡', value: 'Speed Rush - Racing game with moving track, dodge obstacles, collect coins, speed increases', presetKey: 'racing' },
  { label: '🦊 Fox in forest, collect berries, avoid wolves ⚡', value: 'Fox platformer in a forest, collect berries, avoid wolves, jump between trees', presetKey: 'fox' },
  { label: '🐟 Fish in ocean, eat plankton, avoid sharks ⚡', value: 'Fish game in ocean, eat plankton to grow, avoid sharks', presetKey: 'fish' },
  { label: '🧱 Breakout, paddle, bricks, ball ⚡', value: 'Breakout game, paddle at bottom, break bricks with bouncing ball', presetKey: 'breakout' },
  { label: '🐸 Frog crossing, cross the road ⚡', value: 'Frog crossing game, hop across road avoiding cars, reach the pond', presetKey: 'frogger' },
]

export default function PlayPanel({ onPlay, onGenerateGame, onImprovePrompt, onRunGame, isLoading, gameDescription, gameHtml }) {
  const [prompt, setPrompt] = useState('')
  const [gamePrompt, setGamePrompt] = useState('')
  const [improving, setImproving] = useState(false)

  const handlePreset = (p) => onPlay?.(p)
  const handleImprove = async (e) => {
    e?.preventDefault()
    if (!gamePrompt.trim()) return
    setImproving(true)
    try {
      const improved = await onImprovePrompt?.(gamePrompt)
      if (improved) setGamePrompt(improved)
    } finally {
      setImproving(false)
    }
  }
  const handleSubmit = (e) => {
    e?.preventDefault()
    if (prompt.trim()) onPlay?.(prompt)
  }
  const handleGenerateCode = (e) => {
    e?.preventDefault()
    if (!gamePrompt.trim()) return
    const idea = GAME_IDEAS.find(g => g.value === gamePrompt)
    const presetKey = idea?.presetKey
    onGenerateGame?.(gamePrompt, presetKey)
  }

  return (
    <div className="space-y-6">
      {/* Beta disclaimer */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 backdrop-blur-sm px-4 py-3 shadow-lg">
        <p className="text-sm text-amber-800 font-medium">⚠️ Under Beta Testing</p>
        <p className="text-xs text-slate-600 mt-1">
          The Play tab may not produce the best game every time. It could give simple games — to improve results, <strong>be specific</strong>. For reference, see the ideas in the dropdown box above.
        </p>
      </div>

      {/* Game idea — dropdown + custom input */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-xl">
        <p className="text-sm text-slate-600 mb-2">Be specific about the game. Pick an idea or type your own</p>
        <div className="flex flex-col gap-3">
          <select
            value={GAME_IDEAS.find(g => g.value === gamePrompt) ? gamePrompt : ''}
            onChange={(e) => setGamePrompt(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/80 border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-slate-800"
            disabled={isLoading}
          >
            {GAME_IDEAS.map((g) => (
              <option key={g.value || 'empty'} value={g.value}>{g.label}</option>
            ))}
          </select>
          <form onSubmit={handleGenerateCode} className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={gamePrompt}
              onChange={(e) => setGamePrompt(e.target.value)}
              placeholder="Or type your own (e.g. Dragon flying through clouds, collect stars)"
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg bg-white/80 border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-slate-800 placeholder-slate-400"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleImprove}
              disabled={isLoading || improving || !gamePrompt.trim()}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm disabled:opacity-50 border border-slate-300"
            >
              {improving ? 'Improving...' : '✨ Improve'}
            </button>
            <button
              type="submit"
              disabled={isLoading || !gamePrompt.trim()}
              className="px-6 py-2.5 rounded-xl disabled:opacity-50 font-medium text-white shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
            >
              {isLoading ? 'Generating...' : 'Generate Code'}
            </button>
          </form>
        </div>
        <p className="text-xs text-slate-500 mt-2">Tip: Pick from the dropdown or type custom. Click Improve first to expand your idea.</p>
      </div>

      {/* Section 2: After generation — Code first, then Run */}
      {gameHtml && (
        <div className="space-y-3 p-4 rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm shadow-lg">
          <h3 className="text-sm font-medium text-amber-800">Section 2 — Code generated ✓</h3>
          {gameDescription && (
            <p className="text-xs text-slate-600">From: &quot;{gameDescription}&quot;</p>
          )}
          <p className="text-xs text-slate-600">Review the code below. Edit if needed, then click Run Game.</p>
        </div>
      )}

      {/* Text games */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-xl">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Text games (run in output)</h3>
        <p className="text-xs text-slate-500 mb-3">Describe or pick — code loads in editor, run and put input below.</p>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. number guessing, rock paper scissors"
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/80 border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-slate-800 placeholder-slate-400"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !prompt.trim()} className="px-6 py-2.5 rounded-lg bg-white/80 hover:bg-slate-100 border border-slate-300 text-slate-800 disabled:opacity-50 font-medium">
            Play
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => handlePreset(p.prompt)} disabled={isLoading} className="px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 border border-slate-200/80 text-slate-700 text-sm disabled:opacity-50 backdrop-blur-sm">
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
