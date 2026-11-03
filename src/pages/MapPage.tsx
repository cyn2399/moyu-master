import { useEffect, useMemo, useState } from 'react'
import { Building2, Coffee, Eye, Footprints, Layers3, MapPin, MousePointer2, Pause, Play, RotateCcw, Settings2, ShieldAlert, Shuffle, Trees } from 'lucide-react'
import { companyFloors, displayFloors } from '@/lib/buildingFloors'
import { BuildingEditor } from '@/components/BuildingEditor'
import { BuildingScene } from '@/components/BuildingScene'
import { linkAllPlaces, matchProfilePlaces } from '@/lib/profilePlaces'
import { IdentityAvatar } from '@/components/IdentityAvatar'
import type { BuildingConfig, SpotStatus, Profile } from '@/types'

interface MapPageProps {
  profiles: Profile[]
  building: BuildingConfig
  onSave: (building: BuildingConfig) => Promise<void>
}

const statusMeta: Record<SpotStatus, { label: string; note: string }> = {
  quiet: { label: '相对清静', note: '模拟空闲，适合短暂停留' },
  busy: { label: '同事较多', note: '模拟热闹，注意错开高峰' },
  risk: { label: '注意领导', note: '模拟巡查，建议换个地点' },
}

export function MapPage({ building: sourceBuilding, profiles, onSave }: MapPageProps) {
  const buildingKey=JSON.stringify(sourceBuilding)
  const profilesKey=JSON.stringify(profiles)
  const building=useMemo(()=>linkAllPlaces(JSON.parse(buildingKey),JSON.parse(profilesKey)),[buildingKey,profilesKey])
  const [selectedFloor, setSelectedFloor] = useState(0)
  const [selectedSpotId, setSelectedSpotId] = useState(building.spots.find((spot) => spot.floor === building.companyFloor)?.id ?? building.spots[0]?.id ?? '')
  const [rotating, setRotating] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [editorOpen, setEditorOpen] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, SpotStatus>>(() => Object.fromEntries(building.spots.map((spot) => [spot.id, spot.status])))

  useEffect(() => {
    setStatuses(Object.fromEntries(building.spots.map((spot) => [spot.id, spot.status])))
    setSelectedSpotId((current) => building.spots.some((spot) => spot.id === current) ? current : building.spots[0]?.id ?? '')
    setSelectedFloor(0)
  }, [building])

  const {occupants,unmatched} = useMemo(()=>matchProfilePlaces(profiles,building.spots),[profiles,building.spots])
  const spotLabels = useMemo(()=>Object.fromEntries(building.spots.map(spot=>{const people=occupants[spot.id]??[];return [spot.id,`${spot.name.slice(0,8)}${people.length ? ` · ${people.length}人` : ''}`]})),[building.spots,occupants])
  const selectedSpot = building.spots.find((spot) => spot.id === selectedSpotId) ?? building.spots[0]
  const filteredSpots = useMemo(() => selectedFloor === 0 ? building.spots : building.spots.filter((spot) => spot.floor === selectedFloor), [building.spots, selectedFloor])
  const floorDistance = selectedSpot ? selectedSpot.floor - companyFloors(building).reduce((a,b)=>Math.abs(a-selectedSpot.floor)<=Math.abs(b-selectedSpot.floor)?a:b) : 0

  const selectSpot = (id: string) => {
    const spot = building.spots.find((item) => item.id === id)
    if (!spot) return
    setSelectedSpotId(id)
    setSelectedFloor(spot.floor)
  }

  const shuffleStatuses = () => {
    const options: SpotStatus[] = ['quiet', 'quiet', 'busy', 'risk']
    setStatuses(Object.fromEntries(building.spots.map((spot) => [spot.id, options[Math.floor(Math.random() * options.length)]])))
  }

  return (
    <div className="map-page">
      <section className="building-overview">
        <div className="building-overview-title"><span><Building2 size={26} /></span><div><p>当前建筑沙盘</p><h2>{building.name}</h2></div><i>模拟状态</i></div>
        <div className="building-overview-stats"><span><Layers3 size={16} /><strong>{building.floors}</strong> 层建筑</span><span><MapPin size={16} /><strong>{building.spots.length}</strong> 个墨鱼点</span><span><Building2 size={16} />公司在 <strong>{companyFloors(building).join('、')}F</strong></span></div>
        <button className="button button-secondary" type="button" onClick={() => setEditorOpen(true)}><Settings2 size={17} />配置建筑</button>
      </section>

      <div className="map-layout">
        <section className="map-visual-panel" aria-label="写字楼三维沙盘">
          <div className="scene-topline"><span><MousePointer2 size={15} />拖拽旋转 · 右键拖拽平移 · 滚轮缩放 · 双指缩放平移</span><button type="button" onClick={shuffleStatuses}><Shuffle size={14} />重新模拟状态</button></div>
          <BuildingScene occupants={spotLabels} building={building} selectedFloor={selectedFloor} selectedSpotId={selectedSpot?.id ?? ''} rotating={rotating} resetKey={resetKey} statuses={statuses} onSelectSpot={selectSpot} />
          <div className="scene-toolbar">
            <div className="scene-view-buttons"><button className="button button-secondary" type="button" onClick={()=>{setSelectedFloor(0);setResetKey(v=>v+1)}}>整栋楼视角</button><button className="button button-secondary" type="button" onClick={() => setRotating((value) => !value)}>{rotating ? <Pause size={16} /> : <Play size={16} />}{rotating ? '暂停旋转' : '开启旋转'}</button><button className="button button-secondary" type="button" onClick={() => setResetKey((value) => value + 1)}><RotateCcw size={16} />重置视角</button></div>
            <label className="floor-select" htmlFor="floor-filter"><Layers3 size={16} /><span>单层放大</span><select id="floor-filter" value={selectedFloor} onChange={(event) => setSelectedFloor(Number(event.target.value))}><option value={0}>全部楼层</option>{displayFloors(building).reverse().map((floor) => <option key={floor} value={floor}>{floor}F{companyFloors(building).includes(floor) ? ' · 公司' : ''}</option>)}</select></label>
          </div>
          <div className="scene-legend"><span><i className="quiet" />相对清静</span><span><i className="busy" />同事较多</span><span><i className="risk" />注意领导</span><small>颜色为模拟状态，并非实时监控</small></div>
        </section>

        {selectedSpot && <aside className="spot-detail-panel" aria-live="polite">
          <div className="spot-detail-heading"><span className={`spot-status-dot ${statuses[selectedSpot.id] ?? selectedSpot.status}`} /><p>{statusMeta[statuses[selectedSpot.id] ?? selectedSpot.status].label}</p><strong>{selectedSpot.floor}<small>F</small></strong></div>
          <p className="section-kicker">当前选中的墨鱼点</p>
          <h2>{selectedSpot.name}</h2>
          <p className="spot-zone"><MapPin size={15} />{building.name} · {selectedSpot.zone}</p>
          <p className="spot-description">{selectedSpot.description}</p>
          <div className="spot-tip"><Coffee size={19} /><div><strong>大师私房提示</strong><p>{selectedSpot.tip}</p></div></div>
          <section className="spot-people"><h3>常来这里 · {occupants[selectedSpot.id]?.length ?? 0} 人</h3><p>依据用户参赛记录匹配，非实时位置</p>{occupants[selectedSpot.id]?.map(person=><article key={person.id}><IdentityAvatar name={person.nickname} color={person.color} size="sm" /><div><strong>{person.nickname}</strong><p>{person.motto}</p><small>常去：{person.locations.join('、')} · 最爱：{person.bestSpot}</small></div></article>)}{!occupants[selectedSpot.id]?.length && <p>还没有当天参赛记录关联这里。</p>}</section>
          <div className="spot-route"><Footprints size={18} /><span>从公司 {companyFloors(building).join('、')}F 出发</span><strong>{floorDistance === 0 ? '就在本层' : `${floorDistance > 0 ? '向上' : '向下'} ${Math.abs(floorDistance)} 层`}</strong></div>
          <p className="spot-simulation-note"><Eye size={14} />{statusMeta[statuses[selectedSpot.id] ?? selectedSpot.status].note}</p>
        </aside>}
      </div>

      <section className="spot-directory" aria-labelledby="spot-directory-title">
        <div className="section-heading"><div><p className="section-kicker">文字版地点导航</p><h2 id="spot-directory-title">{selectedFloor === 0 ? '整栋楼的墨鱼藏点' : `${selectedFloor}F 的墨鱼藏点`}</h2></div><span>{filteredSpots.length} 个地点</span></div>
        <div className="spot-directory-grid">
          {filteredSpots.map((spot) => {
            const status = statuses[spot.id] ?? spot.status
            return <button key={spot.id} className={selectedSpot.id === spot.id ? 'spot-directory-item selected' : 'spot-directory-item'} type="button" onClick={() => selectSpot(spot.id)}>
              <span className={`directory-icon ${status}`}><MapPin size={19} /></span><span><strong>{spot.name}</strong><small>{spot.zone} · {occupants[spot.id]?.length ?? 0} 人常来</small></span><span className="directory-floor">{spot.floor}F</span><i className={`spot-status-dot ${status}`} />
            </button>
          })}
        </div>
        {!filteredSpots.length && <div className="empty-floor"><Layers3 size={28} /><p>这一层还没有配置墨鱼点，可以在“配置建筑”里调整地点楼层。</p><button className="button button-primary" type="button" onClick={() => setEditorOpen(true)}>配置这一层</button></div>}
      </section>

      {unmatched.length>0 && <section className="spot-unmatched"><h3>待关联地点 · {unmatched.length}</h3><p>这些画像地点尚未匹配沙盘，可在“配置建筑”中添加同名地点并设置楼层和坐标。</p><div>{unmatched.map(({profile,place},i)=><span key={profile.id+'-'+i}>{profile.nickname} · {place}</span>)}</div></section>}
      <div className="map-safety-note"><ShieldAlert size={18} /><p>地图仅用于轻松娱乐。消防通道、楼梯等区域请始终保持畅通，不影响正常办公与公共安全。</p><Trees size={21} /></div>
      <BuildingEditor building={building} open={editorOpen} onOpenChange={setEditorOpen} onSave={onSave} />
    </div>
  )
}
