export const halfHours=Array.from({length:48},(_,i)=>`${String(Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`)
export const durations=Array.from({length:6},(_,i)=>(i+1)*5)
const themes=['茶水间外交官','工位隐身术','咖啡续命局','午后放空研究','带薪发呆大会','休息艺术展','办公室潜行者','窗边灵感补给','快乐充电站','墨鱼灵感大赏']
export function randomContestTitle(used:string[]) {
 const normalize=(s:string)=>s.normalize('NFKC').replace(/\s+/g,'').toLowerCase()
 const occupied=new Set(used.map(normalize));const available=themes.filter(t=>!occupied.has(normalize(t)))
 if(available.length)return available[Math.floor(Math.random()*available.length)]
 let candidate='';do {candidate=themes[Math.floor(Math.random()*themes.length)]+' · '+Math.floor(Math.random()*100000).toString().padStart(5,'0')}while(occupied.has(normalize(candidate)))
 return candidate
}
export function parseEntryTime(value:string){
 const match=value.match(/(\d{2}):([03]0)/);const start=match?match[0]:''
 const minutes=value.match(/(\d+)\s*分钟/);return {start,duration:minutes&&durations.includes(Number(minutes[1]))?Number(minutes[1]):15}
}

export function randomParticipantName(used:string[]){const adjectives=['慢半拍','云游','放空','午后','隐身','慵懒','悠闲','迷路'];const nouns=['水母','海獭','墨鱼','猫头鹰','海豹','小熊','鲸鱼','狐狸'];let name='';do{name=adjectives[Math.floor(Math.random()*adjectives.length)]+nouns[Math.floor(Math.random()*nouns.length)]+' '+Math.floor(Math.random()*1000).toString().padStart(3,'0')}while(used.includes(name));return name}
