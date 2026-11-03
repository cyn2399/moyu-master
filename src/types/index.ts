export type Period = 'morning' | 'afternoon'

export interface Profile {
  id: string
  nickname: string
  code: string
  timeSlots: string[]
  locations: string[]
  bestSpot: string
  avoidanceTip: string
  motto: string
  color: string
  stars: number
  starMonth: string
  wins: number
  joinedAt: string
}

export interface ContestEntry {
  nickname?: string
  location: string
  time: string
  avoidanceCount: number
  content: string
  submittedAt: string
}

export interface Contest {
  customDeadline?: string
  deadlineOverride?: string
  entries?: Record<string, ContestEntry>
  offWorkTime?: string
  startsAt?: string
  endsAt?: string
  id: string
  date: string
  period: Period
  title: string
  votes: Record<string, string>
  winnerId?: string
  createdBy: string
}

export type SpotStatus = 'quiet' | 'busy' | 'risk'

export interface BuildingSpot {
  id: string
  name: string
  floor: number
  zone: string
  description: string
  tip: string
  status: SpotStatus
  x: number
  z: number
}

export interface BuildingConfig {
  excludedPlaces?: string[]
  companyFloors?: number[]
  name: string
  floors: number
  companyFloor: number
  spots: BuildingSpot[]
}

export interface AppData {
  offWorkTime?: string
  profiles: Profile[]
  contests: Contest[]
  currentUserId: string | null
  building: BuildingConfig
}

export type PageKey = 'today' | 'map' | 'profile' | 'ranking' | 'history'

export interface ProfileDraft {
  nickname: string
  timeSlots: string[]
  locations: string[]
  bestSpot: string
  avoidanceTip: string
  motto: string
  color: string
}
