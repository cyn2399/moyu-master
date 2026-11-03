import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import { CheckCircle2, X } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { CreateContestDialog } from '@/components/CreateContestDialog'
import { LoginScreen } from '@/components/LoginScreen'
import { ShareDialog } from '@/components/ShareDialog'
import { useMoyuStore } from '@/hooks/useMoyuStore'
import { toDateKey } from '@/lib/data'
import { HistoryPage } from '@/pages/HistoryPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RankingPage } from '@/pages/RankingPage'
import { TodayPage } from '@/pages/TodayPage'
import type { PageKey, Period } from '@/types'

const MapPage = lazy(() => import('@/pages/MapPage').then((module) => ({ default: module.MapPage })))

export default function App() {
  const { data, currentUser, login, logout, saveContest, settleContest, updateBuilding, joinContest, voteAsync, deleteContest, rename } = useMoyuStore()
  const [page, setPage] = useState<PageKey>('today')
  const [selectedContestId, setSelectedContestId] = useState(() => new URLSearchParams(window.location.search).get('contest') ?? '')
  const [createOpen, setCreateOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentUser?.id])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const navigate = (nextPage: PageKey) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!currentUser) return <LoginScreen onLogin={async (phone) => {
    const result = await login(phone)
    if (result.ok) setToast(result.message)
    return result
  }} />

  const selectedContest = data.contests.find((contest) => contest.id === selectedContestId)

  const handleSaveContest = async (date: string, period: Period, title: string, cutoff: string) => {
    const id = await saveContest(date, period, title, cutoff)
    setSelectedContestId(id)
    navigate('today')
    setToast('会场已准备好，邀请同事来参赛吧')
    window.setTimeout(() => setShareOpen(true), 180)
  }

  return (
    <>
      <AppShell
        user={currentUser} page={page} onNavigate={navigate}
        onCreate={() => setCreateOpen(true)} onShare={() => setShareOpen(true)}
        onProfile={() => navigate('profile')} onLogout={() => { logout(); navigate('today') }}
      >
        {page === 'today' && <TodayPage
          data={data} user={currentUser} selectedId={selectedContest?.id ?? ''} onSelect={setSelectedContestId}
          onDelete={async(id)=>{await deleteContest(id);setSelectedContestId('');const url=new URL(window.location.href);url.searchParams.delete('contest');window.history.replaceState(null,'',url);setShareOpen(false);setToast('评比已删除')}}
          onJoin={joinContest} onVote={async(id,candidateId)=>{await voteAsync(id,candidateId);setToast('投票成功，截止前可改选')}}
          onSettle={(id) => { settleContest(id); setToast('结果已揭晓，大师星已经送达') }}
          onShare={() => setShareOpen(true)}
        />}
        {page === 'map' && <Suspense fallback={<div className="map-route-loading" role="status"><span />正在生成写字楼沙盘…</div>}><MapPage profiles={data.profiles.map(p=>{const entries=data.contests.filter(c=>c.date===toDateKey(new Date())).flatMap(c=>c.entries?.[p.id]?[c.entries[p.id]]:[]).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));return {...p,nickname:entries[0]?.nickname??p.nickname,locations:[...new Set(entries.map(e=>e.location))],bestSpot:entries[0]?.location??'',motto:entries[0]?.content??''}})} building={data.building} onSave={async(building) => { await updateBuilding(building); setToast('写字楼沙盘已按新配置重建') }} /></Suspense>}
        {page === 'profile' && <ProfilePage onRename={rename} data={data} user={currentUser} onEdit={() => {}} onShare={() => setShareOpen(true)} />}
        {page === 'ranking' && <RankingPage profiles={data.profiles} currentUser={currentUser} onShare={() => setShareOpen(true)} />}
        {page === 'history' && <HistoryPage data={data} user={currentUser} onSelect={(id) => { setSelectedContestId(id); navigate('today') }} />}
      </AppShell>
      <CreateContestDialog usedTitles={data.contests.map(c=>c.title)} open={createOpen} onOpenChange={setCreateOpen} onSave={handleSaveContest} />
      <ShareDialog contest={selectedContest} open={shareOpen} onOpenChange={setShareOpen} />
      {toast && <div className="app-toast" role="status"><CheckCircle2 size={19} /><span>{toast}</span><button type="button" onClick={() => setToast('')} aria-label="关闭提示"><X size={16} /></button></div>}
    </>
  )
}
