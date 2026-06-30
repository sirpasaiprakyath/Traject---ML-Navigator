import { useDashboard, getDifficultyColor } from "../context/DashboardContext";
import { useAuth } from "../context/AuthContext";
import { FolderGit2, Award, Clock, ArrowRight, Compass, Code, Terminal, Server, Layers } from "lucide-react";

export default function ProjectsPage() {
  const { currentUser } = useAuth();
  const { 
    report, 
    startedProjects, 
    handleMarkAsStarted, 
    selectedProject, 
    setSelectedProject 
  } = useDashboard();

  if (!report) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="h-4 w-96 bg-surface rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {[1, 2].map(n => (
            <div key={n} className="h-48 bg-surface rounded-xl border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  const recommendedProjects = report.recommendedProjects || [];

  return (
    <div className="projects-theme space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-accent-primary" />
            Recommended Projects
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-medium">
            Tailor-made to close your verified skill gaps and build your MLE portfolio.
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendedProjects.length > 0 ? (
          recommendedProjects.map((proj, idx) => {
            const projectId = proj.title.replace(/\s+/g, "_").toLowerCase();
            const isStarted = !!startedProjects[projectId];
            return (
              <div key={idx} className="bg-surface border border-white/5 rounded-xl p-6 flex flex-col justify-between space-y-5 hover:border-accent-primary/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.05)] transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-black text-white group-hover:text-accent-primary transition-colors leading-snug">
                      {proj.title}
                    </h4>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider shrink-0 border bg-surface ${getDifficultyColor(proj.difficulty)}`}>
                      {proj.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    {proj.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5 relative z-10">
                  {/* Skills Targeted tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {proj.skillsTargeted?.map((skill, sIdx) => (
                      <span key={sIdx} className="text-[9px] font-bold bg-background border border-white/5 text-gray-400 px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase">
                    <span className="flex items-center gap-1.5 text-accent-primary/80">
                      <Clock className="w-3.5 h-3.5" />
                      {proj.estimatedDays} Days Est.
                    </span>
                    <button
                      onClick={() => setSelectedProject(proj)}
                      className="px-4 py-2 rounded-md bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-black hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] font-extrabold text-[10px] tracking-wide uppercase transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isStarted ? "View Progress" : "Get Started"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-12 rounded-xl border border-dashed border-white/10 text-center text-sm text-gray-400 bg-surface/50 backdrop-blur-sm">
            <Compass className="w-8 h-8 text-accent-primary/50 mx-auto mb-3" />
            No custom projects needed. Your skill ratings align with career benchmark goals.
          </div>
        )}
      </div>

      {/* Guide Modal / Drawer overlay */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto relative shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6 text-left">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors cursor-pointer p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="space-y-3 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider border bg-background ${getDifficultyColor(selectedProject.difficulty)}`}>
                  {selectedProject.difficulty}
                </span>
                <span className="text-[10px] font-black text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-2 py-0.5 rounded uppercase">
                  {selectedProject.estimatedDays} Days Est.
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">{selectedProject.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">
                {selectedProject.description}
              </p>
            </div>

            {/* Skills Targeted */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Skills Targeted</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedProject.skillsTargeted?.map((skill, sIdx) => (
                  <span key={sIdx} className="text-[10px] font-extrabold bg-background text-gray-300 border border-white/10 px-2.5 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent-primary" />
                Execution Plan
              </h4>
              <div className="space-y-4">
                {[
                  { step: "Environment Setup", desc: "Initialize your project repository, configure your Python virtual environment or Node.js space, and install key dependencies." },
                  { step: "Architecture & Scope", desc: "Define the core problem statement, map out data flows, design database schemas, and identify your model architectures." },
                  { step: "Core Implementation", desc: "Develop the model training script, structure data preprocessing steps, serve predictions with a FastAPI gateway, and write tests." },
                  { step: "Deployment & Release", desc: "Dockerize your application, construct a continuous integration checking workflow, deploy to staging/production, and release your repository." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 rounded-lg bg-background/50 border border-white/5">
                    <div className="w-6 h-6 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center text-[10px] font-black shrink-0">
                      0{idx + 1}
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white block">{item.step}</span>
                      <span className="text-[11px] text-gray-400 block leading-relaxed">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
              {startedProjects[selectedProject.title.replace(/\s+/g, "_").toLowerCase()] ? (
                <div className="flex-1 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm text-center flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Project Active
                </div>
              ) : (
                <button
                  onClick={() => handleMarkAsStarted(selectedProject)}
                  className="premium-button flex-1 py-3 text-sm flex justify-center items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  Initialize Project
                </button>
              )}
              <button
                onClick={() => setSelectedProject(null)}
                className="py-3 px-6 rounded-lg border border-white/10 hover:bg-white/5 font-bold text-sm text-gray-300 hover:text-white transition-all duration-300 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

