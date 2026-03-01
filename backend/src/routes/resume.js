const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const ResumeProfile = require('../models/ResumeProfile');
const { parseResumeWithAI } = require('../services/aiService');

const router = express.Router();

/**
 * Extract text from a PDF using pdfjs-dist
 */
async function extractPdfText(filePath) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const textParts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    textParts.push(pageText);
  }
  return textParts.join('\n');
}

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and DOCX files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/resume/upload — upload and parse resume
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rawText = '';

    // Extract text from file
    if (ext === '.pdf') {
      rawText = await extractPdfText(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value;
    }

    if (!rawText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    // Parse with AI
    const parsed = await parseResumeWithAI(rawText);

    // Save to database (upsert — single document pattern)
    const updateData = {
      rawText,
      profileSummary: parsed.profileSummary || {},
      skills: parsed.skills || [],
      experience: parsed.experience || [],
      education: parsed.education || [],
      projects: parsed.projects || [],
    };

    const profile = await ResumeProfile.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, profile });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: 'Failed to process resume', message: err.message });
  }
});

// GET /api/resume/profile — fetch parsed resume profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await ResumeProfile.findOne();
    if (!profile) {
      return res.json({ exists: false });
    }
    res.json({ exists: true, profile });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch resume profile' });
  }
});

module.exports = router;
