const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/info — fetch user settings
router.get('/', async (req, res) => {
  try {
    let info = await prisma.userInfo.findUnique({ where: { id: 1 } });
    if (!info) {
      info = await prisma.userInfo.create({
        data: { id: 1 },
      });
    }
    // Don't send the encrypted SMTP password to frontend
    const { smtpPassword, ...safeInfo } = info;
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
      currentCTC, expectedCTC, noticePeriod, isServing,
      phone, location, linkedinUrl,
      smtpHost, smtpPort, smtpEmail, smtpPassword,
      aiTone,
    } = req.body;

    const data = {};
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

    const info = await prisma.userInfo.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    const { smtpPassword: _, ...safeInfo } = info;
    res.json({ ...safeInfo, hasSmtpPassword: !!info.smtpPassword });
  } catch (err) {
    console.error('Error updating info:', err);
    res.status(500).json({ error: 'Failed to update user info' });
  }
});

module.exports = router;
