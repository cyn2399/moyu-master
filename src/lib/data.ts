import type { AppData, BuildingConfig, Contest, Period, Profile } from '@/types'

export const STORAGE_KEY = 'moyu-master-office-v1'

export const pad = (value: number) => String(value).padStart(2, '0')

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function formatChineseDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

export function contestId(date: string, period: Period) {
  return `${date}-${period}`
}

export const periodMeta: Record<Period, { label: string; time: string; start: number; end: number }> = {
  morning: { label: '上午场', time: '09:00—12:00', start: 9 * 60, end: 12 * 60 },
  afternoon: { label: '下午场', time: '14:00—18:00', start: 14 * 60, end: 18 * 60 },
}

export function getContestState(contest: Contest, now = new Date()) {
  if (contest.winnerId) return 'settled' as const
  const deadline = Date.parse(contest.customDeadline ?? contest.deadlineOverride ?? (contest.date + 'T' + (contest.period === 'morning' ? '12:00' : '18:00') + ':00+08:00'))
  if (now.getTime() >= deadline) return 'closed' as const
  const start = Date.parse(contest.date + 'T' + (contest.period === 'morning' ? '09:00' : '14:00') + ':00+08:00')
  return now.getTime() < start ? 'upcoming' as const : 'live' as const
}

export const stateLabels = {
  live: '投票进行中',
  upcoming: '尚未开始',
  closed: '等待揭晓',
  settled: '已揭晓',
}

const sampleProfiles: Profile[] = [
  {
    id: 'p1', nickname: '北冥有鱼', code: 'demo2026', timeSlots: ['09:30—10:00', '15:00—15:30'],
    locations: ['茶水间', '天台'], bestSpot: '天台入口第二张藤椅，信号好且视野开阔。',
    avoidanceTip: '抱着笔记本电脑快走，任何地方都像临时办公点。', motto: '不是在工作，就是在寻找工作的路上。',
    color: '#aa8576', stars: 8, starMonth: toMonthKey(new Date()), wins: 8, joinedAt: '2026-09-01',
  },
  {
    id: 'p2', nickname: '工位忍者', code: 'local-only', timeSlots: ['10:30—11:00', '16:00—16:30'],
    locations: ['消防通道', '打印区'], bestSpot: '三楼打印区最里面，纸声能掩盖一切。',
    avoidanceTip: '屏幕永远停留在表格，Alt + Tab 比心跳还熟。', motto: '真正的高手，连椅子都不会响。',
    color: '#8799a5', stars: 6, starMonth: toMonthKey(new Date()), wins: 6, joinedAt: '2026-09-02',
  },
  {
    id: 'p3', nickname: '咖啡续命侠', code: 'local-only', timeSlots: ['09:00—09:30', '14:30—15:00'],
    locations: ['咖啡机旁', '便利店'], bestSpot: '楼下便利店靠窗位，买杯咖啡就能获得半小时自由。',
    avoidanceTip: '手拿空杯，遇见领导就自然地说“刚开完会，续杯”。', motto: '咖啡会喝完，自由不会。',
    color: '#b6a17b', stars: 7, starMonth: toMonthKey(new Date()), wins: 7, joinedAt: '2026-09-03',
  },
  {
    id: 'p4', nickname: '盆栽观察员', code: 'local-only', timeSlots: ['11:00—11:30', '16:30—17:00'],
    locations: ['绿植角', '休息区'], bestSpot: '休息区龟背竹后面，叶片是最天然的屏风。',
    avoidanceTip: '拿手机拍叶子，别人只会以为你在记录公司绿化。', motto: '每一片新叶，都值得认真欣赏。',
    color: '#84988a', stars: 4, starMonth: toMonthKey(new Date()), wins: 4, joinedAt: '2026-09-04',
  },
  {
    id: 'p5', nickname: '会议室幽灵', code: 'local-only', timeSlots: ['10:00—10:30', '15:30—16:00'],
    locations: ['空会议室', '楼梯转角'], bestSpot: '没有窗户的小会议室，记得先确认当天没有预订。',
    avoidanceTip: '提前在日历建一个“个人专注时间”，让忙碌有据可查。', motto: '神出鬼没，但日报从不迟到。',
    color: '#a094a8', stars: 5, starMonth: toMonthKey(new Date()), wins: 5, joinedAt: '2026-09-05',
  },
]

function makeSeedContests(now: Date): Contest[] {
  const today = toDateKey(now)
  const morning: Contest = {
    id: contestId(today, 'morning'), date: today, period: 'morning',
    title: '早间隐身术大赏', votes: { p2: 'p1', p3: 'p1', p4: 'p2', p5: 'p1' },
    winnerId: 'p1', createdBy: 'p3',
  }
  const afternoon: Contest = {
    id: contestId(today, 'afternoon'), date: today, period: 'afternoon',
    title: '午后失踪人口普查', votes: { p2: 'p3', p4: 'p3', p5: 'p2' }, createdBy: 'p1',
  }
  const historyWinners = ['p3', 'p2', 'p1', 'p4', 'p5', 'p3', 'p1', 'p2', 'p3', 'p5', 'p1', 'p4']
  const history: Contest[] = historyWinners.map((winnerId, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - Math.floor(index / 2) - 1)
    const key = toDateKey(date)
    const period: Period = index % 2 === 0 ? 'afternoon' : 'morning'
    const voter = sampleProfiles.find((profile) => profile.id !== winnerId)?.id ?? 'p1'
    return {
      id: contestId(key, period), date: key, period,
      title: period === 'morning' ? '早间隐身术大赏' : '午后失踪人口普查',
      votes: { [voter]: winnerId }, winnerId, createdBy: 'p1',
    }
  })
  return [morning, afternoon, ...history]
}

export function createDefaultBuilding(): BuildingConfig {
  return {
    name: '云栖中心 A 座', floors: 12, companyFloor: 6,
    spots: [
      { id: 'pantry', name: '茶水间', floor: 3, zone: '东侧茶水区', description: '咖啡机与饮水机之间，动线自然，适合短暂换换脑子。', tip: '手里拿着杯子，来回都像一次正常补给。', status: 'quiet', x: 1.8, z: -0.7 },
      { id: 'rooftop', name: '天台藤椅', floor: 12, zone: '天台西侧', description: '视野开阔、风声自由，是北冥有鱼公开的心头好。', tip: '注意天气和天台开放时间，不要久到被惦记。', status: 'quiet', x: -1.6, z: -0.6 },
      { id: 'stairs', name: '消防通道', floor: 6, zone: '西北角', description: '人少安静，适合短暂透气，但必须保持通道畅通。', tip: '不堆放物品，也不阻挡消防设施。', status: 'risk', x: -2.1, z: 0.8 },
      { id: 'print', name: '打印区', floor: 6, zone: '公司前厅后方', description: '打印机声音天然掩盖脚步，取文件时顺便放松两分钟。', tip: '别真的打印空白纸，环保也是大师修养。', status: 'busy', x: 1.2, z: 0.9 },
      { id: 'coffee', name: '咖啡机旁', floor: 3, zone: '东侧茶水区', description: '咖啡香覆盖一切疲惫，排队也能成为合理的停留理由。', tip: '记得控制咖啡因，下午太晚就换温水。', status: 'busy', x: 2.1, z: 0.6 },
      { id: 'store', name: '楼下便利店', floor: 1, zone: '一层商业配套', description: '靠窗位置可以观察人流，买杯饮料就能获得短暂自由。', tip: '外勤理由要真实，别把十分钟变成一下午。', status: 'quiet', x: 0.4, z: -0.8 },
      { id: 'plants', name: '绿植角', floor: 6, zone: '公司南侧窗边', description: '龟背竹形成天然屏风，阳光和叶片负责改善心情。', tip: '观察新叶可以，别把公司的植物薅秃。', status: 'quiet', x: -0.7, z: 1.1 },
      { id: 'lounge', name: '休息区', floor: 5, zone: '共享楼层南侧', description: '沙发舒适、人来人往，适合恢复精力后继续工作。', tip: '公共休息区先到先得，不要长期占位。', status: 'busy', x: 1.6, z: 0.7 },
      { id: 'meeting', name: '空会议室', floor: 8, zone: '中部会议区', description: '短暂独处的热门选择，关门之前务必确认当天预订。', tip: '优先使用真正空闲的会议室，随时让给有会的同事。', status: 'risk', x: -1.4, z: -0.5 },
      { id: 'corner', name: '楼梯转角', floor: 7, zone: '东侧步行楼梯', description: '上下楼之间的短暂停靠点，适合伸展和看看远处。', tip: '靠侧站立，不影响正常通行。', status: 'quiet', x: 2.0, z: -0.5 },
    ],
  }
}

export function createSeedData(): AppData {
  const now = new Date()
  return {
    profiles: sampleProfiles.map((profile) => ({ ...profile, starMonth: toMonthKey(now) })),
    contests: makeSeedContests(now),
    currentUserId: null,
    building: createDefaultBuilding(),
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedData()
    const parsed = JSON.parse(raw) as AppData
    if (!Array.isArray(parsed.profiles) || !Array.isArray(parsed.contests)) return createSeedData()
    const fallback = createDefaultBuilding()
    const building = parsed.building?.spots?.length ? parsed.building : fallback
    return { ...parsed, building }
  } catch {
    return createSeedData()
  }
}

export function ensureTodayContests(data: AppData, now = new Date()): AppData {
  const today = toDateKey(now)
  const month = toMonthKey(now)
  let changed = false
  const profiles = data.profiles.map((profile) => {
    if (profile.starMonth === month) return profile
    changed = true
    return { ...profile, stars: 0, starMonth: month }
  })
  const contests = [...data.contests]
  ;(['morning', 'afternoon'] as Period[]).forEach((period) => {
    if (!contests.some((contest) => contest.id === contestId(today, period))) {
      changed = true
      contests.unshift({
        id: contestId(today, period), date: today, period,
        title: period === 'morning' ? '早间隐身术大赏' : '午后失踪人口普查',
        votes: {}, createdBy: data.currentUserId ?? 'p1',
      })
    }
  })
  return changed ? { ...data, profiles, contests } : data
}

export function voteCount(contest: Contest, profileId: string) {
  return Object.values(contest.votes).filter((id) => id === profileId).length
}

export function leaderFor(contest: Contest) {
  const counts = new Map<string, number>()
  Object.values(contest.votes).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

export function contestDeadline(contest: Contest) {
 if(contest.customDeadline || contest.deadlineOverride) return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date((contest.customDeadline ?? contest.deadlineOverride)!)) + (contest.customDeadline ? ' 截止' : ' 截止（临时测试）')
 return (contest.period === 'morning' ? '12:00' : '18:00') + ' 截止'
}

export function totalReceivedVotes(contests: Contest[], userId: string) {
 return contests.reduce((total, contest) => total + Object.values(contest.votes).filter(id => id === userId).length, 0)
}
