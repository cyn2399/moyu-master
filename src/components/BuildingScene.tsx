import { useEffect, useRef, useState } from 'react'
import { Building2, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, RotateCcw } from 'lucide-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { companyFloors, displayFloors } from '@/lib/buildingFloors'
import type { BuildingConfig, SpotStatus } from '@/types'

interface BuildingSceneProps {
  occupants: Record<string,string>
  building: BuildingConfig
  selectedFloor: number
  selectedSpotId: string
  rotating: boolean
  resetKey: number
  statuses: Record<string, SpotStatus>
  onSelectSpot: (id: string) => void
}

interface SceneApi {
  zoom: (factor:number)=>void
  pan: (x:number,y:number)=>void
  setPanMode: (enabled:boolean)=>void
  setOccupants: (occupants: Record<string,string>) => void
  setFloor: (floor: number) => void
  setSelected: (id: string) => void
  setRotating: (rotating: boolean) => void
  setStatuses: (statuses: Record<string, SpotStatus>) => void
  reset: () => void
}

const statusColors: Record<SpotStatus, string> = { quiet: '#819889', busy: '#b5a17a', risk: '#aa8576' }

function textSprite(text: string, accent: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 80
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = accent ? '#aa8576' : '#46564d'
    context.beginPath()
    context.roundRect(4, 4, 248, 72, 16)
    context.fill()
    context.fillStyle = '#f7faf5'
    context.font = '700 30px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, 128, 42, 232)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  material.name = `楼层标识 · ${text}`
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1.25, 0.39, 1)
  return sprite
}

export function BuildingScene(props: BuildingSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<SceneApi | null>(null)
  const propsRef = useRef(props)
  propsRef.current = props
  const [panMode,setPanMode]=useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    setReady(false)
    setFailed('')
    const abort = new AbortController()
    let frame = 0
    let renderer: THREE.WebGLRenderer | null = null
    let resizeObserver: ResizeObserver | null = null
    let controls: OrbitControls | null = null
    const scene = new THREE.Scene()

    try {
      const { building } = propsRef.current
      const levels=displayFloors(building)
      const floorY=(floor:number)=>Math.max(0,levels.indexOf(floor))*.68
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      scene.background = new THREE.Color('#e7e7df')
      scene.fog = new THREE.Fog('#e7e7df', 24, 48)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.25 : 1.5))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.setAttribute('aria-label', `${building.name}三维墨鱼地图，可拖拽旋转和缩放`)
      renderer.domElement.setAttribute('role', 'img')
      renderer.domElement.style.touchAction = 'none'
      mount.appendChild(renderer.domElement)

      const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 1000)
      const targetY = Math.max(2.2, (levels.length - 1) * 0.34)
      const setCameraPose = () => {
        camera.position.set(12, targetY + 8.5, 15)
        camera.zoom = 1
        camera.lookAt(0, targetY, 0)
        camera.updateProjectionMatrix()
      }
      setCameraPose()
      controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, targetY, 0)
      controls.enableDamping = !reducedMotion
      controls.dampingFactor = 0.07
      controls.enablePan = true
      controls.screenSpacePanning = true
      controls.minZoom = 0.25
      controls.maxZoom = 24
      controls.maxPolarAngle = Math.PI * 0.48
      controls.autoRotate = propsRef.current.rotating && !reducedMotion
      controls.autoRotateSpeed = 0.65
      controls.update()

      const hemisphere = new THREE.HemisphereLight('#f7f2df', '#779188', 1.65)
      hemisphere.name = '庭院环境光'
      scene.add(hemisphere)
      const sun = new THREE.DirectionalLight('#fff1d6', 2.7)
      sun.name = '午后主光'
      sun.position.set(9, 16, 11)
      sun.castShadow = true
      sun.shadow.mapSize.set(1024, 1024)
      sun.shadow.camera.left = -13
      sun.shadow.camera.right = 13
      sun.shadow.camera.top = Math.max(14, levels.length)
      sun.shadow.camera.bottom = -10
      sun.shadow.camera.near = 1
      sun.shadow.camera.far = 45
      sun.shadow.normalBias = 0.035
      scene.add(sun)

      const material = (name: string, color: string, roughness = 0.8, metalness = 0) => {
        const value = new THREE.MeshStandardMaterial({ color, roughness, metalness })
        value.name = name
        return value
      }
      const concrete = material('建筑 · 浅色混凝土', '#d8ded8', 0.92)
      const darkConcrete = material('建筑 · 深绿结构', '#66776d', 0.86)
      const glass = new THREE.MeshStandardMaterial({ color: '#c4d0ca', roughness: 0.16, metalness: 0.05, transparent: true, opacity: 0.34, depthWrite: false })
      glass.name = '建筑 · 灰绿玻璃'
      const lawn = material('庭院 · 草坪', '#a1af9d', 1)
      const pavement = material('庭院 · 石材铺装', '#c2c9c2', 0.96)
      const road = material('庭院 · 沥青道路', '#61706b', 0.98)
      const trunk = material('绿化 · 树干', '#786a54', 1)
      const leaves = material('绿化 · 深绿树冠', '#7d9180', 0.95)
      const neighbor = material('周边建筑 · 灰绿体块', '#aebbb4', 0.9)
      const whiteLine = material('道路 · 标线', '#e4e4d8', 0.9)

      const box = (width: number, height: number, depth: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat)
        mesh.position.set(x, y, z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        parent.add(mesh)
        return mesh
      }

      box(20, 0.42, 15, pavement, 0, -0.43, 0)
      box(19.4, 0.08, 4.2, lawn, 0, -0.18, -3.9)
      box(20, 0.09, 2.35, road, 0, -0.16, 5.65)
      for (let index = -4; index <= 4; index += 1) box(1.05, 0.025, 0.08, whiteLine, index * 2.1, -0.1, 5.65)
      box(7.4, 0.24, 5.3, darkConcrete, 0, -0.04, 0)

      const treePositions = [[-7, -1.8], [-6.2, 2.2], [6.8, -1.4], [6.4, 2.4], [-4.8, -5.1], [4.7, -5.2]]
      treePositions.forEach(([x, z], index) => {
        const trunkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.85, 7), trunk)
        trunkMesh.position.set(x, 0.28, z)
        trunkMesh.castShadow = true
        scene.add(trunkMesh)
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 + (index % 2) * 0.1, 1), leaves)
        crown.position.set(x, 1.05, z)
        crown.scale.y = 1.2
        crown.castShadow = true
        scene.add(crown)
      })

      const neighborA = box(3.1, 5.6, 3.4, neighbor, -7.5, 2.55, -4.6)
      neighborA.castShadow = false
      const neighborB = box(3.5, 3.9, 3.1, neighbor, 7.1, 1.7, -4.8)
      neighborB.castShadow = false
      for (let level = 0; level < 5; level += 1) {
        const stripe = box(2.6, 0.18, 0.035, glass, -7.5, 0.65 + level * 0.92, -2.88)
        stripe.castShadow = false
      }

      const buildingGroup = new THREE.Group()
      buildingGroup.name = building.name
      scene.add(buildingGroup)
      const floorEntries: { group: THREE.Group; floor: number; materials: THREE.MeshStandardMaterial[]; label: THREE.Sprite }[] = []

      for (const floor of levels) {
        const group = new THREE.Group()
        group.position.y = floorY(floor)
        buildingGroup.add(group)
        const isCompany = companyFloors(building).includes(floor)
        const slab = material(`楼层 ${floor} · 楼板`, isCompany ? '#bca18c' : '#d8ded8', 0.9)
        const wall = material(`楼层 ${floor} · 墙体`, isCompany ? '#d9c5aa' : '#d3dbd5', 0.95)
        const label = textSprite(isCompany ? `${floor}F · 公司` : `${floor}F`, isCompany)
        floorEntries.push({ group, floor, materials: [slab, wall], label })
        label.position.set(-3.95, 0.42, 0.4)
        group.add(label)

        box(6.4, 0.15, 4.35, slab, 0, 0.075, 0, group)
        box(6.25, 0.5, 0.13, wall, 0, 0.39, -2.08, group)
        box(0.13, 0.5, 4.1, wall, -3.06, 0.39, 0, group)
        box(0.1, 0.4, 1.65, wall, 0.45, 0.34, -1.18, group)
        const window = box(5.45, 0.31, 0.035, glass, 0, 0.43, -2.0, group)
        window.castShadow = false
        box(0.12, 0.54, 0.12, darkConcrete, 2.95, 0.37, 1.93, group)
        if (floor === building.floors) {
          box(6.55, 0.14, 4.45, darkConcrete, 0, 0.7, 0, group)
          box(1.4, 0.65, 1.25, concrete, -1.5, 1.05, -0.8, group)
        }
      }

      const markers: { group: THREE.Group; orb: THREE.MeshStandardMaterial; ring: THREE.Mesh; floor: number; baseY: number; id: string }[] = []
      building.spots.forEach((spot, index) => {
        const floor = Math.min(Math.max(1, spot.floor), building.floors)
        const group = new THREE.Group()
        group.userData.spotId = spot.id
        const baseY = floorY(floor) + 0.48
        group.position.set(spot.x, baseY, spot.z)
        const orb = new THREE.MeshStandardMaterial({ color: statusColors[propsRef.current.statuses[spot.id] ?? spot.status], roughness: 0.36, emissive: statusColors[propsRef.current.statuses[spot.id] ?? spot.status], emissiveIntensity: 0.18 })
        orb.name = `墨鱼点 · ${spot.name}`
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), orb)
        sphere.userData.spotId = spot.id
        group.add(sphere)
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8), orb)
        stem.position.y = -0.22
        stem.userData.spotId = spot.id
        group.add(stem)
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 28), orb)
        ring.rotation.x = Math.PI / 2
        ring.position.y = -0.38
        ring.visible = spot.id === propsRef.current.selectedSpotId
        ring.userData.spotId = spot.id
        group.add(ring)
        group.scale.setScalar(1.08 + (index % 3) * 0.03)
        buildingGroup.add(group)
        markers.push({ group, orb, ring, floor, baseY, id: spot.id })
      })

      const labels = new Map<string,THREE.Sprite>()
      const setOccupants = (occupants:Record<string,string>) => {
        markers.forEach(marker=>{
          const text=occupants[marker.id] ?? ''
          const old=labels.get(marker.id)
          if(old?.userData.text===text)return
          if(old){marker.group.remove(old);old.material.map?.dispose();old.material.dispose();labels.delete(marker.id)}
          if(!text)return
          const label=textSprite(text,false);label.scale.set(1.8,.56,1);label.position.y=.5;label.userData={spotId:marker.id,text};marker.group.add(label);labels.set(marker.id,label)
        })
      }
      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      let pointerStart = { x: 0, y: 0 }
      const updatePointer = (event: PointerEvent) => {
        const bounds = renderer?.domElement.getBoundingClientRect()
        if (!bounds) return
        pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1)
      }
      renderer.domElement.addEventListener('pointerdown', (event) => { pointerStart = { x: event.clientX, y: event.clientY } }, { signal: abort.signal })
      renderer.domElement.addEventListener('pointerup', (event) => {
        if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 7 || !renderer) return
        updatePointer(event)
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(markers.filter((marker) => marker.group.visible).map((marker) => marker.group), true)
        const id = hits[0]?.object.userData.spotId as string | undefined
        if (id) propsRef.current.onSelectSpot(id)
      }, { signal: abort.signal })
      renderer.domElement.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch' || !renderer) return
        updatePointer(event)
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(markers.filter((marker) => marker.group.visible).map((marker) => marker.group), true)
        renderer.domElement.style.cursor = hits.length ? 'pointer' : 'grab'
      }, { signal: abort.signal })

      let activeFloor=0
      let resize=()=>{}
      const setFloor = (selectedFloor: number) => {
        activeFloor=selectedFloor
        floorEntries.forEach((entry) => {
          entry.group.visible=selectedFloor===0 || entry.floor===selectedFloor
          const dimmed = selectedFloor !== 0 && entry.floor !== selectedFloor
          entry.materials.forEach((mat) => {
            mat.transparent = dimmed
            mat.opacity = dimmed ? 0.2 : 1
            mat.depthWrite = !dimmed
            mat.needsUpdate = true
          })
          entry.label.material.opacity = dimmed ? 0.25 : 1
        })
        markers.forEach((marker) => { marker.group.visible = selectedFloor === 0 || marker.floor === selectedFloor })
        const y=selectedFloor ? floorY(selectedFloor)+.4 : targetY
        camera.position.set(12,y+8.5,15);camera.zoom=1
        controls?.target.set(0,y,0);controls?.update();resize()

      }
      const setSelected = (id: string) => { markers.forEach((marker) => { marker.ring.visible = marker.id === id }) }
      const setStatuses = (statuses: Record<string, SpotStatus>) => {
        markers.forEach((marker) => {
          const spot = building.spots.find((item) => item.id === marker.id)
          const status = statuses[marker.id] ?? spot?.status ?? 'quiet'
          marker.orb.color.set(statusColors[status])
          marker.orb.emissive.set(statusColors[status])
        })
      }
      const reset = () => {
        setCameraPose()
        setFloor(activeFloor)
      }
      const setRotating = (rotating: boolean) => { if (controls) controls.autoRotate = rotating && !reducedMotion }
      const zoom=(factor:number)=>{camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.25,24);camera.updateProjectionMatrix();controls?.update()}
      const pan=(x:number,y:number)=>{if(!controls)return;camera.updateMatrixWorld();const scale=(camera.top-camera.bottom)/camera.zoom*.15;const delta=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(x*scale).add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(y*scale));camera.position.add(delta);controls.target.add(delta);controls.update()}
      const setPanMode=(enabled:boolean)=>{if(controls)controls.mouseButtons.LEFT=enabled?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE}
      setPanMode(panMode)
      apiRef.current = { zoom, pan, setPanMode, setOccupants, setFloor, setSelected, setRotating, setStatuses, reset }
      setSelected(propsRef.current.selectedSpotId)
      setStatuses(propsRef.current.statuses)
      setOccupants(propsRef.current.occupants)

      resize = () => {
        if (!renderer || !mount.clientWidth || !mount.clientHeight) return
        const width = mount.clientWidth
        const height = mount.clientHeight
        const aspect = width / height
        let viewHeight = (activeFloor ? 9 : Math.max(8.5, levels.length * 0.72 + 3.8))
        if (viewHeight * aspect < 10.5) viewHeight = 10.5 / aspect
        camera.left = -viewHeight * aspect / 2
        camera.right = viewHeight * aspect / 2
        camera.top = viewHeight / 2
        camera.bottom = -viewHeight / 2
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
      }
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(mount)
      setFloor(propsRef.current.selectedFloor)
      resize()

      const clock = new THREE.Clock()
      let lastFrame = 0
      const animate = () => {
        frame = requestAnimationFrame(animate)
        if (document.hidden || !renderer) return
        const now = performance.now()
        if (now - lastFrame < 32) return
        lastFrame = now
        const time = clock.getElapsedTime()
        if (!reducedMotion) {
          markers.forEach((marker, index) => {
            marker.group.position.y = marker.baseY + Math.sin(time * 1.7 + index * 0.8) * 0.045
            if (marker.ring.visible) marker.ring.rotation.z = time * 0.7
          })
        }
        controls?.update()
        renderer.render(scene, camera)
      }
      animate()
      setReady(true)
    } catch (error) {
      setFailed(error instanceof Error ? error.message : '当前浏览器无法启动 3D 场景')
    }

    return () => {
      abort.abort()
      cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      controls?.dispose()
      apiRef.current = null
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      const textures = new Set<THREE.Texture>()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          if ('geometry' in object && object.geometry instanceof THREE.BufferGeometry) geometries.add(object.geometry)
          const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
          objectMaterials.forEach((mat) => {
            materials.add(mat)
            if ('map' in mat && mat.map instanceof THREE.Texture) textures.add(mat.map)
          })
        }
      })
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((mat) => mat.dispose())
      textures.forEach((texture) => texture.dispose())
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [props.building])

  useEffect(() => { apiRef.current?.setFloor(props.selectedFloor) }, [props.selectedFloor, props.building])
  useEffect(() => { apiRef.current?.setSelected(props.selectedSpotId) }, [props.selectedSpotId, props.building])
  useEffect(() => { apiRef.current?.setRotating(props.rotating) }, [props.rotating, props.building])
  useEffect(() => { apiRef.current?.setStatuses(props.statuses) }, [props.statuses, props.building])
  useEffect(() => { apiRef.current?.setOccupants(props.occupants) }, [props.occupants, props.building])
  useEffect(() => { apiRef.current?.reset() }, [props.resetKey])

  return (
    <div className="building-canvas-wrap" tabIndex={0} aria-label="三维沙盘：方向键平移，加减键缩放" onKeyDown={e=>{const moves:Record<string,[number,number]>={ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(moves[e.key]){e.preventDefault();apiRef.current?.pan(...moves[e.key])}else if(e.key==='+'||e.key==='='){e.preventDefault();apiRef.current?.zoom(1.25)}else if(e.key==='-'){e.preventDefault();apiRef.current?.zoom(.8)}}}>
      <div className="scene-navigation" aria-label="沙盘视角控制">
        <button type="button" aria-label="放大" title="放大" onClick={()=>apiRef.current?.zoom(1.25)}><Plus size={18}/></button>
        <button type="button" aria-label="缩小" title="缩小" onClick={()=>apiRef.current?.zoom(.8)}><Minus size={18}/></button>
        <button type="button" aria-label="向上移动视角" title="向上" onClick={()=>apiRef.current?.pan(0,1)}><ArrowUp size={18}/></button>
        <button type="button" aria-label="向下移动视角" title="向下" onClick={()=>apiRef.current?.pan(0,-1)}><ArrowDown size={18}/></button>
        <button type="button" aria-label="向左移动视角" title="向左" onClick={()=>apiRef.current?.pan(-1,0)}><ArrowLeft size={18}/></button>
        <button type="button" aria-label="向右移动视角" title="向右" onClick={()=>apiRef.current?.pan(1,0)}><ArrowRight size={18}/></button>
        <button type="button" aria-label="拖动平移模式" aria-pressed={panMode} title="切换拖动平移" onClick={()=>{setPanMode(!panMode);apiRef.current?.setPanMode(!panMode)}}><Move size={18}/></button>
        <button type="button" aria-label="居中当前视角" title="居中" onClick={()=>apiRef.current?.reset()}><RotateCcw size={18}/></button>
      </div>
      <div className={`building-scene-poster ${ready ? 'is-ready' : ''}`} aria-hidden="true"><Building2 size={58} strokeWidth={1.1} /><span>楼层沙盘加载中</span></div>
      <div className="building-canvas" ref={mountRef} />
      {!ready && !failed && <span className="scene-loading">正在搭建 {props.building.floors} 层写字楼…</span>}
      {failed && <div className="scene-fallback" role="alert"><Building2 size={40} /><strong>3D 场景暂时无法启动</strong><span>仍可使用下方地点列表查看所有楼层。</span><small>{failed}</small></div>}
    </div>
  )
}
