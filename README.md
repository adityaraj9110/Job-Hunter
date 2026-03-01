# 🚀 JobHunter — Personal Job Application Automation Portal

> A self-hosted, AI-powered portal that automatically extracts job details from URLs or screenshots, generates a tailored CV, and sends personalized emails to HRs — all from your own dashboard.

---

## 📌 Table of Contents

1. [Project Vision](#project-vision)
2. [System Architecture](#system-architecture)
3. [How It Works — Full Flow](#how-it-works--full-flow)
4. [Tech Stack](#tech-stack)
5. [Features by Page](#features-by-page)
6. [AI Pipeline Deep Dive](#ai-pipeline-deep-dive)
7. [Folder Structure](#folder-structure)
8. [Environment Variables](#environment-variables)
9. [Setup & Installation](#setup--installation)
10. [API Reference](#api-reference)
11. [Security Considerations](#security-considerations)
12. [Roadmap](#roadmap)

---

## 🎯 Project Vision

JobHunter is your personal **job application co-pilot**. Instead of manually crafting CVs and writing cover emails for every job, you:

1. Drop a job URL or screenshot into the portal
2. AI reads the job description, extracts key requirements and HR contact
3. AI generates a **tailored CV** matching the job description to your profile
4. A **personalized email** is sent via your SMTP to the HR/recruiter automatically
5. Everything is logged in your dashboard

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │   Home   │  │   Info   │  │  Resume  │  │  Apply (Main)  │  │
│  │Dashboard │  │ Settings │  │ Uploader │  │  URL/Screenshot│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API / Axios
┌───────────────────────────▼─────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                  │
│                                                                   │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Auth Module   │  │ Job Extractor│  │   CV Generator      │  │
│  │ (JWT + bcrypt) │  │ (URL/Image)  │  │  (AI-Powered)       │  │
│  └────────────────┘  └──────┬───────┘  └──────────┬──────────┘  │
│                             │                      │             │
│  ┌────────────────┐  ┌──────▼───────┐  ┌──────────▼──────────┐  │
│  │  SMTP Service  │  │  AI Service  │  │  PDF/DOCX Generator │  │
│  │  (Nodemailer)  │  │ (Claude API) │  │  (Puppeteer/docx)   │  │
│  └────────┬───────┘  └──────────────┘  └─────────────────────┘  │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
┌───────────▼───────────────────────────────────────────────────────┐
│                     DATABASE (MongoDB Atlas)                       │
│  userinfos │ resumeprofiles │ applications                        │
└───────────────────────────────────────────────────────────────────┘

External Services:
  ├── Google Gemini API     → Job parsing, CV generation, email writing
  ├── LinkedIn (scraping)   → Job details extraction via URL
  ├── Playwright/Puppeteer  → Browser automation for screenshot parsing
  └── SMTP (Gmail/Custom)   → Email delivery
```

---

## 🔄 How It Works — Full Flow

### Flow 1: URL-Based Application

```
User pastes LinkedIn/job URL
          │
          ▼
    Backend receives URL
          │
          ▼
  Playwright headless browser
  scrapes the job page HTML
          │
          ▼
  Claude AI extracts:
  ┌─────────────────────────┐
  │ • Job Title             │
  │ • Company Name          │
  │ • Required Skills       │
  │ • Responsibilities      │
  │ • HR/Contact Email      │
  │ • Location / Mode       │
  │ • Experience Required   │
  └─────────────────────────┘
          │
          ▼
  AI matches your Profile Summary
  + Resume Data + User Info
  (CTC, ECTC, Notice Period)
          │
          ▼
  AI generates tailored CV (PDF)
  highlighting matching skills
          │
          ▼
  AI writes personalized email:
  • Subject line
  • Body referencing the job
  • Mention of notice period,
    expected CTC, etc.
          │
          ▼
  Nodemailer sends email with
  CV attached via your SMTP
          │
          ▼
  Application logged to DB
  + shown on Home dashboard
```

### Flow 2: Screenshot-Based Application

```
User uploads job screenshot (PNG/JPG)
          │
          ▼
  Claude Vision API reads image
  extracts all visible text
          │
          ▼
  Same pipeline as URL flow →
  CV generation → Email send → Log
```

---

## 🧰 Tech Stack

| Layer         | Technology                       | Why                                        |
| ------------- | -------------------------------- | ------------------------------------------ |
| Frontend      | Next.js 14 (App Router)          | SSR, file-based routing, fast              |
| UI Styling    | Tailwind CSS + shadcn/ui         | Fast, clean, accessible components         |
| Backend       | Node.js + Express                | Simple REST API, great ecosystem           |
| Database      | MongoDB Atlas + Mongoose ODM     | Flexible documents, cloud-hosted, scalable |
| AI Engine     | Google Gemini API (Free Tier)    | Vision + text, generous free quota         |
| Job Scraping  | Playwright (headless browser)    | Handles dynamic JS-rendered pages          |
| Email         | Nodemailer                       | SMTP support, attachment handling          |
| CV Generation | PDFKit or react-pdf              | Programmatic PDF from template             |
| Auth          | JWT + bcrypt (single-user)       | Self-hosted personal portal                |
| File Storage  | Local filesystem / S3 (optional) | Resume + generated CV storage              |
| Deployment    | Docker + Docker Compose          | Self-hosted, portable                      |

---

## 📱 Features by Page

### 🏠 Home — Dashboard

- **Sent Applications Feed**: List of all emails sent with timestamp, company, job title, status
- **Stats Cards**: Total applied, this week, this month
- **Quick Preview**: Click any application to see the CV that was sent + email content
- **Status Tracking**: Mark as "Got Reply", "Rejected", "Interview Scheduled"

### ℹ️ Info — Personal Settings

All fields are inline-editable and saved in DB:

| Field         | Description                                 |
| ------------- | ------------------------------------------- |
| Current CTC   | e.g., "12 LPA" — used in emails             |
| Expected CTC  | e.g., "18 LPA"                              |
| Notice Period | e.g., "30 days"                             |
| Is Serving NP | Toggle: Yes/No                              |
| Location      | Current city / open to relocation           |
| Phone         | Included in CV / email signature            |
| LinkedIn URL  | Appended to email                           |
| SMTP Settings | Host, port, email, app password (encrypted) |
| AI Tone       | Formal / Semi-formal / Aggressive           |

### 📄 Resume Uploader

- Upload PDF or DOCX resume
- AI parses it and extracts structured profile:
  - Work Experience (companies, roles, dates, bullets)
  - Skills (tech stack, tools, soft skills)
  - Education
  - Projects
  - Certifications
- Parsed data saved as **Profile Summary JSON** in DB
- Re-upload anytime to refresh profile
- Preview parsed profile before saving

### ⚡ Apply — Main Action Page

- **URL Input**: Paste any job URL (LinkedIn, Naukri, Indeed, company site)
- **Screenshot Upload**: Upload a screenshot of any job post
- **Preview Mode**: Before sending, review the extracted job info, generated CV, and email
- **Send Button**: One click to dispatch
- **Edit Override**: Manually tweak the email or CV before sending (optional)

---

## 🤖 AI Pipeline Deep Dive

### Step 1 — Job Extraction Prompt

```
System: You are a job post parser. Extract structured JSON from the given job content.
Output ONLY valid JSON with these keys:
  jobTitle, company, requiredSkills[], preferredSkills[],
  responsibilities[], minExperience, location, workMode,
  hrEmail (if found), salaryRange (if found), applyLink

User: [scraped HTML / OCR text from screenshot]
```

### Step 2 — CV Tailoring Prompt

```
System: You are an expert CV writer. Given a candidate profile and a job description,
rewrite the candidate's experience bullets and skills section to best match the job.
Keep all facts true — only reframe and reorder. Output structured JSON.

User:
  CANDIDATE_PROFILE: [parsed resume JSON]
  JOB_DESCRIPTION: [extracted job JSON]
  USER_INFO: { currentCTC, expectedCTC, noticePeriod, isServing }
```

### Step 3 — Email Writing Prompt

```
System: You are a professional job applicant. Write a concise, personalized cold email
to an HR at [Company] for the role of [Title].
Mention: notice period, expected CTC, key matching skills.
Tone: [user-selected tone]. Keep it under 200 words.

User:
  JOB: [job JSON]
  MY_PROFILE: [profile summary]
  MY_INFO: [CTC, notice period, etc.]
```

### Step 4 — CV PDF Generation

- Tailored CV JSON is passed to a PDF template engine
- Generates a clean, ATS-friendly single-page PDF
- Attached to the email automatically

---

## 📁 Folder Structure

```
autoapply/
├── frontend/                    # Next.js App
│   ├── app/
│   │   ├── page.tsx             # Home / Dashboard
│   │   ├── info/page.tsx        # Info / Settings
│   │   ├── resume/page.tsx      # Resume Uploader
│   │   └── apply/page.tsx       # Apply Page
│   ├── components/
│   │   ├── ApplicationCard.tsx
│   │   ├── InfoForm.tsx
│   │   ├── ResumeUploader.tsx
│   │   └── ApplyForm.tsx
│   └── lib/
│       └── api.ts               # Axios API client
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── models/
│   │   │   ├── UserInfo.js      # Mongoose model
│   │   │   ├── ResumeProfile.js # Mongoose model
│   │   │   └── Application.js   # Mongoose model
│   │   ├── routes/
│   │   │   ├── apply.js         # POST /apply (URL or image)
│   │   │   ├── resume.js        # POST /resume/upload
│   │   │   ├── info.js          # GET/PUT /info
│   │   │   └── applications.js  # GET /applications
│   │   ├── services/
│   │   │   ├── jobExtractor.js  # Playwright scraping
│   │   │   ├── aiService.js     # Gemini API calls
│   │   │   ├── cvGenerator.js   # PDF generation
│   │   │   └── emailService.js  # Nodemailer
│   │   ├── db.js                # MongoDB connection
│   │   └── index.js
│   └── .env
│
├── docker-compose.yml
└── README.md
```

---

## 🗄 Database Schema (MongoDB Collections)

```javascript
// Collection: userinfos
{
  currentCTC:   String,        // e.g., "12 LPA"
  expectedCTC:  String,
  noticePeriod: String,
  isServing:    Boolean,       // default: false
  phone:        String,
  location:     String,
  linkedinUrl:  String,
  smtpHost:     String,
  smtpPort:     Number,
  smtpEmail:    String,
  smtpPassword: String,        // AES encrypted
  aiTone:       String,        // default: "formal"
  createdAt:    Date,
  updatedAt:    Date
}

// Collection: resumeprofiles
{
  rawText:        String,      // Full resume text
  profileSummary: Object,      // Parsed structured profile
  skills:         Array,       // Skills list
  experience:     Array,       // Experience entries
  education:      Array,       // Education entries
  projects:       Array,       // Projects list
  createdAt:      Date,
  updatedAt:      Date
}

// Collection: applications
{
  jobTitle:     String,        // required
  company:      String,        // required
  hrEmail:      String,
  jobUrl:       String,
  extractedJob: Object,        // Parsed job JSON
  generatedCv:  String,        // Path to generated PDF
  emailSubject: String,
  emailBody:    String,
  status:       String,        // enum: sent, replied, rejected, interview
  sentAt:       Date,          // default: now
  createdAt:    Date,
  updatedAt:    Date
}
```

---

## 🔐 Environment Variables

```env
# Backend .env
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/autoapply"
GEMINI_API_KEY="your-gemini-api-key"
JWT_SECRET="your-random-secret"
ENCRYPTION_KEY="32-char-key-for-smtp-password"
PORT=4000
```

---

## 🚀 Setup & Installation

```bash
# 1. Clone
git clone https://github.com/you/autoapply
cd autoapply

# 2. Backend Setup
cd backend
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string and API keys
npm install
npm run dev

# 3. Frontend Setup
cd ../frontend
npm install
npm run dev
```

> **Note:** No local database setup needed — the app connects to MongoDB Atlas (cloud). Just add your connection string to `.env`.

Access portal at: `http://localhost:3000`

---

## 🔒 Security Considerations

| Risk                     | Mitigation                                       |
| ------------------------ | ------------------------------------------------ |
| SMTP credentials exposed | AES-256 encryption in DB, never sent to frontend |
| Unauthorized access      | JWT auth — it's your personal portal             |
| LinkedIn rate limiting   | Add delays, use session cookies carefully        |
| AI hallucinating email   | Preview before send mode (recommended default)   |
| Resume data leakage      | All data stays local / your own server           |

---

## 🗺 Roadmap

### v1.0 — MVP

- [x] Architecture & planning
- [ ] Info page (CTC, notice period settings)
- [ ] Resume upload + AI parsing
- [ ] URL-based job extraction
- [ ] CV PDF generation
- [ ] Email sending via SMTP
- [ ] Home dashboard with sent log

### v1.5 — Enhanced

- [ ] Screenshot-based job extraction (Claude Vision)
- [ ] Preview & edit mode before sending
- [ ] Application status tracking
- [ ] Email reply detection (IMAP polling)
- [ ] Multiple resume templates

### v2.0 — Power Features

- [ ] Bulk apply from saved job list
- [ ] LinkedIn Easy Apply automation
- [ ] Weekly analytics report
- [ ] Chrome extension to apply from any job page

---

## 💡 Tips for Best Results

1. **Keep your Info page updated** — especially notice period and CTC
2. **Upload a detailed resume** — the richer your profile, the better the AI tailors the CV
3. **Use Preview mode first** — review at least the first 5 applications before going full-auto
4. **Check spam rates** — avoid sending more than 20-30 emails/day from one SMTP
5. **Add a personal email signature** in SMTP settings for credibility

---

_Built for personal use. Automate smarter, not harder. 🎯_
