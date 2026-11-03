import { useEffect, useState } from 'react'
import { Check, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Profile, ProfileDraft } from '@/types'

const timeOptions = ['09:00—09:30', '09:30—10:00', '10:00—10:30', '10:30—11:00', '11:00—11:30', '14:00—14:30', '14:30—15:00', '15:00—15:30', '15:30—16:00', '16:00—16:30', '16:30—17:00']
const locationOptions = ['茶水间', '天台', '消防通道', '打印区', '咖啡机旁', '便利店', '绿植角', '休息区', '空会议室', '楼梯转角']
const colors = ['#aa8576', '#8799a5', '#b6a17b', '#84988a', '#a094a8', '#ae9095']

interface ProfileEditorProps {
  user: Profile
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (draft: ProfileDraft) => void
}

export function ProfileEditor({ user, open, onOpenChange, onSave }: ProfileEditorProps) {
  const [draft, setDraft] = useState<ProfileDraft>({ ...user })
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setDraft({ nickname: user.nickname, timeSlots: user.timeSlots, locations: user.locations, bestSpot: user.bestSpot, avoidanceTip: user.avoidanceTip, motto: user.motto, color: user.color })
      setError('')
    }
  }, [open, user])

  const toggle = (key: 'timeSlots' | 'locations', value: string) => {
    setDraft((previous) => ({
      ...previous,
      [key]: previous[key].includes(value) ? previous[key].filter((item) => item !== value) : [...previous[key], value],
    }))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (draft.nickname.trim().length < 2) return setError('昵称至少需要 2 个字。')
    if (!draft.timeSlots.length || !draft.locations.length) return setError('请至少选择一个墨鱼时段和一个出没地点。')
    if (!draft.bestSpot.trim() || !draft.avoidanceTip.trim()) return setError('最佳地点和躲避技巧还不能留空。')
    onSave({ ...draft, nickname: draft.nickname.trim(), bestSpot: draft.bestSpot.trim(), avoidanceTip: draft.avoidanceTip.trim(), motto: draft.motto.trim() || '今天也要优雅地墨鱼。' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="profile-editor-dialog">
        <DialogHeader>
          <DialogTitle>修改墨鱼画像</DialogTitle>
          <DialogDescription>隐藏代号保持不变，其他信息随时可以更新。</DialogDescription>
        </DialogHeader>
        <form className="profile-editor-form" onSubmit={submit}>
          <div className="editor-two-columns">
            <div><label className="field-label" htmlFor="edit-nickname">昵称</label><input id="edit-nickname" className="text-input" value={draft.nickname} maxLength={16} onChange={(event) => setDraft({ ...draft, nickname: event.target.value })} /></div>
            <div><label className="field-label" htmlFor="edit-motto">墨鱼宣言</label><input id="edit-motto" className="text-input" value={draft.motto} maxLength={36} onChange={(event) => setDraft({ ...draft, motto: event.target.value })} /></div>
          </div>
          <fieldset className="editor-fieldset"><legend>墨鱼时段 <small>可多选</small></legend><div className="choice-chips">{timeOptions.map((time) => <label key={time} className={draft.timeSlots.includes(time) ? 'choice-chip selected' : 'choice-chip'}><input type="checkbox" checked={draft.timeSlots.includes(time)} onChange={() => toggle('timeSlots', time)} /><span>{time}</span>{draft.timeSlots.includes(time) && <Check size={14} />}</label>)}</div></fieldset>
          <fieldset className="editor-fieldset"><legend>经常出没 <small>可多选</small></legend><div className="choice-chips">{locationOptions.map((location) => <label key={location} className={draft.locations.includes(location) ? 'choice-chip selected' : 'choice-chip'}><input type="checkbox" checked={draft.locations.includes(location)} onChange={() => toggle('locations', location)} /><span>{location}</span>{draft.locations.includes(location) && <Check size={14} />}</label>)}</div></fieldset>
          <div><label className="field-label" htmlFor="best-spot">心中最佳墨鱼地点</label><textarea id="best-spot" className="text-area" rows={2} maxLength={100} value={draft.bestSpot} onChange={(event) => setDraft({ ...draft, bestSpot: event.target.value })} /></div>
          <div><label className="field-label" htmlFor="avoidance-tip">躲避领导小技巧</label><textarea id="avoidance-tip" className="text-area" rows={2} maxLength={100} value={draft.avoidanceTip} onChange={(event) => setDraft({ ...draft, avoidanceTip: event.target.value })} /></div>
          <fieldset className="editor-fieldset"><legend>匿名头像颜色</legend><div className="color-choices">{colors.map((color) => <label key={color} className={draft.color === color ? 'color-choice selected' : 'color-choice'} style={{ '--choice-color': color } as React.CSSProperties}><input type="radio" name="avatar-color" checked={draft.color === color} onChange={() => setDraft({ ...draft, color })} /><span>{draft.color === color && <Check size={17} />}</span></label>)}</div></fieldset>
          <div className="editor-error" aria-live="polite">{error}</div>
          <div className="editor-actions"><button className="button button-secondary" type="button" onClick={() => onOpenChange(false)}>取消</button><button className="button button-primary" type="submit"><Save size={17} />保存画像</button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
