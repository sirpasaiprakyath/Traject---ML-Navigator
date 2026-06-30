import { useAuth } from "../context/AuthContext";
import { useDashboard, SKILL_CATEGORIES } from "../context/DashboardContext";
import { 
  User, 
  Cpu, 
  FolderGit2, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Database, 
  Brain, 
  Award, 
  Calendar
} from "lucide-react";

export default function ModalsContainer() {
  const { currentUser, isFirebaseMock } = useAuth();
  const {
    showUpdateSkillsModal,
    setShowUpdateSkillsModal,
    updateFormStep,
    setUpdateFormStep,
    isUpdating,
    updatePipelineState,
    updatePipelineLog,
    updatePipelineError,
    updateFullName,
    setUpdateFullName,
    updateAcademicYear,
    setUpdateAcademicYear,
    updateBranch,
    setUpdateBranch,
    updateCareerGoal,
    setUpdateCareerGoal,
    updateSkills,
    updateProjectCount,
    updateProjectsList,
    handleUpdateProjectCountChange,
    updateUpdateProjectField,
    updateWeeklyHours,
    setUpdateWeeklyHours,
    updateGithubUrl,
    setUpdateGithubUrl,
    skillsMetadata,
    activeModes,
    setActiveModes,
    assessedSkill,
    setAssessedSkill,
    dsaProblems,
    setDsaProblems,
    dsaEasyIndep,
    setDsaEasyIndep,
    dsaTopics,
    setDsaTopics,
    sqlConcepts,
    setSqlConcepts,
    mlConcepts,
    setMlConcepts,
    statsConcepts,
    setStatsConcepts,
    mlopsConcepts,
    setMlopsConcepts,
    sysdesignConcepts,
    setSysdesignConcepts,
    toolsConcepts,
    setToolsConcepts,
    projCountAssessed,
    setProjCountAssessed,
    projDeployAssessed,
    setProjDeployAssessed,
    projFeaturesAssessed,
    setProjFeaturesAssessed,
    assessmentResult,
    setAssessmentResult,
    handleUpdateSkillsSubmit,
    runAssessment,
    handleUpdateSkillChange,
    setSkillsMetadata,
    setUpdateSkills
  } = useDashboard();

  return (
    <>
      {/* 4-Step Update Skills Wizard Modal */}
      {showUpdateSkillsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-white/10 rounded-2xl max-w-2xl w-full relative shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Update Profile & Skills</h3>
                <p className="text-xs text-gray-400 mt-1">Step {updateFormStep} of 4</p>
                {/* Progress Indicators */}
                <div className="flex items-center gap-1.5 mt-3">
                  {[1, 2, 3, 4].map(s => (
                    <div 
                      key={s} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s === updateFormStep ? "w-8 bg-accent-primary" : s < updateFormStep ? "w-3 bg-accent-primary/40" : "w-3 bg-gray-700"
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setShowUpdateSkillsModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold p-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* STEP 1: Basic Info */}
              {updateFormStep === 1 && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2 uppercase tracking-wider">
                    <User className="w-4 h-4 text-accent-primary" />
                    Basic Information
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={updateFullName}
                      onChange={(e) => setUpdateFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-background/60 border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Academic Year</label>
                      <select
                        value={updateAcademicYear}
                        onChange={(e) => setUpdateAcademicYear(e.target.value)}
                        className="w-full bg-background/60 border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200"
                      >
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Branch / Degree</label>
                      <input
                        type="text"
                        required
                        value={updateBranch}
                        onChange={(e) => setUpdateBranch(e.target.value)}
                        placeholder="e.g. CSE or IT"
                        className="w-full bg-background/60 border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Career Goal</label>
                    <select
                      value={updateCareerGoal}
                      onChange={(e) => setUpdateCareerGoal(e.target.value)}
                      className="w-full bg-background/60 border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200"
                    >
                      <option value="MLE">Machine Learning Engineer (MLE)</option>
                      <option value="Data Scientist">Data Scientist</option>
                      <option value="AI Engineer">AI Engineer</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: Skills Self-Assessment */}
              {updateFormStep === 2 && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2 uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-accent-primary" />
                    Skill Self-Assessment
                  </h4>
                  <p className="text-xs text-gray-400">
                    Update your self-assessment ratings in the key MLE engineering categories below.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {SKILL_CATEGORIES.map(cat => {
                      const isAssessedSkill = true;
                      return (
                        <div key={cat.key} className="space-y-1.5 p-3 rounded-lg border border-white/10 bg-background/40 text-left">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="text-xs font-bold text-white block">{cat.label}</span>
                              <span className="text-[9px] text-gray-500">{cat.desc}</span>
                            </div>
                          </div>

                          {isAssessedSkill && (
                            <div className="flex gap-2 mb-2 border-b border-gray-800 pb-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveModes(prev => ({ ...prev, [cat.key]: 'manual' }));
                                  handleUpdateSkillChange(cat.key, updateSkills[cat.key]);
                                }}
                                className={`px-2.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                                  activeModes[cat.key] === 'manual' ? 'bg-accent-primary text-white' : 'bg-surface/50 text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                Rate Myself
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveModes(prev => ({ ...prev, [cat.key]: 'assessment' }));
                                }}
                                className={`px-2.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                                  activeModes[cat.key] === 'assessment' ? 'bg-accent-primary text-white' : 'bg-surface/50 text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                Help Me Assess
                              </button>
                            </div>
                          )}

                          {(!isAssessedSkill || activeModes[cat.key] === 'manual') ? (
                            <div className="space-y-2 mt-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-semibold italic text-[10px]">Self Reported</span>
                                <span className="text-xs font-black text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded border border-accent-primary/50/20">
                                  {updateSkills[cat.key]}/5
                                </span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={updateSkills[cat.key]}
                                onChange={(e) => handleUpdateSkillChange(cat.key, e.target.value)}
                                className="w-full cursor-pointer accent-accent-primary"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2 mt-2">
                              {skillsMetadata[cat.key].method === 'manual' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssessedSkill(cat.key);
                                    if (cat.key === "DSA") {
                                      setDsaProblems("0-10");
                                      setDsaEasyIndep("No");
                                      setDsaTopics([]);
                                    } else if (cat.key === "SQL") {
                                      setSqlConcepts([]);
                                    } else if (cat.key === "ML Knowledge") {
                                      setMlConcepts([]);
                                    } else if (cat.key === "Projects") {
                                      setProjCountAssessed("None");
                                      setProjDeployAssessed("None");
                                      setProjFeaturesAssessed([]);
                                    } else if (cat.key === "Statistics") {
                                      setStatsConcepts([]);
                                    } else if (cat.key === "MLOps") {
                                      setMlopsConcepts([]);
                                    } else if (cat.key === "System Design") {
                                      setSysdesignConcepts([]);
                                    } else if (cat.key === "Tools") {
                                      setToolsConcepts([]);
                                    }
                                    setAssessmentResult(null);
                                  }}
                                  className="w-full py-1.5 px-3 bg-accent-primary/15 border border-accent-primary/50/30 text-accent-primary rounded-lg text-[10px] font-bold hover:bg-accent-primary/25 transition-all text-center cursor-pointer"
                                >
                                  Start Assessment
                                </button>
                              ) : (
                                <div className="space-y-2 bg-black/30 p-2 rounded border border-gray-800">
                                  <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded w-fit uppercase">
                                        ✓ Evidence Verified
                                      </span>
                                      <span className="text-[9px] text-gray-500 mt-1">Confidence: {skillsMetadata[cat.key].confidence}%</span>
                                    </div>
                                    <span className="text-xs font-black text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded border border-accent-primary/50/20 font-sans">
                                      {updateSkills[cat.key]}/5
                                    </span>
                                  </div>

                                  {skillsMetadata[cat.key].reasoning && (
                                    <div className="text-[9px] space-y-0.5 pt-1.5 border-t border-gray-800/40 text-gray-400">
                                      <div>
                                        <span className="font-semibold text-gray-300">Strong: </span>
                                        {skillsMetadata[cat.key].reasoning.strong.slice(0, 2).join(", ") || "None"}
                                      </div>
                                      {skillsMetadata[cat.key].reasoning.missing.length > 0 && (
                                        <div>
                                          <span className="font-semibold text-gray-300">Gaps: </span>
                                          {skillsMetadata[cat.key].reasoning.missing.slice(0, 2).join(", ") || "None"}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex gap-2 mt-2 pt-1.5 border-t border-gray-800/40">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAssessedSkill(cat.key);
                                        const meta = skillsMetadata[cat.key];
                                        if (cat.key === "DSA") {
                                          setDsaProblems(meta.problems || "0-10");
                                          setDsaEasyIndep(meta.easyIndep || "No");
                                          setDsaTopics(meta.topics || []);
                                        } else if (cat.key === "SQL") {
                                          setSqlConcepts(meta.sqlConcepts || []);
                                        } else if (cat.key === "ML Knowledge") {
                                          setMlConcepts(meta.mlConcepts || []);
                                        } else if (cat.key === "Projects") {
                                          setProjCountAssessed(meta.projCount || "None");
                                          setProjDeployAssessed(meta.projDeploy || "None");
                                          setProjFeaturesAssessed(meta.projFeatures || []);
                                        } else if (cat.key === "Statistics") {
                                          setStatsConcepts(meta.statsConcepts || []);
                                        } else if (cat.key === "MLOps") {
                                          setMlopsConcepts(meta.mlopsConcepts || []);
                                        } else if (cat.key === "System Design") {
                                          setSysdesignConcepts(meta.sysdesignConcepts || []);
                                        } else if (cat.key === "Tools") {
                                          setToolsConcepts(meta.toolsConcepts || []);
                                        }
                                        setAssessmentResult(null);
                                      }}
                                      className="flex-1 py-1 px-1.5 bg-gray-800 text-gray-300 hover:text-white rounded text-[9px] font-semibold text-center cursor-pointer"
                                    >
                                      Re-assess
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveModes(prev => ({ ...prev, [cat.key]: 'manual' }));
                                        handleUpdateSkillChange(cat.key, updateSkills[cat.key]);
                                      }}
                                      className="flex-1 py-1 px-1.5 bg-gray-800 text-gray-300 hover:text-white rounded text-[9px] font-semibold text-center cursor-pointer"
                                    >
                                      Edit Manually
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Portfolio Projects */}
              {updateFormStep === 3 && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2 uppercase tracking-wider">
                    <FolderGit2 className="w-4 h-4 text-accent-primary" />
                    Portfolio Projects
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                      Number of completed MLE/Engineering projects
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={updateProjectCount}
                      onChange={(e) => handleUpdateProjectCountChange(e.target.value)}
                      className="w-20 bg-background/60 border border-white/10 focus:border-accent-primary/50 rounded-lg px-3 py-2 text-xs text-white outline-none transition-all duration-200"
                    />
                  </div>

                  {updateProjectCount === 0 ? (
                    <div className="p-6 rounded-lg border border-dashed border-white/10 text-center bg-background/20">
                      <p className="text-gray-400 text-xs font-medium">
                        No projects declared.
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        We will recommend project milestones targeting your primary gaps.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 pr-1">
                      {updateProjectsList.map((proj, idx) => (
                        <div key={idx} className="p-4 rounded-lg border border-white/10 bg-background/40 space-y-3">
                          <span className="text-[10px] font-black text-accent-primary uppercase tracking-wider">Project #{idx + 1}</span>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              required
                              placeholder="Project Title (e.g. Image Classifier)"
                              value={proj.title}
                              onChange={(e) => updateUpdateProjectField(idx, "title", e.target.value)}
                              className="w-full bg-background border border-white/10 focus:border-accent-primary/50 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              required
                              placeholder="One-line description of tech stack and results"
                              value={proj.description}
                              onChange={(e) => updateUpdateProjectField(idx, "description", e.target.value)}
                              className="w-full bg-background border border-white/10 focus:border-accent-primary/50 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Commitments & GitHub */}
              {updateFormStep === 4 && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-accent-primary" />
                    Commitment & GitHub
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                      Weekly study hours
                    </label>
                    <select
                      value={updateWeeklyHours}
                      onChange={(e) => setUpdateWeeklyHours(parseInt(e.target.value))}
                      className="w-full bg-background/60 border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200"
                    >
                      <option value={5}>5 hours / week</option>
                      <option value={10}>10 hours / week</option>
                      <option value={15}>15 hours / week</option>
                      <option value={20}>20+ hours / week</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                      GitHub profile URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={updateGithubUrl}
                      onChange={(e) => setUpdateGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="w-full bg-background/60 border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-655 outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-background/30 flex justify-between items-center">
              {updateFormStep > 1 ? (
                <button
                  onClick={() => setUpdateFormStep(updateFormStep - 1)}
                  className="px-4 py-2 rounded-lg border border-white/10 hover:bg-[#1E293B] text-xs font-semibold text-gray-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {updateFormStep < 4 ? (
                <button
                  onClick={() => {
                    if (updateFormStep === 1 && (!updateFullName.trim() || !updateBranch.trim())) {
                      alert("Please enter your name and branch degree.");
                      return;
                    }
                    setUpdateFormStep(updateFormStep + 1);
                  }}
                  className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleUpdateSkillsSubmit}
                  className="px-5 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary text-xs font-black text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Update & Recalculate
                  <Cpu className="w-3.5 h-3.5 animate-pulse" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Agent Update Pipeline Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-[#0F0F0F] z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-white/10 p-8 text-center shadow-2xl relative overflow-hidden">
            
            {updatePipelineState !== "done" && updatePipelineState !== "error" && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#1F2937] overflow-hidden">
                <div className="h-full bg-accent-primary animate-pulse w-[40%] rounded" />
              </div>
            )}

            <h2 className="text-xl font-black text-white mb-6 tracking-tight flex items-center justify-center gap-2.5">
              <Cpu className="w-5 h-5 text-accent-primary animate-spin" />
              Updating Career Roadmap
            </h2>
            
            <p className="text-xs text-gray-400 mb-8 max-w-xs mx-auto">
              Our multi-agent engine is analyzing your profile update and compiling your new MLE readiness package.
            </p>

            {/* Pipeline Stage Indicators */}
            <div className="space-y-3.5 text-left max-w-xs mx-auto">
              {[
                { state: "profile", label: "Analyzing profile...", desc: "Agent 1: Profile Analyzer", icon: User },
                { state: "skillgap", label: "Calculating skill gaps...", desc: "Agent 2: Skill Gap Agent", icon: Cpu },
                { state: "score", label: "Generating readiness score...", desc: "Agent 3: Readiness Assessment Agent", icon: Cpu },
                { state: "projects", label: "Selecting projects...", desc: "Agent 4: Project Advisor Agent", icon: Award },
                { state: "resources", label: "Curating resources...", desc: "Agent 5: Learning Strategy Agent", icon: Calendar },
                { state: "mentor", label: "Generating mentor analysis...", desc: "Agent 6: Mentor Analysis Agent", icon: Brain },
                { state: "memory", label: "Saving profile...", desc: "Agent 7: Memory Agent", icon: Database }
              ].map((stage, idx) => {
                const isCompleted = [
                  "profile", "skillgap", "score", "projects", "resources", "mentor", "memory", "done"
                ].indexOf(updatePipelineState) > idx;
                const isActive = updatePipelineState === stage.state;

                return (
                  <div 
                    key={stage.state} 
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-300 ${
                      isActive 
                        ? "border-accent-primary/50/40 bg-accent-primary/5 shadow" 
                        : isCompleted 
                          ? "border-green-500/20 bg-green-950/10" 
                          : "border-white/10 bg-background"
                    }`}
                  >
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
                      ) : (
                        <stage.icon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <span className={`text-xs font-semibold block ${isActive ? "text-white" : isCompleted ? "text-gray-400" : "text-gray-500"}`}>
                        {stage.label}
                      </span>
                      <span className="text-[9px] text-gray-500 block">{stage.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Realtime logs */}
            <div className="mt-8 p-3 rounded bg-black/60 border border-white/10 text-left font-mono text-[10px] text-gray-400 max-h-[80px] overflow-y-auto scrollbar-thin">
              <span className="text-accent-primary font-bold block mb-1">&gt; Logs:</span>
              {updatePipelineLog}
            </div>

            {/* Error handling */}
            {updatePipelineError && (
              <div className="mt-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-left space-y-3">
                <p className="text-xs text-red-200 font-semibold">{updatePipelineError}</p>
                <button
                  onClick={handleUpdateSkillsSubmit}
                  className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-xs font-bold text-white transition-all"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment Modal Overlay */}
      {assessedSkill && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-white/10 rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 text-left my-8">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setAssessedSkill(null);
                setAssessmentResult(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            {!assessmentResult ? (
              // Questionnaire Phase
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Assess Your {assessedSkill} Level</h3>
                  <p className="text-xs text-gray-450 mt-1">Provide evidence to verify your skill proficiency.</p>
                </div>

                {assessedSkill === "DSA" && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-450 block uppercase tracking-wider">How many DSA/LeetCode problems have you solved?</label>
                      <select
                        value={dsaProblems}
                        onChange={(e) => setDsaProblems(e.target.value)}
                        className="w-full bg-background border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="0-10">0-10 problems</option>
                        <option value="10-50">10-50 problems</option>
                        <option value="50-150">50-150 problems</option>
                        <option value="150+">150+ problems</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-450 block uppercase tracking-wider">Can you solve LeetCode Easy problems independently?</label>
                      <select
                        value={dsaEasyIndep}
                        onChange={(e) => setDsaEasyIndep(e.target.value)}
                        className="w-full bg-background border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="No">No</option>
                        <option value="Sometimes">Sometimes</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-450 block uppercase tracking-wider">Which topics can you confidently implement? (Select all)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Arrays", "Hashing", "Two Pointers", "Sliding Window", "Binary Search", "Trees", "Graphs"].map(topic => {
                          const checked = dsaTopics.includes(topic);
                          return (
                            <button
                              type="button"
                              key={topic}
                              onClick={() => {
                                if (checked) {
                                  setDsaTopics(prev => prev.filter(t => t !== topic));
                                } else {
                                  setDsaTopics(prev => [...prev, topic]);
                                }
                              }}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                                checked 
                                  ? 'border-accent-primary/50 bg-accent-primary/10 text-white font-semibold' 
                                  : 'border-white/10 hover:border-gray-700 bg-black/25 text-gray-400'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                checked ? 'bg-accent-primary border-accent-primary/50 text-white' : 'border-gray-600'
                              }`}>
                                {checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                              </div>
                              <span className="text-xs">{topic}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {assessedSkill === "SQL" && (
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Which SQL concepts have you implemented in practice? (Select all)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["SELECT", "GROUP BY", "JOINS", "Subqueries", "Window Functions"].map(concept => {
                        const checked = sqlConcepts.includes(concept);
                        return (
                          <button
                            type="button"
                            key={concept}
                            onClick={() => {
                              if (checked) {
                                setSqlConcepts(prev => prev.filter(c => c !== concept));
                              } else {
                                setSqlConcepts(prev => [...prev, concept]);
                              }
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                              checked 
                                ? 'border-accent-primary/50 bg-accent-primary/10 text-white font-semibold' 
                                : 'border-white/10 hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-accent-primary border-accent-primary/50 text-white' : 'border-gray-600'
                            }`}>
                              {checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                            <span className="text-xs">{concept}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assessedSkill === "Projects" && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Number of ML/Engineering projects completed:</label>
                      <select
                        value={projCountAssessed}
                        onChange={(e) => setProjCountAssessed(e.target.value)}
                        className="w-full bg-background border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="None">None</option>
                        <option value="1-2">1-2 projects</option>
                        <option value="3+">3+ projects</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Deployment Status:</label>
                      <select
                        value={projDeployAssessed}
                        onChange={(e) => setProjDeployAssessed(e.target.value)}
                        className="w-full bg-background border border-white/10 focus:border-accent-primary/50 rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="None">None deployed / Local script only</option>
                        <option value="Local (Streamlit/API)">Deployed locally (API/Streamlit/Web app)</option>
                        <option value="Cloud production">Deployed to Cloud (AWS, GCP, Vercel, HuggingFace, etc.)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Engineering Features Implemented: (Select all)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {["Data Cleaning Pipeline", "Hyperparameter Tuning", "Model Versioning", "Deep Learning/Transformers", "Custom Loss/Architecture"].map(feat => {
                          const checked = projFeaturesAssessed.includes(feat);
                          return (
                            <button
                              type="button"
                              key={feat}
                              onClick={() => {
                                if (checked) {
                                  setProjFeaturesAssessed(prev => prev.filter(f => f !== feat));
                                } else {
                                  setProjFeaturesAssessed(prev => [...prev, feat]);
                                }
                              }}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                                  checked 
                                    ? 'border-accent-primary/50 bg-accent-primary/10 text-white font-semibold' 
                                    : 'border-white/10 hover:border-gray-700 bg-black/25 text-gray-400'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                checked ? 'bg-accent-primary border-accent-primary/50 text-white' : 'border-gray-600'
                              }`}>
                                {checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                              </div>
                              <span className="text-xs">{feat}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {assessedSkill === "Statistics" && (
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Which statistics and math concepts do you understand? (Select all)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Probability Basics", 
                        "Bayes Theorem", 
                        "Hypothesis Testing (p-values)", 
                        "Linear Regression Math", 
                        "Dimensionality Reduction (PCA)", 
                        "Optimization (Gradient Descent)"
                      ].map(concept => {
                        const checked = statsConcepts.includes(concept);
                        return (
                          <button
                            type="button"
                            key={concept}
                            onClick={() => {
                              if (checked) {
                                setStatsConcepts(prev => prev.filter(c => c !== concept));
                              } else {
                                setStatsConcepts(prev => [...prev, concept]);
                              }
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                              checked 
                                ? 'border-accent-primary/50 bg-accent-primary/10 text-white font-semibold' 
                                : 'border-white/10 hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-accent-primary border-accent-primary/50 text-white' : 'border-gray-600'
                            }`}>
                              {checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                            <span className="text-xs">{concept}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assessedSkill === "MLOps" && (
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Which MLOps practices have you implemented? (Select all)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Git & Version Control", 
                        "Docker Containerization", 
                        "FastAPI/Flask Model Serving", 
                        "CI/CD Pipelines", 
                        "Model Monitoring", 
                        "Cloud VM/Server Deployment", 
                        "Kubernetes/Orchestration"
                      ].map(concept => {
                        const checked = mlopsConcepts.includes(concept);
                        return (
                          <button
                            type="button"
                            key={concept}
                            onClick={() => {
                              if (checked) {
                                setMlopsConcepts(prev => prev.filter(c => c !== concept));
                              } else {
                                setMlopsConcepts(prev => [...prev, concept]);
                              }
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                              checked 
                                ? 'border-accent-primary/50 bg-accent-primary/10 text-white font-semibold' 
                                : 'border-white/10 hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-accent-primary border-accent-primary/50 text-white' : 'border-gray-600'
                            }`}>
                              {checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                            <span className="text-xs">{concept}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assessedSkill === "System Design" && (
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Which ML System Design concepts are you familiar with? (Select all)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "System Architecture (APIs, DBs)", 
                        "Load Balancing", 
                        "Caching (Redis)", 
                        "Latency vs. Throughput", 
                        "Batch vs. Online Prediction", 
                        "Feature Stores", 
                        "Model Quantization/Edge Inference"
                      ].map(concept => {
                        const checked = sysdesignConcepts.includes(concept);
                        return (
                          <button
                            type="button"
                            key={concept}
                            onClick={() => {
                              if (checked) {
                                setSysdesignConcepts(prev => prev.filter(c => c !== concept));
                              } else {
                                setSysdesignConcepts(prev => [...prev, concept]);
                              }
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                              checked 
                                ? 'border-accent-primary/50 bg-accent-primary/10 text-white font-semibold' 
                                : 'border-white/10 hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-accent-primary border-accent-primary/50 text-white' : 'border-gray-600'
                            }`}>
                              {checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                            <span className="text-xs">{concept}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assessedSkill === "Tools" && (
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Which developer tools have you used in projects? (Select all)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Python (Advanced)", 
                        "SQL Databases (Postgres, etc.)", 
                        "PyTorch/TensorFlow", 
                        "Git & GitHub", 
                        "Linux/Bash Scripting", 
                        "AWS/GCP/Azure", 
                        "Weights & Biases / MLflow"
                      ].map(concept => {
                        const checked = toolsConcepts.includes(concept);
                        return (
                          <button
                            type="button"
                            key={concept}
                            onClick={() => {
                              if (checked) {
                                setToolsConcepts(prev => prev.filter(c => c !== concept));
                              } else {
                                setToolsConcepts(prev => [...prev, concept]);
                              }
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                              checked 
                                ? 'border-accent-primary/50 bg-accent-primary/10 text-white font-semibold' 
                                : 'border-white/10 hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-accent-primary border-accent-primary/50 text-white' : 'border-gray-600'
                            }`}>
                              {checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                            <span className="text-xs">{concept}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assessedSkill === "ML Knowledge" && (
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-gray-455 block uppercase tracking-wider">Which ML concepts can you confidently explain? (Select all)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Train/Test Split", 
                        "Overfitting", 
                        "Precision vs Recall", 
                        "Cross Validation", 
                        "Feature Engineering", 
                        "Ensemble Models", 
                        "Deep Learning Basics"
                      ].map(concept => {
                        const checked = mlConcepts.includes(concept);
                        return (
                          <button
                            type="button"
                            key={concept}
                            onClick={() => {
                              if (checked) {
                                setMlConcepts(prev => prev.filter(c => c !== concept));
                              } else {
                                setMlConcepts(prev => [...prev, concept]);
                              }
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                              checked 
                                ? 'border-accent-primary/50 bg-accent-primary/10 text-white font-semibold' 
                                : 'border-white/10 hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-accent-primary border-accent-primary/50 text-white' : 'border-gray-600'
                            }`}>
                              {checked && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                            <span className="text-xs">{concept}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => runAssessment(assessedSkill)}
                    className="flex-1 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary font-bold text-sm text-white transition-all cursor-pointer text-center"
                  >
                    Calculate Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssessedSkill(null);
                      setAssessmentResult(null);
                    }}
                    className="py-2.5 px-6 rounded-lg border border-white/10 hover:bg-[#1E1E22] font-semibold text-sm text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Results Phase
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Assessment Complete: {assessedSkill}</h3>
                  <p className="text-xs text-gray-450 mt-1">Based on the provided evidence, here is the estimation of your current level.</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-black/35 border border-white/10/40 font-sans">
                  <div>
                    <span className="text-xs font-semibold text-gray-550 block uppercase tracking-wider">Estimated Level</span>
                    <span className="text-accent-primaryxl font-extrabold text-accent-primary">{assessmentResult.rating} <span className="text-lg text-gray-500 font-normal">/ 5</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-555 block uppercase tracking-wider">Confidence Level</span>
                    <span className="text-lg font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded">{assessmentResult.confidence}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-widest">✓ Strong Areas</span>
                    {assessmentResult.reasoning.strong.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {assessmentResult.reasoning.strong.map(s => (
                          <span key={s} className="text-xs bg-green-500/10 border border-green-500/25 text-green-400 px-2 py-0.5 rounded font-medium">✓ {s}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">None identified</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-widest">✗ Missing Areas</span>
                    {assessmentResult.reasoning.missing.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {assessmentResult.reasoning.missing.map(m => (
                          <span key={m} className="text-xs bg-red-500/10 border border-red-500/25 text-red-400 px-2 py-0.5 rounded font-medium">✗ {m}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">None identified</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      // Save to updateSkills & skillsMetadata
                      setUpdateSkills(prev => ({ ...prev, [assessedSkill]: assessmentResult.rating }));
                      setSkillsMetadata(prev => ({
                        ...prev,
                        [assessedSkill]: {
                          level: assessmentResult.rating,
                          confidence: assessmentResult.confidence,
                          evidence_count: assessmentResult.evidence_count,
                          method: "assessment",
                          last_assessed_at: new Date().toISOString(),
                          reasoning: assessmentResult.reasoning,
                          problems: assessedSkill === "DSA" ? dsaProblems : undefined,
                          easyIndep: assessedSkill === "DSA" ? dsaEasyIndep : undefined,
                          topics: assessedSkill === "DSA" ? dsaTopics : undefined,
                          sqlConcepts: assessedSkill === "SQL" ? sqlConcepts : undefined,
                          mlConcepts: assessedSkill === "ML Knowledge" ? mlConcepts : undefined,
                          projCount: assessedSkill === "Projects" ? projCountAssessed : undefined,
                          projDeploy: assessedSkill === "Projects" ? projDeployAssessed : undefined,
                          projFeatures: assessedSkill === "Projects" ? projFeaturesAssessed : undefined,
                          statsConcepts: assessedSkill === "Statistics" ? statsConcepts : undefined,
                          mlopsConcepts: assessedSkill === "MLOps" ? mlopsConcepts : undefined,
                          sysdesignConcepts: assessedSkill === "System Design" ? sysdesignConcepts : undefined,
                          toolsConcepts: assessedSkill === "Tools" ? toolsConcepts : undefined
                        }
                      }));
                      setActiveModes(prev => ({ ...prev, [assessedSkill]: "assessment" }));
                      setAssessedSkill(null);
                      setAssessmentResult(null);
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary font-bold text-sm text-white transition-all cursor-pointer text-center font-sans"
                  >
                    Accept Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModes(prev => ({ ...prev, [assessedSkill]: "manual" }));
                      setAssessedSkill(null);
                      setAssessmentResult(null);
                    }}
                    className="py-2.5 px-5 rounded-lg border border-white/10 hover:bg-[#1E1E22] font-semibold text-sm text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    Edit Manually
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
