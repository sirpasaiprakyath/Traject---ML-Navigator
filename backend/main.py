import os
import json
import hashlib
import re
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException, Header, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import firebase_admin
from firebase_admin import credentials, firestore, auth
# pyrefly: ignore [missing-import]
import google.generativeai as genai
from dotenv import load_dotenv

groq_client = None
try:
    from groq import Groq
    if os.environ.get("GROQ_API_KEY"):
        groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
except ImportError:
    pass
import urllib.request
import urllib.error
import io

try:
    from pypdf import PdfReader
    pypdf_available = True
except ImportError:
    pypdf_available = False
    print("pypdf not installed. Resume parsing unavailable.")



load_dotenv()

github_token = os.environ.get("GITHUB_TOKEN", "")

app = FastAPI(
    title="Traject API",
    description="Backend AI Career Readiness Engine for Machine Learning Engineers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Benchmark Ratings (v1 - Hardcoded)
BENCHMARKS = {
    "ML Knowledge": 4,
    "DSA": 3,
    "Projects": 3,
    "Statistics": 3,
    "SQL": 3,
    "MLOps": 3,
    "System Design": 2,
    "Tools": 3
}

# Skill Weights for Readiness Score
SKILL_WEIGHTS = {
    "ML Knowledge": 0.25,
    "Projects": 0.20,
    "DSA": 0.15,
    "Statistics": 0.10,
    "SQL": 0.10,
    "MLOps": 0.10,
    "System Design": 0.05,
    "Tools": 0.05
}

# Firebase Initialization
db_client = None
firebase_initialized = False

service_account_path = "serviceAccountKey.json"
if os.path.exists(service_account_path):
    try:
        cred = credentials.Certificate(service_account_path)
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred)
        db_client = firestore.client()
        firebase_initialized = True
        print("Firebase Admin initialized via serviceAccountKey.json")
    except Exception as e:
        print(f"Error initializing Firebase with key: {e}")
else:
    # Check for environmental string
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        try:
            sa_info = json.loads(sa_json)
            cred = credentials.Certificate(sa_info)
            try:
                firebase_admin.get_app()
            except ValueError:
                firebase_admin.initialize_app(cred)
            db_client = firestore.client()
            firebase_initialized = True
            print("Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_JSON env var")
        except Exception as e:
            print(f"Error initializing Firebase with JSON string: {e}")
    else:
        print("Warning: Firebase service account key not found. Using local database fallback logic.")

# Gemini Initialization
gemini_api_key = os.environ.get("GEMINI_API_KEY")
gemini_initialized = False

if gemini_api_key and gemini_api_key != "your-gemini-api-key-here":
    try:
        genai.configure(api_key=gemini_api_key)
        gemini_initialized = True
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini: {e}")
else:
    print("Warning: GEMINI_API_KEY not set. Using local mock generator for LLM tasks.")

# Models
class ProjectItem(BaseModel):
    title: str
    description: str

class UserProfileData(BaseModel):
    userId: str
    name: Optional[str] = None
    academicYear: Optional[str] = None
    branch: Optional[str] = None
    careerGoal: Optional[str] = None
    weeklyHours: Optional[int] = None
    githubUrl: Optional[str] = None
    skills: Optional[Dict[str, int]] = None
    projects: Optional[List[ProjectItem]] = None

class SkillGapInput(BaseModel):
    userId: str
    skills: Optional[Dict[str, int]] = None

class ScoreInput(BaseModel):
    userId: str
    skills: Optional[Dict[str, int]] = None

class ProjectAdvisorInput(BaseModel):
    userId: str
    careerGoal: Optional[str] = None
    skills: Optional[Dict[str, int]] = None
    projects: Optional[List[ProjectItem]] = None

class ResourceInput(BaseModel):
    userId: str
    gaps: Optional[List[Dict[str, Any]]] = None
    skills: Optional[Dict[str, int]] = None
    careerGoal: Optional[str] = None

class MentorInput(BaseModel):
    userId: str
    name: Optional[str] = None
    academicYear: Optional[str] = None
    branch: Optional[str] = None
    careerGoal: Optional[str] = None
    weeklyHours: Optional[int] = None
    githubUrl: Optional[str] = None
    skills: Optional[Dict[str, int]] = None
    skillsMetadata: Optional[Dict[str, Dict[str, Any]]] = None
    projects: Optional[List[ProjectItem]] = None
    readinessScore: int
    scoreBreakdown: Dict[str, float]
    skillGaps: List[Dict[str, Any]]
    timeline: str
    recommendedProjects: List[Dict[str, Any]]
    recommendedResources: List[Dict[str, Any]]
    kaggleCompetitions: List[Dict[str, Any]]
    isOnboarding: Optional[bool] = False


class GitHubInput(BaseModel):
    userId: str
    githubUrl: str
    skills: Optional[Dict[str, int]] = None


def fetch_github_data(username: str) -> Dict[str, Any]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Traject-App"
    }
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"
    
    base = "https://api.github.com"
    
    def get(path):
        req = urllib.request.Request(f"{base}{path}", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                return json.loads(res.read().decode())
        except Exception as e:
            print(f"GitHub API error for {path}: {e}", flush=True)
            return {}
    
    user = get(f"/users/{username}")
    repos_raw = get(f"/users/{username}/repos?sort=updated&per_page=20")
    
    if not isinstance(repos_raw, list):
        repos_raw = []
    
    # Extract languages across all repos
    languages = {}
    top_repos = []
    for repo in repos_raw:
        if repo.get("fork"):
            continue  # Skip forks
        lang = repo.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1
        top_repos.append({
            "name": repo.get("name"),
            "description": repo.get("description"),
            "language": lang,
            "stars": repo.get("stargazers_count", 0),
            "updated": repo.get("updated_at", ""),
            "topics": repo.get("topics", [])
        })
    
    return {
        "username": username,
        "name": user.get("name", username) or username,
        "bio": user.get("bio", ""),
        "public_repos": user.get("public_repos", 0),
        "followers": user.get("followers", 0),
        "languages": languages,
        "top_repos": top_repos[:8],
        "account_created": user.get("created_at", ""),
    }


ROLE_KEYWORDS = {
    "MLE": {
        "required": [
            "machine learning", "deep learning", "neural network",
            "pytorch", "tensorflow", "scikit-learn", "python",
            "model deployment", "mlops", "docker", "kubernetes",
            "feature engineering", "model evaluation", "a/b testing",
            "data pipeline", "sql", "git", "api", "fastapi",
            "transformers", "nlp", "computer vision", "regression",
            "classification", "random forest", "xgboost"
        ],
        "bonus": [
            "llm", "langchain", "hugging face", "vertex ai",
            "aws sagemaker", "airflow", "spark", "kafka",
            "prometheus", "grafana", "ci/cd", "github actions",
            "research", "published", "arxiv"
        ],
        "sections_required": [
            "experience", "projects", "skills", "education"
        ],
        "summary_must_include": [
            "machine learning", "python", "model"
        ]
    },
    "Data Scientist": {
        "required": [
            "python", "r", "statistics", "hypothesis testing",
            "machine learning", "data analysis", "pandas", "numpy",
            "matplotlib", "seaborn", "sql", "tableau", "power bi",
            "regression", "classification", "clustering", "a/b testing",
            "data visualization", "scikit-learn", "jupyter",
            "probability", "data cleaning", "eda"
        ],
        "bonus": [
            "spark", "hadoop", "airflow", "dbt", "snowflake",
            "causal inference", "bayesian", "time series",
            "forecasting", "nlp", "deep learning", "published"
        ],
        "sections_required": [
            "experience", "projects", "skills", "education"
        ],
        "summary_must_include": [
            "data", "analysis", "insights"
        ]
    },
    "AI Engineer": {
        "required": [
            "python", "llm", "langchain", "openai", "gemini",
            "prompt engineering", "rag", "vector database",
            "embeddings", "api integration", "fastapi", "docker",
            "machine learning", "deep learning", "transformers",
            "hugging face", "fine-tuning", "inference", "deployment",
            "git", "cloud", "rest api"
        ],
        "bonus": [
            "pytorch", "tensorflow", "kubernetes", "aws", "gcp",
            "azure", "pinecone", "chromadb", "weaviate",
            "agent", "tool use", "function calling",
            "multimodal", "vision", "speech", "published"
        ],
        "sections_required": [
            "experience", "projects", "skills", "education"
        ],
        "summary_must_include": [
            "ai", "llm", "engineer"
        ]
    }
}


def extract_pdf_text(file_bytes: bytes) -> str:
    if not pypdf_available:
        return ""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        print(f"PDF extraction error: {e}", flush=True)
        return ""


import re

def segment_resume_sections(text: str) -> Dict[str, List[str]]:
    lines = text.splitlines()
    sections = {
        "header": [],
        "summary": [],
        "education": [],
        "experience": [],
        "projects": [],
        "skills": [],
        "certifications": [],
        "achievements": []
    }
    
    current_section = "header"
    
    # Heading patterns
    patterns = {
        "summary": re.compile(r'^\s*(summary|objective|professional summary|about me|career statement|profile)\s*$', re.IGNORECASE),
        "education": re.compile(r'^\s*(education|academic history|academics|academic profile|qualification|qualifications)\s*$', re.IGNORECASE),
        "experience": re.compile(r'^\s*(experience|work history|employment|professional experience|experience history|professional background|work experience)\s*$', re.IGNORECASE),
        "projects": re.compile(r'^\s*(projects|personal projects|academic projects|technical projects|selected projects)\s*$', re.IGNORECASE),
        "skills": re.compile(r'^\s*(skills|technical skills|technologies|key skills|expertise|professional skills|technical expertise)\s*$', re.IGNORECASE),
        "certifications": re.compile(r'^\s*(certifications|certificates|licenses|courses)\s*$', re.IGNORECASE),
        "achievements": re.compile(r'^\s*(achievements|awards|honors|extracurriculars)\s*$', re.IGNORECASE)
    }
    
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        
        # Check if line is a section heading
        matched_section = None
        for sec_name, pat in patterns.items():
            if pat.match(cleaned) or (len(cleaned) < 30 and any(h in cleaned.lower() for h in [f" {sec_name}", f"{sec_name} "]) and cleaned.isupper()):
                matched_section = sec_name
                break
                
        # If it matches, switch section
        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(line)
            
    return sections


def analyze_structure(sections: Dict[str, List[str]], contact_info: Dict[str, Any]) -> Dict[str, Any]:
    required = ["summary", "education", "experience", "projects", "skills"]
    missing = []
    for r in required:
        if not sections.get(r):
            missing.append(r.capitalize())
            
    score = 100
    score -= len(missing) * 10
    if not contact_info["email"] and not contact_info["phone"]:
        score -= 10
    if not contact_info["hasGithub"] and not contact_info["hasLinkedin"]:
        score -= 5
        
    for sec_name, lines in sections.items():
        if sec_name != "header" and sec_name != "certifications" and sec_name != "achievements":
            if sec_name.capitalize() not in missing and len(lines) == 0:
                score -= 5
                
    score = max(10, min(100, score))
    
    return {
        "score": score,
        "missingSections": missing
    }


def analyze_content_quality(sections: Dict[str, List[str]]) -> Dict[str, Any]:
    bullets = []
    bullet_symbols = ('-', '•', '*', '+', '▪', '▫', '◦', '✓')
    
    for sec_name in ["experience", "projects"]:
        for line in sections.get(sec_name, []):
            cleaned = line.strip()
            if not cleaned:
                continue
            if cleaned.startswith(bullet_symbols) or (len(cleaned) > 30 and (cleaned[0].isupper() or cleaned[0] in ['"', "'"])):
                for sym in bullet_symbols:
                    if cleaned.startswith(sym):
                        cleaned = cleaned[len(sym):].strip()
                        break
                bullets.append(cleaned)
                
    strong_verbs = {
        "built", "designed", "optimized", "implemented", "deployed", "improved", 
        "developed", "created", "led", "architected", "formulated", "integrated", 
        "automated", "accelerated", "established", "enhanced", "tuned", "trained", 
        "streamlined", "authored", "managed", "conducted", "analyzed", "generated", 
        "solved", "engineered", "programmed", "served", "spearheaded", "executed"
    }
    
    weak_verbs = {
        "worked on", "helped", "assisted", "responsible for", "participated", 
        "contributed to", "handled", "did", "helped with", "involved in"
    }
    
    total_bullets = len(bullets)
    strong_verb_count = 0
    weak_bullets = []
    
    for b in bullets:
        b_lower = b.lower()
        first_words = b_lower.split()[:4]
        first_words_str = " ".join(first_words)
        
        has_strong = False
        for verb in strong_verbs:
            if b_lower.startswith(verb) or (first_words and first_words[0].rstrip(',.').strip() == verb):
                has_strong = True
                break
                
        has_weak = False
        for verb in weak_verbs:
            if b_lower.startswith(verb) or verb in first_words_str:
                has_weak = True
                break
                
        if has_strong:
            strong_verb_count += 1
        elif has_weak or len(b) < 40:
            suggested = f"Action Verb + Task + Measurable Result (e.g. 'Optimized model training latency by 20% using Distributed Data Parallel')"
            weak_bullets.append({
                "original": b,
                "suggested": suggested,
                "reason": "Uses weak passive phrasing (e.g., 'worked on') or is too short to show ownership."
            })
            
    score = 50
    if total_bullets > 0:
        score += int(50 * (strong_verb_count / total_bullets))
    
    score -= len(weak_bullets) * 5
    if total_bullets < 3:
        score -= 15
        
    score = max(15, min(100, score))
    
    return {
        "score": score,
        "totalBullets": total_bullets,
        "strongVerbCount": strong_verb_count,
        "weakBullets": weak_bullets[:5]
    }


def analyze_achievements(sections: Dict[str, List[str]]) -> Dict[str, Any]:
    bullets = []
    bullet_symbols = ('-', '•', '*', '+', '▪', '▫', '◦', '✓')
    for sec_name in ["experience", "projects"]:
        for line in sections.get(sec_name, []):
            cleaned = line.strip()
            if not cleaned:
                continue
            if cleaned.startswith(bullet_symbols) or (len(cleaned) > 30 and cleaned[0].isupper()):
                for sym in bullet_symbols:
                    if cleaned.startswith(sym):
                        cleaned = cleaned[len(sym):].strip()
                        break
                bullets.append(cleaned)
                
    total_bullets = len(bullets)
    metric_bullets_count = 0
    
    pct_pat = re.compile(r'\b\d+(?:\.\d+)?%\b|\bpercent\b', re.IGNORECASE)
    latency_pat = re.compile(r'\b\d+(?:\.\d+)?\s*(ms|milliseconds|seconds|sec|x|times|fold|speedup)\b', re.IGNORECASE)
    scale_pat = re.compile(r'\b\d+(?:\.\d+)?\s*(M|B|k|million|billion|thousand)?\s*(users|records|requests|transactions|docs|images|queries|samples|GB|TB|MB)\b', re.IGNORECASE)
    currency_pat = re.compile(r'\$\d+|\b\d+\s*(USD|dollars|dollars saved)\b', re.IGNORECASE)
    accuracy_pat = re.compile(r'\b(accuracy|F1-score|precision|recall|AUC|loss|error rate)\s*(?:of|by|to)?\s*\d+', re.IGNORECASE)
    
    metric_bullets = []
    non_metric_bullets = []
    
    for b in bullets:
        has_metric = False
        if pct_pat.search(b) or latency_pat.search(b) or scale_pat.search(b) or currency_pat.search(b) or accuracy_pat.search(b):
            has_metric = True
            
        if has_metric:
            metric_bullets_count += 1
            metric_bullets.append(b)
        else:
            non_metric_bullets.append(b)
            
    score = 40
    if total_bullets > 0:
        score += int(60 * (metric_bullets_count / total_bullets))
        
    if metric_bullets_count == 0:
        score -= 15
        
    score = max(10, min(100, score))
    
    return {
        "score": score,
        "metricBulletsCount": metric_bullets_count,
        "totalBullets": total_bullets,
        "nonMetricBullets": non_metric_bullets[:3]
    }


def analyze_technical_skills(resume_text: str, career_goal: str) -> Dict[str, Any]:
    text_lower = resume_text.lower()
    
    categories = {
        "Programming": ["python", "c\\+\\+", "java", "scala", "rust", "go", "javascript", "typescript", "r", "bash", "shell"],
        "Machine Learning": ["scikit-learn", "regression", "classification", "clustering", "random forest", "xgboost", "lightgbm", "decision trees", "feature engineering", "cross-validation"],
        "Deep Learning": ["pytorch", "tensorflow", "keras", "cnn", "rnn", "lstm", "transformer", "bert", "gpt", "llm", "fine-tuning", "embeddings", "neural network"],
        "Data Engineering": ["spark", "hadoop", "kafka", "airflow", "dbt", "snowflake", "redshift", "bigquery", "data pipeline", "etl"],
        "MLOps": ["mlflow", "dvc", "kubeflow", "wandb", "weights & biases", "tensorboard", "model registry", "model tracking"],
        "Deployment": ["docker", "kubernetes", "fastapi", "flask", "triton", "model serving", "api", "grpc", "rest", "ci/cd"],
        "Cloud": ["aws", "gcp", "azure", "sagemaker", "vertex ai", "ec2", "s3"],
        "Databases": ["postgresql", "mysql", "mongodb", "redis", "pinecone", "milvus", "chromadb", "weaviate", "vector database"],
        "Visualization": ["tableau", "power bi", "matplotlib", "seaborn", "d3.js", "dashboard"]
    }
    
    detected = {}
    missing_crucial = []
    
    for cat, list_skills in categories.items():
        found = []
        for skill in list_skills:
            pat = re.compile(rf'\b{skill}\b', re.IGNORECASE)
            if pat.search(text_lower):
                found.append(skill.replace("\\", ""))
        detected[cat] = found
        
    expected_categories = []
    crucial_skills = []
    
    if career_goal == "MLE":
        expected_categories = ["Programming", "Machine Learning", "Deep Learning", "MLOps", "Deployment", "Cloud"]
        crucial_skills = ["python", "pytorch", "docker", "git", "sql"]
    elif career_goal == "Data Scientist":
        expected_categories = ["Programming", "Machine Learning", "Databases", "Visualization", "Cloud"]
        crucial_skills = ["python", "statistics", "sql", "pandas", "tableau"]
    else: # AI Engineer
        expected_categories = ["Programming", "Deep Learning", "Deployment", "Databases", "MLOps"]
        crucial_skills = ["python", "llm", "fastapi", "docker", "vector database"]
        
    missing_categories = []
    for cat in expected_categories:
        if not detected[cat]:
            missing_categories.append(cat)
            
    for skill in crucial_skills:
        pat = re.compile(rf'\b{skill}\b', re.IGNORECASE)
        if not pat.search(text_lower):
            missing_crucial.append(skill)
            
    score = 100
    score -= len(missing_categories) * 15
    score -= len(missing_crucial) * 5
    score = max(20, min(100, score))
    
    return {
        "score": score,
        "detected": detected,
        "missingCategories": missing_categories,
        "missingCrucial": missing_crucial
    }


def analyze_projects(sections: Dict[str, List[str]]) -> Dict[str, Any]:
    project_lines = sections.get("projects", [])
    project_blocks = []
    current_block = []
    
    bullet_symbols = ('-', '•', '*', '+', '▪', '▫', '◦', '✓')
    for line in project_lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        if not cleaned.startswith(bullet_symbols) and len(cleaned) < 50:
            if current_block:
                project_blocks.append(current_block)
            current_block = [cleaned]
        else:
            current_block.append(line)
    if current_block:
        project_blocks.append(current_block)
        
    if not project_blocks:
        project_blocks = [project_lines]
        
    project_details = []
    total_score = 0
    
    for block in project_blocks:
        if not block:
            continue
        title = block[0].strip()
        block_text = " ".join(block).lower()
        
        has_tech = any(w in block_text for w in ["pytorch", "tensorflow", "keras", "python", "scikit-learn", "xgboost", "transformers", "pandas", "numpy"])
        has_algo = any(w in block_text for w in ["cnn", "rnn", "lstm", "transformer", "bert", "gpt", "resnet", "yolo", "random forest", "svm", "linear regression", "logistic regression", "neural network"])
        has_dataset = any(w in block_text for w in ["dataset", "data", "corpus", "imagenet", "mnist", "coco", "kaggle", "custom dataset"])
        has_deploy = any(w in block_text for w in ["deploy", "docker", "kubernetes", "fastapi", "flask", "aws", "gcp", "azure", "api", "served"])
        has_github = "github.com" in block_text
        has_results = any(w in block_text for w in ["accuracy", "f1", "precision", "recall", "latency", "auc", "%", "improved", "reduced"])
        
        proj_score = 30
        if has_deploy: proj_score += 15
        if has_dataset: proj_score += 15
        if has_algo or has_tech: proj_score += 15
        if has_github: proj_score += 10
        if has_results: proj_score += 15
        proj_score = min(100, proj_score)
        
        project_details.append({
            "title": title,
            "score": proj_score,
            "hasDeployment": has_deploy,
            "hasDataset": has_dataset,
            "hasAlgorithm": has_algo or has_tech,
            "hasGithub": has_github,
            "hasResults": has_results
        })
        total_score += proj_score
        
    avg_score = int(total_score / len(project_details)) if project_details else 15
    avg_score = max(15, min(100, avg_score))
    
    return {
        "score": avg_score,
        "projects": project_details
    }


def analyze_ats_compatibility(resume_text: str) -> Dict[str, Any]:
    lines = resume_text.splitlines()
    
    table_chars = any(c in resume_text for c in ['|', '┼', '├', '┤', '┬', '┴'])
    
    multi_column = False
    for line in lines:
        if "      " in line and len(line.strip()) > 20:
            multi_column = True
            break
            
    clean_text = re.sub(r'[\w\s\-\.,\(\)@:\/\+\*\•\▪\▫\◦\✓]', '', resume_text)
    unusual_symbols = len(clean_text) > 20
    
    score = 100
    findings = []
    
    if table_chars:
        score -= 15
        findings.append("Table delimiters detected. ATS systems often struggle to parse data cleanly inside tables/grids.")
    if multi_column:
        score -= 15
        findings.append("Multi-column layout detected. Single-column layouts are parsed more reliably by ATS systems.")
    if unusual_symbols:
        score -= 10
        findings.append("Unusual symbols or emojis detected. Avoid graphics or emojis in an ATS resume.")
        
    score = max(30, min(100, score))
    
    return {
        "score": score,
        "findings": findings
    }


def analyze_career_goal_alignment(resume_text: str, career_goal: str, detected_skills: Dict[str, List[str]]) -> Dict[str, Any]:
    text_lower = resume_text.lower()
    
    role_keywords_map = {
        "MLE": ["machine learning", "deep learning", "pytorch", "tensorflow", "mlops", "docker", "deployment", "kubernetes", "api", "fastapi", "model"],
        "Data Scientist": ["statistics", "regression", "classification", "pandas", "sql", "tableau", "visualization", "hypothesis testing", "a/b testing", "data analysis"],
        "AI Engineer": ["llm", "langchain", "prompt engineering", "rag", "vector database", "embeddings", "fastapi", "api", "fine-tuning", "openai", "gemini"]
    }
    
    keywords = role_keywords_map.get(career_goal, role_keywords_map["MLE"])
    found_natural = []
    for kw in keywords:
        if kw in text_lower:
            found_natural.append(kw)
            
    score = 40
    score += int(60 * (len(found_natural) / len(keywords)))
    score = max(20, min(100, score))
    
    return {
        "score": score,
        "keywordsFound": found_natural,
        "keywordsMissing": [kw for kw in keywords if kw not in found_natural]
    }


def calculate_ats_score(resume_text: str, career_goal: str) -> Dict[str, Any]:
    sections = segment_resume_sections(resume_text)
    
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text)
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text)
    github_match = "github.com" in resume_text.lower()
    linkedin_match = "linkedin.com" in resume_text.lower()
    
    contact_info = {
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "hasGithub": github_match,
        "hasLinkedin": linkedin_match
    }
    
    struct = analyze_structure(sections, contact_info)
    content = analyze_content_quality(sections)
    achievements = analyze_achievements(sections)
    skills_analysis = analyze_technical_skills(resume_text, career_goal)
    proj_analysis = analyze_projects(sections)
    ats_comp = analyze_ats_compatibility(resume_text)
    alignment = analyze_career_goal_alignment(resume_text, career_goal, skills_analysis["detected"])
    
    weighted = (
        struct["score"] * 0.15 +
        content["score"] * 0.15 +
        achievements["score"] * 0.20 +
        skills_analysis["score"] * 0.15 +
        proj_analysis["score"] * 0.15 +
        ats_comp["score"] * 0.10 +
        alignment["score"] * 0.10
    )
    
    overall_intelligence_score = int(round(weighted))
    overall_intelligence_score = max(10, min(100, overall_intelligence_score))
    
    role_data = ROLE_KEYWORDS.get(career_goal, ROLE_KEYWORDS["MLE"])
    required = role_data["required"]
    found_required = [k for k in required if k in resume_text.lower()]
    missing_required = [k for k in required if k not in resume_text.lower()]
    found_bonus = [k for k in role_data["bonus"] if k in resume_text.lower()]
    
    return {
        "atsScore": overall_intelligence_score,
        "resumeIntelligenceScore": overall_intelligence_score,
        "structureScore": struct["score"],
        "contentQualityScore": content["score"],
        "achievementScore": achievements["score"],
        "technicalSkillsScore": skills_analysis["score"],
        "projectQualityScore": proj_analysis["score"],
        "atsCompatibilityScore": ats_comp["score"],
        "careerMatchScore": alignment["score"],
        
        "contactInfo": contact_info,
        "missingSections": struct["missingSections"],
        "weakBullets": content["weakBullets"],
        "nonMetricBullets": achievements["nonMetricBullets"],
        "detectedSkills": skills_analysis["detected"],
        "missingSkillCategories": skills_analysis["missingCategories"],
        "missingCrucialSkills": skills_analysis["missingCrucial"],
        "projectsList": proj_analysis["projects"],
        "atsFindings": ats_comp["findings"],
        
        "foundKeywords": found_required,
        "missingKeywords": missing_required[:10],
        "bonusKeywords": found_bonus,
        "keywordCoverage": f"{len(found_required)}/{len(required)}"
    }


# Helper to fetch user data from Firestore
def get_user_data(userId: str) -> Dict[str, Any]:
    if not firebase_initialized or not db_client:
        return {}
    try:
        user_ref = db_client.collection("users").document(userId)
        user_snap = user_ref.get()
        if not user_snap.exists:
            return {}
        
        user_data = user_snap.to_dict()
        
        # Get Skills
        skills = {}
        skills_ref = user_ref.collection("skills").stream()
        for doc_item in skills_ref:
            data = doc_item.to_dict()
            if "category" in data and "selfRating" in data:
                skills[data["category"]] = data["selfRating"]
                
        # Get Projects
        projects = []
        projects_ref = user_ref.collection("projects").stream()
        for doc_item in projects_ref:
            data = doc_item.to_dict()
            projects.append(ProjectItem(
                title=data.get("title", "Unnamed Project"),
                description=data.get("description", "No description")
            ))
            
        user_data["skills"] = skills
        user_data["projects"] = projects
        return user_data
    except Exception as e:
        print(f"Error fetching from Firestore: {e}")
        return {}

# Middleware/Utility to verify token
def verify_firebase_token(authorization: Optional[str] = Header(None)):
    if not firebase_initialized:
        # Bypass token validation if firebase is mock-configured
        return {"uid": "mock-user-123", "email": "mock@traject.dev"}
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    try:
        token = authorization.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Authorization Token: {e}")


# ==========================================
# AGENT 1: Profile Analyzer
# ==========================================
@app.post("/api/agent/profile")
def analyze_profile(req: UserProfileData):
    print(f"Agent profile received skills: {req.skills}", flush=True)
    print(f"Agent profile received careerGoal: {req.careerGoal}", flush=True)
    # Fetch from firestore if possible
    db_data = get_user_data(req.userId)
    
    # Merge input values
    name = req.name or db_data.get("name") or "MLE Candidate"
    academicYear = req.academicYear or db_data.get("academicYear") or "3rd"
    branch = req.branch or db_data.get("branch") or "Computer Science"
    careerGoal = req.careerGoal or db_data.get("careerGoal") or "MLE"
    skills = req.skills or db_data.get("skills") or {}
    projects = req.projects or db_data.get("projects") or []
    
    if not skills:
        # Default skills if none loaded
        skills = {cat: 1 for cat in BENCHMARKS.keys()}

    strong_list = []
    weak_list = []
    for cat, benchmark in BENCHMARKS.items():
        rating = skills.get(cat, 1)
        if rating >= benchmark:
            strong_list.append(cat)
        else:
            weak_list.append(cat)

    risk_reasons = {
        "MLOps": "MLOps is mandatory for serving models in production. Gaps here cause automatic screen failures at modern engineering teams.",
        "System Design": "System Design is heavily queried in advanced rounds. Candidates without this fail technical architecture questions.",
        "ML Knowledge": "Core ML theory and model evaluation are evaluated early. Lacking this leads to screening failures.",
        "DSA": "Data Structures & Algorithms are tested in initial coding rounds. Gaps here prevent progressing past coding filters.",
        "Projects": "Without portfolio projects, your resume lacks concrete evidence of applied engineering skills.",
        "Statistics": "Math/stats questions are common in ML tests. Gaps here limit model tuning and evaluation skills.",
        "SQL": "SQL is the baseline for data retrieval. Gaps here prevent passing coding screenings.",
        "Tools": "Modern ML pipelines require command line and Git fluency. Gaps here slow down team onboarding."
    }

    fallback_risk_areas = []
    for cat in weak_list[:3]:
        fallback_risk_areas.append({
            "category": cat,
            "riskLevel": "High" if cat in ["MLOps", "System Design", "ML Knowledge", "DSA"] else "Medium",
            "rejectionReason": risk_reasons.get(cat, "Weakness in this benchmark skill reduces overall competitive advantage in recruiting.")
        })

    next_skill = weak_list[0] if weak_list else "ML Knowledge"
    action_steps = {
        "ML Knowledge": "Complete Kaggle Learn's Intro to Machine Learning and fast.ai lessons.",
        "DSA": "Complete the LeetCode Easy core questions and NeetCode 150 Arrays/HashMaps.",
        "Projects": "Build a simple model served behind a FastAPI endpoint to prove applied skills.",
        "Statistics": "Review Bayes' theorem, hypothesis testing, and probability distributions on Khan Academy.",
        "SQL": "Complete all interactive modules on SQLBolt to master Joins and Aggregates.",
        "MLOps": "Complete Goku Mohandas's 'Made With ML' packaging and containerization modules.",
        "System Design": "Read Claypot AI's ML System Design course resources on model serving and feature stores.",
        "Tools": "Complete the MIT Missing Semester lecture on Git and command-line shell script practices."
    }

    fallback_next_action = {
        "category": next_skill,
        "actionStep": action_steps.get(next_skill, "Focused study to build fundamental competency."),
        "estimatedHours": 12 if next_skill in ["SQL", "Tools", "System Design"] else 25
    }

    # Local deterministic analysis will be executed below


    # Rule-Based Fallback Summary
    proj_count = len(projects)
    skills_strength = ", ".join(strong_list[:2]) if strong_list else "None yet"
    gaps_need_work = ", ".join(weak_list[:3]) if weak_list else "None"
    
    summary = (
        f"{name} is a {academicYear} year {branch} student aiming to become a {careerGoal}. "
        f"They demonstrate solid foundations in {skills_strength} with {proj_count} project(s) completed. "
        f"To meet MLE standards, they should focus on strengthening engineering capabilities in {gaps_need_work}."
    )
    
    return {
        "summary": summary,
        "strongAreas": strong_list if strong_list else ["None"],
        "weakAreas": weak_list if weak_list else list(BENCHMARKS.keys()),
        "careerRiskAreas": fallback_risk_areas,
        "nextActionSkill": fallback_next_action
    }


# ==========================================
# AGENT 2: Skill Gap Agent
# ==========================================
@app.post("/api/agent/skillgap")
def calculate_skill_gaps(req: SkillGapInput):
    print(f"Agent skillgap received skills: {req.skills}", flush=True)
    db_data = get_user_data(req.userId)
    skills = req.skills or db_data.get("skills") or {}
    
    if not skills:
        skills = {cat: 1 for cat in BENCHMARKS.keys()}
        
    gaps = []
    for category, benchmark in BENCHMARKS.items():
        rating = skills.get(category, 1)
        # Gap is calculated as benchmark - studentRating
        # If studentRating is higher, gap is 0 (or negative, let's keep max(0, gap) or actual gap. 
        # The prompt says: "Identify which categories are below benchmark and by how much."
        raw_gap = benchmark - rating
        gap_val = max(0, raw_gap)
        gaps.append({
            "category": category,
            "studentRating": rating,
            "benchmark": benchmark,
            "gap": gap_val
        })
        
    # Sort gaps with biggest gap first
    gaps.sort(key=lambda x: x["gap"], reverse=True)
    return {"gaps": gaps}


# ==========================================
# AGENT 3: Readiness Score Engine
# ==========================================
@app.post("/api/agent/score")
def calculate_readiness_score(req: ScoreInput):
    print(f"Agent score received skills: {req.skills}", flush=True)
    db_data = get_user_data(req.userId)
    skills = req.skills or db_data.get("skills") or {}
    
    if not skills:
        skills = {cat: 1 for cat in BENCHMARKS.keys()}
        
    breakdown = {}
    total_score = 0.0
    
    # Formula: For each category → (studentRating / 5) × weight × 100
    for category, weight in SKILL_WEIGHTS.items():
        rating = skills.get(category, 1)
        cat_score = (rating / 5.0) * weight * 100
        # Round category score to 1 decimal place
        rounded_cat_score = round(cat_score, 1)
        breakdown[category] = rounded_cat_score
        total_score += cat_score
        
    final_score = int(round(total_score))
    calculated_total = min(100, max(0, final_score))

    # Save score snapshot to Firestore if initialized
    if firebase_initialized and db_client:
        try:
            import time
            timestamp_str = str(int(time.time() * 1000))
            score_ref = db_client.collection("users").document(req.userId).collection("scoreHistory").document(timestamp_str)
            score_ref.set({
                "totalScore": calculated_total,
                "breakdown": breakdown,
                "skills": skills,
                "savedAt": timestamp_str
            })
            print(f"Saved score snapshot to Firestore for user {req.userId} at {timestamp_str}", flush=True)
        except Exception as e:
            print(f"Error saving score history to Firestore: {e}", flush=True)

    return {
        "totalScore": calculated_total,
        "breakdown": breakdown
    }


# ==========================================
# AGENT 4: Project Advisor Agent
# ==========================================
@app.post("/api/agent/projects")
def recommend_projects(req: ProjectAdvisorInput):
    print(f"Agent projects received skills: {req.skills}", flush=True)
    print(f"Agent projects received careerGoal: {req.careerGoal}", flush=True)
    db_data = get_user_data(req.userId)
    careerGoal = req.careerGoal or db_data.get("careerGoal") or "MLE"
    skills = req.skills or db_data.get("skills") or {}
    projects = req.projects or db_data.get("projects") or []
    
    if not skills:
        skills = {cat: 1 for cat in BENCHMARKS.keys()}

    # Find the top 3 biggest gaps to target
    gaps = []
    for cat, benchmark in BENCHMARKS.items():
        rating = skills.get(cat, 1)
        gaps.append((cat, benchmark - rating))
    gaps.sort(key=lambda x: x[1], reverse=True)
    top_gaps = [g[0] for g in gaps[:3]]
    
    existing_proj_titles = [p.title for p in projects] if isinstance(projects, list) else []

    # Local deterministic recommendation will be executed below


    # Dynamic Mapping for Gaps to Projects
    gap_projects_pool = {
        "MLOps": {
            "title": "Continuous Deployment ML Pipeline",
            "description": "Train a model and deploy it via FastAPI Dockerized to AWS/GCP with automated GitHub Actions tests.",
            "skillsTargeted": ["MLOps", "Tools", "ML Knowledge"],
            "difficulty": "Intermediate",
            "estimatedDays": 14
        },
        "System Design": {
            "title": "Real-time Stream Fraud Detection",
            "description": "Build a simulation pipeline that processes incoming transactions from a database and detects fraud using isolation forests.",
            "skillsTargeted": ["System Design", "SQL", "Statistics"],
            "difficulty": "Advanced",
            "estimatedDays": 21
        },
        "ML Knowledge": {
            "title": "Custom CNN Image Classifier",
            "description": "Implement a Convolutional Neural Network from scratch in PyTorch, utilizing transfer learning and learning rate schedules.",
            "skillsTargeted": ["ML Knowledge", "Projects", "Tools"],
            "difficulty": "Beginner",
            "estimatedDays": 10
        },
        "DSA": {
            "title": "Algorithmic Trading Backtester",
            "description": "Implement customized backtesting engines from scratch, optimizing computational complexity using data structures.",
            "skillsTargeted": ["DSA", "Statistics", "Tools"],
            "difficulty": "Advanced",
            "estimatedDays": 15
        },
        "SQL": {
            "title": "Scalable Relational ETL Pipeline",
            "description": "Design star schema relational models, loading and transforming millions of transactions with Postgres and SQL window functions.",
            "skillsTargeted": ["SQL", "Tools", "System Design"],
            "difficulty": "Intermediate",
            "estimatedDays": 10
        },
        "Statistics": {
            "title": "A/B Testing Simulation Engine",
            "description": "Build a statistical simulation suite to compute p-values, power analyses, and decision boundaries for experimental campaign trials.",
            "skillsTargeted": ["Statistics", "ML Knowledge", "SQL"],
            "difficulty": "Intermediate",
            "estimatedDays": 7
        },
        "Tools": {
            "title": "Dockerized Model Service with Monitoring",
            "description": "Package an ML predictor inside a container, setup Git integration, and track response latencies and drift using Prometheus.",
            "skillsTargeted": ["Tools", "MLOps", "Projects"],
            "difficulty": "Intermediate",
            "estimatedDays": 8
        },
        "Projects": {
            "title": "End-to-End Sentiment Analyzer",
            "description": "Build, evaluate, and package a sentiment prediction service, from dataset curation to model packaging and API serving.",
            "skillsTargeted": ["Projects", "ML Knowledge", "Tools"],
            "difficulty": "Beginner",
            "estimatedDays": 10
        }
    }

    # Rule-Based Fallback Projects based on gaps
    fallback_recs = []
    for gap_cat in top_gaps:
        if gap_cat in gap_projects_pool:
            fallback_recs.append(gap_projects_pool[gap_cat])

    # Fallback to general list if we don't have 3 recommendations
    general_pool = ["ML Knowledge", "MLOps", "System Design", "Projects"]
    for cat in general_pool:
        if len(fallback_recs) >= 3:
            break
        proj = gap_projects_pool[cat]
        if proj not in fallback_recs:
            fallback_recs.append(proj)

    return {"recommendations": fallback_recs[:3]}


# ==========================================
# AGENT 5: Resource Recommender Agent
# ==========================================
@app.post("/api/agent/resources")
def recommend_resources(req: ResourceInput):
    print(f"Agent resources received gaps count: {len(req.gaps) if req.gaps else 0}", flush=True)
    print(f"Agent resources received skills: {req.skills}", flush=True)
    # Retrieve gaps
    gaps_list = []
    if req.gaps is not None:
        gaps_list = req.gaps
    else:
        db_data = get_user_data(req.userId)
        skills = db_data.get("skills") or {}
        if not skills:
            skills = {cat: 1 for cat in BENCHMARKS.keys()}
        
        # Calculate gaps
        for category, benchmark in BENCHMARKS.items():
            rating = skills.get(category, 1)
            raw_gap = benchmark - rating
            if raw_gap > 0:
                gaps_list.append({
                    "category": category,
                    "studentRating": rating,
                    "benchmark": benchmark,
                    "gap": raw_gap
                })
    
    # Get categories that have gaps
    gap_categories = [g.get("category") for g in gaps_list if g.get("gap", 0) > 0]
    if not gap_categories:
        # If no gaps, recommend for lowest rating or general MLE skills
        gap_categories = ["ML Knowledge", "MLOps"]

    # Free resources mapping (rule-based)
    canned_resources = {
        "ML Knowledge": [
            {"resourceName": "Machine Learning Zoomcamp", "url": "https://github.com/DataTalksClub/machine-learning-zoomcamp", "type": "Course", "estimatedHours": 40},
            {"resourceName": "Intro to Machine Learning (Kaggle)", "url": "https://www.kaggle.com/learn/intro-to-machine-learning", "type": "Tutorial", "estimatedHours": 5}
        ],
        "DSA": [
            {"resourceName": "NeetCode Roadmap", "url": "https://neetcode.io/roadmap", "type": "Tutorial", "estimatedHours": 80},
            {"resourceName": "Data Structures & Algorithms Course (freeCodeCamp)", "url": "https://www.youtube.com/watch?v=RBSGKlAboiM", "type": "YouTube", "estimatedHours": 6}
        ],
        "Projects": [
            {"resourceName": "Hugging Face NLP Course", "url": "https://huggingface.co/learn/nlp-course", "type": "Course", "estimatedHours": 20},
            {"resourceName": "Build a Portfolio Site (GitHub Pages)", "url": "https://pages.github.com/", "type": "Documentation", "estimatedHours": 4}
        ],
        "Statistics": [
            {"resourceName": "StatQuest Machine Learning Videos", "url": "https://www.youtube.com/c/joshstarmer", "type": "YouTube", "estimatedHours": 15},
            {"resourceName": "Khan Academy Statistics & Probability", "url": "https://www.khanacademy.org/math/statistics-probability", "type": "Course", "estimatedHours": 25}
        ],
        "SQL": [
            {"resourceName": "SQLBolt - Learn SQL interactively", "url": "https://sqlbolt.com/", "type": "Tutorial", "estimatedHours": 5},
            {"resourceName": "Kaggle SQL Courses", "url": "https://www.kaggle.com/learn/intro-to-sql", "type": "Course", "estimatedHours": 8}
        ],
        "MLOps": [
            {"resourceName": "Made With ML (Goku Mohandas)", "url": "https://madewithml.com/", "type": "Course", "estimatedHours": 30},
            {"resourceName": "MLOps Zoomcamp", "url": "https://github.com/DataTalksClub/mlops-zoomcamp", "type": "Course", "estimatedHours": 45}
        ],
        "System Design": [
            {"resourceName": "Machine Learning System Design (Evidently AI)", "url": "https://www.evidentlyai.com/ml-system-design", "type": "Documentation", "estimatedHours": 12},
            {"resourceName": "ML System Design Course (Claypot AI)", "url": "https://huyenchip.com/ml-system-design/", "type": "Documentation", "estimatedHours": 15}
        ],
        "Tools": [
            {"resourceName": "The Missing Semester of Your CS Education (MIT)", "url": "https://missing.csail.mit.edu/", "type": "Course", "estimatedHours": 16},
            {"resourceName": "Pro Git Book (Free)", "url": "https://git-scm.com/book/en/v2", "type": "Documentation", "estimatedHours": 10}
        ]
    }

    # Kaggle Competitions & Practice Labs mapping
    kaggle_competitions_pool = {
        "ML Knowledge": [
            {"title": "Titanic - Machine Learning from Disaster", "url": "https://www.kaggle.com/c/titanic", "difficulty": "Beginner", "skillsTargeted": ["ML Knowledge", "Tools"]},
            {"title": "Spaceship Titanic", "url": "https://www.kaggle.com/c/spaceship-titanic", "difficulty": "Beginner", "skillsTargeted": ["ML Knowledge", "SQL"]}
        ],
        "DSA": [
            {"title": "Kaggle Community Code Challenges", "url": "https://www.kaggle.com/code", "difficulty": "Intermediate", "skillsTargeted": ["DSA", "Tools"]}
        ],
        "Projects": [
            {"title": "House Prices - Advanced Regression", "url": "https://www.kaggle.com/c/house-prices-advanced-regression-techniques", "difficulty": "Intermediate", "skillsTargeted": ["Projects", "ML Knowledge"]},
            {"title": "Store Sales - Time Series Forecasting", "url": "https://www.kaggle.com/c/store-sales-time-series-forecasting", "difficulty": "Intermediate", "skillsTargeted": ["Projects", "Statistics"]}
        ],
        "Statistics": [
            {"title": "Fetal Health Classification", "url": "https://www.kaggle.com/datasets/andrewmvd/fetal-health-classification", "difficulty": "Intermediate", "skillsTargeted": ["Statistics", "ML Knowledge"]}
        ],
        "SQL": [
            {"title": "SQL Summer Camp / Datasets", "url": "https://www.kaggle.com/tags/sql", "difficulty": "Beginner", "skillsTargeted": ["SQL", "Tools"]}
        ],
        "MLOps": [
            {"title": "LLM Science Exam (Submission Pipeline)", "url": "https://www.kaggle.com/c/llm-science-exam", "difficulty": "Advanced", "skillsTargeted": ["MLOps", "System Design"]}
        ],
        "System Design": [
            {"title": "OTTO - Multi-Objective Recommender System", "url": "https://www.kaggle.com/c/otto-recommender-system", "difficulty": "Advanced", "skillsTargeted": ["System Design", "Projects"]}
        ],
        "Tools": [
            {"title": "Kaggle Learn Python & Pandas", "url": "https://www.kaggle.com/learn", "difficulty": "Beginner", "skillsTargeted": ["Tools"]}
        ]
    }

    # Fetch unique kaggle competitions for gap categories
    fallback_kaggle = []
    for cat in gap_categories:
        if cat in kaggle_competitions_pool:
            fallback_kaggle.extend(kaggle_competitions_pool[cat])
    
    seen_kaggle = set()
    unique_fallback_kaggle = []
    for k in fallback_kaggle:
        if k["title"] not in seen_kaggle:
            seen_kaggle.add(k["title"])
            unique_fallback_kaggle.append(k)
    unique_fallback_kaggle = unique_fallback_kaggle[:3]

    # Local deterministic resource mapping will be executed below


    # Rule-Based Fallback Resources
    recs = []
    for cat in gap_categories:
        if cat in canned_resources:
            recs.extend([{"category": cat, **res} for res in canned_resources[cat]])
            
    return {
        "resources": recs,
        "kaggleCompetitions": unique_fallback_kaggle
    }


@app.get("/api/progress/{userId}")
def get_progress(userId: str):
    # Retrieve score history from Firestore
    history = []
    if firebase_initialized and db_client:
        try:
            history_ref = db_client.collection("users").document(userId).collection("scoreHistory").stream()
            for doc_item in history_ref:
                data = doc_item.to_dict()
                history.append(data)
        except Exception as e:
            print(f"Error fetching score history: {e}", flush=True)
    
    # Sort history by savedAt timestamp (convert to int to sort properly)
    try:
        history.sort(key=lambda x: int(x.get("savedAt", 0)))
    except Exception:
        pass
        
    if not history:
        return {
            "history": [],
            "improvement": 0,
            "firstScore": 0,
            "latestScore": 0,
            "daysTracked": 0
        }
        
    first_score = history[0].get("totalScore", 0)
    latest_score = history[-1].get("totalScore", 0)
    improvement = latest_score - first_score
    
    # Calculate days tracked
    days_tracked = 0
    try:
        first_time = int(history[0].get("savedAt", 0)) / 1000.0
        latest_time = int(history[-1].get("savedAt", 0)) / 1000.0
        time_diff = latest_time - first_time
        days_tracked = max(0, int(time_diff / (24 * 3600)))
    except Exception:
        pass
        
    return {
        "history": history,
        "improvement": improvement,
        "firstScore": first_score,
        "latestScore": latest_score,
        "daysTracked": days_tracked
    }

# In-memory cache for mock database mode
MOCK_MENTOR_CACHE = {}

def compute_fingerprint(req: MentorInput) -> str:
    # Serialize skills sorted by key
    skills_str = json.dumps(req.skills, sort_keys=True) if req.skills else ""
    profile_str = f"{req.name or ''}|{req.academicYear or ''}|{req.branch or ''}|{req.careerGoal or ''}|{req.weeklyHours or 0}|{req.githubUrl or ''}"
    combined = f"{profile_str}|{skills_str}|{req.readinessScore}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()

def should_regenerate_mentor_analysis(prev_report: Dict[str, Any], req: MentorInput) -> bool:
    # 1. 30 Days Cache Expiry Policy
    cached_at_str = prev_report.get("cachedAt")
    if cached_at_str:
        try:
            # Firestore uses ISO string. Parse it safely.
            if cached_at_str.endswith("Z"):
                cached_at_str = cached_at_str[:-1] + "+00:00"
            cached_at = datetime.fromisoformat(cached_at_str)
            now = datetime.now(timezone.utc)
            if now - cached_at >= timedelta(days=30):
                print("[Cache Expiry] Cached mentor analysis is older than 30 days. Regenerating.", flush=True)
                return True
        except Exception as e:
            print(f"Error parsing cachedAt in should_regenerate: {e}", flush=True)
            return True
    else:
        print("[Cache Invalidation] No cachedAt date found. Regenerating.", flush=True)
        return True

    # 2. Check if careerGoal changes
    prev_goal = prev_report.get("careerGoal")
    if prev_goal and prev_goal != req.careerGoal:
        print(f"[Cache Invalidation] Career goal changed from {prev_goal} to {req.careerGoal}. Regenerating.", flush=True)
        return True

    # 3. Check if weekly study commitment changes significantly (by 5+ hours)
    prev_hours = prev_report.get("weeklyHours")
    if prev_hours is not None and req.weeklyHours is not None:
        try:
            if abs(int(prev_hours) - int(req.weeklyHours)) >= 5:
                print(f"[Cache Invalidation] Weekly study hours changed significantly from {prev_hours} to {req.weeklyHours}. Regenerating.", flush=True)
                return True
        except Exception:
            pass

    # 4. Check if Readiness Score changes by 3+ points
    prev_score = prev_report.get("readinessScore")
    if prev_score is not None:
        try:
            if abs(int(prev_score) - int(req.readinessScore)) >= 3:
                print(f"[Cache Invalidation] Readiness score changed by 3+ points (from {prev_score} to {req.readinessScore}). Regenerating.", flush=True)
                return True
        except Exception:
            pass
    else:
        print("[Cache Invalidation] No readinessScore found in previous report. Regenerating.", flush=True)
        return True

    # 5. Check if a new skill assessment is completed (i.e. method goes from manual to assessment)
    prev_meta = prev_report.get("skillsMetadata", {})
    current_meta = req.skillsMetadata or {}
    for cat, meta in current_meta.items():
        prev_method = prev_meta.get(cat, {}).get("method", "manual")
        current_method = meta.get("method", "manual")
        if prev_method == "manual" and current_method == "assessment":
            print(f"[Cache Invalidation] Skill {cat} upgraded from manual to assessment. Regenerating.", flush=True)
            return True

    # 6. Check if a new project is completed (Compare length of projects list or project titles)
    prev_projects = prev_report.get("projects", [])
    current_projects = req.projects or []
    if len(prev_projects) != len(current_projects):
        print(f"[Cache Invalidation] Number of completed projects changed from {len(prev_projects)} to {len(current_projects)}. Regenerating.", flush=True)
        return True

    # If none of the meaningful change triggers fired, we can use the cache!
    print("[Cache Hit] No meaningful changes detected. Using cached mentor analysis.", flush=True)
    return False

# ==========================================
# AGENT 6: Mentor Analysis Agent
# ==========================================
@app.post("/api/agent/mentor")
def generate_mentor_analysis(req: MentorInput):
    print(f"Agent mentor analysis request received for user: {req.userId}", flush=True)
    
    current_hash = compute_fingerprint(req)
    current_timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    # 1. First-time Onboarding Bypass: If isOnboarding is True, force fresh generation
    if req.isOnboarding:
        print("[Onboarding Bypass] First-time onboarding detected. Forcing fresh mentor analysis generation.", flush=True)
    else:
        # Check cache
        prev_report = None
        
        if firebase_initialized and db_client:
            # Query Firestore for the latest report
            try:
                reports_ref = db_client.collection("users").document(req.userId).collection("reports")
                query_ref = reports_ref.order_by("generatedAt", direction=firestore.Query.DESCENDING).limit(1)
                docs = query_ref.get()
                if docs:
                    prev_report = docs[0].to_dict()
                    print(f"Loaded previous report from Firestore for cache validation.", flush=True)
            except Exception as e:
                print(f"Error loading previous report from Firestore: {e}", flush=True)
        else:
            # Look up in in-memory dictionary cache
            if req.userId in MOCK_MENTOR_CACHE:
                prev_report = MOCK_MENTOR_CACHE[req.userId].get("report")
                print(f"Loaded previous report from in-memory cache for validation.", flush=True)
                
        if prev_report:
            # Validate hash and expiration/thresholds
            has_matching_hash = prev_report.get("inputsHash") == current_hash
            
            # Check thresholds: should we regenerate?
            # If inputsHash matches exactly, we definitely skip regeneration (it's identical).
            # If inputsHash does not match, we check if changes exceed the meaningful threshold.
            if has_matching_hash:
                print("[Cache Hit] Inputs are identical. Loading cached mentor analysis.", flush=True)
                return {
                    "mentorAnalysis": prev_report.get("profileSummary", ""),
                    "inputsHash": current_hash,
                    "cachedAt": prev_report.get("cachedAt", current_timestamp),
                    "cached": True
                }
            elif not should_regenerate_mentor_analysis(prev_report, req):
                # Cache is valid and changes are minor
                print("[Cache Hit] Changes are below threshold. Loading cached mentor analysis.", flush=True)
                return {
                    "mentorAnalysis": prev_report.get("profileSummary", ""),
                    "inputsHash": prev_report.get("inputsHash", current_hash),
                    "cachedAt": prev_report.get("cachedAt", current_timestamp),
                    "cached": True
                }
            else:
                print("[Cache Miss] Meaningful changes detected. Regenerating mentor analysis.", flush=True)
        else:
            print("[Cache Miss] No previous report found. Generating first mentor analysis.", flush=True)

    # 2. Call Gemini-2.5-flash for fresh Mentor Analysis
    mentor_text = ""
    
    if gemini_initialized:
        try:
            # Format context to prompt
            skills_str = json.dumps(req.skills)
            gaps_str = json.dumps(req.skillGaps)
            projects_str = json.dumps([{"title": p.title, "description": p.description} for p in (req.projects or [])])
            recs_str = json.dumps(req.recommendedProjects)
            resources_str = json.dumps(req.recommendedResources)
            kaggle_str = json.dumps(req.kaggleCompetitions)
            
            prompt = f"""
            You are the Mentor Analysis Agent (Agent 6) for Traject, an MLE career readiness platform.
            Provide personalized career guidance, human-like reasoning, motivational coaching, and strategic advice for this student.

            Student Profile:
            - Name: {req.name or 'MLE Candidate'}
            - Year: {req.academicYear or '3rd'}
            - Branch: {req.branch or 'Computer Science'}
            - Goal: {req.careerGoal or 'Machine Learning Engineer'}
            - Weekly Study Hours: {req.weeklyHours or 10}
            - GitHub URL: {req.githubUrl or 'Not provided'}

            Readiness Metrics:
            - Score: {req.readinessScore}/100
            - Score Breakdown: {json.dumps(req.scoreBreakdown)}
            - Skill Gaps: {gaps_str}
            - Timeline Estimate: {req.timeline}

            Curated Recommendations:
            - Completed Projects: {projects_str}
            - Recommended Projects: {recs_str}
            - Recommended Learning Resources: {resources_str}
            - Kaggle Competitions: {kaggle_str}

            Task:
            Write a comprehensive, highly personalized mentor analysis and strategic advice block (3-4 sentences, or 1-2 short paragraphs).
            Analyze their strengths and prioritize their next focus area. Maintain an encouraging but realistic engineering mentor tone. 
            Do NOT mention JSON formatting in your feedback text. Return a clean block.

            Return the output strictly in the following JSON format:
            {{
                "mentorAnalysis": "Your personalized mentor review and strategic coaching feedback..."
            }}
            """
            
            import time
            start_time = time.time()
            timestamp_str = datetime.now(timezone.utc).isoformat()
            print("\n==============================\nGemini Request Started\nEndpoint: /api/agent/mentor\nModel: gemini-2.0-flash\nTimestamp: " + timestamp_str + "\n==============================\n", flush=True)
            
            try:
                # Using gemini-2.0-flash as requested
                print("[Gemini API] Calling gemini-2.0-flash for mentor analysis...", flush=True)
                model = genai.GenerativeModel('gemini-2.0-flash')
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                latency = time.time() - start_time
                print(f"\n==============================\nGemini Request Finished\nSuccess\nLatency: {latency:.4f}s\nStatus Code: 200\n==============================\n", flush=True)
                
                result = json.loads(response.text.strip())
                mentor_text = result.get("mentorAnalysis", "")
            except Exception as inner_e:
                latency = time.time() - start_time
                status_code = 429 if "429" in str(inner_e) or "quota" in str(inner_e).lower() or "ResourceExhausted" in str(type(inner_e)) else 500
                print(f"\n==============================\nGemini Request Finished\nFailed\nLatency: {latency:.4f}s\nStatus Code: {status_code}\n==============================\n", flush=True)
                import traceback
                print(traceback.format_exc(), flush=True)
                raise inner_e
        except Exception as e:
            # Fallback block caught the raised exception to maintain business logic
            pass

    # 3. Local fallback generation if Gemini failed or is not configured
    if not mentor_text:
        primary_gap = req.skillGaps[0].get("category", "ML Knowledge") if req.skillGaps else "ML Knowledge"
        mentor_text = (
            f"Hi {req.name or 'MLE Candidate'}, looking at your readiness score of {req.readinessScore}/100, you have built "
            f"some foundational MLE readiness. To progress towards your goal as a {req.careerGoal or 'Machine Learning Engineer'}, "
            f"your next focus should be closing your biggest skill gap in {primary_gap}. Commit to the {req.timeline} timeline "
            f"by executing on the recommended projects and working through the curated learning materials. Consistency is key."
        )

    # 4. Save to in-memory cache for mock mode
    if not firebase_initialized or not db_client:
        # Create a report structure matching comparisons
        MOCK_MENTOR_CACHE[req.userId] = {
            "fingerprint": current_hash,
            "mentorAnalysis": mentor_text,
            "report": {
                "readinessScore": req.readinessScore,
                "profileSummary": mentor_text,
                "inputsHash": current_hash,
                "cachedAt": current_timestamp,
                "careerGoal": req.careerGoal,
                "weeklyHours": req.weeklyHours,
                "skillsMetadata": req.skillsMetadata,
                "projects": req.projects
            }
        }
        print(f"Saved generated mentor analysis to in-memory mock cache for user {req.userId}.", flush=True)

    return {
        "mentorAnalysis": mentor_text,
        "inputsHash": current_hash,
        "cachedAt": current_timestamp,
        "cached": False
    }

@app.post("/api/agent/github")
def analyze_github(req: GitHubInput):
    print(f"GitHub Analyzer received URL: {req.githubUrl}", flush=True)
    
    # Extract username from URL
    username = req.githubUrl.strip().rstrip("/")
    if "github.com/" in username:
        username = username.split("github.com/")[-1].split("/")[0]
    
    if not username:
        raise HTTPException(status_code=400, 
            detail="Invalid GitHub URL")
    
    # Fetch GitHub data
    github_data = fetch_github_data(username)
    
    if not github_data.get("top_repos") and not github_data.get("public_repos"):
        raise HTTPException(status_code=404,
            detail=f"GitHub user '{username}' not found or has no public data")
    
    languages = github_data.get("languages", {})
    top_repos = github_data.get("top_repos", [])
    skills = req.skills or {}
    
    # Map GitHub languages to Traject skill categories
    skill_signals = {
        "ML Knowledge": any(r.get("language") in 
            ["Python", "Jupyter Notebook"] for r in top_repos),
        "Tools": any(l in languages for l in 
            ["Shell", "Dockerfile", "Makefile"]),
        "DSA": any(l in languages for l in 
            ["C++", "Java", "Python"]),
        "SQL": any("sql" in ((r.get("name") or "") + 
            str(r.get("topics") or [])).lower() for r in top_repos),
        "MLOps": any("deploy" in ((r.get("name") or "") + 
            (r.get("description") or "")).lower() or
            "docker" in ((r.get("name") or "") + 
            (r.get("description") or "")).lower() 
            for r in top_repos),
        "Projects": len([r for r in top_repos 
            if not r.get("fork")]) >= 3
    }
    
    # Verification: compare claimed skills vs GitHub evidence
    verifications = []
    for skill, has_evidence in skill_signals.items():
        claimed = skills.get(skill, 0)
        verifications.append({
            "skill": skill,
            "claimed": claimed,
            "githubEvidence": has_evidence,
            "status": "verified" if (has_evidence and claimed >= 3) 
                else "unverified" if (not has_evidence and claimed >= 3)
                else "building" if has_evidence 
                else "gap"
        })
    
    # Activity score based on repos and languages
    repo_count = len([r for r in top_repos if not r.get("fork", False)])
    activity_score = min(100, (repo_count * 8) + 
        (len(languages) * 5) + 
        (github_data.get("followers", 0) * 2))
    
    # Use Gemini for narrative analysis if available
    narrative = ""
    if gemini_initialized:
        try:
            repos_str = json.dumps(top_repos[:5], indent=2)
            skills_str = json.dumps(skills)
            lang_str = json.dumps(languages)
            
            prompt = f"""
You are the GitHub Analyzer agent for Traject, an MLE 
career readiness system.

Analyze this student's GitHub profile:
- Username: {username}
- Public repos: {github_data.get('public_repos', 0)}
- Languages used: {lang_str}
- Top repositories: {repos_str}
- Self-rated skills: {skills_str}

Write a 2-3 sentence honest analysis:
1. What their GitHub actually shows about their technical level
2. Whether their self-rated skills match their GitHub evidence
3. The single most important thing they should add to GitHub

Return strictly this JSON:
{{
    "narrative": "2-3 sentence honest analysis.",
    "topStrength": "One thing their GitHub shows well",
    "biggestGap": "One thing missing from their GitHub",
    "recommendation": "Single most important action to improve GitHub"
}}
"""
            import time
            start_time = time.time()
            timestamp_str = datetime.now(timezone.utc).isoformat()
            print("\n==============================\nGemini Request Started\nEndpoint: /api/agent/github\nModel: gemini-2.0-flash\nTimestamp: " + timestamp_str + "\n==============================\n", flush=True)
            
            try:
                model = genai.GenerativeModel('gemini-2.0-flash')
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                latency = time.time() - start_time
                print(f"\n==============================\nGemini Request Finished\nSuccess\nLatency: {latency:.4f}s\nStatus Code: 200\n==============================\n", flush=True)
                
                ai_result = json.loads(response.text.strip())
                narrative = ai_result.get("narrative", "")
                
                return {
                    "username": username,
                    "publicRepos": github_data.get("public_repos", 0),
                    "languages": languages,
                    "topRepos": top_repos[:5],
                    "activityScore": activity_score,
                    "skillVerifications": verifications,
                    "narrative": narrative,
                    "topStrength": ai_result.get("topStrength", ""),
                    "biggestGap": ai_result.get("biggestGap", ""),
                    "recommendation": ai_result.get("recommendation", "")
                }
            except Exception as inner_e:
                latency = time.time() - start_time
                status_code = 429 if "429" in str(inner_e) or "quota" in str(inner_e).lower() or "ResourceExhausted" in str(type(inner_e)) else 500
                print(f"\n==============================\nGemini Request Finished\nFailed\nLatency: {latency:.4f}s\nStatus Code: {status_code}\n==============================\n", flush=True)
                import traceback
                print(traceback.format_exc(), flush=True)
                raise inner_e
        except Exception as e:
            pass
    
    # Rule-based fallback narrative
    top_lang = max(languages, key=languages.get) if languages else "None"
    narrative = (
        f"{username} has {repo_count} original repositories, "
        f"primarily coding in {top_lang}. "
        f"Their GitHub activity {'supports' if activity_score > 40 else 'does not yet fully support'} "
        f"their self-rated skill profile."
    )
    
    return {
        "username": username,
        "publicRepos": github_data.get("public_repos", 0),
        "languages": languages,
        "topRepos": top_repos[:5],
        "activityScore": activity_score,
        "skillVerifications": verifications,
        "narrative": narrative,
        "topStrength": f"Active in {top_lang}" if top_lang != "None" else "Getting started",
        "biggestGap": "Add more ML/AI project repositories",
        "recommendation": "Pin your 3 best projects on your GitHub profile"
    }


def is_valid_bullet(line: str) -> bool:
    cleaned = line.strip()
    if not cleaned:
        return False
        
    # Check length
    if len(cleaned) < 15:
        return False
        
    # 1. Section titles
    section_titles = [
        "experience", "projects", "education", "skills", "summary", "objective", 
        "employment", "work history", "certifications", "awards", "publications", 
        "coursework", "languages", "interests", "activities", "profile"
    ]
    if cleaned.lower() in section_titles:
        return False
    if cleaned.isupper() and len(cleaned) < 35:
        return False
        
    # 2. Date ranges
    months = r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*'
    date_patterns = [
        rf'\b{months}\s+\d{{4}}\b',
        r'\b\d{4}\s*-\s*\d{4}\b',
        r'\b\d{4}\s*-\s*(?:Present|Current|Active)\b',
        rf'\b{months}\s*\d{{4}}\s*-\s*(?:Present|Current|Active|{months}\s*\d{{4}})\b',
        r'\b\d{2}/\d{4}\b',
        r'\b\d{2}/\d{2}\s*-\s*\d{2}/\d{2}\b',
        r'\b(?:Present|Current|Active)\b'
    ]
    for pattern in date_patterns:
        if re.search(pattern, cleaned, re.IGNORECASE):
            return False
            
    # 3. Location headers
    if cleaned.lower() in ["remote", "hybrid", "on-site", "onsite"]:
        return False
    if ',' in cleaned and len(cleaned) < 40:
        action_verbs = ["built", "designed", "optimized", "implemented", "deployed", "developed", "created", "led", "worked"]
        if not any(v in cleaned.lower() for v in action_verbs):
            return False
            
    # 4. Slashes
    if '/' in cleaned and 'http' not in cleaned.lower():
        if ' / ' in cleaned or len(re.findall(r'/', cleaned)) > 1:
            return False
            
    return True


def rule_based_rewrite(bullet: str, career_goal: str) -> Dict[str, str]:
    bullet_lower = bullet.lower()
    
    if career_goal == "MLE":
        if any(w in bullet_lower for w in ["model", "machine learning", "deep learning", "train", "pytorch", "tensorflow", "keras"]):
            suggested = "Designed and trained convolutional neural network models in PyTorch, achieving 94% classification accuracy and reducing inference latency by 15%."
            reason = "Replaces passive phrasing with action verbs (Designed, trained) and adds quantitative metrics."
        elif any(w in bullet_lower for w in ["data", "preprocess", "feature", "sql", "pandas", "numpy", "database"]):
            suggested = "Engineered scalable feature pipelines using SQL and Pandas, processing 10M+ rows of data and reducing data loading overhead by 25%."
            reason = "Adds specific tools used and quantifies data size and performance improvement."
        elif any(w in bullet_lower for w in ["deploy", "serve", "production", "fastapi", "flask", "docker", "kubernetes", "api"]):
            suggested = "Deployed machine learning models using FastAPI and Docker to AWS, handling 50k+ daily API requests with sub-50ms latency."
            reason = "Shows end-to-end MLOps experience and quantifies scale and performance."
        else:
            suggested = "Optimized model training pipelines in PyTorch, improving latency by 20% using Distributed Data Parallel and mixed precision."
            reason = "Lacked action verbs and measurable engineering impact metrics."
            
    elif career_goal == "Data Scientist":
        if any(w in bullet_lower for w in ["model", "regression", "classification", "predict", "forecast", "xgboost", "scikit-learn"]):
            suggested = "Developed predictive machine learning models using Scikit-Learn, improving business conversion rate by 12% on test datasets."
            reason = "Replaces passive phrasing with strong verbs and quantifies business impact."
        elif any(w in bullet_lower for w in ["data", "analysis", "insight", "tableau", "visualization", "power bi"]):
            suggested = "Analyzed 500k+ customer records using Pandas and SQL to identify key churn drivers, presenting insights via Tableau dashboards."
            reason = "Clearly defines data volume analyzed and the visualization tools used for reporting."
        elif any(w in bullet_lower for w in ["a/b", "experiment", "test", "hypothesis"]):
            suggested = "Designed and executed A/B testing campaigns, evaluating user engagement across 10k+ active participants with a statistically significant 8% lift."
            reason = "Quantifies the experiment scale and statistical significance."
        else:
            suggested = "Built statistical analysis models in Python, identifying key operational inefficiencies and saving $15k in annual costs."
            reason = "Lacks strong action verbs and measurable business value."
            
    else: # AI Engineer
        if any(w in bullet_lower for w in ["llm", "gpt", "openai", "rag", "langchain", "prompt", "vector", "pinecone", "embeddings"]):
            suggested = "Built a Retrieval-Augmented Generation (RAG) pipeline using LangChain and Pinecone, improving document retrieval accuracy by 22%."
            reason = "Details specific AI tools and quantifies retrieval performance gains."
        elif any(w in bullet_lower for w in ["api", "fastapi", "integration", "flask", "serve"]):
            suggested = "Integrated OpenAI API and developed custom FastAPI middleware, processing 100k+ monthly completions with 99.9% uptime."
            reason = "Specifies scale of API usage and system reliability metric."
        else:
            suggested = "Fine-tuned Llama models using LoRA and Hugging Face, reducing model size by 40% while preserving benchmark task accuracy."
            reason = "Lacked specific optimization techniques and target metrics."
            
    return {
        "original": bullet,
        "suggested": suggested,
        "reason": reason
    }


def rewrite_bullet_with_groq(original: str, career_goal: str) -> Optional[Dict[str, str]]:
    if not groq_client:
        return None
    try:
        prompt = f"""
You are an expert technical resume writer and MLE coach.
Optimize the following weak resume bullet point for a student aiming for a {career_goal} role.

Rules:
1. The suggested rewrite MUST be a single bullet point.
2. It MUST be strong, professional, and contain realistic metrics.
3. The reason should briefly explain what was wrong and how the revision improves it.

Original bullet: "{original}"

Return strictly a JSON object with keys "suggested" and "reason". Do not include any markdown wrappers or additional text.
Example:
{{
  "suggested": "Optimized model training latency by 20% in PyTorch using Distributed Data Parallel.",
  "reason": "Replaces passive phrasing with action verbs and adds specific tech stack and quantitative performance metrics."
}}
"""
        completion = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that returns only raw JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=256,
            response_format={"type": "json_object"}
        )
        res_text = completion.choices[0].message.content.strip()
        data = json.loads(res_text)
        if "suggested" in data and "reason" in data:
            return {
                "original": original,
                "suggested": data["suggested"],
                "reason": data["reason"]
            }
    except Exception as e:
        print(f"Error calling Groq for bullet rewrite: {e}", flush=True)
    return None


@app.post("/api/agent/resume")
def analyze_resume(
    file: UploadFile = File(...),
    userId: str = Form(...),
    careerGoal: str = Form("MLE"),
    skills: str = Form("{}")
):
    print(f"Resume Analyzer: user={userId} goal={careerGoal}", 
          flush=True)
    
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files are supported"
        )
    
    # Read file
    file_bytes = file.file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(
            status_code=400, 
            detail="File too large. Maximum size is 5MB"
        )
    
    # Extract text
    resume_text = extract_pdf_text(file_bytes)
    if not resume_text or len(resume_text) < 100:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from PDF. Make sure it is not a scanned image."
        )
    
    print(f"Extracted {len(resume_text)} characters from resume", 
          flush=True)
    
    # Parse skills from form string
    try:
        skills_dict = json.loads(skills)
    except Exception:
        skills_dict = {}
    
    # Calculate detailed scores locally
    ats_result = calculate_ats_score(resume_text, careerGoal)
    
    # Generate custom bullet rewrites
    sections = segment_resume_sections(resume_text)
    candidates = []
    for wb in ats_result.get("weakBullets", []):
        candidates.append(wb["original"])
    for b in ats_result.get("nonMetricBullets", []):
        candidates.append(b)
        
    seen = set()
    filtered_candidates = []
    for c in candidates:
        c_clean = c.strip()
        if c_clean in seen:
            continue
        seen.add(c_clean)
        if is_valid_bullet(c_clean):
            filtered_candidates.append(c_clean)
            
    if len(filtered_candidates) < 5:
        # Fallback to other parsed bullets from projects/experience
        all_bullets = []
        bullet_symbols = ('-', '•', '*', '+', '▪', '▫', '◦', '✓')
        for sec_name in ["experience", "projects"]:
            for line in sections.get(sec_name, []):
                cleaned = line.strip()
                if not cleaned:
                    continue
                if cleaned.startswith(bullet_symbols) or (len(cleaned) > 30 and (cleaned[0].isupper() or cleaned[0] in ['"', "'"])):
                    for sym in bullet_symbols:
                        if cleaned.startswith(sym):
                            cleaned = cleaned[len(sym):].strip()
                            break
                    all_bullets.append(cleaned)
        for ab in all_bullets:
            ab_clean = ab.strip()
            if ab_clean not in seen and is_valid_bullet(ab_clean):
                seen.add(ab_clean)
                filtered_candidates.append(ab_clean)
                if len(filtered_candidates) >= 5:
                    break
                    
    target_bullets = filtered_candidates[:5]
    bullet_rewrites = []
    for tb in target_bullets:
        rewrite = None
        if groq_client:
            rewrite = rewrite_bullet_with_groq(tb, careerGoal)
        if not rewrite:
            rewrite = rule_based_rewrite(tb, careerGoal)
        bullet_rewrites.append(rewrite)
        
    if not bullet_rewrites:
        bullet_rewrites = [
            rule_based_rewrite("Worked on machine learning model development", careerGoal)
        ]
    
    # Use Gemini for deep analysis if available
    if gemini_initialized:
        try:
            truncated = resume_text[:3000]
            
            prompt = f"""
You are a senior technical recruiter and the Resume Coach for Traject.
Analyze this resume for a student aiming to be a: {careerGoal}

RESUME TEXT:
{truncated}

Here is the exact deterministic analysis of their resume structure, content, and match metrics:
- Overall Resume Intelligence Score: {ats_result['resumeIntelligenceScore']}/100
- Structure Score: {ats_result['structureScore']}/100
- Content Quality Score: {ats_result['contentQualityScore']}/100
- Achievement/Impact Score: {ats_result['achievementScore']}/100
- Technical Skills Score: {ats_result['technicalSkillsScore']}/100
- Project Quality Score: {ats_result['projectQualityScore']}/100
- ATS Compatibility Score: {ats_result['atsCompatibilityScore']}/100
- Career Match Score: {ats_result['careerMatchScore']}/100

Contact Gaps: {ats_result['contactInfo']}
Missing Sections: {ats_result['missingSections']}
Weak Bullet Points: {json.dumps(ats_result['weakBullets'])}
Bullets lacking metrics: {json.dumps(ats_result['nonMetricBullets'])}
Missing Crucial Skills: {ats_result['missingCrucialSkills']}
Project Breakdown: {json.dumps(ats_result['projectsList'])}
ATS Formatting Issues: {ats_result['atsFindings']}

Your task:
1. Write a 2-3 sentence overall assessment of this resume for the {careerGoal} role. Be honest, professional, and reference actual content.
2. Write a 3-4 sentence professional summary/objective section optimized for {careerGoal} ATS systems.
3. List exactly 5 specific strengths of this resume, citing actual lines/projects.
4. List exactly 5 specific critical weaknesses, citing actual lines/projects.
5. Provide a side-by-side optimization of the weak bullet points. Give exactly 3 bullet point rewrites in the 'weakBulletExamples' list.
6. Provide specific project improvement suggestions for the projects mentioned in the resume. 
7. Provide a prioritized action plan (checklist of exactly 4 steps) to step up their resume compatibility.

Return strictly this JSON:
{{
    "overallAssessment": "2-3 sentence honest critique.",
    "improvedSummary": "ATS optimized summary suggestion.",
    "strengths": [
        "Strength 1 citing specific project/skill",
        "Strength 2 citing specific project/skill",
        "Strength 3 citing specific project/skill",
        "Strength 4 citing specific project/skill",
        "Strength 5 citing specific project/skill"
    ],
    "weaknesses": [
        "Weakness 1 citing specific gap/project",
        "Weakness 2 citing specific gap/project",
        "Weakness 3 citing specific gap/project",
        "Weakness 4 citing specific gap/project",
        "Weakness 5 citing specific gap/project"
    ],
    "missingSections": ["Section Name", "Section Name"],
    "weakBulletExamples": [
        {{
            "original": "original bullet text from resume",
            "suggested": "rewritten version with strong verbs and metrics",
            "reason": "explanation of what was wrong (passive voice, etc.)"
        }},
        ...
    ],
    "projectImprovementSuggestions": [
        {{
            "projectTitle": "Title of Project from resume",
            "suggestion": "Specific, evidence-based improvement citing what was missing (e.g. 'Project does not mention deployment or datasets. Add FastAPI deployment and use custom ImageNet dataset.')"
        }},
        ...
    ],
    "roleAlignmentFeedback": "Detail how well their skills match the career goal and what skills appear naturally vs just a list.",
    "atsImprovementSuggestions": [
        "ATS optimization recommendation 1",
        "ATS optimization recommendation 2"
    ],
    "prioritizedActionPlan": [
        "Priority action 1",
        "Priority action 2",
        "Priority action 3",
        "Priority action 4"
    ]
}}
"""
            import time
            start_time = time.time()
            timestamp_str = datetime.now(timezone.utc).isoformat()
            print("\n==============================\nGemini Request Started\nEndpoint: /api/agent/resume\nModel: gemini-2.0-flash\nTimestamp: " + timestamp_str + "\n==============================\n", flush=True)
            
            try:
                model = genai.GenerativeModel('gemini-2.0-flash')
                response = model.generate_content(
                    prompt,
                    generation_config={
                        "response_mime_type": "application/json"
                    }
                )
                latency = time.time() - start_time
                print(f"\n==============================\nGemini Request Finished\nSuccess\nLatency: {latency:.4f}s\nStatus Code: 200\n==============================\n", flush=True)
                
                ai_result = json.loads(response.text.strip())
                
                return {
                    **ats_result,
                    "overallAssessment": ai_result.get("overallAssessment", ""),
                    "improvedSummary": ai_result.get("improvedSummary", ""),
                    "strengths": ai_result.get("strengths", []),
                    "weaknesses": ai_result.get("weaknesses", []),
                    "weakBulletExamples": ai_result.get("weakBulletExamples", []),
                    "bulletRewrites": bullet_rewrites,
                    "projectImprovementSuggestions": ai_result.get("projectImprovementSuggestions", []),
                    "roleAlignmentFeedback": ai_result.get("roleAlignmentFeedback", ""),
                    "atsImprovementSuggestions": ai_result.get("atsImprovementSuggestions", []),
                    "prioritizedActionPlan": ai_result.get("prioritizedActionPlan", []),
                    "resumeLength": len(resume_text)
                }
            except Exception as inner_e:
                latency = time.time() - start_time
                status_code = 429 if "429" in str(inner_e) or "quota" in str(inner_e).lower() or "ResourceExhausted" in str(type(inner_e)) else 500
                print(f"\n==============================\nGemini Request Finished\nFailed\nLatency: {latency:.4f}s\nStatus Code: {status_code}\n==============================\n", flush=True)
                import traceback
                print(traceback.format_exc(), flush=True)
                raise inner_e
            
        except Exception as e:
            pass
    
    # Rule-based fallback
    fallback_result = {
        **ats_result,
        "overallAssessment": (
            f"This resume scores {ats_result['atsScore']}/100 for {careerGoal} compatibility. "
            f"Structure: {ats_result['structureScore']}, Content Quality: {ats_result['contentQualityScore']}, "
            f"Achievements: {ats_result['achievementScore']}. Focus on adding missing technical "
            f"keywords and strengthening the projects section."
        ),
        "improvedSummary": (
            f"Motivated {careerGoal} candidate with experience in "
            f"{', '.join(ats_result['foundKeywords'][:3])}. Seeking to apply engineering "
            f"skills to solve complex problems."
        ),
        "strengths": [
            f"Good keywords found for {careerGoal}: {', '.join(ats_result['foundKeywords'][:3])}",
            "Structure matches basic recruiter requirements" if not ats_result["missingSections"] else "Standard headings parsed",
            "Contains contact details" if ats_result["contactInfo"]["email"] else "Standard headers parsed",
            "Has a Projects section for practical demonstration" if "projects" in resume_text.lower() else "Standard section ordering",
            "Technical skill category coverage is initialized"
        ],
        "weaknesses": [
            f"Missing required keywords: {', '.join(ats_result['missingKeywords'][:3])}",
            f"Lacks metric-based achievements in some bullet points" if ats_result["nonMetricBullets"] else "Could increase quantifiable metrics",
            f"Uses passive/weak phrasing in {len(ats_result['weakBullets'])} bullet points" if ats_result["weakBullets"] else "Enhance ownership in project descriptions",
            f"Missing sections: {', '.join(ats_result['missingSections'])}" if ats_result["missingSections"] else "Add more specialized certifications",
            "Skills list could match target profile more naturally"
        ],
        "missingSections": ats_result["missingSections"],
        "weakBulletExamples": [
            {
                "original": wb["original"],
                "suggested": wb["suggested"],
                "reason": wb["reason"]
            } for wb in ats_result["weakBullets"]
        ] if ats_result["weakBullets"] else [
            {
                "original": "Worked on machine learning model",
                "suggested": "Trained and optimized XGBoost models, improving prediction accuracy by 14% on tabular data",
                "reason": "Passive wording and lacks specific metrics."
            }
        ],
        "bulletRewrites": bullet_rewrites,
        "projectImprovementSuggestions": [
            {
                "projectTitle": proj["title"],
                "suggestion": f"Project score is {proj['score']}/100. "
                             f"{'Add Docker containerization or FastAPI serving.' if not proj['hasDeployment'] else ''} "
                             f"{'Specify dataset used (e.g. ImageNet, Kaggle).' if not proj['hasDataset'] else ''} "
                             f"{'Quantify performance results (latency, accuracy).' if not proj['hasResults'] else ''}"
            } for proj in ats_result["projectsList"]
        ] if ats_result["projectsList"] else [
            {
                "projectTitle": "N/A",
                "suggestion": "Add at least 2 Machine Learning projects with clear datasets and deployment details."
            }
        ],
        "roleAlignmentFeedback": (
            f"Your skills show {ats_result['careerMatchScore']}/100 alignment with the {careerGoal} profile. "
            f"Add natural tech context in project details rather than simple keyword lists."
        ),
        "atsImprovementSuggestions": ats_result["atsFindings"] or ["Ensure single-column layout with no tables/icons."],
        "prioritizedActionPlan": [
            f"Add missing keywords: {', '.join(ats_result['missingKeywords'][:4])}",
            "Quantify achievements in non-metric bullet points",
            "Include FastAPI / Docker serving inside projects",
            "Include GitHub repositories links for validation"
        ],
        "resumeLength": len(resume_text)
    }
    
    return fallback_result


@app.get("/api/test-gemini")
async def test_gemini():
    if not gemini_initialized:
        return {"status": "error", "message": "Gemini not initialized. Check GEMINI_API_KEY in .env"}
    
    import time
    start_time = time.time()
    timestamp_str = datetime.now(timezone.utc).isoformat()
    print("\n==============================\nGemini Request Started\nEndpoint: /api/test-gemini\nModel: gemini-2.0-flash\nTimestamp: " + timestamp_str + "\n==============================\n", flush=True)
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content("Reply with just the word: WORKING")
        latency = time.time() - start_time
        print(f"\n==============================\nGemini Request Finished\nSuccess\nLatency: {latency:.4f}s\nStatus Code: 200\n==============================\n", flush=True)
        return {"status": "success", "response": response.text.strip()}
    except Exception as e:
        latency = time.time() - start_time
        status_code = 429 if "429" in str(e) or "quota" in str(e).lower() or "ResourceExhausted" in str(type(e)) else 500
        print(f"\n==============================\nGemini Request Finished\nFailed\nLatency: {latency:.4f}s\nStatus Code: {status_code}\n==============================\n", flush=True)
        import traceback
        print(traceback.format_exc(), flush=True)
        return {"status": "error", "message": str(e)}

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "gemini": "initialized" if gemini_initialized else "NOT initialized - check GEMINI_API_KEY",
        "firebase": "initialized" if firebase_initialized else "NOT initialized - check serviceAccountKey.json"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
