import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

function drawTrackingOverlay(ctx, points, boxes, width, height) {
  if (!Array.isArray(boxes) || !Array.isArray(points) || width <= 0 || height <= 0) {
    return;
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
    ctx.fillStyle = '#ef4444';
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`#${Number(point.id || 0)}`, px + 9, py - 9);
  });
}

export default function VisionCollaborationBoard() {
  const { t } = useTranslation('interface');
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
    boxes: []
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

  const selectedActivity = useMemo(
    () => activities.find((activity) => activity.id === selectedActivityId) || activities[0] || DEFAULT_ACTIVITY,
    [activities, selectedActivityId]
  );

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

  function redrawOverlay() {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) {
      return;
    }

    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    drawShapeOverlay(ctx, selectedActivity, overlayCanvas.width, overlayCanvas.height);
    drawTrackingOverlay(
      ctx,
      runtimeRef.current.points,
      runtimeRef.current.boxes,
      overlayCanvas.width,
      overlayCanvas.height
    );
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
      state.ws.close();
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
      activityId: selectedActivity && selectedActivity.id ? selectedActivity.id : null
    }));
  }

  async function startStreaming() {
    if (streaming) {
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
        runtimeRef.current.points = points;
        runtimeRef.current.boxes = boxes;
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
    redrawOverlay();
  }, [selectedActivity]);

  useEffect(() => () => {
    stopStreaming('stopped');
  }, []);

  return (
    <section className="vision-collab-board">
      <div className="vision-collab-board__controls">
        <label>
          {t('visionCollabServerUrl')}
          <input
            type="text"
            value={visionServerBaseUrl}
            onChange={(event) => setVisionServerBaseUrl(event.target.value)}
            disabled={streaming}
          />
        </label>

        <label>
          {t('visionCollabActivity')}
          <select
            value={selectedActivityId}
            onChange={(event) => setSelectedActivityId(event.target.value)}
          >
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>{activity.name || activity.id}</option>
            ))}
          </select>
        </label>

        <button type="button" className="tool-btn tool-btn--primary" onClick={startStreaming} disabled={streaming}>
          {t('visionCollabStart')}
        </button>
        <button type="button" className="tool-btn tool-btn--danger" onClick={stopStreaming} disabled={!streaming}>
          {t('visionCollabStop')}
        </button>
      </div>

      <div className="vision-collab-board__status">
        <span>{t('visionCollabStatus')}: <strong>{t(`visionCollabStatuses.${status}`)}</strong></span>
        <span>{t('trackingBackend')}: <strong>{trackingBackend}</strong></span>
        <span>{t('roundTripAverage')}: <strong>{rttAvg}</strong></span>
        <span>{t('trackedBoxes')}: <strong>{boxesCount}</strong></span>
        <span>{t('visionCollabTrackedPoints')}: <strong>{pointsCount}</strong></span>
      </div>

      {errorText ? <p className="vision-collab-board__error">{errorText}</p> : null}

      <div className="vision-collab-board__stage">
        <video ref={videoRef} autoPlay muted playsInline />
        <canvas ref={overlayCanvasRef} />
      </div>

      <canvas ref={captureCanvasRef} width={960} height={540} hidden />
    </section>
  );
}
