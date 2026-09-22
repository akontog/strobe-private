const sessionManager = require('../services/sessionManager');
const { getCookie } = require('../utils/cookies');

const SESSION_COOKIE_NAME = 'sessionId';
const SESSION_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 ώρες

/**
 * Βρίσκει ή δημιουργεί ένα session από ΟΠΟΙΟΔΗΠΟΤΕ request (HTTP ή WebSocket
 * upgrade), διαβάζοντας το ίδιο cookie "sessionId" και στις δύο περιπτώσεις.
 * Αυτό είναι το σημείο που ενοποιεί την ταυτότητα σε όλο το σύστημα: ό,τι
 * χρησιμοποιεί κάθε εφαρμογή (geometry, fourier, buffon, neural...) περνά
 * από εδώ αντί να φτιάχνει δικό του session με socket.id.
 *
 * ΔΕΝ βασίζεται στο req.cookies (χρειάζεται cookie-parser και δεν υπάρχει
 * καν σε raw WebSocket upgrade requests) — διαβάζει απευθείας το header.
 */
function resolveSession(headers, fallbackInfo = {}) {
  const existingId = getCookie(headers, SESSION_COOKIE_NAME);
  let session = existingId ? sessionManager.get(existingId) : null;
  let sessionId = existingId;
  let isNew = false;

  if (!session) {
    const deviceInfo = {
      userAgent: (headers && headers['user-agent']) || fallbackInfo.userAgent || 'unknown',
      ipAddress: fallbackInfo.ipAddress || 'unknown'
    };

    const created = sessionManager.createWithGeneratedId(null, deviceInfo);
    sessionId = created.sessionId;
    session = sessionManager.get(sessionId);
    isNew = true;
  }

  return { sessionId, userId: session.userId, session, isNew };
}

/**
 * Session Middleware - Manages user sessions for Strobe apps
 *
 * Χρησιμοποίηση:
 * app.use(sessionMiddleware());
 *
 * Αυτό θα δημιουργήσει:
 * - req.sessionId (σταθερό, ίδιο σε κάθε αίτημα από τον ίδιο browser)
 * - req.userId (user identifier)
 * - req.session (current session object)
 */
function sessionMiddleware() {
  return (req, res, next) => {
    const { sessionId, session, isNew } = resolveSession(req.headers, {
      ipAddress: req.ip || (req.connection && req.connection.remoteAddress) || 'unknown'
    });

    req.sessionId = sessionId;
    req.userId = session.userId;
    req.session = session;

    // Ξαναβάζουμε το cookie σε κάθε αίτημα, ώστε να ανανεώνεται η λήξη του
    // (rolling expiry) — ο browser κρατά τον ίδιο χρήστη ζωντανό όσο τον επισκέπτεται.
    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_COOKIE_MAX_AGE_MS
    });

    res.set('X-Session-ID', sessionId);
    res.set('X-User-ID', session.userId);

    if (!isNew) {
      sessionManager.touch(sessionId);
    }

    next();
  };
}

/**
 * WebSocket Session Handler - Για WebSocket upgrade requests.
 * Διαβάζει το ΙΔΙΟ cookie "sessionId" που έβαλε το sessionMiddleware στη σελίδα,
 * άρα ο ίδιος browser/άνθρωπος παίρνει το ίδιο session είτε μιλά HTTP είτε WS.
 *
 * Χρησιμοποίηση:
 * const { sessionId, userId, session } = getWebSocketSessionInfo(request);
 */
function getWebSocketSessionInfo(request) {
  return resolveSession(request && request.headers, {
    ipAddress: request && request.socket ? request.socket.remoteAddress : 'unknown'
  });
}

/**
 * App Data Middleware - Saves app-specific state for current user
 *
 * Χρησιμοποίηση:
 * // In a route or WebSocket handler:
 * saveAppData(req.sessionId, 'fourier-lab', { currentSlide: 5, score: 100 });
 */
function saveAppData(sessionId, appName, appData) {
  return sessionManager.saveAppData(sessionId, appName, appData);
}

/**
 * Get App Data - Retrieves app-specific state
 */
function getAppData(sessionId, appName) {
  return sessionManager.getAppData(sessionId, appName);
}

/**
 * Admin Statistics - Get server-wide stats
 */
function getSessionStats() {
  return sessionManager.getStatistics();
}

module.exports = {
  sessionMiddleware,
  getWebSocketSessionInfo,
  saveAppData,
  getAppData,
  getSessionStats
};
