interface Props {value:string;onChange:(value:string)=>void}
export function DateSelect({value,onChange}:Props){
 const now=new Date();const [year,month,day]=value.split('-').map(Number);const days=new Date(year,month,0).getDate()
 const change=(y:number,m:number,d:number)=>{const last=new Date(y,m,0).getDate();onChange(`${y}-${String(m).padStart(2,'0')}-${String(Math.min(d,last)).padStart(2,'0')}`)}
 return <div className="date-dropdowns" role="group" aria-label="评比日期"><select className="text-input" aria-label="年份" value={year} onChange={e=>change(Number(e.target.value),month,day)}>{Array.from({length:11},(_,i)=>now.getFullYear()+i).map(y=><option key={y} value={y}>{y} 年</option>)}</select><select className="text-input" aria-label="月份" value={month} onChange={e=>change(year,Number(e.target.value),day)}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m} 月</option>)}</select><select className="text-input" aria-label="日期" value={day} onChange={e=>change(year,month,Number(e.target.value))}>{Array.from({length:days},(_,i)=>i+1).map(d=><option key={d} value={d}>{d} 日</option>)}</select></div>
}
