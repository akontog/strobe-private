const express = require('express');
const { getAppBySlug } = require('../apps/registry');
const { appendRecord, getActiveSessionForApp } = require('../services/sessionLogs');

const router = express.Router();

router.get('/api/session-logs/active/:app', (req, res) => {
  if (!getAppBySlug(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  return res.json({ sessionId: getActiveSessionForApp(req.params.app) });
});

router.post('/api/session-logs/:sessionId/events', (req, res) => {
  const event = String(req.body && req.body.event || '');
  if (!['activity.input.changed', 'grouping.item.moved', 'activity.tiles.changed'].includes(event)) {
    return res.status(400).json({ error: 'Unsupported event.' });
  }
  const student = String(req.body && req.body.student || '').trim().slice(0, 80);
  const activity = String(req.body && req.body.activity || '').trim().slice(0, 160);
  const data = req.body && req.body.data && typeof req.body.data === 'object' ? req.body.data : {};
  if (!student || !activity) return res.status(400).json({ error: 'Student and activity are required.' });
  let eventData;
  if (event === 'activity.input.changed') {
    const field = String(data.field || '').trim().slice(0, 120);
    if (!field) return res.status(400).json({ error: 'Field is required.' });
    eventData = { field, value: String(data.value ?? '').slice(0, 500) };
  } else if (event === 'grouping.item.moved') {
    const itemId = String(data.itemId || '').trim().slice(0, 120);
    if (!itemId) return res.status(400).json({ error: 'Item id is required.' });
    eventData = {
      itemId,
      from: String(data.from || '__bank__').slice(0, 120),
      to: String(data.to || '__bank__').slice(0, 120)
    };
  } else {
    eventData = {
      tiles: Array.isArray(data.tiles) ? data.tiles.slice(0, 200).map((tile) => ({
        id: String(tile.id || '').slice(0, 120),
        type: String(tile.type || '').slice(0, 40),
        sign: Number(tile.sign) < 0 ? -1 : 1,
        x: Number(tile.x) || 0,
        y: Number(tile.y) || 0
      })) : []
    };
  }
  const record = appendRecord(req.params.sessionId, 'events.jsonl', {
    event,
    activity,
    student,
    data: eventData
  });
  if (!record) return res.status(404).json({ error: 'Active session not found.' });
  return res.status(201).json({ seq: record.seq, t: record.t });
});

module.exports = router;
