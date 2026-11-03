import type { ReactNode } from 'react'
import { Building2, CalendarDays, Clock3, Crown, Fish, History, LogOut, Medal, Plus, Share2, UserRound } from 'lucide-react'
import { formatChineseDate, totalReceivedVotes } from '@/lib/data'
import type { PageKey, Profile, Contest } from '@/types'
import { IdentityAvatar } from './IdentityAvatar'

interface AppShellProps {
  hasSelectedContest: boolean
  contests: Contest[]
  user: Profile
  page: PageKey
  children: ReactNode
  onNavigate: (page: PageKey) => void
  onCreate: () => void
  onShare: () => void
  onProfile: () => void
  onLogout: () => void
}

const navigation: { key: PageKey; label: string; icon: typeof Clock3 }[] = [
  { key: 'today', label: '今日评比', icon: Clock3 },
  { key: 'map', label: '墨鱼地图', icon: Building2 },
  { key: 'profile', label: '我的身份', icon: UserRound },
  { key: 'ranking', label: '大师榜', icon: Medal },
  { key: 'history', label: '夺冠记录', icon: History },
]

const pageTitles: Record<PageKey, { title: string; subtitle: string }> = {
  today: { title: '今日评比', subtitle: '友谊第一，墨鱼第二，工作暂时第三。' },
  map: { title: '写字楼墨鱼地图', subtitle: '把整栋楼装进沙盘，找到刚刚好的片刻自由。' },
  profile: { title: '我的身份', subtitle: '保存唯一登录凭证，换设备也能找回身份。' },
  ranking: { title: '本月大师榜', subtitle: '每一颗星，都来自同事心服口服的一票。' },
  history: { title: '夺冠记录', subtitle: '那些消失在工位、又出现在领奖台的瞬间。' },
}

export function AppShell({ user, contests, hasSelectedContest, page, children, onNavigate, onCreate, onShare, onProfile, onLogout }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="app-brand" type="button" onClick={() => onNavigate('today')} aria-label="返回今日评比">
          <span className="brand-mark"><Fish size={24} /></span>
          <span><strong>墨鱼 master</strong><small>OFFICE LEAGUE</small></span>
        </button>
        <button className="button button-accent sidebar-create" type="button" onClick={onCreate}><Plus size={18} />发起评比</button>
        <nav className="side-nav" aria-label="主导航">
          {navigation.map((item) => {
            const Icon = item.icon
            return <button key={item.key} type="button" className={page === item.key ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(item.key)}><Icon size={19} /><span>{item.label}</span>{page === item.key && <span className="nav-dot" />}</button>
          })}
        </nav>
        <div className="sidebar-season">
          <Crown size={22} />
          <p>本月赛季进行中</p>
          <span>摘星最多者，加冕墨鱼皇帝</span>
          <button type="button" onClick={() => onNavigate('ranking')}>查看战况 <span>→</span></button>
        </div>
        <div className="sidebar-user">
          <IdentityAvatar name={user.nickname} color={user.color} size="sm" />
          <button className="sidebar-user-name" type="button" onClick={onProfile}><strong>{user.nickname}</strong><span>{totalReceivedVotes(contests,user.id)} 票 · {user.stars} 颗星 · {user.wins} 次夺冠</span></button>
          <button className="icon-button" type="button" onClick={onLogout} aria-label="退出当前身份" title="退出当前身份"><LogOut size={17} /></button>
        </div>
      </aside>

      <div className="main-column">
        <header className="mobile-header">
          <button className="app-brand" type="button" onClick={() => onNavigate('today')}><span className="brand-mark"><Fish size={21} /></span><strong>墨鱼 master</strong></button>
          <div className="mobile-context-actions">{page==='today'&&hasSelectedContest&&<button className="icon-button mobile-share" type="button" onClick={onShare} aria-label="邀请同事"><Share2 size={19}/></button>}<button className="button button-accent mobile-create-only" type="button" onClick={onCreate}><Plus size={16}/>发起评比</button></div>
        </header>
        <header className="content-header">
          <div>
            <p className="header-date"><CalendarDays size={15} />{formatChineseDate(new Date())}</p>
            <h1>{pageTitles[page].title}</h1>
            <p>{pageTitles[page].subtitle}</p>
          </div>
          {page==='today'&&hasSelectedContest&&<div className="header-actions"><button className="button button-secondary" type="button" onClick={onShare}><Share2 size={17}/>邀请同事</button></div>}
        </header>
        <main className="content-area">{children}</main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="手机主导航">
        {navigation.map((item) => {
          const Icon = item.icon
          return <button key={item.key} type="button" className={page === item.key ? 'active' : ''} onClick={() => onNavigate(item.key)}><Icon size={20} /><span>{item.label}</span></button>
        })}
      </nav>
    </div>
  )
}
