function initGeometry({ io, recordCommunication, requestCameraDetection }) {
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

  return {
    activeUsers,
    geometryConnectionMeta,
    touchGeometryConnection,
    buildUserList,
    emitUsersUpdate,
    detectPointsFromPython,
    detectCameraFrameFromPython
  };
}

module.exports = initGeometry;
