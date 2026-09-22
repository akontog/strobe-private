// =============================================================
//  utils/wsHeartbeat.js
//
//  Ανιχνεύει "νεκρές" συνδέσεις (κοιμισμένος υπολογιστής, χαμένο Wi-Fi) που
//  δεν έκλεισαν ποτέ κανονικά και μένουν για πάντα στα activeUsers.
//
//  Κάθε intervalMs ο server στέλνει ping σε όλους. Ο browser απαντά με pong
//  αυτόματα. Όποιος δεν απάντησε από τον προηγούμενο κύκλο, τερματίζεται
//  (το ws 'close' event τρέχει και γίνεται κανονικός καθαρισμός).
//
//  Χρήση: attachHeartbeat(wss) για οποιονδήποτε WebSocketServer.
// =============================================================

function attachHeartbeat(wss, { intervalMs = 30000 } = {}) {
  const tracked = new WeakSet(); // sockets που έχουμε ήδη "οπλίσει" με pong listener

  const timer = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!tracked.has(ws)) {
        tracked.add(ws);
        ws.isAlive = true;
        ws.on('pong', () => {
          ws.isAlive = true;
        });
      }

      if (!ws.isAlive) {
        ws.terminate(); // δεν απάντησε στο προηγούμενο ping
        return;
      }

      ws.isAlive = false; // θα ξαναγίνει true όταν έρθει pong
      try {
        ws.ping();
      } catch {
        ws.terminate();
      }
    });
  }, intervalMs);

  // Να μην κρατά το Node ζωντανό μόνο του
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  wss.on('close', () => clearInterval(timer));
  return () => clearInterval(timer);
}

module.exports = { attachHeartbeat };
