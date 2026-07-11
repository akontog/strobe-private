const { getInstance: getUserManager } = require('../services/UserManager');

/**
 * Session Middleware - Manages user sessions for Strobe apps
 * 
 * Χρησιμοποίηση:
 * app.use(sessionMiddleware());
 * 
 * Αυτό θα δημιουργήσει:
 * - req.sessionId (UUID)
 * - req.userId (user identifier)
 * - req.session (current session object)
 */
function sessionMiddleware() {
    const userManager = getUserManager();

    return (req, res, next) => {
        // Ψάχνουμε για sessionId σε:
        // 1. Query parameter (?sessionId=xxx)
        // 2. Cookie (express-session συμβατό)
        // 3. Header (x-session-id)
        const sessionIdFromQuery = req.query?.sessionId;
        const sessionIdFromCookie = req.cookies?.sessionId;
        const sessionIdFromHeader = req.headers?.['x-session-id'];

        let sessionId = sessionIdFromQuery || sessionIdFromCookie || sessionIdFromHeader;
        let session = null;

        // Αν έχουμε sessionId, το ανακτούμε
        if (sessionId) {
            session = userManager.getSession(sessionId);
        }

        // Αν δεν υπάρχει ή είναι άκυρο, δημιουργούμε νέο
        if (!session) {
            const deviceInfo = {
                userAgent: req.headers?.['user-agent'] || 'unknown',
                ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
            };

            const newSession = userManager.createSession(null, deviceInfo);
            sessionId = newSession.sessionId;
            session = userManager.getSession(sessionId);
        }

        // Προσθέτουμε τη session στο request object
        req.sessionId = sessionId;
        req.userId = session.userId;
        req.session = session;

        // Set cookie για client-side access (optional)
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Προσθέτουμε το session στο response headers για debugging
        res.set('X-Session-ID', sessionId);
        res.set('X-User-ID', session.userId);

        next();
    };
}

/**
 * WebSocket Session Handler - Για WebSocket connections
 * 
 * Χρησιμοποίηση:
 * const sessionInfo = getWebSocketSessionInfo(request);
 */
function getWebSocketSessionInfo(request) {
    const userManager = getUserManager();
    const urlParams = new URL(request.url, `http://${request.headers.host}`).searchParams;
    
    const sessionId = urlParams.get('sessionId');
    const userId = urlParams.get('userId');

    if (sessionId) {
        const session = userManager.getSession(sessionId);
        if (session) {
            return {
                sessionId,
                userId: session.userId,
                session
            };
        }
    }

    // Create new session if not found
    const newSession = userManager.createSession(userId);
    return {
        sessionId: newSession.sessionId,
        userId: newSession.userId,
        session: userManager.getSession(newSession.sessionId)
    };
}

/**
 * App Data Middleware - Saves app-specific state for current user
 * 
 * Χρησιμοποίηση:
 * // In a route or WebSocket handler:
 * saveAppData(req.sessionId, 'fourier-lab', { currentSlide: 5, score: 100 });
 */
function saveAppData(sessionId, appName, appData) {
    const userManager = getUserManager();
    return userManager.updateAppData(sessionId, appName, appData);
}

/**
 * Get App Data - Retrieves app-specific state
 */
function getAppData(sessionId, appName) {
    const userManager = getUserManager();
    return userManager.getAppData(sessionId, appName);
}

/**
 * Admin Statistics - Get server-wide stats
 */
function getSessionStats() {
    const userManager = getUserManager();
    return userManager.getStatistics();
}

module.exports = {
    sessionMiddleware,
    getWebSocketSessionInfo,
    saveAppData,
    getAppData,
    getSessionStats
};
