const express = require('express');
const { requireAuth } = require('../middleware/checkRole');
const { getActiveSessionForApp, updateSessionStudentScore } = require('../services/sessionLogs');

const studentsById = new Map();

function createScoresRouter() {
  const router = express.Router();

  router.post('/current', (req, res) => {
    const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const activity = String(req.body?.activity || '').trim().slice(0, 120);
    const currentScore = Number(req.body?.currentScore);
    const sessionId = String(req.body?.sessionId || '').trim()
      || (activity.startsWith('polynomial:') ? getActiveSessionForApp('polynomial-lab') : '')
      || (activity.startsWith('equations:') ? getActiveSessionForApp('equations-lab') : '');
    const resolvedSessionId = sessionId || (activity.startsWith('factorization:') ? getActiveSessionForApp('factorization-lab') : '');
    if (!name || !activity || !Number.isFinite(currentScore)) {
      return res.status(400).json({ error: 'Student name, activity and finite score are required.' });
    }

    const id = name.toLocaleLowerCase();
    const student = studentsById.get(id) || { id, name, currentScore: 0, activities: {}, updatedAt: '' };
    student.name = name;
    student.activities = { ...student.activities, [activity]: currentScore };
    student.currentScore = currentScore;
    student.updatedAt = new Date().toISOString();
    studentsById.set(id, student);
    if (resolvedSessionId) updateSessionStudentScore(resolvedSessionId, name, currentScore);
    return res.json({ student });
  });

  router.get('/', requireAuth, (req, res) => {
    res.json({ students: [...studentsById.values()] });
  });

  return router;
}

module.exports = createScoresRouter;
