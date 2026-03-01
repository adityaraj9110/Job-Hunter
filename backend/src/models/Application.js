const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobTitle:     { type: String, required: true },
  company:      { type: String, required: true },
  hrEmail:      { type: String, default: null },
  jobUrl:       { type: String, default: null },
  extractedJob: { type: mongoose.Schema.Types.Mixed, required: true },
  generatedCv:  { type: String, required: true }, // Path to generated PDF
  emailSubject: { type: String, required: true },
  emailBody:    { type: String, required: true },
  status:       { type: String, default: 'sent', enum: ['sent', 'replied', 'rejected', 'interview'] },
  sentAt:       { type: Date, default: Date.now },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Application', applicationSchema);
