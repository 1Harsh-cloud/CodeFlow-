import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import dagre from 'dagre'
import { getIconSvgString } from './CodeFlowIcons'

const NODE_WIDTH = 120
const SCALE = 0.012

function getLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 120 })
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_WIDTH }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  const positions = nodes.map((n) => {
    const pos = g.node(n.id)
    const x = pos?.x ?? 0
    const y = pos?.y ?? 0
    return { ...n, x, y }
  })
  if (positions.length === 0) return []
  const minX = Math.min(...positions.map((p) => p.x))
  const maxX = Math.max(...positions.map((p) => p.x))
  const minY = Math.min(...positions.map((p) => p.y))
  const maxY = Math.max(...positions.map((p) => p.y))
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  return positions.map((n) => ({
    ...n,
    x3d: (n.x - midX) * SCALE,
    y3d: -(n.y - midY) * SCALE,
    z3d: 0
  }))
}

function getColor(type, label) {
  const l = (label || '').toLowerCase()
  if (/\.(test|spec)\./.test(l)) return 0xef4444
  if (/\.(css|scss)/.test(l)) return 0x8b5cf6
  if (type === 'folder') return 0xf59e0b
  if (type === 'function') return 0x10b981
  if (type === 'route') return 0xef4444
  if (type === 'class') return 0x8b5cf6
  return 0x3b82f6
}

function getFileType(type, label) {
  const l = (label || '').toLowerCase()
  if (['folder', 'function', 'route', 'class', 'component'].includes(type)) return type
  if (/\.(test|spec)\.(js|jsx|ts|tsx)$/.test(l)) return 'test'
  if (/\.(css|scss|sass)$/.test(l)) return 'css'
  if (/\.(jsx|tsx)$/.test(l)) return 'react'
  if (/\.(js|ts)$/.test(l)) return 'javascript'
  return 'file'
}

function createIconCSS2D(fileType) {
  const div = document.createElement('div')
  div.style.cssText = `
    width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
    pointer-events: none; user-select: none; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
  `
  div.innerHTML = getIconSvgString(fileType)
  const svg = div.querySelector('svg')
  if (svg) {
    svg.style.width = '100%'
    svg.style.height = '100%'
  }
  const obj = new CSS2DObject(div)
  return obj
}

const ZOOM_STEP = 1.2
const MIN_DIST = 4
const MAX_DIST = 25

export default function Graph3D({ nodes = [], edges = [], style }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)

  const layout = useMemo(() => {
    try {
      return getLayout(nodes, edges)
    } catch {
      return nodes.map((n, i) => ({
        ...n,
        x3d: (i % 4 - 2) * 1.2,
        y3d: Math.floor(i / 4) * 1.2,
        z3d: 0
      }))
    }
  }, [nodes, edges])

  const nodeMap = useMemo(() => {
    const m = {}
    layout.forEach((n) => { m[n.id] = n })
    return m
  }, [layout])

  useEffect(() => {
    const container = containerRef.current
    if (!container || layout.length === 0) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0e1a)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x0a0e1a, 1)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = MIN_DIST
    controls.maxDistance = MAX_DIST
    controlsRef.current = controls

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    scene.add(new THREE.DirectionalLight(0xffffff, 0.8).position.set(10, 10, 10))

    const toDispose = []
    layout.forEach((node) => {
      const fileType = getFileType(node.type, node.label)
      const geom = new THREE.SphereGeometry(0.32, 24, 24)
      const mat = new THREE.MeshStandardMaterial({
        color: getColor(node.type, node.label),
        emissive: getColor(node.type, node.label),
        emissiveIntensity: 0.25
      })
      const mesh = new THREE.Mesh(geom, mat)
      mesh.position.set(node.x3d, node.y3d, node.z3d)
      mesh.userData = { node }
      scene.add(mesh)
      toDispose.push(geom, mat)

      const iconObj = createIconCSS2D(fileType)
      iconObj.position.set(node.x3d, node.y3d, node.z3d + 0.38)
      scene.add(iconObj)

      const labelEl = document.createElement('div')
      labelEl.className = 'graph3d-label'
      labelEl.style.cssText = `
        color: #fff; font-weight: 700; font-size: 14px; text-align: center; white-space: nowrap;
        text-shadow: 0 2px 6px rgba(0,0,0,0.9); font-family: 'JetBrains Mono', monospace;
        pointer-events: none; user-select: none; margin-top: 6px;
      `
      labelEl.innerHTML = `<div>${String(node.label).slice(0, 14)}${node.label.length > 14 ? '…' : ''}</div><div style="color:#94a3b8;font-size:11px;font-weight:600;margin-top:2px">${node.type}</div>`
      const labelObj = new CSS2DObject(labelEl)
      labelObj.position.set(node.x3d, node.y3d - 0.62, node.z3d)
      scene.add(labelObj)
    })

    const css2DRenderer = new CSS2DRenderer()
    css2DRenderer.setSize(container.clientWidth, container.clientHeight)
    css2DRenderer.domElement.style.position = 'absolute'
    css2DRenderer.domElement.style.top = '0'
    css2DRenderer.domElement.style.left = '0'
    css2DRenderer.domElement.style.pointerEvents = 'none'
    container.appendChild(css2DRenderer.domElement)

    const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, opacity: 0.8, transparent: true })
    edges.forEach((conn) => {
      const from = nodeMap[conn.source]
      const to = nodeMap[conn.target]
      if (!from || !to) return
      const pts = [
        new THREE.Vector3(from.x3d, from.y3d, from.z3d),
        new THREE.Vector3(
          (from.x3d + to.x3d) / 2,
          (from.y3d + to.y3d) / 2,
          (from.z3d + to.z3d) / 2 - 0.1
        ),
        new THREE.Vector3(to.x3d, to.y3d, to.z3d)
      ]
      const curve = new THREE.QuadraticBezierCurve3(pts[0], pts[1], pts[2])
      const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(10))
      const line = new THREE.Line(geom, conn.type === 'dependency' ? new THREE.LineBasicMaterial({ color: 0x10b981 }) : lineMat)
      scene.add(line)
    })

    let frame
    function animate() {
      frame = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
      css2DRenderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
      css2DRenderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      cameraRef.current = null
      controlsRef.current = null
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      if (container.contains(css2DRenderer.domElement)) container.removeChild(css2DRenderer.domElement)
      toDispose.forEach((obj) => { if (obj?.dispose) obj.dispose() })
    }
  }, [layout, edges, nodeMap])

  const handleZoomIn = useCallback(() => {
    const cam = cameraRef.current
    const ctrl = controlsRef.current
    if (!cam || !ctrl) return
    const dir = new THREE.Vector3()
    dir.subVectors(cam.position, ctrl.target).normalize()
    const dist = cam.position.distanceTo(ctrl.target)
    const move = Math.min(dist - MIN_DIST, dist * (1 - 1 / ZOOM_STEP))
    if (move > 0) cam.position.addScaledVector(dir, -move)
  }, [])

  const handleZoomOut = useCallback(() => {
    const cam = cameraRef.current
    const ctrl = controlsRef.current
    if (!cam || !ctrl) return
    const dir = new THREE.Vector3()
    dir.subVectors(cam.position, ctrl.target).normalize()
    const dist = cam.position.distanceTo(ctrl.target)
    const move = Math.min(MAX_DIST - dist, dist * (ZOOM_STEP - 1))
    if (move > 0) cam.position.addScaledVector(dir, move)
  }, [])

  if (layout.length === 0) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        No nodes to display
      </div>
    )
  }

  return (
    <div style={{ ...style, width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 20,
          pointerEvents: 'auto'
        }}
      >
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom out"
          style={{
            width: 32,
            height: 32,
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8,
            color: '#3b82f6',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 18,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          −
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom in"
          style={{
            width: 32,
            height: 32,
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8,
            color: '#3b82f6',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 18,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
