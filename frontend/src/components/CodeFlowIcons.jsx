/**
 * Eye-catching icons for CodeFlow Map - shared between 2D and 3D views.
 * All icons use viewBox 0 0 64 64 for consistency.
 */

export function getIconSvgString(fileType) {
  const icons = {
    folder: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-folder-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient>
        <filter id="cf-folder-shadow"><feDropShadow dx="0" dy="2" stdDeviation="1" flood-opacity="0.3"/></filter>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-folder-grad)" filter="url(#cf-folder-shadow)"/>
      <path d="M14 22h20l6 6v22H14V22z" fill="rgba(255,255,255,0.4)"/>
      <path d="M14 22l6-6h14l4 6H14z" fill="rgba(255,255,255,0.5)"/>
      <rect x="20" y="36" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="20" y="42" width="20" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
    </svg>`,

    test: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-test-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f87171"/><stop offset="100%" stop-color="#dc2626"/></linearGradient>
        <filter id="cf-test-glow"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#ef4444" flood-opacity="0.5"/></filter>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-test-grad)" filter="url(#cf-test-glow)"/>
      <circle cx="32" cy="32" r="18" fill="none" stroke="#fff" stroke-width="4" opacity="0.95"/>
      <path d="M22 32 L28 38 L42 24" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    javascript: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-js-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#facc15"/></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-js-grad)"/>
      <text x="32" y="40" font-size="24" font-weight="900" text-anchor="middle" fill="#000" font-family="monospace">JS</text>
    </svg>`,

    react: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-react-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-react-grad)"/>
      <circle cx="32" cy="32" r="8" fill="rgba(255,255,255,0.9)"/>
      <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="3"/>
      <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="3" transform="rotate(60 32 32)"/>
      <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="3" transform="rotate(120 32 32)"/>
    </svg>`,

    component: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-comp-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-comp-grad)"/>
      <rect x="14" y="14" width="36" height="36" rx="6" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
      <circle cx="24" cy="24" r="4" fill="#fff"/>
      <circle cx="40" cy="24" r="4" fill="#fff"/>
      <circle cx="24" cy="40" r="4" fill="#fff"/>
      <circle cx="40" cy="40" r="4" fill="#fff"/>
      <path d="M28 24 L36 24 M28 40 L36 40 M24 28 L24 36 M40 28 L40 36" stroke="rgba(255,255,255,0.6)" stroke-width="2" fill="none"/>
    </svg>`,

    css: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-css-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-css-grad)"/>
      <path d="M18 24 L32 30 L46 24 M18 34 L32 40 L46 34 M18 44 L32 50 L46 44" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`,

    file: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-file-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-file-grad)"/>
      <rect x="14" y="14" width="36" height="4" rx="1" fill="#94a3b8"/>
      <rect x="14" y="24" width="36" height="4" rx="1" fill="#94a3b8"/>
      <rect x="14" y="34" width="24" height="4" rx="1" fill="#94a3b8"/>
    </svg>`,

    function: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-fn-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#10b981"/></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-fn-grad)"/>
      <text x="32" y="26" font-size="20" font-weight="800" text-anchor="middle" fill="#fff" font-family="monospace">fn</text>
      <path d="M20 36 L28 44 L36 36 M28 44 L28 30" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    route: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-route-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f87171"/><stop offset="100%" stop-color="#ef4444"/></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-route-grad)"/>
      <path d="M18 26 L32 34 L46 26 M18 42 L32 50 L46 42" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`,

    class: `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cf-class-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#cf-class-grad)"/>
      <rect x="18" y="18" width="28" height="28" rx="4" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
      <rect x="24" y="24" width="8" height="8" rx="2" fill="#fff"/>
      <rect x="32" y="24" width="8" height="8" rx="2" fill="#fff"/>
      <rect x="24" y="32" width="8" height="8" rx="2" fill="#fff"/>
      <rect x="32" y="32" width="8" height="8" rx="2" fill="#fff"/>
    </svg>`
  }
  return icons[fileType] || icons.file
}
