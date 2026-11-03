import { Crown, Medal, Share2, Sparkles, Star, Trophy } from 'lucide-react'
import type { Profile } from '@/types'
import { IdentityAvatar } from '@/components/IdentityAvatar'

interface RankingPageProps {
  profiles: Profile[]
  currentUser: Profile
  onShare: () => void
}

export function RankingPage({ profiles, currentUser, onShare }: RankingPageProps) {
  const ranked = [...profiles].sort((a, b) => b.stars - a.stars || b.wins - a.wins)
  const emperor = ranked[0]
  const maxStars = Math.max(emperor?.stars ?? 1, 1)
  const monthLabel = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(new Date())
  const currentRank = ranked.findIndex((profile) => profile.id === currentUser.id) + 1

  return (
    <div className="ranking-page">
      {emperor && <section className="emperor-banner">
        <div className="emperor-copy">
          <p className="section-kicker">{monthLabel} · 暂时领先</p>
          <h2>本月的墨鱼皇帝，<br /><em>正在此处喝茶。</em></h2>
          <p>目前由 <strong>{emperor.nickname}</strong> 以 {emperor.stars} 颗星领跑。赛季尚未结束，每位同事实力都不容小觑。</p>
          <button className="button button-accent" type="button" onClick={onShare}><Share2 size={17} />喊同事来挑战</button>
        </div>
        <div className="emperor-portrait">
          <span className="emperor-crown"><Crown size={34} /></span>
          <IdentityAvatar name={emperor.nickname} color={emperor.color} size="xl" />
          <strong>{emperor.nickname}</strong>
          <span>MOYU EMPEROR</span>
          <div className="emperor-stars"><Star size={20} fill="currentColor" /><strong>{emperor.stars}</strong><span>本月大师星</span></div>
        </div>
        <Sparkles className="emperor-sparkle one" aria-hidden="true" /><Sparkles className="emperor-sparkle two" aria-hidden="true" />
      </section>}

      <section className="ranking-board" aria-labelledby="ranking-title">
        <div className="section-heading">
          <div><p className="section-kicker">星星排行榜</p><h2 id="ranking-title">距离皇位还有几颗星？</h2></div>
          <span>你的当前名次：第 {currentRank} 名</span>
        </div>
        <div className="ranking-head" aria-hidden="true"><span>名次 / 匿名选手</span><span>本月夺冠</span><span>大师星</span></div>
        <ol className="ranking-list">
          {ranked.map((profile, index) => (
            <li key={profile.id} className={`${index === 0 ? 'leader' : ''} ${profile.id === currentUser.id ? 'is-current' : ''}`}>
              <div className="ranking-person">
                <span className="rank-number">{index === 0 ? <Crown size={21} /> : String(index + 1).padStart(2, '0')}</span>
                <IdentityAvatar name={profile.nickname} color={profile.color} size="sm" />
                <div><strong>{profile.nickname}{profile.id === currentUser.id && <span>我</span>}</strong><small>{profile.motto}</small></div>
              </div>
              <span className="ranking-wins">{profile.wins} 次</span>
              <div className="ranking-stars"><strong><Star size={17} fill="currentColor" />{profile.stars}</strong><span className="star-progress"><i style={{ transform: `scaleX(${profile.stars / maxStars})` }} /></span></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="season-rules" aria-label="赛季规则">
        <div><span><Trophy size={20} /></span><p><strong>每天两场</strong>上午、下午各产生一位墨鱼 master。</p></div>
        <div><span><Star size={20} /></span><p><strong>夺冠摘星</strong>每场大师获得一颗星，计入当月成绩。</p></div>
        <div><span><Medal size={20} /></span><p><strong>月末加冕</strong>每月星星最多者，成为墨鱼皇帝。</p></div>
      </section>
    </div>
  )
}
