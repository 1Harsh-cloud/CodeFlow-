export default function ReadyToPlay() {
  return (
    <div className="flex-1 flex items-center justify-center text-center py-16 px-16">
      <div>
        <div className="animate-float mb-8 flex justify-center">
          <svg
            viewBox="0 0 200 120"
            className="w-40 h-24"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(99, 102, 241, 0.4)) drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }}
          >
            <defs>
              <linearGradient id="controller-body" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#4338ca" />
              </linearGradient>
              <linearGradient id="controller-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
              </linearGradient>
              <linearGradient id="btn-green" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="btn-red" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="btn-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="btn-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            {/* Main body - rounded controller shape */}
            <ellipse cx="100" cy="60" rx="95" ry="45" fill="url(#controller-body)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <ellipse cx="100" cy="58" rx="90" ry="40" fill="url(#controller-shine)" opacity="0.9" />
            {/* Handles */}
            <ellipse cx="30" cy="75" rx="28" ry="38" fill="url(#controller-body)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <ellipse cx="170" cy="75" rx="28" ry="38" fill="url(#controller-body)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* D-pad */}
            <rect x="42" y="42" width="18" height="18" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <rect x="46" y="34" width="10" height="12" rx="2" fill="#334155" />
            <rect x="46" y="54" width="10" height="12" rx="2" fill="#334155" />
            <rect x="34" y="46" width="12" height="10" rx="2" fill="#334155" />
            <rect x="58" y="46" width="12" height="10" rx="2" fill="#334155" />
            {/* Left stick */}
            <circle cx="75" cy="35" r="12" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="75" cy="35" r="6" fill="#64748b" />
            {/* Face buttons */}
            <circle cx="135" cy="38" r="8" fill="url(#btn-green)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <circle cx="152" cy="48" r="8" fill="url(#btn-red)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <circle cx="135" cy="58" r="8" fill="url(#btn-yellow)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <circle cx="118" cy="48" r="8" fill="url(#btn-blue)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            {/* Right stick */}
            <circle cx="160" cy="72" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="160" cy="72" r="5" fill="#64748b" />
            {/* Center button */}
            <circle cx="100" cy="60" r="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <circle cx="100" cy="60" r="4" fill="#6366f1" opacity="0.8" />
          </svg>
        </div>
        <div className="text-[2rem] font-bold mb-4 text-slate-600">Ready to Play?</div>
        <div className="text-[1.1rem] text-slate-500">👈 Select a game from the sidebar to get started</div>
      </div>
    </div>
  )
}
