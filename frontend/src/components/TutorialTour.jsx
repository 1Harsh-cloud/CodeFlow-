import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import wizardImg from '../../Wizard.png'
import {
  Sparkles,
  LayoutDashboard,
  Package,
  Zap,
  FileCode,
  Play,
  FolderUp,
  BookOpen,
  Gamepad2,
  PartyPopper,
} from 'lucide-react'

const STORAGE_KEY = 'codeflow_tour_done'

function getFirstStepTitle() {
  return `<div class="tour-first-box">
    <div class="tour-wizard-mascot"><img src="${wizardImg}" alt="Wizard" class="tour-wizard-img"/></div>
    <h2 class="tour-first-title">Welcome to CodeFlow!</h2>
  </div>`
}

const TOUR_ICONS = [
  Sparkles,      // 0 Welcome
  LayoutDashboard, // 1 Tabs
  Package,       // 2 Map
  Zap,           // 3 Generate
  FileCode,      // 4 Editor & Run
  FolderUp,      // 5 Explain
  BookOpen,      // 6 Line-by-line
  Gamepad2,      // 7 Play
  Play,          // 8 Run
  PartyPopper,   // 9 Done
]

let cachedIconHtml = []
function getTourIconHtml(index) {
  if (cachedIconHtml[index]) return cachedIconHtml[index]
  const Icon = TOUR_ICONS[Math.min(index, TOUR_ICONS.length - 1)]
  if (!Icon) return ''
  const div = document.createElement('div')
  const root = createRoot(div)
  flushSync(() =>
    root.render(
      <div
        className="tour-step-icon-wrap"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #A669FF 0%, #6D31FF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(166, 105, 255, 0.45), 0 0 0 1px rgba(255,255,255,0.1) inset',
          flexShrink: 0,
        }}
      >
        <Icon size={24} strokeWidth={2.2} color="white" strokeLinecap="round" strokeLinejoin="round" />
      </div>
    )
  )
  cachedIconHtml[index] = div.innerHTML
  return cachedIconHtml[index]
}

export function shouldShowTour() {
  try {
    return !localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
}

export function markTourDone() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {}
}

function buildSteps(setActiveTab, TABS) {
  const switchAndNext = (tab, driverObj) => {
    setActiveTab(tab)
    setTimeout(() => driverObj.moveNext(), 150)
  }
  const destroyTour = (driverObj) => {
    markTourDone()
    driverObj.destroy()
  }

  return [
    // 1. Welcome (wizard shown here)
    {
      popover: {
        title: getFirstStepTitle(),
        description: 'Your AI-powered code assistant. This tour covers the key features in 10 quick steps.',
        side: 'bottom',
      },
    },
    // 2. Tabs
    {
      element: '#tour-tabs',
      popover: {
        title: 'Main Navigation Tabs',
        description: 'Codebase Map, Generate Code, Explain Code, and Play. Click any tab to switch sections.',
        side: 'bottom',
        onNextClick: (el, step, opts) => switchAndNext(TABS.MAP, opts.driver),
      },
    },
    // 3. Codebase Map
    {
      element: '#tour-map-repo',
      popover: {
        title: 'Codebase Map',
        description: 'Connect GitHub, paste a repo URL (owner/repo) and Fetch, or upload a .zip. Build maps, reports, and flashcards from your codebase.',
        side: 'bottom',
        onNextClick: (el, step, opts) => switchAndNext(TABS.GENERATE, opts.driver),
      },
    },
    // 4. Generate – describe & create
    {
      element: '#tour-gen-prompt',
      popover: {
        title: 'Generate Code',
        description: 'Describe what you want (e.g. "Binary search in Python"), pick a language, and click Generate. Use the examples for quick starts.',
        side: 'bottom',
      },
    },
    // 5. Generate – editor & run
    {
      element: '#tour-gen-editor',
      popover: {
        title: 'Editor & Run',
        description: 'Code appears here. Edit it, add input values if needed (one per line), then Run. Output shows below.',
        side: 'bottom',
        onNextClick: (el, step, opts) => switchAndNext(TABS.EXPLAIN, opts.driver),
      },
    },
    // 6. Explain – upload & explain
    {
      element: '#tour-exp-upload',
      popover: {
        title: 'Explain Code',
        description: 'Upload a file or paste code in the editor, then click Explain. AI gives a line-by-line breakdown.',
        side: 'bottom',
      },
    },
    // 7. Explain – line by line
    {
      element: '#tour-exp-linebyline',
      popover: {
        title: 'Line-by-Line View',
        description: 'Each line appears here with an AI explanation. Same Run / Input / Output flow as Generate.',
        side: 'bottom',
        onNextClick: (el, step, opts) => switchAndNext(TABS.PLAY, opts.driver),
      },
    },
    // 8. Play – ideas & generate
    {
      element: '#tour-play-dropdown',
      popover: {
        title: 'Play – Build Games',
        description: 'Pick a preset (Snake, Mario, Flappy) or type your own idea. Click Improve then Generate Code.',
        side: 'bottom',
      },
    },
    // 9. Play – run
    {
      element: '#tour-play',
      popover: {
        title: 'Run & Play',
        description: 'Code loads in the editor. Click Run Game to play. Text games run in output; visual games open in a new preview.',
        side: 'bottom',
      },
    },
    // 10. Done
    {
      popover: {
        title: "You're all set!",
        description: 'You now know every feature. Click Done to start exploring, or use the Tutorial button anytime to replay.',
        side: 'bottom',
        showButtons: ['previous', 'next'],
        nextBtnText: 'Done',
        onNextClick: (el, step, opts) => destroyTour(opts.driver),
      },
    },
  ]
}

function runTour(setActiveTab, TABS, markDone = true) {
  const steps = buildSteps(setActiveTab, TABS)
  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    popoverClass: 'codeflow-tour',
    steps,
    onPopoverRender: (popover, opts) => {
      const w = popover?.wrapper
      if (!w) return
      const idx = opts?.state?.activeIndex ?? 0
      const titleEl = popover?.title
      if (!titleEl) return
      if (idx !== 0) {
        let iconWrap = w.querySelector('.tour-step-icon-wrap')
        const iconHtml = getTourIconHtml(idx)
        if (!iconWrap) {
          const next = titleEl.nextSibling
          const wrap = document.createElement('div')
          wrap.className = 'tour-title-with-icon'
          wrap.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:8px;'
          iconWrap = document.createElement('div')
          iconWrap.className = 'tour-step-icon-wrap'
          wrap.appendChild(iconWrap)
          wrap.appendChild(titleEl)
          w.insertBefore(wrap, next)
        }
        iconWrap.innerHTML = iconHtml
      }
      const roundPos = () => {
        ;['left', 'top', 'right', 'bottom'].forEach((prop) => {
          const val = parseFloat(w.style[prop])
          if (!isNaN(val)) w.style[prop] = Math.round(val) + 'px'
        })
        const tx = w.style.transform
        if (tx && tx.includes('translateY')) {
          const m = tx.match(/translateY\((-?[\d.]+)px\)/)
          if (m) w.style.transform = `translateY(${Math.round(parseFloat(m[1]))}px)`
        }
      }
      requestAnimationFrame(() => {
        roundPos()
        requestAnimationFrame(roundPos)
        setTimeout(roundPos, 50)
      })
    },
    onCloseClick: (el, step, opts) => {
      markTourDone()
      opts.driver.destroy()
    },
    onDestroyStarted: () => {
      if (markDone) markTourDone()
    },
  })
  driverObj.drive()
  return driverObj
}

const TutorialTour = forwardRef(function TutorialTour({ onStart, setActiveTab, TABS }, ref) {
  useImperativeHandle(ref, () => ({
    startTour: () => runTour(setActiveTab, TABS, false),
  }))

  useEffect(() => {
    if (!shouldShowTour() || !setActiveTab || !TABS) return

    const timer = setTimeout(() => {
      onStart?.()
      runTour(setActiveTab, TABS, true)
    }, 500)

    return () => clearTimeout(timer)
  }, [onStart, setActiveTab, TABS])

  return null
})

export default TutorialTour
