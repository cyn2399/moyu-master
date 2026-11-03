import {useEffect,useState} from 'react'
import type {AppData,Profile} from '@/types'
export function ProfilePage({user,onRename}: {data:AppData;user:Profile;onEdit:()=>void;onShare:()=>void;onRename:(nickname:string)=>Promise<void>}) {
 const [name,setName]=useState(user.nickname);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');useEffect(()=>setName(user.nickname),[user.nickname])
 return <section className="identity-card"><h2>{user.nickname}</h2><form className="account-name-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{await onRename(name);setMessage('账号昵称已更新，已有评比的参赛昵称保持不变')}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}}><label className="field-label" htmlFor="account-name">账号昵称（全站唯一）</label><input className="text-input" id="account-name" required minLength={2} maxLength={16} value={name} onChange={e=>setName(e.target.value)}/><button className="button button-primary" disabled={busy}>保存昵称</button><p role="status">{message}</p></form><p>公开编号：{user.id}</p><p>账号通过手机号登录，无需密码。手机号不在会场展示。</p><p>每场报名时可单独设置参赛昵称，评比中展示参赛昵称。</p></section>
}
