const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);
const fs = require('fs');
const path = require('path');

const CAMERA_SERVICE_URL = process.env.CAMERA_SERVICE_URL || 'http://localhost:5001/detect';

app.use(express.static('public'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Store active users and their positions
const activeUsers = new Map();

function buildUserList() {
  const list = [];

  activeUsers.forEach((user, socketId) => {
    const base = {
      id: socketId,
      name: user.name || 'Χρήστης',
      color: user.color,
      shape: user.shape,
      role: user.role || 'mouse'
    };

    if (user.role === 'camera' && Array.isArray(user.points) && user.points.length) {
      user.points.forEach((p, idx) => {
        const pointId = typeof p.id === 'number' ? p.id : idx + 1;
        list.push({
          ...base,
          id: `${socketId}:${pointId}`,
          name: `${base.name} ${pointId}`,
          x: p.x,
          y: p.y
        });
      });
    } else if (typeof user.x === 'number' && typeof user.y === 'number') {
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
  io.emit('users-update', buildUserList());
}

async function detectPointsFromPython(imageBase64) {
  try {
    const response = await fetch(CAMERA_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.points) ? data.points : [];
  } catch (error) {
    console.error('Camera service error:', error.message);
    return [];
  }
}

// Store current activity
let currentActivity = null;

// Activities directory
const activitiesDir = path.join(__dirname, 'activities');
if (!fs.existsSync(activitiesDir)) {
  fs.mkdirSync(activitiesDir);
}

// Save activity endpoint
app.post('/api/activity/save', (req, res) => {
  const { name, geometry } = req.body;
  const filename = `${Date.now()}_${name.replace(/[^a-z0-9]/gi, '_')}.json`;
  const filepath = path.join(activitiesDir, filename);
  
  const activity = {
    name,
    geometry,
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(filepath, JSON.stringify(activity, null, 2));
  currentActivity = activity;
  
  // Broadcast to all users
  io.emit('activity-loaded', activity);
  
  res.json({ success: true, filename });
});

// Load activity endpoint
app.get('/api/activity/load/:filename', (req, res) => {
  const filepath = path.join(activitiesDir, req.params.filename);
  
  if (fs.existsSync(filepath)) {
    const activity = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    currentActivity = activity;
    res.json(activity);
  } else {
    res.status(404).json({ error: 'Activity not found' });
  }
});

// List activities endpoint
app.get('/api/activity/list', (req, res) => {
  const files = fs.readdirSync(activitiesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      filename: f,
      name: JSON.parse(fs.readFileSync(path.join(activitiesDir, f), 'utf8')).name,
      createdAt: JSON.parse(fs.readFileSync(path.join(activitiesDir, f), 'utf8')).createdAt
    }));
  
  res.json(files);
});

// Get current activity
app.get('/api/activity/current', (req, res) => {
  if (currentActivity) {
    res.json(currentActivity);
  } else {
    res.json({ geometry: [] });
  }
});

io.on("connection", socket => {
  console.log("User connected:", socket.id);
  
  // Send current activity to new user
  if (currentActivity) {
    socket.emit('activity-loaded', currentActivity);
  }
  
  // Send current users to new user
  socket.emit('users-update', buildUserList());
  
  // Handle user position updates
  socket.on('user-position', (data) => {
    const existing = activeUsers.get(socket.id) || {};
    const userInfo = {
      ...existing,
      id: socket.id,
      name: data.name || existing.name,
      color: data.color || existing.color,
      shape: data.shape || existing.shape,
      role: data.role || existing.role,
      x: typeof data.x === 'number' ? data.x : existing.x,
      y: typeof data.y === 'number' ? data.y : existing.y
    };

    activeUsers.set(socket.id, userInfo);
    emitUsersUpdate();
  });

  socket.on('camera-frame', async (data) => {
    if (!data || !data.image) return;

    const points = await detectPointsFromPython(data.image);

    const existing = activeUsers.get(socket.id) || {};
    const userInfo = {
      ...existing,
      id: socket.id,
      role: 'camera',
      name: data.name || existing.name,
      color: data.color || existing.color,
      shape: data.shape || existing.shape,
      points
    };

    activeUsers.set(socket.id, userInfo);

    socket.emit('camera-points', { points });
    emitUsersUpdate();
  });
  
  // Handle teacher activity updates
  socket.on('activity-update', (geometry) => {
    if (!currentActivity) {
      currentActivity = {
        name: 'Live Activity',
        geometry: [],
        createdAt: new Date().toISOString()
      };
    }

    currentActivity = { ...currentActivity, geometry };
    socket.broadcast.emit('activity-loaded', currentActivity);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeUsers.delete(socket.id);
    emitUsersUpdate();
  });
});

http.listen(3000, () => {
  console.log("Open http://localhost:3000");
});
