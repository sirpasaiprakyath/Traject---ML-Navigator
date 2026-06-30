import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  FolderGit2, 
  Clock, 
  Cpu, 
  Target, 
  Activity, 
  Lightbulb, 
  BookOpen, 
  Database,
  CheckCircle2,
  Loader2,
  Brain
} from "lucide-react";

const SKILL_CATEGORIES = [
  { key: "ML Knowledge", label: "ML Knowledge", desc: "Core ML/DL Concepts" },
  { key: "DSA", label: "DSA", desc: "Data Structures & Algorithms" },
  { key: "Projects", label: "Projects", desc: "Applied/Portfolio Work" },
  { key: "Statistics", label: "Statistics", desc: "Statistics & Math Foundations" },
  { key: "SQL", label: "SQL", desc: "SQL & Data Handling" },
  { key: "MLOps", label: "MLOps", desc: "MLOps & Deployment" },
  { key: "System Design", label: "System Design", desc: "System Design (ML Systems)" },
  { key: "Tools", label: "Tools", desc: "Tools & Engineering (Git, Cloud, Python)" }
];

export default function Onboarding() {
  const { currentUser, refreshProfile, isFirebaseMock } = useAuth();
  const [step, setStep] = useState(1);

  // Form State
  const [fullName, setFullName] = useState("");
  const [academicYear, setAcademicYear] = useState("3rd");
  const [branch, setBranch] = useState("");
  const [careerGoal, setCareerGoal] = useState("MLE");

  const [skills, setSkills] = useState({
    "ML Knowledge": 3,
    "DSA": 3,
    "Projects": 3,
    "Statistics": 3,
    "SQL": 3,
    "MLOps": 3,
    "System Design": 3,
    "Tools": 3
  });

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

  const [projectCount, setProjectCount] = useState(0);
  const [projectsList, setProjectsList] = useState([]); // Array of {title, description}

  const [weeklyHours, setWeeklyHours] = useState(10);
  const [githubUrl, setGithubUrl] = useState("");

  // Pipeline Execution State
  const [pipelineState, setPipelineState] = useState("idle"); // idle, profile, skillgap, score, projects, resources, saving, done
  const [pipelineLog, setPipelineLog] = useState("");
  const [pipelineError, setPipelineError] = useState("");

  const handleSkillChange = (category, val) => {
    const valInt = parseInt(val);
    setSkills(prev => ({ ...prev, [category]: valInt }));
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

  const handleProjectCountChange = (count) => {
    const num = Math.max(0, parseInt(count) || 0);
    setProjectCount(num);
    
    // Resize projects list
    setProjectsList(prev => {
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

  const updateProjectField = (index, field, value) => {
    setProjectsList(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  // Submit flow
  const handleSubmit = async () => {
    // Validate inputs before submitting
    if (!fullName.trim() || !branch.trim()) {
      alert("Please fill out all required fields in Step 1.");
      setStep(1);
      return;
    }

    setStep(5); // Show pipeline screen
    setPipelineState("profile");
    setPipelineError("");

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const payload = {
      userId: currentUser.uid,
      name: fullName,
      academicYear,
      branch,
      careerGoal,
      weeklyHours,
      githubUrl,
      skills,
      projects: projectsList.filter(p => p.title.trim() !== "")
    };

    try {
      // 1. Save data to Firestore / LocalStorage first (profile info, skills, projects)
      console.log("Saving initial profile, skills, and projects to database...");
      setPipelineState("profile");
      setPipelineLog("Saving profile details and current skills...");

      if (isFirebaseMock) {
        // Save profile to Local Storage mock database
        localStorage.setItem("traject_profile", JSON.stringify({
          name: fullName,
          email: currentUser.email,
          academicYear,
          branch,
          careerGoal,
          weeklyHours: parseInt(weeklyHours),
          githubUrl,
          onboardingComplete: false, // will update to true after done
          createdAt: new Date().toISOString()
        }));
      } else {
        // Save profile to Real Firestore database
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          name: fullName,
          email: currentUser.email,
          academicYear,
          branch,
          careerGoal,
          weeklyHours: parseInt(weeklyHours),
          githubUrl,
          onboardingComplete: false, // will update to true after done
          createdAt: new Date().toISOString()
        }, { merge: true });

        // Save Skills to Firestore
        for (const [cat, rating] of Object.entries(skills)) {
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

        // Save Projects to Firestore
        for (const proj of payload.projects) {
          const projColRef = collection(db, "users", currentUser.uid, "projects");
          await addDoc(projColRef, {
            title: proj.title,
            description: proj.description,
            createdAt: new Date().toISOString()
          });
        }
      }

      // Now, call each agent endpoint with the actual userId and skills data
      const idToken = await currentUser.getIdToken();
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      };

      // 1. Profile Analyzer Agent
      setPipelineLog("Agent 1: Analyzing student background and profile...");
      console.log("Calling profile agent with:", JSON.stringify(payload));
      const profileRes = await fetch(`${API_URL}/api/agent/profile`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      console.log("Profile agent response:", profileRes.status);
      if (!profileRes.ok) {
        const errText = await profileRes.text();
        console.error("Profile Analyzer Agent failed with body:", errText);
        throw new Error(`Profile Analyzer Agent failed: ${profileRes.statusText}`);
      }
      const profileData = await profileRes.json();
      
      // 2. Skill Gap Agent
      setPipelineState("skillgap");
      setPipelineLog("Agent 2: Comparing ratings against MLE benchmarks...");
      const skillGapPayload = { userId: currentUser.uid, skills };
      console.log("Skill Gap Agent request body URL:", `${API_URL}/api/agent/skillgap`);
      console.log("Skill Gap Agent FULL request body being sent:", JSON.stringify(skillGapPayload, null, 2));
      const gapRes = await fetch(`${API_URL}/api/agent/skillgap`, {
        method: "POST",
        headers,
        body: JSON.stringify(skillGapPayload)
      });
      if (!gapRes.ok) {
        const errText = await gapRes.text();
        console.error("Skill Gap Agent failed with body:", errText);
        throw new Error(`Skill Gap Agent failed: ${gapRes.statusText}`);
      }
      const gapData = await gapRes.json();
      console.log("Skill Gap Agent response received:", JSON.stringify(gapData, null, 2));

      // 3. Score Engine Agent
      setPipelineState("score");
      setPipelineLog("Agent 3: Synthesizing Readiness Score breakdown...");
      const scorePayload = { userId: currentUser.uid, skills };
      console.log("Score Engine Agent request body URL:", `${API_URL}/api/agent/score`);
      console.log("Score Engine Agent FULL request body being sent:", JSON.stringify(scorePayload, null, 2));
      const scoreRes = await fetch(`${API_URL}/api/agent/score`, {
        method: "POST",
        headers,
        body: JSON.stringify(scorePayload)
      });
      if (!scoreRes.ok) {
        const errText = await scoreRes.text();
        console.error("Score Engine Agent failed with body:", errText);
        throw new Error(`Readiness Score Engine failed: ${scoreRes.statusText}`);
      }
      const scoreData = await scoreRes.json();
      console.log("Score Engine Agent response received:", JSON.stringify(scoreData, null, 2));

      // 4. Project Advisor Agent
      setPipelineState("projects");
      setPipelineLog("Agent 4: Recommending tailored projects to close gaps...");
      const projectsPayload = {
        userId: currentUser.uid,
        careerGoal,
        skills,
        projects: payload.projects
      };
      console.log("Project Advisor Agent request body URL:", `${API_URL}/api/agent/projects`);
      console.log("Project Advisor Agent FULL request body being sent:", JSON.stringify(projectsPayload, null, 2));
      const projectsAdvisorRes = await fetch(`${API_URL}/api/agent/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify(projectsPayload)
      });
      if (!projectsAdvisorRes.ok) {
        const errText = await projectsAdvisorRes.text();
        console.error("Project Advisor Agent failed with body:", errText);
        throw new Error(`Project Advisor Agent failed: ${projectsAdvisorRes.statusText}`);
      }
      const projectsAdvisorData = await projectsAdvisorRes.json();
      console.log("Project Advisor Agent response received:", JSON.stringify(projectsAdvisorData, null, 2));

      // 5. Resource Recommender Agent
      setPipelineState("resources");
      setPipelineLog("Agent 5: Curing free courses and documentation...");
      const resourcesPayload = {
        userId: currentUser.uid,
        gaps: gapData.gaps,
        skills,
        careerGoal
      };
      console.log("Resource Recommender Agent request body URL:", `${API_URL}/api/agent/resources`);
      console.log("Resource Recommender Agent FULL request body being sent:", JSON.stringify(resourcesPayload, null, 2));
      const resourcesRes = await fetch(`${API_URL}/api/agent/resources`, {
        method: "POST",
        headers,
        body: JSON.stringify(resourcesPayload)
      });
      if (!resourcesRes.ok) {
        const errText = await resourcesRes.text();
        console.error("Resource Recommender Agent failed with body:", errText);
        throw new Error(`Resource Recommender Agent failed: ${resourcesRes.statusText}`);
      }
      const resourcesData = await resourcesRes.json();
      console.log("Resource Recommender Agent response received:", JSON.stringify(resourcesData, null, 2));

      // Calculate timeline estimate based on score and study hours
      const studyMultiplier = Math.max(5, parseInt(weeklyHours));
      const neededPoints = 100 - scoreData.totalScore;
      const weeksEst = Math.ceil((neededPoints * 3) / (studyMultiplier / 5));
      const monthsEst = Math.ceil(weeksEst / 4);
      const timelineText = scoreData.totalScore >= 75 
        ? "You're MLE internship-ready right now! Focus on system design."
        : `At ${weeklyHours} hrs/week, you'll be ready in ~${monthsEst} months.`;

      // 6. Mentor Analysis Agent
      setPipelineState("mentor");
      setPipelineLog("Agent 6: Generating personalized mentor analysis...");
      const mentorPayload = {
        userId: currentUser.uid,
        name: fullName,
        academicYear,
        branch,
        careerGoal,
        weeklyHours: parseInt(weeklyHours),
        githubUrl,
        skills,
        skillsMetadata,
        projects: payload.projects,
        readinessScore: scoreData.totalScore,
        scoreBreakdown: scoreData.breakdown,
        skillGaps: gapData.gaps.filter(g => g.gap > 0),
        timeline: timelineText,
        recommendedProjects: projectsAdvisorData.recommendations,
        recommendedResources: resourcesData.resources,
        kaggleCompetitions: resourcesData.kaggleCompetitions,
        isOnboarding: true
      };
      
      console.log("Mentor Analysis Agent request body URL:", `${API_URL}/api/agent/mentor`);
      const mentorRes = await fetch(`${API_URL}/api/agent/mentor`, {
        method: "POST",
        headers,
        body: JSON.stringify(mentorPayload)
      });
      if (!mentorRes.ok) {
        const errText = await mentorRes.text();
        console.error("Mentor Analysis Agent failed with body:", errText);
        throw new Error(`Mentor Analysis Agent failed: ${mentorRes.statusText}`);
      }
      const mentorData = await mentorRes.json();
      console.log("Mentor Analysis Agent response received:", JSON.stringify(mentorData, null, 2));

      // Structure report
      const reportData = {
        readinessScore: scoreData.totalScore,
        scoreBreakdown: scoreData.breakdown,
        skillGaps: gapData.gaps.filter(g => g.gap > 0),
        roadmap: projectsAdvisorData.recommendations.map(p => p.title),
        timeline: timelineText,
        profileSummary: mentorData.mentorAnalysis,
        inputsHash: mentorData.inputsHash,
        cachedAt: mentorData.cachedAt,
        
        // Metadata fields for caching comparison:
        careerGoal: careerGoal,
        weeklyHours: parseInt(weeklyHours),
        skillsMetadata: skillsMetadata,
        projects: payload.projects,
        
        strongAreas: profileData.strongAreas,
        weakAreas: profileData.weakAreas,
        careerRiskAreas: profileData.careerRiskAreas || [],
        nextActionSkill: profileData.nextActionSkill || null,
        kaggleCompetitions: resourcesData.kaggleCompetitions || [],
        recommendedProjects: projectsAdvisorData.recommendations,
        recommendedResources: resourcesData.resources,
        generatedAt: new Date().toISOString()
      };

      // 7. Memory Agent: Save final report and set onboardingComplete = true
      setPipelineState("memory");
      setPipelineLog("Agent 7: Updating career readiness memory bank...");

      if (isFirebaseMock) {
        const profile = JSON.parse(localStorage.getItem("traject_profile")) || {};
        profile.onboardingComplete = true;
        localStorage.setItem("traject_profile", JSON.stringify(profile));
        localStorage.setItem("traject_report", JSON.stringify(reportData));
        localStorage.setItem("traject_skills", JSON.stringify(skills));
        localStorage.setItem("traject_skills_metadata", JSON.stringify(skillsMetadata));
        localStorage.setItem("traject_projects", JSON.stringify(payload.projects));
        
        const timestamp = Date.now().toString();
        const initialSnapshot = {
          totalScore: scoreData.totalScore,
          breakdown: scoreData.breakdown,
          skills: skills,
          savedAt: timestamp
        };
        localStorage.setItem("traject_score_history", JSON.stringify([initialSnapshot]));
      } else {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, { onboardingComplete: true }, { merge: true });
        
        const reportsColRef = collection(db, "users", currentUser.uid, "reports");
        await addDoc(reportsColRef, reportData);
      }

      setPipelineState("done");
      setPipelineLog("Onboarding complete! Redirecting to dashboard...");
      
      setTimeout(async () => {
        await refreshProfile();
      }, 1000);

    } catch (err) {
      console.error("Critical onboarding pipeline error:", err);
      setPipelineError(err.message || "Failed to process onboarding reports.");
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-200 flex flex-col items-center justify-center p-4 relative font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-electricBlue/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-electricBlue/5 blur-[120px] pointer-events-none" />

      {step < 5 && (
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2">Build Your MLE Roadmap</h1>
            <p className="text-gray-400 text-sm">Step {step} of 4: Setup your credentials & skills</p>
            
            {/* Progress indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3, 4].map(s => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step ? "w-10 bg-electricBlue" : s < step ? "w-4 bg-electricBlue/40" : "w-4 bg-borderGray"
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="glass-panel accent-glow rounded-card p-8 border border-borderGray/60 shadow-2xl relative">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-electricBlue" />
                  Tell Us About Yourself
                </h2>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Academic Year *</label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200"
                    >
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Branch / Degree *</label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. CSE or IT"
                      className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Career Goal *</label>
                  <select
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200"
                  >
                    <option value="MLE">Machine Learning Engineer (MLE)</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="AI Engineer">AI Engineer</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Skills Rating */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <Cpu className="w-5 h-5 text-electricBlue" />
                  Self-Assess Your Skills
                </h2>
                <p className="text-xs text-gray-400">
                  Rate your confidence level in each area on a scale of 1 (Novice) to 5 (Expert).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {SKILL_CATEGORIES.map(cat => {
                    const isAssessedSkill = true;
                    return (
                      <div key={cat.key} className="space-y-1.5 p-3 rounded-lg border border-borderGray bg-[#121214]">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-sm font-semibold text-white block">{cat.label}</span>
                            <span className="text-[10px] text-gray-500">{cat.desc}</span>
                          </div>
                        </div>

                        {isAssessedSkill && (
                          <div className="flex gap-2 mb-2 border-b border-borderGray/30 pb-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModes(prev => ({ ...prev, [cat.key]: 'manual' }));
                                handleSkillChange(cat.key, skills[cat.key]);
                              }}
                              className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                activeModes[cat.key] === 'manual' ? 'bg-electricBlue text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              Rate Myself
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveModes(prev => ({ ...prev, [cat.key]: 'assessment' }));
                              }}
                              className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                activeModes[cat.key] === 'assessment' ? 'bg-electricBlue text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              Help Me Assess
                            </button>
                          </div>
                        )}

                        {(!isAssessedSkill || activeModes[cat.key] === 'manual') ? (
                          <div className="space-y-2 mt-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500 font-semibold italic">Self Reported</span>
                              <span className="text-base font-extrabold text-electricBlue bg-electricBlue/10 px-2.5 py-0.5 rounded border border-electricBlue/20">
                                {skills[cat.key]}/5
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={skills[cat.key]}
                              onChange={(e) => handleSkillChange(cat.key, e.target.value)}
                              className="w-full cursor-pointer"
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
                                className="w-full py-2 px-3 bg-electricBlue/15 border border-electricBlue/30 text-electricBlue rounded-lg text-xs font-bold hover:bg-electricBlue/25 transition-all text-center cursor-pointer"
                              >
                                Start Assessment
                              </button>
                            ) : (
                              <div className="space-y-2.5 bg-black/30 p-2.5 rounded-lg border border-borderGray/30">
                                <div className="flex justify-between items-start">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit uppercase">
                                      ✓ Evidence Verified
                                    </span>
                                    <span className="text-[10px] text-gray-500 mt-1">Confidence: {skillsMetadata[cat.key].confidence}%</span>
                                  </div>
                                  <span className="text-base font-extrabold text-electricBlue bg-electricBlue/10 px-2.5 py-0.5 rounded border border-electricBlue/20">
                                    {skills[cat.key]}/5
                                  </span>
                                </div>

                                {skillsMetadata[cat.key].reasoning && (
                                  <div className="text-[10px] space-y-1 pt-1.5 border-t border-borderGray/20 text-gray-400">
                                    <div>
                                      <span className="font-semibold text-gray-300">Strong: </span>
                                      {skillsMetadata[cat.key].reasoning.strong.slice(0, 3).join(", ") || "None"}
                                      {skillsMetadata[cat.key].reasoning.strong.length > 3 ? "..." : ""}
                                    </div>
                                    {skillsMetadata[cat.key].reasoning.missing.length > 0 && (
                                      <div>
                                        <span className="font-semibold text-gray-300">Gaps: </span>
                                        {skillsMetadata[cat.key].reasoning.missing.slice(0, 3).join(", ") || "None"}
                                        {skillsMetadata[cat.key].reasoning.missing.length > 3 ? "..." : ""}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-2 mt-2 pt-2 border-t border-borderGray/20">
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
                                    className="flex-1 py-1 px-2 bg-gray-800 text-gray-300 hover:text-white rounded text-[10px] font-semibold text-center cursor-pointer"
                                  >
                                    Re-assess
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveModes(prev => ({ ...prev, [cat.key]: 'manual' }));
                                      handleSkillChange(cat.key, skills[cat.key]);
                                    }}
                                    className="flex-1 py-1 px-2 bg-gray-800 text-gray-300 hover:text-white rounded text-[10px] font-semibold text-center cursor-pointer"
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

            {/* STEP 3: Projects */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                  <FolderGit2 className="w-5 h-5 text-electricBlue" />
                  Portfolio Projects
                </h2>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    How many ML/engineering projects have you completed?
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={projectCount}
                    onChange={(e) => handleProjectCountChange(e.target.value)}
                    className="w-24 bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2 text-sm text-white outline-none transition-all duration-200"
                  />
                </div>

                {projectCount === 0 ? (
                  <div className="p-6 rounded-lg border border-dashed border-borderGray text-center bg-[#121214]/50 my-6">
                    <p className="text-gray-400 text-sm font-medium">
                      "No worries — we'll help you build some."
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Our Project Advisor Agent will recommend suitable portfolio additions based on your gaps.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mt-4">
                    {projectsList.map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-lg border border-borderGray bg-[#121214] space-y-3">
                        <span className="text-xs font-bold text-electricBlue uppercase tracking-wider">Project #{idx + 1}</span>
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            required
                            placeholder="Project Title (e.g. Fraud Classifier)"
                            value={proj.title}
                            onChange={(e) => updateProjectField(idx, "title", e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-borderGray focus:border-electricBlue rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            required
                            placeholder="One-line description of tech stack and results"
                            value={proj.description}
                            onChange={(e) => updateProjectField(idx, "description", e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-borderGray focus:border-electricBlue rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Time Commitment & GitHub */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-electricBlue" />
                  Study Commitment
                </h2>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Weekly hours available to study *
                  </label>
                  <select
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                    className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all duration-200"
                  >
                    <option value={5}>5 hours / week</option>
                    <option value={10}>10 hours / week</option>
                    <option value={15}>15 hours / week</option>
                    <option value={20}>20+ hours / week</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <FolderGit2 className="w-4 h-4 text-gray-500" />
                    GitHub profile URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                  />
                  <p className="text-[10px] text-gray-500 font-medium italic mt-1">
                    * We'll analyze your GitHub to verify your skills
                  </p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-borderGray">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 rounded-lg border border-borderGray hover:bg-[#1A1A1E] text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  onClick={() => {
                    if (step === 1 && (!fullName.trim() || !branch.trim())) {
                      alert("Please enter your name and branch degree.");
                      return;
                    }
                    setStep(step + 1);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-electricBlue hover:bg-blue-600 text-sm font-bold text-white transition-all flex items-center gap-2"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-lg bg-electricBlue hover:bg-blue-600 text-sm font-extrabold text-white transition-all flex items-center gap-2 accent-glow-strong"
                >
                  Generate Roadmap
                  <Cpu className="w-4 h-4 animate-pulse" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* STEP 5: Loading / Multi-Agent Execution Pipeline */}
      {step === 5 && (
        <div className="fixed inset-0 bg-[#0F0F0F] z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-lg glass-panel rounded-card border border-borderGray p-8 text-center shadow-2xl relative overflow-hidden">
            
            {pipelineState !== "done" && pipelineState !== "error" && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-borderGray overflow-hidden">
                <div className="h-full bg-electricBlue animate-pulse w-[40%] rounded" />
              </div>
            )}

            <h2 className="text-2xl font-black text-white mb-6 tracking-tight flex items-center justify-center gap-3">
              <Cpu className="w-6 h-6 text-electricBlue animate-spin" />
              AI Agent Pipeline
            </h2>
            
            <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
              Our multi-agent engine is analyzing your profile and compiling your customized MLE readiness package.
            </p>

            {/* Pipeline Stage Indicators */}
            <div className="space-y-4 text-left max-w-sm mx-auto">
              {[
                { state: "profile", label: "Analyzing profile...", desc: "Agent 1: Profile Analyzer", icon: User },
                { state: "skillgap", label: "Calculating skill gaps...", desc: "Agent 2: Skill Gap Agent", icon: Target },
                { state: "score", label: "Generating readiness score...", desc: "Agent 3: Readiness Assessment Agent", icon: Activity },
                { state: "projects", label: "Selecting projects...", desc: "Agent 4: Project Advisor Agent", icon: Lightbulb },
                { state: "resources", label: "Curating resources...", desc: "Agent 5: Learning Strategy Agent", icon: BookOpen },
                { state: "mentor", label: "Generating mentor analysis...", desc: "Agent 6: Mentor Analysis Agent", icon: Brain },
                { state: "memory", label: "Saving profile...", desc: "Agent 7: Memory Agent", icon: Database }
              ].map((stage, idx) => {
                const isCompleted = [
                  "profile", "skillgap", "score", "projects", "resources", "mentor", "memory", "done"
                ].indexOf(pipelineState) > idx;
                const isActive = pipelineState === stage.state;

                return (
                  <div 
                    key={stage.state} 
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-300 ${
                      isActive 
                        ? "border-electricBlue/40 bg-electricBlue/5 accent-glow" 
                        : isCompleted 
                          ? "border-emerald-500/20 bg-emerald-950/10" 
                          : "border-borderGray bg-[#121214]"
                    }`}
                  >
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-electricBlue animate-spin" />
                      ) : (
                        <stage.icon className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <span className={`text-sm font-semibold block ${isActive ? "text-white" : isCompleted ? "text-gray-400" : "text-gray-600"}`}>
                        {stage.label}
                      </span>
                      <span className="text-[10px] text-gray-500 block">{stage.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Realtime logs */}
            <div className="mt-8 p-3 rounded bg-black/60 border border-borderGray text-left font-mono text-[11px] text-gray-400 max-h-[80px] overflow-y-auto scrollbar-thin">
              <span className="text-electricBlue font-bold block mb-1">&gt; Logs:</span>
              {pipelineLog}
            </div>

            {/* Error handling */}
            {pipelineError && (
              <div className="mt-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-left space-y-3">
                <p className="text-xs text-red-200 font-semibold">{pipelineError}</p>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-xs font-bold text-white transition-all"
                >
                  Retry Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment Modal Overlay */}
      {assessedSkill && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-borderGray rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 text-left my-8">
            
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
                  <p className="text-xs text-gray-405 mt-1">Provide evidence to verify your skill proficiency.</p>
                </div>

                {assessedSkill === "DSA" && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">How many DSA/LeetCode problems have you solved?</label>
                      <select
                        value={dsaProblems}
                        onChange={(e) => setDsaProblems(e.target.value)}
                        className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="0-10">0-10 problems</option>
                        <option value="10-50">10-50 problems</option>
                        <option value="50-150">50-150 problems</option>
                        <option value="150+">150+ problems</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Can you solve LeetCode Easy problems independently?</label>
                      <select
                        value={dsaEasyIndep}
                        onChange={(e) => setDsaEasyIndep(e.target.value)}
                        className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white outline-none"
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
                                  ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                  : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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
                    <label className="text-xs font-semibold text-gray-450 block uppercase tracking-wider">Which SQL concepts have you implemented in practice? (Select all)</label>
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
                                ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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
                      <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Number of ML/Engineering projects completed:</label>
                      <select
                        value={projCountAssessed}
                        onChange={(e) => setProjCountAssessed(e.target.value)}
                        className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="None">None</option>
                        <option value="1-2">1-2 projects</option>
                        <option value="3+">3+ projects</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Deployment Status:</label>
                      <select
                        value={projDeployAssessed}
                        onChange={(e) => setProjDeployAssessed(e.target.value)}
                        className="w-full bg-[#121214] border border-borderGray focus:border-electricBlue rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="None">None deployed / Local script only</option>
                        <option value="Local (Streamlit/API)">Deployed locally (API/Streamlit/Web app)</option>
                        <option value="Cloud production">Deployed to Cloud (AWS, GCP, Vercel, HuggingFace, etc.)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-450 block uppercase tracking-wider">Engineering Features Implemented: (Select all)</label>
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
                                  ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                  : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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
                                ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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
                                ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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
                                ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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
                                ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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

                {assessedSkill === "SQL" && (
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-gray-450 block uppercase tracking-wider">Which SQL concepts have you implemented in practice? (Select all)</label>
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
                                ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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
                    <label className="text-xs font-semibold text-gray-450 block uppercase tracking-wider">Which ML concepts can you confidently explain? (Select all)</label>
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
                                ? 'border-electricBlue bg-electricBlue/10 text-white font-semibold' 
                                : 'border-borderGray hover:border-gray-700 bg-black/25 text-gray-400'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              checked ? 'bg-electricBlue border-electricBlue text-white' : 'border-gray-600'
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

                <div className="flex gap-3 pt-4 border-t border-borderGray">
                  <button
                    type="button"
                    onClick={() => runAssessment(assessedSkill)}
                    className="flex-1 py-2.5 rounded-lg bg-electricBlue hover:bg-blue-600 font-bold text-sm text-white transition-all cursor-pointer text-center"
                  >
                    Calculate Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssessedSkill(null);
                      setAssessmentResult(null);
                    }}
                    className="py-2.5 px-6 rounded-lg border border-borderGray hover:bg-[#1E1E22] font-semibold text-sm text-gray-400 hover:text-white transition-all cursor-pointer"
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
                  <p className="text-xs text-gray-400 mt-1">Based on the provided evidence, here is the estimation of your current level.</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-black/35 border border-borderGray/40 font-sans">
                  <div>
                    <span className="text-xs font-semibold text-gray-550 block uppercase tracking-wider">Estimated Level</span>
                    <span className="text-3xl font-extrabold text-electricBlue">{assessmentResult.rating} <span className="text-lg text-gray-500 font-normal">/ 5</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-555 block uppercase tracking-wider">Confidence Level</span>
                    <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">{assessmentResult.confidence}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-widest">✓ Strong Areas</span>
                    {assessmentResult.reasoning.strong.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {assessmentResult.reasoning.strong.map(s => (
                          <span key={s} className="text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded font-medium">✓ {s}</span>
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

                <div className="flex gap-3 pt-4 border-t border-borderGray">
                  <button
                    type="button"
                    onClick={() => {
                      // Save to skills & skillsMetadata
                      setSkills(prev => ({ ...prev, [assessedSkill]: assessmentResult.rating }));
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
                    className="flex-1 py-2.5 rounded-lg bg-electricBlue hover:bg-blue-600 font-bold text-sm text-white transition-all cursor-pointer text-center"
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
                    className="py-2.5 px-5 rounded-lg border border-borderGray hover:bg-[#1E1E22] font-semibold text-sm text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    Edit Manually
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
