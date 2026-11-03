import { useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, Crown, Fish, History, Star, Trophy } from 'lucide-react'
import { periodMeta } from '@/lib/data'
import type { AppData, Profile } from '@/types'
import { IdentityAvatar } from '@/components/IdentityAvatar'

interface HistoryPageProps {
  data: AppData
  user: Profile
  onSelect: (id: string) => void
}

export function HistoryPage({ data, user, onSelect }: HistoryPageProps) {
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const records = useMemo(() => data.contests
    .filter((contest) => contest.winnerId && (filter === 'all' || contest.winnerId === user.id))
    .sort((a, b) => `${b.date}-${b.period}`.localeCompare(`${a.date}-${a.period}`)), [data.contests, filter, user.id])

  return (
    <div className="history-page">
      <section className="history-summary">
        <div><span className="summary-icon"><Trophy size={27} /></span><p>你的夺冠次数</p><strong>{user.wins}<small> 次</small></strong></div>
        <div><span className="summary-icon"><Star size={27} /></span><p>本月收集星星</p><strong>{user.stars}<small> 颗</small></strong></div>
        <blockquote>“真正的大师，不会把胜利写在脸上，<br />只会把它写进这份匿名记录里。”</blockquote>
      </section>
      <section className="history-records">
        <div className="section-heading">
          <div><p className="section-kicker">大师档案馆</p><h2>每一次华丽隐身</h2></div>
          <div className="small-tabs" role="tablist" aria-label="筛选夺冠记录"><button type="button" role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部记录</button><button type="button" role="tab" aria-selected={filter === 'mine'} className={filter === 'mine' ? 'active' : ''} onClick={() => setFilter('mine')}>只看我的</button></div>
        </div>
        {records.length ? <div className="history-timeline">
          {records.map((contest) => {
            const winner = data.profiles.find((profile) => profile.id === contest.winnerId)
            if (!winner) return null
            const date = new Date(`${contest.date}T12:00:00`)
            return <article key={contest.id} className="history-record">
              <div className="history-date"><strong>{date.getDate()}</strong><span>{date.getMonth() + 1} 月</span></div>
              <span className="timeline-dot"><Star size={13} fill="currentColor" /></span>
              <div className="history-record-main">
                <div className="history-record-meta"><span><CalendarDays size={14} />{contest.date} · {periodMeta[contest.period].label}</span><span>{Object.keys(contest.votes).length} 人投票</span></div>
                <h3>{contest.title}</h3>
                <div className="history-winner"><IdentityAvatar name={winner.nickname} color={winner.color} size="sm" /><div><span>本场墨鱼 master</span><strong>{winner.nickname}{winner.id === user.id && <i>我的夺冠时刻</i>}</strong></div><Crown size={25} /></div>
              </div>
              <button className="icon-button history-open" type="button" onClick={() => onSelect(contest.id)} aria-label={`查看${contest.date}${periodMeta[contest.period].label}详情`}><ArrowUpRight size={20} /></button>
            </article>
          })}
        </div> : <div className="empty-history"><span><History size={36} /></span><h3>你的大师档案还是空白</h3><p>先去参加今日评比，第一颗星星也许就在下一场。</p><button className="button button-primary" type="button" onClick={() => setFilter('all')}><Fish size={17} />看看其他大师</button></div>}
      </section>
    </div>
  )
}
