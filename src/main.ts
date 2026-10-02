import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import './styles.css'

import {
  ACESFilmicToneMapping,
  BackSide,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  EquirectangularReflectionMapping,
  FogExp2,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  PointLight,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three'
import { createRig, type Rig } from './character'
import { Score } from './audio'
import { ParticleField, steamPoints } from './particles'
import { createPipeline, setResolution } from './post'
import { createPropKits } from './props'
import {
  TOTAL_SECONDS,
  WORLDS,
  drinkPulse,
  sipAmount,
  startOf,
  worldAt,
  type WorldDef,
} from './worlds'

const GLOW = 3

class Look {
  fog = new Color()
  fogDensity = 0
  cove = new Color()
  coveOpacity = 1
  ground = new Color()
  groundRough = 1
  groundMetal = 0
  hemiSky = new Color()
  hemiGround = new Color()
  hemiIntensity = 0
  key = new Color()
  keyIntensity = 1
  keyPos = new Vector3()
  fill = new Color()
  fillIntensity = 1
  fillPos = new Vector3()
  rim = new Color()
  rimIntensity = 1
  rimPos = new Vector3()
  glowColor = [new Color(), new Color(), new Color()]
  glowIntensity = [0, 0, 0]
  glowPos = [new Vector3(), new Vector3(), new Vector3()]
  cloth = new Color()
  skin = new Color()
  hair = new Color()
  cup = new Color()
  liquid = new Color()
  metal = new Color()
  stool = new Color()
  boot = new Color()
  eye = new Color()
  eyeGlow = 0
  rough = 1
  metalness = 0
  emissive = new Color()
  emissiveIntensity = 0
  envIntensity = 0.3
  sheen = 0
  exposure = 1
  contrast = 1
  saturation = 1
  brightness = 1
  vignette = 0.3
  grain = 0.05
  aberration = 0.2
  bloom = 0.1
  bloomThreshold = 0.8
  bloomRadius = 0.4
  pixel = 0
  halftone = 0
  posterize = 0
  ink = 0
  outline = 0
  blueprint = 0
  heat = 0
  tint = new Color(1, 1, 1)
  skyTop = new Color()
  skyHorizon = new Color()
  skyBottom = new Color()
  sun = new Color()
  sunStrength = 0
  sunDir = new Vector3(0, 1, 0)
  stars = 0
}

function writeLook(world: WorldDef, out: Look) {
  out.fog.set(world.fog)
  out.fogDensity = world.fogDensity
  out.cove.set(world.cove ?? world.fog)
  out.coveOpacity = world.cove ? 1 : 0
  out.ground.set(world.ground)
  out.groundRough = world.groundRough
  out.groundMetal = world.groundMetal
  out.hemiSky.set(world.hemiSky)
  out.hemiGround.set(world.hemiGround)
  out.hemiIntensity = world.hemiIntensity
  out.key.set(world.key)
  out.keyIntensity = world.keyIntensity
  out.keyPos.set(...world.keyPos)
  out.fill.set(world.fill)
  out.fillIntensity = world.fillIntensity
  out.fillPos.set(...world.fillPos)
  out.rim.set(world.rim)
  out.rimIntensity = world.rimIntensity
  out.rimPos.set(...world.rimPos)
  for (let i = 0; i < GLOW; i += 1) {
    const glow = world.glow[i]
    out.glowColor[i].set(glow.color)
    out.glowIntensity[i] = glow.intensity
    out.glowPos[i].set(...glow.pos)
  }
  out.cloth.set(world.cloth)
  out.skin.set(world.skin)
  out.hair.set(world.hair)
  out.cup.set(world.cup)
  out.liquid.set(world.liquid)
  out.metal.set(world.metal)
  out.stool.set(world.stool)
  out.boot.set(world.boot)
  out.eye.set(world.eye)
  out.eyeGlow = world.id === 'relay' || world.id === 'mycelia' || world.id === 'kiln' ? 0.9 : 0
  out.rough = world.rough
  out.metalness = world.metalness
  out.emissive.set(world.emissive)
  out.emissiveIntensity = world.emissiveIntensity
  out.envIntensity = world.envIntensity
  out.sheen = world.sheen
  out.exposure = world.exposure
  out.contrast = world.contrast
  out.saturation = world.saturation
  out.brightness = world.brightness
  out.vignette = world.vignette
  out.grain = world.grain
  out.aberration = world.aberration
  out.bloom = world.bloom
  out.bloomThreshold = world.bloomThreshold
  out.bloomRadius = world.bloomRadius
  out.pixel = world.pixel
  out.halftone = world.halftone
  out.posterize = world.posterize
  out.ink = world.ink
  out.outline = world.outline
  out.blueprint = world.blueprint
  out.heat = world.heat
  out.tint.setRGB(world.tint[0], world.tint[1], world.tint[2])
  out.skyTop.set(world.skyTop)
  out.skyHorizon.set(world.skyHorizon)
  out.skyBottom.set(world.skyBottom)
  out.sun.set(world.sun)
  out.sunStrength = world.sunStrength
  out.sunDir.set(...world.sunDir).normalize()
  out.stars = world.stars
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function mixColor(out: Color, a: Color, b: Color, t: number) {
  out.copy(a).lerp(b, t)
}

function mixLook(a: Look, b: Look, t: number, out: Look) {
  mixColor(out.fog, a.fog, b.fog, t)
  out.fogDensity = mix(a.fogDensity, b.fogDensity, t)
  mixColor(out.cove, a.cove, b.cove, t)
  out.coveOpacity = mix(a.coveOpacity, b.coveOpacity, t)
  mixColor(out.ground, a.ground, b.ground, t)
  out.groundRough = mix(a.groundRough, b.groundRough, t)
  out.groundMetal = mix(a.groundMetal, b.groundMetal, t)
  mixColor(out.hemiSky, a.hemiSky, b.hemiSky, t)
  mixColor(out.hemiGround, a.hemiGround, b.hemiGround, t)
  out.hemiIntensity = mix(a.hemiIntensity, b.hemiIntensity, t)
  mixColor(out.key, a.key, b.key, t)
  out.keyIntensity = mix(a.keyIntensity, b.keyIntensity, t)
  out.keyPos.lerpVectors(a.keyPos, b.keyPos, t)
  mixColor(out.fill, a.fill, b.fill, t)
  out.fillIntensity = mix(a.fillIntensity, b.fillIntensity, t)
  out.fillPos.lerpVectors(a.fillPos, b.fillPos, t)
  mixColor(out.rim, a.rim, b.rim, t)
  out.rimIntensity = mix(a.rimIntensity, b.rimIntensity, t)
  out.rimPos.lerpVectors(a.rimPos, b.rimPos, t)
  for (let i = 0; i < GLOW; i += 1) {
    mixColor(out.glowColor[i], a.glowColor[i], b.glowColor[i], t)
    out.glowIntensity[i] = mix(a.glowIntensity[i], b.glowIntensity[i], t)
    out.glowPos[i].lerpVectors(a.glowPos[i], b.glowPos[i], t)
  }
  mixColor(out.cloth, a.cloth, b.cloth, t)
  mixColor(out.skin, a.skin, b.skin, t)
  mixColor(out.hair, a.hair, b.hair, t)
  mixColor(out.cup, a.cup, b.cup, t)
  mixColor(out.liquid, a.liquid, b.liquid, t)
  mixColor(out.metal, a.metal, b.metal, t)
  mixColor(out.stool, a.stool, b.stool, t)
  mixColor(out.boot, a.boot, b.boot, t)
  mixColor(out.eye, a.eye, b.eye, t)
  out.eyeGlow = mix(a.eyeGlow, b.eyeGlow, t)
  out.rough = mix(a.rough, b.rough, t)
  out.metalness = mix(a.metalness, b.metalness, t)
  mixColor(out.emissive, a.emissive, b.emissive, t)
  out.emissiveIntensity = mix(a.emissiveIntensity, b.emissiveIntensity, t)
  out.envIntensity = mix(a.envIntensity, b.envIntensity, t)
  out.sheen = mix(a.sheen, b.sheen, t)
  out.exposure = mix(a.exposure, b.exposure, t)
  out.contrast = mix(a.contrast, b.contrast, t)
  out.saturation = mix(a.saturation, b.saturation, t)
  out.brightness = mix(a.brightness, b.brightness, t)
  out.vignette = mix(a.vignette, b.vignette, t)
  out.grain = mix(a.grain, b.grain, t)
  out.aberration = mix(a.aberration, b.aberration, t)
  out.bloom = mix(a.bloom, b.bloom, t)
  out.bloomThreshold = mix(a.bloomThreshold, b.bloomThreshold, t)
  out.bloomRadius = mix(a.bloomRadius, b.bloomRadius, t)
  out.pixel = mix(a.pixel, b.pixel, t)
  out.halftone = mix(a.halftone, b.halftone, t)
  out.posterize = mix(a.posterize, b.posterize, t)
  out.ink = mix(a.ink, b.ink, t)
  out.outline = mix(a.outline, b.outline, t)
  out.blueprint = mix(a.blueprint, b.blueprint, t)
  out.heat = mix(a.heat, b.heat, t)
  mixColor(out.tint, a.tint, b.tint, t)
  mixColor(out.skyTop, a.skyTop, b.skyTop, t)
  mixColor(out.skyHorizon, a.skyHorizon, b.skyHorizon, t)
  mixColor(out.skyBottom, a.skyBottom, b.skyBottom, t)
  mixColor(out.sun, a.sun, b.sun, t)
  out.sunStrength = mix(a.sunStrength, b.sunStrength, t)
  out.sunDir.lerpVectors(a.sunDir, b.sunDir, t).normalize()
  out.stars = mix(a.stars, b.stars, t)
}

function copyLook(from: Look, to: Look) {
  mixLook(from, from, 0, to)
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

function must<T extends Element>(id: string): T {
  const node = document.querySelector(id)
  if (!node) throw new Error(`Missing ${id}`)
  return node as T
}

function equirect(world: WorldDef): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return new CanvasTexture(canvas)
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, world.skyTop)
  gradient.addColorStop(0.52, world.skyHorizon)
  gradient.addColorStop(1, world.skyBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 256)
  for (const glow of world.glow) {
    if (glow.intensity < 1) continue
    const x = 256 + glow.pos[0] * 36
    const y = 90
    const radius = 40 + Math.min(glow.intensity, 30)
    const orb = ctx.createRadialGradient(x, y, 0, x, y, radius)
    orb.addColorStop(0, glow.color)
    orb.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = orb
    ctx.fillRect(0, 0, 512, 256)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.mapping = EquirectangularReflectionMapping
  return texture
}

function applyPose(rig: Rig, sip: number, drink: number) {
  const { head, shoulder, forearm, wrist, rest, sip: target } = rig
  head.rotation.set(
    mix(rest.head.x, target.head.x, sip),
    mix(rest.head.y, target.head.y, sip),
    mix(rest.head.z, target.head.z, sip),
  )
  shoulder.rotation.set(
    mix(rest.shoulder.x, target.shoulder.x, sip),
    mix(rest.shoulder.y, target.shoulder.y, sip),
    mix(rest.shoulder.z, target.shoulder.z, sip),
  )
  forearm.rotation.set(
    mix(rest.forearm.x, target.forearm.x, sip),
    mix(rest.forearm.y, target.forearm.y, sip),
    mix(rest.forearm.z, target.forearm.z, sip),
  )
  wrist.rotation.set(
    mix(rest.wrist.x, target.wrist.x, sip) + drink * 0.18,
    mix(rest.wrist.y, target.wrist.y, sip),
    mix(rest.wrist.z, target.wrist.z, sip),
  )
}

declare global {
  interface Window {
    __READY?: boolean
    __WORLD?: string
    __SIP?: number
    __TIME?: number
  }
}

async function main() {
  const params = new URLSearchParams(location.search)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const canvas = must<HTMLCanvasElement>('#stage')
  const boot = must<HTMLElement>('#boot')
  const error = must<HTMLElement>('#error')
  if (params.has('clean')) document.body.classList.add('clean')

  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
  } catch (err) {
    error.hidden = false
    error.textContent = err instanceof Error ? err.message : 'WebGL is unavailable.'
    return
  }
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  const coarse = window.matchMedia('(pointer: coarse)').matches
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : 1.6))

  const scene = new Scene()
  scene.fog = new FogExp2('#e7dcd0', 0.012)
  const fog = scene.fog
  const camera = new PerspectiveCamera(26, 1, 0.1, 80)

  const hemi = new HemisphereLight('#fff4e8', '#c8b39a', 0.5)
  scene.add(hemi)
  const keyLight = new DirectionalLight('#fff1e2', 3.2)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 0.4
  keyLight.shadow.camera.far = 12
  keyLight.shadow.camera.left = -2.4
  keyLight.shadow.camera.right = 2.4
  keyLight.shadow.camera.top = 2.4
  keyLight.shadow.camera.bottom = -2.4
  keyLight.shadow.bias = -0.0002
  keyLight.shadow.normalBias = 0.03
  keyLight.target.position.set(0, 0.9, 0)
  scene.add(keyLight, keyLight.target)
  const fill = new DirectionalLight('#f0e2d4', 0.6)
  scene.add(fill)
  const rim = new DirectionalLight('#ffd8b8', 1.4)
  scene.add(rim)
  const glows = [0, 1, 2].map(() => {
    const light = new PointLight('#ffffff', 0, 0, 2)
    scene.add(light)
    return light
  })

  const sky = new Mesh(
    new SphereGeometry(40, 32, 20),
    new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new Color('#f4efe6') },
        uHorizon: { value: new Color('#e4d9cc') },
        uBottom: { value: new Color('#cbbba8') },
        uSun: { value: new Color('#fff6ea') },
        uSunStrength: { value: 0.3 },
        uSunDir: { value: new Vector3(-0.4, 0.6, 0.4).normalize() },
        uStars: { value: 0 },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDir;
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uBottom;
        uniform vec3 uSun;
        uniform float uSunStrength;
        uniform vec3 uSunDir;
        uniform float uStars;
        float hash(vec3 p) {
          return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }
        void main() {
          vec3 dir = normalize(vDir);
          float h = dir.y * 0.5 + 0.5;
          vec3 col = mix(uBottom, uHorizon, smoothstep(0.0, 0.48, h));
          col = mix(col, uTop, smoothstep(0.45, 1.0, h));
          float sunDot = pow(max(dot(dir, normalize(uSunDir)), 0.0), 80.0);
          col += uSun * sunDot * uSunStrength;
          float stars = step(0.993, hash(floor(dir * 180.0))) * uStars;
          stars *= smoothstep(0.05, 0.4, dir.y);
          col += stars * 1.3;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
  )
  sky.frustumCulled = false
  sky.renderOrder = -2
  scene.add(sky)
  const skyMat = sky.material as ShaderMaterial

  const ground = new Mesh(
    new CircleGeometry(30, 48),
    new MeshStandardMaterial({ color: '#d5c7b6', roughness: 0.92, metalness: 0 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  const groundMat = ground.material as MeshStandardMaterial

  const cove = new Mesh(
    new CylinderGeometry(11, 11, 8, 48, 1, true),
    new MeshStandardMaterial({ color: '#e6dbd0', side: BackSide, roughness: 1 }),
  )
  cove.position.y = 2.5
  cove.renderOrder = -1
  scene.add(cove)
  const coveMat = cove.material as MeshStandardMaterial

  const rig = createRig()
  scene.add(rig.root)

  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = 256
  shadowCanvas.height = 256
  const shadowCtx = shadowCanvas.getContext('2d')
  if (shadowCtx) {
    const gradient = shadowCtx.createRadialGradient(128, 128, 16, 128, 128, 120)
    gradient.addColorStop(0, 'rgba(0,0,0,0.45)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    shadowCtx.fillStyle = gradient
    shadowCtx.fillRect(0, 0, 256, 256)
  }
  const contact = new Mesh(
    new CircleGeometry(0.9, 32),
    new MeshBasicMaterial({ map: new CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }),
  )
  contact.rotation.x = -Math.PI / 2
  contact.position.y = 0.086
  scene.add(contact)

  await document.fonts.ready
  const props = createPropKits()
  scene.add(props.root)
  const field = new ParticleField()
  scene.add(field.points)
  const steam = steamPoints()
  scene.add(steam)

  const pmrem = new PMREMGenerator(renderer)
  const envMaps: Texture[] = WORLDS.map((world) => {
    const texture = equirect(world)
    const env = pmrem.fromEquirectangular(texture).texture
    texture.dispose()
    return env
  })
  pmrem.dispose()

  const pipeline = createPipeline(renderer, scene, camera)
  const score = new Score()
  const scratch = new Color()
  const cupPos = new Vector3()

  const from = new Look()
  const to = new Look()
  const displayed = new Look()

  let time = Number(params.get('t') ?? '0')
  if (params.has('world')) {
    const index = Number(params.get('world'))
    if (Number.isFinite(index)) time = startOf(index)
  }
  if (!Number.isFinite(time)) time = 0
  let paused = params.has('pause')
  let current = -1
  let morph = 1
  let flash = 0
  let closeup = 0
  let sipLatch = false
  let coveTransparent = false

  const num = must<HTMLElement>('#num')
  const name = must<HTMLElement>('#name')
  const kicker = must<HTMLElement>('#kicker')
  const clock = must<HTMLElement>('#clock')
  const progress = must<HTMLElement>('#progress')
  const lock = must<HTMLElement>('#lock')
  const lockLabel = must<HTMLElement>('#lock-label')
  const slam = must<HTMLElement>('#slam')
  const play = must<HTMLButtonElement>('#play')
  const sound = must<HTMLButtonElement>('#sound')
  const ticks = must<HTMLElement>('#ticks')
  const tickButtons: HTMLButtonElement[] = []
  WORLDS.forEach((world, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.title = world.name
    button.setAttribute('aria-label', `${index + 1}. ${world.name}`)
    button.addEventListener('click', () => {
      time = startOf(index)
    })
    ticks.append(button)
    tickButtons.push(button)
  })

  const setEnv = (index: number) => {
    const env = envMaps[index]
    if (!env) return
    scene.environment = env
    const mats = [groundMat, coveMat, ...Object.values(rig.materials)]
    for (const material of mats) material.envMap = env
  }

  const showKit = (id: string) => {
    for (const [keyId, kit] of Object.entries(props.kits)) kit.visible = keyId === id
  }

  const paint = (look: Look) => {
    fog.color.copy(look.fog)
    fog.density = look.fogDensity
    renderer.toneMappingExposure = look.exposure
    hemi.color.copy(look.hemiSky)
    hemi.groundColor.copy(look.hemiGround)
    hemi.intensity = look.hemiIntensity
    keyLight.color.copy(look.key)
    keyLight.intensity = look.keyIntensity
    keyLight.position.copy(look.keyPos)
    fill.color.copy(look.fill)
    fill.intensity = look.fillIntensity
    fill.position.copy(look.fillPos)
    rim.color.copy(look.rim)
    rim.intensity = look.rimIntensity
    rim.position.copy(look.rimPos)
    glows.forEach((light, index) => {
      light.color.copy(look.glowColor[index])
      light.intensity = look.glowIntensity[index]
      light.position.copy(look.glowPos[index])
    })
    groundMat.color.copy(look.ground)
    groundMat.roughness = look.groundRough
    groundMat.metalness = look.groundMetal
    groundMat.envMapIntensity = look.envIntensity
    coveMat.color.copy(look.cove)
    coveMat.opacity = look.coveOpacity
    cove.visible = look.coveOpacity > 0.03
    const transparent = look.coveOpacity < 0.98
    if (transparent !== coveTransparent) {
      coveMat.transparent = transparent
      coveMat.depthWrite = !transparent
      coveMat.needsUpdate = true
      coveTransparent = transparent
    }
    const mats = rig.materials
    mats.cloth.color.copy(look.cloth)
    mats.cloth.roughness = look.rough
    mats.cloth.metalness = look.metalness
    mats.cloth.emissive.copy(look.emissive)
    mats.cloth.emissiveIntensity = look.emissiveIntensity
    mats.cloth.envMapIntensity = look.envIntensity
    mats.cloth.sheen = look.sheen
    mats.skin.color.copy(look.skin)
    mats.skin.roughness = Math.min(1, look.rough + 0.04)
    mats.skin.metalness = look.metalness * 0.85
    mats.skin.emissive.copy(look.emissive)
    mats.skin.emissiveIntensity = look.emissiveIntensity * 0.7
    mats.skin.envMapIntensity = look.envIntensity
    mats.hair.color.copy(look.hair)
    mats.hair.roughness = Math.max(0.15, look.rough - 0.12)
    mats.hair.metalness = Math.min(1, look.metalness)
    mats.hair.envMapIntensity = look.envIntensity
    mats.cup.color.copy(look.cup)
    mats.cup.roughness = Math.max(0.08, look.rough - 0.28)
    mats.cup.metalness = look.metalness * 0.4
    mats.cup.envMapIntensity = Math.max(look.envIntensity, 0.35)
    mats.liquid.color.copy(look.liquid)
    mats.liquid.emissive.copy(look.liquid)
    mats.liquid.emissiveIntensity = look.bloom > 0.4 ? 0.35 : 0.05
    mats.metal.color.copy(look.metal)
    mats.metal.roughness = Math.min(0.32, look.rough)
    mats.metal.metalness = 1
    mats.metal.envMapIntensity = Math.max(0.8, look.envIntensity)
    mats.stool.color.copy(look.stool)
    mats.stool.roughness = Math.min(1, look.rough + 0.05)
    mats.stool.metalness = look.metalness * 0.5
    mats.stool.envMapIntensity = look.envIntensity
    mats.boot.color.copy(look.boot)
    mats.boot.roughness = look.rough
    mats.boot.metalness = look.metalness * 0.35
    mats.boot.envMapIntensity = look.envIntensity
    mats.stage.color.copy(look.stool)
    mats.stage.roughness = Math.min(1, look.rough + 0.02)
    mats.stage.metalness = look.metalness * 0.4
    mats.stage.envMapIntensity = look.envIntensity
    mats.eye.color.copy(look.eye)
    mats.eye.emissive.copy(look.eye)
    mats.eye.emissiveIntensity = look.eyeGlow
    const icy = WORLDS[Math.max(current, 0)]?.id === 'floe'
    mats.cup.transmission = icy ? 0.9 : 0
    mats.cup.thickness = 0.5
    mats.cup.transparent = icy
    ;(skyMat.uniforms.uTop.value as Color).copy(look.skyTop)
    ;(skyMat.uniforms.uHorizon.value as Color).copy(look.skyHorizon)
    ;(skyMat.uniforms.uBottom.value as Color).copy(look.skyBottom)
    ;(skyMat.uniforms.uSun.value as Color).copy(look.sun)
    skyMat.uniforms.uSunStrength.value = look.sunStrength
    ;(skyMat.uniforms.uSunDir.value as Vector3).copy(look.sunDir)
    skyMat.uniforms.uStars.value = look.stars
    const style = pipeline.style.uniforms
    style.uPixel.value = look.pixel
    style.uHeat.value = look.heat
    style.uPosterize.value = look.posterize
    style.uInk.value = look.ink
    style.uOutline.value = look.outline
    style.uBlueprint.value = look.blueprint
    style.uHalftone.value = look.halftone
    style.uContrast.value = look.contrast
    style.uSaturation.value = look.saturation
    style.uBrightness.value = look.brightness
    ;(style.uTint.value as Color).copy(look.tint)
    pipeline.bloom.strength = look.bloom
    pipeline.bloom.threshold = look.bloomThreshold
    pipeline.bloom.radius = look.bloomRadius
    const finish = pipeline.finish.uniforms
    finish.uVignette.value = look.vignette
    finish.uGrain.value = look.grain
    finish.uAberration.value = look.aberration
  }

  const slamTo = (label: string) => {
    if (reduce) return
    slam.textContent = label
    slam.classList.remove('show')
    void slam.offsetWidth
    slam.classList.add('show')
  }

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    pipeline.setSize(width, height)
    const buffer = renderer.getDrawingBufferSize(new Vector2())
    setResolution(pipeline.style, buffer.x, buffer.y)
    setResolution(pipeline.finish, buffer.x, buffer.y)
  }
  resize()
  window.addEventListener('resize', resize)

  const cam = params.get('cam')
  const placeCamera = (now: number, zoom: number) => {
    if (cam === 'side') {
      camera.position.set(3.6, 1.2, 0.15)
      camera.lookAt(0, 0.95, 0)
      camera.fov = 30
      camera.updateProjectionMatrix()
      return
    }
    if (cam === 'front') {
      camera.position.set(0.05, 1.18, 4.9)
      camera.lookAt(0, 0.95, 0)
      camera.fov = 28
      camera.updateProjectionMatrix()
      return
    }
    const aspect = camera.aspect
    const tall = aspect < 0.9
    const dist = (tall ? 6.4 : 5.25) * (1 - 0.1 * zoom)
    const drift = reduce ? 0 : Math.sin(now * 0.22) * 0.03
    const orbit = 0.2 + drift
    camera.position.set(Math.sin(orbit) * dist, tall ? 1.45 : 1.2 - zoom * 0.02, Math.cos(orbit) * dist)
    camera.fov = tall ? 34 : 26
    camera.lookAt(0.02, (tall ? 1.0 : 0.92) + zoom * 0.1, 0.04)
    camera.updateProjectionMatrix()
  }

  const syncTransport = () => {
    play.textContent = paused ? 'Play' : 'Pause'
    play.setAttribute('aria-pressed', paused ? 'false' : 'true')
    sound.textContent = score.enabled ? 'Sound on' : 'Sound off'
    sound.setAttribute('aria-pressed', score.enabled ? 'true' : 'false')
  }

  play.addEventListener('click', () => {
    paused = !paused
    syncTransport()
  })
  must<HTMLButtonElement>('#prev').addEventListener('click', () => step(-1))
  must<HTMLButtonElement>('#next').addEventListener('click', () => step(1))
  sound.addEventListener('click', () => {
    score.toggle()
    syncTransport()
  })
  must<HTMLButtonElement>('#full').addEventListener('click', () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  })
  canvas.addEventListener('click', () => {
    paused = !paused
    syncTransport()
  })

  const step = (dir: number) => {
    const sample = worldAt(time)
    const next = (sample.index + dir + WORLDS.length) % WORLDS.length
    time = startOf(next)
  }

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
    if (event.code === 'Space') {
      event.preventDefault()
      paused = !paused
      syncTransport()
    } else if (event.code === 'ArrowRight') step(1)
    else if (event.code === 'ArrowLeft') step(-1)
    else if (event.code === 'KeyR') {
      time = 0
      paused = false
      syncTransport()
    } else if (event.code === 'KeyM') {
      score.toggle()
      syncTransport()
    } else if (event.code === 'KeyF') {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void document.documentElement.requestFullscreen()
    } else if (/^Digit[1-9]$/.test(event.code)) {
      const index = Number(event.code.slice(5)) - 1
      if (index < WORLDS.length) time = startOf(index)
    }
  })

  const initial = worldAt(time)
  writeLook(initial.world, from)
  writeLook(initial.world, to)
  writeLook(initial.world, displayed)
  current = initial.index
  setEnv(current)
  showKit(initial.world.prop)
  field.setMode(initial.world.particles, initial.world.particleColor)
  paint(displayed)
  num.textContent = String(initial.index + 1).padStart(2, '0')
  name.textContent = initial.world.name
  kicker.textContent = initial.world.kicker
  slamTo(initial.world.name)

  let last = performance.now()
  let booted = false
  const sheenWhite = new Color('#ffffff')

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!paused) time = (time + dt) % TOTAL_SECONDS
    const sample = worldAt(time)
    if (sample.index !== current) {
      copyLook(displayed, from)
      writeLook(sample.world, to)
      morph = 0
      current = sample.index
      flash = reduce ? 0 : 1
      setEnv(current)
      showKit(sample.world.prop)
      field.setMode(sample.world.particles, sample.world.particleColor)
      score.setWorld(current)
      slamTo(sample.world.name)
      num.textContent = String(current + 1).padStart(2, '0')
      name.textContent = sample.world.name
      kicker.textContent = sample.world.kicker
      const label = `${sample.world.name}. ${sample.world.kicker}`
      name.setAttribute('aria-label', label)
    }
    morph = Math.min(1, morph + dt / (reduce ? 0.55 : 0.26))
    mixLook(from, to, easeOut(morph), displayed)
    paint(displayed)
    scratch.copy(displayed.cloth).lerp(sheenWhite, 0.35)
    rig.materials.cloth.sheenColor.copy(scratch)

    const sip = sipAmount(sample.local, sample.world.finale)
    const drink = drinkPulse(sample.local, sample.world.finale)
    applyPose(rig, sip, drink)
    if (sip > 0.9 && !sipLatch) {
      sipLatch = true
      score.sip()
    }
    if (sip < 0.05) sipLatch = false

    const steamPositions = steam.userData.positions as Float32Array
    for (let i = 0; i < steamPositions.length; i += 3) {
      steamPositions[i + 1] += dt * 0.22
      if (steamPositions[i + 1] > 0.26) steamPositions[i + 1] = 0
    }
    ;(steam.geometry.getAttribute('position') as { needsUpdate: boolean }).needsUpdate = true
    scene.updateMatrixWorld(true)
    rig.cup.getWorldPosition(cupPos)
    steam.position.copy(cupPos)
    steam.position.y += 0.07
    steam.visible = sample.world.finale && sip > 0.35 && sip < 0.96

    field.update(dt)
    const targetClose = sample.world.finale ? Math.min(1, sample.local / 0.7) : 0
    closeup += (targetClose - closeup) * (1 - Math.exp(-dt * 2.4))
    placeCamera(time, closeup)
    flash = Math.max(0, flash - dt / 0.14)
    pipeline.finish.uniforms.uFlash.value = flash
    pipeline.style.uniforms.uTime.value = time
    pipeline.finish.uniforms.uTime.value = time
    if (params.has('raw')) renderer.render(scene, camera)
    else pipeline.composer.render()

    const shown = ((time % TOTAL_SECONDS) + TOTAL_SECONDS) % TOTAL_SECONDS
    const secs = shown % 60
    clock.textContent = `00:${secs.toFixed(1).padStart(4, '0')}`
    progress.style.transform = `scaleX(${shown / TOTAL_SECONDS})`
    lock.classList.toggle('sip', sip > 0.05)
    lockLabel.textContent = sip > 0.05 ? 'Taking a sip' : 'Pose locked'
    tickButtons.forEach((button, index) => {
      button.classList.toggle('on', index === sample.index)
      button.classList.toggle('past', index < sample.index)
    })
    window.__WORLD = sample.world.id
    window.__SIP = sip
    window.__TIME = shown
    if (!booted) {
      booted = true
      window.__READY = true
      boot.classList.add('hide')
    }
    requestAnimationFrame(frame)
  }

  syncTransport()
  requestAnimationFrame(frame)
}

void main().catch((err: unknown) => {
  const error = document.querySelector('#error')
  if (error instanceof HTMLElement) {
    error.hidden = false
    error.textContent = err instanceof Error ? err.message : 'The scene failed to start.'
  }
})
