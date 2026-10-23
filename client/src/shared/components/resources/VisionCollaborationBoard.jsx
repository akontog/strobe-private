import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionInputLogger } from '../activities/SessionLogContext';
import { readIdentitySnapshot } from '../menu/identityStorage';
import './VisionCollaborationBoard.css';

const DEFAULT_ACTIVITY = {
  id: 'fallback-line',
  name: 'Vertical line (fallback)',
  points: {
    p1: { x: 300, y: 0 },
    p2: { x: 300, y: 480 }
  },
  shapes: [
    { type: 'line', points: ['p1', 'p2'], color: '#2563eb', width: 3 }
  ]
};
const POSE_SKELETON_EDGES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32]
];

function getDefaultVisionServerBaseUrl() {
  if (typeof window === 'undefined' || !window.location) {
    return 'http://localhost:3000';
  }
  return window.location.origin;
}

function toWsVisionUrl(baseUrl) {
  const raw = String(baseUrl || '').trim() || getDefaultVisionServerBaseUrl();
  const url = new URL(raw);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/vision';
  url.search = '';
  url.hash = '';
  return url.toString();
}

function toHttpVisionUrl(baseUrl, path) {
  const raw = String(baseUrl || '').trim() || getDefaultVisionServerBaseUrl();
  const url = new URL(raw);
  url.pathname = path;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function drawBoardBackground(ctx, width, height) {
  if (!ctx || width <= 0 || height <= 0) {
    return;
  }

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawShapeOverlay(ctx, activity, width, height) {
  if (!activity || !activity.points || !Array.isArray(activity.shapes) || width <= 0 || height <= 0) {
    return;
  }

  const sourceWidth = Number(activity.sourceWidth) > 0 ? Number(activity.sourceWidth) : 640;
  const sourceHeight = Number(activity.sourceHeight) > 0 ? Number(activity.sourceHeight) : 480;
  const sx = width / sourceWidth;
  const sy = height / sourceHeight;

  const resolvePoint = (pointId) => {
    const point = activity.points[pointId];
    if (!point) {
      return null;
    }
    return {
      x: Number(point.x) * sx,
      y: Number(point.y) * sy
    };
  };

  activity.shapes.forEach((shape) => {
    const shapePoints = Array.isArray(shape.points)
      ? shape.points.map(resolvePoint).filter(Boolean)
      : [];
    if (!shapePoints.length) {
      return;
    }

    ctx.lineWidth = Math.max(1, Number(shape.width) || 3);
    ctx.strokeStyle = String(shape.color || '#2563eb');
    ctx.beginPath();
    ctx.moveTo(shapePoints[0].x, shapePoints[0].y);
    shapePoints.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    if (String(shape.type || '').toLowerCase() === 'polygon' && shapePoints.length >= 3) {
      ctx.closePath();
    }
    ctx.stroke();
  });
}

function drawTrackingOverlay(ctx, points, boxes, width, height, poseConnections = [], trackingMode = 'point') {
  if (!Array.isArray(boxes) || !Array.isArray(points) || width <= 0 || height <= 0) {
    return;
  }

  if (trackingMode === 'pose') {
    const pointsById = new Map(points
      .filter((point) => point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)))
      .map((point) => [String(point.id).startsWith('pose-') ? String(point.id) : `pose-${point.id}`, point]));
    const connections = Array.isArray(poseConnections) && poseConnections.length
      ? poseConnections
      : POSE_SKELETON_EDGES.map(([start, end]) => [`pose-${start}`, `pose-${end}`]);
    ctx.lineWidth = Math.max(2, width / 240);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(144, 221, 176, 0.95)';
    connections.forEach((connection) => {
      if (!Array.isArray(connection) || connection.length !== 2) return;
      const startId = String(connection[0]).startsWith('pose-') ? String(connection[0]) : `pose-${connection[0]}`;
      const endId = String(connection[1]).startsWith('pose-') ? String(connection[1]) : `pose-${connection[1]}`;
      const start = pointsById.get(startId);
      const end = pointsById.get(endId);
      if (!start || !end) return;
      ctx.beginPath();
      ctx.moveTo(clamp(Number(start.x), 0, 1) * width, clamp(Number(start.y), 0, 1) * height);
      ctx.lineTo(clamp(Number(end.x), 0, 1) * width, clamp(Number(end.y), 0, 1) * height);
      ctx.stroke();
    });

    pointsById.forEach((point) => {
      ctx.beginPath();
      ctx.fillStyle = point.color || '#f4f5ee';
      ctx.arc(clamp(Number(point.x), 0, 1) * width, clamp(Number(point.y), 0, 1) * height, Math.max(3, width / 160), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  boxes.forEach((box) => {
    const x = Number(box.x || 0) * width;
    const y = Number(box.y || 0) * height;
    const w = Number(box.w || 0) * width;
    const h = Number(box.h || 0) * height;

    if (w <= 1 || h <= 1) {
      return;
    }

    const label = `${String(box.label || 'object')} #${Number(box.id || 0)}`;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
    ctx.fillRect(x, Math.max(0, y - 20), Math.max(100, label.length * 7), 18);
    ctx.fillStyle = '#04110b';
    ctx.font = '12px sans-serif';
    ctx.fillText(label, x + 5, Math.max(12, y - 7));
  });

  points.forEach((point) => {
    const px = Number(point.x || 0) * width;
    const py = Number(point.y || 0) * height;
    ctx.beginPath();
    ctx.fillStyle = point.color || '#ef4444';
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    if (point.source !== 'pose') {
      ctx.fillText(String(point.label || `#${Number(point.id || 0)}`), px + 9, py - 9);
    }
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function drawStudentPointsOverlay(ctx, points, width, height) {
  if (!Array.isArray(points) || width <= 0 || height <= 0) {
    return;
  }

  points.forEach((point) => {
    if (!point || !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) {
      return;
    }

    const px = clamp(Number(point.x), 0, 1) * width;
    const py = clamp(Number(point.y), 0, 1) * height;
    ctx.beginPath();
    ctx.fillStyle = point.color || '#8b5cf6';
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(String(point.label || 'student'), px + 12, py - 12);
  });
}

function drawStudentPoint(ctx, point, width, height) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return;
  }

  const px = clamp(point.x, 0, 1) * width;
  const py = clamp(point.y, 0, 1) * height;
  ctx.beginPath();
  ctx.fillStyle = point.color || '#8b5cf6';
  ctx.arc(px, py, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = '#ffffff';
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(String(point.label || 'you'), px + 12, py - 12);
}

export default function VisionCollaborationBoard({
  role = 'student',
  onTrackedUsersChange,
  trackingMode = 'point',
  showCameraFeed = true
}) {
  const { t } = useTranslation('interface');
  const session = useSessionInputLogger();
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const runtimeRef = useRef({
    stream: null,
    ws: null,
    sendTimer: null,
    inFlight: false,
    requestSeq: 0,
    pendingPerfNow: new Map(),
    rttSamples: [],
    points: [],
    boxes: [],
    poseConnections: [],
    trackingMode: 'point',
    studentPoints: []
  });
  const [visionServerBaseUrl, setVisionServerBaseUrl] = useState(() => import.meta.env.VITE_VISION_SERVER_URL || getDefaultVisionServerBaseUrl());
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorText, setErrorText] = useState('');
  const [trackingBackend, setTrackingBackend] = useState('-');
  const [rttAvg, setRttAvg] = useState('-');
  const [boxesCount, setBoxesCount] = useState(0);
  const [pointsCount, setPointsCount] = useState(0);
  const [activities, setActivities] = useState([DEFAULT_ACTIVITY]);
  const [selectedActivityId, setSelectedActivityId] = useState(DEFAULT_ACTIVITY.id);
  const [studentPoint, setStudentPoint] = useState({ x: 0.5, y: 0.5 });
  const [studentIdentity, setStudentIdentity] = useState(() => readIdentitySnapshot({ nameFallback: 'Student' }));
  const studentPointRef = useRef(studentPoint);
  const studentIdentityRef = useRef(studentIdentity);
  studentIdentityRef.current = studentIdentity;
  const [studentDragging, setStudentDragging] = useState(false);
  const [studentPointHovered, setStudentPointHovered] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [editingTrackName, setEditingTrackName] = useState('');
  const isTeacher = String(role).toLowerCase() === 'teacher' || String(role).toLowerCase() === 'admin';
  const shouldShowTeacherCamera = isTeacher && showCameraFeed !== false;
  const cameraVisibleRef = useRef(shouldShowTeacherCamera);
  cameraVisibleRef.current = shouldShowTeacherCamera;
  const trackingModeRef = useRef(trackingMode);
  trackingModeRef.current = trackingMode;

  const selectedActivity = useMemo(
    () => activities.find((activity) => activity.id === selectedActivityId) || activities[0] || DEFAULT_ACTIVITY,
    [activities, selectedActivityId]
  );

  useEffect(() => {
    const updateIdentity = () => setStudentIdentity(readIdentitySnapshot({ nameFallback: 'Student' }));
    window.addEventListener('strobe:identity-change', updateIdentity);
    window.addEventListener('storage', updateIdentity);
    return () => {
      window.removeEventListener('strobe:identity-change', updateIdentity);
      window.removeEventListener('storage', updateIdentity);
    };
  }, []);

  useEffect(() => {
    if (isTeacher) return;
    const ws = runtimeRef.current.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      type: 'student-point',
      point: studentPointRef.current,
      studentName: studentIdentity.name,
      studentColor: studentIdentity.color
    }));
  }, [isTeacher, studentIdentity]);

  function updateRtt(value) {
    const state = runtimeRef.current;
    if (!Number.isFinite(value)) {
      return;
    }
    state.rttSamples.push(value);
    if (state.rttSamples.length > 25) {
      state.rttSamples.splice(0, state.rttSamples.length - 25);
    }
    const avg = state.rttSamples.reduce((sum, sample) => sum + sample, 0) / state.rttSamples.length;
    setRttAvg(`${avg.toFixed(1)} ms`);
  }

  function resizeCanvases() {
    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!video || !captureCanvas || !overlayCanvas) {
      return;
    }

    const width = Math.max(320, video.videoWidth || 960);
    const height = Math.max(180, video.videoHeight || 540);
    captureCanvas.width = width;
    captureCanvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;
  }

  function ensureStudentCanvasSize() {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) {
      return;
    }

    if (overlayCanvas.width <= 0 || overlayCanvas.height <= 0) {
      overlayCanvas.width = 960;
      overlayCanvas.height = 540;
    }
  }

  function emitTrackedUsersUpdate(cameraPoints = runtimeRef.current.points, studentPoints = runtimeRef.current.studentPoints) {
    if (typeof onTrackedUsersChange !== 'function') {
      return;
    }

    const cameraUsers = (Array.isArray(cameraPoints) ? cameraPoints : []).map((point) => ({
      id: `${point.source === 'pose' ? 'pose' : 'camera'}-${point.id}`,
      username: point.label || `#${point.id}`,
      x: Number(point.x),
      y: Number(point.y),
      source: point.source === 'pose' ? 'pose' : 'camera',
      color: point.color,
      isConnected: true
    }));
    const mouseUsers = (Array.isArray(studentPoints) ? studentPoints : []).map((point) => ({
      id: `mouse-${point.id}`,
      username: point.label || 'Student',
      x: Number(point.x),
      y: Number(point.y),
      source: 'mouse',
      color: point.color,
      isConnected: true
    }));
    onTrackedUsersChange([...mouseUsers, ...cameraUsers].filter((user) => Number.isFinite(user.x) && Number.isFinite(user.y)));
  }

  function redrawOverlay() {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) {
      return;
    }

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (!cameraVisibleRef.current) {
      drawBoardBackground(ctx, overlayCanvas.width, overlayCanvas.height);
    }

    if (selectedActivity && selectedActivity.points) {
      drawShapeOverlay(ctx, selectedActivity, overlayCanvas.width, overlayCanvas.height);
    }

    drawTrackingOverlay(
      ctx,
      runtimeRef.current.points,
      runtimeRef.current.boxes,
      overlayCanvas.width,
      overlayCanvas.height,
      runtimeRef.current.poseConnections,
      runtimeRef.current.trackingMode
    );
    const ownName = studentIdentityRef.current.name;
    const ownColor = studentIdentityRef.current.color;
    const visibleStudentPoints = isTeacher
      ? runtimeRef.current.studentPoints
      : runtimeRef.current.studentPoints.filter((point) => {
          const isSamePosition = Math.abs(Number(point.x) - studentPointRef.current.x) < 0.000001
            && Math.abs(Number(point.y) - studentPointRef.current.y) < 0.000001;
          const isOwnIdentity = point.label === ownName || point.color === ownColor || point.label === 'student';
          return !(isSamePosition && isOwnIdentity);
        });
    drawStudentPointsOverlay(ctx, visibleStudentPoints, overlayCanvas.width, overlayCanvas.height);

    if (!isTeacher) {
      drawStudentPoint(ctx, {
        ...studentPointRef.current,
        label: studentIdentityRef.current.name,
        color: studentIdentityRef.current.color
      }, overlayCanvas.width, overlayCanvas.height);
    }
  }

  async function loadActivities(baseUrl) {
    try {
      const response = await fetch(toHttpVisionUrl(baseUrl, '/api/vision/activities'));
      if (!response.ok) {
        throw new Error(`vision activities request failed (${response.status})`);
      }

      const payload = await response.json();
      const nextActivities = Array.isArray(payload && payload.activities)
        ? payload.activities.filter((item) => item && typeof item === 'object')
        : [];

      if (!nextActivities.length) {
        setActivities([DEFAULT_ACTIVITY]);
        setSelectedActivityId(DEFAULT_ACTIVITY.id);
        return;
      }

      setActivities(nextActivities);
      setSelectedActivityId(nextActivities[0].id || DEFAULT_ACTIVITY.id);
    } catch {
      setActivities([DEFAULT_ACTIVITY]);
      setSelectedActivityId(DEFAULT_ACTIVITY.id);
    }
  }

  async function ensureVisionServerReachable(baseUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(toHttpVisionUrl(baseUrl, '/api/vision/health'), {
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`vision health request failed (${response.status})`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  function stopStreaming(nextStatus = 'stopped') {
    const state = runtimeRef.current;
    state.inFlight = false;
    state.pendingPerfNow.clear();

    if (state.sendTimer) {
      clearInterval(state.sendTimer);
      state.sendTimer = null;
    }

    if (state.ws) {
      if (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING) {
        state.ws.close();
      }
      state.ws = null;
    }

    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }

    const captureCanvas = captureCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (captureCanvas) {
      captureCanvas.getContext('2d').clearRect(0, 0, captureCanvas.width, captureCanvas.height);
    }
    if (overlayCanvas) {
      overlayCanvas.getContext('2d').clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }

    runtimeRef.current.points = [];
    runtimeRef.current.boxes = [];
    runtimeRef.current.studentPoints = [];
    setStreaming(false);
    setStatus(nextStatus);
  }

  function sendFrame() {
    const state = runtimeRef.current;
    const captureCanvas = captureCanvasRef.current;
    const video = videoRef.current;
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN || !captureCanvas || !video || state.inFlight) {
      return;
    }

    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.65);
    const imageBase64 = dataUrl.split(',')[1];
    const requestId = ++state.requestSeq;
    state.inFlight = true;
    state.pendingPerfNow.set(requestId, performance.now());

    state.ws.send(JSON.stringify({
      requestId,
      image: imageBase64,
      includeAnnotatedImage: false,
      activityId: selectedActivity && selectedActivity.id ? selectedActivity.id : null,
      trackingMode: trackingModeRef.current
    }));
  }

  async function startStreaming() {
    if (!isTeacher || streaming) {
      return;
    }

    try {
      await ensureVisionServerReachable(visionServerBaseUrl);
      await loadActivities(visionServerBaseUrl);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: false
      });

      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element is unavailable.');
      }

      video.srcObject = stream;
      await video.play();
      resizeCanvases();

      const ws = new WebSocket(toWsVisionUrl(visionServerBaseUrl));
      runtimeRef.current.stream = stream;
      runtimeRef.current.ws = ws;
      runtimeRef.current.rttSamples = [];
      runtimeRef.current.requestSeq = 0;
      runtimeRef.current.points = [];
      runtimeRef.current.boxes = [];
      runtimeRef.current.studentPoints = [];
      setTrackingBackend('-');
      setRttAvg('-');
      setPointsCount(0);
      setBoxesCount(0);

      ws.onopen = () => {
        setStatus('connected');
        setStreaming(true);
        setErrorText('');
        runtimeRef.current.sendTimer = setInterval(sendFrame, 100);
      };

      ws.onclose = () => {
        stopStreaming('disconnected');
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorText(`${t('visionCollabWebSocketError')} (${toWsVisionUrl(visionServerBaseUrl)})`);
      };

      ws.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(String(event.data || '{}'));
        } catch {
          return;
        }

        const requestId = Number(payload && payload.id);
        const pendingAt = runtimeRef.current.pendingPerfNow.get(requestId);
        if (Number.isFinite(pendingAt)) {
          updateRtt(performance.now() - pendingAt);
        }
        runtimeRef.current.pendingPerfNow.delete(requestId);
        runtimeRef.current.inFlight = false;

        const points = Array.isArray(payload && payload.points) ? payload.points : [];
        const boxes = Array.isArray(payload && payload.boxes) ? payload.boxes : [];
        const studentPoints = Array.isArray(payload && payload.studentPoints) ? payload.studentPoints : [];
        runtimeRef.current.points = points;
        runtimeRef.current.boxes = boxes;
        runtimeRef.current.poseConnections = Array.isArray(payload && payload.poseConnections) ? payload.poseConnections : [];
        runtimeRef.current.trackingMode = payload && payload.trackingMode === 'pose' ? 'pose' : 'point';
        runtimeRef.current.studentPoints = studentPoints;
        emitTrackedUsersUpdate(points, studentPoints);
        setTrackingBackend(String(payload && payload.tracking ? payload.tracking : '-'));
        setPointsCount(points.length);
        setBoxesCount(boxes.length);
        redrawOverlay();
      };
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : t('visionCollabCannotStart'));
      stopStreaming('cannotStart');
    }
  }

  useEffect(() => {
    if (!isTeacher) {
      setStatus('student-view');
      setStreaming(false);
      setErrorText('');
      setTrackingBackend('-');
      setRttAvg('-');
      setPointsCount(0);
      setBoxesCount(0);
      ensureStudentCanvasSize();

      const ws = new WebSocket(toWsVisionUrl(visionServerBaseUrl));
      runtimeRef.current.ws = ws;
      runtimeRef.current.points = [];
      runtimeRef.current.boxes = [];
      runtimeRef.current.studentPoints = [];

      ws.onopen = () => {
        setStatus('connected');
        setErrorText('');
        if (runtimeRef.current.ws === ws) {
          runtimeRef.current.ws.send(JSON.stringify({
            type: 'student-point',
            point: { x: studentPoint.x, y: studentPoint.y },
            studentName: studentIdentityRef.current.name,
            studentColor: studentIdentityRef.current.color
          }));
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorText(`${t('visionCollabWebSocketError')} (${toWsVisionUrl(visionServerBaseUrl)})`);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data || '{}'));
          const points = Array.isArray(payload && payload.points) ? payload.points : [];
          const boxes = Array.isArray(payload && payload.boxes) ? payload.boxes : [];
          const studentPoints = Array.isArray(payload && payload.studentPoints) ? payload.studentPoints : [];

          runtimeRef.current.points = points;
          runtimeRef.current.boxes = boxes;
          runtimeRef.current.poseConnections = Array.isArray(payload && payload.poseConnections) ? payload.poseConnections : [];
          runtimeRef.current.trackingMode = payload && payload.trackingMode === 'pose' ? 'pose' : 'point';
          runtimeRef.current.studentPoints = studentPoints;
          emitTrackedUsersUpdate(points, studentPoints);
          setTrackingBackend(String(payload && payload.tracking ? payload.tracking : '-'));
          setPointsCount(points.length);
          setBoxesCount(boxes.length);
          redrawOverlay();
        } catch {
          setErrorText(t('visionCollabWebSocketError'));
        }
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        runtimeRef.current.ws = null;
      };
    }

    if (isTeacher) {
      startStreaming();
    }
    return () => {
      stopStreaming('stopped');
    };
  }, [isTeacher, visionServerBaseUrl]);

  useEffect(() => {
    redrawOverlay();
  }, [selectedActivity, studentPoint, studentIdentity, isTeacher, shouldShowTeacherCamera]);

  useEffect(() => {
    if (!isTeacher || typeof session?.logEvent !== 'function') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const state = runtimeRef.current;
      if (!session.activeSessionId) {
        return;
      }

      fetch(`/teacher/sessions/${encodeURIComponent(session.activeSessionId)}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision: {
            capturedAt: Date.now(),
            cameraPoints: state.points,
            studentPoints: state.studentPoints,
            boxes: state.boxes,
            trackingMode: trackingModeRef.current,
            poseConnections: state.poseConnections
          }
        })
      }).catch(() => {});
    }, 100);

    return () => window.clearInterval(timer);
  }, [isTeacher, session?.activeSessionId]);

  useEffect(() => {
    emitTrackedUsersUpdate();
  }, [isTeacher, onTrackedUsersChange, studentPoint.x, studentPoint.y, studentIdentity]);

  useEffect(() => {
    if (!isTeacher) {
      ensureStudentCanvasSize();
      redrawOverlay();
    }
  }, [isTeacher, selectedActivity]);

  useEffect(() => () => {
    stopStreaming('stopped');
  }, []);

  function syncStudentPoint(nextPoint) {
    if (isTeacher) {
      return;
    }

    const rawX = nextPoint && Number.isFinite(nextPoint.x) ? nextPoint.x : 0.5;
    const rawY = nextPoint && Number.isFinite(nextPoint.y) ? nextPoint.y : 0.5;
    const safePoint = {
      x: clamp(Number(rawX), 0, 1),
      y: clamp(Number(rawY), 0, 1)
    };

    studentPointRef.current = safePoint;
    setStudentPoint(safePoint);

    const state = runtimeRef.current;
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: 'student-point',
        point: { x: safePoint.x, y: safePoint.y },
        studentName: studentIdentityRef.current.name,
        studentColor: studentIdentityRef.current.color
      }));
    }
  }

  function updateStudentPointFromPointer(event) {
    if (isTeacher) {
      return;
    }

    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) {
      return;
    }

    const rect = overlayCanvas.getBoundingClientRect();
    const normalizedX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const normalizedY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    syncStudentPoint({ x: normalizedX, y: normalizedY });
  }

  function isPointerOverStudentPoint(event) {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) {
      return false;
    }

    const rect = overlayCanvas.getBoundingClientRect();
    const x = studentPointRef.current.x * rect.width;
    const y = studentPointRef.current.y * rect.height;
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    return Math.hypot(pointerX - x, pointerY - y) <= 16;
  }

  function renameTrackedCameraPoint(event) {
    if (!isTeacher || trackingModeRef.current === 'pose') return;
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const rect = overlayCanvas.getBoundingClientRect();
    const pointerX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const pointerY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const points = runtimeRef.current.points;
    const hitBox = runtimeRef.current.boxes.find((box) => (
      pointerX >= Number(box.x || 0)
      && pointerX <= Number(box.x || 0) + Number(box.w || 0)
      && pointerY >= Number(box.y || 0)
      && pointerY <= Number(box.y || 0) + Number(box.h || 0)
    ));
    const point = (hitBox && points.find((item) => String(item.id) === String(hitBox.id)))
      || points
        .map((item) => ({
          item,
          distance: Math.hypot((Number(item.x) - pointerX) * rect.width, (Number(item.y) - pointerY) * rect.height)
        }))
        .filter(({ distance }) => distance <= 28)
        .sort((a, b) => a.distance - b.distance)[0]?.item;
    if (!point) return;

    setEditingTrackId(String(point.id));
    setEditingTrackName(String(point.label || `#${point.id}`));
  }

  function saveTrackedCameraName(event) {
    event.preventDefault();
    const name = editingTrackName.trim();
    if (!name || editingTrackId === null) return;

    const ws = runtimeRef.current.ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'camera-track-name', id: editingTrackId, name }));
    }
    runtimeRef.current.points = runtimeRef.current.points.map((item) => (
      String(item.id) === String(editingTrackId) ? { ...item, label: name } : item
    ));
    runtimeRef.current.boxes = runtimeRef.current.boxes.map((box) => (
      String(box.id) === String(editingTrackId) ? { ...box, label: name } : box
    ));
    setEditingTrackId(null);
    redrawOverlay();
  }

  return (
    <section className="vision-collab-board">
      {errorText ? <p className="vision-collab-board__error">{errorText}</p> : null}
      {isTeacher ? (
        <p className="vision-collab-board__tracking-status" role="status">
          {t('visionCollabTrackingStatus', {
            mode: trackingMode === 'pose' ? t('visionCollabPoseLandmarks') : t('visionCollabSinglePoint'),
            backend: trackingBackend,
            points: pointsCount
          })}
        </p>
      ) : null}

      <div
        className={[
          'vision-collab-board__stage',
          !isTeacher && studentPointHovered ? 'vision-collab-board__stage--point-hovered' : '',
          !isTeacher && studentDragging ? 'vision-collab-board__stage--point-dragging' : ''
        ].filter(Boolean).join(' ')}
        onPointerDown={!isTeacher ? (event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setStudentDragging(true);
          updateStudentPointFromPointer(event);
        } : undefined}
        onPointerMove={!isTeacher ? (event) => {
          setStudentPointHovered(isPointerOverStudentPoint(event));
          if (studentDragging) {
            updateStudentPointFromPointer(event);
          }
        } : undefined}
        onPointerUp={!isTeacher ? (event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          setStudentDragging(false);
        } : undefined}
        onPointerCancel={!isTeacher ? () => setStudentDragging(false) : undefined}
        onPointerLeave={!isTeacher && !studentDragging ? () => setStudentPointHovered(false) : undefined}
        onClick={isTeacher ? renameTrackedCameraPoint : undefined}
      >
        {isTeacher && editingTrackId !== null ? (
          <form
            className="vision-collab-board__rename"
            onSubmit={saveTrackedCameraName}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <label htmlFor="vision-track-name">
              {t('visionCollabRenameTrackedPoint', { name: `#${editingTrackId}` })}
            </label>
            <input
              id="vision-track-name"
              autoFocus
              value={editingTrackName}
              onChange={(event) => setEditingTrackName(event.target.value)}
              maxLength={80}
            />
            <button type="submit">{t('visionCollabSaveName')}</button>
            <button type="button" onClick={() => setEditingTrackId(null)}>{t('visionCollabCancelName')}</button>
          </form>
        ) : null}
        {isTeacher ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={!shouldShowTeacherCamera ? 'vision-collab-board__video--hidden' : ''}
          />
        ) : null}
        <canvas ref={overlayCanvasRef} width={960} height={540} />
    </div>

    {shouldShowTeacherCamera ? <canvas ref={captureCanvasRef} width={960} height={540} hidden /> : null}
  </section>
  );
}
