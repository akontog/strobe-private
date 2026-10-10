const fs = require('fs');
const path = require('path');

function isTeacherSession(req) {
  if (!req.session || req.session.role !== 'teacher') return false;
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'teachers.json'), 'utf8'));
    return Array.isArray(data.users) && data.users.some((user) => user.username === req.session.teacherAccount && user.role === 'teacher');
  } catch {
    return false;
  }
}

function requireAuth(req, res, next) {
  if (!isTeacherSession(req)) return res.status(401).json({ error: 'Teacher login required.' });
  return next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (allowed.includes('teacher') && !isTeacherSession(req)) {
      return res.status(403).json({ error: 'This route requires a teacher account.' });
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
