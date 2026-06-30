import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { 
  FolderGit2, 
  RefreshCw, 
  Loader2, 
  AlertTriangle, 
  ExternalLink, 
  Brain,
  CheckCircle2,
  Terminal,
  Activity,
  Code2
} from "lucide-react";

const SCAN_STAGES = [
  "Resolving GitHub Username metadata...",
  "Querying public repository footprint...",
  "Analyzing language profile matrix...",
  "Validating MLE engineering keyword signatures...",
  "Assessing repository commit frequency & evidence...",
  "Generating final engineering profile report..."
];

export default function GithubPage() {
  const { currentUser, profileData, refreshProfile, isFirebaseMock } = useAuth();
  const { skillsMetadata } = useDashboard();
  
  const [githubUrlInput, setGithubUrlInput] = useState("");
  const [githubAnalysis, setGithubAnalysis] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    if (githubLoading) {
      setScanStep(0);
      const interval = setInterval(() => {
        setScanStep(prev => {
          if (prev < SCAN_STAGES.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [githubLoading]);

  const handleSaveGithubUrl = async (url) => {
    try {
      if (isFirebaseMock) {
        const localProfile = JSON.parse(localStorage.getItem("traject_profile")) || {};
        localProfile.githubUrl = url;
        localStorage.setItem("traject_profile", JSON.stringify(localProfile));
      } else if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, { githubUrl: url }, { merge: true });
      }
      await refreshProfile();
    } catch (err) {
      console.error("Error saving github url:", err);
    }
  };

  const analyzeGithub = useCallback(async (url) => {
    if (!url) return;
    setGithubLoading(true);
    setGithubError("");
    const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    
    try {
      const idToken = currentUser ? await currentUser.getIdToken() : "mock-jwt-token";
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      };
      
      const currentSkills = {};
      Object.keys(skillsMetadata).forEach(cat => {
        currentSkills[cat] = skillsMetadata[cat]?.level || 1;
      });

      const res = await fetch(`${API_URL}/api/agent/github`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: currentUser?.uid || "mock-user-123",
          githubUrl: url,
          skills: currentSkills
        })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Could not load GitHub data");
      }
      
      const data = await res.json();
      setGithubAnalysis(data);
    } catch (err) {
      console.error("GitHub Analyzer failed:", err);
      setGithubError("Could not load GitHub data");
    } finally {
      setGithubLoading(false);
    }
  }, [currentUser, skillsMetadata]);

  // Run initial analysis if GitHub URL exists on mount
  useEffect(() => {
    if (profileData?.githubUrl) {
      setGithubUrlInput(profileData.githubUrl);
      analyzeGithub(profileData.githubUrl);
    }
  }, [profileData?.githubUrl, analyzeGithub]);

  const handleAnalyzeClick = async () => {
    if (!githubUrlInput.trim()) return;
    await handleSaveGithubUrl(githubUrlInput.trim());
    await analyzeGithub(githubUrlInput.trim());
  };

  return (
    <div className="github-theme space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FolderGit2 className="w-8 h-8 text-accent-primary" />
            Repository Scan
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-medium">
            Connect and analyze your public repository footprints to verify core engineering skill evidence.
          </p>
        </div>
        {githubAnalysis && (
          <button 
            onClick={() => analyzeGithub(profileData?.githubUrl || githubUrlInput)}
            disabled={githubLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 hover:border-accent-primary/50 hover:bg-accent-primary/10 text-xs font-black text-gray-300 hover:text-accent-primary uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
          >
            <RefreshCw className={`w-4 h-4 ${githubLoading ? "animate-spin text-accent-primary" : ""}`} />
            Re-scan Profile
          </button>
        )}
      </section>

      {/* Main Panel */}
      <div className="github-card bg-surface border border-white/5 p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-8 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none opacity-50" />

        {githubLoading ? (
          <div className="bg-[#111827]/80 border border-[#1F2937] p-8 rounded-xl font-mono text-xs text-left max-w-lg mx-auto shadow-2xl space-y-4 relative z-10">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="text-gray-400 font-sans font-bold uppercase tracking-wider text-[10px]">Diagnostics Code Scanner</span>
            </div>
            <div className="space-y-2.5 min-h-[160px]">
              {SCAN_STAGES.map((stage, idx) => {
                const isCompleted = scanStep > idx;
                const isActive = scanStep === idx;
                const isPending = scanStep < idx;

                if (isPending) return null;

                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between transition-all duration-300 ${
                      isActive ? "text-blue-400 font-bold" : "text-gray-550"
                    }`}
                  >
                    <span>{stage}</span>
                    {isCompleted ? (
                      <span className="text-emerald-500 font-bold">✓ DONE</span>
                    ) : isActive ? (
                      <span className="text-blue-400 font-bold animate-pulse">RUNNING</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="pt-4 border-t border-[#1F2937] flex justify-between items-center text-[10px] text-gray-600 font-bold">
              <span>SCAN PROTOCOL: ACTIVE</span>
              <span>{Math.round((scanStep / (SCAN_STAGES.length - 1)) * 100)}%</span>
            </div>
          </div>
        ) : githubError ? (
          <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-xl text-center space-y-6 relative z-10">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <p className="text-[15px] font-black text-red-400 uppercase tracking-wide">Analysis Protocol Failed</p>
              <p className="text-xs text-red-400/70 font-medium">{githubError}</p>
            </div>
            <div className="max-w-md mx-auto flex gap-3 pt-4">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-accent-primary/20 blur-[10px] rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <input
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={githubUrlInput}
                  onChange={(e) => setGithubUrlInput(e.target.value)}
                  className="w-full relative bg-background border border-white/10 focus:border-accent-primary rounded-lg px-4 py-3 text-[13px] text-white placeholder-gray-600 outline-none transition-all shadow-inner"
                />
              </div>
              <button
                onClick={handleAnalyzeClick}
                className="premium-button px-6 py-3"
              >
                Retry Scan
              </button>
            </div>
          </div>
        ) : !profileData?.githubUrl && !githubAnalysis ? (
          <div className="bg-background/50 border border-white/5 p-12 rounded-xl space-y-6 text-center relative z-10 hover:border-white/10 transition-colors">
            <div className="w-20 h-20 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent-primary/20 shadow-[0_0_30px_rgba(0,212,255,0.15)] transform -rotate-3 hover:rotate-0 transition-all duration-500">
              <FolderGit2 className="w-10 h-10 text-accent-primary" />
            </div>
            <div className="space-y-3">
              <p className="text-lg font-black text-white tracking-tight">System Offline: No Repository Linked</p>
              <p className="text-[13px] text-gray-400 max-w-lg mx-auto leading-relaxed font-medium">
                Connect your GitHub profile URL to initialize the AI scanner. We will analyze your public repositories, languages, and verify your engineering competencies.
              </p>
            </div>
            <div className="max-w-md mx-auto flex gap-3 pt-6">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-accent-primary/20 blur-[10px] rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <input
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={githubUrlInput}
                  onChange={(e) => setGithubUrlInput(e.target.value)}
                  className="w-full relative bg-background border border-white/10 focus:border-accent-primary rounded-lg px-4 py-3 text-[13px] text-white placeholder-gray-500 outline-none transition-all shadow-inner"
                />
              </div>
              <button
                onClick={handleAnalyzeClick}
                className="premium-button px-6 py-3"
              >
                Initialize Scan
              </button>
            </div>
          </div>
        ) : githubAnalysis ? (
          <div className="space-y-10 relative z-10">
            
            {/* Header stats row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-background/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-primary blur-[15px] opacity-20 rounded-full" />
                  <img 
                    src={`https://github.com/${githubAnalysis.username}.png`} 
                    alt={githubAnalysis.username} 
                    className="w-16 h-16 rounded-full border-2 border-accent-primary/50 shadow-[0_0_15px_rgba(0,212,255,0.3)] shrink-0 relative z-10" 
                    onError={(e) => { e.target.src = "https://github.com/github.png" }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-surface z-20" />
                </div>
                <div className="text-left space-y-1">
                  <h4 className="text-lg font-black text-white tracking-tight">{githubAnalysis.username}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-gray-500" />
                      {githubAnalysis.publicRepos} Repositories
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em]">Activity Index</span>
                  <span className="inline-flex items-center px-4 py-2 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-lg font-black text-accent-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]">
                    {githubAnalysis.activityScore}<span className="text-[11px] text-accent-primary/50 ml-1">/100</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Languages & Narrative */}
              <div className="lg:col-span-1 space-y-8">
                {/* Languages Grid */}
                <div className="bg-background border border-white/5 rounded-xl p-6 space-y-4">
                  <h5 className="text-[11px] text-accent-primary font-black uppercase tracking-[0.15em] flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Tech Stack Footprint
                  </h5>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(githubAnalysis.languages || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([lang, count]) => (
                        <div 
                          key={lang} 
                          className="px-3 py-1.5 rounded-md bg-surface border border-white/10 flex items-center gap-2 hover:border-accent-primary/40 transition-colors"
                        >
                          <span className="text-xs font-bold text-gray-200">{lang}</span>
                          <span className="text-[10px] font-black text-accent-primary bg-accent-primary/10 px-1.5 rounded">{count}</span>
                        </div>
                      ))
                    }
                    {Object.keys(githubAnalysis.languages || {}).length === 0 && (
                      <span className="text-xs text-gray-500 font-medium italic">No languages detected</span>
                    )}
                  </div>
                </div>

                {/* AI Narrative Review Panel */}
                <div className="bg-gradient-to-br from-surface to-background border border-white/10 p-6 rounded-xl space-y-5 text-left relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex items-center gap-2.5 text-[11px] font-black text-accent-primary uppercase tracking-widest relative z-10">
                    <Brain className="w-5 h-5 text-accent-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                    AI Diagnostic Report
                  </div>
                  
                  <p className="text-[13px] text-gray-300 leading-relaxed italic font-medium relative z-10 pl-3 border-l-2 border-accent-primary/30">
                    "{githubAnalysis.narrative}"
                  </p>
                  
                  <div className="pt-5 space-y-4 border-t border-white/5 text-xs relative z-10">
                    <div className="flex flex-col gap-1.5 bg-background/50 p-3 rounded-lg border border-white/5">
                      <span className="font-black text-gray-500 uppercase tracking-wider text-[10px]">Top Strength</span>
                      <span className="text-gray-200 font-bold">{githubAnalysis.topStrength}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 bg-background/50 p-3 rounded-lg border border-white/5">
                      <span className="font-black text-gray-500 uppercase tracking-wider text-[10px]">Identified Gap</span>
                      <span className="text-gray-300 font-bold">{githubAnalysis.biggestGap}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 bg-accent-primary/5 p-3 rounded-lg border border-accent-primary/20">
                      <span className="font-black text-accent-primary/70 uppercase tracking-wider text-[10px]">Actionable Protocol</span>
                      <span className="text-accent-primary font-bold">{githubAnalysis.recommendation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Repos & Evidence */}
              <div className="lg:col-span-2 space-y-8">
                {/* Top Repositories */}
                <div className="space-y-4 text-left">
                  <h5 className="text-[11px] text-white font-black uppercase tracking-[0.15em] flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-gray-400" />
                    Primary Codebases
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {githubAnalysis.topRepos?.map((repo, idx) => (
                      <div key={idx} className="bg-background border border-white/5 p-5 rounded-xl flex flex-col justify-between hover:border-accent-primary/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.05)] transition-all group">
                        <div className="space-y-2.5">
                          <a 
                            href={`https://github.com/${githubAnalysis.username}/${repo.name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[13px] font-black text-white group-hover:text-accent-primary transition-colors inline-flex items-start gap-1.5 cursor-pointer leading-tight"
                          >
                            <span className="truncate">{repo.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50 group-hover:opacity-100" />
                          </a>
                          <p className="text-[11px] text-gray-400 line-clamp-2 min-h-[32px] leading-relaxed font-medium">
                            {repo.description || "No description provided."}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[10px] font-bold">
                          <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            ★ {repo.stars}
                          </span>
                          {repo.language && (
                            <span className="px-2 py-0.5 rounded bg-surface border border-white/10 text-gray-300">
                              {repo.language}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill Evidence Verification Table */}
                <div className="space-y-4 text-left">
                  <h5 className="text-[11px] text-white font-black uppercase tracking-[0.15em] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    Evidence-Based Skill Audits
                  </h5>
                  <div className="bg-background border border-white/10 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-medium">
                        <thead>
                          <tr className="border-b border-white/10 bg-surface text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <th className="p-4">Competency Vector</th>
                            <th className="p-4 text-center">Claimed Level</th>
                            <th className="p-4 text-center">Code Evidence</th>
                            <th className="p-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          {githubAnalysis.skillVerifications?.map((v, idx) => {
                            const badgeStyle = {
                              verified: "text-green-400 bg-green-500/10 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]",
                              unverified: "text-red-400 bg-red-500/10 border border-red-500/20",
                              building: "text-accent-primary bg-accent-primary/10 border border-accent-primary/20",
                              gap: "text-gray-400 bg-gray-500/10 border border-gray-500/20"
                            };
                            return (
                              <tr key={idx} className="hover:bg-surface/50 transition-colors">
                                <td className="p-4 font-black text-white">{v.skill}</td>
                                <td className="p-4 text-center font-black">
                                  <span className="bg-surface border border-white/10 px-2 py-1 rounded">
                                    {v.claimed}<span className="text-gray-500 ml-0.5">/5</span>
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  {v.githubEvidence ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-green-400 uppercase tracking-wider">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Not Found</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-[0.1em] ${badgeStyle[v.status] || ""}`}>
                                    {v.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
