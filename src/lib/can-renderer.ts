import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import type { CanSettings } from "./settings"
import { canvasBlob, rasterizeSvg } from "./images"
import {
  LABEL_WIDTH,
  LABEL_HEIGHT,
  LABEL_RADIUS,
  PULL_TAB,
  pullTabLayout,
} from "./label"

function roundedShape(width: number, height: number, radius: number) {
  const x = -width / 2
  const y = -height / 2
  const shape = new THREE.Shape()
  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false)
  shape.lineTo(x + width, y + height - radius)
  shape.absarc(
    x + width - radius,
    y + height - radius,
    radius,
    0,
    Math.PI / 2,
    false,
  )
  shape.lineTo(x + radius, y + height)
  shape.absarc(
    x + radius,
    y + height - radius,
    radius,
    Math.PI / 2,
    Math.PI,
    false,
  )
  shape.lineTo(x, y + radius)
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false)
  return shape
}

function lidGeometry(width: number, height: number, radius: number) {
  const geometry = new THREE.ShapeGeometry(
    roundedShape(width, height, radius),
    48,
  )
  const position = geometry.getAttribute("position")
  const uv = geometry.getAttribute("uv")
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, position.getX(i) / width + 0.5, position.getY(i) / height + 0.5)
  return geometry
}

function rim(
  width: number,
  height: number,
  radius: number,
  thickness: number,
  z: number,
  material: THREE.Material,
) {
  const points = roundedShape(width, height, radius)
    .getPoints(48)
    .slice(0, -1)
    .map((p) => new THREE.Vector3(p.x, p.y, z))
  return new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points, true),
      256,
      thickness,
      10,
      true,
    ),
    material,
  )
}

export class CanRenderer {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  private can = new THREE.Group()
  private tab = new THREE.Group()
  private metal = new THREE.MeshStandardMaterial({
    color: "#d7ba75",
    metalness: 1,
    roughness: 0.3,
  })
  private tabMetal = new THREE.MeshStandardMaterial({
    color: "#cbd0d4",
    metalness: 1,
    roughness: 0.26,
  })
  private label = new THREE.MeshPhysicalMaterial({
    metalness: 0,
    roughness: 0.7,
    envMapIntensity: 0.1,
    specularIntensity: 0.15,
  })
  private controls: OrbitControls
  private observer: ResizeObserver
  private environment: THREE.WebGLRenderTarget
  private disposed = false
  private exporting = false
  private settings: CanSettings
  private labelVersion = 0
  private pendingLabel: Promise<void> = Promise.resolve()
  private width = 1
  private height = 1

  constructor(canvas: HTMLCanvasElement, settings: CanSettings) {
    this.settings = settings
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.9
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    this.environment = pmrem.fromScene(room, 0.04)
    this.scene.environment = this.environment.texture
    this.scene.environmentIntensity = 0.7
    room.dispose()
    pmrem.dispose()
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x847967, 0.4))
    const light = new THREE.DirectionalLight(0xffffff, 1.2)
    light.position.set(-3, 5, 7)
    light.castShadow = true
    light.shadow.mapSize.set(2048, 2048)
    light.shadow.camera.left = -3
    light.shadow.camera.right = 3
    light.shadow.camera.top = 3
    light.shadow.camera.bottom = -3
    light.shadow.normalBias = 0.004
    light.shadow.bias = -0.0001
    this.scene.add(light)
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedShape(3.78, 2.58, 0.5), {
        depth: 0.59,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.045,
        bevelThickness: 0.045,
        curveSegments: 40,
      }),
      this.metal,
    )
    body.position.z = -0.65
    this.can.add(body)
    for (const z of [-0.57, -0.48, -0.2])
      this.can.add(rim(3.79, 2.59, 0.5, 0.018, z, this.metal))
    this.can.add(rim(3.84, 2.64, 0.53, 0.062, -0.04, this.metal))
    this.can.add(rim(3.83, 2.63, 0.52, 0.045, -0.66, this.metal))
    this.can.add(rim(3.64, 2.43, 0.43, 0.019, 0.004, this.metal))
    const face = new THREE.Mesh(
      lidGeometry(
        3.6,
        (3.6 * LABEL_HEIGHT) / LABEL_WIDTH,
        (3.6 * LABEL_RADIUS) / LABEL_WIDTH,
      ),
      this.label,
    )
    face.position.z = 0.014
    face.receiveShadow = true
    this.can.add(face)
    const back = new THREE.Mesh(lidGeometry(3.58, 2.34, 0.42), this.metal)
    back.rotation.y = Math.PI
    back.position.z = -0.699
    this.can.add(back)
    this.can.add(rim(3.26, 2.01, 0.44, 0.014, -0.706, this.metal))
    const { width: tw, height: th } = PULL_TAB
    const tabShape = new THREE.Shape()
    tabShape.moveTo(-tw * 0.38, -th * 0.32)
    tabShape.bezierCurveTo(
      -tw * 0.5,
      -th * 0.3,
      -tw * 0.5,
      th * 0.3,
      -tw * 0.38,
      th * 0.32,
    )
    tabShape.lineTo(tw * 0.02, th * 0.46)
    tabShape.bezierCurveTo(
      tw * 0.62,
      th * 0.58,
      tw * 0.62,
      -th * 0.58,
      tw * 0.02,
      -th * 0.46,
    )
    tabShape.closePath()
    const hole = new THREE.Path()
    hole.absellipse(
      tw * 0.12,
      0,
      tw * 0.31,
      th * 0.36,
      0,
      Math.PI * 2,
      false,
      0,
    )
    tabShape.holes.push(hole)
    this.tab.add(
      new THREE.Mesh(
        new THREE.ExtrudeGeometry(tabShape, {
          depth: 3,
          bevelEnabled: true,
          bevelSegments: 3,
          bevelSize: 4,
          bevelThickness: 3,
          curveSegments: 40,
          steps: 1,
        }),
        this.tabMetal,
      ),
    )
    for (const edge of [tabShape, hole]) {
      const points = edge
        .getPoints(64)
        .slice(0, -1)
        .map((point) => new THREE.Vector3(point.x, point.y, 4))
      this.tab.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points, true),
            128,
            4,
            8,
            true,
          ),
          this.tabMetal,
        ),
      )
    }
    const rivet = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 16),
      this.tabMetal,
    )
    rivet.scale.z = 0.3
    rivet.position.set(-tw * 0.32, 0, 4)
    this.tab.add(rivet)
    const groove = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-tw * 0.23, -th * 0.23, 4),
      new THREE.Vector3(-tw * 0.53, 0, 4),
      new THREE.Vector3(-tw * 0.23, th * 0.23, 4),
    )
    this.tab.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(groove, 32, 1.2, 8, false),
        this.tabMetal,
      ),
    )
    this.tab.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = true
    })
    this.can.add(this.tab)
    this.scene.add(this.can)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enablePan = false
    this.controls.enableDamping = false
    this.controls.minDistance = 5
    this.controls.maxDistance = 13
    this.controls.addEventListener("change", this.draw)
    this.setView("perspective")
    this.observer = new ResizeObserver(([entry]) => {
      this.width = Math.max(1, entry.contentRect.width)
      this.height = Math.max(1, entry.contentRect.height)
      if (!this.exporting) this.resize()
    })
    this.observer.observe(canvas)
    this.update(settings)
  }

  private resize() {
    this.renderer.setSize(this.width, this.height, false)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.draw()
  }

  private draw = () => {
    if (!this.disposed && !this.exporting)
      this.renderer.render(this.scene, this.camera)
  }

  update(settings: CanSettings) {
    this.settings = settings
    this.metal.color.set(settings.metal === "gold" ? "#d7ba75" : "#d9dfe2")
    this.tabMetal.color.copy(this.metal.color)
    this.metal.roughness = settings.roughness
    this.label.roughness = Math.min(
      1,
      settings.roughness + 0.14 + settings.wear * 0.3,
    )
    const tab = pullTabLayout(settings)
    const labelScale = 3.6 / LABEL_WIDTH
    this.tab.scale.setScalar(labelScale * settings.pullTabSize)
    this.tab.position.set(
      (tab.x - LABEL_WIDTH / 2) * labelScale,
      (LABEL_HEIGHT / 2 - tab.y) * labelScale,
      0.031 * settings.pullTabSize,
    )
    this.tab.rotation.set(0, -0.03, (-tab.rotation * Math.PI) / 180, "ZYX")
    this.tab.visible = settings.pullTab
    this.scene.background =
      settings.background === "transparent"
        ? null
        : new THREE.Color(
            settings.background === "paper" ? "#ece8de" : "#222a2b",
          )
    this.draw()
  }

  setLabelSvg(svg: string) {
    const version = ++this.labelVersion
    this.pendingLabel = rasterizeSvg(svg).then((canvas) => {
      if (version === this.labelVersion) this.setLabel(canvas)
    })
    return this.pendingLabel
  }

  private setLabel(canvas: HTMLCanvasElement) {
    if (this.disposed) return
    this.label.map?.dispose()
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(
      8,
      this.renderer.capabilities.getMaxAnisotropy(),
    )
    this.label.map = texture
    this.label.needsUpdate = true
    this.draw()
  }

  setLocked(locked: boolean) {
    this.controls.enableRotate = !locked
  }

  setView(view: "perspective" | "top" | "back") {
    if (view === "top") this.camera.position.set(0, 0, 8.9)
    else if (view === "back") this.camera.position.set(0, 0, -8.9)
    else this.camera.position.set(3.5, -4.3, 7.8)
    this.camera.up.set(0, 1, 0)
    this.controls.target.set(0, 0, -0.25)
    this.controls.update()
    this.draw()
  }

  rotate(horizontal: number, vertical: number) {
    const offset = this.camera.position.clone().sub(this.controls.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)
    spherical.theta += horizontal
    spherical.phi = THREE.MathUtils.clamp(
      spherical.phi + vertical,
      0.05,
      Math.PI - 0.05,
    )
    this.camera.position
      .copy(this.controls.target)
      .add(new THREE.Vector3().setFromSpherical(spherical))
    this.controls.update()
  }

  async exportPNG() {
    if (this.exporting) throw new Error("An export is already running.")
    await this.pendingLabel
    if (this.disposed) throw new Error("The preview is no longer available.")
    this.exporting = true
    const ratio = this.renderer.getPixelRatio()
    this.controls.enabled = false
    try {
      this.renderer.setPixelRatio(1)
      this.renderer.setSize(
        this.settings.exportSize,
        this.settings.exportSize,
        false,
      )
      this.camera.aspect = 1
      this.camera.updateProjectionMatrix()
      this.renderer.render(this.scene, this.camera)
      return await canvasBlob(this.renderer.domElement)
    } finally {
      this.exporting = false
      this.controls.enabled = true
      this.renderer.setPixelRatio(ratio)
      this.resize()
    }
  }

  dispose() {
    this.disposed = true
    this.observer.disconnect()
    this.controls.dispose()
    this.can.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose()
    })
    this.label.map?.dispose()
    this.label.dispose()
    this.metal.dispose()
    this.tabMetal.dispose()
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose()
    })
    this.environment.dispose()
    this.renderer.dispose()
  }
}
