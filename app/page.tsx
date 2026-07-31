"use client";
import { useState } from "react";
type Report=any;
export default function Home(){
const [repoUrl,setRepoUrl]=useState("");
const [loading,setLoading]=useState(false);
const [report,setReport]=useState<Report|null>(null);
async function analyzeRepository(){
 if(!repoUrl.trim()) return alert("Enter a GitHub URL");
 setLoading(true);setReport(null);
 try{
 const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({repoUrl})});
 const d=await r.json(); if(d.error){alert(d.error);return;} setReport(d);
 } finally{setLoading(false);}
}
const Bar=({label,v}:{label:string,v:number})=><div className="mb-3"><div className="flex justify-between"><span>{label}</span><span>{v}/100</span></div><div className="w-full bg-gray-700 h-2 rounded"><div className="bg-green-500 h-2 rounded" style={{width:`${v}%`}}/></div></div>;
return <main className="max-w-6xl mx-auto p-8 text-white">
<h1 className="text-5xl font-bold mb-6">🚀 RepoPilot AI</h1>
<div className="flex gap-3"><input className="flex-1 p-3 rounded text-white" value={repoUrl} onChange={e=>setRepoUrl(e.target.value)} placeholder="https://github.com/facebook/react"/><button onClick={analyzeRepository} className="bg-blue-600 px-5 rounded">{loading?"Analyzing...":"Analyze"}</button></div>
{report&&<div className="space-y-6 mt-8">
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
{[['Repository',report.name],['Stars',report.stars],['Language',report.language],['Framework',report.framework],['Files',report.fileCount],['Folders',report.folderCount],['Package',report.packageManager],['License',report.license]].map(([k,v])=><div key={String(k)} className="bg-gray-800 p-4 rounded"><div className="text-gray-400">{k}</div><div className="font-bold">{String(v)}</div></div>)}
</div>
<div className="bg-gray-800 p-5 rounded"><h2 className="font-bold text-xl">Architecture</h2><p>{report.architecture}</p></div>
<div className="bg-gray-800 p-5 rounded"><h2 className="font-bold text-xl mb-3">Health Score</h2><div className="text-4xl text-green-400 mb-4">{report.score}/100</div><Bar label="Documentation" v={report.documentation||0}/><Bar label="Security" v={report.security||0}/><Bar label="Maintainability" v={report.maintainability||0}/><Bar label="Testing" v={report.testing||0}/></div>
<div className="bg-gray-800 p-5 rounded"><h2 className="font-bold text-xl">Summary</h2><p>{report.summary}</p><h2 className="font-bold text-xl mt-4">Suggestions</h2><ul className="list-disc ml-6">{(report.suggestions||[]).map((s:string,i:number)=><li key={i}>{s}</li>)}</ul></div>
</div>}
</main>}