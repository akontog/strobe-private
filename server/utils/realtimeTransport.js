// =============================================================
//  utils/realtimeTransport.js
//
//  Μια μίνι εκδοχή του Socket.IO χτισμένη πάνω στη βιβλιοθήκη 'ws'.
//  Έχει το ίδιο API (io.on('connection'), socket.on/emit/join/leave,
//  io.to(room).emit, socket.broadcast.emit), ώστε ο υπόλοιπος κώδικας
//  (geometry, fourier, activities) να γράφεται σαν να υπήρχε Socket.IO.
//
//  Πρωτόκολλο: κάθε μήνυμα είναι JSON της μορφής { event, data }.
// =============================================================
const { WebSocketServer } = require('ws');
const { parseRealtimeMessage } = require('./helpers');
const { attachHeartbeat } = require('./wsHeartbeat');
const { getWebSocketSessionInfo } = require('../middleware/sessionMiddleware');

const WS_OPEN = 1; // ws.readyState === OPEN

// Καθαρίζει ονόματα event/room: string, χωρίς κενά στις άκρες
const cleanName = (value) => String(value || '').trim();
// Ασφαλές μήνυμα σφάλματος για logs
const errorText = (error) => (error && error.message ? error.message : error);

function createRealtimeTransport() {
  // noServer: true → ο WebSocketServer ΔΕΝ ανοίγει δική του θύρα.
  // Τα upgrade requests του κοινού httpServer του τα περνάμε χειροκίνητα.
  const wss = new WebSocketServer({ noServer: true });
  // Κλείνει αυτόματα συνδέσεις που δεν απαντούν σε ping (νεκροί clients)
  attachHeartbeat(wss);

  const sockets = new Map();          // socketId -> socket wrapper
  const rooms = new Map();            // όνομα room -> Set από socketIds
  const connectionHandlers = [];      // callbacks του io.on('connection')
  let socketSeq = 0;                  // μετρητής για μοναδικά ids ("ws-1", "ws-2", ...)

  // ---------- Βοηθητικά για αποστολή ----------

  // Στέλνει { event, data } σε ένα ws, μόνο αν είναι ανοιχτό
  function wsSend(ws, event, data) {
    if (!ws || ws.readyState !== WS_OPEN) {
      return;
    }

    try {
      ws.send(JSON.stringify({ event, data }));
    } catch (error) {
      console.error(`[realtime] wsSend error for ${event}:`, errorText(error));
    }
  }

  // ---------- Διαχείριση rooms ----------

  function addToRoom(socketId, room) {
    const name = cleanName(room);
    if (!name) {
      return;
    }

    if (!rooms.has(name)) {
      rooms.set(name, new Set());
    }
    rooms.get(name).add(socketId);
  }

  function removeFromRoom(socketId, room) {
    const name = cleanName(room);
    const members = rooms.get(name);
    if (!members) {
      return;
    }

    members.delete(socketId);
    if (!members.size) {
      rooms.delete(name); // δεν αφήνουμε άδεια rooms
    }
  }

  function removeFromAllRooms(socketId) {
    rooms.forEach((members) => members.delete(socketId));
  }

  // ---------- Wrapper ανά σύνδεση ----------

  // Τυλίγει ένα "γυμνό" ws σε αντικείμενο τύπου Socket.IO socket
  function createSocketWrapper(request, ws) {
    const socketId = `ws-${++socketSeq}`;
    const listeners = new Map(); // event -> [handlers]
    let closed = false;

    const remoteAddress = request && request.socket ? request.socket.remoteAddress : 'unknown';

    // Σταθερή ταυτότητα (ίδια με αυτή που βλέπει ο browser στο HTTP), ΑΝΕΞΑΡΤΗΤΗ
    // από το socketId που αλλάζει σε κάθε σύνδεση/reconnect.
    const { sessionId, userId } = getWebSocketSessionInfo(request);

    // Καλεί όλους τους handlers ενός event· ένα λάθος σε έναν δεν σταματά τους άλλους
    function trigger(event, ...args) {
      const handlers = listeners.get(event);
      if (!handlers || !handlers.length) {
        return;
      }

      handlers.slice().forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[realtime] handler error for ${event}:`, errorText(error));
        }
      });
    }

    const socket = {
      id: socketId,
      sessionId,   // σταθερό ανά άνθρωπο/browser — αυτό ΔΕΝ αλλάζει σε reconnect
      userId,      // ίδιο με το req.userId στο HTTP
      ws,
      connected: true,
      active: true,
      handshake: {
        headers: request && request.headers ? request.headers : {},
        address: remoteAddress
      },
      conn: {
        remoteAddress,
        transport: { name: 'websocket' }
      },

      // Εγγραφή σε event που στέλνει ο client
      on(event, handler) {
        const name = cleanName(event);
        if (typeof handler !== 'function' || !name) {
          return socket;
        }

        const existing = listeners.get(name) || [];
        existing.push(handler);
        listeners.set(name, existing);
        return socket;
      },

      // Αποστολή event ΠΡΟΣ αυτόν τον client
      emit(event, data) {
        const name = cleanName(event);
        if (name) {
          wsSend(ws, name, data);
        }
        return socket;
      },

      join(room) {
        addToRoom(socketId, room);
        return socket;
      },

      leave(room) {
        removeFromRoom(socketId, room);
        return socket;
      },

      // Κλείσιμο από τον server (το cleanup γίνεται στο ws 'close' παρακάτω)
      disconnect(code = 1000, reason = 'client-disconnect') {
        socket.active = false;
        socket.connected = false;
        try {
          ws.close(code, reason);
        } catch (error) {
          console.error(`[realtime] ws.close error for ${socketId}:`, errorText(error));
        }
      },

      // Αποστολή σε ΟΛΟΥΣ εκτός από αυτόν
      broadcast: {
        emit(event, data) {
          const name = cleanName(event);
          if (!name) {
            return;
          }

          sockets.forEach((other, otherId) => {
            if (otherId !== socketId) {
              other.emit(name, data);
            }
          });
        }
      }
    };

    // Εισερχόμενο μήνυμα → parse → κλήση των handlers του event
    ws.on('message', (raw) => {
      const message = parseRealtimeMessage(raw);
      if (message) {
        trigger(message.event, message.data);
      }
    });

    ws.on('error', (error) => {
      trigger('error', error);
    });

    // Κλείσιμο σύνδεσης → καθαρισμός και ειδοποίηση των handlers
    ws.on('close', () => {
      if (closed) {
        return;
      }

      closed = true;
      socket.connected = false;
      socket.active = false;
      removeFromAllRooms(socketId);
      sockets.delete(socketId);
      trigger('disconnect');
    });

    sockets.set(socketId, socket);
    // Πρώτο μήνυμα προς τον client: του λέμε το id του
    wsSend(ws, '__meta', { id: socketId });
    return socket;
  }

  // ---------- Το "io" αντικείμενο που εκτίθεται προς τα έξω ----------

  const ioTransport = {
    // Μόνο για compatibility με io.engine.clientsCount του Socket.IO
    engine: {
      get clientsCount() {
        return sockets.size;
      }
    },

    // Υποστηρίζεται μόνο το 'connection'
    on(event, handler) {
      if (event === 'connection' && typeof handler === 'function') {
        connectionHandlers.push(handler);
      }
      return ioTransport;
    },

    // Αποστολή σε ΟΛΟΥΣ τους συνδεδεμένους
    emit(event, data) {
      const name = cleanName(event);
      if (name) {
        sockets.forEach((socket) => socket.emit(name, data));
      }
      return ioTransport;
    },

    // Αποστολή σε όλα τα μέλη ενός room: io.to('room').emit(...)
    to(room) {
      const roomName = cleanName(room);

      return {
        emit(event, data) {
          const name = cleanName(event);
          const members = rooms.get(roomName);
          if (!roomName || !name || !members || !members.size) {
            return;
          }

          members.forEach((socketId) => {
            const socket = sockets.get(socketId);
            if (socket) {
              socket.emit(name, data);
            }
          });
        }
      };
    },

    // Καλείται από το wsRegistry όταν ένα upgrade request αφορά αυτό το path
    handleUpgrade(request, socket, head) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const wrapped = createSocketWrapper(request, ws);
        connectionHandlers.forEach((handler) => {
          try {
            handler(wrapped);
          } catch (error) {
            console.error('[realtime] connection handler error:', errorText(error));
          }
        });
      });
    }
  };

  return ioTransport;
}

module.exports = { createRealtimeTransport };
