import { useEffect, useRef, useState } from 'react'
import { Building2, Save, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { companyFloors } from '@/lib/buildingFloors'
import type { BuildingConfig } from '@/types'

interface BuildingEditorProps {
  building: BuildingConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (building: BuildingConfig) => Promise<void>
}

export function BuildingEditor({ building, open, onOpenChange, onSave }: BuildingEditorProps) {
  const [draft, setDraft] = useState<BuildingConfig>(building)
  const [floorInput, setFloorInput] = useState(String(building.floors))
  const wasOpen=useRef(false)
  const [addFloor, setAddFloor] = useState('')
  const [busy,setBusy]=useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && !wasOpen.current) {
      setDraft({ ...building, spots: building.spots.map((spot) => ({ ...spot })) })
      setError('')
      setFloorInput(String(building.floors))
      setAddFloor('')
    }
    wasOpen.current=open
  }, [open, building])

  const updateFloors = (value: number) => {
    const floors = Math.max(1, Math.round(value || 1))
    setDraft((previous) => ({
      ...previous,
      floors,
      companyFloor: Math.min(previous.companyFloor, floors),
      companyFloors: [...new Set(companyFloors(previous).map(f=>Math.min(f,floors)))],
      spots: previous.spots.map((spot) => ({ ...spot, floor: Math.min(spot.floor, floors) })),
    }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (draft.name.trim().length < 2) return setError('建筑名称至少需要 2 个字。')
    if (new Set(draft.spots.map(s=>s.name.trim().toLowerCase())).size!==draft.spots.length) return setError('藏点名称不能重复。')
    if (draft.spots.some((spot) => !spot.name.trim())) return setError('墨鱼地点名称不能留空。')
    if (!Number.isSafeInteger(draft.floors) || draft.floors<1) return setError('总层数须为有效正整数')
    setBusy(true)
    try { await onSave({ ...draft, companyFloor:companyFloors(draft)[0], companyFloors:companyFloors(draft), name: draft.name.trim(), excludedPlaces:(draft.excludedPlaces??[]).filter(name=>!draft.spots.some(s=>s.name.trim()===name.trim())), spots: draft.spots.map((spot) => ({ ...spot, name: spot.name.trim(), floor: Math.min(draft.floors, Math.max(1, Math.round(spot.floor))) })) })
    onOpenChange(false)
    } catch(e) {setError((e as Error).message)} finally {setBusy(false)}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="building-editor-dialog">
        <DialogHeader><DialogTitle>配置我的写字楼</DialogTitle><DialogDescription>修改后 3D 沙盘会立即重建。层数不设固定上限，公司楼层可多选。高楼沙盘采用楼层抽样显示，保留公司及地点所在层。</DialogDescription></DialogHeader>
        <form className="building-editor-form" onSubmit={submit}>
          <div className="building-basic-fields">
            <div className="building-name-field"><label className="field-label" htmlFor="building-name">建筑名称</label><input id="building-name" className="text-input" value={draft.name} maxLength={24} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
            <div><label className="field-label" htmlFor="building-floors">总层数</label><input id="building-floors" className="text-input" type="number" min={1} step={1} value={floorInput} onChange={e=>setFloorInput(e.target.value)} onBlur={()=>{const value=Number(floorInput);if(Number.isSafeInteger(value)&&value>=1){updateFloors(value);setFloorInput(String(value))}else{setFloorInput(String(draft.floors));setError('总层数须为有效正整数')}}} /></div>
            <div className="company-floors-field"><label className="field-label" htmlFor="company-floor">公司所在楼层（可多选）</label><div className="company-floor-add"><input id="company-floor" className="text-input" type="number" min={1} max={draft.floors} step={1} value={addFloor} onChange={e=>setAddFloor(e.target.value)} placeholder="输入楼层"/><button type="button" className="button button-secondary" onClick={()=>{const f=Number(addFloor);if(!Number.isSafeInteger(f)||f<1||f>draft.floors){setError('请输入总层数以内的正整数楼层');return}setDraft({...draft,companyFloors:[...new Set([...companyFloors(draft),f])].sort((a,b)=>a-b)});setAddFloor('');setError('')}}>添加楼层</button></div><div className="company-floor-tags">{companyFloors(draft).map(f=><button type="button" className="button button-secondary" key={f} aria-label={`移除公司${f}楼`} onClick={()=>{const fs=companyFloors(draft).filter(x=>x!==f);if(fs.length)setDraft({...draft,companyFloor:fs[0],companyFloors:fs})}}>{f}F ×</button>)}</div></div>
          </div>
          <fieldset className="editor-fieldset"><legend><Building2 size={16} />墨鱼地点分布</legend><div className="spot-floor-editor">
            {draft.spots.map((spot, index) => <div className="spot-floor-row" key={spot.id}>
              <input className="text-input" aria-label={`地点 ${index + 1} 名称`} value={spot.name} maxLength={16} onChange={(event) => setDraft((previous) => ({ ...previous, spots: previous.spots.map((item) => item.id === spot.id ? { ...item, name: event.target.value } : item) }))} />
              <span>{spot.zone}</span>
              <button type="button" className="spot-delete" aria-label={`删除${spot.name||'藏点'}`} onClick={()=>setDraft(previous=>({...previous,spots:previous.spots.filter(s=>s.id!==spot.id),excludedPlaces:[...new Set([...(previous.excludedPlaces??[]),...(spot.name.trim()?[spot.name.trim()]:[])])]}))}><Trash2 size={16}/><span>删除</span></button>
              <label><span className="sr-only">{spot.name}所在楼层</span><input className="text-input" type="number" min={1} max={draft.floors} value={spot.floor} onChange={(event) => setDraft((previous) => ({ ...previous, spots: previous.spots.map((item) => item.id === spot.id ? { ...item, floor: Number(event.target.value) } : item) }))} /><small>层</small></label>
            </div>)}
          </div><button className="button button-secondary spot-add" type="button" onClick={()=>{const index=draft.spots.length;setDraft(previous=>({...previous,spots:[...previous.spots,{id:'spot-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:'',floor:companyFloors(previous)[0],zone:'自定义藏点',description:'手动添加的墨鱼藏点。',tip:'适度休息，保持公共空间畅通。',status:'quiet',x:-2.4+(index%6)*.85,z:-1.4+(Math.floor(index/6)%5)*.65}]}))}}><Plus size={17}/>新增藏点</button>{!draft.spots.length&&<p>暂无藏点，点击“新增藏点”添加。</p>}</fieldset>
          <p className="form-feedback" aria-live="polite">{error}</p>
          <div className="editor-actions"><button className="button button-secondary" type="button" onClick={() => onOpenChange(false)}>取消</button><button className="button button-primary" type="submit" disabled={busy}><Save size={17} />保存并重建沙盘</button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
