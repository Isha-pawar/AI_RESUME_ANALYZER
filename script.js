alert("JS WORKING");
alert("START");
// ==================== RESUME ANALYZER ENGINE ====================
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from',
  'is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','shall','can','need','must','that',
  'this','these','those','i','me','my','we','our','you','your','he','she','it',
  'they','them','their','what','which','who','when','where','why','how','all','each',
  'every','both','few','more','most','other','some','such','no','not','only','own',
  'same','so','than','too','very','just','because','as','until','while','about',
  'between','through','during','before','after','above','below','up','down','out',
  'off','over','under','again','further','then','once','also','etc','using','used',
  'able','well','work','working','worked','experience','experienced','including',
]);

const TECH_SKILLS = [
  'javascript','typescript','python','java','c++','c#','ruby','go','rust','swift',
  'kotlin','php','scala','r','matlab','sql','nosql','html','css','sass','less',
  'react','angular','vue','svelte','next.js','nuxt','node.js','express','django',
  'flask','spring','rails','laravel','fastapi','graphql','rest','api',
  'aws','azure','gcp','docker','kubernetes','terraform','jenkins','ci/cd',
  'git','github','gitlab','bitbucket','jira','agile','scrum',
  'mongodb','postgresql','mysql','redis','elasticsearch','dynamodb','firebase',
  'machine learning','deep learning','nlp','computer vision','tensorflow','pytorch',
  'pandas','numpy','scikit-learn','data analysis','data science','big data',
  'figma','sketch','adobe','photoshop','illustrator','ui/ux','responsive design',
  'linux','unix','bash','powershell','networking','security','devops',
  'blockchain','web3','solidity','smart contracts',
  'project management','leadership','communication','problem solving','teamwork',
];

const RESUME_SECTIONS = [
  'education','experience','skills','projects','certifications',
  'summary','objective','achievements','awards','publications',
  'languages','interests','references','volunteer','training',
];

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function extractKeywords(text) {
  const tokens = tokenize(text);
  const freq = {};
  tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  const lower = text.toLowerCase();
  const bigrams = {};
  const words = lower.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const bg = `${words[i]} ${words[i+1]}`.replace(/[^a-z0-9+#./\s-]/g, '');
    if (bg.length > 3) bigrams[bg] = (bigrams[bg] || 0) + 1;
  }
  const sorted = Object.entries(freq).filter(([w]) => w.length > 2).sort((a,b) => b[1]-a[1]).slice(0,50).map(([w]) => w);
  const sortedBg = Object.entries(bigrams).filter(([bg]) => { const p = bg.split(' '); return !STOP_WORDS.has(p[0]) && !STOP_WORDS.has(p[1]); }).sort((a,b) => b[1]-a[1]).slice(0,20).map(([bg]) => bg);
  return [...new Set([...sorted, ...sortedBg])];
}

function extractSkills(text) {
  const lower = text.toLowerCase();
  return TECH_SKILLS.filter(s => lower.includes(s));
}

function detectSections(text) {
  const lower = text.toLowerCase();
  return RESUME_SECTIONS.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(lower));
}

function cosineSimilarity(a, b) {
  const setA = new Set(a), setB = new Set(b);
  const inter = [...setA].filter(x => setB.has(x));
  if (!setA.size || !setB.size) return 0;
  return inter.length / Math.sqrt(setA.size * setB.size);
}

function analyzeResume(resumeText, jobDescription) {
  const resumeKW = extractKeywords(resumeText);
  const jobKW = extractKeywords(jobDescription);
  const resumeSkills = extractSkills(resumeText);
  const jobSkills = extractSkills(jobDescription);
  const sections = detectSections(resumeText);
  const lower = resumeText.toLowerCase();

  const matchedKeywords = jobKW.filter(kw => lower.includes(kw));
  const missingKeywords = jobKW.filter(kw => !lower.includes(kw));
  const matchedSkills = jobSkills.filter(s => resumeSkills.includes(s));
  const missingSkills = jobSkills.filter(s => !resumeSkills.includes(s));

  const kwSim = cosineSimilarity(resumeKW, jobKW);
  const kwCov = jobKW.length > 0 ? matchedKeywords.length / jobKW.length : 0;
  const keywordScore = Math.round((kwSim * 0.4 + kwCov * 0.6) * 100);
  const skillScore = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 50;

  const req = ['education','experience','skills','projects'];
  const foundReq = req.filter(s => sections.includes(s));
  const missingSections = req.filter(s => !sections.includes(s));
  const structureScore = Math.round((foundReq.length / req.length) * 100);
  const overallScore = Math.round(keywordScore * 0.4 + skillScore * 0.35 + structureScore * 0.25);

  const suggestions = [];
  if (missingSkills.length > 0) suggestions.push({ category: 'skills', priority: 'high', text: `Add these missing skills: ${missingSkills.slice(0,5).join(', ')}` });
  if (missingKeywords.length > 3) suggestions.push({ category: 'keywords', priority: 'high', text: `Include these keywords: ${missingKeywords.slice(0,5).join(', ')}` });
  missingSections.forEach(s => suggestions.push({ category: 'structure', priority: s === 'experience' || s === 'skills' ? 'high' : 'medium', text: `Add a "${s}" section to your resume` }));
  const wc = resumeText.split(/\s+/).length;
  if (wc < 200) suggestions.push({ category: 'content', priority: 'high', text: 'Your resume seems too short. Add more detail.' });
  else if (wc > 1000) suggestions.push({ category: 'content', priority: 'medium', text: 'Consider condensing your resume to 1-2 pages.' });
  if (!resumeText.match(/\d+%|\d+\+|increased|decreased|improved|reduced|achieved|delivered/i)) suggestions.push({ category: 'content', priority: 'medium', text: 'Quantify your achievements with numbers.' });
  if (keywordScore < 40) suggestions.push({ category: 'keywords', priority: 'high', text: 'Low keyword overlap. Tailor your resume more closely.' });
  if (overallScore >= 70) suggestions.push({ category: 'content', priority: 'low', text: 'Good match! Fine-tune by mirroring exact phrasing from the job description.' });

  return { overallScore, keywordScore, skillScore, structureScore, matchedSkills, missingSkills, matchedKeywords, missingKeywords, detectedSections: sections, missingSections, suggestions, resumeWordCount: wc, jobKeywordCount: jobKW.length };
}

// ==================== PDF PARSER ====================
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function extractTextFromPDF(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    text += tc.items.map(it => it.str).join(' ') + '\n';
  }
  return text.trim();
}

// ==================== ICONS (SVG strings) ====================
const icons = {
  fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
  sun: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
  sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  upload: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
  rotateCcw: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
  loader: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinner"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  zap: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  alert: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  lightbulb: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="m12 8 .01"/></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  user: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>',
  barChart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
  target: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  award: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>',
  trendingUp: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  alertCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  google: '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>',
  github: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
};

// ==================== APP STATE ====================
let currentPage = 'home';
let selectedFile = null;
let analysisResult = null;
let isDark = false;

// ==================== TOAST ====================
function showToast(title, desc, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-title">${title}</div><div class="toast-desc">${desc}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ==================== THEME ====================
function initTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark = true;
    document.documentElement.classList.add('dark');
  }
  updateThemeBtn();
}

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeBtn();
}

function updateThemeBtn() {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.innerHTML = isDark ? icons.sun : icons.moon;
  });
}

// ==================== NAVIGATION ====================
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) { el.classList.add('active'); currentPage = page; }
  window.scrollTo(0, 0);
}

// ==================== SCORE CIRCLE SVG ====================
function createScoreCircle(score, size = 180) {
  const r = 45, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 75 ? 'hsl(var(--success))' : score >= 50 ? 'hsl(var(--primary))' : score >= 30 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
  return `
    <div class="score-circle">
      <svg width="${size}" height="${size}" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="hsl(var(--muted))" stroke-width="8"/>
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}" style="transition: stroke-dashoffset 1.5s ease-out; animation: scoreStroke 1.5s ease-out;"/>
      </svg>
      <span class="score-circle-text">${score}%</span>
      <span class="score-circle-label">Overall Score</span>
    </div>`;
}

// ==================== RENDER PAGES ====================
function renderHome() {
  return `
    <nav class="nav">
      <div class="nav-inner">
        <button class="nav-logo" onclick="navigate('home')">
          <span class="logo-icon">${icons.fileText}</span>
          <span class="logo-text">ResumeAI</span>
        </button>
        <div class="nav-actions">
          <button class="btn btn-ghost btn-sm" onclick="navigate('login')">Log in</button>
          <button class="btn btn-primary btn-sm" onclick="navigate('register')">Sign up</button>
          <button class="btn btn-ghost btn-icon theme-toggle" onclick="toggleTheme()">${isDark ? icons.sun : icons.moon}</button>
        </div>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-bg"><div class="hero-orb hero-orb-1"></div><div class="hero-orb hero-orb-2"></div></div>
      <div class="container hero-content fade-in">
        <div class="badge badge-primary" style="margin-bottom:2rem">${icons.zap} AI-Powered Resume Analysis — Free & Instant</div>
        <h1>Land Your Dream Job with<span class="text-gradient" style="display:block;margin-top:.5rem">AI Resume Analysis</span></h1>
        <p>Upload your resume, paste a job description, and get instant AI-powered feedback with match scores, missing skills, and actionable improvement tips.</p>
        <div class="hero-cta">
          <button class="btn btn-primary btn-lg" onclick="navigate('analyze')">Analyze My Resume ${icons.arrowRight}</button>
          <button class="btn btn-outline btn-lg" onclick="navigate('login')">Sign in to Save Results</button>
        </div>
        <div class="trust-badges fade-in fade-in-delay-3">
          <span>${icons.check} Free to use</span>
          <span>${icons.check} No sign-up required</span>
          <span>${icons.check} Instant results</span>
        </div>
      </div>
    </section>

    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          ${[{v:'10,000+',l:'Resumes Analyzed'},{v:'95%',l:'Accuracy Rate'},{v:'50+',l:'Skills Tracked'},{v:'4.9/5',l:'User Rating'}].map(s => `
            <div class="stat-item fade-in"><p class="stat-value text-gradient">${s.v}</p><p class="stat-label">${s.l}</p></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header"><span class="overline">Simple Process</span><h2>How It Works</h2></div>
        <div class="steps-grid">
          ${[{n:'01',t:'Upload Resume',d:'Drop your PDF resume into our secure uploader'},{n:'02',t:'Paste Job Description',d:'Enter the target job description to compare against'},{n:'03',t:'Get Analysis',d:'Receive detailed scores, charts, and improvement tips'}].map((s,i) => `
            <div class="step-card card-hover fade-in fade-in-delay-${i+1}">
              <div class="card"><span class="step-num">${s.n}</span><h3>${s.t}</h3><p>${s.d}</p></div>
              ${i < 2 ? `<span class="step-arrow">${icons.chevronRight}</span>` : ''}
            </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-header"><span class="overline">Features</span><h2>Powerful Analysis Tools</h2><p>Everything you need to optimize your resume and land more interviews</p></div>
        <div class="features-grid">
          ${[
            {i:icons.sparkles,t:'AI-Powered Analysis',d:'NLP-based keyword extraction and intelligent skill matching using cosine similarity'},
            {i:icons.barChart,t:'Visual Reports',d:'Interactive charts showing match score, keyword coverage and skill breakdown'},
            {i:icons.download,t:'PDF Reports',d:'Download a professional, detailed analysis report for your records'},
            {i:icons.fileText,t:'Smart Suggestions',d:'Actionable tips to improve your resume for the target role'},
            {i:icons.shield,t:'Section Detection',d:'Automatically identifies education, experience, skills, and project sections'},
            {i:icons.target,t:'Gap Analysis',d:'Highlights missing keywords and skills you need to add'},
          ].map((f,i) => `
            <div class="feature-card card-hover fade-in fade-in-delay-${(i%3)+1}">
              <div class="card"><div class="feature-icon">${f.i}</div><h3>${f.t}</h3><p>${f.d}</p></div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header"><span class="overline">Testimonials</span><h2>Loved by Job Seekers</h2></div>
        <div class="testimonials-grid">
          ${[
            {n:'Priya Sharma',r:'Software Engineer at Google',t:'ResumeAI helped me tailor my resume perfectly. I got 3x more interview callbacks!'},
            {n:'Rahul Verma',r:'Data Analyst at Microsoft',t:'The keyword analysis feature is incredible. It showed me exactly what I was missing.'},
            {n:'Anita Desai',r:'Full Stack Developer',t:'Best resume tool I\'ve used. The PDF report is very professional and detailed.'},
          ].map(t => `
            <div class="testimonial-card card fade-in">
              <div class="stars">${icons.star}${icons.star}${icons.star}${icons.star}${icons.star}</div>
              <p class="quote">"${t.t}"</p>
              <div class="testimonial-author">
                <div class="author-avatar">${t.n.charAt(0)}</div>
                <div><p class="author-name">${t.n}</p><p class="author-role">${t.r}</p></div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <div class="cta-section">
      <div class="cta-box fade-in">
        <h2>Ready to Optimize Your Resume?</h2>
        <p>Join thousands of job seekers who have improved their resumes and landed their dream jobs.</p>
        <button class="btn btn-invert btn-lg" onclick="navigate('analyze')" style="position:relative">Get Started — It's Free ${icons.arrowRight}</button>
      </div>
    </div>

    <footer class="footer">
      <div class="container footer-inner">
        <button class="nav-logo" onclick="navigate('home')"><span class="logo-icon" style="height:2rem;width:2rem">${icons.fileText}</span><span class="logo-text">ResumeAI</span></button>
        <div class="footer-links">
          <a href="#" onclick="navigate('analyze');return false">Analyze</a>
          <a href="#" onclick="navigate('login');return false">Login</a>
          <a href="#" onclick="navigate('register');return false">Register</a>
        </div>
        <p class="footer-copy">© 2025 ResumeAI. Built for placement success.</p>
      </div>
    </footer>`;
}

function renderAnalyze() {
  return `
    <nav class="nav">
      <div class="nav-inner">
        <button class="nav-logo" onclick="navigate('home')">
          <span style="margin-right:.25rem">${icons.arrowLeft}</span>
          <span class="logo-icon">${icons.fileText}</span>
          <span class="logo-text">ResumeAI</span>
        </button>
        <button class="btn btn-ghost btn-icon theme-toggle" onclick="toggleTheme()">${isDark ? icons.sun : icons.moon}</button>
      </div>
    </nav>

    <main class="analyze-page container">
      <div class="analyze-form fade-in">
        <div class="text-center" style="margin-bottom:2.5rem">
          <div class="badge badge-primary" style="margin-bottom:1rem">${icons.zap} AI-Powered Analysis</div>
          <h1>Analyze Your Resume</h1>
          <p style="color:hsl(var(--muted-fg));margin-top:.5rem">Upload your resume and paste the job description to get started</p>
        </div>

        <div class="form-group">
          <label class="form-label">Resume (PDF)</label>
          <div id="file-upload-area">
            <label class="file-upload" id="drop-zone" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleDrop(event)">
              ${icons.upload}
              <p>Drop your resume here or click to browse</p>
              <small>Supports PDF files</small>
              <input type="file" accept=".pdf" onchange="handleFileSelect(event)">
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Job Description</label>
          <textarea id="job-desc" class="textarea" placeholder="Paste the job description here..." rows="10"></textarea>
        </div>

        <button id="analyze-btn" class="btn btn-primary btn-lg" style="width:100%;border-radius:var(--radius)" onclick="runAnalysis()">
          ${icons.sparkles} Analyze Resume
        </button>

        <div class="info-badges">
          <span>${icons.shield} Secure & Private</span>
          <span>${icons.zap} Instant Results</span>
        </div>
      </div>
    </main>`;
}

function renderResults() {
  if (!analysisResult) return '';
  const r = analysisResult;
  const label = r.overallScore >= 75 ? 'Excellent Match' : r.overallScore >= 50 ? 'Good Match' : r.overallScore >= 30 ? 'Needs Improvement' : 'Poor Match';
  const sc = r.overallScore >= 75 ? 'color:hsl(var(--success))' : r.overallScore >= 50 ? 'color:hsl(var(--primary))' : r.overallScore >= 30 ? 'color:hsl(var(--warning))' : 'color:hsl(var(--destructive))';

  return `
    <nav class="nav">
      <div class="nav-inner">
        <button class="nav-logo" onclick="navigate('home')">
          <span class="logo-icon">${icons.fileText}</span>
          <span class="logo-text">ResumeAI</span>
        </button>
        <button class="btn btn-ghost btn-icon theme-toggle" onclick="toggleTheme()">${isDark ? icons.sun : icons.moon}</button>
      </div>
    </nav>

    <main class="results-page container">
      <div class="results-container">
        <div class="results-header fade-in">
          <div><h1>Analysis Results</h1><p style="color:hsl(var(--muted-fg));margin-top:.25rem">Resume: ${selectedFile ? selectedFile.name : 'Resume'}</p></div>
          <div class="results-actions">
            <button class="btn btn-outline" onclick="navigate('analyze')">${icons.rotateCcw} New Analysis</button>
            <button class="btn btn-primary" onclick="downloadReport()">${icons.download} Download Report</button>
          </div>
        </div>

        <!-- Score Hero -->
        <div class="card score-hero fade-in fade-in-delay-1" style="margin-bottom:1.5rem">
          <div class="score-inner">
            <div class="score-circle-wrap">${createScoreCircle(r.overallScore)}</div>
            <div class="score-details">
              <div style="display:flex;align-items:center;gap:.5rem;${currentPage === 'results' ? '' : ''}">
                <span style="${sc}">${icons.award}</span>
                <h2 class="score-label" style="${sc}">${label}</h2>
              </div>
              <p class="score-desc">Your resume matches <strong>${r.overallScore}%</strong> of the job requirements</p>
              <div class="score-breakdown">
                <div class="score-item"><div class="score-item-label">${icons.trendingUp} Keywords</div><div class="score-item-value">${r.keywordScore}%</div></div>
                <div class="score-item"><div class="score-item-label">${icons.award} Skills</div><div class="score-item-value">${r.skillScore}%</div></div>
                <div class="score-item"><div class="score-item-label">${icons.fileText} Structure</div><div class="score-item-value">${r.structureScore}%</div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid fade-in fade-in-delay-2">
          <div class="card chart-card"><h3>Score Breakdown</h3><canvas id="barChart" height="220"></canvas></div>
          <div class="card chart-card">
            <h3>Keyword Coverage</h3>
            <canvas id="doughnutChart" height="180"></canvas>
            <div class="chart-legend">
              <span><span class="chart-legend-dot" style="background:hsl(var(--primary))"></span> Matched: ${r.matchedKeywords.length}</span>
              <span><span class="chart-legend-dot" style="background:hsl(var(--destructive))"></span> Missing: ${r.missingKeywords.length}</span>
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="grid-2 fade-in fade-in-delay-3" style="margin-bottom:1.5rem">
          <div class="card">
            <h3 style="font-family:var(--font-display);margin-bottom:1rem;display:flex;align-items:center;gap:.5rem">
              <span style="color:hsl(var(--success))">${icons.award}</span> Matched Skills (${r.matchedSkills.length})
            </h3>
            <div class="skills-wrap">
              ${r.matchedSkills.length > 0 ? r.matchedSkills.map(s => `<span class="badge badge-success">✓ ${s}</span>`).join('') : '<p style="font-size:.875rem;color:hsl(var(--muted-fg))">No matching skills detected</p>'}
            </div>
          </div>
          <div class="card">
            <h3 style="font-family:var(--font-display);margin-bottom:1rem;display:flex;align-items:center;gap:.5rem">
              <span style="color:hsl(var(--destructive))">${icons.alertCircle}</span> Missing Skills (${r.missingSkills.length})
            </h3>
            <div class="skills-wrap">
              ${r.missingSkills.length > 0 ? r.missingSkills.map(s => `<span class="badge badge-destructive">✗ ${s}</span>`).join('') : '<p style="font-size:.875rem;color:hsl(var(--muted-fg))">Great! No missing skills</p>'}
            </div>
          </div>
        </div>

        <!-- Missing Keywords -->
        ${r.missingKeywords.length > 0 ? `
        <div class="card fade-in fade-in-delay-4" style="margin-bottom:1.5rem">
          <h3 style="font-family:var(--font-display);margin-bottom:1rem;display:flex;align-items:center;gap:.5rem">
            <span style="color:hsl(var(--warning))">${icons.alertCircle}</span> Missing Keywords
          </h3>
          <div class="skills-wrap">${r.missingKeywords.slice(0,20).map(kw => `<span class="badge badge-warning">${kw}</span>`).join('')}</div>
        </div>` : ''}

        <!-- Resume Sections -->
        <div class="card fade-in fade-in-delay-4" style="margin-bottom:1.5rem">
          <h3 style="font-family:var(--font-display);margin-bottom:1rem">Resume Structure</h3>
          <div class="grid-4">
            ${['education','experience','skills','projects','certifications','summary','achievements'].map(s => {
              const found = r.detectedSections.includes(s);
              return `<div class="section-check ${found ? 'found' : 'missing'}">${found ? '✓' : '○'} ${s}</div>`;
            }).join('')}
          </div>
        </div>

        <!-- Suggestions -->
        <div class="fade-in fade-in-delay-5">
          <h3 style="font-family:var(--font-display);font-size:1.25rem;margin-bottom:1rem">Improvement Suggestions (${r.suggestions.length})</h3>
          <div style="display:flex;flex-direction:column;gap:.75rem">
            ${r.suggestions.map(s => {
              const ic = s.priority === 'high' ? icons.alert : s.priority === 'medium' ? icons.lightbulb : icons.info;
              return `<div class="suggestion ${s.priority}">
                <span class="suggestion-icon">${ic}</span>
                <div>
                  <div class="suggestion-meta">
                    <span class="suggestion-category">${s.category}</span>
                    <span class="suggestion-priority">${s.priority}</span>
                  </div>
                  <p class="suggestion-text">${s.text}</p>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </main>`;
}

function renderLogin() {
  return `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-left-content">
          <div class="auth-left-icon">${icons.fileText}</div>
          <h2>Welcome Back</h2>
          <p>Sign in to access your resume analysis history and saved reports.</p>
          <div class="auth-scores">
            ${[85,92,78].map(s => `<div class="auth-score-item"><p>${s}%</p><p>Score</p></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-right-header">
          <button class="nav-logo" onclick="navigate('home')"><span class="logo-icon">${icons.fileText}</span><span class="logo-text">ResumeAI</span></button>
          <button class="btn btn-ghost btn-icon theme-toggle" onclick="toggleTheme()">${isDark ? icons.sun : icons.moon}</button>
        </div>
        <div class="auth-form-wrap">
          <div class="auth-form fade-in">
            <h1>Sign in</h1>
            <p>Enter your credentials to access your account</p>
            <form onsubmit="handleLogin(event)">
              <div><label class="form-label">Email</label><div class="input-icon">${icons.mail}<input class="input" type="email" id="login-email" placeholder="you@example.com" style="height:3rem;border-radius:var(--radius)"></div></div>
              <div><div class="form-row-between"><label class="form-label">Password</label><button type="button" class="forgot-link">Forgot password?</button></div><div class="input-icon">${icons.lock}<input class="input" type="password" id="login-password" placeholder="••••••••" style="height:3rem;border-radius:var(--radius);padding-right:2.5rem"><button type="button" class="input-icon-right" onclick="togglePasswordVisibility('login-password', this)">${icons.eye}</button></div></div>
              <button type="submit" class="btn btn-primary" style="width:100%;height:3rem;border-radius:var(--radius)">Sign in ${icons.arrowRight}</button>
            </form>
            <div class="auth-divider"><span>or continue with</span></div>
            <div class="social-btns">
              <button class="btn btn-outline" style="height:3rem;border-radius:var(--radius)">${icons.google} Google</button>
              <button class="btn btn-outline" style="height:3rem;border-radius:var(--radius)">${icons.github} GitHub</button>
            </div>
            <p class="auth-switch">Don't have an account? <a href="#" onclick="navigate('register');return false">Sign up</a></p>
          </div>
        </div>
      </div>
    </div>`;
}

function renderRegister() {
  return `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-left-content">
          <div class="auth-left-icon">${icons.fileText}</div>
          <h2>Join ResumeAI</h2>
          <p>Create an account to unlock all features and boost your career.</p>
          <div class="auth-benefits">
            ${['Save your analysis history','Track resume improvements over time','Download unlimited PDF reports','Get personalized suggestions'].map(b => `<div class="auth-benefit">${icons.check} ${b}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-right-header">
          <button class="nav-logo" onclick="navigate('home')"><span class="logo-icon">${icons.fileText}</span><span class="logo-text">ResumeAI</span></button>
          <button class="btn btn-ghost btn-icon theme-toggle" onclick="toggleTheme()">${isDark ? icons.sun : icons.moon}</button>
        </div>
        <div class="auth-form-wrap">
          <div class="auth-form fade-in">
            <h1>Create account</h1>
            <p>Start optimizing your resume today</p>
            <form onsubmit="handleRegister(event)">
              <div><label class="form-label">Full Name</label><div class="input-icon">${icons.user}<input class="input" type="text" id="reg-name" placeholder="John Doe" style="height:3rem;border-radius:var(--radius)"></div></div>
              <div><label class="form-label">Email</label><div class="input-icon">${icons.mail}<input class="input" type="email" id="reg-email" placeholder="you@example.com" style="height:3rem;border-radius:var(--radius)"></div></div>
              <div><label class="form-label">Password</label><div class="input-icon">${icons.lock}<input class="input" type="password" id="reg-password" placeholder="••••••••" style="height:3rem;border-radius:var(--radius);padding-right:2.5rem"><button type="button" class="input-icon-right" onclick="togglePasswordVisibility('reg-password', this)">${icons.eye}</button></div></div>
              <button type="submit" class="btn btn-primary" style="width:100%;height:3rem;border-radius:var(--radius)">Create account ${icons.arrowRight}</button>
            </form>
            <div class="auth-divider"><span>or sign up with</span></div>
            <div class="social-btns">
              <button class="btn btn-outline" style="height:3rem;border-radius:var(--radius)">${icons.google} Google</button>
              <button class="btn btn-outline" style="height:3rem;border-radius:var(--radius)">${icons.github} GitHub</button>
            </div>
            <p class="auth-switch">Already have an account? <a href="#" onclick="navigate('login');return false">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>`;
}

// ==================== RENDER ENGINE ====================
const renderers = { home: renderHome, analyze: renderAnalyze, results: renderResults, login: renderLogin, register: renderRegister };

function render() {
  Object.keys(renderers).forEach(page => {
    const el = document.getElementById(`page-${page}`);
    if (el) el.innerHTML = renderers[page]();
  });
  // Re-attach file upload listeners after render if on analyze
  if (currentPage === 'analyze') setupFileUpload();
  if (currentPage === 'results' && analysisResult) setTimeout(initCharts, 100);
}

function navigateAndRender(page) {
  currentPage = page;
  render();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  window.scrollTo(0, 0);
}

// Override navigate
navigate = navigateAndRender;

// ==================== FILE UPLOAD ====================
function setupFileUpload() {
  if (selectedFile) updateFileDisplay();
}

function handleDrop(e) {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (f && f.type === 'application/pdf') { selectedFile = f; updateFileDisplay(); }
}

function handleFileSelect(e) {
  const f = e.target.files[0];
  if (f) { selectedFile = f; updateFileDisplay(); }
}

function updateFileDisplay() {
  const area = document.getElementById('file-upload-area');
  if (!area) return;
  if (selectedFile) {
    area.innerHTML = `
      <div class="file-selected">
        <span style="color:hsl(var(--primary))">${icons.fileText}</span>
        <div class="file-info"><p>${selectedFile.name}</p><small>${(selectedFile.size / 1024).toFixed(1)} KB</small></div>
        <button class="file-clear" onclick="clearFile()">${icons.x}</button>
      </div>`;
  } else {
    area.innerHTML = `
      <label class="file-upload" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleDrop(event)">
        ${icons.upload}<p>Drop your resume here or click to browse</p><small>Supports PDF files</small>
        <input type="file" accept=".pdf" onchange="handleFileSelect(event)">
      </label>`;
  }
}

function clearFile() { selectedFile = null; updateFileDisplay(); }

// ==================== ANALYSIS ====================
async function runAnalysis() {
  const jobDesc = document.getElementById('job-desc')?.value || '';
  if (!selectedFile || !jobDesc.trim()) {
    showToast('Missing input', 'Please upload a resume and enter a job description.', 'destructive');
    return;
  }

  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.innerHTML = `${icons.loader} Analyzing your resume...`;

  try {
    const text = await extractTextFromPDF(selectedFile);
    if (!text || text.length < 50) {
      showToast('Could not extract text', 'The PDF may be image-based or empty.', 'destructive');
      btn.disabled = false;
      btn.innerHTML = `${icons.sparkles} Analyze Resume`;
      return;
    }
    analysisResult = analyzeResume(text, jobDesc);
    navigate('results');
  } catch (err) {
    console.error(err);
    showToast('Analysis failed', 'Something went wrong. Please try again.', 'destructive');
    btn.disabled = false;
    btn.innerHTML = `${icons.sparkles} Analyze Resume`;
  }
}

// ==================== CHARTS (Chart.js) ====================
function initCharts() {
  if (!analysisResult) return;

  const r = analysisResult;

  // Destroy old charts if exist
  if (window.barChart) window.barChart.destroy();
  if (window.doughnutChart) window.doughnutChart.destroy();

  // Bar Chart
  const barCtx = document.getElementById('barChart');
  if (barCtx) {
    window.barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Keywords', 'Skills', 'Structure'],
        datasets: [{
          label: 'Score',
          data: [r.keywordScore, r.skillScore, r.structureScore],
          backgroundColor: ['#14b8a6', '#3b82f6', '#22c55e'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }

  // Doughnut Chart
  const doughnutCtx = document.getElementById('doughnutChart');
  if (doughnutCtx) {
    window.doughnutChart = new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Matched', 'Missing'],
        datasets: [{
          data: [r.matchedKeywords.length, r.missingKeywords.length],
          backgroundColor: ['#3b82f6', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}



// ==================== PDF REPORT ====================
function downloadReport() {
  if (!analysisResult) return;
  const r = analysisResult; // must match charts
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22); doc.setTextColor(22,130,113);
  doc.text('Resume Analysis Report', pw/2, 25, { align: 'center' });

  // Scores
  doc.setFontSize(16); doc.setTextColor(40,40,40);
  doc.text('Overall Match Score', 20, 50);
  doc.setFontSize(36); doc.setTextColor(22,130,113);
  doc.text(`${r.overallScore}%`, 20, 65);
  doc.setFontSize(11); doc.setTextColor(80,80,80);
  doc.text(`Keyword: ${r.keywordScore}% | Skill: ${r.skillScore}% | Structure: ${r.structureScore}%`, 20, 75);

  // Matched Skills
  let y = 90;
  doc.setFontSize(14); doc.text('Matched Skills', 20, y);
  if (r.matchedSkills.length) {
    doc.autoTable({
      startY: y+5,
      head:[['Skill','Status']],
      body: r.matchedSkills.map(s => [s,'✓ Found']),
      theme:'striped',
      headStyles:{fillColor:[22,130,113]},
      margin:{left:20,right:20}
    });
  }

  // Missing Skills
  y = doc.lastAutoTable?.finalY + 15 || y + 20;
  doc.setFontSize(14); doc.text('Missing Skills', 20, y);
  if (r.missingSkills.length) {
    doc.autoTable({
      startY: y+5,
      head:[['Skill','Status']],
      body: r.missingSkills.map(s => [s,'✗ Missing']),
      theme:'striped',
      headStyles:{fillColor:[200,60,60]},
      margin:{left:20,right:20}
    });
  }

  // Suggestions
  doc.addPage();
  doc.setFontSize(16); doc.setTextColor(22,130,113); 
  doc.text('Improvement Suggestions', 20, 25);
  doc.autoTable({
    startY: 35,
    head: [['Priority','Category','Suggestion']],
    body: r.suggestions.map(s => [s.priority.toUpperCase(), s.category, s.text]),
    theme:'striped',
    headStyles:{fillColor:[22,130,113]},
    columnStyles:{0:{cellWidth:25},1:{cellWidth:25}},
    margin:{left:20,right:20}
  });

  doc.save('resume-analysis-report.pdf');
}
// ==================== AUTH HANDLERS ====================
// REGISTER
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      showToast('Success', 'Registered successfully!', 'success');
    } else {
      showToast('Error', data.error || 'Registration failed', 'error');
    }
  } catch (err) { console.error(err); }
}

// LOGIN
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      showToast('Success', 'Logged in successfully!', 'success');
    } else {
      showToast('Error', data.error || 'Login failed', 'error');
    }
  } catch (err) { console.error(err); }
}
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text'; btn.innerHTML = icons.eyeOff; }
  else { input.type = 'password'; btn.innerHTML = icons.eye; }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  render();
  document.getElementById('page-home').classList.add('active');
});

// ==================== AUTH ====================

// LOGIN
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast('Login Failed', data.message || 'Invalid credentials', 'destructive');
      return;
    }

    localStorage.setItem('token', data.token);
    showToast('Success', 'Logged in successfully!');
    navigate('home');

  } catch (err) {
    showToast('Error', 'Server not responding', 'destructive');
  }
}


// REGISTER
async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast('Registration Failed', data.message || 'Error occurred', 'destructive');
      return;
    }

    showToast('Success', 'Account created successfully!');
    navigate('login');

  } catch (err) {
    showToast('Error', 'Server not responding', 'destructive');
  }
}