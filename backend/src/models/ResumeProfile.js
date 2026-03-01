const mongoose = require('mongoose');

const resumeProfileSchema = new mongoose.Schema({
  rawText:        { type: String, required: true },
  profileSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
  skills:         { type: mongoose.Schema.Types.Mixed, default: [] },
  experience:     { type: mongoose.Schema.Types.Mixed, default: [] },
  education:      { type: mongoose.Schema.Types.Mixed, default: [] },
  projects:       { type: mongoose.Schema.Types.Mixed, default: [] },
}, {
  timestamps: true, // adds createdAt + updatedAt (updatedAt replaces Prisma's @updatedAt)
});

module.exports = mongoose.model('ResumeProfile', resumeProfileSchema);
