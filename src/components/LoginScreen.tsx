import { useState } from 'react'
import { ArrowRight, Check, Fish, ShieldCheck, Sparkles } from 'lucide-react'

interface LoginScreenProps {
  onLogin: (phone: string) => Promise<{ ok: boolean; message: string }>
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phone,setPhone]=useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if(!/^1[3-9]\d{9}$/.test(phone.trim())){setError('请输入有效的11位手机号');return}
    setBusy(true)
    const result = await onLogin(phone)
    setBusy(false)
    if (!result.ok) setError(result.message)
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-labelledby="login-title">
        <div className="login-brand"><Fish size={25} strokeWidth={2.2} /><span>墨鱼 master</span></div>
        <div className="login-story-copy">
          <p className="edition-label">OFFICE LEISURE LEAGUE · 2026</p>
          <h1 id="login-title">会工作的人，<br /><em>也会休息。</em></h1>
          <p>一场不谈 KPI 的公司评比。分享今天的休息记录，<br className="desktop-break" />让同事用选票决定谁才是真正的办公室隐士。</p>
        </div>
        <div className="login-manifesto">
          <span><Check size={16} />匿名参赛</span>
          <span><Check size={16} />每日两场</span>
          <span><Check size={16} />月度封神</span>
        </div>
        <div className="login-ticket" aria-hidden="true">
          <span className="ticket-star"><Sparkles size={28} /></span>
          <div><small>本月目标</small><strong>墨鱼皇帝</strong></div>
          <span className="ticket-stamp">NO.<br />001</span>
        </div>
        <Fish className="login-watermark" strokeWidth={0.8} aria-hidden="true" />
      </section>

      <section className="login-panel" aria-label="匿名登录">
        <div className="login-form-wrap">
          <div className="mobile-login-brand"><Fish size={23} /><span>墨鱼 master</span></div>
          <p className="section-kicker">匿名入场券</p>
          <h2>手机号入场，<br />匿名参加每一场。</h2>
          <p className="login-intro">无需密码，首次登录自动分配昵称；每场评比可自定义匿名昵称。</p>
          <form onSubmit={submit} noValidate>
            <label className="field-label" htmlFor="login-phone">手机号</label><input id="login-phone" className="text-input" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={11} value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,''));setError('')}} placeholder="请输入11位手机号"/>
            <div className="form-feedback" aria-live="polite">{error && <span>{error}</span>}</div>
            <button className="button button-primary login-submit" type="submit" disabled={busy}>
              登录并进入会场 <ArrowRight size={19} />
            </button>
          </form>
          <p className="privacy-note"><ShieldCheck size={16} />手机号不向其他用户展示。当前不验证号码归属，请勿使用他人手机号。</p>
        </div>
      </section>
    </main>
  )
}
