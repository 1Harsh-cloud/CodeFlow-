import { useState } from 'react'

export default function TextInput({ mode, onSubmit, isLoading }) {
  const [prompt, setPrompt] = useState('')

  const isExplain = mode === 'explain'
  const handleSubmit = (e) => {
    e?.preventDefault()
    if (isExplain) {
      onSubmit?.()
    } else {
      if (prompt.trim()) onSubmit?.(prompt)
      // Keep prompt visible so user can see what they asked for
    }
  }

  if (isExplain) {
    return (
      <div>
        <h3 className="text-sm font-medium text-slate-600 mb-2">Explain Current Code</h3>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Explaining...' : 'Explain Code in Editor'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-600 mb-2">Generate Code from Description</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A Python function to calculate factorial"
          className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isLoading ? '...' : 'Generate'}
        </button>
      </form>
    </div>
  )
}
