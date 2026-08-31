const express = require('express');
const sessionManager = require('../services/sessionManager');
const { getAppData, saveAppData } = require('../middleware/sessionMiddleware');

const router = express.Router();

/**
 * GET /api/app-data?app=fourier-lab
 * Ανάκτηση δεδομένων εφαρμογής για τον τρέχοντα χρήστη
 */
router.get('/api/app-data', (req, res) => {
  const sessionId = req.sessionId;
  const appName = req.query.app;

  if (!sessionId || !appName) {
    return res.status(400).json({
      error: 'Missing sessionId or app parameter'
    });
  }

  const appData = getAppData(sessionId, appName);
  
  res.json({
    sessionId,
    app: appName,
    data: appData?.data || {},
    active: appData?.active || false,
    lastUpdated: appData?.lastUpdated || null
  });
});

/**
 * POST /api/app-data
 * Αποθήκευση δεδομένων εφαρμογής
 * 
 * Body:
 * {
 *   "app": "fourier-lab",
 *   "data": { "currentSlide": 5, "score": 100 }
 * }
 */
router.post('/api/app-data', (req, res) => {
  const sessionId = req.sessionId;
  const { app, data } = req.body;

  if (!sessionId || !app || !data) {
    return res.status(400).json({
      error: 'Missing sessionId, app, or data'
    });
  }

  try {
    const updated = saveAppData(sessionId, app, { data });
    
    res.json({
      success: !!updated,
      sessionId,
      app,
      saved: !!updated,
      message: updated ? 'Data saved successfully' : 'Failed to save data'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save app data',
      message: error.message
    });
  }
});

/**
 * GET /api/session
 * Ανάκτηση τρέχουσας session πληροφορίας
 */
router.get('/api/session', (req, res) => {
  const session = sessionManager.get(req.sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'Session not found'
    });
  }

  res.json({
    sessionId: req.sessionId,
    userId: session.userId,
    createdAt: new Date(session.connectedAt).toISOString(),
    lastActivity: new Date(session.lastSeenAt).toISOString(),
    role: session.role,
    activeApps: [...session.activeApps]
  });
});

/**
 * GET /api/admin/stats
 * Ανάκτηση στατιστικών του server
 * ⚠️ Απαιτεί ενδεχόμενη ταυτοποίηση (admin-only)
 */
router.get('/api/admin/stats', (req, res) => {
  const stats = sessionManager.getStatistics();

  res.json({
    timestamp: new Date().toISOString(),
    totalSessions: stats.totalSessions,
    activeSessions: stats.activeSessions,
    totalUsers: stats.totalUsers,
    sessionsByRole: stats.sessionsByRole,
    sessionsByApp: stats.sessionsByApp
  });
});

/**
 * DELETE /api/session/:sessionId
 * Διαγραφή session
 */
router.delete('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // Security: Allow only own session deletion (unless admin)
  if (req.sessionId !== sessionId && req.session?.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Cannot delete other user sessions'
    });
  }

  const deleted = sessionManager.remove(sessionId);

  res.json({
    deleted,
    message: deleted ? 'Session deleted successfully' : 'Session not found'
  });
});

/**
 * POST /api/logout
 * Διαγραφή τρέχουσας session (logout)
 */
router.post('/api/logout', (req, res) => {
  const deleted = sessionManager.remove(req.sessionId);

  res.json({
    logged_out: deleted,
    message: deleted ? 'Logged out successfully' : 'Already logged out'
  });
});

module.exports = router;
