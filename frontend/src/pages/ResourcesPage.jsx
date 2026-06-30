import { useDashboard } from "../context/DashboardContext";
import { BookOpen, ExternalLink, Trophy, Compass, Library, PlayCircle } from "lucide-react";

// Markdown parsing helper to handle raw markdown links in resource fields
const parseMarkdownLink = (text) => {
  if (!text) return null;
  const match = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (match) {
    return { name: match[1], url: match[2] };
  }
  return null;
};

const getResourceDetails = (res) => {
  let name = res.resourceName || "";
  let url = res.url || "";
  
  const parsedName = parseMarkdownLink(name);
  if (parsedName) {
    name = parsedName.name;
    url = parsedName.url;
  }
  
  const parsedUrl = parseMarkdownLink(url);
  if (parsedUrl) {
    if (!parsedName) name = parsedUrl.name;
    url = parsedUrl.url;
  }
  
  return { name, url };
};

const getResourceTypeColor = (type) => {
  switch (type) {
    case "Course": return "bg-blue-500/10 border border-blue-500/20 text-blue-400";
    case "Documentation": return "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400";
    case "GitHub": return "bg-slate-500/10 border border-slate-500/20 text-slate-400";
    case "Research Paper": return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    case "Video": return "bg-red-500/10 border border-red-500/20 text-red-400";
    default: return "bg-slate-800 border border-slate-700 text-slate-400";
  }
};

export default function ResourcesPage() {
  const { report } = useDashboard();

  if (!report) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="h-4 w-96 bg-surface rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-surface rounded-xl border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  // Group resources by category
  const groupedResources = {};
  if (report.recommendedResources) {
    report.recommendedResources.forEach((res) => {
      const cat = res.category || "General";
      if (!groupedResources[cat]) {
        groupedResources[cat] = [];
      }
      groupedResources[cat].push(res);
    });
  }

  const kaggleCompetitions = report.kaggleCompetitions || [];

  return (
    <div className="knowledge-theme space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <section className="pb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Library className="w-8 h-8 text-accent-primary" />
            Knowledge Base
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-medium">
            Curated pathways, documentation, and models to close your skill gaps.
          </p>
        </div>
      </section>

      {/* Free Learning Resources Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-accent-primary rounded-full shadow-[0_0_10px_#00d4ff]" />
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-primary" />
              Learning Resources
            </h3>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-0.5">Targeted materials for impact</p>
          </div>
        </div>

        {Object.keys(groupedResources).length > 0 ? (
          <div className="space-y-10">
            {Object.entries(groupedResources).map(([category, resList]) => (
              <div key={category} className="space-y-4">
                <h4 className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em] bg-accent-primary/5 w-fit px-3 py-1.5 rounded border border-accent-primary/20 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse" />
                  {category} Gaps
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {resList.map((res, idx) => {
                    const details = getResourceDetails(res);
                    return (
                      <div key={idx} className="bg-surface border border-white/5 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-accent-primary/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.05)] transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        <div className="space-y-3 relative z-10 text-left">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="bg-accent-primary/10 border border-accent-primary/20 text-accent-primary px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                              {res.category || category}
                            </span>
                            {res.type && (
                              <span className={`border px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getResourceTypeColor(res.type)}`}>
                                {res.type}
                              </span>
                            )}
                          </div>
                          <h5 className="text-white font-black text-[15px] leading-snug group-hover:text-accent-primary transition-colors">
                            {details.name}
                          </h5>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 relative z-10">
                          <span className="text-gray-500 text-xs font-bold flex items-center gap-1.5">
                            <PlayCircle className="w-3.5 h-3.5" />
                            ~{res.estimatedHours || 10} hrs
                          </span>
                          <a 
                            href={details.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-black hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] border border-accent-primary/20 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-md transition-all duration-300"
                          >
                            Open Resource
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-xl border border-dashed border-white/10 text-center text-sm text-gray-400 bg-surface/50 backdrop-blur-sm">
            <Compass className="w-8 h-8 text-accent-primary/50 mx-auto mb-3" />
            Ready status active. No additional resources needed at this time.
          </div>
        )}
      </section>

      {/* Kaggle Competitions Section */}
      <section className="space-y-8 pt-8 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]" />
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Kaggle Arenas
            </h3>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-0.5">Benchmark your models globally</p>
          </div>
        </div>

        {kaggleCompetitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {kaggleCompetitions.map((comp, idx) => (
              <div key={idx} className="bg-surface border border-white/5 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="space-y-3 relative z-10 text-left">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                      {comp.type || "Competition"}
                    </span>
                    {comp.difficulty && (
                      <span className="bg-background border border-white/10 text-gray-400 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                        {comp.difficulty}
                      </span>
                    )}
                  </div>
                  <h5 className="text-white font-black text-[15px] leading-snug group-hover:text-amber-400 transition-colors">
                    {comp.title}
                  </h5>
                  {comp.description && (
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {comp.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-end items-center pt-4 border-t border-white/5 relative z-10">
                  <a 
                    href={comp.url || "https://www.kaggle.com/competitions"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-500/20 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-md transition-all duration-300"
                  >
                    View Competition
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-xl border border-dashed border-white/10 text-center text-sm text-gray-400 bg-surface/50 backdrop-blur-sm">
            <Trophy className="w-8 h-8 text-amber-500/50 mx-auto mb-3" />
            No active Kaggle recommendations at this time. Finish core projects to unlock challenges!
          </div>
        )}
      </section>
    </div>
  );
}
