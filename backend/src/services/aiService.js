const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model priority: each has its own separate free tier quota
const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];

function getModel(modelName) {
  return genAI.getGenerativeModel({ model: modelName || MODELS[0] });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Call Gemini with automatic retry and model fallback on rate limits
 */
async function callWithRetry(promptOrParts, preferredModel) {
  const modelsToTry = preferredModel ? [preferredModel, ...MODELS.filter(m => m !== preferredModel)] : [...MODELS];

  for (const modelName of modelsToTry) {
    try {
      const model = getModel(modelName);
      const result = Array.isArray(promptOrParts)
        ? await model.generateContent(promptOrParts)
        : await model.generateContent(promptOrParts);
      console.log(`✅ AI call succeeded with model: ${modelName}`);
      return result;
    } catch (err) {
      if (err.status === 429) {
        console.warn(`⚠️ Rate limited on ${modelName}, trying next model...`);
        await sleep(2000); // Brief pause before trying next model
        continue;
      }
      throw err; // Non-rate-limit errors should propagate
    }
  }
  throw new Error('All AI models are rate-limited. Please wait a few minutes and try again. The free tier has daily request limits.');
}

/**
 * Helper: extract JSON from AI response text
 */
function extractJSON(text) {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

/**
 * Parse raw job text and extract structured JSON
 */
async function parseJobWithAI(rawText) {
  const prompt = `You are a job post parser. Extract structured JSON from the given job content.
Output ONLY valid JSON with these keys:
  jobTitle, company, requiredSkills (array), preferredSkills (array),
  responsibilities (array), minExperience, location, workMode,
  hrEmail (if found, else null), salaryRange (if found, else null), applyLink (if found, else null)

Job content:
${rawText}`;

  const result = await callWithRetry(prompt);
  return extractJSON(result.response.text());
}

/**
 * Parse raw job text from a screenshot image (Gemini Vision)
 */
async function parseJobFromImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const ext = require('path').extname(imagePath).toLowerCase();
  const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/png';

  const result = await callWithRetry([
    {
      inlineData: { mimeType, data: base64 },
    },
    {
      text: `Read this job posting screenshot and extract structured JSON with these keys:
  jobTitle, company, requiredSkills (array), preferredSkills (array),
  responsibilities (array), minExperience, location, workMode,
  hrEmail (if found, else null), salaryRange (if found, else null), applyLink (if found, else null)

Output ONLY valid JSON.`,
    },
  ], 'gemini-2.0-flash');

  return extractJSON(result.response.text());
}

/**
 * Parse resume text into structured profile
 */
async function parseResumeWithAI(rawText) {
  const prompt = `You are a resume parser. Extract a structured profile from this resume text.
Output ONLY valid JSON with these keys:
{
  "profileSummary": { "name": "", "title": "", "summary": "", "email": "", "phone": "", "linkedin": "" },
  "skills": ["skill1", "skill2"],
  "experience": [
    { "company": "", "title": "", "startDate": "", "endDate": "", "bullets": ["..."] }
  ],
  "education": [
    { "institution": "", "degree": "", "year": "" }
  ],
  "projects": [
    { "name": "", "description": "", "technologies": ["..."] }
  ]
}

Resume text:
${rawText}`;

  const result = await callWithRetry(prompt);
  return extractJSON(result.response.text());
}

/**
 * Tailor CV to match job description
 */
async function tailorCV(resumeProfile, jobData, userInfo) {
  const prompt = `You are an expert CV writer. Given a candidate profile and a job description,
rewrite the candidate's experience bullets and skills section to best match the job.
Keep all facts true — only reframe and reorder. Output structured JSON.

Output format:
{
  "name": "",
  "title": "tailored title matching the job",
  "email": "",
  "phone": "",
  "linkedin": "",
  "summary": "2-3 line tailored professional summary",
  "skills": ["ordered by relevance to job"],
  "experience": [
    { "company": "", "title": "", "startDate": "", "endDate": "", "bullets": ["tailored bullets"] }
  ],
  "education": [{ "institution": "", "degree": "", "year": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [] }]
}

CANDIDATE_PROFILE: ${JSON.stringify(resumeProfile.profileSummary)}
EXPERIENCE: ${JSON.stringify(resumeProfile.experience)}
SKILLS: ${JSON.stringify(resumeProfile.skills)}
EDUCATION: ${JSON.stringify(resumeProfile.education)}
PROJECTS: ${JSON.stringify(resumeProfile.projects)}

JOB_DESCRIPTION: ${JSON.stringify(jobData)}

USER_INFO: {
  currentCTC: "${userInfo?.currentCTC || 'not specified'}",
  expectedCTC: "${userInfo?.expectedCTC || 'not specified'}",
  noticePeriod: "${userInfo?.noticePeriod || 'not specified'}",
  isServing: ${userInfo?.isServing || false}
}`;

  const result = await callWithRetry(prompt);
  return extractJSON(result.response.text());
}

/**
 * Write personalized email to HR
 */
async function writeEmail(jobData, resumeProfile, userInfo) {
  const tone = userInfo?.aiTone || 'formal';

  const prompt = `You are a professional job applicant. Write a concise, personalized cold email
to an HR at ${jobData.company || 'the company'} for the role of ${jobData.jobTitle || 'the position'}.
Mention: notice period, expected CTC, key matching skills.
Tone: ${tone}. Keep it under 200 words.

Output ONLY valid JSON: { "subject": "...", "body": "..." }

JOB: ${JSON.stringify(jobData)}
MY_PROFILE: ${JSON.stringify(resumeProfile.profileSummary)}
MY_INFO: {
  currentCTC: "${userInfo?.currentCTC || 'not specified'}",
  expectedCTC: "${userInfo?.expectedCTC || 'not specified'}",
  noticePeriod: "${userInfo?.noticePeriod || 'not specified'}",
  isServing: ${userInfo?.isServing || false},
  phone: "${userInfo?.phone || ''}",
  linkedin: "${userInfo?.linkedinUrl || ''}"
}`;

  const result = await callWithRetry(prompt);
  return extractJSON(result.response.text());
}

module.exports = { parseJobWithAI, parseJobFromImage, parseResumeWithAI, tailorCV, writeEmail };
