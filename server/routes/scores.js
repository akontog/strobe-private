const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/checkRole');

const scoresFile = path.join(__dirname, '..', 'data', 'scores.json');

function readScores() {
  try {
    const payload = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
    return { students: Array.isArray(payload.students) ? payload.students : [] };
  } catch {
    return { students: [] };
  }
}

function writeScores(payload) {
  fs.writeFileSync(scoresFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function normalizeStudentId(name) {
  return String(name || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function resetStudent(student) {
  student.totalScore = 0;
  student.currentScore = 0;
  student.activities = {};
  student.updatedAt = new Date().toISOString();
}

function createScoresRouter() {
  const router = express.Router();

  router.post('/current', (req, res) => {
    const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const activity = String(req.body?.activity || '').trim().slice(0, 120);
    const currentScore = Number(req.body?.currentScore);
    if (!name || !activity || !Number.isFinite(currentScore)) {
      return res.status(400).json({ error: 'Student name, activity and finite score are required.' });
    }

    const payload = readScores();
    const id = normalizeStudentId(name);
    let student = payload.students.find((entry) => entry.id === id);
    if (!student) {
      student = { id, name, totalScore: 0, currentScore: 0, activities: {}, updatedAt: '' };
      payload.students.push(student);
    }

    student.name = name;
    student.activities = { ...(student.activities || {}), [activity]: currentScore };
    student.currentScore = currentScore;
    student.totalScore = Object.values(student.activities).reduce((sum, score) => sum + (Number(score) || 0), 0);
    student.updatedAt = new Date().toISOString();
    writeScores(payload);
    return res.json({ student });
  });

  router.get('/', requireAuth, (req, res) => {
    res.json(readScores());
  });

  router.post('/reset', requireAuth, (req, res) => {
    const payload = readScores();
    payload.students.forEach(resetStudent);
    writeScores(payload);
    res.json(payload);
  });

  router.post('/students/:id/reset', requireAuth, (req, res) => {
    const payload = readScores();
    const student = payload.students.find((entry) => entry.id === req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    resetStudent(student);
    writeScores(payload);
    return res.json({ student });
  });

  router.delete('/students/:id', requireAuth, (req, res) => {
    const payload = readScores();
    const remaining = payload.students.filter((entry) => entry.id !== req.params.id);
    if (remaining.length === payload.students.length) return res.status(404).json({ error: 'Student not found.' });
    payload.students = remaining;
    writeScores(payload);
    return res.json(payload);
  });

  return router;
}

module.exports = createScoresRouter;
