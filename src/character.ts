import {
  CapsuleGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type Material,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export type RigMaterials = {
  cloth: MeshPhysicalMaterial
  skin: MeshStandardMaterial
  hair: MeshStandardMaterial
  cup: MeshPhysicalMaterial
  liquid: MeshStandardMaterial
  metal: MeshStandardMaterial
  stool: MeshStandardMaterial
  boot: MeshStandardMaterial
  stage: MeshStandardMaterial
  eye: MeshStandardMaterial
}

export type Rig = {
  root: Group
  head: Group
  shoulder: Group
  forearm: Group
  wrist: Group
  cup: Group
  materials: RigMaterials
  rest: { head: Euler; shoulder: Euler; forearm: Euler; wrist: Euler }
  sip: { head: Euler; shoulder: Euler; forearm: Euler; wrist: Euler }
}

function mark(mesh: Mesh, shadows = true): Mesh {
  mesh.castShadow = shadows
  mesh.receiveShadow = shadows
  return mesh
}

function pivot(parent: Group, x: number, y: number, z: number): Group {
  const group = new Group()
  group.position.set(x, y, z)
  parent.add(group)
  return group
}

function hang(parent: Group, radius: number, length: number, material: Material): Mesh {
  const mesh = mark(new Mesh(new CapsuleGeometry(radius, length, 4, 12), material))
  mesh.position.y = -(length * 0.5 + radius)
  parent.add(mesh)
  return mesh
}

function limbEnd(radius: number, length: number): number {
  return -(length + radius * 2)
}

export function createRig(): Rig {
  const cloth = new MeshPhysicalMaterial({ roughness: 0.9, metalness: 0, sheen: 0.4, sheenRoughness: 0.55, sheenColor: new Color('#d8b89a') })
  const skin = new MeshStandardMaterial({ roughness: 0.72, metalness: 0 })
  const hair = new MeshStandardMaterial({ roughness: 0.55, metalness: 0.04 })
  const cupMat = new MeshPhysicalMaterial({ roughness: 0.28, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.35 })
  const liquid = new MeshStandardMaterial({ roughness: 0.35, metalness: 0.05 })
  const metal = new MeshStandardMaterial({ roughness: 0.28, metalness: 1 })
  const stool = new MeshStandardMaterial({ roughness: 0.7, metalness: 0.04 })
  const boot = new MeshStandardMaterial({ roughness: 0.55, metalness: 0.08 })
  const stage = new MeshStandardMaterial({ roughness: 0.72, metalness: 0.04 })
  const eye = new MeshStandardMaterial({ roughness: 0.18, metalness: 0.05, color: '#1c1614' })

  const root = new Group()
  root.name = 'maquette'
  root.rotation.y = 0.46

  const disc = mark(new Mesh(new CylinderGeometry(1.38, 1.42, 0.08, 40), stage))
  disc.position.y = 0.04
  root.add(disc)

  const seat = mark(new Mesh(new CylinderGeometry(0.2, 0.188, 0.055, 28), stool))
  seat.position.y = 0.5
  root.add(seat)

  const legGeo = new CylinderGeometry(0.018, 0.022, 0.42, 8)
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
    const leg = mark(new Mesh(legGeo, stool))
    const radius = 0.145
    leg.position.set(Math.cos(angle) * radius, 0.29, Math.sin(angle) * radius)
    leg.rotation.z = Math.cos(angle) * 0.07
    leg.rotation.x = -Math.sin(angle) * 0.07
    root.add(leg)
  }

  const ring = mark(new Mesh(new TorusGeometry(0.19, 0.011, 8, 28), metal))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.24
  root.add(ring)

  const coat = mark(
    new Mesh(
      new LatheGeometry(
        [
          new Vector2(0.2, 0),
          new Vector2(0.27, 0.04),
          new Vector2(0.25, 0.22),
          new Vector2(0.22, 0.4),
          new Vector2(0.18, 0.54),
          new Vector2(0.13, 0.64),
        ],
        28,
      ),
      cloth,
    ),
  )
  coat.position.y = 0.5
  root.add(coat)

  const collar = mark(new Mesh(new TorusGeometry(0.105, 0.026, 8, 20), cloth))
  collar.rotation.x = Math.PI / 2
  collar.position.y = 1.12
  root.add(collar)

  for (let i = 0; i < 3; i += 1) {
    const button = mark(new Mesh(new SphereGeometry(0.016, 10, 8), metal))
    button.position.set(0.015, 0.78 + i * 0.11, 0.2)
    root.add(button)
  }

  const lapelGeo = new RoundedBoxGeometry(0.055, 0.2, 0.02, 2, 0.008)
  const lapelL = mark(new Mesh(lapelGeo, cloth))
  lapelL.position.set(-0.055, 1.02, 0.16)
  lapelL.rotation.z = -0.28
  lapelL.rotation.y = 0.35
  root.add(lapelL)
  const lapelR = mark(new Mesh(lapelGeo, cloth))
  lapelR.position.set(0.07, 1.02, 0.15)
  lapelR.rotation.z = 0.22
  lapelR.rotation.y = -0.4
  root.add(lapelR)

  const head = pivot(root, 0, 1.26, 0.02)
  head.rotation.set(0.08, -0.42, 0.03)

  const skull = mark(new Mesh(new SphereGeometry(0.128, 28, 20), skin))
  skull.scale.set(1, 1.08, 0.96)
  skull.position.y = 0.12
  head.add(skull)

  const hairCap = mark(new Mesh(new SphereGeometry(0.132, 24, 16), hair))
  hairCap.scale.set(1.08, 0.72, 1.12)
  hairCap.position.set(0, 0.2, -0.01)
  head.add(hairCap)

  const bob = mark(new Mesh(new SphereGeometry(0.11, 20, 14), hair))
  bob.scale.set(1.05, 0.85, 0.62)
  bob.position.set(0, 0.08, -0.07)
  head.add(bob)

  const sweep = mark(new Mesh(new SphereGeometry(0.07, 16, 12), hair))
  sweep.scale.set(1.3, 0.45, 0.7)
  sweep.position.set(-0.04, 0.16, 0.07)
  sweep.rotation.z = 0.4
  head.add(sweep)

  const ear = mark(new Mesh(new SphereGeometry(0.028, 12, 10), skin))
  ear.scale.set(0.6, 1, 0.7)
  ear.position.set(0.12, 0.1, 0)
  head.add(ear)

  const earring = mark(new Mesh(new TorusGeometry(0.016, 0.004, 6, 12), metal))
  earring.position.set(0.132, 0.07, 0.01)
  head.add(earring)

  const nose = mark(new Mesh(new ConeGeometry(0.018, 0.055, 5), skin), true)
  nose.rotation.x = Math.PI / 2
  nose.position.set(0, 0.1, 0.12)
  head.add(nose)

  const eyeGeo = new SphereGeometry(0.02, 14, 10)
  const eyeL = mark(new Mesh(eyeGeo, eye))
  eyeL.scale.set(1.15, 0.72, 0.7)
  eyeL.position.set(-0.048, 0.14, 0.1)
  head.add(eyeL)
  const eyeR = mark(new Mesh(eyeGeo, eye))
  eyeR.scale.set(1.15, 0.72, 0.7)
  eyeR.position.set(0.048, 0.14, 0.1)
  head.add(eyeR)

  const browGeo = new CapsuleGeometry(0.006, 0.04, 2, 6)
  const browL = mark(new Mesh(browGeo, hair))
  browL.rotation.z = Math.PI / 2
  browL.rotation.y = 0.3
  browL.position.set(-0.05, 0.175, 0.1)
  head.add(browL)
  const browR = mark(new Mesh(browGeo, hair))
  browR.rotation.z = Math.PI / 2
  browR.rotation.y = -0.25
  browR.position.set(0.05, 0.175, 0.1)
  head.add(browR)

  const mouth = mark(new Mesh(new CapsuleGeometry(0.006, 0.028, 2, 6), eye))
  mouth.rotation.z = Math.PI / 2
  mouth.position.set(0, 0.055, 0.112)
  head.add(mouth)

  const neck = mark(new Mesh(new CapsuleGeometry(0.045, 0.06, 3, 10), skin))
  neck.position.set(0, 1.2, 0.02)
  root.add(neck)

  const addLeg = (side: number) => {
    const thighLen = 0.26
    const thighR = 0.07
    const thigh = pivot(root, side * 0.09, 0.64, 0.02)
    thigh.rotation.x = -1.12
    thigh.rotation.z = side * -0.1
    hang(thigh, thighR, thighLen, cloth)
    const knee = pivot(thigh, 0, limbEnd(thighR, thighLen), 0)
    const calfLen = 0.24
    const calfR = 0.052
    knee.rotation.x = 1.18
    hang(knee, calfR, calfLen, skin)
    const ankle = pivot(knee, 0, limbEnd(calfR, calfLen), 0)
    ankle.rotation.x = -0.08
    const shoe = mark(new Mesh(new RoundedBoxGeometry(0.1, 0.07, 0.2, 2, 0.02), boot))
    shoe.position.set(0, -0.02, 0.05)
    ankle.add(shoe)
  }
  addLeg(1)
  addLeg(-1)

  const addArm = (side: number, cupArm: boolean) => {
    const upperLen = 0.22
    const upperR = 0.048
    const shoulder = pivot(root, side * 0.12, 1.05, 0.06)
    shoulder.rotation.x = cupArm ? -1.08 : -1.05
    shoulder.rotation.z = cupArm ? -0.32 : 0.16
    shoulder.rotation.y = cupArm ? 0.22 : -0.05
    hang(shoulder, upperR, upperLen, cloth)
    const elbow = pivot(shoulder, 0, limbEnd(upperR, upperLen), 0)
    const foreLen = 0.2
    const foreR = 0.04
    elbow.rotation.x = cupArm ? -1.9 : -1.2
    elbow.rotation.y = cupArm ? -0.35 : 0.2
    elbow.rotation.z = cupArm ? 0.15 : -0.05
    hang(elbow, foreR, foreLen, skin)
    const wrist = pivot(elbow, 0, limbEnd(foreR, foreLen), 0)
    wrist.rotation.x = cupArm ? -0.35 : 0.45
    wrist.rotation.z = cupArm ? 0.15 : 0.05

    const palm = mark(new Mesh(new SphereGeometry(0.046, 16, 12), skin))
    palm.scale.set(1.05, 0.72, 1.25)
    wrist.add(palm)
    const thumb = mark(new Mesh(new CapsuleGeometry(0.014, 0.03, 2, 8), skin))
    thumb.position.set(side * -0.04, -0.01, 0.03)
    thumb.rotation.z = side * 0.9
    thumb.rotation.x = 0.4
    wrist.add(thumb)

    if (!cupArm) return { elbow, wrist, shoulder }

    const cup = new Group()
    cup.position.set(0.0, 0.01, 0.07)
    cup.rotation.x = 0.65
    wrist.add(cup)
    const bowl = mark(
      new Mesh(
        new LatheGeometry(
          [
            new Vector2(0.01, 0),
            new Vector2(0.046, 0.004),
            new Vector2(0.05, 0.02),
            new Vector2(0.048, 0.07),
            new Vector2(0.036, 0.088),
          ],
          20,
        ),
        cupMat,
      ),
    )
    cup.add(bowl)
    const surface = mark(new Mesh(new CircleGeometry(0.034, 18), liquid), false)
    surface.rotation.x = -Math.PI / 2
    surface.position.y = 0.072
    cup.add(surface)
    return { elbow, wrist, cup, shoulder }
  }

  const right = addArm(1, true)
  addArm(-1, false)

  const forearm = right.elbow
  const wrist = right.wrist
  const shoulder = right.shoulder
  const cup = right.cup ?? new Group()

  const rest = {
    head: head.rotation.clone(),
    shoulder: shoulder.rotation.clone(),
    forearm: forearm.rotation.clone(),
    wrist: wrist.rotation.clone(),
  }
  const sip = {
    head: new Euler(rest.head.x + 0.34, rest.head.y + 0.08, rest.head.z),
    shoulder: new Euler(rest.shoulder.x - 0.54, rest.shoulder.y - 0.1, rest.shoulder.z),
    forearm: new Euler(rest.forearm.x + 0.25, rest.forearm.y + 0.08, rest.forearm.z),
    wrist: new Euler(rest.wrist.x + 0.25, rest.wrist.y - 0.05, rest.wrist.z + 0.1),
  }

  return {
    root,
    head,
    shoulder,
    forearm,
    wrist,
    cup,
    materials: { cloth, skin, hair, cup: cupMat, liquid, metal, stool, boot, stage, eye },
    rest,
    sip,
  }
}
