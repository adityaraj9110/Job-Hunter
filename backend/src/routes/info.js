const express = require('express');
const UserInfo = require('../models/UserInfo');
const router = express.Router();

// GET /api/info — fetch user settings
router.get('/', async (req, res) => {
  try {
    let info = await UserInfo.findOne();
    if (!info) {
      info = await UserInfo.create({});
    }
    // Don't send the encrypted SMTP password to frontend
    const infoObj = info.toObject();
    const { smtpPassword, ...safeInfo } = infoObj;
    res.json({ ...safeInfo, hasSmtpPassword: !!smtpPassword });
  } catch (err) {
    console.error('Error fetching info:', err);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// PUT /api/info — update user settings
router.put('/', async (req, res) => {
  try {
    const {
      senderName, currentJobTitle, experienceYears,
      currentCTC, expectedCTC, noticePeriod, isServing,
      phone, location, linkedinUrl,
      smtpHost, smtpPort, smtpEmail, smtpPassword,
      aiTone,
    } = req.body;

    const data = {};
    if (senderName !== undefined) data.senderName = senderName;
    if (currentJobTitle !== undefined) data.currentJobTitle = currentJobTitle;
    if (experienceYears !== undefined) data.experienceYears = experienceYears;
    if (currentCTC !== undefined) data.currentCTC = currentCTC;
    if (expectedCTC !== undefined) data.expectedCTC = expectedCTC;
    if (noticePeriod !== undefined) data.noticePeriod = noticePeriod;
    if (isServing !== undefined) data.isServing = isServing;
    if (phone !== undefined) data.phone = phone;
    if (location !== undefined) data.location = location;
    if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl;
    if (smtpHost !== undefined) data.smtpHost = smtpHost;
    if (smtpPort !== undefined) data.smtpPort = parseInt(smtpPort) || null;
    if (smtpEmail !== undefined) data.smtpEmail = smtpEmail;
    if (smtpPassword !== undefined) data.smtpPassword = smtpPassword; // TODO: encrypt
    if (aiTone !== undefined) data.aiTone = aiTone;

    const info = await UserInfo.findOneAndUpdate(
      {},
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const infoObj = info.toObject();
    const { smtpPassword: _, ...safeInfo } = infoObj;
    res.json({ ...safeInfo, hasSmtpPassword: !!info.smtpPassword });
  } catch (err) {
    console.error('Error updating info:', err);
    res.status(500).json({ error: 'Failed to update user info' });
  }
});

module.exports = router;
