import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import { 
  UploadCloud, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Brain, 
  TrendingUp, 
  Award, 
  Cpu, 
  Check, 
  Copy 
} from "lucide-react";

const RETR_STAGES = [
  "Initializing parsing environment...",
  "Extracting text from PDF container...",
  "Running optical layout analysis...",
  "Mapping candidate profile structure...",
  "Analyzing technical keyword signatures...",
  "Evaluating project impact metrics...",
  "Generating audit suggestions log..."
];

export default function ResumePage() {
  const { currentUser, profileData } = useAuth();
  const { skillsMetadata } = useDashboard();

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [checkedImprovements, setCheckedImprovements] = useState({});
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedBullets, setCopiedBullets] = useState({});
  const [scanStep, setScanStep] = useState(0);

  useEffect(() => {
    if (resumeLoading) {
      setScanStep(0);
      const interval = setInterval(() => {
        setScanStep(prev => {
          if (prev < RETR_STAGES.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [resumeLoading]);

  const analyzeResume = useCallback(async (file) => {
    if (!file) return;
    setResumeLoading(true);
    setResumeError("");
    setResumeUploaded(true);
    setCheckedImprovements({});
    const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    
    try {
      const idToken = currentUser ? await currentUser.getIdToken() : "mock-jwt-token";
      const headers = {
        "Authorization": `Bearer ${idToken}`
      };
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", currentUser?.uid || "mock-user-123");
      formData.append("careerGoal", profileData?.careerGoal || "MLE");
      
      const currentSkills = {};
      Object.keys(skillsMetadata).forEach(cat => {
        currentSkills[cat] = skillsMetadata[cat]?.level || 1;
      });
      formData.append("skills", JSON.stringify(currentSkills));

      const res = await fetch(`${API_URL}/api/agent/resume`, {
        method: "POST",
        headers,
        body: formData
      });
      
      if (!res.ok) {
        let errMsg = "Could not analyze resume. Make sure it is not a scanned image.";
        try {
          const clone = res.clone();
          const errJson = await clone.json();
          if (errJson && errJson.detail) {
            errMsg = errJson.detail;
          }
        } catch (e) {
          try {
            const errText = await res.text();
            if (errText) errMsg = errText;
          } catch (e2) {}
        }
        throw new Error(errMsg);
      }
      
      const data = await res.json();
      setResumeAnalysis(data);
    } catch (err) {
      console.error("Resume Analyzer failed:", err);
      setResumeError(err.message || "Could not analyze resume. Make sure it is not a scanned image.");
    } finally {
      setResumeLoading(false);
    }
  }, [currentUser, profileData?.careerGoal, skillsMetadata]);

  const handleResumeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      analyzeResume(file);
    }
  };

  const handleResumeDragOver = (e) => {
    e.preventDefault();
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setResumeFile(file);
      analyzeResume(file);
    }
  };

  const resetResume = () => {
    setResumeAnalysis(null);
    setResumeFile(null);
    setResumeUploaded(false);
    setResumeError("");
    setCheckedImprovements({});
    setCopiedBullets({});
  };

  const handleCopySummary = (summaryText) => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyBullet = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBullets(prev => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      setCopiedBullets(prev => ({ ...prev, [idx]: false }));
    }, 2000);
  };

  const toggleImprovementCheck = (idx) => {
    setCheckedImprovements(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="resume-theme space-y-8 pb-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#1F2937]">
        <div>
          <h2 className="text-3xl font-black text-white">Resume ATS Analyzer</h2>
          <p className="text-gray-400 text-sm mt-1">
            Optimize your resume against the industry target standards for {profileData?.careerGoal || "MLE"}.
          </p>
        </div>
        {resumeAnalysis && (
          <button 
            onClick={resetResume}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#374151] hover:bg-[#1F2937] text-xs font-bold text-gray-300 transition-all cursor-pointer shadow-lg animate-fade-in"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset & Upload New
          </button>
        )}
      </section>

      {/* Main Analysis Panel */}
      <div className="bg-[#111827] border border-[#1F2937] p-8 rounded-xl shadow-xl space-y-6">
        
        {resumeLoading ? (
          <div className="bg-[#111827]/80 border border-[#1F2937] p-8 rounded-xl font-mono text-xs text-left max-w-lg mx-auto shadow-2xl space-y-4 relative z-10">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-gray-400 font-sans font-bold uppercase tracking-wider text-[10px]">ATS Recruiter Audit Scan</span>
            </div>
            <div className="space-y-2.5 min-h-[180px]">
              {RETR_STAGES.map((stage, idx) => {
                const isCompleted = scanStep > idx;
                const isActive = scanStep === idx;
                const isPending = scanStep < idx;

                if (isPending) return null;

                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between transition-all duration-300 ${
                      isActive ? "text-emerald-450 font-bold" : "text-gray-550"
                    }`}
                  >
                    <span>{stage}</span>
                    {isCompleted ? (
                      <span className="text-emerald-500 font-bold">✓ RESOLVED</span>
                    ) : isActive ? (
                      <span className="text-emerald-400 font-bold animate-pulse">RUNNING</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="pt-4 border-t border-[#1F2937] flex justify-between items-center text-[10px] text-gray-600 font-bold">
              <span>RECRUITER PIPELINE: ACTIVE</span>
              <span>{Math.round((scanStep / (RETR_STAGES.length - 1)) * 100)}%</span>
            </div>
          </div>
        ) : resumeError ? (
          <div className="bg-[#1F2937]/50 border border-red-500/20 p-8 rounded-xl text-center space-y-5">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-200">Resume Scan Failed</p>
              <p className="text-xs text-gray-405">{resumeError}</p>
            </div>
            <button
              onClick={resetResume}
              className="px-5 py-2.5 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-bold text-white transition-all inline-flex items-center gap-1.5 cursor-pointer mx-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : !resumeAnalysis ? (
          /* DRAG AND DROP CONTAINER */
          <div 
            onDragOver={handleResumeDragOver}
            onDrop={handleResumeDrop}
            className="border-2 border-dashed border-[#374151] hover:border-[#10B981] bg-[#111827] hover:bg-[#111827]/80 rounded-xl p-16 transition-all text-center cursor-pointer group relative"
          >
            <input 
              type="file" 
              accept=".pdf,.docx,.txt" 
              onChange={handleResumeFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7 text-[#10B981]" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-sm font-bold text-white">
                  Drag & drop your resume here, or <span className="text-[#10B981] hover:underline">browse</span>
                </p>
                <p className="text-xs text-gray-405 mt-1 leading-relaxed">
                  Supports PDF, DOCX, and TXT formats up to 5MB. In-memory parsing only — we do not store your files.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ANALYSIS RESULTS DISPLAY */
          <div className="space-y-8 animate-fade-in text-left">
            
            {/* Score circle and Recruiter Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* ATS SCORE CIRCLE RING */}
              <div className="lg:col-span-4 bg-[#1F2937]/35 border border-[#1F2937] p-5 rounded-xl flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className="text-gray-800"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className={
                        resumeAnalysis.resumeIntelligenceScore >= 80 
                          ? "text-emerald-450" 
                          : resumeAnalysis.resumeIntelligenceScore >= 60 
                            ? "text-amber-400" 
                            : "text-red-400"
                      }
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - resumeAnalysis.resumeIntelligenceScore / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{resumeAnalysis.resumeIntelligenceScore}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">ATS Score</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {resumeAnalysis.careerGoal} MATCH
                  </span>
                  <p className="text-[9px] text-gray-500">Word footprint: {resumeAnalysis.resumeLength} chars</p>
                </div>
              </div>

              {/* OVERALL ASSESSMENT TEXT CARD */}
              <div className="lg:col-span-8 bg-gradient-to-br from-[#1F2937] to-[#1E293B] border border-[#1F2937] p-6 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#10B981] uppercase tracking-wider">
                    <Brain className="w-4.5 h-4.5 text-[#10B981]" />
                    ATS Engine Recruiter Review
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed italic font-medium">
                    "{resumeAnalysis.overallAssessment}"
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-800/60 flex flex-wrap justify-between items-center text-[10px] text-gray-400 gap-2">
                  <span>Email: {resumeAnalysis.contactInfo?.email || "Missing"} • Phone: {resumeAnalysis.contactInfo?.phone || "Missing"}</span>
                  <span>Tested for {resumeAnalysis.careerGoal} alignment</span>
                </div>
              </div>
            </div>

            {/* SUB-SCORES GRID */}
            <div className="space-y-2">
              <h5 className="text-[10px] text-gray-450 font-black uppercase tracking-wider">Detailed Structural & Content Scoring</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Structure", val: resumeAnalysis.structureScore },
                  { label: "Content Quality", val: resumeAnalysis.contentQualityScore },
                  { label: "Achievement Metrics", val: resumeAnalysis.achievementScore },
                  { label: "Technical Skills", val: resumeAnalysis.technicalSkillsScore },
                  { label: "Project Quality", val: resumeAnalysis.projectQualityScore },
                  { label: "ATS Compatibility", val: resumeAnalysis.atsCompatibilityScore },
                  { label: "Career Match", val: resumeAnalysis.careerMatchScore }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#1F2937]/35 border border-[#1F2937] p-3.5 rounded-xl flex flex-col justify-between hover:border-gray-700 transition-colors">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-tight">{item.label}</span>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-sm font-black text-white">{item.val}/100</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${item.val >= 80 ? "text-green-400 bg-green-500/10 border border-green-500/10" : item.val >= 60 ? "text-amber-400 bg-amber-500/10 border border-amber-500/10" : "text-red-400 bg-red-500/10 border border-red-500/10"}`}>
                        {item.val >= 80 ? "Strong" : item.val >= 60 ? "Average" : "Critical"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${item.val >= 80 ? "bg-emerald-500" : item.val >= 60 ? "bg-amber-500" : "bg-red-500"}`} 
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KEYWORD PILL GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1F2937]/30 border border-[#1F2937] p-5 rounded-xl space-y-3">
                <h4 className="text-[10px] text-gray-450 font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Keywords Found ({resumeAnalysis.foundKeywords?.length || 0})</span>
                  <span className="text-emerald-450 font-bold">{resumeAnalysis.keywordCoverage}</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {resumeAnalysis.foundKeywords?.map((kw, i) => (
                    <span key={i} className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-405 px-2.5 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                  {(!resumeAnalysis.foundKeywords || resumeAnalysis.foundKeywords.length === 0) && (
                    <span className="text-[10px] text-gray-500 font-medium italic">No role-specific keywords detected.</span>
                  )}
                </div>
              </div>

              <div className="bg-[#1F2937]/30 border border-[#1F2937] p-5 rounded-xl space-y-3">
                <h4 className="text-[10px] text-gray-455 font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Critical Keyword Gaps ({resumeAnalysis.missingKeywords?.length || 0})</span>
                  <span className="text-red-400 font-bold">Priority Scan Gaps</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {resumeAnalysis.missingKeywords?.map((kw, i) => (
                    <span key={i} className="text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                  {(!resumeAnalysis.missingKeywords || resumeAnalysis.missingKeywords.length === 0) && (
                    <span className="text-[10px] text-emerald-400 font-bold italic">Perfect keyword coverage!</span>
                  )}
                </div>
              </div>
            </div>

            {/* STRENGTHS VS WEAKNESSES LISTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1F2937]/30 border border-[#1F2937] p-5 rounded-xl space-y-3.5">
                <h4 className="text-[10px] text-gray-450 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Top 5 Resume Strengths
                </h4>
                <ul className="space-y-2.5 text-xs">
                  {resumeAnalysis.strengths?.map((str, i) => (
                    <li key={i} className="flex gap-2 text-gray-300">
                      <span className="text-emerald-400 shrink-0 select-none">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#1F2937]/30 border border-[#1F2937] p-5 rounded-xl space-y-3.5">
                <h4 className="text-[10px] text-gray-455 font-black uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-405" />
                  Top 5 Gaps & Weaknesses
                </h4>
                <ul className="space-y-2.5 text-xs">
                  {resumeAnalysis.weaknesses?.map((weak, i) => (
                    <li key={i} className="flex gap-2 text-gray-300">
                      <span className="text-red-400 shrink-0 select-none">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* WEAK BULLET OPTIMIZER */}
            <div className="bg-[#1F2937]/30 border border-[#1F2937] p-5 rounded-xl space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Recruiter-Grade Bullet Point Optimizer
              </h4>
              {resumeAnalysis.bulletRewrites && resumeAnalysis.bulletRewrites.length > 0 ? (
                <div className="space-y-4">
                  {resumeAnalysis.bulletRewrites.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-[#111827]/60 border border-gray-800 p-4 rounded-xl">
                      {/* Left Column: Original Phrasing + Reason */}
                      <div className="space-y-2 flex flex-col justify-between text-left">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block">Original Phrasing:</span>
                          <p className="text-xs text-gray-400 leading-relaxed italic">"{item.original}"</p>
                        </div>
                        <div className="pt-2 border-t border-gray-800/40">
                          <span className="text-[9px] font-bold text-gray-500 block leading-tight">Reason: {item.reason}</span>
                        </div>
                      </div>
                      
                      {/* Right Column: Revision + Copy Revision Button */}
                      <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-gray-800 lg:pl-4 pt-3 lg:pt-0 flex flex-col justify-between text-left">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">ATS-Optimized Revision:</span>
                          <p className="text-xs text-emerald-100 leading-relaxed font-semibold font-mono">"{item.suggested}"</p>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleCopyBullet(item.suggested, idx)}
                            className="px-3 py-1.5 rounded bg-[#1F2937] hover:bg-[#374151] text-gray-300 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-bold border border-gray-700 cursor-pointer shadow-sm active:scale-95"
                            title="Copy revision"
                          >
                            {copiedBullets[idx] ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Revision</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed italic text-center py-6 bg-[#111827]/40 border border-gray-800 rounded-xl">
                  No weak bullet points detected that require optimization. Good job!
                </p>
              )}
            </div>

            {/* PORTFOLIO PROJECT IMPROVEMENT CARDS */}
            {resumeAnalysis.projectImprovementSuggestions && resumeAnalysis.projectImprovementSuggestions.length > 0 && (
              <div className="bg-[#1F2937]/30 border border-[#1F2937] p-5 rounded-xl space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-400" />
                  Portfolio Project Quality Suggestions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumeAnalysis.projectImprovementSuggestions.map((item, idx) => (
                    <div key={idx} className="bg-[#111827]/60 border border-[#1F2937] p-4 rounded-xl space-y-2 flex flex-col justify-between hover:border-blue-500/20 transition-colors">
                      <div className="space-y-1 text-left">
                        <span className="text-xs font-bold text-white block">{item.projectTitle}</span>
                        <p className="text-xs text-gray-300 leading-relaxed">{item.suggestion}</p>
                      </div>
                      <div className="pt-2 border-t border-gray-800/40 text-[8px] text-gray-500 font-extrabold uppercase tracking-wider text-left">
                        Targeted Omissions Critique
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CAREER GOAL MATCH FEEDBACK */}
            {resumeAnalysis.roleAlignmentFeedback && (
              <div className="bg-[#1F2937]/30 border border-[#1F2937] p-5 rounded-xl space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#10B981]" />
                  Career Alignment Assessment ({resumeAnalysis.careerGoal})
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  {resumeAnalysis.roleAlignmentFeedback}
                </p>
              </div>
            )}

            {/* IMPROVED SUMMARY COPY CONTAINER */}
            <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#1F2937] p-5 rounded-xl space-y-3 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-[#10B981]" />
                  ATS-Optimized Summary Suggester
                </h4>
                <button
                  onClick={() => handleCopySummary(resumeAnalysis.improvedSummary)}
                  className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-bold border border-gray-700 cursor-pointer"
                  title="Copy summary"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-450" />
                      <span className="text-emerald-450">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-[#111827]/80 border border-gray-800 rounded-lg p-3.5 text-left">
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{resumeAnalysis.improvedSummary}"
                </p>
              </div>
              <p className="text-[9px] text-gray-500 font-semibold italic text-left">
                Tip: Use this summary at the top of your resume to increase keyword matching frequency with automatic screening models.
              </p>
            </div>

            {/* ACTIONABLE IMPROVEMENTS CHECKLIST */}
            {resumeAnalysis.prioritizedActionPlan && resumeAnalysis.prioritizedActionPlan.length > 0 && (
              <div className="bg-[#1F2937]/25 border border-[#1F2937] p-5 rounded-xl space-y-4">
                <div className="border-b border-[#1F2937] pb-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Prioritized Action Plan (Step-by-Step)
                  </h4>
                  <p className="text-[10px] text-gray-450 font-medium">Follow this sequence of actions to systematically optimize your resume</p>
                </div>
                <div className="space-y-3">
                  {resumeAnalysis.prioritizedActionPlan.map((item, idx) => {
                    const isChecked = !!checkedImprovements[idx];
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleImprovementCheck(idx)}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isChecked ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "bg-[#1F2937]/45 border-transparent hover:border-gray-700"}`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-500 bg-transparent"}`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        <span className={`text-xs ${isChecked ? "line-through text-gray-500 font-medium" : "text-gray-250 font-semibold"}`}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
