import {
  Color,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  type Camera,
  type Scene,
} from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const styleFragment = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uPixel;
  uniform float uHeat;
  uniform float uPosterize;
  uniform float uInk;
  uniform float uOutline;
  uniform float uBlueprint;
  uniform float uHalftone;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uBrightness;
  uniform vec3 uTint;
  varying vec2 vUv;

  vec3 srgb(vec3 c) {
    return pow(max(c, vec3(0.0)), vec3(2.2));
  }

  vec2 styledUv(vec2 uv) {
    float wave = sin(uv.y * 36.0 + uTime * 2.6) * sin(uv.x * 22.0 - uTime * 1.8);
    uv += vec2(wave, wave * 0.35) * uHeat * 0.014;
    if (uPixel > 1.5) {
      vec2 grid = uPixel / uResolution;
      uv = (floor(uv / grid) + 0.5) * grid;
    }
    return uv;
  }

  void main() {
    vec2 uv = styledUv(vUv);
    vec3 col = texture2D(tDiffuse, uv).rgb;

    if (uPosterize > 1.5) {
      col = floor(col * uPosterize + 0.001) / uPosterize;
    }

    float edge = 0.0;
    if (uInk > 0.01 || uBlueprint > 0.01 || uOutline > 0.01) {
      vec2 px = 1.4 / uResolution;
      float tl = dot(texture2D(tDiffuse, styledUv(vUv + vec2(-px.x, px.y))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float tc = dot(texture2D(tDiffuse, styledUv(vUv + vec2(0.0, px.y))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float tr = dot(texture2D(tDiffuse, styledUv(vUv + vec2(px.x, px.y))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float ml = dot(texture2D(tDiffuse, styledUv(vUv + vec2(-px.x, 0.0))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float mr = dot(texture2D(tDiffuse, styledUv(vUv + vec2(px.x, 0.0))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float bl = dot(texture2D(tDiffuse, styledUv(vUv + vec2(-px.x, -px.y))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float bc = dot(texture2D(tDiffuse, styledUv(vUv + vec2(0.0, -px.y))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float br = dot(texture2D(tDiffuse, styledUv(vUv + vec2(px.x, -px.y))).rgb, vec3(0.2126, 0.7152, 0.0722));
      float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
      float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
      edge = length(vec2(gx, gy));
    }

    if (uInk > 0.01) {
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      vec3 paper = srgb(vec3(0.94, 0.91, 0.84));
      vec3 inkc = srgb(vec3(0.07, 0.065, 0.055));
      vec3 wash = mix(inkc, paper, smoothstep(0.02, 0.72, lum));
      float hatch = smoothstep(0.25, 0.75, sin((gl_FragCoord.x + gl_FragCoord.y) * 0.48));
      wash = mix(wash, inkc, hatch * smoothstep(0.25, 0.7, 1.0 - lum) * 0.65);
      wash = mix(wash, inkc, smoothstep(0.06, 0.42, edge));
      col = mix(col, wash, uInk);
    }

    if (uOutline > 0.01) {
      col = mix(col, srgb(vec3(0.04, 0.035, 0.03)), smoothstep(0.08, 0.48, edge) * uOutline);
    }

    if (uBlueprint > 0.01) {
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      vec3 navy = srgb(vec3(0.03, 0.07, 0.14));
      vec3 cyan = srgb(vec3(0.62, 0.92, 1.0));
      vec3 bp = mix(navy, cyan, smoothstep(0.18, 0.9, lum) * 0.28);
      bp = mix(bp, cyan, smoothstep(0.08, 0.5, edge));
      float grid = step(0.985, fract(gl_FragCoord.x / 36.0)) + step(0.985, fract(gl_FragCoord.y / 36.0));
      bp += cyan * grid * 0.22;
      col = mix(col, bp, uBlueprint);
    }

    if (uHalftone > 0.01) {
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      vec2 cell = gl_FragCoord.xy / 6.5;
      float dist = length(fract(cell) - 0.5);
      float radius = (1.0 - lum) * 0.5;
      float dotMask = smoothstep(radius, radius - 0.025, dist);
      vec3 paper = srgb(vec3(0.95, 0.91, 0.8));
      vec3 inkc = srgb(vec3(0.07, 0.06, 0.05));
      vec3 ht = mix(inkc, paper, dotMask);
      col = mix(col, ht, uHalftone);
    }

    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(luma), col, uSaturation);
    col = (col - 0.5) * uContrast + 0.5;
    col *= uBrightness * uTint;
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  }
`

const finishFragment = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uAberration;
  uniform float uFlash;
  varying vec2 vUv;

  void main() {
    float ab = (uAberration + uFlash * 9.0) / uResolution.x;
    vec3 col;
    col.r = texture2D(tDiffuse, vUv + vec2(ab, 0.0)).r;
    col.g = texture2D(tDiffuse, vUv).g;
    col.b = texture2D(tDiffuse, vUv - vec2(ab, 0.0)).b;
    col *= 1.0 + uFlash * 0.28;

    vec2 p = vUv - 0.5;
    p.x *= uResolution.x / max(uResolution.y, 1.0);
    float vig = smoothstep(0.35, 1.15, length(p));
    col *= mix(1.0, 1.0 - uVignette, vig);

    float n = fract(sin(dot(gl_FragCoord.xy + fract(uTime * 13.7), vec2(12.9898, 78.233))) * 43758.5453);
    col += (n - 0.5) * uGrain * 0.22;
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  }
`

export type Pipeline = {
  composer: EffectComposer
  bloom: UnrealBloomPass
  style: ShaderMaterial
  finish: ShaderMaterial
  setSize: (width: number, height: number) => void
}

export function createPipeline(renderer: WebGLRenderer, scene: Scene, camera: Camera): Pipeline {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const stylePass = new ShaderPass(
    new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new Vector2(1, 1) },
        uTime: { value: 0 },
        uPixel: { value: 0 },
        uHeat: { value: 0 },
        uPosterize: { value: 0 },
        uInk: { value: 0 },
        uOutline: { value: 0 },
        uBlueprint: { value: 0 },
        uHalftone: { value: 0 },
        uContrast: { value: 1 },
        uSaturation: { value: 1 },
        uBrightness: { value: 1 },
        uTint: { value: new Color(1, 1, 1) },
      },
      vertexShader: vertex,
      fragmentShader: styleFragment,
    }),
  )
  composer.addPass(stylePass)

  const bloom = new UnrealBloomPass(new Vector2(512, 512), 0.2, 0.5, 0.85)
  composer.addPass(bloom)

  const finishPass = new ShaderPass(
    new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new Vector2(1, 1) },
        uTime: { value: 0 },
        uVignette: { value: 0.3 },
        uGrain: { value: 0.05 },
        uAberration: { value: 0.3 },
        uFlash: { value: 0 },
      },
      vertexShader: vertex,
      fragmentShader: finishFragment,
    }),
  )
  composer.addPass(finishPass)
  composer.addPass(new OutputPass())

  const style = stylePass.material
  const finish = finishPass.material
  if (!(style instanceof ShaderMaterial) || !(finish instanceof ShaderMaterial)) {
    throw new Error('Expected shader passes')
  }

  return {
    composer,
    bloom,
    style,
    finish,
    setSize(width: number, height: number) {
      composer.setSize(width, height)
    },
  }
}

export function setResolution(material: ShaderMaterial, width: number, height: number) {
  const uniform = material.uniforms.uResolution
  if (uniform && uniform.value instanceof Vector2) uniform.value.set(width, height)
}
