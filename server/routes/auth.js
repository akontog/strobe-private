const express = require('express');
const fs = require('fs');
const path = require('path');
const sessionManager = require('../services/sessionManager');

const usersFile = path.join(__dirname, '..', 'data', 'teachers.json');

function readTeacherUsers() {
  try {
    const payload = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    return Array.isArray(payload.users) ? payload.users : [];
  } catch {
    return [];
  }
}

function createAuthRouter() {
  const router = express.Router();

  router.get('/session', (req, res) => {
    const user = readTeacherUsers().find((entry) => entry.username === req.session.teacherAccount);
    const authenticated = req.session.role === 'teacher' && Boolean(user);
    res.json({
      authenticated,
      role: authenticated ? 'teacher' : 'student',
      username: authenticated ? req.session.teacherAccount : ''
    });
  });

  router.post('/login', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const user = readTeacherUsers().find((entry) => (
      entry.username === username && entry.password === password && entry.role === 'teacher'
    ));

    if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

    sessionManager.update(req.sessionId, {
      username: user.username,
      role: 'teacher',
      teacherAccount: user.username,
      source: 'teacher-login'
    });
    return res.json({ authenticated: true, role: 'teacher', username: user.username });
  });

  router.post('/logout', (req, res) => {
    sessionManager.update(req.sessionId, { role: 'student', teacherAccount: '', source: 'http' });
    return res.json({ authenticated: false, role: 'student' });
  });

  return router;
}

module.exports = createAuthRouter;
