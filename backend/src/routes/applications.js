const express = require('express');
const Application = require('../models/Application');
const router = express.Router();

// GET /api/applications — list all applications with stats
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find().sort({ sentAt: -1 });

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

    const application = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ success: true, application });
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

module.exports = router;
