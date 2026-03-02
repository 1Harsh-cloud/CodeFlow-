import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  useEffect(() => {
    const cursor = document.getElementById('landing-cursor')
    const ring = document.getElementById('landing-cursor-ring')
    if (!cursor || !ring) return
    let mx = 0, my = 0, rx = 0, ry = 0
    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      cursor.style.transform = `translate(${mx - 6}px,${my - 6}px)`
    }
    const animate = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      ring.style.transform = `translate(${rx - 18}px,${ry - 18}px)`
      requestAnimationFrame(animate)
    }
    document.addEventListener('mousemove', onMove)
    animate()
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const reveals = document.querySelectorAll('.landing-reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 80)
        })
      },
      { threshold: 0.1 }
    )
    reveals.forEach((r) => observer.observe(r))
    return () => reveals.forEach((r) => observer.unobserve(r))
  }, [])

  useEffect(() => {
    const cards = document.querySelectorAll('.landing-feature-card, .landing-price-card')
    const cleanups = []
    cards.forEach((card) => {
      const handler = (e) => {
        const rect = card.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        const centerX = 0.5
        const centerY = 0.5
        const rotateY = (x - centerX) * 12
        const rotateX = (centerY - y) * 12
        card.style.setProperty('--mx', x * 100 + '%')
        card.style.setProperty('--my', y * 100 + '%')
        card.style.setProperty('--rx', rotateX + 'deg')
        card.style.setProperty('--ry', rotateY + 'deg')
      }
      const reset = () => {
        card.style.setProperty('--rx', '0deg')
        card.style.setProperty('--ry', '0deg')
      }
      card.addEventListener('mousemove', handler)
      card.addEventListener('mouseleave', reset)
      cleanups.push(() => {
        card.removeEventListener('mousemove', handler)
        card.removeEventListener('mouseleave', reset)
      })
    })
    return () => cleanups.forEach((fn) => fn())
  }, [])

  const appUrl = '/app'

  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          --landing-bg: #faf8ff;
          --landing-surface: #ffffff;
          --landing-accent: #6366f1;
          --landing-accent2: #ec4899;
          --landing-accent3: #a855f7;
          --landing-text: #1e293b;
          --landing-muted: #64748b;
          --landing-border: rgba(99,102,241,0.2);
        }
        .landing-page, .landing-page * { box-sizing: border-box; }
        .landing-page {
          background: linear-gradient(180deg, #faf5ff 0%, #f3e8ff 25%, #ede9fe 50%, #e0e7ff 75%, #faf8ff 100%);
          color: var(--landing-text);
          font-family: 'Space Grotesk', system-ui, sans-serif;
          overflow-x: hidden;
          cursor: default;
          min-height: 100vh;
        }
        .landing-page .landing-cursor,
        .landing-page .landing-cursor-ring { display: none; }
        .landing-page::before { display: none; }
        .landing-page::after { display: none; }
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.2rem 4rem;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          z-index: 100;
          animation: landingFadeDown 0.8s ease forwards;
        }
        @keyframes landingFadeDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        .landing-logo {
          font-size: 1.4rem; font-weight: 800;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }
        .landing-nav ul { list-style: none; display: flex; gap: 2.5rem; }
        .landing-nav a { color: var(--landing-muted); text-decoration: none; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.05em; transition: color 0.2s; }
        .landing-nav a:hover { color: var(--landing-text); }
        .landing-nav-cta {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          color: #ffffff !important; -webkit-text-fill-color: #ffffff;
          border: none; padding: 0.6rem 1.5rem;
          border-radius: 100px; font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 800; font-size: 0.9rem; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          letter-spacing: 0.03em; text-decoration: none; display: inline-block;
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
          -webkit-font-smoothing: antialiased;
        }
        .landing-nav-cta:hover { transform: scale(1.05); box-shadow: 0 8px 25px rgba(99,102,241,0.35), 0 4px 15px rgba(236,72,153,0.25); }
        .landing-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          padding: 8rem 2rem 4rem; position: relative; z-index: 1;
        }
        .landing-hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
          border-radius: 100px; padding: 0.4rem 1rem;
          font-size: 0.78rem; font-weight: 600; color: var(--landing-accent);
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 2rem;
          animation: landingFadeUp 0.8s 0.2s ease both;
        }
        .landing-hero-badge .dot { width: 6px; height: 6px; background: #ec4899; border-radius: 50%; animation: landingPulse 2s infinite; }
        @keyframes landingPulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        .landing-hero h1 {
          font-size: clamp(2.75rem, 7vw, 5.5rem); font-weight: 700; line-height: 1.1;
          letter-spacing: -0.025em; max-width: 900px;
          animation: landingFadeUp 0.8s 0.35s ease both;
        }
        .landing-hero h1 .line1 { display: block; color: var(--landing-text); }
        .landing-hero h1 .line2 {
          display: block;
          background: linear-gradient(135deg, var(--landing-accent) 0%, var(--landing-accent2) 50%, var(--landing-accent3) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .landing-hero p {
          font-size: 1.15rem; color: var(--landing-muted); font-weight: 400;
          max-width: 560px; line-height: 1.7; margin: 1.8rem auto 0;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          animation: landingFadeUp 0.8s 0.5s ease both;
        }
        .landing-hero-actions {
          display: flex; gap: 1rem; align-items: center; justify-content: center;
          margin-top: 2.5rem;
          animation: landingFadeUp 0.8s 0.65s ease both;
        }
        .landing-btn-primary {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          color: #ffffff !important; -webkit-text-fill-color: #ffffff;
          border: none; padding: 0.9rem 2.2rem;
          border-radius: 100px; font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 800; font-size: 1rem; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          text-decoration: none; display: inline-block;
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
          -webkit-font-smoothing: antialiased;
        }
        .landing-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(99,102,241,0.35), 0 6px 20px rgba(236,72,153,0.25); }
        .landing-btn-ghost {
          background: transparent; color: var(--landing-text); border: 1px solid rgba(99,102,241,0.3);
          padding: 0.9rem 2.2rem; border-radius: 100px;
          font-family: 'Space Grotesk', system-ui, sans-serif; font-weight: 600;
          font-size: 1rem; cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .landing-btn-ghost:hover { border-color: var(--landing-accent); background: rgba(99,102,241,0.06); }
        @keyframes landingFadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .landing-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
        }
        .landing-orb1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%); top: -100px; left: -100px; animation: landingFloat1 8s ease-in-out infinite; }
        .landing-orb2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%); bottom: -100px; right: -100px; animation: landingFloat2 10s ease-in-out infinite; }
        .landing-orb3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(168,85,247,0.1), transparent 70%); top: 50%; left: 50%; transform: translate(-50%,-50%); animation: landingFloat1 6s ease-in-out infinite reverse; }
        @keyframes landingFloat1 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(30px,20px);} }
        @keyframes landingFloat2 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-20px,30px);} }
        .landing-hero-visual {
          margin-top: 4rem; width: 100%; max-width: 800px;
          animation: landingFadeUp 0.8s 0.8s ease both; position: relative;
          perspective: 1200px;
        }
        .landing-terminal {
          background: white; border: 1px solid rgba(226,232,240,0.9);
          border-radius: 16px; overflow: hidden;
          transform: perspective(1200px) rotateX(4deg);
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.08),
            0 20px 40px rgba(99,102,241,0.12),
            0 40px 80px rgba(0,0,0,0.08);
        }
        .landing-terminal-header {
          background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--landing-border);
          padding: 0.8rem 1.2rem; display: flex; align-items: center; gap: 0.5rem;
        }
        .landing-dot-r { width:10px;height:10px;border-radius:50%;background:#ff5f57; }
        .landing-dot-y { width:10px;height:10px;border-radius:50%;background:#febc2e; }
        .landing-dot-g { width:10px;height:10px;border-radius:50%;background:#28c840; }
        .landing-terminal-title { font-family: 'JetBrains Mono', monospace; font-size:0.78rem; color:var(--landing-muted); margin-left:0.5rem; }
        .landing-terminal-body { padding: 1.5rem 2rem; text-align: left; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 2; background: #fafbff; }
        .landing-t-comment { color: #94a3b8; }
        .landing-t-keyword { color: #a855f7; }
        .landing-t-fn { color: #6366f1; }
        .landing-t-str { color: #ec4899; }
        .landing-t-num { color: #f59e0b; }
        .landing-t-cursor { display:inline-block; width:8px; height:1em; background:#6366f1; animation:landingBlink 1s step-end infinite; vertical-align:text-bottom; }
        @keyframes landingBlink { 0%,100%{opacity:1;} 50%{opacity:0;} }
        .landing-section { position: relative; z-index: 1; }
        .landing-features { padding: 8rem 4rem; max-width: 1200px; margin: 0 auto; }
        .landing-section-label {
          font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 0.75rem;
          color: var(--landing-accent); letter-spacing: 0.2em; text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .landing-section-title {
          font-size: clamp(1.9rem, 4.5vw, 3.2rem); font-weight: 700; line-height: 1.2;
          letter-spacing: -0.025em; max-width: 600px; margin-bottom: 1rem;
        }
        .landing-section-title span {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .landing-features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem; margin-top: 4rem;
        }
        .landing-features-grid { perspective: 1000px; }
        .landing-feature-card {
          background: white; border: 1px solid rgba(226,232,240,0.9);
          border-radius: 20px; padding: 2rem;
          transition: transform 0.25s ease-out, border-color 0.3s, box-shadow 0.3s;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          transform-style: preserve-3d;
          transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(0);
        }
        .landing-feature-card::before {
          content: ''; position: absolute; inset: 0; opacity: 0;
          transition: opacity 0.3s;
          background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(99,102,241,0.06), transparent 60%);
        }
        .landing-feature-card:hover {
          transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(-6px);
          border-color: rgba(99,102,241,0.3); box-shadow: 0 20px 50px rgba(99,102,241,0.12), 0 8px 25px rgba(0,0,0,0.06);
        }
        .landing-feature-card:hover::before { opacity: 1; }
        .landing-feature-card.wide { grid-column: span 2; }
        .landing-feature-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; margin-bottom: 1.2rem;
        }
        .landing-icon-blue { background: rgba(99,102,241,0.12); }
        .landing-icon-purple { background: rgba(168,85,247,0.12); }
        .landing-icon-green { background: rgba(236,72,153,0.1); }
        .landing-icon-orange { background: rgba(249,115,22,0.12); }
        .landing-feature-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.6rem; }
        .landing-feature-card p { color: var(--landing-muted); font-size: 0.9rem; line-height: 1.6; font-family: 'Space Grotesk', system-ui, sans-serif; font-weight: 300; }
        .landing-feature-tag {
          display: inline-block; margin-top: 1rem;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
          color: var(--landing-accent); font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0.25rem 0.7rem; border-radius: 100px;
        }
        .landing-feature-tag.purple { background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.2); color: #7c3aed; }
        .landing-feature-tag.green { background: rgba(236,72,153,0.1); border-color: rgba(236,72,153,0.2); color: #db2777; }
        .landing-stats-bar {
          border-top: 1px solid rgba(226,232,240,0.8); border-bottom: 1px solid rgba(226,232,240,0.8);
          padding: 3rem 4rem; display: flex; justify-content: center; gap: 6rem;
          max-width: 1200px; margin: 0 auto; background: rgba(255,255,255,0.5);
        }
        .landing-stat { text-align: center; }
        .landing-stat-num {
          font-size: 3rem; font-weight: 800; line-height: 1;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .landing-stat-label { color: var(--landing-muted); font-size: 0.85rem; margin-top: 0.4rem; font-family: 'Space Grotesk', system-ui, sans-serif; }
        .landing-how { padding: 8rem 4rem; max-width: 1200px; margin: 0 auto; }
        .landing-steps {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 2rem; margin-top: 4rem; position: relative;
        }
        .landing-steps::before {
          content: ''; position: absolute; top: 32px; left: calc(16.66% + 1rem); right: calc(16.66% + 1rem);
          height: 1px;
          background: linear-gradient(90deg, var(--landing-accent), var(--landing-accent2), var(--landing-accent3));
          opacity: 0.3;
        }
        .landing-step { text-align: center; padding: 0 1rem; }
        .landing-step-num {
          width: 64px; height: 64px; border-radius: 50%;
          background: white; border: 2px solid rgba(99,102,241,0.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem; font-size: 1.2rem; font-weight: 800;
          color: var(--landing-accent); font-family: 'Space Grotesk', system-ui, sans-serif;
          position: relative; z-index: 1; box-shadow: 0 4px 15px rgba(99,102,241,0.1);
        }
        .landing-step h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.6rem; }
        .landing-step p { color: var(--landing-muted); font-size: 0.88rem; line-height: 1.6; font-family: 'Space Grotesk', system-ui, sans-serif; }
        .landing-pricing { padding: 8rem 4rem; max-width: 1200px; margin: 0 auto; text-align: center; }
        .landing-pricing .landing-section-title { margin: 0 auto 1rem; }
        .landing-pricing-desc { color: var(--landing-muted); font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 0.9rem; margin-bottom: 1rem; }
        .landing-pricing-free-notice {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.1));
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 100px; padding: 0.6rem 1.5rem;
          font-size: 0.95rem; font-weight: 600; color: var(--landing-accent);
          margin-bottom: 4rem;
        }
        .landing-pricing-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1.5rem; text-align: left;
          perspective: 1000px;
        }
        .landing-price-card {
          background: white; border: 1px solid rgba(226,232,240,0.9);
          border-radius: 24px; padding: 2.5rem;
          transition: transform 0.25s ease-out, box-shadow 0.3s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          transform-style: preserve-3d;
          transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(0);
        }
        .landing-price-card:hover {
          transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(-6px);
          box-shadow: 0 20px 50px rgba(99,102,241,0.12), 0 8px 25px rgba(0,0,0,0.06);
        }
        .landing-price-card.featured {
          background: linear-gradient(145deg, rgba(99,102,241,0.06), rgba(236,72,153,0.06));
          border-color: rgba(99,102,241,0.4);
          box-shadow: 0 0 0 1px rgba(99,102,241,0.2), 0 20px 50px rgba(99,102,241,0.1);
        }
        .landing-price-badge {
          display: inline-block; background: linear-gradient(135deg, #6366f1, #ec4899);
          color: white; font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0.3rem 0.8rem; border-radius: 100px; margin-bottom: 1.5rem;
        }
        .landing-price-name { font-size: 1rem; font-weight: 700; color: var(--landing-muted); margin-bottom: 0.5rem; }
        .landing-price-amount { font-size: 3rem; font-weight: 800; line-height: 1; margin-bottom: 0.3rem; }
        .landing-price-desc { font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 0.8rem; color: var(--landing-muted); margin-bottom: 2rem; }
        .landing-price-divider { height: 1px; background: rgba(226,232,240,0.9); margin-bottom: 1.5rem; }
        .landing-price-features { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
        .landing-price-features li { display: flex; align-items: center; gap: 0.6rem; font-size: 0.88rem; color: var(--landing-text); }
        .landing-price-features li.off { color: var(--landing-muted); }
        .landing-check { color: #10b981; font-size: 1rem; }
        .landing-cross { color: #4a5568; }
        .landing-btn-price {
          width: 100%; padding: 0.85rem; border-radius: 100px;
          font-family: 'Space Grotesk', system-ui, sans-serif; font-weight: 700; font-size: 0.95rem;
          cursor: pointer; transition: all 0.2s; border: none;
          text-decoration: none; display: block; text-align: center; color: inherit;
        }
        .landing-btn-price-outline { background: transparent; border: 1px solid rgba(99,102,241,0.3); color: var(--landing-text); }
        .landing-btn-price-outline:hover { border-color: var(--landing-accent); background: rgba(99,102,241,0.04); }
        .landing-btn-price-fill {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          color: #ffffff !important; -webkit-text-fill-color: #ffffff;
          font-weight: 800; text-shadow: 0 1px 2px rgba(0,0,0,0.15);
          -webkit-font-smoothing: antialiased;
        }
        .landing-btn-price-fill:hover { box-shadow: 0 8px 30px rgba(99,102,241,0.35); transform: translateY(-1px); }
        .landing-cta-section {
          padding: 8rem 4rem; text-align: center;
          max-width: 800px; margin: 0 auto;
        }
        .landing-cta-section h2 {
          font-size: clamp(2.25rem, 5vw, 4rem);
          font-weight: 700; line-height: 1.15; letter-spacing: -0.025em;
          margin-bottom: 1.5rem;
        }
        .landing-cta-section h2 span {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .landing-cta-section p { color: var(--landing-muted); font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 0.95rem; margin-bottom: 2.5rem; line-height: 1.7; }
        .landing-footer {
          border-top: 1px solid rgba(226,232,240,0.8);
          padding: 3rem 4rem;
          display: flex; align-items: center; justify-content: space-between;
          position: relative; z-index: 1;
          background: rgba(255,255,255,0.6);
        }
        .landing-footer p { color: var(--landing-muted); font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 0.8rem; }
        .landing-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .landing-reveal.visible { opacity: 1; transform: translateY(0); }
        @media (max-width: 768px) {
          .landing-nav { padding: 1rem 1.5rem; }
          .landing-nav ul { display: none; }
          .landing-features, .landing-how, .landing-pricing, .landing-cta-section { padding: 4rem 1.5rem; }
          .landing-features-grid, .landing-steps, .landing-pricing-grid { grid-template-columns: 1fr; }
          .landing-feature-card.wide { grid-column: span 1; }
          .landing-steps::before { display: none; }
          .landing-stats-bar { padding: 2rem 1.5rem; gap: 2rem; flex-wrap: wrap; }
          .landing-footer { flex-direction: column; gap: 1rem; text-align: center; }
        }
      `}</style>

      <div className="landing-cursor" id="landing-cursor" />
      <div className="landing-cursor-ring" id="landing-cursor-ring" />

      <nav className="landing-nav">
        <div className="landing-logo">Code<span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 300 }}>Flow</span></div>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <Link to={appUrl} className="landing-nav-cta">Get Started Free</Link>
      </nav>

      <section className="landing-hero">
        <div className="landing-orb landing-orb1" />
        <div className="landing-orb landing-orb2" />
        <div className="landing-orb landing-orb3" />

        <div className="landing-hero-badge">
          <span className="dot" />
          AI-Powered · Now Live
        </div>

        <h1>
          <span className="line1">Understand Code.</span>
          <span className="line2">Master It Faster.</span>
        </h1>

        <p>Import any GitHub repo and watch it transform into interactive visualizations, AI explanations, flashcards, and games, all in one platform.</p>

        <div className="landing-hero-actions">
          <Link to={appUrl} className="landing-btn-primary">Launch CodeFlow →</Link>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-terminal">
            <div className="landing-terminal-header">
              <div className="landing-dot-r" />
              <div className="landing-dot-y" />
              <div className="landing-dot-g" />
              <span className="landing-terminal-title">codeflow ~ analyzing repo</span>
            </div>
            <div className="landing-terminal-body">
              <div><span className="landing-t-comment">// Importing your codebase...</span></div>
              <div><span className="landing-t-keyword">const</span> <span className="landing-t-fn">repo</span> = <span className="landing-t-keyword">await</span> <span className="landing-t-fn">CodeFlow</span>.<span className="landing-t-fn">import</span>(<span className="landing-t-str">"github.com/you/project"</span>)</div>
              <div><span className="landing-t-comment">// Generating visual mindmap...</span></div>
              <div><span className="landing-t-keyword">const</span> map = <span className="landing-t-keyword">await</span> repo.<span className="landing-t-fn">visualize</span>(&#123; mode: <span className="landing-t-str">"3D"</span>, depth: <span className="landing-t-num">∞</span> &#125;)</div>
              <div><span className="landing-t-comment">// AI is ready to explain anything</span></div>
              <div>map.<span className="landing-t-fn">chat</span>(<span className="landing-t-str">"How does authentication work?"</span>) <span className="landing-t-comment">// ✨</span></div>
              <div>&gt; <span className="landing-t-str">Generating flashcards + games...</span> <span className="landing-t-cursor" /></div>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-stats-bar landing-reveal">
        <div className="landing-stat">
          <div className="landing-stat-num">5</div>
          <div className="landing-stat-label">Languages for Code Run</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-num">3D</div>
          <div className="landing-stat-label">Visual Mindmaps</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-num">∞</div>
          <div className="landing-stat-label">AI Explanations</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-num">5x</div>
          <div className="landing-stat-label">Faster Onboarding</div>
        </div>
      </div>

      <section id="features" className="landing-features landing-section">
        <div className="landing-section-label landing-reveal">Features</div>
        <div className="landing-section-title landing-reveal">Everything you need to <span>master any codebase</span></div>

        <div className="landing-features-grid">
          <div className="landing-feature-card wide landing-reveal">
            <div className="landing-feature-icon landing-icon-blue">🗺️</div>
            <h3>Codebase Visualization</h3>
            <p>Import any GitHub repo and explore it as a beautiful 2D or 3D interactive mindmap. Understand architecture instantly and share with your team via a public link.</p>
            <span className="landing-feature-tag">2D + 3D</span>
          </div>

          <div className="landing-feature-card landing-reveal">
            <div className="landing-feature-icon landing-icon-purple">🤖</div>
            <h3>AI Chat Q&A</h3>
            <p>Ask anything about the codebase. Context-aware Claude AI answers in real time, like having a senior dev on call 24/7.</p>
            <span className="landing-feature-tag purple">Claude Powered</span>
          </div>

          <div className="landing-feature-card landing-reveal">
            <div className="landing-feature-icon landing-icon-green">🃏</div>
            <h3>Auto Flashcards</h3>
            <p>Auto-generated flashcards from your repo content. Study functions, patterns, and architecture on the go.</p>
            <span className="landing-feature-tag green">Gamified</span>
          </div>

          <div className="landing-feature-card landing-reveal">
            <div className="landing-feature-icon landing-icon-orange">🎮</div>
            <h3>Code Games</h3>
            <p>Learn through play. Interactive coding games built from your repo make learning addictive. Instant games, no wait.</p>
            <span className="landing-feature-tag" style={{ background: 'rgba(246,153,63,0.1)', borderColor: 'rgba(246,153,63,0.25)', color: '#f6993f' }}>WOW Feature</span>
          </div>

          <div className="landing-feature-card landing-reveal">
            <div className="landing-feature-icon landing-icon-blue">📄</div>
            <h3>Summary Reports</h3>
            <p>Export polished summary reports in PDF, Markdown, or Docs format. Perfect for onboarding, code reviews, or documentation.</p>
            <span className="landing-feature-tag">Export Ready</span>
          </div>

          <div className="landing-feature-card landing-reveal">
            <div className="landing-feature-icon landing-icon-purple">🎓</div>
            <h3>Interactive Tutorial</h3>
            <p>Step-by-step guided tutorials generated from your codebase. Walk through the code like a course with gamified learning and max engagement.</p>
            <span className="landing-feature-tag purple">Live Now</span>
          </div>

          <div className="landing-feature-card landing-reveal">
            <div className="landing-feature-icon landing-icon-blue">⚡</div>
            <h3>Run Code in Multiple Languages</h3>
            <p>Execute code right in the browser. Supports Python, JavaScript, C, C++, and Java. No setup required.</p>
            <span className="landing-feature-tag">C, C++, Java, JS</span>
          </div>

          <div className="landing-feature-card landing-reveal">
            <div className="landing-feature-icon landing-icon-green">📖</div>
            <h3>Line-by-Line Explanation</h3>
            <p>AI breaks down every line of your code with clear, concise explanations. Understand complex logic in seconds.</p>
            <span className="landing-feature-tag green">AI Powered</span>
          </div>
        </div>
      </section>

      <section id="how" className="landing-how landing-section">
        <div className="landing-section-label landing-reveal">How It Works</div>
        <div className="landing-section-title landing-reveal">From repo to <span>mastery</span> in minutes</div>

        <div className="landing-steps">
          <div className="landing-step landing-reveal">
            <div className="landing-step-num">01</div>
            <h3>Import Your Repo</h3>
            <p>Connect via GitHub auth or paste any public URL. CodeFlow ingests your entire codebase in seconds.</p>
          </div>
          <div className="landing-step landing-reveal">
            <div className="landing-step-num">02</div>
            <h3>Explore & Learn</h3>
            <p>Navigate the visual mindmap, chat with AI, flip flashcards, or jump into a game. Your choice.</p>
          </div>
          <div className="landing-step landing-reveal">
            <div className="landing-step-num">03</div>
            <h3>Share & Export</h3>
            <p>Share your mindmap with a link or export a full summary report. Onboard teammates in minutes.</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-pricing landing-section">
        <div className="landing-section-label landing-reveal" style={{ textAlign: 'center' }}>Pricing</div>
        <div className="landing-section-title landing-reveal">Invest in Your Code, <span>Not Guesswork</span></div>
        <div className="landing-pricing-desc landing-reveal">One-time payment. No subscriptions. No surprises.</div>
        <div className="landing-pricing-free-notice landing-reveal">🎉 For now, it's free to use everything. Don't worry! Just jump in and explore.</div>

        <div className="landing-pricing-grid">
          <div className="landing-price-card landing-reveal">
            <div className="landing-price-name">Free</div>
            <div className="landing-price-amount">$0</div>
            <div className="landing-price-desc">No payment required</div>
            <div className="landing-price-divider" />
            <ul className="landing-price-features">
              <li><span className="landing-check">✓</span> AI Code Explanation</li>
              <li><span className="landing-check">✓</span> Run Code (Python, JS)</li>
              <li><span className="landing-check">✓</span> File Upload</li>
              <li className="off"><span className="landing-cross">✗</span> Code Generation</li>
              <li className="off"><span className="landing-cross">✗</span> Codebase Map</li>
              <li className="off"><span className="landing-cross">✗</span> Game Generation</li>
            </ul>
            <Link to={appUrl} className="landing-btn-price landing-btn-price-outline">Get Started Free</Link>
          </div>

          <div className="landing-price-card featured landing-reveal">
            <div className="landing-price-badge">Most Popular</div>
            <div className="landing-price-name">Best Value</div>
            <div className="landing-price-amount">$9.99</div>
            <div className="landing-price-desc">One time payment</div>
            <div className="landing-price-divider" />
            <ul className="landing-price-features">
              <li><span className="landing-check">✓</span> AI Code Explanation</li>
              <li><span className="landing-check">✓</span> Run Code (Python, JS)</li>
              <li><span className="landing-check">✓</span> File Upload</li>
              <li><span className="landing-check">✓</span> Code Generation</li>
              <li><span className="landing-check">✓</span> Codebase Map</li>
              <li className="off"><span className="landing-cross">✗</span> Game Generation</li>
            </ul>
            <Link to={appUrl} className="landing-btn-price landing-btn-price-fill">Get Started</Link>
          </div>

          <div className="landing-price-card landing-reveal">
            <div className="landing-price-name">Ultimate</div>
            <div className="landing-price-amount">$12.99</div>
            <div className="landing-price-desc">One time payment</div>
            <div className="landing-price-divider" />
            <ul className="landing-price-features">
              <li><span className="landing-check">✓</span> AI Code Explanation</li>
              <li><span className="landing-check">✓</span> Run Code (Python, JS)</li>
              <li><span className="landing-check">✓</span> File Upload</li>
              <li><span className="landing-check">✓</span> Code Generation</li>
              <li><span className="landing-check">✓</span> Codebase Map</li>
              <li><span className="landing-check">✓</span> Game Generation</li>
              <li><span className="landing-check">✓</span> Priority Support</li>
            </ul>
            <Link to={appUrl} className="landing-btn-price landing-btn-price-outline">Get Started</Link>
          </div>
        </div>
      </section>

      <section className="landing-cta-section">
        <h2 className="landing-reveal">Ready to <span>flow</span> through any codebase?</h2>
        <p className="landing-reveal">Join developers who learn smarter with CodeFlow. Import your first repo for free, no credit card needed.</p>
        <Link to={appUrl} className="landing-btn-primary landing-reveal">Start for Free →</Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-logo">Code<span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 300 }}>Flow</span></div>
        <p>© 2026 CodeFlow. Built with ❤️ at Columbia University.</p>
        <p style={{ color: 'var(--landing-muted)', fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: '0.78rem' }}>code-flow-liart.vercel.app</p>
      </footer>
    </div>
  )
}
