export default function TabNav({ activeTab, setActiveTab, tabs }) {
  return (
    <div id="tour-tabs" className="flex flex-wrap gap-2 p-1 rounded-xl bg-white/90 border border-slate-200 shadow-sm w-fit">
      <button
        onClick={() => setActiveTab(tabs.MAP)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === tabs.MAP
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        Codebase Map
      </button>
      <button
        onClick={() => setActiveTab(tabs.GENERATE)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === tabs.GENERATE
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        Generate Code
      </button>
      <button
        onClick={() => setActiveTab(tabs.EXPLAIN)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === tabs.EXPLAIN
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        Explain Code
      </button>
      <button
        onClick={() => setActiveTab(tabs.PLAY)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === tabs.PLAY
            ? 'bg-amber-500 text-slate-900 shadow-md'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        🎮 Play
      </button>
    </div>
  )
}
