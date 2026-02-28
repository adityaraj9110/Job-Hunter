const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/applications — list all applications with stats
router.get('/', async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { sentAt: 'desc' },
    });

    // Calculate stats
    const total = applications.length;
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = applications.filter(a => new Date(a.sentAt) >= oneWeekAgo).length;
    const thisMonth = applications.filter(a => new Date(a.sentAt) >= oneMonthAgo).length;
    const replied = applications.filter(a => a.status === 'replied').length;
    const interviews = applications.filter(a => a.status === 'interview').length;

    res.json({
      applications,
      stats: { total, thisWeek, thisMonth, replied, interviews },
    });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// PATCH /api/applications/:id — update application status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['sent', 'replied', 'rejected', 'interview'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const application = await prisma.application.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.json({ success: true, application });
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

module.exports = router;
