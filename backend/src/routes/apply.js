const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ResumeProfile = require('../models/ResumeProfile');
const UserInfo = require('../models/UserInfo');
const Application = require('../models/Application');
const { extractJobFromURL, extractJobFromScreenshot } = require('../services/jobExtractor');
const { tailorCV, writeEmail } = require('../services/aiService');
const { generateCVPdf } = require('../services/cvGenerator');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

// Configure multer for screenshot uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `screenshot-${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/apply/extract — extract job info (preview step)
router.post('/extract', upload.single('screenshot'), async (req, res) => {
  try {
    const { jobUrl } = req.body;
    let jobData;

    if (req.file) {
      // Screenshot-based extraction
      const imagePath = req.file.path;
      jobData = await extractJobFromScreenshot(imagePath);
    } else if (jobUrl) {
      // URL-based extraction
      jobData = await extractJobFromURL(jobUrl);
    } else {
      return res.status(400).json({ error: 'Provide a job URL or screenshot' });
    }

    res.json({ success: true, jobData });
  } catch (err) {
    console.error('Job extraction error:', err);
    res.status(500).json({ error: 'Failed to extract job info', message: err.message });
  }
});

// POST /api/apply/preview — generate CV + email preview without sending
router.post('/preview', async (req, res) => {
  try {
    const { jobData, additionalNotes } = req.body;
    if (!jobData) return res.status(400).json({ error: 'Job data is required' });

    // Fetch user profile and info
    const profile = await ResumeProfile.findOne();
    const userInfo = await UserInfo.findOne();

    if (!profile) {
      return res.status(400).json({ error: 'Please upload your resume first' });
    }

    // Tailor CV
    const tailoredCV = await tailorCV(profile, jobData, userInfo, additionalNotes);

    // Write email
    const email = await writeEmail(jobData, profile, userInfo, additionalNotes);

    res.json({
      success: true,
      preview: {
        tailoredCV,
        emailSubject: email.subject,
        emailBody: email.body,
        jobData,
      },
    });
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: 'Failed to generate preview', message: err.message });
  }
});

// POST /api/apply — full pipeline: extract → tailor → email → send
router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    const { jobUrl, jobData: preExtractedJob, emailSubject, emailBody: customEmailBody, additionalNotes } = req.body;
    let jobData = preExtractedJob ? (typeof preExtractedJob === 'string' ? JSON.parse(preExtractedJob) : preExtractedJob) : null;

    // Step 1: Extract job if not pre-extracted
    if (!jobData) {
      if (req.file) {
        jobData = await extractJobFromScreenshot(req.file.path);
      } else if (jobUrl) {
        jobData = await extractJobFromURL(jobUrl);
      } else {
        return res.status(400).json({ error: 'Provide a job URL, screenshot, or pre-extracted job data' });
      }
    }

    // Fetch user data
    const profile = await ResumeProfile.findOne();
    const userInfo = await UserInfo.findOne();

    if (!profile) {
      return res.status(400).json({ error: 'Please upload your resume first' });
    }
    if (!userInfo?.smtpEmail) {
      return res.status(400).json({ error: 'Please configure SMTP settings in Info page' });
    }

    // Step 2: Tailor CV
    const tailoredCV = await tailorCV(profile, jobData, userInfo, additionalNotes);

    // Step 3: Generate PDF
    const cvDir = path.join(__dirname, '..', '..', 'generated-cvs');
    if (!fs.existsSync(cvDir)) fs.mkdirSync(cvDir, { recursive: true });
    const cvFilename = `cv-${jobData.company?.replace(/\s+/g, '-') || 'company'}-${Date.now()}.pdf`;
    const cvPath = path.join(cvDir, cvFilename);
    await generateCVPdf(tailoredCV, cvPath);

    // Step 4: Write email (or use custom)
    let email;
    if (customEmailBody && emailSubject) {
      email = { subject: emailSubject, body: customEmailBody };
    } else {
      email = await writeEmail(jobData, profile, userInfo, additionalNotes);
    }

    // Step 5: Send email
    const recipientEmail = jobData.hrEmail;
    if (recipientEmail) {
      await sendEmail(userInfo, recipientEmail, email.subject, email.body, cvPath);
    }

    // Step 6: Log application
    const application = await Application.create({
      jobTitle: jobData.jobTitle || 'Unknown',
      company: jobData.company || 'Unknown',
      hrEmail: recipientEmail || null,
      jobUrl: jobUrl || null,
      extractedJob: jobData,
      generatedCv: `/generated-cvs/${cvFilename}`,
      emailSubject: email.subject,
      emailBody: email.body,
      status: recipientEmail ? 'sent' : 'draft',
    });

    res.json({
      success: true,
      application,
      emailSent: !!recipientEmail,
      message: recipientEmail
        ? `Application sent to ${recipientEmail}`
        : 'Application saved as draft (no HR email found)',
    });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Failed to process application', message: err.message });
  }
});

module.exports = router;
