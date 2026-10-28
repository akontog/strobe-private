import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../shared/i18n';
import {
  ActivitiesAccordion, AlgebraTiles, FullScreenButton, HeroTitle,
  SharedCommonZoneLayout, StudentsAccordion, readIdentityName
} from '../../shared/components';
import activityData from './data/activities.json';
import './App.css';

const activity = activityData.activities[0];
const questions = activity.questions;
const tileWidget = activity.widgets.find((widget) => widget.type === 'algebra-tiles');
const PRODUCT_SPANS = { x2: [6, 6], xy: [6, 4], y2: [4, 4] };

function getRegion(tile) {
  const [width, height] = tile.type === 'x' ? [6, 2] : tile.type === 'y' ? [4, 2] : PRODUCT_SPANS[tile.type] || [2, 2];
  const actualWidth = tile.orientation === 'vertical' && ['x', 'y', 'xy'].includes(tile.type) ? height : width;
  const actualHeight = tile.orientation === 'vertical' && ['x', 'y', 'xy'].includes(tile.type) ? width : height;
  const centerX = (tile.x || 0) * 20 + actualWidth * 10;
  const centerY = (tile.y || 0) * 20 + actualHeight * 10;
  if (centerY < 80 && centerX >= 120 && ['x', 'y'].includes(tile.type)) return 'horizontal';
  if (centerY >= 80 && centerX < 120 && ['x', 'y'].includes(tile.type)) return 'vertical';
  if (centerY >= 80 && centerX >= 120 && ['x2', 'xy', 'y2'].includes(tile.type)) return 'product';
  return '';
}

function countTypes(tiles) {
  return tiles.reduce((counts, tile) => ({ ...counts, [tile.type]: (counts[tile.type] || 0) + 1 }), {});
}

function isCompleteRectangle(tiles, question) {
  const regions = { horizontal: [], vertical: [], product: [] };
  tiles.forEach((tile) => {
    const region = getRegion(tile);
    if (region) regions[region].push(tile);
  });
  const productCounts = countTypes(regions.product);
  if (Object.entries(question.terms).some(([type, count]) => (productCounts[type] || 0) !== count)) return false;
  if (regions.product.length !== Object.values(question.terms).reduce((sum, count) => sum + count, 0)) return false;

  const factorCounts = [countTypes(regions.horizontal), countTypes(regions.vertical)].map((counts) => [counts.x || 0, counts.y || 0]);
  const expected = question.factors;
  const matches = (left, right) => left[0] === right[0] && left[1] === right[1];
  if (!(matches(factorCounts[0], expected[0]) && matches(factorCounts[1], expected[1]))
    && !(matches(factorCounts[0], expected[1]) && matches(factorCounts[1], expected[0]))) return false;

  const occupied = new Set();
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const tile of regions.product) {
    let [width, height] = PRODUCT_SPANS[tile.type];
    if (tile.orientation === 'vertical') [width, height] = [height, width];
    const left = (tile.x || 0) - 6;
    const top = (tile.y || 0) - 4;
    minX = Math.min(minX, left); minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + width); maxY = Math.max(maxY, top + height);
    for (let x = left; x < left + width; x += 1) {
      for (let y = top; y < top + height; y += 1) {
        const key = `${x}:${y}`;
        if (occupied.has(key)) return false;
        occupied.add(key);
      }
    }
  }
  return Number.isFinite(minX) && occupied.size === (maxX - minX) * (maxY - minY);
}

export default function App({ role = 'student' }) {
  const { t: tNav } = useTranslation('navigation');
  const labels = activityData.labels || {};
  const t = (key) => labels[key] || key;
  const isTeacher = role === 'teacher';
  const [studentName, setStudentName] = useState(() => readIdentityName('Student'));
  const [selectedQuestionId, setSelectedQuestionId] = useState(questions[0].id);
  const [tiles, setTiles] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const lessonQuestionRef = useRef('');
  const selectedQuestion = questions.find((item) => item.id === selectedQuestionId) || questions[0];
  const isCorrect = isCompleteRectangle(tiles, selectedQuestion);

  useEffect(() => {
    const syncIdentity = (event) => setStudentName(String(event.detail?.name || readIdentityName('Student')).trim());
    window.addEventListener('strobe:identity-change', syncIdentity);
    window.addEventListener('storage', syncIdentity);
    return () => {
      window.removeEventListener('strobe:identity-change', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws/factorization-lab`);
      socketRef.current = socket;
      socket.addEventListener('open', () => {
        if (cancelled) return;
        setConnected(true);
        socket.send(JSON.stringify({ type: isTeacher ? 'register_teacher' : 'register_student', name: isTeacher ? 'Teacher' : studentName }));
        socket.send(JSON.stringify({ type: 'request_state' }));
        if (isTeacher) socket.send(JSON.stringify({ type: 'teacher_lesson', questionId: selectedQuestionId, tiles: [] }));
      });
      socket.addEventListener('message', (event) => {
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message?.type !== 'factorization_state') return;
        if (Array.isArray(message.participants)) setParticipants(message.participants);
        if (message.questionId && !isTeacher) setSelectedQuestionId(message.questionId);
        if (Array.isArray(message.tiles) && message.questionId !== lessonQuestionRef.current) {
          lessonQuestionRef.current = message.questionId || '';
          const ownTiles = message.participants?.find((participant) => participant.name?.trim().toLowerCase() === studentName.trim().toLowerCase())?.tiles;
          setTiles(isTeacher || !Array.isArray(ownTiles) ? message.tiles : ownTiles);
        } else if (!isTeacher && Array.isArray(message.participants)) {
          const ownTiles = message.participants.find((participant) => participant.name?.trim().toLowerCase() === studentName.trim().toLowerCase())?.tiles;
          if (Array.isArray(ownTiles)) setTiles(ownTiles);
        }
      });
      socket.addEventListener('close', () => {
        if (cancelled) return;
        setConnected(false);
        reconnectTimerRef.current = window.setTimeout(connect, 1000);
      });
      socket.addEventListener('error', () => { if (!cancelled) setConnected(false); });
    };
    connect();
    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) socket.close();
    };
  }, [isTeacher, studentName]);

  useEffect(() => {
    if (!isTeacher || !connected) return;
    socketRef.current?.send(JSON.stringify({ type: 'teacher_lesson', questionId: selectedQuestion.id, tiles: [] }));
    setTiles([]);
  }, [connected, isTeacher, selectedQuestion]);

  const selectQuestion = (id) => setSelectedQuestionId(id);
  const updateTiles = (nextTiles) => {
    setTiles(nextTiles);
    if (!isTeacher && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'tiles_update', tiles: nextTiles, isCorrect: isCompleteRectangle(nextTiles, selectedQuestion) }));
    }
  };

  return (
    <>
      <HeroTitle title={`${tNav('items.factorization')} - ${activity.code} ${activity.title}`} subtitle={activity.objective} />
      <section className="common-zone lab-zone">
        <FullScreenButton />
        <SharedCommonZoneLayout className="poly-neural-zone factorization-common-zone" leftPanel={null} rightPanel={null} centerPanel={(
          <div className="lab-card lab-card--panel poly-team-card factorization-workspace">
            <p className="factorization-target">{t('target')}: {selectedQuestion.label}</p>
            <p className="factorization-instruction">{t('instruction')}</p>
            <AlgebraTiles activity={`factorization:${selectedQuestion.id}`} mode={tileWidget.mode || tileWidget.layout} tiles={tiles} onTilesChange={updateTiles} />
            <p className={`factorization-status${isCorrect ? ' is-correct' : ''}`} aria-live="polite">{t(isCorrect ? 'correct' : 'incomplete')}</p>
          </div>
        )} />
      </section>
      {isTeacher ? <>
        <ActivitiesAccordion title={t('questions')} icon="β" label={t('chooseQuestion')} preserveSession
          options={questions.map((question) => ({ value: question.id, label: question.label }))}
          value={selectedQuestion.id} onChange={selectQuestion} />
        <StudentsAccordion title={t('studentTableTitle')} participants={participants.filter((participant) => participant.isConnected !== false)}
          columns={[
            { key: 'tiles', label: 'Ξ Ξ»Ξ±ΞΊΞ―Ξ΄ΞΉΞ± (Ο€Ξ¬Ξ½Ο‰ / Ξ±ΟΞΉΟƒΟ„ΞµΟΞ¬ / ΞΊΞ­Ξ½Ο„ΟΞΏ)', render: (participant) => `Ξ Ξ¬Ξ½Ο‰: ${(participant.tiles || []).filter((tile) => (tile.y || 0) < 4 && (tile.x || 0) >= 6).map((tile) => `${tile.sign < 0 ? 'β’' : '+'}${tile.type}`).join(' ') || 'β€”'} Β· Ξ‘ΟΞΉΟƒΟ„ΞµΟΞ¬: ${(participant.tiles || []).filter((tile) => (tile.y || 0) >= 4 && (tile.x || 0) < 6).map((tile) => `${tile.sign < 0 ? 'β’' : '+'}${tile.type}`).join(' ') || 'β€”'} Β· ΞΞ­Ξ½Ο„ΟΞΏ: ${(participant.tiles || []).filter((tile) => (tile.y || 0) >= 4 && (tile.x || 0) >= 6).map((tile) => `${tile.sign < 0 ? 'β’' : '+'}${tile.type}`).join(' ') || 'β€”'}` },
            { key: 'progress', label: t('studentTableTitle'), render: (participant) => participant.isCorrect ? t('correct') : t('incomplete') }
          ]}
          emptyMessage={t('noStudents')} />
      </> : null}
      <StudentsAccordion role={role} studentName={studentName} activity={`factorization:${selectedQuestion.id}`} currentScore={isCorrect ? activity.scoreCorrect : activity.scoreIncorrect} />
    </>
  );
}
