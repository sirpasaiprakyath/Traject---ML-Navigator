import { useDashboard, SKILL_CATEGORIES, BENCHMARKS } from "../context/DashboardContext";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";

const MILESTONES = [
  {
    title: "MLE Foundation",
    description: "Basic ML concepts understood",
    criteria: "Score 40+",
    threshold: 40,
    icon: "🌱"
  },
  {
    title: "Internship Ready",
    description: "Meets minimum benchmark on all core skills",
    criteria: "Score 65+",
    threshold: 65,
    icon: "🎯"
  },
  {
    title: "Junior MLE Role",
    description: "Strong across all skill categories",
    criteria: "Score 75+",
    threshold: 75,
    icon: "💼"
  },
  {
    title: "Senior Competencies",
    description: "Expert level across MLOps + System Design",
    criteria: "Score 85+",
    threshold: 85,
    icon: "🚀"
  }
];

export default function SkillsPage() {
  const { currentUser } = useAuth();
  const { 
    report, 
    skillsMetadata, 
    handleOpenUpdateSkills 
  } = useDashboard();

  if (!report) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded" />
        <div className="h-4 w-96 bg-gray-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="h-80 bg-[#111827] rounded-xl border border-[#1F2937]" />
          <div className="h-80 bg-[#111827] rounded-xl border border-[#1F2937]" />
        </div>
      </div>
    );
  }

  // Build Radar Chart Data
  const radarData = SKILL_CATEGORIES.map(cat => {
    // If the skill isn't initialized, default to 3
    const rating = skillsMetadata[cat.key]?.level ?? report.scoreBreakdown?.[cat.key] ?? 3;
    const ratingVal = typeof rating === "number" ? (rating > 5 ? Math.round((rating / 100) * 12) : rating) : 3;
    
    // We want a scale of 1-5 for the Radar chart
    const benchmark = BENCHMARKS[cat.key] || 3;
    return {
      subject: cat.label,
      Rating: ratingVal,
      Target: benchmark,
      fullMark: 5
    };
  });

  const currentScore = report.readinessScore || 0;
  
  // Find the index of the next milestone that hasn't been achieved yet
  const nextMilestoneIndex = MILESTONES.findIndex(m => currentScore < m.threshold);

  return (
    <div className="readiness-theme space-y-8 pb-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#1F2937]">
        <div className="text-left">
          <h2 className="text-3xl font-black text-white">Skills Gap & Profile</h2>
          <p className="text-gray-400 text-sm mt-1">
            Compare your core engineering competencies against the MLE benchmark profile.
          </p>
        </div>
        <button 
          onClick={handleOpenUpdateSkills}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs transition-all duration-200 cursor-pointer shadow-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Update My Profile</span>
        </button>
      </section>

      {/* FIX 3 — SCORE EXPLANATION CARD */}
      <div className="bg-[#1F2937] border-l-4 border-l-[#3B82F6] p-5 rounded-r-xl text-left space-y-3 shadow-lg">
        <h4 className="text-sm font-extrabold text-white">How your score is calculated</h4>
        <p className="text-xs text-gray-300 leading-relaxed font-medium">
          Your Readiness Score is weighted — matching the minimum benchmark earns ~68/100. To reach 80+, 
          you need to exceed benchmarks in high-weight skills like ML Knowledge (25%) and Projects (20%).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1.5 gap-x-6 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-800">
          <div className="flex justify-between border-b border-gray-800/40 pb-1 sm:pb-0 sm:border-0">
            <span>ML Knowledge</span>
            <span className="font-mono text-[#3B82F6] font-bold">25%</span>
          </div>
          <div className="flex justify-between border-b border-gray-800/40 pb-1 sm:pb-0 sm:border-0">
            <span>Projects</span>
            <span className="font-mono text-[#3B82F6] font-bold">20%</span>
          </div>
          <div className="flex justify-between border-b border-gray-800/40 pb-1 sm:pb-0 sm:border-0">
            <span>DSA</span>
            <span className="font-mono text-[#3B82F6] font-bold">15%</span>
          </div>
          <div className="flex justify-between border-b border-gray-800/40 pb-1 sm:pb-0 sm:border-0">
            <span>Statistics</span>
            <span className="font-mono text-[#3B82F6] font-bold">10%</span>
          </div>
          <div className="flex justify-between border-b border-gray-800/40 pb-1 sm:pb-0 sm:border-0">
            <span>SQL</span>
            <span className="font-mono text-[#3B82F6] font-bold">10%</span>
          </div>
          <div className="flex justify-between border-b border-gray-800/40 pb-1 sm:pb-0 sm:border-0">
            <span>MLOps</span>
            <span className="font-mono text-[#3B82F6] font-bold">10%</span>
          </div>
          <div className="flex justify-between border-b border-gray-800/40 pb-1 sm:pb-0 sm:border-0">
            <span>System Design</span>
            <span className="font-mono text-[#3B82F6] font-bold">5%</span>
          </div>
          <div className="flex justify-between">
            <span>Tools</span>
            <span className="font-mono text-[#3B82F6] font-bold">5%</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Radar Chart Panel */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1F2937] p-6 rounded-xl shadow-xl space-y-4 text-left">
          <div className="border-l-[3px] border-l-[#3B82F6] pl-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Skill Mapping</h3>
            <p className="text-xs text-gray-500">Visual mapping of current skills vs MLE target benchmarks</p>
          </div>
          
          <div className="h-[360px] w-full flex items-center justify-center pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={10} fontWeight="bold" />
                <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#4B5563" tickCount={6} fontSize={8} />
                <Radar 
                  name="Your Skills" 
                  dataKey="Rating" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="Internship Ready Minimum" 
                  dataKey="Target" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.1} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs pt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#3B82F6]/30 border border-[#3B82F6] rounded" />
              <span className="text-gray-300 font-medium">Your Skills</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#EF4444]/20 border border-[#EF4444] rounded" />
              <span className="text-gray-300 font-medium">Internship Ready Minimum</span>
            </div>
          </div>

          {/* Radar Chart Note */}
          <p className="text-[12px] text-[#9CA3AF] text-center mt-3 italic leading-relaxed">
            The red line shows the MINIMUM skill level needed for internship readiness — not the maximum score. 
            Exceeding these benchmarks pushes your score above 70.
          </p>
        </div>

        {/* Action Panel / Fast Track */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#1F2937] p-6 rounded-xl shadow-xl flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="border-l-[3px] border-l-[#3B82F6] pl-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Strategic Recommendation</h3>
              <p className="text-xs text-gray-500">How to fast-track your progression</p>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-3 mt-4">
              <div className="flex items-center gap-2 text-[#3B82F6]">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Gap Mitigation Plan</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                Your highest prioritised gap is <strong className="text-white">{report.skillGaps?.[0]?.category || "System Design"}</strong>. Closing this specific gap by studying targeted resources will add the most points to your overall career readiness.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">MLE Career Milestones</span>
              <div className="space-y-2.5">
                {MILESTONES.map((item, idx) => {
                  const achieved = currentScore >= item.threshold;
                  const isNext = idx === nextMilestoneIndex;
                  const pointsAway = item.threshold - currentScore;

                  return (
                    <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-[#0F172A]/40 border border-gray-800 text-left gap-3">
                      <span className="text-xl shrink-0 select-none mt-0.5">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{item.title}</span>
                        <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">{item.description}</span>
                        <span className="text-[9px] text-gray-500 font-medium block mt-1">Target: {item.criteria}</span>
                        
                        {isNext && (
                          <div className="mt-2 space-y-1 w-full">
                            <div className="flex justify-between text-[8px] font-bold">
                              <span className="text-blue-400">{pointsAway} {pointsAway === 1 ? "point" : "points"} away</span>
                              <span className="text-gray-500">{currentScore}/{item.threshold}</span>
                            </div>
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="milestone-progress-bar h-full bg-blue-500 transition-all duration-500" 
                                style={{ width: `${Math.max(0, Math.min(100, (currentScore / item.threshold) * 100))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        achieved 
                          ? "text-green-400 bg-green-500/10 border border-green-500/20" 
                          : isNext 
                            ? "text-blue-400 bg-blue-500/10 border border-blue-500/20" 
                            : "text-gray-500 bg-gray-800"
                      }`}>
                        {achieved ? "Achieved" : isNext ? "Next Goal" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: SKILL GAPS LIST */}
      <section className="bg-[#111827] border border-[#1F2937] p-8 rounded-xl shadow-xl space-y-6">
        <div className="border-l-[3px] border-l-[#3B82F6] pl-3 text-left">
          <h3 className="text-lg font-black text-white tracking-tight uppercase text-xs">Priority Skill Gaps</h3>
          <p className="text-xs text-gray-400">Sorted by biggest gap first</p>
        </div>

        {report.skillGaps && report.skillGaps.length > 0 ? (
          <div className="space-y-4">
            {report.skillGaps.map((gap, idx) => (
              <div key={idx} className="bg-[#1F2937] border border-[#374151] rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-md text-left">
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">{gap.category}</span>
                      {(() => {
                        const isAssessed = skillsMetadata[gap.category]?.method === "assessment";
                        return (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isAssessed ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-gray-500 bg-gray-800 border border-gray-700"}`}>
                            {isAssessed ? "Verified" : "Self"}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      Rating: {gap.studentRating}/5 • Target Benchmark: {gap.benchmark}/5
                    </span>
                  </div>
                  
                  {/* Premium progress track comparing student vs benchmark */}
                  <div className="w-full h-2.5 bg-gray-800 rounded-full relative">
                    {/* Benchmark target line indicator */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-[#3B82F6] z-10"
                      style={{ left: `${(gap.benchmark / 5) * 100}%` }}
                      title={`Benchmark target: ${gap.benchmark}/5`}
                    />
                    {/* Student progress fill */}
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${(gap.studentRating / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:justify-end">
                  <span className="inline-block text-xs font-black text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg">
                    -{gap.gap} Benchmark Gap
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-[#1F2937] text-center text-xs text-gray-400 bg-[#0F0F0F]/45">
            <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
            All requirements satisfied! You are meeting or exceeding all MLE benchmark skill scores.
          </div>
        )}
      </section>

      {/* SECTION: SCORE BREAKDOWN GRID */}
      <section className="bg-[#111827] border border-[#1F2937] p-8 rounded-xl shadow-xl space-y-6">
        <div className="border-l-[3px] border-l-[#3B82F6] pl-3 text-left">
          <h3 className="text-lg font-black text-white tracking-tight uppercase text-xs">Detailed Score Contribution</h3>
          <p className="text-xs text-gray-400">How each skill contributes to your total score</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(report.scoreBreakdown || {}).map(([category, weightedScore]) => {
            const SKILL_WEIGHTS = {
              "ML Knowledge": 25,
              "Projects": 20,
              "DSA": 15,
              "Statistics": 10,
              "SQL": 10,
              "MLOps": 10,
              "System Design": 5,
              "Tools": 5
            };
            const weights = {
              "ML Knowledge": 0.25, "Projects": 0.20, "DSA": 0.15,
              "Statistics": 0.10, "SQL": 0.10, "MLOps": 0.10,
              "System Design": 0.05, "Tools": 0.05
            };
            const weight = weights[category] || 0.1;
            const rating = Math.round((weightedScore / 100.0) / weight * 5.0);
            const benchmark = BENCHMARKS[category] || 3;
            const isBelow = rating < benchmark;

            return (
              <div key={category} className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 flex flex-col justify-between shadow-lg relative group hover:border-[#3B82F6]/30 transition-all duration-300 font-sans text-left">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-white group-hover:text-[#3B82F6] transition-colors leading-tight block">{category}</span>
                    <div className="flex flex-col items-end">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isBelow ? "text-orange-400 bg-orange-500/5 border border-orange-500/10" : "text-green-400 bg-green-500/5 border border-green-500/10"}`}>
                        {rating}/5
                      </span>
                      {(() => {
                        const isAssessed = skillsMetadata[category]?.method === "assessment";
                        return (
                          <span className={`text-[8px] font-bold mt-1 px-1 rounded ${isAssessed ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-gray-500 bg-gray-800 border border-gray-700"}`}>
                            {isAssessed ? "✓ Verified" : "Self"}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Rating progress bar */}
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-3 mb-1">
                    <div 
                      className={`h-full ${isBelow ? "bg-orange-500" : "bg-green-500"}`} 
                      style={{ width: `${(rating / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase mt-4 pt-2 border-t border-gray-800/50">
                  <span>Target: {benchmark}/5</span>
                  <span className="text-gray-450">Weight: {SKILL_WEIGHTS[category]}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
