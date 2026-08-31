const { WebSocketServer } = require('ws');

class WebSocketRegistry {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * @param {string} path - URL prefix, e.g. '/ws/buffon'
   * @param {Function} handler - (request, socket, head) => void
   */
  register(path, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('WebSocket handler must be a function');
    }
    this.handlers.set(path, handler);
    console.log(`[ws-registry] registered: ${path}`);
  }

  /**
   * @param {http.IncomingMessage} request
   * @param {net.Socket} socket
   * @param {Buffer} head
   */
  handleUpgrade(request, socket, head) {
    const url = String(request.url || '');

    for (const [path, handler] of this.handlers) {
      if (url.startsWith(path)) {
        try {
          handler(request, socket, head);
        } catch (error) {
          console.error(`[ws-registry] handler error for ${path}:`, error && error.message ? error.message : error);
          socket.destroy();
        }
        return;
      }
    }

    console.warn(`[ws-registry] no handler for ${url}`);
    socket.destroy();
  }
}

module.exports = new WebSocketRegistry();