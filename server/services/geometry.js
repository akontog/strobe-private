function initGeometry({
  io,
  recordCommunication,
  requestCameraDetection,
  sessionManager,
  getSocketClientInfo,
  sanitizeString,
  CAMERA_FEATURES_ENABLED,
  asyncHandler,
  getCurrentActivity,
  setCurrentActivity
}) {
  const activeUsers = new Map();
  const geometryConnectionMeta = new Map();

  function touchGeometryConnection(socketId) {
    const current = geometryConnectionMeta.get(socketId);

    if (!current) {
      return;
    }

    geometryConnectionMeta.set(socketId, {
      ...current,
      lastSeenAt: Date.now()
    });
  }

  function buildUserList() {
    const list = [];

    activeUsers.forEach((user, socketId) => {
      const base = {
        id: socketId,
        name: user.name || 'User',
        color: user.color,
        shape: user.shape,
        role: user.role || 'mouse'
      };

      if (user.role === 'camera' && Array.isArray(user.points) && user.points.length) {
        user.points.forEach((point, idx) => {
          const pointId = typeof point.id === 'number' ? point.id : idx + 1;

          list.push({
            ...base,
            id: `${socketId}:${pointId}`,
            name: `${base.name} ${pointId}`,
            x: point.x,
            y: point.y
          });
        });

        return;
      }

      if (typeof user.x === 'number' && typeof user.y === 'number') {
        list.push({
          ...base,
          x: user.x,
          y: user.y
        });
      }
    });

    return list;
  }

  function emitUsersUpdate() {
    const users = buildUserList();

    recordCommunication({
      app: 'geometry',
      direction: 'out',
      event: 'users-update',
      from: 'server',
      to: 'all-sockets',
      payload: {
        points: users.length
      }
    });

    io.emit('users-update', users);
  }

  async function detectPointsFromPython(imageBase64) {
    return requestCameraDetection(imageBase64);
  }

  async function detectCameraFrameFromPython(imageBase64, options = {}) {
    return requestCameraDetection(imageBase64, options);
  }

  // Συντομογραφία: καταγράφει ένα geometry event στο communication log
  function logGeometry(direction, event, from, to, payload) {
    recordCommunication({ app: 'geometry', direction, event, from, to, payload });
  }

  // Κάθε geometry event: ενημερώνει "τελευταία φορά που ακούστηκε" και
  // δηλώνει στο sessionManager ότι ο χρήστης είναι στο geometry.
  function markGeometryActivity(socket) {
    touchGeometryConnection(socket.id);
    sessionManager.joinApp(socket.id, 'geometry');
  }

  // Καλείται μία φορά για κάθε νέα σύνδεση στο κύριο κανάλι (/ws/realtime).
  // fourierHooks: { registerFourierSocketHandlers, handleFourierDisconnect } — περνιούνται
  // εδώ (αντί να μπουν στο initGeometry) γιατί το geometry αρχικοποιείται ΠΡΙΝ το fourier.
  function registerSocketHandlers(socket, fourierHooks = {}) {
    const { registerFourierSocketHandlers, handleFourierDisconnect } = fourierHooks;

    console.log('[realtime] socket connected:', socket.id);
    recordCommunication({
      app: 'socket',
      direction: 'in',
      event: 'socket:connect',
      from: socket.id,
      to: 'server',
      payload: {
        transport: socket && socket.conn ? socket.conn.transport.name : 'unknown'
      }
    });

    const socketInfo = getSocketClientInfo(socket);
    geometryConnectionMeta.set(socket.id, {
      connectedAt: Date.now(),
      lastSeenAt: Date.now(),
      ...socketInfo
    });

    sessionManager.create(socket.id, {
      ip: socketInfo.ip,
      userAgent: socketInfo.userAgent,
      username: `user_${String(socket.id).slice(0, 6)}`,
      role: 'client',
      source: 'realtime'
    });

    const currentActivityOnConnect = getCurrentActivity();
    if (currentActivityOnConnect) {
      logGeometry('out', 'activity-loaded', 'server', socket.id, {
        shapeCount: Array.isArray(currentActivityOnConnect.geometry) ? currentActivityOnConnect.geometry.length : 0
      });
      socket.emit('activity-loaded', currentActivityOnConnect);
    }

    socket.emit('users-update', buildUserList());

    if (registerFourierSocketHandlers) {
      registerFourierSocketHandlers(socket);
    }

    socket.on('user-position', (data) => {
      markGeometryActivity(socket);
      sessionManager.update(socket.id, {
        username: sanitizeString(data && data.name, 60) || `user_${String(socket.id).slice(0, 6)}`,
        role: sanitizeString(data && data.role, 20) || 'client'
      }, {
        geometry: {
          x: Number(data && data.x),
          y: Number(data && data.y),
          color: sanitizeString(data && data.color, 20) || undefined
        }
      });
      logGeometry('in', 'user-position', socket.id, 'server', {
        role: data && data.role,
        x: data && data.x,
        y: data && data.y,
        name: data && data.name
      });

      const existing = activeUsers.get(socket.id) || {};
      const userInfo = {
        ...existing,
        id: socket.id,
        name: data && data.name ? data.name : existing.name,
        color: data && data.color ? data.color : existing.color,
        shape: data && data.shape ? data.shape : existing.shape,
        role: data && data.role ? data.role : existing.role,
        x: data && typeof data.x === 'number' ? data.x : existing.x,
        y: data && typeof data.y === 'number' ? data.y : existing.y
      };

      activeUsers.set(socket.id, userInfo);
      emitUsersUpdate();
    });

    if (CAMERA_FEATURES_ENABLED) {
      socket.on('camera-frame', asyncHandler(async (data) => {
        if (!data || !data.image) {
          return;
        }

        markGeometryActivity(socket);
        logGeometry('in', 'camera-frame', socket.id, 'server', {
          name: data && data.name,
          hasImage: Boolean(data && data.image),
          imageLength: data && data.image ? String(data.image).length : 0
        });

        const detection = await detectPointsFromPython(data.image);
        const points = Array.isArray(detection.points) ? detection.points : [];
        const boxes = Array.isArray(detection.boxes) ? detection.boxes : [];
        const tracking = typeof detection.tracking === 'string' ? detection.tracking : 'unknown';
        const existing = activeUsers.get(socket.id) || {};

        activeUsers.set(socket.id, {
          ...existing,
          id: socket.id,
          role: 'camera',
          name: data.name || existing.name,
          color: data.color || existing.color,
          shape: data.shape || existing.shape,
          points,
          boxes,
          cameraTracking: tracking
        });

        logGeometry('out', 'camera-points', 'server', socket.id, {
          count: Array.isArray(points) ? points.length : 0,
          boxes: Array.isArray(boxes) ? boxes.length : 0,
          tracking
        });
        socket.emit('camera-points', { points, boxes, tracking });
        emitUsersUpdate();
      }));

      socket.on('camera-speed-frame', asyncHandler(async (data) => {
        if (!data || !data.image) {
          return;
        }

        markGeometryActivity(socket);
        const requestId = typeof data.requestId === 'number' || typeof data.requestId === 'string'
          ? data.requestId
          : null;
        const serverReceivedAt = Date.now();

        logGeometry('in', 'camera-speed-frame', socket.id, 'server', {
          requestId,
          hasImage: Boolean(data && data.image),
          imageLength: data && data.image ? String(data.image).length : 0
        });

        const detection = await detectCameraFrameFromPython(data.image, { includeAnnotatedImage: true });
        const points = Array.isArray(detection.points) ? detection.points : [];
        const boxes = Array.isArray(detection.boxes) ? detection.boxes : [];
        const tracking = typeof detection.tracking === 'string' ? detection.tracking : 'unknown';
        const annotatedImage = typeof detection.annotatedImage === 'string' ? detection.annotatedImage : null;
        const serverSentAt = Date.now();

        logGeometry('out', 'camera-speed-result', 'server', socket.id, {
          requestId,
          boxes: boxes.length,
          points: points.length,
          tracking,
          serverElapsedMs: serverSentAt - serverReceivedAt
        });

        socket.emit('camera-speed-result', {
          requestId,
          points,
          boxes,
          tracking,
          annotatedImage,
          serverReceivedAt,
          serverSentAt,
          serverElapsedMs: serverSentAt - serverReceivedAt,
          clientSentAt: typeof data.clientSentAt === 'number' ? data.clientSentAt : null
        });
      }));
    }

    socket.on('activity-update', (geometry) => {
      markGeometryActivity(socket);
      logGeometry('in', 'activity-update', socket.id, 'server', {
        shapeCount: Array.isArray(geometry) ? geometry.length : 0
      });

      let currentActivityForUpdate = getCurrentActivity();
      if (!currentActivityForUpdate) {
        currentActivityForUpdate = {
          name: 'Live Activity',
          geometry: [],
          createdAt: new Date().toISOString()
        };
      }

      currentActivityForUpdate = { ...currentActivityForUpdate, geometry };
      setCurrentActivity(currentActivityForUpdate);

      logGeometry('out', 'activity-loaded', 'server', 'broadcast-except-sender', {
        shapeCount: Array.isArray(currentActivityForUpdate.geometry) ? currentActivityForUpdate.geometry.length : 0
      });
      socket.broadcast.emit('activity-loaded', currentActivityForUpdate);
    });

    socket.on('disconnect', () => {
      console.log('[realtime] socket disconnected:', socket.id);
      recordCommunication({
        app: 'socket',
        direction: 'in',
        event: 'socket:disconnect',
        from: socket.id,
        to: 'server'
      });

      activeUsers.delete(socket.id);
      geometryConnectionMeta.delete(socket.id);
      sessionManager.remove(socket.id);
      emitUsersUpdate(); // ενημέρωση όλων ότι αυτός ο χρήστης έφυγε (πριν το έκανε έμμεσα το fourier)

      if (handleFourierDisconnect) {
        handleFourierDisconnect(socket.id);
      }
    });
  }

  return {
    activeUsers,
    geometryConnectionMeta,
    touchGeometryConnection,
    buildUserList,
    emitUsersUpdate,
    detectPointsFromPython,
    detectCameraFrameFromPython,
    registerSocketHandlers
  };
}

module.exports = initGeometry;
