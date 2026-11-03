import { useEffect, useState } from 'react'
import { ArrowRight, Clock3, Shuffle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { periodMeta, toDateKey } from '@/lib/data'
import { DateSelect } from '@/components/DateSelect'
import { halfHours, randomContestTitle } from '@/lib/formOptions'
import type { Period } from '@/types'

interface CreateContestDialogProps {
  usedTitles: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (date: string, period: Period, title: string, cutoff: string) => Promise<void>
}

export function CreateContestDialog({ usedTitles, open, onOpenChange, onSave }: CreateContestDialogProps) {
  const [date, setDate] = useState(toDateKey(new Date()))
  const [morningEnd, setMorningEnd] = useState('12:00')
  const [afternoonEnd, setAfternoonEnd] = useState('18:00')
  const [period, setPeriod] = useState<Period>('afternoon')
  const [title, setTitle] = useState('午后失踪人口普查')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      const now = new Date()
      const nextPeriod: Period = now.getHours() < 12 ? 'morning' : 'afternoon'
      setDate(toDateKey(now))
      setPeriod(nextPeriod)
      setTitle(randomContestTitle(usedTitles))
      setError('')
    }
  }, [open])

  const choosePeriod = (value: Period) => {
    setPeriod(value)

  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (date < toDateKey(new Date())) return setError('请选择今天或以后的日期。')
    if (!date) return setError('请选择一个评比日期。')
    if (title.trim().length < 4) return setError('评比名称至少需要 4 个字。')
    setBusy(true)
    try { await onSave(date, period, title.trim(), period==='morning'?morningEnd:afternoonEnd); onOpenChange(false) }
    catch(e) {setError((e as Error).message)}
    finally {setBusy(false)}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="create-dialog">
        <DialogHeader><DialogTitle>发起一场墨鱼评比</DialogTitle><DialogDescription>每次发起独立评比。上午场 09:00 开始，下午场 14:00 开始，可自定义所选场次的截止时间（北京时间），报名与投票同时结束。评比名称全站唯一，创建后其他用户不能修改。</DialogDescription></DialogHeader>
        <form className="create-form" onSubmit={submit}>
          <div><span className="field-label">评比日期</span><DateSelect value={date} onChange={setDate}/></div>
          <fieldset className="editor-fieldset"><legend>选择场次</legend><div className="period-options">{(['morning', 'afternoon'] as Period[]).map((item) => <label key={item} className={period === item ? 'period-option selected' : 'period-option'}><input type="radio" name="period" checked={period === item} onChange={() => choosePeriod(item)} /><Clock3 size={20} /><span><strong>{periodMeta[item].label}</strong><small>{item==='morning'?'09:00':'14:00'} 开始 · {item==='morning'?morningEnd:afternoonEnd} 截止</small></span></label>)}</div></fieldset>
          <div className="entry-form"><div><label className="field-label" htmlFor="morning-end">上午场截止时间</label><select className="text-input" id="morning-end" required value={morningEnd} onChange={e=>setMorningEnd(e.target.value)}>{halfHours.filter(t=>t>'09:00').map(t=><option key={t} value={t}>{t}</option>)}</select></div><div><label className="field-label" htmlFor="afternoon-end">下午场截止时间</label><select className="text-input" id="afternoon-end" required value={afternoonEnd} onChange={e=>setAfternoonEnd(e.target.value)}>{halfHours.filter(t=>t>'14:00').map(t=><option key={t} value={t}>{t}</option>)}</select></div></div><p>本次仅采用所选场次的截止时间，不影响其他评比。当天场次的截止时间必须晚于当前时间。</p>
          <div><div className="name-field-heading"><label className="field-label" htmlFor="contest-name">评比名称 · 可手动输入</label><button type="button" className="button button-secondary" onClick={()=>setTitle(randomContestTitle([...usedTitles,title]))}><Shuffle size={16}/>随机换一个</button></div><input id="contest-name" className="text-input" value={title} maxLength={28} onChange={(event) => setTitle(event.target.value)} placeholder="给本场评比起个名字" /></div>
          <p className="form-feedback" aria-live="polite">{error}</p>
          <button className="button button-primary create-submit" type="submit" disabled={busy}>{busy ? '正在创建…' : '保存并进入会场'} <ArrowRight size={18} /></button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
