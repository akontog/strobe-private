  // WebSocket για real-time επικοινωνία
  const { WebSocketServer } = require('ws');

  const { parseRealtimeMessage } = require('./helpers');

  // Δημιουργεί transport για real-time επικοινωνία
function createRealtimeTransport() {
  // Δημιουργία WebSocketServer με noServer: 
  // true για να χρησιμοποιηθεί με το υπάρχον HTTP server
  const wss = new WebSocketServer({ noServer: true });
  // Map με όλους τους ενεργούς sockets
  const sockets = new Map();
  // Map με όλα τα rooms και τα μέλη τους
  const rooms = new Map();
  // Array με όλους τους χειριστές σύνδεσης
  const connectionHandlers = [];
  let socketSeq = 0;
  // Έλεγχος αν το WebSocket είναι έτοιμο για αποστολή μηνυμάτων
  function wsReady(ws) {
    return Boolean(ws) && ws.readyState === 1;
  }
  // Αποστολή μηνύματος σε WebSocket
  function wsSend(ws, event, data) {
    if (!wsReady(ws)) {
      return;
    }

    try {
      ws.send(JSON.stringify({ event, data }));
    } catch (error) {
      console.error(`[realtime] wsSend error for ${event}:`, error && error.message ? error.message : error);
    }
  }

  function removeFromRooms(socketId) {
    rooms.forEach((members) => {
      members.delete(socketId);
    });
  }

  function addToRoom(socketId, room) {
    const safeRoom = String(room || '').trim();
    if (!safeRoom) {
      return;
    }

    if (!rooms.has(safeRoom)) {
      rooms.set(safeRoom, new Set());
    }

    rooms.get(safeRoom).add(socketId);
  }

  function removeFromRoom(socketId, room) {
    const safeRoom = String(room || '').trim();
    if (!safeRoom) {
      return;
    }

    const members = rooms.get(safeRoom);
    if (!members) {
      return;
    }

    members.delete(socketId);
    if (!members.size) {
      rooms.delete(safeRoom);
    }
  }

  function createSocketWrapper(request, ws) {
    const socketId = `ws-${++socketSeq}`;
    const listeners = new Map();
    let closed = false;

    function trigger(event, ...args) {
      const handlers = listeners.get(event);
      if (!handlers || !handlers.length) {
        return;
      }

      handlers.slice().forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[realtime] handler error for ${event}:`, error && error.message ? error.message : error);
        }
      });
    }

    const socket = {
      id: socketId,
      ws,
      connected: true,
      active: true,
      handshake: {
        headers: request && request.headers ? request.headers : {},
        address: request && request.socket ? request.socket.remoteAddress : 'unknown'
      },
      conn: {
        remoteAddress: request && request.socket ? request.socket.remoteAddress : 'unknown',
        transport: { name: 'websocket' }
      },
      on(event, handler) {
        if (typeof handler !== 'function') {
          return socket;
        }

        const safeEvent = String(event || '').trim();
        if (!safeEvent) {
          return socket;
        }

        const existing = listeners.get(safeEvent) || [];
        existing.push(handler);
        listeners.set(safeEvent, existing);
        return socket;
      },
      emit(event, data) {
        const safeEvent = String(event || '').trim();
        if (!safeEvent) {
          return socket;
        }

        wsSend(ws, safeEvent, data);
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
      disconnect(code = 1000, reason = 'client-disconnect') {
        socket.active = false;
        socket.connected = false;
        try {
          ws.close(code, reason);
        } catch (error) {
          console.error(`[realtime] ws.close error for ${socketId}:`, error && error.message ? error.message : error);
        }
      },
      broadcast: {
        emit(event, data) {
          const safeEvent = String(event || '').trim();
          if (!safeEvent) {
            return;
          }

          sockets.forEach((otherSocket, otherId) => {
            if (otherId === socketId) {
              return;
            }

            otherSocket.emit(safeEvent, data);
          });
        }
      }
    };

    ws.on('message', (raw) => {
      const message = parseRealtimeMessage(raw);
      if (!message) {
        return;
      }

      trigger(message.event, message.data);
    });

    ws.on('error', (error) => {
      trigger('error', error);
    });

    ws.on('close', () => {
      if (closed) {
        return;
      }

      closed = true;
      socket.connected = false;
      socket.active = false;
      removeFromRooms(socketId);
      sockets.delete(socketId);
      trigger('disconnect');
    });

    sockets.set(socketId, socket);
    wsSend(ws, '__meta', { id: socketId });
    return socket;
  }

  const ioTransport = {
    engine: {
      get clientsCount() {
        return sockets.size;
      }
    },
    on(event, handler) {
      if (event === 'connection' && typeof handler === 'function') {
        connectionHandlers.push(handler);
      }
      return ioTransport;
    },
    emit(event, data) {
      const safeEvent = String(event || '').trim();
      if (!safeEvent) {
        return ioTransport;
      }

      sockets.forEach((socket) => {
        socket.emit(safeEvent, data);
      });

      return ioTransport;
    },
    to(room) {
      const safeRoom = String(room || '').trim();

      return {
        emit(event, data) {
          const safeEvent = String(event || '').trim();
          if (!safeRoom || !safeEvent) {
            return;
          }

          const members = rooms.get(safeRoom);
          if (!members || !members.size) {
            return;
          }

          members.forEach((socketId) => {
            const socket = sockets.get(socketId);
            if (!socket) {
              return;
            }

            socket.emit(safeEvent, data);
          });
        }
      };
    },
    handleUpgrade(request, socket, head) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const wrapped = createSocketWrapper(request, ws);
        connectionHandlers.forEach((handler) => {
          try {
            handler(wrapped);
          } catch (error) {
            console.error('[realtime] connection handler error:', error && error.message ? error.message : error);
          }
        });
      });
    }
  };

  return ioTransport;
}

module.exports = {
  createRealtimeTransport
};