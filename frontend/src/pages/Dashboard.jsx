import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard, getScoreColor, getDifficultyColor } from "../context/DashboardContext";
import { 
  AlertTriangle, 
  Brain, 
  TrendingUp, 
  Award, 
  Flame, 
  User, 
  Cpu, 
  FolderGit2, 
  Clock, 
  ArrowRight,
  ChevronRight,
  BookOpen,
  GitBranch,
  FileText
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip
} from "recharts";

const BOOT_STAGES = [
  "Initializing Career Engine...",
  "Loading Candidate Profile...",
  "Retrieving Career Memory...",
  "Analyzing Skill Assessments...",
  "Scanning GitHub Evidence...",
  "Reading Resume Intelligence...",
  "Calculating Career Readiness...",
  "Comparing Against Hiring Benchmarks...",
  "Building Personalized Strategy...",
  "Mission Ready."
];

export default function Dashboard() {
  const { currentUser, profileData, refreshProfile } = useAuth();
  const { 
    report, 
    loading, 
    error, 
    isBackendUnreachable, 
    fetchLatestReport,
    progressData,
    getScoreDifference,
    skillsMetadata
  } = useDashboard();

  const [bootComplete, setBootComplete] = useState(() => {
    return sessionStorage.getItem("traject_booted") === "true";
  });
  const [bootStep, setBootStep] = useState(() => {
    return sessionStorage.getItem("traject_booted") === "true" ? BOOT_STAGES.length - 1 : 0;
  });

  useEffect(() => {
    if (loading) {
      if (sessionStorage.getItem("traject_booted") !== "true") {
        setBootStep(0);
        setBootComplete(false);
      }
    }
  }, [loading]);

  useEffect(() => {
    if (bootComplete) return;

    if (bootStep < BOOT_STAGES.length - 1) {
      if (bootStep === 8 && loading) {
        return;
      }
      const timer = setTimeout(() => {
        setBootStep(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setBootComplete(true);
        sessionStorage.setItem("traject_booted", "true");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [bootStep, bootComplete, loading]);

  if (error && !report) {
    // Keep error check first
  } else if (!bootComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0c0d12] flex flex-col items-center justify-center p-6 font-mono text-left">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="w-full max-w-lg bg-[#111827]/80 border border-[#1F2937] rounded-xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-[#1F2937] pb-4 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="text-xs text-gray-400 ml-2 font-sans font-bold">Traject Career OS - Boot Diagnostics</span>
          </div>

          <div className="space-y-3.5 min-h-[300px] flex flex-col justify-start">
            {BOOT_STAGES.map((stage, idx) => {
              const isCompleted = bootStep > idx;
              const isActive = bootStep === idx;
              const isPending = bootStep < idx;

              if (isPending) return null;

              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between text-xs transition-all duration-300 ${
                    isActive ? "text-blue-400 font-extrabold" : isCompleted ? "text-gray-400" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600">[{idx + 1}]</span>
                    <span>{stage}</span>
                  </div>
                  {isCompleted ? (
                    <span className="text-emerald-500 font-bold font-sans">✓ RESOLVED</span>
                  ) : isActive ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      <span className="text-blue-400 font-bold uppercase tracking-wider text-[9px] animate-pulse">Running</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-[#1F2937] space-y-2">
            <div className="flex justify-between text-[10px] text-gray-500 font-bold font-sans">
              <span>SYSTEM INITIALIZATION</span>
              <span>{Math.round((bootStep / (BOOT_STAGES.length - 1)) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${(bootStep / (BOOT_STAGES.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-white text-left font-sans">
        <div className="glass-panel rounded-card border border-red-500/20 bg-[#1F2937] p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Failed to Load Dashboard</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {error}
            </p>
          </div>
          <button
            onClick={fetchLatestReport}
            className="w-full py-2.5 rounded-lg bg-[#3B82F6] hover:bg-blue-600 font-bold text-white transition-all duration-200 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const scoreDetails = report ? getScoreColor(report.readinessScore) : { text: "text-gray-400", stroke: "#4B5563", bg: "bg-gray-800/10", border: "border-gray-800/20" };
  const hoursCommit = profileData?.weeklyHours || 10;
  
  const getMonthsFromTimeline = (timelineStr) => {
    if (!timelineStr) return "3";
    const match = timelineStr.match(/~(\d+)\s+months/i) || timelineStr.match(/in\s+(\d+)\s+months/i);
    return match ? match[1] : "3";
  };
  
  const estMonths = report ? getMonthsFromTimeline(report.timeline) : "3";
  const halvedMonths = Math.max(1, Math.round(Number(estMonths) / 2));
  const isReadyNow = (report?.timeline || "").toLowerCase().includes("ready right now") || (report?.timeline || "").toLowerCase().includes("job-ready");

  const formatDate = (val) => {
    if (!val) return "";
    const date = new Date(parseInt(val));
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getCategoryProgress = () => {
    const categories = [
      "ML Knowledge", "DSA", "Projects", "Statistics",
      "SQL", "MLOps", "System Design", "Tools"
    ];
    const list = [];
    if (progressData.history.length === 0) return list;
    
    const firstSkills = progressData.history[0].skills || {};
    const latestSkills = progressData.history[progressData.history.length - 1].skills || {};
    
    categories.forEach(cat => {
      const firstVal = firstSkills[cat] !== undefined ? firstSkills[cat] : 3;
      const latestVal = latestSkills[cat] !== undefined ? latestSkills[cat] : 3;
      let arrow = "→";
      let color = "text-gray-500";
      
      if (latestVal > firstVal) {
        arrow = "↑";
        color = "text-green-500 font-extrabold";
      } else if (latestVal < firstVal) {
        arrow = "↓";
        color = "text-red-500 font-extrabold";
      }
      
      list.push({
        category: cat,
        firstVal,
        latestVal,
        arrow,
        color
      });
    });
    return list;
  };

  // 4 quick stat cards
  const skillGapsCount = report?.skillGaps?.filter(g => g.gap > 0).length || 0;
  const topSkillGap = report?.skillGaps?.[0]?.category || "None";
  
  let daysTracked = 1;
  if (progressData.history.length >= 1) {
    const firstTime = parseInt(progressData.history[0].savedAt);
    const lastTime = parseInt(progressData.history[progressData.history.length - 1].savedAt);
    const diffTime = Math.abs(lastTime - firstTime);
    daysTracked = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="dashboard-theme space-y-8 pb-12">
      {/* Unreachable Backend Alert Banner */}
      {isBackendUnreachable && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-205 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce text-left">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>Could not connect to backend. Make sure the local backend API server is running on port 8000.</span>
          </div>
          <button 
            onClick={fetchLatestReport}
            className="px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* API warning or fallback message banner */}
      {error && !isBackendUnreachable && (
        <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-250 text-xs flex items-center gap-3 text-left">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {report && (
        <div className="space-y-8">
                    {/* Mission Control Hero */}
          <header className="mission-control-hero space-y-6 pb-6 border-b border-[#1F2937]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-left">
                <h2 className="premium-title text-3xl font-black text-white">
                  Welcome back, {profileData?.name || currentUser?.displayName || "MLE Student"}
                </h2>
                <p className="text-gray-400 text-sm mt-1">Here is where your career preparedness stands today.</p>
              </div>
              <div className="text-left md:text-right text-xs bg-[#1F2937] border border-[#374151] px-4 py-2.5 rounded-xl shadow-lg">
                <div className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Target Goal</div>
                <div className="text-white font-extrabold text-sm">{profileData?.careerGoal || "MLE"}</div>
                <div className="text-gray-405 text-[10px] mt-0.5">{profileData?.academicYear ? `${profileData.academicYear} Year` : "3rd Year"} Student</div>
              </div>
            </div>

            {/* Today's Mission Objective */}
            {report.nextActionSkill && (
              <div className="premium-card premium-blue bg-gradient-to-r from-blue-950/35 via-blue-950/15 to-transparent border border-blue-500/20 p-6 rounded-xl shadow-xl flex flex-col sm:flex-row items-start gap-4 text-left">
                <div className="today-icon-glow shrink-0 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] animate-pulse">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Today's Mission</h3>
                    <span className="bg-blue-500/15 border border-blue-500/30 text-blue-450 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                      Highest Impact Action
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    Based on your profile, your highest impact action today is: <strong className="text-[#3B82F6]">{report.nextActionSkill.category}</strong>.
                  </p>
                  <p className="text-sm text-white leading-relaxed">
                    Here is what to do: <span className="font-semibold">{report.nextActionSkill.actionStep}</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Estimated time: <strong>{report.nextActionSkill.estimatedHours} hours</strong> to close this gap.</span>
                  </div>
                </div>
              </div>
            )}
          </header>          {/* Quick Stats Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#1F2937] p-4.5 rounded-xl shadow shadow-black/40 text-left">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Readiness Score</span>
              <span className="text-2xl font-black text-white mt-1 block">{report.readinessScore}/100</span>
            </div>
            <div className="bg-[#111827] border border-[#1F2937] p-4.5 rounded-xl shadow shadow-black/40 text-left">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Remaining Gaps</span>
              <span className="text-2xl font-black text-orange-400 mt-1 block">{skillGapsCount} skill gaps</span>
            </div>
            <div className="bg-[#111827] border border-[#1F2937] p-4.5 rounded-xl shadow shadow-black/40 text-left">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Highest Priority Gap</span>
              <span className="text-sm font-extrabold text-[#3B82F6] mt-2 block truncate">{topSkillGap}</span>
            </div>
            <div className="bg-[#111827] border border-[#1F2937] p-4.5 rounded-xl shadow shadow-black/40 text-left">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Tracking Duration</span>
              <span className="text-2xl font-black text-emerald-450 mt-1 block">{daysTracked} {daysTracked === 1 ? "day" : "days"}</span>
            </div>
          </section>

          {/* Core Analytics Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            
            {/* Circular Ring Gauge - Career Readiness */}
            <div className="premium-card premium-success lg:col-span-4 bg-[#111827] border border-[#1F2937] p-6 rounded-xl shadow-xl flex flex-col items-center justify-between min-h-[350px]">
              <div className="w-full">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Career Readiness</h3>
                <p className="text-xs text-gray-550">Synthesized from 8 core engineering skills</p>
              </div>

              <div className="readiness-ring-glow relative w-36 h-36 my-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22C55E" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="text-[#131A2E]"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - report.readinessScore / 100)}
                    strokeLinecap="round"
                    stroke="url(#readinessGrad)"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="metric-number text-4xl font-black text-white leading-none">{report.readinessScore}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Ready %</span>
                  <div className="mt-2 text-[9px] font-bold text-center">
                    {progressData.history.length >= 2 ? (
                      (() => {
                        const diff = getScoreDifference();
                        if (diff > 0) {
                          return <span className="text-green-505 font-extrabold">+{diff} since last update</span>;
                        } else if (diff < 0) {
                          return <span className="text-red-500 font-extrabold">{diff} since last update</span>;
                        } else {
                          return <span className="text-gray-500">No change since last update</span>;
                        }
                      })()
                    ) : (
                      <span className="text-gray-500">No change yet</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${scoreDetails.bg} ${scoreDetails.border} ${scoreDetails.text}`}>
                <Award className="w-3.5 h-3.5" />
                {report.readinessScore >= 75 ? "Job Ready" : report.readinessScore >= 45 ? "Target Approaching" : "Needs Foundation"}
              </div>
              
              <p className="text-gray-400 text-xs leading-relaxed bg-[#0F0F0F]/60 border border-[#1F2937] p-3 rounded-lg w-full mt-4">
                {isReadyNow ? (
                  <span>You are committing <strong>{hoursCommit} hrs/week</strong>. You're MLE internship-ready right now! Focus on advanced system design and mock interviews.</span>
                ) : (
                  <span>You are committing <strong>{hoursCommit} hrs/week</strong>. At this pace you will be internship-ready in <strong>~{estMonths} months</strong>. Doubling your study hours could cut that time in half (to <strong>~{halvedMonths} months</strong>).</span>
                )}
              </p>
            </div>

            {/* Senior ML Mentor Card */}
            <div className="premium-card premium-ai lg:col-span-8 bg-[#111827] border border-[#1F2937] border-l-4 border-l-[#3B82F6] p-6 rounded-xl shadow-xl flex flex-col justify-between min-h-[350px]">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Brain className="mentor-icon-glow w-4 h-4 text-[#3B82F6]" />
                  Senior ML Engineering Mentor
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  {/* Left part: Conversational Review */}
                  <div className="md:col-span-7 space-y-4 text-left">
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Review Briefing</span>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">
                        {report.profileSummary}
                      </p>
                    </div>
                    {report.nextActionSkill && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Direct Directive</span>
                        <p className="text-xs text-white leading-relaxed">
                          Close the <strong className="text-[#3B82F6]">{report.nextActionSkill.category}</strong> gap immediately by completing: <span className="font-semibold text-gray-300">{report.nextActionSkill.actionStep}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right part: Structured Signals */}
                  <div className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 text-left">
                    <div className="space-y-3">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">System Diagnostics</span>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400 font-medium">Strongest Signal:</span>
                          <span className="text-emerald-450 font-bold font-mono">
                            {report.strongAreas?.[0] || "None"}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400 font-medium">Weakest Signal:</span>
                          <span className="text-orange-400 font-bold font-mono">
                            {report.weakAreas?.[0] || "None"}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400 font-medium">Hiring Risk:</span>
                          <span className="text-red-400 font-bold font-mono">
                            {report.careerRiskAreas?.[0]?.category ? `${report.careerRiskAreas[0].category} Gaps` : "Low"}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400 font-medium">System Confidence:</span>
                          <span className="text-blue-400 font-bold font-mono">
                            {(() => {
                              const verifiedCount = Object.values(skillsMetadata).filter(m => m.method === "assessment").length;
                              return `${Math.round(60 + (verifiedCount / 8) * 40)}%`;
                            })()}
                          </span>
                        </div>
                      </div>
                      
                      {report.careerRiskAreas && report.careerRiskAreas.length > 0 && (
                        <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-lg space-y-1 mt-2">
                          <div className="text-[9px] font-black text-red-400 uppercase tracking-wider">Critical Risk Identified</div>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            {report.careerRiskAreas[0].rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-4 pt-4 border-t border-gray-855 text-left">
                Inputs verified via Firestore • Evaluation pipeline status locked
              </div>
            </div>

            {/* Row 3: Longitudinal Growth Timeline */}
            <div className="timeline-card lg:col-span-12 bg-[#111827] border border-[#1F2937] p-6 rounded-xl shadow-xl flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4 w-full">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#3B82F6]" />
                  Longitudinal Growth Timeline
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left part: Chart */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Readiness Index Trajectory</span>
                      {progressData.improvement > 0 ? (
                        <span className="text-emerald-400 text-xs font-bold font-mono">
                          +{progressData.improvement} overall growth score delta
                        </span>
                      ) : null}
                    </div>

                    {progressData.history.length >= 2 ? (
                      <div className="h-44 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={progressData.history}>
                            <XAxis 
                              dataKey="savedAt" 
                              tickFormatter={formatDate}
                              stroke="#4B5563"
                              fontSize={8}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              stroke="#4B5563"
                              fontSize={8}
                              tickLine={false}
                              width={15}
                            />
                            <ChartTooltip 
                              contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px' }}
                              labelStyle={{ color: '#9CA3AF', fontSize: '8px' }}
                              itemStyle={{ color: '#3B82F6', fontSize: '10px', padding: 0 }}
                              labelFormatter={(value) => formatDate(value)}
                              formatter={(value) => [`Score: ${value}`]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="totalScore" 
                              stroke="#3B82F6" 
                              strokeWidth={2}
                              dot={{ r: 3, fill: '#3B82F6', stroke: '#111827', strokeWidth: 1.5 }}
                              activeDot={{ r: 5, fill: '#3B82F6', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-44 w-full flex items-center justify-center border border-dashed border-[#1F2937] rounded-lg mt-2 bg-[#0F0F0F]/50 text-center p-3">
                        <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                          Complete multiple skill updates to activate longitudinal trajectory tracking.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right part: Category Shifts logs */}
                  <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6 text-left">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Category Rating Shifts</span>
                    {progressData.history.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                        {getCategoryProgress().map((item, idx) => (
                          <div key={idx} className="bg-[#1F2937]/45 border border-white/5 rounded-lg p-2 text-[10px] flex justify-between items-center">
                            <span className="text-gray-300 font-medium truncate block leading-tight">{item.category}</span>
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="text-gray-500">{item.firstVal}</span>
                              <span className="text-gray-600">→</span>
                              <span className="text-white">{item.latestVal}</span>
                              <span className={`${item.color} font-black text-[10px]`}>{item.arrow}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-500 italic">No ratings history recorded yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Project Recommendations */}
            <div className="projects-card lg:col-span-12 bg-[#111827] border border-[#1F2937] p-6 rounded-xl shadow-xl space-y-4 text-left">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-[#3B82F6]" />
                  Custom Recommended Projects
                </h3>
                <span className="text-[10px] text-[#3B82F6] font-bold uppercase tracking-wider">Dynamic Roadmap Modules</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.recommendedProjects && report.recommendedProjects.slice(0, 2).map((proj, idx) => (
                  <div key={idx} className="bg-[#1F2937]/35 border border-[#1F2937] rounded-xl p-5 flex flex-col justify-between space-y-3 group hover:border-[#3B82F6]/30 transition-all duration-300">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-white group-hover:text-[#3B82F6] transition-colors leading-snug">{proj.title}</h4>
                        <span className={`text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider shrink-0 border bg-surface ${getDifficultyColor(proj.difficulty)}`}>
                          {proj.difficulty}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{proj.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1 text-[#3B82F6]/80">
                        <Clock className="w-3.5 h-3.5" />
                        {proj.estimatedDays} Days Est.
                      </span>
                      <Link to="/projects" className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1.5">
                        <span>Launch Module</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>

          {/* Quick Nav Panel */}
          <section className="bg-[#111827] border border-[#1F2937] p-6 rounded-xl shadow-xl space-y-4 text-left">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Quick Navigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "View Skill Gaps", desc: "Compare verified ratings & score breakdown", url: "/skills", icon: Cpu, color: "text-[#3B82F6]" },
                { title: "Browse Projects", desc: "Start custom learning roadmap milestones", url: "/projects", icon: FolderGit2, color: "text-amber-500" },
                { title: "Open Resume Analyzer", desc: "Analyze PDF resume against MLE target", url: "/resume", icon: FileText, color: "text-emerald-500" },
                { title: "Analyze GitHub", desc: "Scan public repos for codebase footprints", url: "/github", icon: GitBranch, color: "text-purple-500" }
              ].map((link, idx) => (
                <Link 
                  key={idx} 
                  to={link.url}
                  className="bg-[#1F2937]/35 border border-[#1F2937] hover:border-[#3B82F6]/30 p-4.5 rounded-xl hover:bg-[#1F2937]/50 transition-all flex justify-between items-center group cursor-pointer"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <link.icon className={`w-4.5 h-4.5 ${link.color}`} />
                      <span className="text-xs font-black text-white group-hover:text-[#3B82F6] transition-colors">{link.title}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium leading-tight block">{link.desc}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-650 group-hover:text-[#3B82F6] transition-all transform group-hover:translate-x-1 shrink-0" />
                </Link>
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
