import type { BuildingConfig } from '@/types'
export const companyFloors=(b:BuildingConfig)=>b.companyFloors?.length?b.companyFloors:[b.companyFloor]
export function displayFloors(b:BuildingConfig){const floors=new Set([1,b.floors,...companyFloors(b),...b.spots.map(s=>s.floor)]);const step=Math.max(1,Math.ceil(b.floors/100));for(let f=1;f<=b.floors;f+=step)floors.add(f);return [...floors].sort((a,b)=>a-b)}
