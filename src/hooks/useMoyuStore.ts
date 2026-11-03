import { useEffect, useState } from 'react'
import { createDefaultBuilding } from '@/lib/data'
import type { AppData, ProfileDraft, BuildingConfig, Period, ContestEntry } from '@/types'
export function useMoyuStore() {
 const [data,setData]=useState<AppData>(()=>({profiles:[],contests:[],building:createDefaultBuilding(),currentUserId:null}))
 async function api(path:string, body?:unknown) {
  const r=await fetch('/api/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(localStorage.getItem('moyu-credential')??'')},body:body?JSON.stringify(body):undefined})
  const v=await r.json(); if(!r.ok) throw new Error(v.error); return v
 }
 useEffect(()=>{let active=true; const refresh=()=>api('state').then(v=>{if(active)setData(localStorage.getItem('moyu-locked')?{...v,currentUserId:null}:v)}).catch(()=>{});refresh();const t=setInterval(refresh,5000);return()=>{active=false;clearInterval(t)}},[])
 async function login(phone:string){try {const v=await api('login',{phone});localStorage.removeItem('moyu-locked');localStorage.setItem('moyu-credential',v.credential);setData(v.data);return {ok:true,message:'手机号登录成功，每场可独立设置参赛昵称'}}catch(e){return {ok:false,message:(e as Error).message}}}
 function mutate(action:string,payload:unknown){void api('action',{action,payload}).then(setData).catch(e=>window.alert(e.message))}
 const currentUser=data.profiles.find(p=>p.id===data.currentUserId)??null
 return {data,currentUser,rename:async(nickname:string)=>{const v=await api('action',{action:'rename',payload:{nickname}});setData(v)},deleteContest:async(id:string)=>{const v=await api('action',{action:'deleteContest',payload:{id}});setData(v)},joinContest:async(id:string,entry:Omit<ContestEntry,'submittedAt'>)=>{const v=await api('action',{action:'join',payload:{id,entry}});setData(v)},voteAsync:async(id:string,candidateId:string)=>{const v=await api('action',{action:'vote',payload:{id,candidateId}});setData(v)},updateSettings:async(offWorkTime:string)=>{const v=await api('action',{action:'settings',payload:{offWorkTime}});setData(v)},login,logout:()=>{localStorage.setItem('moyu-locked','1');setData(d=>({...d,currentUserId:null}))},updateProfile:(d:ProfileDraft)=>mutate('profile',d),vote:(id:string,candidateId:string)=>mutate('vote',{id,candidateId}),saveContest:async(date:string,period:Period,title:string,cutoff:string)=>{const v=await api('action',{action:'contest',payload:{date,period,title,cutoff}});setData(v.data);return v.id as string},settleContest:(id:string)=>mutate('settle',{id}),updateBuilding:async(b:BuildingConfig)=>{const v=await api('action',{action:'building',payload:b});setData(v)},resetDemo:()=>{}}
}
