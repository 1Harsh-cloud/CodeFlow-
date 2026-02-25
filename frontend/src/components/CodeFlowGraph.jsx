import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { FileCode, Folder, Zap } from 'lucide-react'
import dagre from 'dagre'

const Graph3D = lazy(() => import('./Graph3D'))

class Graph3DErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', flexDirection: 'column', gap: 8 }}>
          <span>3D view unavailable</span>
          <button onClick={() => this.setState({ hasError: false })} style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', borderRadius: 6, color: '#3b82f6', cursor: 'pointer' }}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}

const NODE_WIDTH = 120
const NODE_HEIGHT = 120

function getLayoutedNodes(nodes, edges) {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 120 })
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map((n) => {
    const pos = g.node(n.id)
    return {
      ...n,
      x: pos?.x != null ? pos.x - NODE_WIDTH / 2 : 0,
      y: pos?.y != null ? pos.y - NODE_HEIGHT / 2 : 0,
    }
  })
}

function getNodeColor(type, fileType) {
  if (fileType === 'test') return '#ef4444'
  if (fileType === 'css') return '#8b5cf6'
  switch (type) {
    case 'folder': return '#f59e0b'
    case 'function': return '#10b981'
    case 'route': return '#ef4444'
    case 'class': return '#8b5cf6'
    case 'component': return '#3b82f6'
    case 'file':
    default:
      return '#3b82f6'
  }
}

function getFileType(node) {
  const type = node?.type
  const label = (node?.label || '').toLowerCase()
  if (['folder', 'function', 'route', 'class', 'component'].includes(type)) return type
  if (/\.(test|spec)\.(js|jsx|ts|tsx)$/.test(label)) return 'test'
  if (/\.(css|scss|sass)$/.test(label)) return 'css'
  if (/\.(jsx|tsx)$/.test(label)) return 'react'
  if (/\.(js|ts)$/.test(label)) return 'javascript'
  return 'file'
}

function getNodeIcon(fileType) {
  switch (fileType) {
    case 'folder':
      return (
        <>
          <rect x="8" y="16" width="48" height="40" rx="4" fill="rgba(0,0,0,0.3)" />
          <path d="M8 16 L28 16 L32 8 L56 8 L56 56 L8 56 Z" fill="rgba(255,255,255,0.9)" />
        </>
      )
    case 'test':
      return (
        <>
          <rect x="8" y="8" width="48" height="48" rx="6" fill="#ef4444" />
          <circle cx="32" cy="32" r="16" fill="none" stroke="#fff" strokeWidth="4" />
          <path d="M24 32 L30 38 L40 26" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
    case 'javascript':
      return (
        <>
          <rect x="8" y="8" width="48" height="48" rx="6" fill="#f7df1e" />
          <text x="32" y="40" fontSize="32" fontWeight="900" textAnchor="middle" fill="#000">JS</text>
        </>
      )
    case 'react':
      return (
        <>
          <circle cx="32" cy="32" r="6" fill="#61dafb" />
          <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="#61dafb" strokeWidth="3" />
          <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="#61dafb" strokeWidth="3" transform="rotate(60 32 32)" />
          <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="#61dafb" strokeWidth="3" transform="rotate(120 32 32)" />
        </>
      )
    case 'css':
      return (
        <>
          <rect x="12" y="8" width="40" height="48" rx="4" fill="#2965f1" />
          <path d="M22 24 L32 28 L42 24 M22 32 L32 36 L42 32 M22 40 L32 44 L42 40" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )
    case 'file':
      return (
        <>
          <rect x="12" y="8" width="40" height="48" rx="4" fill="rgba(255,255,255,0.9)" />
          <line x1="20" y1="20" x2="44" y2="20" stroke="rgba(0,0,0,0.3)" strokeWidth="2.4" />
          <line x1="20" y1="28" x2="44" y2="28" stroke="rgba(0,0,0,0.3)" strokeWidth="2.4" />
          <line x1="20" y1="36" x2="36" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="2.4" />
        </>
      )
    case 'function':
      return (
        <>
          <rect x="8" y="8" width="48" height="48" rx="6" fill="#10b981" />
          <text x="32" y="22" fontSize="20" fontWeight="800" textAnchor="middle" fill="#fff">fn</text>
          <path d="M16 32 L24 40 L32 32 M24 40 L24 28" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
    case 'route':
      return (
        <>
          <rect x="8" y="8" width="48" height="48" rx="6" fill="#ef4444" />
          <path d="M18 24 L32 32 L46 24 M18 40 L32 48 L46 40" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
    case 'class':
      return (
        <>
          <rect x="12" y="12" width="40" height="40" rx="4" fill="none" stroke="#a78bfa" strokeWidth="4" />
          <rect x="20" y="20" width="10" height="10" fill="#a78bfa" />
          <rect x="34" y="20" width="10" height="10" fill="#a78bfa" />
          <rect x="20" y="34" width="10" height="10" fill="#a78bfa" />
          <rect x="34" y="34" width="10" height="10" fill="#a78bfa" />
        </>
      )
    case 'component':
      return (
        <>
          <circle cx="32" cy="32" r="6" fill="#61dafb" />
          <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="#61dafb" strokeWidth="3" />
          <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="#61dafb" strokeWidth="3" transform="rotate(60 32 32)" />
          <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="#61dafb" strokeWidth="3" transform="rotate(120 32 32)" />
        </>
      )
    default:
      return (
        <>
          <rect x="12" y="8" width="40" height="48" rx="4" fill="rgba(255,255,255,0.9)" />
          <line x1="20" y1="20" x2="44" y2="20" stroke="rgba(0,0,0,0.3)" strokeWidth="2.4" />
          <line x1="20" y1="28" x2="44" y2="28" stroke="rgba(0,0,0,0.3)" strokeWidth="2.4" />
          <line x1="20" y1="36" x2="36" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="2.4" />
        </>
      )
  }
}

export default function CodeFlowGraph({ nodes: rawNodes, edges: rawEdges, isConnected = true }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [view3D, setView3D] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)

  const nodes = useMemo(() => {
    try {
      return getLayoutedNodes(rawNodes || [], rawEdges || [])
    } catch (_) {
      return (rawNodes || []).map((n, i) => ({
        ...n,
        x: (i % 4) * 180,
        y: Math.floor(i / 4) * 140,
      }))
    }
  }, [rawNodes, rawEdges])

  const getNodePosition = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT / 2 }
  }

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.classList.contains('connection-line')) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setIsDragging(false)

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const viewBoxW = nodes.length ? Math.max(800, ...nodes.map(n => n.x + NODE_WIDTH + 50)) : 800
  const viewBoxH = nodes.length ? Math.max(600, ...nodes.map(n => n.y + NODE_HEIGHT + 50)) : 600

  return (
    <div className="codeflow-graph-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;600;800&display=swap');
        .codeflow-graph-wrapper { height: 100%; min-height: 400px; background: #0a0e1a; color: #fff; font-family: 'JetBrains Mono', monospace; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .codeflow-graph-wrapper::before {
          content: '';
          position: absolute;
          width: 100%; height: 100%;
          background-image:
            radial-gradient(circle at 10% 20%, rgba(59,130,246,0.08) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(139,92,246,0.08) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(16,185,129,0.05) 0%, transparent 50%);
          pointer-events: none;
        }
        .graph-area { flex: 1; min-height: 0; position: relative; }
        .graph-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; }
        .graph-canvas { position: absolute; inset: 0; overflow: hidden; cursor: ${isDragging ? 'grabbing' : 'grab'}; }
        .connection-line { stroke-width: 4; fill: none; transition: all 0.3s ease; cursor: pointer; }
        .connection-line:hover { stroke-width: 6; filter: drop-shadow(0 0 10px currentColor); }
        .node-group { cursor: pointer; transition: filter 0.2s ease; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4)); }
        .node-group:hover .node-circle { filter: url(#glow) drop-shadow(0 0 16px currentColor); }
        .node-border { fill: none; stroke-width: 2; opacity: 0.3; }
        .node-label { font-size: 20px; font-weight: 700; text-anchor: middle; pointer-events: none; fill: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.9); }
        .node-sublabel { font-size: 17px; font-weight: 600; text-anchor: middle; pointer-events: none; fill: #94a3b8; }
        .info-panel { position: absolute; bottom: 1rem; right: 1rem; background: rgba(15,23,42,0.9); backdrop-filter: blur(20px); border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; padding: 1rem; min-width: 240px; z-index: 10; font-size: 0.875rem; }
        .info-panel h3 { font-family: 'Outfit', sans-serif; font-weight: 700; margin-bottom: 0.75rem; color: #3b82f6; display: flex; align-items: center; gap: 0.5rem; }
        .info-item { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .info-label { color: #64748b; }
        .info-value { color: #fff; font-weight: 600; }
        .legend { position: absolute; bottom: 1rem; left: 1rem; background: rgba(15,23,42,0.9); backdrop-filter: blur(20px); border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; padding: 1rem; z-index: 10; font-size: 0.75rem; }
        .legend-title { font-weight: 700; margin-bottom: 0.5rem; }
        .legend-item { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
        .legend-color { width: 14px; height: 14px; border-radius: 4px; }
        .zoom-bar { position: absolute; top: 0.75rem; right: 0.75rem; display: flex; align-items: center; gap: 0.35rem; z-index: 20; }
        .view-mode-btn { padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid rgba(59,130,246,0.3); background: rgba(15,23,42,0.9); color: #64748b; }
        .view-mode-btn.active { background: rgba(59,130,246,0.2); color: #3b82f6; border-color: #3b82f6; }
        .view-mode-btn:hover:not(.active) { color: #94a3b8; }
        .zoom-btn { width: 32px; height: 32px; background: rgba(15,23,42,0.9); border: 1px solid rgba(59,130,246,0.2); border-radius: 8px; color: #3b82f6; cursor: pointer; font-weight: 700; }
        .cf-top-bar { padding: 0.75rem 1rem; background: rgba(15,23,42,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(59,130,246,0.2); display: flex; justify-content: space-between; align-items: center; z-index: 15; }
        .cf-logo { display: flex; align-items: center; gap: 0.5rem; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; }
        .cf-logo-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .cf-status { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem; background: ${isConnected ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)'}; border: 1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }
        .cf-status-dot { width: 6px; height: 6px; background: ${isConnected ? '#10b981' : '#3b82f6'}; border-radius: 50%; ${isConnected ? 'animation: cf-blink 2s ease-in-out infinite;' : ''} }
        @keyframes cf-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <div className="cf-top-bar">
        <div className="cf-logo" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="cf-logo-icon"><Zap size={14} /></div>
          <span>CodeFlow Graph</span>
          <div className="cf-status" style={{ marginLeft: '0.5rem' }}>
            <div className="cf-status-dot" />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>
      <div className="graph-area">
        <div className="zoom-bar">
          <button className={`view-mode-btn ${!view3D ? 'active' : ''}`} onClick={() => setView3D(false)}>2D</button>
          <button className={`view-mode-btn ${view3D ? 'active' : ''}`} onClick={() => setView3D(true)} title="Drag to orbit • Scroll to zoom">3D</button>
          {!view3D && <><button className="zoom-btn" onClick={() => setZoom(z => Math.min(z + 0.15, 2))}>+</button><button className="zoom-btn" onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}>−</button></>}
        </div>
        <div className="graph-grid" />
        <div className="graph-canvas" onMouseDown={!view3D ? handleMouseDown : undefined}>
        {view3D ? (
          <Graph3DErrorBoundary>
            <Suspense fallback={<div style={{ color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>Loading 3D…</div>}>
              <Graph3D nodes={rawNodes} edges={rawEdges} />
            </Suspense>
          </Graph3DErrorBoundary>
        ) : (
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <defs>
            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <radialGradient id="sphereHighlight" cx="35%" cy="35%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" opacity="0.6" />
            </marker>
          </defs>

          <g className="connections">
            {(rawEdges || []).map((conn, i) => {
              const from = getNodePosition(conn.source)
              const to = getNodePosition(conn.target)
              const isDep = conn.type === 'dependency'
              return (
                <path
                  key={i}
                  className="connection-line"
                  d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 40} ${to.x} ${to.y}`}
                  stroke={isDep ? 'url(#greenGrad)' : 'url(#blueGrad)'}
                  strokeOpacity="0.7"
                  markerEnd="url(#arrowhead)"
                />
              )
            })}
          </g>

          <g className="nodes">
            {nodes.map((node) => {
              const cx = node.x + NODE_WIDTH / 2
              const cy = node.y + NODE_HEIGHT / 2
              const fileType = getFileType(node)
              const color = getNodeColor(node.type, fileType)
              return (
                <g
                  key={node.id}
                  className="node-group"
                  transform={`translate(${cx}, ${cy})`}
                  onClick={() => setSelectedNode(node)}
                >
                  <circle className="node-glow" r="55" fill={color} filter="url(#glow)" opacity="0.5" />
                  <circle className="node-border" r="48" stroke={color} />
                  <circle
                    className="node-circle"
                    r="44"
                    fill={
                      node.type === 'folder' || fileType === 'test' || fileType === 'route' || fileType === 'class' || fileType === 'css'
                        ? color
                        : fileType === 'function'
                        ? 'url(#greenGrad)'
                        : 'url(#blueGrad)'
                    }
                    opacity="0.9"
                    filter="url(#glow)"
                  />
                  <g transform="translate(-32, -32)">{getNodeIcon(fileType)}</g>
                  <text className="node-label" y="75">{String(node.label).slice(0, 14)}{String(node.label).length > 14 ? '…' : ''}</text>
                  <text className="node-sublabel" y="98">{node.type}</text>
                </g>
              )
            })}
          </g>
        </svg>
        )}

        {selectedNode && (
          <div className="info-panel">
            <h3>
              {selectedNode.type === 'folder' ? <Folder size={16} /> : <FileCode size={16} />}
              {selectedNode.label}
            </h3>
            <div className="info-item"><span className="info-label">Type</span><span className="info-value">{selectedNode.type}</span></div>
            <div className="info-item">
              <span className="info-label">Outgoing</span>
              <span className="info-value">{(rawEdges || []).filter(c => c.source === selectedNode.id).length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Incoming</span>
              <span className="info-value">{(rawEdges || []).filter(c => c.target === selectedNode.id).length}</span>
            </div>
          </div>
        )}

        <div className="legend">
          <div className="legend-title">Legend</div>
          <div className="legend-item"><div className="legend-color" style={{ background: '#f59e0b' }} /><span>Folder</span></div>
          <div className="legend-item"><div className="legend-color" style={{ background: '#3b82f6' }} /><span>JavaScript</span></div>
          <div className="legend-item"><div className="legend-color" style={{ background: '#10b981' }} /><span>Utilities</span></div>
          <div className="legend-item"><div className="legend-color" style={{ background: '#8b5cf6' }} /><span>Styles</span></div>
          <div className="legend-item"><div className="legend-color" style={{ background: '#ef4444' }} /><span>Test</span></div>
        </div>
      </div>
      </div>
    </div>
  )
}
