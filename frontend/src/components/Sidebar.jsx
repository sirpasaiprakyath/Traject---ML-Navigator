import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard, getScoreColor } from "../context/DashboardContext";
import { 
  LayoutDashboard, 
  BarChart3, 
  FolderKanban, 
  BookOpen, 
  GitBranch, 
  FileText,
  LogOut,
  RefreshCw,
  Terminal,
  Layers,
  Code
} from "lucide-react";

export default function Sidebar() {
  const { logout, profileData, currentUser } = useAuth();
  const { report, handleOpenUpdateSkills } = useDashboard();

  const handleLogout = () => {
    sessionStorage.removeItem("traject_booted");
    logout();
  };

  const navItems = [
    { to: "/dashboard", label: "Command Center", icon: Terminal },
    { to: "/skills", label: "Skill Diagnostics", icon: BarChart3 },
    { to: "/projects", label: "Project Modules", icon: Layers },
    { to: "/resources", label: "Knowledge Base", icon: BookOpen },
    { to: "/github", label: "Repository Scan", icon: GitBranch },
    { to: "/resume", label: "Resume Optimizer", icon: FileText }
  ];

  const score = report?.readinessScore || 0;
  const scoreColor = getScoreColor(score).stroke;
  const scoreTextColor = getScoreColor(score).text;

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="glass-surface hidden md:flex flex-col fixed top-0 left-0 h-screen w-[260px] glass-panel bg-darkBg/60 text-gray-400 py-6 px-4 z-40 justify-between shadow-premium transition-all duration-300 overflow-y-auto scrollbar-thin">
        {/* Top: Logo & User Profile */}
        <div className="space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-electricBlue/10 border border-electricBlue/20 flex items-center justify-center font-display font-black text-electricBlue text-xl accent-glow">
              T
            </div>
            <div>
              <h1 className="text-xl font-display font-black text-white leading-none tracking-tight text-glow">Traject</h1>
              <span className="text-[9px] text-electricBlue uppercase tracking-[0.2em] font-extrabold flex items-center gap-1 mt-0.5 font-display">
                <div className="w-1.5 h-1.5 rounded-full bg-electricBlue animate-pulse accent-glow" />
                MLE Mentor
              </span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="glass-panel rounded-xl p-4 space-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-electricBlue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="text-[10px] text-gray-400 font-display font-bold uppercase tracking-wider relative z-10 flex justify-between items-center">
              Candidate
              <Code className="w-3 h-3 text-electricBlue/50" />
            </div>
            <div className="text-sm font-display font-black text-white truncate relative z-10 tracking-tight" title={profileData?.name || currentUser?.displayName}>
              {profileData?.name || currentUser?.displayName || "MLE Student"}
            </div>
            <div className="inline-block bg-electricBlue/10 border border-electricBlue/20 text-electricBlue px-2 py-0.5 rounded text-[10px] font-display font-black uppercase tracking-wider relative z-10">
              {profileData?.careerGoal || "MLE"}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-bold transition-all duration-300 ease-out relative group overflow-hidden ${
                      isActive
                        ? "text-electricBlue bg-electricBlue/10 border border-electricBlue/20 accent-glow"
                        : "text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-electricBlue rounded-r shadow-[0_0_10px_#3B82F6]" />}
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${isActive ? "text-electricBlue scale-110" : "group-hover:text-gray-300 group-hover:scale-110"}`} />
                      <span className="tracking-wide font-display">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Mini Widget, Actions & Logout */}
        <div className="space-y-3.5 pt-3.5 border-t border-white/5 relative flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {/* System Status Panel */}
          {report && (
            <div className="bg-[#111827]/40 border border-white/5 rounded-xl p-3.5 space-y-2.5 font-mono text-[9px] text-gray-500 text-left">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                <span className="font-display font-bold uppercase tracking-wider text-[10px] text-white">System Status</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex justify-between items-center">
                <span>AI Engine:</span>
                <span className="text-[#3B82F6] font-bold">ACTIVE (Gemini)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>GitHub API:</span>
                <span className={profileData?.githubUrl ? "text-emerald-400 font-bold" : "text-gray-550"}>
                  {profileData?.githubUrl ? "VERIFIED" : "STANDBY"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Resume Audit:</span>
                <span className={report.resumeSummary ? "text-emerald-450 font-bold" : "text-gray-550"}>
                  {report.resumeSummary ? "COMPLETE" : "PENDING"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Analysis:</span>
                <span className="text-white font-bold">
                  {report.generatedAt ? new Date(report.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just Now"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Target Vector:</span>
                <span className="text-white font-bold">{profileData?.careerGoal || "MLE"}</span>
              </div>
              <div className="flex justify-between items-start gap-1">
                <span className="shrink-0">Active Mission:</span>
                <span className="text-amber-500 font-bold text-right truncate max-w-[120px]">{report.nextActionSkill?.category || "System Design"}</span>
              </div>
            </div>
          )}

          {/* Readiness Score Mini Widget */}
          {report && (
            <div className="flex items-center gap-4 glass-panel rounded-xl p-4 shadow-lg group hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
              {/* Small score ring */}
              <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full blur-[8px] opacity-40" style={{ backgroundColor: scoreColor }} />
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="transparent"
                    stroke={scoreColor}
                    strokeWidth="3.5"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - score / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: "drop-shadow(0px 0px 4px rgba(255,255,255,0.3))" }}
                  />
                </svg>
                <div className="absolute font-mono text-[11px] font-black text-white z-10 text-glow">{score}</div>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-display font-bold">Readiness</p>
                <p className="text-xs font-mono font-bold text-white leading-tight mt-0.5 tracking-tight group-hover:text-electricBlue transition-colors">Index: {score}/100</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleOpenUpdateSkills}
              className="premium-button w-full py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Profile</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-lg text-gray-500 hover:text-white hover:bg-white/5 font-bold text-xs transition-all duration-300 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>End Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar for Mobile (Collapses to Bottom Tab Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-white/10 py-3 px-4 z-50 flex justify-around items-center shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `p-2.5 rounded-xl transition-all duration-300 relative ${
                  isActive 
                    ? "text-accent-primary bg-accent-primary/10 shadow-[0_0_15px_rgba(0,212,255,0.15)]" 
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`
              }
              title={item.label}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" />
                  {isActive && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-primary rounded-full shadow-[0_0_8px_#00d4ff]" />}
                </>
              )}
            </NavLink>
          );
        })}
        {/* Update Skills floating toggle or triggers */}
        <button
          onClick={handleOpenUpdateSkills}
          className="p-2.5 rounded-xl text-accent-primary/70 hover:text-accent-primary hover:bg-accent-primary/10 transition-all duration-300 cursor-pointer"
          title="Update Profile"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
