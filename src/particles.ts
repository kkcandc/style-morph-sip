import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  NormalBlending,
  Points,
  PointsMaterial,
  type Blending,
} from 'three'
import type { ParticleMode } from './worlds'

const COUNT = 520

function texture(kind: 'soft' | 'streak'): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return new CanvasTexture(canvas)
  if (kind === 'soft') {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.55)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, 64)
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.85)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(28, 0, 8, 64)
  }
  const map = new CanvasTexture(canvas)
  map.needsUpdate = true
  return map
}

export class ParticleField {
  readonly points: Points
  private readonly positions: Float32Array
  private readonly seeds: Float32Array
  private mode: ParticleMode = 'none'
  private readonly soft: CanvasTexture
  private readonly streak: CanvasTexture

  constructor() {
    this.positions = new Float32Array(COUNT * 3)
    this.seeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i += 1) {
      this.seeds[i] = Math.random()
      this.reset(i, true)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(this.positions, 3))
    this.soft = texture('soft')
    this.streak = texture('streak')
    const material = new PointsMaterial({
      color: '#ffffff',
      map: this.soft,
      transparent: true,
      depthWrite: false,
      size: 0.08,
      sizeAttenuation: true,
      opacity: 0.85,
    })
    this.points = new Points(geometry, material)
    this.points.frustumCulled = false
    this.points.visible = false
  }

  setMode(mode: ParticleMode, color: string) {
    if (this.mode !== mode) {
      this.mode = mode
      for (let i = 0; i < COUNT; i += 1) this.reset(i, true)
    }
    const material = this.points.material as PointsMaterial
    material.color.set(color)
    const rain = mode === 'rain'
    material.map = rain ? this.streak : this.soft
    material.size = rain ? 0.22 : mode === 'snow' ? 0.07 : mode === 'embers' ? 0.11 : 0.09
    material.opacity = mode === 'dust' || mode === 'motes' ? 0.55 : 0.8
    const blending: Blending = mode === 'embers' || mode === 'spores' || mode === 'motes' ? AdditiveBlending : NormalBlending
    if (material.blending !== blending) {
      material.blending = blending
      material.needsUpdate = true
    }
    this.points.visible = mode !== 'none'
  }

  update(dt: number) {
    if (this.mode === 'none') return
    const time = performance.now() * 0.001
    for (let i = 0; i < COUNT; i += 1) {
      const i3 = i * 3
      const seed = this.seeds[i]
      let x = this.positions[i3]
      let y = this.positions[i3 + 1]
      let z = this.positions[i3 + 2]
      if (this.mode === 'rain') {
        y -= dt * (2.4 + seed * 1.6)
        x += Math.sin(time + seed * 8) * dt * 0.05
      } else if (this.mode === 'snow') {
        y -= dt * (0.28 + seed * 0.35)
        x += Math.sin(time * 0.6 + seed * 12) * dt * 0.15
      } else if (this.mode === 'embers') {
        y += dt * (0.45 + seed * 0.9)
        x += Math.sin(time * 2 + seed * 10) * dt * 0.2
        z += Math.cos(time * 1.6 + seed * 9) * dt * 0.12
      } else if (this.mode === 'spores') {
        y += dt * (0.12 + seed * 0.28)
        x += Math.sin(time * 0.7 + seed * 14) * dt * 0.18
        z += Math.cos(time * 0.5 + seed * 6) * dt * 0.12
      } else {
        y += dt * (0.04 + seed * 0.08)
        x += Math.sin(time * 0.4 + seed * 20) * dt * 0.08
        z += Math.cos(time * 0.35 + seed * 11) * dt * 0.06
      }
      this.positions[i3] = x
      this.positions[i3 + 1] = y
      this.positions[i3 + 2] = z
      if (y < -0.1 || y > 3.6 || Math.abs(x) > 4.2 || z < -4.2 || z > 2.2) this.reset(i, false)
    }
    const attribute = this.points.geometry.getAttribute('position') as BufferAttribute
    attribute.needsUpdate = true
  }

  private reset(index: number, anywhere: boolean) {
    const i3 = index * 3
    const seed = this.seeds[index] || Math.random()
    this.positions[i3] = (Math.random() - 0.5) * 6.2
    this.positions[i3 + 2] = -3.6 + Math.random() * 5.2
    if (anywhere) {
      this.positions[i3 + 1] = Math.random() * 3.2
      return
    }
    if (this.mode === 'embers' || this.mode === 'spores' || this.mode === 'motes' || this.mode === 'dust') {
      this.positions[i3 + 1] = seed * 0.2
    } else {
      this.positions[i3 + 1] = 2.8 + Math.random() * 0.6
    }
  }
}

export function steamPoints(): Points {
  const count = 22
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 0.05
    positions[i * 3 + 1] = Math.random() * 0.18
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  const material = new PointsMaterial({
    color: new Color('#f4efe8'),
    size: 0.045,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const points = new Points(geometry, material)
  points.visible = false
  points.frustumCulled = false
  points.userData.positions = positions
  return points
}
