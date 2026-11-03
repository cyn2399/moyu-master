import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Link2, Send, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { contestDeadline, periodMeta } from '@/lib/data'
import type { Contest } from '@/types'

interface ShareDialogProps {
  contest?: Contest
  open: boolean
  onOpenChange: (open: boolean) => void
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text)
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export function ShareDialog({ contest, open, onOpenChange }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState('')
  const link = contest ? `${window.location.origin}${window.location.pathname}?contest=${encodeURIComponent(contest.id)}` : window.location.href
  const canNativeShare = 'share' in navigator

  useEffect(() => {
    if (open) { setCopied(false); setShareError('') }
  }, [open])

  const copy = async () => {
    try {
      await copyText(link)
      setCopied(true)
      setShareError('')
    } catch {
      setShareError('浏览器未允许复制，请选中上方链接手动复制。')
    }
  }

  const share = async () => {
    if (!canNativeShare) return copy()
    try {
      await navigator.share({ title: contest?.title ?? '墨鱼 master评比', text: '我发起了一场墨鱼 master评比，来用你的匿名画像参赛吧！', url: link })
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') setShareError('系统分享未完成，可以改用复制链接。')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="share-dialog">
        <DialogHeader><DialogTitle>把入场券递给同事</DialogTitle><DialogDescription>打开链接后，同事登录后需填写地点、时间、躲避领导次数和墨鱼内容，才能参加本场评比。</DialogDescription></DialogHeader>
        {contest && <div className="share-contest"><span><Send size={21} /></span><div><strong>{contest.title}</strong><p>{contest.date} · {periodMeta[contest.period].label} · {contestDeadline(contest)}</p></div></div>}
        <label className="field-label" htmlFor="share-link">评比邀请链接</label>
        <div className="share-link-field"><Link2 size={18} /><input id="share-link" value={link} readOnly onFocus={(event) => event.target.select()} /><button className="icon-button" type="button" onClick={copy} aria-label="复制邀请链接">{copied ? <Check size={18} /> : <Copy size={18} />}</button></div>
        <p className="share-feedback" aria-live="polite">{copied ? '邀请链接已复制，可以发到群里了。' : shareError}</p>
        <button className="button button-primary share-primary" type="button" onClick={share}>{canNativeShare ? <ExternalLink size={18} /> : <Copy size={18} />}{canNativeShare ? '打开系统分享' : '复制邀请链接'}</button>
        <p className="share-local-note"><ShieldCheck size={15} />当前为单机体验；公开部署并接入团队服务端后，才能跨设备同步选票。</p>
      </DialogContent>
    </Dialog>
  )
}
