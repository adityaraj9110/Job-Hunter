const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  senderName:       { type: String, required: true }, // Your full name — shown as email sender
  currentJobTitle:  { type: String, default: null },  // e.g., "Frontend Developer"
  experienceYears:  { type: String, default: null },  // e.g., "3 years"
  currentCTC:       { type: String, default: null },
  expectedCTC:  { type: String, default: null },
  noticePeriod: { type: String, default: null },
  isServing:    { type: Boolean, default: false },
  phone:        { type: String, default: null },
  location:     { type: String, default: null },
  linkedinUrl:  { type: String, default: null },
  smtpHost:     { type: String, default: null },
  smtpPort:     { type: Number, default: null },
  smtpEmail:    { type: String, default: null },
  smtpPassword: { type: String, default: null }, // AES encrypted
  aiTone:       { type: String, default: 'formal' },
}, {
  timestamps: true, // adds createdAt + updatedAt
});

module.exports = mongoose.model('UserInfo', userInfoSchema);
