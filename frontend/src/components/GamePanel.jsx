export default function GamePanel({ html, onClose }) {
  if (!html) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[85vh] m-4 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-slate-100/95 border-b border-slate-200">
          <span className="text-sm font-medium text-zinc-300">Game — Play inside!</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm transition-colors"
          >
            ✕ Close
          </button>
        </div>
        <iframe
          title="Generated Game"
          srcDoc={html}
          className="w-full h-full border-0 mt-12"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}
