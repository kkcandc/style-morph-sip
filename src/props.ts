import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

function shade(mesh: Mesh): Mesh {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function labelTexture(text: string, fg: string, bg: string, size = 120): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return new CanvasTexture(canvas)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 512, 256)
  ctx.fillStyle = fg
  ctx.font = `600 ${size}px Outfit, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 136)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function sign(text: string, fg: string, bg: string, w: number, h: number): Mesh {
  const mesh = new Mesh(
    new PlaneGeometry(w, h),
    new MeshBasicMaterial({ map: labelTexture(text, fg, bg), toneMapped: false }),
  )
  return mesh
}

export function createPropKits(): { root: Group; kits: Record<string, Group> } {
  const root = new Group()
  root.name = 'worlds'
  const kits: Record<string, Group> = {}

  const add = (id: string, build: (group: Group) => void) => {
    const group = new Group()
    group.name = id
    group.visible = false
    build(group)
    root.add(group)
    kits[id] = group
  }

  add('plaster', (group) => {
    const flag = new Mesh(
      new PlaneGeometry(1.4, 2.1),
      new MeshBasicMaterial({ color: '#fffaf4' }),
    )
    flag.position.set(-2.3, 1.7, 0.4)
    flag.rotation.y = 0.6
    group.add(flag)
    const flag2 = new Mesh(
      new PlaneGeometry(1.1, 1.6),
      new MeshBasicMaterial({ color: '#f0e6da' }),
    )
    flag2.position.set(2.15, 1.15, 0.2)
    flag2.rotation.y = -0.7
    group.add(flag2)
  })

  add('relay', (group) => {
    const boards: Array<[string, string, string, number, number, number, number]> = [
      ['LATE', '#ff4ad4', '#140010', -2.15, 1.85, -2.6, 1.5],
      ['NORTH', '#14181c', '#39f6ff', 2.05, 1.55, -2.8, 1.7],
      ['15', '#1a1204', '#ffe14a', 0.15, 2.35, -3.4, 0.9],
    ]
    for (const [text, fg, bg, x, y, z, w] of boards) {
      const board = sign(text, fg, bg, w, w * 0.48)
      board.position.set(x, y, z)
      group.add(board)
      const glow = new Mesh(
        new PlaneGeometry(w * 1.25, w * 0.7),
        new MeshBasicMaterial({ color: bg, transparent: true, opacity: 0.35, toneMapped: false }),
      )
      glow.position.set(x, y, z - 0.05)
      group.add(glow)
    }
  })

  add('paper', (group) => {
    const cards: Array<[string, number, number, number, number, number]> = [
      ['#f25c3a', -2.4, 1.1, -2.2, 1.6, 2.4],
      ['#f2c14e', -1.1, 0.7, -3.1, 2.2, 1.5],
      ['#2f6fed', 1.3, 0.95, -2.6, 1.3, 2.6],
      ['#1d8a62', 2.3, 1.3, -1.8, 0.9, 2.1],
      ['#f7efe4', 0.2, 1.6, -3.6, 2.8, 1.2],
    ]
    for (const [color, x, y, z, w, h] of cards) {
      const card = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color }))
      card.position.set(x, y, z)
      card.rotation.y = x * 0.05
      group.add(card)
    }
  })

  add('kiln', (group) => {
    const shell = shade(new Mesh(new BoxGeometry(2.4, 1.5, 0.8), new MeshStandardMaterial({ color: '#2a1814', roughness: 0.9 })))
    shell.position.set(0.1, 0.85, -2.5)
    group.add(shell)
    const mouth = new Mesh(
      new PlaneGeometry(1.15, 0.72),
      new MeshBasicMaterial({ color: '#ff5a18', toneMapped: false }),
    )
    mouth.position.set(0.1, 0.78, -2.08)
    group.add(mouth)
    for (let i = 0; i < 4; i += 1) {
      const ingot = shade(
        new Mesh(
          new RoundedBoxGeometry(0.28, 0.1, 0.12, 2, 0.02),
          new MeshStandardMaterial({ color: '#5a4038', roughness: 0.4, metalness: 0.7, emissive: '#ff6a20', emissiveIntensity: 0.35 }),
        ),
      )
      ingot.position.set(-1.3 + i * 0.34, 0.08, -1.35)
      ingot.rotation.y = i * 0.2
      group.add(ingot)
    }
  })

  add('floe', (group) => {
    const mat = new MeshStandardMaterial({ color: '#e7f7fb', roughness: 0.08, metalness: 0.05, emissive: '#d7f4ff', emissiveIntensity: 0.12 })
    const specs: Array<[number, number, number, number]> = [
      [-1.7, 0.7, -1.6, 0.55],
      [-2.3, 1.3, -2.6, 0.4],
      [1.6, 0.9, -1.5, 0.7],
      [2.2, 0.45, -2.4, 0.35],
      [0.8, 1.5, -3.2, 0.45],
      [-0.6, 0.4, -2.2, 0.3],
    ]
    for (const [x, y, z, s] of specs) {
      const crystal = shade(new Mesh(new IcosahedronGeometry(s, 0), mat))
      crystal.position.set(x, y, z)
      crystal.rotation.set(x, y, z)
      group.add(crystal)
    }
  })

  add('schema', (group) => {
    const line = new MeshBasicMaterial({ color: '#9af0ff', wireframe: true })
    const frames: Array<[number, number, number, number, number, number]> = [
      [-1.8, 0.9, -1.8, 0.7, 1.6, 0.7],
      [1.7, 0.7, -2.1, 0.9, 1.2, 0.9],
      [0.2, 1.4, -3.2, 1.4, 0.5, 0.4],
    ]
    for (const [x, y, z, w, h, d] of frames) {
      const frame = new Mesh(new BoxGeometry(w, h, d), line)
      frame.position.set(x, y, z)
      group.add(frame)
    }
    const plate = sign('FIG. 01', '#06202c', '#9af0ff', 1.3, 0.48)
    plate.position.set(0, 0.42, -1.55)
    group.add(plate)
  })

  add('dune', (group) => {
    const sand = new MeshStandardMaterial({ color: '#e6b67a', roughness: 1 })
    const dunes: Array<[number, number, number, number, number]> = [
      [-2.2, -0.2, -2.2, 2.4, 0.7],
      [1.8, -0.35, -2.6, 3.1, 0.9],
      [0.2, -0.55, -4.2, 4.2, 1.1],
      [-3.2, -0.4, -0.6, 2.2, 0.55],
    ]
    for (const [x, y, z, sx, sy] of dunes) {
      const dune = shade(new Mesh(new SphereGeometry(1, 24, 16), sand))
      dune.scale.set(sx, sy, sx * 0.8)
      dune.position.set(x, y, z)
      group.add(dune)
    }
    const sun = new Mesh(new CircleGeometry(0.55, 32), new MeshBasicMaterial({ color: '#fff1c2', toneMapped: false }))
    sun.position.set(-3.4, 2.15, -5.5)
    group.add(sun)
  })

  add('ink', (group) => {
    const pineMat = new MeshStandardMaterial({ color: '#1c1b18', roughness: 1 })
    const pines: Array<[number, number, number]> = [
      [-2.1, 0, -1.8],
      [-2.7, 0, -3],
      [2.2, 0, -2.1],
      [1.5, 0, -3.3],
    ]
    pines.forEach(([x, , z], index) => {
      const scale = 0.85 + (index % 3) * 0.18
      const trunk = shade(new Mesh(new CylinderGeometry(0.04, 0.06, 0.4, 6), pineMat))
      trunk.position.set(x, 0.2, z)
      trunk.scale.setScalar(scale)
      group.add(trunk)
      const top = shade(new Mesh(new ConeGeometry(0.38 * scale, 1.5 * scale, 7), pineMat))
      top.position.set(x, 0.7 * scale + 0.2, z)
      group.add(top)
    })
    const moon = new Mesh(new CircleGeometry(0.42, 32), new MeshBasicMaterial({ color: '#f7f4ee' }))
    moon.position.set(-1.8, 2.7, -5.2)
    group.add(moon)
  })

  add('gilt', (group) => {
    const wax = new MeshStandardMaterial({ color: '#3a2418', roughness: 0.6 })
    const flameMat = new MeshBasicMaterial({ color: '#ffc56a', toneMapped: false })
    const spots: Array<[number, number, number]> = [
      [-1.45, 0, -1.55],
      [-1.15, 0, -1.85],
      [-1.7, 0, -1.95],
      [1.25, 0, -1.7],
      [1.55, 0, -2.05],
    ]
    for (const [x, , z] of spots) {
      const candle = shade(new Mesh(new CylinderGeometry(0.035, 0.04, 0.32, 8), wax))
      candle.position.set(x, 0.2, z)
      group.add(candle)
      const flame = new Mesh(new SphereGeometry(0.045, 10, 8), flameMat)
      flame.scale.y = 1.5
      flame.position.set(x, 0.42, z)
      group.add(flame)
    }
    const frame = shade(new Mesh(new TorusGeometry(0.72, 0.035, 8, 4), new MeshStandardMaterial({ color: '#e6c27a', metalness: 1, roughness: 0.28 })))
    frame.position.set(0.15, 1.7, -3.1)
    group.add(frame)
  })

  add('carrara', (group) => {
    const stone = new MeshStandardMaterial({ color: '#f7f5f2', roughness: 0.22, metalness: 0.02 })
    for (const x of [-1.85, 1.9]) {
      const column = shade(new Mesh(new CylinderGeometry(0.22, 0.26, 3.1, 20), stone))
      column.position.set(x, 1.55, -2.3)
      group.add(column)
      const cap = shade(new Mesh(new CylinderGeometry(0.32, 0.32, 0.12, 20), stone))
      cap.position.set(x, 3.12, -2.3)
      group.add(cap)
    }
    const plinth = shade(new Mesh(new CylinderGeometry(0.42, 0.48, 0.9, 20), stone))
    plinth.position.set(2.15, 0.45, -0.9)
    group.add(plinth)
  })

  add('mycelia', (group) => {
    const stemMat = new MeshStandardMaterial({ color: '#1a2e26', roughness: 0.8 })
    const caps: Array<[string, number, number, number, number]> = [
      ['#5dffb0', -1.7, 0.55, -1.5, 0.34],
      ['#8af0ff', 1.55, 0.42, -1.7, 0.28],
      ['#d8ff6a', 0.35, 0.32, -2.15, 0.22],
      ['#5dffb0', -2.3, 0.7, -2.6, 0.4],
      ['#8af0ff', 2.1, 0.5, -2.5, 0.3],
    ]
    for (const [color, x, y, z, radius] of caps) {
      const stem = shade(new Mesh(new CylinderGeometry(radius * 0.22, radius * 0.3, y, 8), stemMat))
      stem.position.set(x, y * 0.5, z)
      group.add(stem)
      const cap = shade(
        new Mesh(
          new SphereGeometry(radius, 16, 12),
          new MeshStandardMaterial({ color, roughness: 0.45, emissive: color, emissiveIntensity: 0.85 }),
        ),
      )
      cap.scale.y = 0.55
      cap.position.set(x, y, z)
      group.add(cap)
    }
  })

  add('halftone', (group) => {
    const pole = shade(new Mesh(new CylinderGeometry(0.045, 0.05, 2.4, 8), new MeshStandardMaterial({ color: '#2a2622', roughness: 0.6, metalness: 0.4 })))
    pole.position.set(1.85, 1.2, -0.55)
    group.add(pole)
    const arm = shade(new Mesh(new CylinderGeometry(0.03, 0.03, 0.7, 8), new MeshStandardMaterial({ color: '#2a2622', metalness: 0.4, roughness: 0.5 })))
    arm.rotation.z = Math.PI / 2
    arm.position.set(1.55, 2.3, -0.55)
    group.add(arm)
    const lamp = new Mesh(new SphereGeometry(0.16, 16, 12), new MeshBasicMaterial({ color: '#fff2cc', toneMapped: false }))
    lamp.position.set(1.22, 2.28, -0.55)
    group.add(lamp)
    const poster = sign('STILL', '#1a1612', '#f3ecdf', 0.9, 1.15)
    poster.position.set(-2.15, 1.45, -2.4)
    group.add(poster)
  })

  add('nave', (group) => {
    const colors = ['#ff4d6a', '#4d7bff', '#ffd24a']
    colors.forEach((color, index) => {
      const x = -2.15 + index * 2.15
      const frame = shade(new Mesh(new BoxGeometry(0.95, 2.5, 0.08), new MeshStandardMaterial({ color: '#1a1216', roughness: 0.8 })))
      frame.position.set(x, 1.7, -3.05)
      group.add(frame)
      const glass = new Mesh(
        new PlaneGeometry(0.72, 2.15),
        new MeshBasicMaterial({ color, transparent: true, opacity: 0.92, toneMapped: false }),
      )
      glass.position.set(x, 1.72, -3)
      group.add(glass)
    })
  })

  add('pixel', (group) => {
    const blocks: Array<[string, number, number, number, number, number, number]> = [
      ['#ff4d8d', -2.1, 0.45, -1.8, 0.7, 0.9, 0.7],
      ['#3dfff2', -1.3, 0.95, -2.5, 0.5, 0.5, 0.5],
      ['#ffe14a', 1.6, 0.55, -1.7, 0.8, 1.1, 0.8],
      ['#3a28c8', 2.2, 0.3, -2.6, 0.6, 0.6, 0.6],
      ['#ff4d8d', 0.4, 0.4, -3.1, 1.2, 0.8, 0.4],
      ['#3dfff2', -2.4, 1.2, -2.9, 0.4, 0.4, 0.4],
    ]
    for (const [color, x, y, z, w, h, d] of blocks) {
      const block = shade(new Mesh(new BoxGeometry(w, h, d), new MeshStandardMaterial({ color, roughness: 1 })))
      block.position.set(x, y, z)
      group.add(block)
    }
    const hold = sign('HOLD', '#1a1030', '#ffe14a', 1.2, 0.48)
    hold.position.set(0.1, 1.15, -3.05)
    group.add(hold)
  })

  add('lamp', (group) => {
    const wood = new MeshStandardMaterial({ color: '#4a3428', roughness: 0.55 })
    const pole = shade(new Mesh(new CylinderGeometry(0.025, 0.03, 1.45, 8), new MeshStandardMaterial({ color: '#2a2420', metalness: 0.6, roughness: 0.35 })))
    pole.position.set(-1.48, 0.78, -0.2)
    group.add(pole)
    const shadeMesh = shade(new Mesh(new ConeGeometry(0.28, 0.32, 18, 1, true), new MeshStandardMaterial({ color: '#f2e2c8', roughness: 0.7, side: 2, emissive: '#ffb060', emissiveIntensity: 0.35 })))
    shadeMesh.position.set(-1.48, 1.58, -0.2)
    group.add(shadeMesh)
    const bulb = new Mesh(new SphereGeometry(0.06, 12, 8), new MeshBasicMaterial({ color: '#fff1d4', toneMapped: false }))
    bulb.position.set(-1.48, 1.48, -0.2)
    group.add(bulb)
    const table = shade(new Mesh(new CylinderGeometry(0.28, 0.28, 0.04, 20), wood))
    table.position.set(1.15, 0.52, 0.15)
    group.add(table)
    const leg = shade(new Mesh(new CylinderGeometry(0.03, 0.04, 0.48, 8), wood))
    leg.position.set(1.15, 0.26, 0.15)
    group.add(leg)
  })

  return { root, kits }
}
