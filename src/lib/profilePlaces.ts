import type { BuildingConfig, BuildingSpot, Profile } from '@/types'
const aliases = [['茶水间','茶水区','饮水区'],['天台','楼顶','屋顶'],['打印区','打印室','复印区'],['消防通道','消防楼梯'],['便利店','小卖部'],['咖啡机','咖啡区'],['休息区','休息室','休息间'],['绿植角','植物角']]
const normalize = (text:string) => text.toLowerCase().replace(/[\s，。,.、·—_\-（）()]/g,'')
export function matchProfilePlaces(profiles:Profile[], spots:BuildingSpot[]) {
 const occupants:Record<string,Profile[]> = Object.fromEntries(spots.map(s=>[s.id,[]]))
 const unmatched:{profile:Profile;place:string}[]=[]
 for(const profile of profiles) {
  const found=new Set<string>()
  for(const place of [...new Set([...profile.locations,profile.bestSpot])]) {
   const text=normalize(place); if(!text)continue
   const matches=spots.filter(spot=>{
    const name=normalize(spot.name)
    if(text.includes(name)|| (text.length>=2 && name.includes(text)))return true
    return aliases.some(group=>group.some(a=>name.includes(a)) && group.some(a=>text.includes(a)))
   })
   matches.forEach(s=>found.add(s.id))
   if(!matches.length && profile.locations.includes(place))unmatched.push({profile,place})
  }
  found.forEach(id=>occupants[id].push(profile))
 }
 return {occupants,unmatched}
}

export const isGroundShop=(name:string)=>/全家|family\s*mart|7[\s-]*11|seven.?eleven|瑞幸|luckin|便利店|小卖部|星巴克|starbucks|罗森|lawson/i.test(name)
export function linkAllPlaces(building:BuildingConfig,profiles:Profile[]):BuildingConfig {
 building={...building,spots:building.spots.map((spot,i)=>isGroundShop(spot.name)?{...spot,floor:1,zone:'一层外围商铺',x:-4.8+(i%6)*1.8,z:3.6}:spot)}
 const {unmatched}=matchProfilePlaces(profiles,building.spots)
 const blocked=(building.excludedPlaces??[]).map(normalize)
 const places=[...new Map(unmatched.filter(({place})=>!blocked.some(name=>name===normalize(place)||normalize(place).includes(name))).map(({place})=>[normalize(place),place.trim()])).entries()].sort(([a],[b])=>a.localeCompare(b))
 const extra:BuildingSpot[]=places.map(([key,name],index)=>{
  let hash=2166136261;for(const ch of key)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0
  const floorMatch=name.match(/(\d+)\s*(?:楼|层|[fF])|[fF]\s*(\d+)/)
  const shop=isGroundShop(name)
  const floor=shop?1:floorMatch?Math.max(1,Math.min(building.floors,Number(floorMatch[1]||floorMatch[2]))):building.companyFloor
  return {id:'linked-'+hash.toString(16),name,floor,zone:shop?'一层外围商铺':floorMatch?'画像地点 · 已识别楼层':'画像地点 · 暂放公司层',description:'根据当天参赛记录自动关联。标记坐标为示意位置，可在配置建筑中校正。',tip:'点击配置建筑可以校正楼层和坐标。',status:'quiet',x:shop?-4.8+(index%6)*1.8:-2.4+(index%6)*.85,z:shop?3.6+Math.floor(index/6)*.6:-1.4+(Math.floor(index/6)%5)*.65}
 })
 return {...building,spots:[...building.spots,...extra]}
}
