import React, { useEffect, useMemo, useRef, useState } from 'react';
import CommonZoneFullscreenButton from '../../shared/components/identity/CommonZoneFullscreenButton';
import { TeacherCard } from './components/TeacherCard';
import { DatasetSelector } from './components/DatasetSelector';
import { VerticalProducts } from './components/VerticalProducts';
import { ExamplesClassifier } from './components/ExamplesClassifier';
import {
  Accordion,
  ActivitiesMenu,
  StudentQrAccordion,
  StudentTable,
  randomIdentityColor,
  readIdentitySnapshot,
  readIdentityColor,
  readIdentityName,
  writeIdentityColor,
  writeIdentityName
} from '../../shared/components';
import DATASETS from './data/datasets';
//import { StudentTable } from '../shared-components/StudentTable';
import './App.css';

const DEFAULT_THRESHOLD_RULE = { op: '>=', boundary: 5 };
const DEFAULT_SELECTED_INPUTS = { i1: true, i2: false };
const THRESHOLD_OPS = new Set(['>', '<', '>=', '<=']);

const normalizeThresholdRule = (rule, fallback = DEFAULT_THRESHOLD_RULE) => {
  if (!rule || typeof rule !== 'object') {
    return { ...fallback };
  }

  const op = THRESHOLD_OPS.has(rule.op) ? rule.op : fallback.op;
  const boundary = Number.isFinite(Number(rule.boundary)) ? Number(rule.boundary) : Number(fallback.boundary);
  return { op, boundary };
};

const evaluateThresholdRule = (value, rule) => {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const safeRule = normalizeThresholdRule(rule);

  switch (safeRule.op) {
    case '>':
      return safeValue > safeRule.boundary;
    case '<':
      return safeValue < safeRule.boundary;
    case '<=':
      return safeValue <= safeRule.boundary;
    case '>=':
    default:
      return safeValue >= safeRule.boundary;
  }
};

const normalizeSelectedInputs = (value, fallback = DEFAULT_SELECTED_INPUTS) => {
  const source = value && typeof value === 'object' ? value : {};
  return {
    i1: typeof source.i1 === 'boolean' ? source.i1 : Boolean(fallback.i1),
    i2: typeof source.i2 === 'boolean' ? source.i2 : Boolean(fallback.i2)
  };
};

const resolveSelectedInputKey = (selectedInputs) => {
  const normalizedSelection = normalizeSelectedInputs(selectedInputs);
  if (normalizedSelection.i1 && normalizedSelection.i2) return 'both';
  if (normalizedSelection.i1) return 'i1';
  if (normalizedSelection.i2) return 'i2';
  return 'both';
};

const resolveThresholdBySelectedInputs = (threshold, selectedInputs) => {
  if (!threshold || typeof threshold !== 'object') {
    return DEFAULT_THRESHOLD_RULE;
  }

  const hasThresholdVariants = threshold.both || threshold.i1 || threshold.i2;
  if (!hasThresholdVariants) {
    return normalizeThresholdRule(threshold);
  }

  const key = resolveSelectedInputKey(selectedInputs);

  const selectedThreshold = threshold[key] || threshold.both || threshold.i1 || threshold.i2;
  return normalizeThresholdRule(selectedThreshold);
};

const resolveSeparableBySelectedInputs = (separable, selectedInputs) => {
  if (typeof separable === 'boolean') {
    return separable;
  }

  if (!separable || typeof separable !== 'object') {
    return null;
  }

  const key = resolveSelectedInputKey(selectedInputs);
  const selectedValue = separable[key];

  if (typeof selectedValue === 'boolean') {
    return selectedValue;
  }

  if (typeof separable.both === 'boolean') return separable.both;
  if (typeof separable.i1 === 'boolean') return separable.i1;
  if (typeof separable.i2 === 'boolean') return separable.i2;

  return null;
};



const App = ({ role = 'teacher' }) => {
  // Ξ£Ο„Ξ±ΞΈΞµΟΞ­Ο‚ Ξ±Ξ½Ξ±Ο†ΞΏΟΞ­Ο‚ (refs) Ξ³ΞΉΞ± Ο„Ξ·Ξ½ Ξ±Ο€ΞΏΞΈΞ®ΞΊΞµΟ…ΟƒΞ· Ξ±Ξ½Ο„ΞΉΞΊΞµΞΉΞΌΞ­Ξ½Ο‰Ξ½ Ο€ΞΏΟ… 
  // Ξ΄ΞµΞ½ Ο€ΟΞΏΞΊΞ±Ξ»ΞΏΟΞ½ ΞµΟ€Ξ±Ξ½Ξ±ΟƒΟ‡ΞµΞ΄ΞΉΞ±ΟƒΞΌΟ ΟΟ„Ξ±Ξ½ Ξ±Ξ»Ξ»Ξ¬Ξ¶ΞΏΟ…Ξ½.

  // Ξ‘Ξ½Ξ±Ο†ΞΏΟΞ¬ ΟƒΟ„ΞΏ Ξ±Ξ½Ο„ΞΉΞΊΞµΞ―ΞΌΞµΞ½ΞΏ WebSocket Ξ³ΞΉΞ± Ο„Ξ·Ξ½ ΞµΟ€ΞΉΞΊΞΏΞΉΞ½Ο‰Ξ½Ξ―Ξ± ΞΌΞµ Ο„ΞΏΞ½ server.
  const wsRef = useRef(null);
  // Ξ‘Ξ½Ξ±Ο†ΞΏΟΞ¬ Ξ³ΞΉΞ± Ο„ΞΏΞ½ Ο‡ΟΞΏΞ½ΞΏΞ΄ΞΉΞ±ΞΊΟΟ€Ο„Ξ· ΞµΟ€Ξ±Ξ½Ξ±ΟƒΟΞ½Ξ΄ΞµΟƒΞ·Ο‚
  const reconnectTimerRef = useRef(null);
  // Ξ‘Ξ½Ξ±Ο†ΞΏΟΞ¬ Ξ³ΞΉΞ± Ξ½Ξ± ΞµΞ»Ξ­Ξ³Ο‡ΞµΞΉ Ξ±Ξ½ Ξ­Ο‡ΞµΞΉ Ξ³Ξ―Ξ½ΞµΞΉ Ξ®Ξ΄Ξ· Ξ· ΞµΞ³Ξ³ΟΞ±Ο†Ξ® Ο„ΞΏΟ… ΟΟΞ»ΞΏΟ… 
  // (teacher/student/screen) ΟƒΟ„ΞΏΞ½ server.
  const hasRegisteredRef = useRef(false);
  // Ξ‘Ξ½Ξ±Ο†ΞΏΟΞ¬ Ξ³ΞΉΞ± Ξ½Ξ± ΞΊΞ±Ο„Ξ±ΟƒΟ„ΞµΞ―Ξ»ΞµΞΉ Ο„Ξ·Ξ½ Ξ±Ο€ΞΏΟƒΟ„ΞΏΞ»Ξ® ΞΊΞ±Ο„Ξ¬ΟƒΟ„Ξ±ΟƒΞ·Ο‚ Ο„ΞΏΟ… ΞΌΞ±ΞΈΞ·Ο„Ξ® ΟƒΟ„ΞΏΞ½ server, 
  // ΟΟ„Ξ±Ξ½ Ξ· ΞΊΞ±Ο„Ξ¬ΟƒΟ„Ξ±ΟƒΞ· Ξ­Ο‡ΞµΞΉ ΞµΞ½Ξ·ΞΌΞµΟΟ‰ΞΈΞµΞ― Ξ±Ο€Ο Ο„ΞΏΞ½ server.
  const suppressNextStudentStateSendRef = useRef(false);
  // Ξ‘Ξ½Ξ±Ο†ΞΏΟΞ¬ Ξ³ΞΉΞ± Ξ½Ξ± Ξ±Ο€ΞΏΞΈΞ·ΞΊΞµΟΞµΞΉ Ο„Ξ·Ξ½ Ο„ΞµΞ»ΞµΟ…Ο„Ξ±Ξ―Ξ± ΞΊΞ±Ο„Ξ¬ΟƒΟ„Ξ±ΟƒΞ· Ο„ΞΏΟ… ΞΌΞ±ΞΈΞ·Ο„Ξ® Ο€ΞΏΟ… ΟƒΟ„Ξ¬Ξ»ΞΈΞ·ΞΊΞµ ΟƒΟ„ΞΏΞ½ server.
  // Ξ±Ο€ΞΏΟ†ΞµΟΞ³ΞµΞΉ Ο„Ξ·Ξ½ Ξ±Ο€ΞΏΟƒΟ„ΞΏΞ»Ξ® Ο„Ξ·Ο‚ Ξ―Ξ΄ΞΉΞ±Ο‚ ΞΊΞ±Ο„Ξ¬ΟƒΟ„Ξ±ΟƒΞ·Ο‚ Ο€ΞΏΞ»Ξ»Ξ­Ο‚ Ο†ΞΏΟΞ­Ο‚.
  const lastSentStudentStateRef = useRef('');
  const prevTeacherActivityRef = useRef('1');

  // --- State Variables ---
  // Ξ”ΞµΞ΄ΞΏΞΌΞ­Ξ½Ξ± Ο€ΞΏΟ… Ξ±Ξ»Ξ»Ξ¬Ξ¶ΞΏΟ…Ξ½ Ξ΄Ο…Ξ½Ξ±ΞΌΞΉΞΊΞ¬, ΞΊΞ±Ο„Ξ¬ Ο„Ξ· Ξ΄ΞΉΞ¬ΟΞΊΞµΞΉΞ± Ξ¶Ο‰Ξ®Ο‚ Ο„Ξ·Ο‚ ΞµΟ†Ξ±ΟΞΌΞΏΞ³Ξ®Ο‚, 
  // ΞµΟ€Ξ·ΟΞµΞ¬Ξ¶ΞΏΞ½Ο„Ξ±Ο‚ ΞµΞΌΟ†Ξ¬Ξ½ΞΉΟƒΞ· ΞΊΞ±ΞΉ ΟƒΟ…ΞΌΟ€ΞµΟΞΉΟ†ΞΏΟΞ¬ Ο„Ξ·Ο‚ ΞµΟ†Ξ±ΟΞΌΞΏΞ³Ξ®Ο‚.
  // const [state, setState] = useState(initialValue);
  // ΟƒΟ„Ξ±ΞΈΞµΟΞ¬ [Ο„ΟΞ­Ο‡ΞΏΟ…ΟƒΞ± Ο„ΞΉΞΌΞ®, ΟƒΟ…Ξ½Ξ¬ΟΟ„Ξ·ΟƒΞ· ΞµΞ½Ξ·ΞΌΞ­ΟΟ‰ΟƒΞ·Ο‚] = useState(Ξ±ΟΟ‡ΞΉΞΊΞ® Ο„ΞΉΞΌΞ®);
  // Ξ‘Ξ»Ξ»Ξ¬Ξ¶ΞΏΞ½Ο„Ξ±Ο‚ Ο„ΞΏ currentDataset Ξ±Ξ»Ξ»Ξ¬Ξ¶ΞµΞΉ Ο„ΞΏ ΟƒΟΞ½ΞΏΞ»ΞΏ Ξ΄ΞµΞ΄ΞΏΞΌΞ­Ξ½Ο‰Ξ½
  const [currentDataset, setCurrentDataset] = useState('vehicles');
  // Ξ”ΞµΞ―ΞΊΟ„Ξ·Ο‚ Ο„ΞΏΟ… Ο€Ξ±ΟΞ±Ξ΄ΞµΞ―Ξ³ΞΌΞ±Ο„ΞΏΟ‚ Ο€ΞΏΟ… ΞµΞΌΟ†Ξ±Ξ½Ξ―Ξ¶ΞµΟ„Ξ±ΞΉ Ξ±Ο€Ο Ο„ΞΏ Ο„ΟΞ­Ο‡ΞΏΞ½ ΟƒΟΞ½ΞΏΞ»ΞΏ Ξ΄ΞµΞ΄ΞΏΞΌΞ­Ξ½Ο‰Ξ½.
  const [currentExample, setCurrentExample] = useState(0);
  // Ξ”ΞµΞ―ΞΊΟ„Ξ·Ο‚ Ο„ΞΏΟ… Ξ³ΟΞ±ΞΌΞΌΞΉΞΊΞΏΟ demo Ο€ΞΏΟ… ΞµΞΌΟ†Ξ±Ξ½Ξ―Ξ¶ΞµΟ„Ξ±ΞΉ Ξ±Ο€Ο Ο„ΞΏ Ο„ΟΞ­Ο‡ΞΏΞ½ ΟƒΟΞ½ΞΏΞ»ΞΏ Ξ΄ΞµΞ΄ΞΏΞΌΞ­Ξ½Ο‰Ξ½ (Ξ³ΞΉΞ± Ο„ΞΏΞ½ Ξ΄Ξ¬ΟƒΞΊΞ±Ξ»ΞΏ).
  const [currentLinearDemoIndex, setCurrentLinearDemoIndex] = useState(undefined);
  // Ξ”ΞµΞ―ΞΊΟ„Ξ·Ο‚ Ο„ΞΏΟ… Ξ³ΟΞ±ΞΌΞΌΞΉΞΊΞΏΟ demo Ο€ΞΏΟ… ΞµΞΌΟ†Ξ±Ξ½Ξ―Ξ¶ΞµΟ„Ξ±ΞΉ Ξ±Ο€Ο Ο„ΞΏ Ο„ΟΞ­Ο‡ΞΏΞ½ ΟƒΟΞ½ΞΏΞ»ΞΏ Ξ΄ΞµΞ΄ΞΏΞΌΞ­Ξ½Ο‰Ξ½ (Ξ³ΞΉΞ± Ο„ΞΏΞ½ ΞΌΞ±ΞΈΞ·Ο„Ξ®).
  const [lessonLinearDemoIndex, setLessonLinearDemoIndex] = useState(undefined);
  // Ξ— Ο„ΟΞ­Ο‡ΞΏΟ…ΟƒΞ± Ξ΄ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„Ξ± Ο€ΞΏΟ… Ξ­Ο‡ΞµΞΉ ΞµΟ€ΞΉΞ»Ξ­ΞΎΞµΞΉ ΞΏ Ξ΄Ξ¬ΟƒΞΊΞ±Ξ»ΞΏΟ‚.
  const [selectedActivity, setSelectedActivity] = useState('1');
  // Ξ— Ξ΄ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„Ξ± Ο€ΞΏΟ… Ξ­Ο‡ΞµΞΉ ΞΏΟΞΉΟƒΟ„ΞµΞ― Ξ±Ο€Ο Ο„ΞΏΞ½ Ξ΄Ξ¬ΟƒΞΊΞ±Ξ»ΞΏ ΞΊΞ±ΞΉ ΞµΞΌΟ†Ξ±Ξ½Ξ―Ξ¶ΞµΟ„Ξ±ΞΉ ΟƒΟ„ΞΏΟ…Ο‚ ΞΌΞ±ΞΈΞ·Ο„Ξ­Ο‚.
  const [lessonActivity, setLessonActivity] = useState('1');
  // Ξ¤Ξ± Ο…Ο€ΟΞ»ΞΏΞΉΟ€Ξ± state variables Ξ±Ο†ΞΏΟΞΏΟΞ½ Ο„ΞΉΟ‚ ΞµΞΉΟƒΟΞ΄ΞΏΟ…Ο‚, Ο„Ξ± Ξ²Ξ¬ΟΞ·, Ο„Ξ± Ο€ΟΞΏΟΟΞ½Ο„Ξ± ΞΊΞ±ΞΉ Ο„ΞΏ ΟƒΟ…Ξ½ΞΏΞ»ΞΉΞΊΟ Ξ±Ο€ΞΏΟ„Ξ­Ξ»ΞµΟƒΞΌΞ± Ξ³ΞΉΞ± Ο„ΞΏΞ½ Ξ΄Ξ¬ΟƒΞΊΞ±Ξ»ΞΏ ΞΊΞ±ΞΉ Ο„ΞΏΟ…Ο‚ ΞΌΞ±ΞΈΞ·Ο„Ξ­Ο‚.
  const [teacherInputs, setTeacherInputs] = useState({ i1: 4, i2: 1 });
  const [studentInputs, setStudentInputs] = useState({ i1: '', i2: '' });
  const [teacherProducts, setTeacherProducts] = useState({ p1: '', p2: '' });
  const [studentProducts, setStudentProducts] = useState({ p1: '', p2: '' });
  const [teacherTotal, setTeacherTotal] = useState('');
  const [studentTotal, setStudentTotal] = useState('');
  const [dynamicW1, setDynamicW1] = useState(2);
  const [dynamicW2, setDynamicW2] = useState(3);
  // Ξ¤ΞΏ isSocketConnected Ξ΄ΞµΞ―Ο‡Ξ½ΞµΞΉ Ξ±Ξ½ Ξ· ΟƒΟΞ½Ξ΄ΞµΟƒΞ· WebSocket ΞµΞ―Ξ½Ξ±ΞΉ ΞµΞ½ΞµΟΞ³Ξ® Ξ® ΟΟ‡ΞΉ.
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  // Ξ ΞΏΞΉΞΏΞΉ ΞΊΞ±ΞΉ Ο€ΟΟƒΞΏΞΉ ΟƒΟ…Ξ½Ξ΄ΞµΞ΄ΞµΞΌΞ­Ξ½ΞΏΞΉ ΞΌΞ±ΞΈΞ·Ο„Ξ­Ο‚ Ο…Ο€Ξ¬ΟΟ‡ΞΏΟ…Ξ½ Ξ±Ο…Ο„Ξ® Ο„Ξ· ΟƒΟ„ΞΉΞ³ΞΌΞ® (Ο‡ΟΞ·ΟƒΞΉΞΌΞΏΟ€ΞΏΞΉΞµΞ―Ο„Ξ±ΞΉ ΞΌΟΞ½ΞΏ Ξ±Ο€Ο Ο„ΞΏΞ½ Ξ΄Ξ¬ΟƒΞΊΞ±Ξ»ΞΏ).
  const [participants, setParticipants] = useState([]);
  const [roster, setRoster] = useState([]);
  const [lessonInputs, setLessonInputs] = useState({ i1: 4, i2: 1 });
  const [lessonProducts, setLessonProducts] = useState({ p1: '', p2: '' });
  const [lessonTotal, setLessonTotal] = useState('');
  const [lessonWeights, setLessonWeights] = useState({ w1: 2, w2: 3 });
  const [lessonThreshold, setLessonThreshold] = useState(DEFAULT_THRESHOLD_RULE);
  const [selectedInputs, setSelectedInputs] = useState(DEFAULT_SELECTED_INPUTS);
  const [lessonSelectedInputs, setLessonSelectedInputs] = useState(DEFAULT_SELECTED_INPUTS);
  const [lessonDataset, setLessonDataset] = useState('vehicles');
  const [lessonExampleIndex, setLessonExampleIndex] = useState(0);
  const [lessonIcon, setLessonIcon] = useState('π—');
  const [lessonName, setLessonName] = useState('Ξ‘Ο…Ο„ΞΏΞΊΞ―Ξ½Ξ·Ο„ΞΏ');
  const NEURAL_ACTIVITY_OPTIONS = [
    { value: '1', label: '1. Ξ’ΟΞ―ΟƒΞΊΟ‰ Ο„Ξ·Ξ½ ΞµΞ―ΟƒΞΏΞ΄ΞΏ' },
    { value: '2', label: '2. Ξ¥Ο€ΞΏΞ»ΞΏΞ³Ξ―Ξ¶Ο‰ Ο„Ξ·Ξ½ Ξ­ΞΎΞΏΞ΄ΞΏ' },
    { value: '3', label: '3. Ξ ΟΞΏΟƒΞ±ΟΞΌΟΞ¶Ο‰ Ο„Ξ± Ξ²Ξ¬ΟΞ·' },
    { value: '4', label: '4. Ξ£Ο…Ξ³ΞΊΟΞ―Ξ½Ο‰' }
  ];
  const getNeuralActivityTitle = (activityId, fallback = NEURAL_ACTIVITY_OPTIONS[0].label) => {
    const normalizedId = String(activityId ?? '').trim();
    const match = NEURAL_ACTIVITY_OPTIONS.find((option) => option.value === normalizedId);
    return match ? match.label : fallback;
  };
  const [lessonActivityTitle, setLessonActivityTitle] = useState(getNeuralActivityTitle('1'));
  


// Ξ”Ξ·ΞΌΞΉΞΏΟ…ΟΞ³ΞµΞ― Ξ­Ξ½Ξ± Ο„Ο…Ο‡Ξ±Ξ―ΞΏ ΟΞ½ΞΏΞΌΞ± ΞΌΞ±ΞΈΞ·Ο„Ξ® Ξ±Ξ½ Ξ΄ΞµΞ½ Ο…Ο€Ξ¬ΟΟ‡ΞµΞΉ Ξ±Ο€ΞΏΞΈΞ·ΞΊΞµΟ…ΞΌΞ­Ξ½ΞΏ ΟƒΟ„ΞΏ localStorage.
  const [studentName, setStudentName] = useState(() => {
  return readIdentityName(`Student-${Math.floor(Math.random() * 900 + 100)}`);
});
const [studentColor, setStudentColor] = useState(() => {
  return readIdentityColor(randomIdentityColor());
});
  useEffect(() => {
    function syncIdentity() {
      const next = readIdentitySnapshot({
        nameFallback: `Student-${Math.floor(Math.random() * 900 + 100)}`,
        colorFallback: randomIdentityColor()
      });
      setStudentName(next.name);
      setStudentColor(next.color);
    }

    syncIdentity();
    window.addEventListener('strobe:identity-change', syncIdentity);
    window.addEventListener('storage', syncIdentity);

    return () => {
      window.removeEventListener('strobe:identity-change', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  // Ξ‘Ξ½Ξ±Ο†ΞΏΟΞ¬ Ξ³ΞΉΞ± Ξ½Ξ± Ξ±Ο€ΞΏΞΈΞ·ΞΊΞµΟΞµΞΉ Ο„Ξ·Ξ½ ΞµΞ―ΟƒΞΏΞ΄ΞΏ Ο„ΞΏΟ… ΞΏΞ½ΟΞΌΞ±Ο„ΞΏΟ‚ Ο„ΞΏΟ… ΞΌΞ±ΞΈΞ·Ο„Ξ®.
  const [studentNameInput, setStudentNameInput] = useState(studentName);
  
  
  const currentExampleData = DATASETS[currentDataset].examples[currentExample];
  const currentDatasetLinearDemos = DATASETS[currentDataset]?.linear_demos || [];
  const teacherThresholdFromDemo = resolveThresholdBySelectedInputs(
    currentDatasetLinearDemos[currentLinearDemoIndex]?.threshold,
    selectedInputs
  );
  const teacherThresholdRule = normalizeThresholdRule(teacherThresholdFromDemo);
  const isTeacher = role === 'teacher';
  const isScreen = role === 'screen';
  const isStudent = role === 'student';
  const activeActivity = isTeacher ? selectedActivity : lessonActivity;
  const displayIcon = isTeacher ? currentExampleData.icon : lessonIcon;
  const displayName = isTeacher ? currentExampleData.name : lessonName;

  const displayDataset = isTeacher ? currentDataset : lessonDataset;
  const safeDisplayDataset = DATASETS[displayDataset] ? displayDataset : 'vehicles';
  const effectiveSelectedInputs = isTeacher ? selectedInputs : lessonSelectedInputs;
  const showInput1 = Boolean(effectiveSelectedInputs.i1);
  const showInput2 = Boolean(effectiveSelectedInputs.i2);
  const showTotalRow = showInput1 && showInput2;

  const effectiveLinearDemoIndex = isTeacher ? currentLinearDemoIndex : lessonLinearDemoIndex;
  const effectiveLinearDemos = DATASETS[safeDisplayDataset]?.linear_demos || [];
  const effectiveLinearDemo = Number.isInteger(Number(effectiveLinearDemoIndex))
    ? effectiveLinearDemos[Number(effectiveLinearDemoIndex)]
    : null;

  let demoIcon = null;
  let demoLabel = 'ΞΞ· ΞµΟ€ΞΉΞ»ΞµΞ³ΞΌΞ­Ξ½ΞΏ';

  // Activities 1-3 keep right-side icon area empty.
  if (activeActivity === '4' && effectiveLinearDemoIndex !== undefined && DATASETS[safeDisplayDataset]?.linear_demos) {
    const demos = DATASETS[safeDisplayDataset].linear_demos;
    const selectedDemo = demos[effectiveLinearDemoIndex];
    if (selectedDemo) {
      const targetExample = DATASETS[safeDisplayDataset].examples.find(
        ex => ex.name === selectedDemo.example
      );
      demoIcon = targetExample ? targetExample.icon : null;
      demoLabel = selectedDemo.example || 'ΞΞ· ΞµΟ€ΞΉΞ»ΞµΞ³ΞΌΞ­Ξ½ΞΏ';
    }
  }

  const toFinite = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const isInputEditable = activeActivity === '1';
  const isWeightEditable = activeActivity === '3' || activeActivity === '4';
  const isProductEditable = activeActivity === '2';
  const isTotalEditable = isProductEditable;
  const isThresholdVisible = activeActivity === '3' || activeActivity === '4';
  const showThresholdUnderIcon = activeActivity === '4';
  const effectiveThresholdRule = isTeacher ? teacherThresholdRule : lessonThreshold;
  const thresholdDisplayText = `${effectiveThresholdRule.op} ${effectiveThresholdRule.boundary}`;

  const currentInputs = isTeacher
    ? teacherInputs
    : isStudent && activeActivity === '1'
      ? studentInputs
      : lessonInputs;

  const i1 = currentInputs.i1;
  const i2 = currentInputs.i2;

  const currentW1 = isTeacher
    ? dynamicW1
    : isStudent && (activeActivity === '3' || activeActivity === '4')
      ? dynamicW1
      : lessonWeights.w1;
  const currentW2 = isTeacher
    ? dynamicW2
    : isStudent && (activeActivity === '3' || activeActivity === '4')
      ? dynamicW2
      : lessonWeights.w2;

  const effectiveI1 = showInput1 ? i1 : 0;
  const effectiveI2 = showInput2 ? i2 : 0;
  const effectiveW1 = showInput1 ? currentW1 : 0;
  const effectiveW2 = showInput2 ? currentW2 : 0;

  const computedProd1 = showInput1 ? Number((toFinite(effectiveW1) * toFinite(effectiveI1)).toFixed(2)) : '';
  const computedProd2 = showInput2 ? Number((toFinite(effectiveW2) * toFinite(effectiveI2)).toFixed(2)) : '';

  const currentProducts = isTeacher ? teacherProducts : studentProducts;
  const prod1 = showInput1 ? (isProductEditable ? currentProducts.p1 : computedProd1) : '';
  const prod2 = showInput2 ? (isProductEditable ? currentProducts.p2 : computedProd2) : '';

  const computedTotal = Number((toFinite(prod1) + toFinite(prod2)).toFixed(2));
  const total = isTotalEditable
    ? (isTeacher ? teacherTotal : studentTotal)
    : (showTotalRow ? computedTotal : '');
  const isEmptyCalcInput = (value) => value === '' || value === null || typeof value === 'undefined' || value === '-';
  const useQuestionForOutputs = activeActivity === '1' || activeActivity === '3' || activeActivity === '4';
  const missingP1Input = activeActivity === '1'
    ? showInput1 && isEmptyCalcInput(i1)
    : activeActivity === '3' || activeActivity === '4'
      ? showInput1 && isEmptyCalcInput(currentW1)
      : false;
  const missingP2Input = activeActivity === '1'
    ? showInput2 && isEmptyCalcInput(i2)
    : activeActivity === '3' || activeActivity === '4'
      ? showInput2 && isEmptyCalcInput(currentW2)
      : false;
  const missingTotalInput = showTotalRow && (missingP1Input || missingP2Input);
  const displayedProd1 = !showInput1
    ? ''
    : useQuestionForOutputs && !isProductEditable && missingP1Input
      ? '?'
      : prod1;
  const displayedProd2 = !showInput2
    ? ''
    : useQuestionForOutputs && !isProductEditable && missingP2Input
      ? '?'
      : prod2;
  const displayedTotal = !showTotalRow
    ? ''
    : useQuestionForOutputs && !isTotalEditable && missingTotalInput
      ? '?'
      : total;

  // const formulaByActivity = {
  //   '1': '$$ w_1 \\times i_1 + w_2 \\times i_2 = o $$',
  //   '2': '$$ (w_1 \\times i_1) + (w_2 \\times i_2) = o $$',
  //   '3': '$$ w_1 \\times i_1 + w_2 \\times i_2 \\gt \\text{threshold} $$',
  //   '4': '$$ w_1 \\times i_1 + w_2 \\times i_2 \\gt \\text{threshold} $$'
  // };
  // const mathTitle = formulaByActivity[activeActivity] || '$$ w_1 \\times i_1 + w_2 \\times i_2 = o $$';
  const teacherActivityTitle = getNeuralActivityTitle(selectedActivity);
  const heroTitle = isTeacher ? teacherActivityTitle : (lessonActivityTitle || getNeuralActivityTitle(activeActivity));

  const threshold = {
    satisfied: showTotalRow && !missingTotalInput && evaluateThresholdRule(total, effectiveThresholdRule),
    value: thresholdDisplayText,
    rule: effectiveThresholdRule,
    total: toFinite(total)
  };
  const effectiveSeparable = resolveSeparableBySelectedInputs(
    effectiveLinearDemo?.separable,
    effectiveSelectedInputs
  );
  const separableLabel = effectiveSeparable === null
    ? 'Ξ”ΞΉΞ±Ο‡Ο‰ΟΞΉΟƒΞΌΟΟ‚: -'
    : effectiveSeparable
      ? 'Ξ”ΞΉΞ±Ο‡Ο‰ΟΞΉΟƒΞΌΟΟ‚: β…'
      : 'Ξ”ΞΉΞ±Ο‡Ο‰ΟΞΉΟƒΞΌΟΟ‚: β';
  const demoFooterText = activeActivity === '4'
    ? `ΞΟΞΉΞΏ: ${thresholdDisplayText} | ${separableLabel}`
    : '';

  const handleWeightChange = (which, value) => {
    const normalized = value === '' || value === '-' ? value : Number(value);
    if (which === 'w1') {
      setDynamicW1(Number.isFinite(normalized) || normalized === '' || normalized === '-' ? normalized : 0);
    } else {
      setDynamicW2(Number.isFinite(normalized) || normalized === '' || normalized === '-' ? normalized : 0);
    }
  };

  const sendSocketMessage = (payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  };

  const sendTeacherLessonPatch = (lessonPatch) => {
    if (!isTeacher || !isSocketConnected) return;
    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: lessonPatch
    });
  };

  useEffect(() => {
    let cancelled = false;

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const registerCurrentRole = () => {
      if (hasRegisteredRef.current) return;

      if (isStudent) {
        sendSocketMessage({ type: 'register_student', name: studentName, color: studentColor });
      } else if (isScreen) {
        sendSocketMessage({ type: 'register_teacher', name: 'Screen' });
      } else {
        sendSocketMessage({ type: 'register_teacher', name: studentName || 'Teacher' });
      }

      sendSocketMessage({ type: 'request_state' });
      hasRegisteredRef.current = true;
    };

    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws/neural-lab`);
      wsRef.current = ws;
      // ΞΟ„Ξ±Ξ½ Ξ±Ξ½ΞΏΞ―ΞΎΞµΞΉ Ξ· ΟƒΟΞ½Ξ΄ΞµΟƒΞ· WebSocket
      ws.addEventListener('open', () => {
        if (cancelled) return;
        setIsSocketConnected(true);
        hasRegisteredRef.current = false;
        registerCurrentRole();
      });
      // ΞΟ„Ξ±Ξ½ Ξ»Ξ·Ο†ΞΈΞµΞ― ΞΌΞ®Ξ½Ο…ΞΌΞ± Ξ±Ο€Ο Ο„ΞΏΞ½ server
      ws.addEventListener('message', (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (message?.type !== 'canvas_state') return;

        if (message.lesson?.inputs) {
          setLessonInputs({
            i1: message.lesson.inputs.i1 ?? '',
            i2: message.lesson.inputs.i2 ?? ''
          });
        }

        if (message.lesson?.products) {
          setLessonProducts({
            p1: message.lesson.products.p1 ?? '',
            p2: message.lesson.products.p2 ?? ''
          });
        }

        if (Object.prototype.hasOwnProperty.call(message.lesson, 'total')) {
          setLessonTotal(message.lesson.total ?? '');
        }

        if (message.lesson?.weights && typeof message.lesson.weights === 'object') {
          setLessonWeights({
            w1: message.lesson.weights.w1 ?? 2,
            w2: message.lesson.weights.w2 ?? 3
          });
        }

        if (typeof message.lesson?.activityId === 'string') {
          setLessonActivity(message.lesson.activityId);
        }

        if (typeof message.lesson?.activityTitle === 'string' && message.lesson.activityTitle.trim()) {
          setLessonActivityTitle(message.lesson.activityTitle.trim());
        } else if (typeof message.lesson?.activityId === 'string') {
          setLessonActivityTitle(getNeuralActivityTitle(message.lesson.activityId));
        }

        if (Number.isInteger(Number(message.lesson?.targetIndex))) {
          setLessonTarget(Number(message.lesson.targetIndex));
        }

        if (Object.prototype.hasOwnProperty.call(message.lesson, 'threshold')) {
          const incomingThreshold = message.lesson.threshold;
          if (Number.isFinite(Number(incomingThreshold))) {
            setLessonThreshold(normalizeThresholdRule({ op: '>=', boundary: Number(incomingThreshold) }));
          } else {
            setLessonThreshold(normalizeThresholdRule(incomingThreshold));
          }
        }

        if (Object.prototype.hasOwnProperty.call(message.lesson, 'selectedInputs')) {
          setLessonSelectedInputs(normalizeSelectedInputs(message.lesson.selectedInputs));
        }

        if (typeof message.lesson?.dataset === 'string' && DATASETS[message.lesson.dataset]) {
          setLessonDataset(message.lesson.dataset);
        }

        if (Number.isInteger(Number(message.lesson?.exampleIndex))) {
          const nextIndex = Number(message.lesson.exampleIndex);
          const sourceDataset = (typeof message.lesson?.dataset === 'string' && DATASETS[message.lesson.dataset])
            ? message.lesson.dataset
            : 'vehicles';
          const maxIdx = DATASETS[sourceDataset].examples.length - 1;
          setLessonExampleIndex(Math.max(0, Math.min(maxIdx, nextIndex)));
        }
        if (message.lesson && Object.prototype.hasOwnProperty.call(message.lesson, 'linearDemoIndex')) {
          const idx = Number(message.lesson.linearDemoIndex);
          if (Number.isInteger(idx) && idx >= 0) {
            setLessonLinearDemoIndex(idx);
          } else {
            setLessonLinearDemoIndex(undefined);
          }
        }
        if (typeof message.lesson?.icon === 'string' && message.lesson.icon.trim()) {
          setLessonIcon(message.lesson.icon.trim());
        }

        if (typeof message.lesson?.exampleName === 'string' && message.lesson.exampleName.trim()) {
          setLessonName(message.lesson.exampleName.trim());
        }

        if (Array.isArray(message.participants)) {
          setParticipants(message.participants);
        }

        if (Array.isArray(message.roster)) {
          setRoster(message.roster);
        }

        if (isStudent && message.me) {
          suppressNextStudentStateSendRef.current = true;

          if (message.me.weights) {
            setDynamicW1((prev) => (prev === '-' ? prev : (message.me.weights.w1 ?? '')));
            setDynamicW2((prev) => (prev === '-' ? prev : (message.me.weights.w2 ?? '')));
          }

          if (message.me.inputs) {
            setStudentInputs({
              i1: message.me.inputs.i1 ?? '',
              i2: message.me.inputs.i2 ?? ''
            });
          }

          if (message.me.products) {
            setStudentProducts({
              p1: message.me.products.p1 ?? '',
              p2: message.me.products.p2 ?? ''
            });
          }

          if (Object.prototype.hasOwnProperty.call(message.me, 'total')) {
            setStudentTotal(message.me.total ?? '');
          }
        }
      });
      // ΞΟ„Ξ±Ξ½ ΞΊΞ»ΞµΞ―ΟƒΞµΞΉ Ξ· ΟƒΟΞ½Ξ΄ΞµΟƒΞ· WebSocket
      ws.addEventListener('close', () => {
        if (cancelled) return;
        setIsSocketConnected(false);
        hasRegisteredRef.current = false;
        clearReconnect();
        reconnectTimerRef.current = setTimeout(connect, 1000);
      });

      // ΞΟ„Ξ±Ξ½ Ο€Ξ±ΟΞΏΟ…ΟƒΞΉΞ±ΟƒΟ„ΞµΞ― ΟƒΟ†Ξ¬Ξ»ΞΌΞ± ΟƒΟ„Ξ· ΟƒΟΞ½Ξ΄ΞµΟƒΞ· WebSocket
      ws.addEventListener('error', () => {
        if (!cancelled) setIsSocketConnected(false);
      });
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      const ws = wsRef.current;
      wsRef.current = null;
      hasRegisteredRef.current = false;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [isScreen, isStudent]);

  useEffect(() => {
    if (!isSocketConnected) return;

    if (isStudent) {
      sendSocketMessage({ type: 'register_student', name: studentName, color: studentColor });
    } else if (isScreen) {
      sendSocketMessage({ type: 'register_teacher', name: 'Screen' });
    } else {
      sendSocketMessage({ type: 'register_teacher', name: studentName || 'Teacher' });
    }
  }, [isScreen, isSocketConnected, isStudent, studentColor, studentName]);

  useEffect(() => {
    if (!isStudent || !isSocketConnected) return;
    if (suppressNextStudentStateSendRef.current) {
      suppressNextStudentStateSendRef.current = false;
      return;
    }

    const payload = {
      type: 'student_state',
      state: {
        weights: { w1: dynamicW1, w2: dynamicW2 },
        inputs: { i1: studentInputs.i1, i2: studentInputs.i2 },
        products: { p1: studentProducts.p1, p2: studentProducts.p2 },
        total: studentTotal
      }
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSentStudentStateRef.current) {
      return;
    }

    lastSentStudentStateRef.current = serialized;
    sendSocketMessage(payload);
  }, [dynamicW1, dynamicW2, studentInputs.i1, studentInputs.i2, studentProducts.p1, studentProducts.p2, studentTotal, isSocketConnected, isStudent]);

  useEffect(() => {
    if (!isTeacher || !isSocketConnected) return;
    const lessonInputsPayload = {
      i1: currentExampleData.i1,
      i2: currentExampleData.i2
    };

    sendSocketMessage({
      type: 'teacher_lesson',
      lesson: {
        activityId: selectedActivity,
        activityTitle: teacherActivityTitle,
        dataset: currentDataset,
        exampleIndex: currentExample,
        exampleName: currentExampleData.name,
        icon: currentExampleData.icon,
        inputs: lessonInputsPayload,
        weights: {
          w1: dynamicW1,
          w2: dynamicW2
        },
        selectedInputs,
        threshold: teacherThresholdRule,
        linearDemoIndex: currentLinearDemoIndex
      }
    });
  }, [
    isTeacher,
    isSocketConnected,
    selectedActivity,
    teacherActivityTitle,
    currentDataset,
    currentExample,
    currentExampleData.name,
    currentExampleData.icon,
    dynamicW1,
    dynamicW2,
    teacherThresholdRule.op,
    teacherThresholdRule.boundary,
    currentLinearDemoIndex,
    selectedInputs.i1,
    selectedInputs.i2
  ]);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    const activityChanged = prevTeacherActivityRef.current !== selectedActivity;

    if (selectedActivity === '1') {
      // Activity 1: Inputs always empty for teacher to provide
      setTeacherInputs({ i1: '', i2: '' });
      setStudentInputs({ i1: '', i2: '' });
      // Reset linear demo to disabled state
      setCurrentLinearDemoIndex(undefined);
    }

    if (selectedActivity === '2') {
      // Auto-fill inputs from example
      setTeacherInputs({ i1: currentExampleData.i1, i2: currentExampleData.i2 });
      setTeacherProducts({ p1: '', p2: '' });
      setTeacherTotal('');
      setStudentProducts({ p1: '', p2: '' });
      setStudentTotal('');
      setStudentInputs({ i1: '', i2: '' });
      // Reset linear demo to disabled state
      setCurrentLinearDemoIndex(undefined);
    }

    if (selectedActivity === '3') {
      // Auto-fill inputs from example for weight adjustment activity
      setTeacherInputs({ i1: currentExampleData.i1, i2: currentExampleData.i2 });
      if (activityChanged) {
        setDynamicW1('');
        setDynamicW2('');
      }
      // Reset linear demo to disabled state
      setCurrentLinearDemoIndex(undefined);
    }

    if (selectedActivity === '4') {
      // Auto-fill inputs from example for threshold activity
      setTeacherInputs({ i1: currentExampleData.i1, i2: currentExampleData.i2 });
      if (activityChanged) {
        setDynamicW1('');
        setDynamicW2('');
      }
      // Auto-select first linear_demo for threshold activity
      setCurrentLinearDemoIndex(0);
    }

    if (selectedActivity !== '3' && selectedActivity !== '4') {
      setDynamicW1((prev) => (prev === '' ? 2 : prev));
      setDynamicW2((prev) => (prev === '' ? 3 : prev));
    }

    prevTeacherActivityRef.current = selectedActivity;
  }, [isTeacher, selectedActivity, currentExampleData.i1, currentExampleData.i2]);

  useEffect(() => {
    if (!isStudent) {
      return;
    }

    if (lessonActivity === '2') {
      setStudentProducts({ p1: '', p2: '' });
      setStudentTotal('');
    }

    if (lessonActivity === '3' || lessonActivity === '4') {
      setDynamicW1('');
      setDynamicW2('');
    }
  }, [isStudent, lessonActivity, lessonExampleIndex]);

  const sortedParticipants = [...participants].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  return (
    <TeacherCard title={heroTitle}>
      {isScreen && (
        <>
          <div className="screen-top-bar">
            <strong>Ξ ΟΞΏΞ²ΞΏΞ»Ξ® Ο„Ξ¬ΞΎΞ·Ο‚</strong>
            <span>{DATASETS[safeDisplayDataset].emoji} {DATASETS[safeDisplayDataset].label}</span>
            <span>{displayIcon} {displayName}</span>
            <span>i1={i1}, i2={i2}</span>
            <span>w1={currentW1}, w2={currentW2}</span>
            <span>o={total}</span>
          </div>
          <div className="operation-tree" aria-label="Ξ”Ξ­Ξ½Ο„ΟΞΏ Ο€ΟΞ¬ΞΎΞµΟ‰Ξ½">
            <div className="tree-level">
              <div className="tree-node tree-root">o = {total}</div>
            </div>
            <div className="tree-connect"></div>
            <div className="tree-level tree-two">
              <div className="tree-node">w1 Γ— i1 = {prod1}</div>
              <div className="tree-node">w2 Γ— i2 = {prod2}</div>
            </div>
          </div>
        </>
      )}

      <div className="common-zone">
        <CommonZoneFullscreenButton />
        <VerticalProducts
          icon={displayIcon}
          demoIcon={demoIcon}
          demoLabel={demoLabel}
          features={DATASETS[safeDisplayDataset].features}
          prod1={displayedProd1}
          prod2={displayedProd2}
          w1={currentW1}
          w2={currentW2}
          i1={i1}
          i2={i2}
          total={displayedTotal}
          showInput1={showInput1}
          showInput2={showInput2}
          showTotal={showTotalRow}
          editWeights={isWeightEditable}
          onWeightChange={handleWeightChange}
          threshold={threshold}
          studentAnswerMode={false}
          studentAnswer=""
          onStudentAnswerChange={null}
          inputEditable={isInputEditable}
          productEditable={isProductEditable}
          totalEditable={isTotalEditable}
          totalValue={isTeacher ? teacherTotal : studentTotal}
          onInputChange={(field, value) => {
            if (isTeacher) {
              setTeacherInputs((prev) => ({ ...prev, [field]: value }));
            } else if (isStudent) {
              setStudentInputs((prev) => ({ ...prev, [field]: value }));
            }
          }}
          onProductChange={(field, value) => {
            if (isTeacher) {
              setTeacherProducts((prev) => ({ ...prev, [field]: value }));
            } else if (isStudent) {
              setStudentProducts((prev) => ({ ...prev, [field]: value }));
            }
          }}
          onTotalChange={(value) => {
            if (isTeacher) {
              setTeacherTotal(value);
            } else if (isStudent) {
              setStudentTotal(value);
            }
          }}
          showThreshold={isThresholdVisible}
          thresholdValue={demoFooterText}
          showThresholdUnderIcon={showThresholdUnderIcon}
        />
      </div>
        
      {(isTeacher || isScreen || isStudent) && (
        <div className="live-table-wrap">
          <ExamplesClassifier
            datasets={DATASETS}
            currentDataset={safeDisplayDataset}
            currentLinearDemoIndex={effectiveLinearDemoIndex}
            activityId={activeActivity}
            selectedInputs={effectiveSelectedInputs}
            features={DATASETS[safeDisplayDataset].features}
            weights={{ w1: currentW1, w2: currentW2 }}
          />
        </div>
      )}

      {(isTeacher || isScreen) && (
        <div className="live-table-wrap">
          <StudentTable
            i1={lessonInputs.i1}
            i2={lessonInputs.i2}
            selectedInputs={lessonSelectedInputs}
            features={DATASETS[safeDisplayDataset].features}
            threshold={effectiveThresholdRule}
            participants={sortedParticipants}
            activity={lessonActivity}
          />
        </div>
      )}

      {isTeacher && (
        <>

          <ActivitiesMenu
            title="Ξ”ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„ΞµΟ‚"
            icon="π”¬"
            label="Ξ•Ο€ΞΉΞ»ΞΏΞ³Ξ® Ξ΄ΟΞ±ΟƒΟ„Ξ·ΟΞΉΟΟ„Ξ·Ο„Ξ±Ο‚"
            options={NEURAL_ACTIVITY_OPTIONS}
            value={selectedActivity}
            onChange={setSelectedActivity}
          />

          <DatasetSelector
            datasets={DATASETS}
            currentDataset={currentDataset}
            currentExample={currentExample}
            currentLinearDemoIndex={currentLinearDemoIndex}
            selectedInputs={selectedInputs}
            features={DATASETS[safeDisplayDataset].features}
            onDatasetChange={(dataset) => {
              const nextExampleData = DATASETS[dataset]?.examples?.[0];
              setCurrentDataset(dataset);
              setCurrentExample(0);
              setCurrentLinearDemoIndex(0);

              if (nextExampleData) {
                sendTeacherLessonPatch({
                  dataset,
                  exampleIndex: 0,
                  exampleName: nextExampleData.name,
                  icon: nextExampleData.icon,
                  inputs: {
                    i1: nextExampleData.i1,
                    i2: nextExampleData.i2
                  },
                  linearDemoIndex: 0
                });
              } else {
                sendTeacherLessonPatch({ dataset });
              }
            }}
            onExampleChange={setCurrentExample}
            onLinearDemoChange={setCurrentLinearDemoIndex}
            onSelectedInputsChange={(next) => {
              const normalized = normalizeSelectedInputs(next);
              setSelectedInputs(normalized);
              sendTeacherLessonPatch({ selectedInputs: normalized });
            }}
            isLinearDemoDisabled={['1', '2', '3'].includes(selectedActivity)}
            demoIconWhenDisabled="?"
          />

          <StudentQrAccordion
            qrSrc="/labs/neural-lab/media/neural_lab_student_qrcode.png"
            alt="QR code Ξ³ΞΉΞ± Ο„ΞΏ Neural Lab student link"
          />
          
        </>
      )}

      
      
    </TeacherCard>
  );
};

export default App;

