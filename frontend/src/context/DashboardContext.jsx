import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../firebase";
import { collection, query, orderBy, limit, getDocs, doc, setDoc, addDoc } from "firebase/firestore";

const DashboardContext = createContext();

export function useDashboard() {
  return useContext(DashboardContext);
}

export const SKILL_CATEGORIES = [
  { key: "ML Knowledge", label: "ML Knowledge", desc: "Core ML/DL Concepts" },
  { key: "DSA", label: "DSA", desc: "Data Structures & Algorithms" },
  { key: "Projects", label: "Projects", desc: "Applied/Portfolio Work" },
  { key: "Statistics", label: "Statistics", desc: "Statistics & Math Foundations" },
  { key: "SQL", label: "SQL", desc: "SQL & Data Handling" },
  { key: "MLOps", label: "MLOps", desc: "MLOps & Deployment" },
  { key: "System Design", label: "System Design", desc: "System Design (ML Systems)" },
  { key: "Tools", label: "Tools", desc: "Tools & Engineering (Git, Cloud, Python)" }
];

export const BENCHMARKS = {
  "ML Knowledge": 4, "DSA": 3, "Projects": 3, "Statistics": 3,
  "SQL": 3, "MLOps": 3, "System Design": 2, "Tools": 3
};

export const getScoreColor = (score) => {
  if (score <= 40) return { text: "text-red-500", stroke: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/20" };
  if (score <= 65) return { text: "text-orange-500", stroke: "#F97316", bg: "bg-orange-500/10", border: "border-orange-500/20" };
  return { text: "text-green-500", stroke: "#22C55E", bg: "bg-green-500/10", border: "border-green-500/20" };
};

export const getDifficultyColor = (diff) => {
  switch (diff) {
    case "Beginner": return "bg-green-500/10 border border-green-500/20 text-green-400";
    case "Intermediate": return "bg-blue-500/10 border border-blue-500/20 text-blue-400";
    case "Advanced": return "bg-purple-500/10 border border-purple-500/20 text-purple-400";
    case "Expert": return "bg-red-500/10 border border-red-500/20 text-red-400";
    default: return "bg-slate-800 border border-slate-700 text-slate-400";
  }
};

export const getMonthsFromTimeline = (timelineStr) => {
  if (!timelineStr) return "3";
  const match = timelineStr.match(/~(\d+)\s+months/i) || timelineStr.match(/in\s+(\d+)\s+months/i);
  return match ? match[1] : "3";
};

export function DashboardProvider({ children }) {
  const { currentUser, profileData, isFirebaseMock, refreshProfile } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBackendUnreachable, setIsBackendUnreachable] = useState(false);
  
  // Custom states for tracking started projects
  const [selectedProject, setSelectedProject] = useState(null);
  const [startedProjects, setStartedProjects] = useState({});

  // Progress tracking states
  const [progressData, setProgressData] = useState({
    history: [],
    improvement: 0,
    firstScore: 0,
    latestScore: 0,
    daysTracked: 0
  });

  const [toastMessage, setToastMessage] = useState("");
  const [showUpdateSkillsModal, setShowUpdateSkillsModal] = useState(false);
  const [updateFormStep, setUpdateFormStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatePipelineState, setUpdatePipelineState] = useState("idle");
  const [updatePipelineLog, setUpdatePipelineLog] = useState("");
  const [updatePipelineError, setUpdatePipelineError] = useState("");

  // Update Form State
  const [updateFullName, setUpdateFullName] = useState("");
  const [updateAcademicYear, setUpdateAcademicYear] = useState("3rd");
  const [updateBranch, setUpdateBranch] = useState("");
  const [updateCareerGoal, setUpdateCareerGoal] = useState("MLE");
  const [updateSkills, setUpdateSkills] = useState({
    "ML Knowledge": 3, "DSA": 3, "Projects": 3, "Statistics": 3,
    "SQL": 3, "MLOps": 3, "System Design": 3, "Tools": 3
  });
  const [updateProjectCount, setUpdateProjectCount] = useState(0);
  const [updateProjectsList, setUpdateProjectsList] = useState([]);
  const [updateWeeklyHours, setUpdateWeeklyHours] = useState(10);
  const [updateGithubUrl, setUpdateGithubUrl] = useState("");

  const [skillsMetadata, setSkillsMetadata] = useState({
    "ML Knowledge": { level: 3, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null },
    "DSA": { level: 3, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null },
    "Projects": { level: 3, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null },
    "Statistics": { level: 3, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null },
    "SQL": { level: 3, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null },
    "MLOps": { level: 3, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null },
    "System Design": { level: 3, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null },
    "Tools": { level: 3, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null }
  });

  const [activeModes, setActiveModes] = useState({
    "ML Knowledge": "manual",
    "DSA": "manual",
    "Projects": "manual",
    "Statistics": "manual",
    "SQL": "manual",
    "MLOps": "manual",
    "System Design": "manual",
    "Tools": "manual"
  });

  // Assessment flow variables
  const [assessedSkill, setAssessedSkill] = useState(null);
  const [dsaProblems, setDsaProblems] = useState("0-10");
  const [dsaEasyIndep, setDsaEasyIndep] = useState("No");
  const [dsaTopics, setDsaTopics] = useState([]);
  const [sqlConcepts, setSqlConcepts] = useState([]);
  const [mlConcepts, setMlConcepts] = useState([]);
  const [statsConcepts, setStatsConcepts] = useState([]);
  const [mlopsConcepts, setMlopsConcepts] = useState([]);
  const [sysdesignConcepts, setSysdesignConcepts] = useState([]);
  const [toolsConcepts, setToolsConcepts] = useState([]);
  const [projCountAssessed, setProjCountAssessed] = useState("None");
  const [projDeployAssessed, setProjDeployAssessed] = useState("None");
  const [projFeaturesAssessed, setProjFeaturesAssessed] = useState([]);
  const [assessmentResult, setAssessmentResult] = useState(null);

  const fetchLatestReport = useCallback(async () => {
    setLoading(true);
    setError("");
    setIsBackendUnreachable(false);
    
    const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

    try {
      if (isFirebaseMock) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          await fetch(`${API_URL}/api/health`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (pingErr) {
          console.warn("Backend connectivity check failed:", pingErr);
          setIsBackendUnreachable(true);
        }

        const localRep = localStorage.getItem("traject_report");
        if (localRep) {
          setReport(JSON.parse(localRep));
        } else {
          setError("No readiness reports found. Please complete the onboarding setup first.");
        }

        const localMeta = localStorage.getItem("traject_skills_metadata");
        if (localMeta) {
          setSkillsMetadata(JSON.parse(localMeta));
        }

        const localStarted = JSON.parse(localStorage.getItem("traject_started_projects")) || {};
        setStartedProjects(localStarted);

        const localHistory = JSON.parse(localStorage.getItem("traject_score_history")) || [];
        if (localHistory.length > 0) {
          localHistory.sort((a, b) => Number(a.savedAt) - Number(b.savedAt));
          const firstScore = localHistory[0].totalScore;
          const latestScore = localHistory[localHistory.length - 1].totalScore;
          const improvement = latestScore - firstScore;
          let daysTracked = 0;
          try {
            const firstTime = Number(localHistory[0].savedAt);
            const latestTime = Number(localHistory[localHistory.length - 1].savedAt);
            daysTracked = Math.max(0, Math.round((latestTime - firstTime) / (24 * 3600 * 1000)));
          } catch (e) {}
          setProgressData({
            history: localHistory,
            improvement,
            firstScore,
            latestScore,
            daysTracked
          });
        }
      } else {
        const reportsRef = collection(db, "users", currentUser?.uid, "reports");
        const q = query(reportsRef, orderBy("generatedAt", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setReport(querySnapshot.docs[0].data());
        } else {
          setError("No readiness reports found. Please complete the onboarding setup first.");
        }

        try {
          const skillsRef = collection(db, "users", currentUser?.uid, "skills");
          const skillsSnapshot = await getDocs(skillsRef);
          const metaMap = {};
          skillsSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.category) {
              metaMap[data.category] = {
                level: data.selfRating || 3,
                confidence: data.confidence !== undefined ? data.confidence : null,
                evidence_count: data.evidenceCount !== undefined ? data.evidenceCount : 0,
                method: data.assessmentMethod || "manual",
                last_assessed_at: data.lastAssessedAt || null,
                reasoning: data.reasoning || null
              };
            }
          });
          setSkillsMetadata(prev => ({ ...prev, ...metaMap }));
        } catch (err) {
          console.error("Error fetching skills metadata from Firestore:", err);
        }

        if (currentUser) {
          const startedRef = collection(db, "users", currentUser.uid, "startedProjects");
          const startedSnap = await getDocs(startedRef);
          const startedMap = {};
          startedSnap.forEach(docSnap => {
            startedMap[docSnap.id] = docSnap.data();
          });
          setStartedProjects(startedMap);

          try {
            const idToken = await currentUser.getIdToken();
            const headers = {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`
            };
            const progressRes = await fetch(`${API_URL}/api/progress/${currentUser.uid}`, { headers });
            if (progressRes.ok) {
              const pData = await progressRes.json();
              setProgressData(pData);
            }
          } catch (pErr) {
            console.error("Error fetching progress history from API:", pErr);
          }
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      if (err.message && (err.message.includes("fetch") || err.message.includes("NetworkError") || err.message.includes("Failed to fetch"))) {
        setIsBackendUnreachable(true);
      }
      
      let errorMsg = "Unable to connect to database. Displaying locally saved report.";
      let offlineMsg = "Unable to connect to database. Displaying offline demo report.";
      
      if (err.code === "permission-denied" || (err.message && err.message.toLowerCase().includes("permission"))) {
        errorMsg = "Firestore Permission Denied. Check your Firestore Security Rules in Firebase Console. Displaying locally saved report.";
        offlineMsg = "Firestore Permission Denied. Check your Firestore Security Rules in Firebase Console. Displaying offline demo report.";
      }
      
      const localRep = localStorage.getItem("traject_report");
      if (localRep) {
        setReport(JSON.parse(localRep));
        setError(errorMsg);
      } else {
        setError(offlineMsg);
        setReport(getOfflineMockReport());
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, isFirebaseMock]);

  useEffect(() => {
    if (currentUser) {
      fetchLatestReport();
    }
  }, [currentUser, fetchLatestReport]);

  const handleMarkAsStarted = async (proj) => {
    const projectId = proj.title.replace(/\s+/g, "_").toLowerCase();
    try {
      if (isFirebaseMock) {
        const localStarted = JSON.parse(localStorage.getItem("traject_started_projects")) || {};
        localStarted[projectId] = { startedAt: new Date().toISOString(), ...proj };
        localStorage.setItem("traject_started_projects", JSON.stringify(localStarted));
        setStartedProjects(prev => ({ ...prev, [projectId]: localStarted[projectId] }));
      } else if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid, "startedProjects", projectId);
        const projectData = {
          title: proj.title,
          difficulty: proj.difficulty,
          estimatedDays: proj.estimatedDays,
          startedAt: new Date().toISOString()
        };
        await setDoc(docRef, projectData);
        setStartedProjects(prev => ({ ...prev, [projectId]: projectData }));
      }
    } catch (err) {
      console.error("Error marking project as started:", err);
    }
  };

  const handleOpenUpdateSkills = async () => {
    setUpdateFullName(profileData?.name || currentUser?.displayName || "");
    setUpdateAcademicYear(profileData?.academicYear || "3rd");
    setUpdateBranch(profileData?.branch || "");
    setUpdateCareerGoal(profileData?.careerGoal || "MLE");
    setUpdateWeeklyHours(profileData?.weeklyHours || 10);
    setUpdateGithubUrl(profileData?.githubUrl || "");

    if (isFirebaseMock) {
      const localSkills = localStorage.getItem("traject_skills");
      if (localSkills) {
        setUpdateSkills(JSON.parse(localSkills));
      }
      
      const localProjects = localStorage.getItem("traject_projects");
      if (localProjects) {
        const parsedProj = JSON.parse(localProjects);
        setUpdateProjectsList(parsedProj);
        setUpdateProjectCount(parsedProj.length);
      } else {
        setUpdateProjectsList([]);
        setUpdateProjectCount(0);
      }

      const localMeta = localStorage.getItem("traject_skills_metadata");
      if (localMeta) {
        const parsedMeta = JSON.parse(localMeta);
        setSkillsMetadata(parsedMeta);
        const modes = {
          "ML Knowledge": "manual", "DSA": "manual", "Projects": "manual", "Statistics": "manual",
          "SQL": "manual", "MLOps": "manual", "System Design": "manual", "Tools": "manual"
        };
        ["ML Knowledge", "DSA", "Projects", "Statistics", "SQL", "MLOps", "System Design", "Tools"].forEach(k => {
          if (parsedMeta[k]?.method === "assessment") {
            modes[k] = "assessment";
          }
        });
        setActiveModes(modes);
      }
    } else {
      try {
        const skillsRef = collection(db, "users", currentUser?.uid, "skills");
        const querySnapshot = await getDocs(skillsRef);
        const skillsMap = {};
        const metadataMap = {};
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.category && data.selfRating !== undefined) {
            skillsMap[data.category] = data.selfRating;
            metadataMap[data.category] = {
              level: data.selfRating,
              confidence: data.confidence !== undefined ? data.confidence : null,
              evidence_count: data.evidenceCount !== undefined ? data.evidenceCount : 0,
              method: data.assessmentMethod || "manual",
              last_assessed_at: data.lastAssessedAt || null,
              reasoning: data.reasoning || null
            };
          }
        });
        if (Object.keys(skillsMap).length > 0) {
          setUpdateSkills(skillsMap);
        }
        setSkillsMetadata(prev => ({ ...prev, ...metadataMap }));

        const modes = {
          "ML Knowledge": "manual", "DSA": "manual", "Projects": "manual", "Statistics": "manual",
          "SQL": "manual", "MLOps": "manual", "System Design": "manual", "Tools": "manual"
        };
        ["ML Knowledge", "DSA", "Projects", "Statistics", "SQL", "MLOps", "System Design", "Tools"].forEach(k => {
          if (metadataMap[k]?.method === "assessment") {
            modes[k] = "assessment";
          }
        });
        setActiveModes(modes);

        const projectsRef = collection(db, "users", currentUser?.uid, "projects");
        const projectsSnapshot = await getDocs(projectsRef);
        const projList = [];
        projectsSnapshot.forEach(docSnap => {
          projList.push({
            title: docSnap.data().title || "",
            description: docSnap.data().description || ""
          });
        });
        setUpdateProjectsList(projList);
        setUpdateProjectCount(projList.length);
      } catch (err) {
        console.error("Error pre-filling update skills modal:", err);
      }
    }

    setUpdateFormStep(1);
    setShowUpdateSkillsModal(true);
  };

  const handleUpdateSkillsSubmit = async () => {
    setIsUpdating(true);
    setUpdatePipelineState("profile");
    setUpdatePipelineError("");
    setUpdatePipelineLog("Saving profile details and updated skills...");

    const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const payload = {
      userId: currentUser.uid,
      name: updateFullName,
      academicYear: updateAcademicYear,
      branch: updateBranch,
      careerGoal: updateCareerGoal,
      weeklyHours: updateWeeklyHours,
      githubUrl: updateGithubUrl,
      skills: updateSkills,
      projects: updateProjectsList.filter(p => p.title.trim() !== "")
    };

    try {
      if (isFirebaseMock) {
        const profile = JSON.parse(localStorage.getItem("traject_profile")) || {};
        const newProfile = {
          ...profile,
          name: updateFullName,
          email: currentUser.email,
          academicYear: updateAcademicYear,
          branch: updateBranch,
          careerGoal: updateCareerGoal,
          weeklyHours: parseInt(updateWeeklyHours),
          githubUrl: updateGithubUrl,
          onboardingComplete: true
        };
        localStorage.setItem("traject_profile", JSON.stringify(newProfile));
        localStorage.setItem("traject_skills", JSON.stringify(updateSkills));
        localStorage.setItem("traject_skills_metadata", JSON.stringify(skillsMetadata));
        localStorage.setItem("traject_projects", JSON.stringify(payload.projects));
      } else {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          name: updateFullName,
          academicYear: updateAcademicYear,
          branch: updateBranch,
          careerGoal: updateCareerGoal,
          weeklyHours: parseInt(updateWeeklyHours),
          githubUrl: updateGithubUrl,
          onboardingComplete: true
        }, { merge: true });

        const skillUpdateRef = collection(db, "users", currentUser.uid, "skillUpdates");
        await addDoc(skillUpdateRef, {
          skills: updateSkills,
          updatedAt: new Date().toISOString()
        });

        for (const [cat, rating] of Object.entries(updateSkills)) {
          const skillId = cat.replace(/\s+/g, "_").toLowerCase();
          const skillRef = doc(db, "users", currentUser.uid, "skills", skillId);
          const meta = skillsMetadata[cat];
          await setDoc(skillRef, {
            category: cat,
            selfRating: rating,
            confidence: meta.confidence,
            evidenceCount: meta.evidence_count,
            assessmentMethod: meta.method,
            lastAssessedAt: meta.last_assessed_at,
            reasoning: meta.reasoning || null,
            updatedAt: new Date().toISOString()
          });
        }

        for (const proj of payload.projects) {
          const projColRef = collection(db, "users", currentUser.uid, "projects");
          await addDoc(projColRef, {
            title: proj.title,
            description: proj.description,
            createdAt: new Date().toISOString()
          });
        }
      }

      const idToken = await currentUser.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      };

      setUpdatePipelineLog("Agent 1: Re-analyzing student background...");
      const profileRes = await fetch(`${API_URL}/api/agent/profile`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (!profileRes.ok) throw new Error("Profile Analyzer failed");
      const profileDataResult = await profileRes.json();

      setUpdatePipelineState("skillgap");
      setUpdatePipelineLog("Agent 2: Re-calculating skill gaps...");
      const skillGapPayload = { userId: currentUser.uid, skills: updateSkills };
      const gapRes = await fetch(`${API_URL}/api/agent/skillgap`, {
        method: "POST",
        headers,
        body: JSON.stringify(skillGapPayload)
      });
      if (!gapRes.ok) throw new Error("Skill Gap Agent failed");
      const gapDataResult = await gapRes.json();

      setUpdatePipelineState("score");
      setUpdatePipelineLog("Agent 3: Re-synthesizing Readiness Score...");
      const scorePayload = { userId: currentUser.uid, skills: updateSkills };
      const scoreRes = await fetch(`${API_URL}/api/agent/score`, {
        method: "POST",
        headers,
        body: JSON.stringify(scorePayload)
      });
      if (!scoreRes.ok) throw new Error("Score Engine failed");
      const scoreDataResult = await scoreRes.json();

      if (isFirebaseMock) {
        const localHistory = JSON.parse(localStorage.getItem("traject_score_history")) || [];
        const timestamp = Date.now().toString();
        const newSnapshot = {
          totalScore: scoreDataResult.totalScore,
          breakdown: scoreDataResult.breakdown,
          skills: updateSkills,
          savedAt: timestamp
        };
        localHistory.push(newSnapshot);
        localStorage.setItem("traject_score_history", JSON.stringify(localHistory));
      }

      setUpdatePipelineState("projects");
      setUpdatePipelineLog("Agent 4: Re-tailoring project recommendations...");
      const projectsPayload = {
        userId: currentUser.uid,
        careerGoal: updateCareerGoal,
        skills: updateSkills,
        projects: payload.projects
      };
      const projectsAdvisorRes = await fetch(`${API_URL}/api/agent/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify(projectsPayload)
      });
      if (!projectsAdvisorRes.ok) throw new Error("Project Advisor failed");
      const projectsAdvisorDataResult = await projectsAdvisorRes.json();

      setUpdatePipelineState("resources");
      setUpdatePipelineLog("Agent 5: Re-curating resources...");
      const resourcesPayload = {
        userId: currentUser.uid,
        gaps: gapDataResult.gaps,
        skills: updateSkills,
        careerGoal: updateCareerGoal
      };
      const resourcesRes = await fetch(`${API_URL}/api/agent/resources`, {
        method: "POST",
        headers,
        body: JSON.stringify(resourcesPayload)
      });
      if (!resourcesRes.ok) throw new Error("Resource Recommender failed");
      const resourcesDataResult = await resourcesRes.json();

      const studyMultiplier = Math.max(5, parseInt(updateWeeklyHours));
      const neededPoints = 100 - scoreDataResult.totalScore;
      const weeksEst = Math.ceil((neededPoints * 3) / (studyMultiplier / 5));
      const monthsEst = Math.ceil(weeksEst / 4);
      const timelineText = scoreDataResult.totalScore >= 75 
        ? "You're MLE internship-ready right now! Focus on system design."
        : `At ${updateWeeklyHours} hrs/week, you'll be ready in ~${monthsEst} months.`;

      setUpdatePipelineState("mentor");
      setUpdatePipelineLog("Agent 6: Generating personalized mentor analysis...");
      const mentorPayload = {
        userId: currentUser.uid,
        name: updateFullName,
        academicYear: updateAcademicYear,
        branch: updateBranch,
        careerGoal: updateCareerGoal,
        weeklyHours: parseInt(updateWeeklyHours),
        githubUrl: updateGithubUrl,
        skills: updateSkills,
        skillsMetadata,
        projects: payload.projects,
        readinessScore: scoreDataResult.totalScore,
        scoreBreakdown: scoreDataResult.breakdown,
        skillGaps: gapDataResult.gaps.filter(g => g.gap > 0),
        timeline: timelineText,
        recommendedProjects: projectsAdvisorDataResult.recommendations,
        recommendedResources: resourcesDataResult.resources,
        kaggleCompetitions: resourcesDataResult.kaggleCompetitions,
        isOnboarding: false
      };
      
      const mentorRes = await fetch(`${API_URL}/api/agent/mentor`, {
        method: "POST",
        headers,
        body: JSON.stringify(mentorPayload)
      });
      if (!mentorRes.ok) throw new Error("Mentor Analysis Agent failed");
      const mentorDataResult = await mentorRes.json();

      setUpdatePipelineState("memory");
      setUpdatePipelineLog("Agent 7: Updating career readiness memory bank...");

      const reportData = {
        readinessScore: scoreDataResult.totalScore,
        scoreBreakdown: scoreDataResult.breakdown,
        skillGaps: gapDataResult.gaps.filter(g => g.gap > 0),
        roadmap: projectsAdvisorDataResult.recommendations.map(p => p.title),
        timeline: timelineText,
        profileSummary: mentorDataResult.mentorAnalysis,
        inputsHash: mentorDataResult.inputsHash,
        cachedAt: mentorDataResult.cachedAt,
        
        careerGoal: updateCareerGoal,
        weeklyHours: parseInt(updateWeeklyHours),
        skillsMetadata: skillsMetadata,
        projects: payload.projects,
        
        strongAreas: profileDataResult.strongAreas,
        weakAreas: profileDataResult.weakAreas,
        careerRiskAreas: profileDataResult.careerRiskAreas || [],
        nextActionSkill: profileDataResult.nextActionSkill || null,
        kaggleCompetitions: resourcesDataResult.kaggleCompetitions || [],
        recommendedProjects: projectsAdvisorDataResult.recommendations,
        recommendedResources: resourcesDataResult.resources,
        generatedAt: new Date().toISOString()
      };

      if (isFirebaseMock) {
        localStorage.setItem("traject_report", JSON.stringify(reportData));
      } else {
        const reportsColRef = collection(db, "users", currentUser.uid, "reports");
        await addDoc(reportsColRef, reportData);
      }

      setUpdatePipelineState("done");
      
      const oldScore = report?.readinessScore || 0;
      const newScore = scoreDataResult.totalScore;
      const scoreDiff = newScore - oldScore;
      const deltaText = scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`;

      await refreshProfile();
      await fetchLatestReport();

      setToastMessage(`Score updated! You improved by ${deltaText} points`);
      setTimeout(() => setToastMessage(""), 4000);

      setShowUpdateSkillsModal(false);
      setIsUpdating(false);
    } catch (err) {
      console.error("Update skills submission error:", err);
      setUpdatePipelineError(err.message || "Failed to update skills and rerun agents.");
      setIsUpdating(false);
    }
  };

  const getScoreDifference = () => {
    if (progressData.history.length < 2) return null;
    const latest = progressData.history[progressData.history.length - 1].totalScore;
    const prev = progressData.history[progressData.history.length - 2].totalScore;
    return latest - prev;
  };

  const handleUpdateSkillChange = (category, val) => {
    const valInt = parseInt(val);
    setUpdateSkills(prev => ({ ...prev, [category]: valInt }));
    setSkillsMetadata(prev => ({
      ...prev,
      [category]: { level: valInt, confidence: null, evidence_count: 0, method: "manual", last_assessed_at: null }
    }));
  };

  const runAssessment = (category) => {
    let level = 1;
    let confidence = 50;
    let strong = [];
    let missing = [];

    if (category === "DSA") {
      let probVal = 0;
      let probConf = 5;
      if (dsaProblems === "10-50") { probVal = 1; probConf = 10; }
      else if (dsaProblems === "50-150") { probVal = 2; probConf = 20; }
      else if (dsaProblems === "150+") { probVal = 3; probConf = 30; }

      let easyVal = 0;
      let easyConf = 0;
      if (dsaEasyIndep === "Yes") { easyVal = 1; easyConf = 10; }
      else if (dsaEasyIndep === "Sometimes") { easyVal = 0.5; easyConf = 5; }

      const topicsCount = dsaTopics.length;
      let topicVal = topicsCount * 0.25;
      let topicConf = 5;
      if (topicsCount >= 3 && topicsCount <= 5) topicConf = 15;
      else if (topicsCount >= 6) topicConf = 25;

      level = Math.min(5, Math.max(1, Math.round(1 + probVal + easyVal + topicVal)));
      confidence = Math.min(95, 50 + probConf + easyConf + topicConf);

      const allDsa = ["Arrays", "Hashing", "Two Pointers", "Sliding Window", "Binary Search", "Trees", "Graphs"];
      allDsa.forEach(t => {
        if (dsaTopics.includes(t)) {
          strong.push(t);
        } else {
          missing.push(t);
        }
      });
    } 
    else if (category === "SQL") {
      let sumPoints = 0;
      const allSql = ["SELECT", "GROUP BY", "JOINS", "Subqueries", "Window Functions"];
      allSql.forEach(c => {
        if (sqlConcepts.includes(c)) {
          strong.push(c);
          if (c === "SELECT") sumPoints += 0.5;
          else if (c === "GROUP BY") sumPoints += 0.75;
          else if (c === "JOINS") sumPoints += 0.75;
          else if (c === "Subqueries") sumPoints += 1.0;
          else if (c === "Window Functions") sumPoints += 1.0;
        } else {
          missing.push(c);
        }
      });
      level = Math.min(5, Math.max(1, Math.round(1 + sumPoints)));

      const count = sqlConcepts.length;
      if (count === 1) confidence = 55;
      else if (count === 2) confidence = 65;
      else if (count === 3) confidence = 75;
      else if (count === 4) confidence = 85;
      else if (count === 5) confidence = 95;
      else confidence = 50;

      if (!sqlConcepts.includes("Window Functions") || !sqlConcepts.includes("Subqueries")) {
        missing.push("Advanced Querying");
      }
    } 
    else if (category === "ML Knowledge") {
      const count = mlConcepts.length;
      level = Math.min(5, Math.max(1, Math.round(1 + count * 0.6)));

      if (count === 0) confidence = 50;
      else if (count <= 2) confidence = 60;
      else if (count <= 4) confidence = 75;
      else if (count <= 6) confidence = 85;
      else confidence = 95;

      const allMl = [
        { key: "Train/Test Split", label: "Train/Test Split" },
        { key: "Overfitting", label: "Overfitting" },
        { key: "Precision vs Recall", label: "Precision vs Recall" },
        { key: "Cross Validation", label: "Cross Validation" },
        { key: "Feature Engineering", label: "Feature Engineering" },
        { key: "Ensemble Models", label: "Ensemble Methods" },
        { key: "Deep Learning Basics", label: "Deep Learning" }
      ];

      allMl.forEach(item => {
        if (mlConcepts.includes(item.key)) {
          strong.push(item.key);
        } else {
          missing.push(item.label);
        }
      });
    }
    else if (category === "Projects") {
      let countScore = 0;
      let countConf = 0;
      if (projCountAssessed === "1-2") { countScore = 1.0; countConf = 10; }
      else if (projCountAssessed === "3+") { countScore = 2.0; countConf = 20; }

      let deployScore = 0;
      let deployConf = 0;
      if (projDeployAssessed === "Local (Streamlit/API)") { deployScore = 0.5; deployConf = 10; }
      else if (projDeployAssessed === "Cloud production") { deployScore = 1.5; deployConf = 20; }

      const featuresCount = projFeaturesAssessed.length;
      let featureScore = featuresCount * 0.3;
      let featureConf = featuresCount * 5;

      level = Math.min(5, Math.max(1, Math.round(1 + countScore + deployScore + featureScore)));
      confidence = Math.min(95, 50 + countConf + deployConf + featureConf);

      const allFeatures = ["Data Cleaning Pipeline", "Hyperparameter Tuning", "Model Versioning", "Deep Learning/Transformers", "Custom Loss/Architecture"];
      allFeatures.forEach(f => {
        if (projFeaturesAssessed.includes(f)) {
          strong.push(f);
        } else {
          missing.push(f);
        }
      });
      strong.push(`Completed: ${projCountAssessed}`);
      strong.push(`Deployment: ${projDeployAssessed}`);
    }
    else if (category === "Statistics") {
      const count = statsConcepts.length;
      level = Math.min(5, Math.max(1, Math.round(1 + count * 0.65)));

      if (count === 1) confidence = 55;
      else if (count === 2) confidence = 65;
      else if (count === 3) confidence = 75;
      else if (count === 4) confidence = 85;
      else if (count >= 5) confidence = 95;
      else confidence = 50;

      const allStats = ["Probability Basics", "Bayes Theorem", "Hypothesis Testing (p-values)", "Linear Regression Math", "Dimensionality Reduction (PCA)", "Optimization (Gradient Descent)"];
      allStats.forEach(c => {
        if (statsConcepts.includes(c)) {
          strong.push(c);
        } else {
          missing.push(c);
        }
      });
    }
    else if (category === "MLOps") {
      const count = mlopsConcepts.length;
      level = Math.min(5, Math.max(1, Math.round(1 + count * 0.55)));

      if (count === 1) confidence = 55;
      else if (count === 2) confidence = 65;
      else if (count === 3) confidence = 75;
      else if (count === 4) confidence = 85;
      else if (count >= 5) confidence = 95;
      else confidence = 50;

      const allMlops = ["Git & Version Control", "Docker Containerization", "FastAPI/Flask Model Serving", "CI/CD Pipelines", "Model Monitoring", "Cloud VM/Server Deployment", "Kubernetes/Orchestration"];
      allMlops.forEach(c => {
        if (mlopsConcepts.includes(c)) {
          strong.push(c);
        } else {
          missing.push(c);
        }
      });
    }
    else if (category === "System Design") {
      const count = sysdesignConcepts.length;
      level = Math.min(5, Math.max(1, Math.round(1 + count * 0.55)));

      if (count === 1) confidence = 55;
      else if (count === 2) confidence = 65;
      else if (count === 3) confidence = 75;
      else if (count === 4) confidence = 85;
      else if (count >= 5) confidence = 95;
      else confidence = 50;

      const allSys = ["System Architecture (APIs, DBs)", "Load Balancing", "Caching (Redis)", "Latency vs. Throughput", "Batch vs. Online Prediction", "Feature Stores", "Model Quantization/Edge Inference"];
      allSys.forEach(c => {
        if (sysdesignConcepts.includes(c)) {
          strong.push(c);
        } else {
          missing.push(c);
        }
      });
    }
    else if (category === "Tools") {
      const count = toolsConcepts.length;
      level = Math.min(5, Math.max(1, Math.round(1 + count * 0.55)));

      if (count === 1) confidence = 55;
      else if (count === 2) confidence = 65;
      else if (count === 3) confidence = 75;
      else if (count === 4) confidence = 85;
      else if (count >= 5) confidence = 95;
      else confidence = 50;

      const allTools = ["Python (Advanced)", "SQL Databases (Postgres, etc.)", "PyTorch/TensorFlow", "Git & GitHub", "Linux/Bash Scripting", "AWS/GCP/Azure", "Weights & Biases / MLflow"];
      allTools.forEach(c => {
        if (toolsConcepts.includes(c)) {
          strong.push(c);
        } else {
          missing.push(c);
        }
      });
    }

    setAssessmentResult({
      rating: level,
      confidence,
      evidence_count: category === "DSA" ? (dsaTopics.length + (dsaProblems !== "0-10" ? 1 : 0) + (dsaEasyIndep !== "No" ? 1 : 0))
        : category === "SQL" ? sqlConcepts.length
        : category === "ML Knowledge" ? mlConcepts.length
        : category === "Projects" ? (projFeaturesAssessed.length + (projCountAssessed !== "None" ? 1 : 0) + (projDeployAssessed !== "None" ? 1 : 0))
        : category === "Statistics" ? statsConcepts.length
        : category === "MLOps" ? mlopsConcepts.length
        : category === "System Design" ? sysdesignConcepts.length
        : toolsConcepts.length,
      reasoning: { strong, missing }
    });
  };

  const handleUpdateProjectCountChange = (count) => {
    const num = Math.max(0, parseInt(count) || 0);
    setUpdateProjectCount(num);
    
    setUpdateProjectsList(prev => {
      const newList = [...prev];
      if (newList.length < num) {
        while (newList.length < num) {
          newList.push({ title: "", description: "" });
        }
      } else if (newList.length > num) {
        newList.splice(num);
      }
      return newList;
    });
  };

  const updateUpdateProjectField = (index, field, value) => {
    setUpdateProjectsList(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  const value = {
    report,
    setReport,
    loading,
    setLoading,
    error,
    setError,
    isBackendUnreachable,
    setIsBackendUnreachable,
    selectedProject,
    setSelectedProject,
    startedProjects,
    setStartedProjects,
    progressData,
    setProgressData,
    toastMessage,
    setToastMessage,
    showUpdateSkillsModal,
    setShowUpdateSkillsModal,
    updateFormStep,
    setUpdateFormStep,
    isUpdating,
    setIsUpdating,
    updatePipelineState,
    setUpdatePipelineState,
    updatePipelineLog,
    setUpdatePipelineLog,
    updatePipelineError,
    setUpdatePipelineError,
    updateFullName,
    setUpdateFullName,
    updateAcademicYear,
    setUpdateAcademicYear,
    updateBranch,
    setUpdateBranch,
    updateCareerGoal,
    setUpdateCareerGoal,
    updateSkills,
    setUpdateSkills,
    updateProjectCount,
    setUpdateProjectCount,
    updateProjectsList,
    setUpdateProjectsList,
    updateWeeklyHours,
    setUpdateWeeklyHours,
    updateGithubUrl,
    setUpdateGithubUrl,
    skillsMetadata,
    setSkillsMetadata,
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
    fetchLatestReport,
    handleOpenUpdateSkills,
    handleUpdateSkillsSubmit,
    getScoreDifference,
    runAssessment,
    handleUpdateProjectCountChange,
    updateUpdateProjectField,
    handleUpdateSkillChange,
    handleMarkAsStarted
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

function getOfflineMockReport() {
  return {
    readinessScore: 63,
    scoreBreakdown: {
      "ML Knowledge": 15.0,
      "Projects": 8.0,
      "DSA": 9.0,
      "Statistics": 6.0,
      "SQL": 6.0,
      "MLOps": 4.0,
      "System Design": 1.0,
      "Tools": 3.0
    },
    skillGaps: [
      { category: "System Design", studentRating: 1, benchmark: 2, gap: 1 },
      { category: "ML Knowledge", studentRating: 3, benchmark: 4, gap: 1 },
      { category: "Projects", studentRating: 2, benchmark: 3, gap: 1 },
      { category: "MLOps", studentRating: 2, benchmark: 3, gap: 1 }
    ],
    timeline: "At 10 hrs/week, you'll be internship-ready in ~3 months",
    profileSummary: "Jane Doe exhibits basic knowledge in ML core techniques but requires building actual project experiences. Major engineering competencies in MLOps and System Design remain the prime gaps targeting the MLE career benchmark.",
    strongAreas: ["DSA", "Statistics", "SQL", "Tools"],
    weakAreas: ["ML Knowledge", "Projects", "MLOps", "System Design"],
    recommendedProjects: [
      {
        title: "Continuous Deployment ML Pipeline",
        description: "Deploy a PyTorch models server via FastAPI dockerized, integrating GitHub actions CI/CD checks.",
        skillsTargeted: ["MLOps", "Tools", "ML Knowledge"],
        difficulty: "Intermediate",
        estimatedDays: 14
      },
      {
        title: "Scalable Recommendation System Architecture",
        description: "Configure collaborative filtering scoring models served behind Redis caches and stream updates.",
        skillsTargeted: ["System Design", "Projects", "SQL"],
        difficulty: "Advanced",
        estimatedDays: 21
      }
    ],
    recommendedResources: [
      {
        category: "MLOps",
        resourceName: "[Made With ML (Goku Mohandas)](https://madewithml.com/)",
        url: "https://madewithml.com/",
        type: "Course",
        estimatedHours: 30
      },
      {
        category: "System Design",
        resourceName: "[ML System Design Course (Claypot AI)](https://huyenchip.com/ml-system-design/)",
        url: "https://huyenchip.com/ml-system-design/",
        type: "Documentation",
        estimatedHours: 15
      }
    ],
    nextActionSkill: {
      category: "MLOps",
      actionStep: "Complete Goku Mohandas's 'Made With ML' packaging and containerization modules.",
      estimatedHours: 30
    },
    generatedAt: new Date().toISOString()
  };
}
