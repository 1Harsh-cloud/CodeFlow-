export default function ExecutionPanel({ output, stdin, onStdinChange, showGameInput }) {
  return (
    <div className="space-y-4">
      {showGameInput && (
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Input (for input() prompts)</h3>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange?.(e.target.value)}
            placeholder="Code uses input()? Put each value on a new line. E.g.: 1,3,5,7,9  then 5"
            className="w-full min-h-[60px] p-3 rounded-lg bg-white border border-slate-300 font-mono text-sm text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none resize-y"
            rows={3}
          />
        </div>
      )}
      <div>
        <h3 className="text-sm font-medium text-slate-600 mb-2">Output</h3>
        <div className="min-h-[200px] p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-sm overflow-auto">
          <pre className="whitespace-pre-wrap text-slate-700">
            {output || 'Run code to see output here.'}
          </pre>
        </div>
      </div>
    </div>
  )
}
