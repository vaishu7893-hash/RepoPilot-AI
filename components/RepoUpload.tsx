 "use client";

import { useState } from "react";

type AnalysisResult = {
  name: string;
  description: string;
  language: string;
  framework: string;
  packageManager: string;
  license: string;
  stars: number;
  forks: number;
  fileCount: number;
  folderCount: number;
  hasTests: boolean;
  hasDocker: boolean;
  hasGithubActions: boolean;
  summary: string;
  architecture?: string;
  score: number;
  documentation?: number;
  security?: number;
  maintainability?: number;
  testing?: number;
  suggestions: string[];
  updated: string;
};

function Bar({label,value}:{label:string;value:number}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span>{label}</span><span>{value}/100</span>
      </div>
      <div className="w-full bg-gray-700 rounded h-2">
        <div className="bg-green-500 h-2 rounded" style={{width:`${value}%`}} />
      </div>
    </div>
  );
}

export default function RepoUpload() {
  const [repoUrl,setRepoUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<AnalysisResult|null>(null);

  async function analyseRepo(){
    if(!repoUrl.trim()) return alert("Please enter a GitHub repository URL.");
    try{
      setLoading(true);
      const res=await fetch("/api/analyse",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({repoUrl})
      });
      if(!res.ok) throw new Error("Analysis failed");
      setResult(await res.json());
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h2 className="text-3xl font-bold mb-6">🚀 Analyse GitHub Repository</h2>

      <div className="flex gap-3">
        <input
          className="flex-1 p-3 rounded text-black"
          value={repoUrl}
          onChange={(e)=>setRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repository"
        />
        <button
          onClick={analyseRepo}
          disabled={loading}
          className="bg-blue-600 px-6 rounded text-white"
        >
          {loading?"Analysing...":"Analyse"}
        </button>
      </div>

      {result && (
        <div className="space-y-6 mt-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-2xl font-bold mb-4">{result.name}</h3>
            <p>{result.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              <div>⭐ {result.stars}</div>
              <div>🍴 {result.forks}</div>
              <div>📁 {result.fileCount}</div>
              <div>📂 {result.folderCount}</div>
              <div>💻 {result.language}</div>
              <div>⚛️ {result.framework}</div>
              <div>📦 {result.packageManager}</div>
              <div>📄 {result.license}</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">Project Health</h3>
            <p>🧪 Tests: {result.hasTests?"Yes":"No"}</p>
            <p>🐳 Docker: {result.hasDocker?"Yes":"No"}</p>
            <p>⚙️ GitHub Actions: {result.hasGithubActions?"Yes":"No"}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2">Architecture</h3>
            <p>{result.architecture}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Overall Score</h3>
            <div className="text-5xl font-bold text-green-400 mb-6">{result.score}/100</div>

            <Bar label="Documentation" value={result.documentation ?? 0}/>
            <Bar label="Security" value={result.security ?? 0}/>
            <Bar label="Maintainability" value={result.maintainability ?? 0}/>
            <Bar label="Testing" value={result.testing ?? 0}/>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">Summary</h3>
            <p>{result.summary}</p>
            <h3 className="text-xl font-bold mt-6 mb-3">Suggestions</h3>
            <ul className="list-disc ml-6">
              {result.suggestions.map((s,i)=><li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}