import React, { useEffect, useRef } from 'react';
import { CommonZoneFullscreenButton, HeroTitle, StudentQrAccordion } from '../../shared/components';
import { useTranslation } from 'react-i18next';
import { studentTemplate } from './data/student-template';
import { teacherTemplate } from './data/teacher-template';
import { mountBuffonStudent } from './logic/student-logic';
import { mountBuffonTeacher } from './logic/teacher-logic';
import './App.css';

function App({ role = 'teacher' }) {
  const rootRef = useRef(null);
  const { t: tInterface } = useTranslation('interface');
  const { t: tBuffon } = useTranslation('buffon');

  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement) return undefined;

    if (role === 'student') {
      rootElement.innerHTML = studentTemplate;
    } else {
      rootElement.innerHTML = teacherTemplate;
    }

    applyTemplateTranslations(rootElement, role, tBuffon, true);

    const cleanup = role === 'student'
      ? mountBuffonStudent(rootElement, translateBuffon)
      : mountBuffonTeacher(rootElement, translateBuffon);

    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise([rootElement]).catch(() => {});
    }

    return () => {
      if (typeof cleanup === 'function') cleanup();
      rootElement.innerHTML = '';
    };
  }, [role]);

  useEffect(() => {
    if (rootRef.current) applyTemplateTranslations(rootRef.current, role, tBuffon);
  }, [role, tBuffon]);

  return (
    <div className={`lab-shell buffon-app ${role}`}>
      <header className="lab-header">
        <HeroTitle
        title={role === 'student'
          ? tBuffon('studentTitle')
          : tBuffon('teacherTitle')}
        />
      </header>
      <section className="common-zone lab-zone buffon-zone">
        <CommonZoneFullscreenButton />
        <div ref={rootRef} className={`buffon-content ${role}`} />
      </section>
      {role === 'teacher' ? (
        <StudentQrAccordion
          title={tInterface('studentConnection')}
          linkHref="/labs/buffon-needle/student"
          linkLabel={tInterface('openStudentView')}
        />
      ) : null}
    </div>
  );
}

function applyTemplateTranslations(rootElement, role, t, initialize = false) {
  const setText = (selector, key, options) => {
    const element = rootElement.querySelector(selector);
    if (element) element.textContent = t(key, options);
  };

  if (role === 'student') {
    if (initialize) setText('.round-banner', 'student.waiting');
    setText('.vspinner:first-child .lbl', 'student.needleLength');
    setText('.vspinner:last-child .lbl', 'student.lineSpacing');
    setText('.step-col .lbl', 'student.stepLabel');
    const stepCount = Number.parseInt(rootElement.querySelector('#step-val')?.textContent, 10) || 1;
    setText('#step-btn', 'student.stepButton', { count: stepCount });
    setText('.auto-lbl', 'student.automatic');
    setText('.btn-danger', 'student.reset');
    const rangeLabels = rootElement.querySelectorAll('.vspinner .range-labels');
    if (rangeLabels[0]) rangeLabels[0].textContent = '10-120';
    if (rangeLabels[1]) rangeLabels[1].textContent = '30-150';
    setText('[data-accordion-id="student-formula"] .c-lbl', 'student.formula');
    setText('[data-accordion-id="student-chart"] .c-lbl', 'student.chart');

    const footerLabels = rootElement.querySelectorAll('.canvas-footer > span');
    if (footerLabels[0]) footerLabels[0].textContent = t('student.hit');
    if (footerLabels[1]) footerLabels[1].textContent = t('student.miss');

    const statLabels = rootElement.querySelectorAll('.stat-box .s-lbl');
    ['student.estimateError', 'hits', 'misses', 'drops'].forEach((key, index) => {
      if (statLabels[index + 1]) statLabels[index + 1].textContent = t(key);
    });
  } else {
    const labels = rootElement.querySelectorAll('.round-control .lbl');
    if (labels[0]) labels[0].textContent = t('roundDuration');
    if (labels[1]) labels[1].textContent = t('targetError');

    const seconds = t('seconds');
    rootElement.querySelectorAll('.round-control .scale span').forEach((element) => {
      element.textContent = element.textContent.replace(/\s*sec$/, ` ${seconds}`);
    });

    setText('#round-start-btn', 'startRound');
    setText('#round-stop-btn', 'stopRound');
    setText('#round-reset-btn', 'resetScores');
    if (initialize) {
      setText('#round-status', 'initialTeacherStatus');
      setText('#round-info', 'round');
    }
    setText('[data-accordion-id="teacher-live-board"] .c-lbl', 'liveBoard');
    setText('[data-accordion-id="teacher-total-board"] .c-lbl', 'totalBoard');
    setText('[data-accordion-id="teacher-chart"] .c-lbl', 'student.chart');
    rootElement.querySelectorAll('.board-header').forEach((header, index) => {
      const keys = index === 0
        ? ['', 'team', 'estimate', 'error', 'drops', 'hits', 'misses']
        : index === 1
          ? ['', 'team', 'round', 'total']
          : [];
      header.querySelectorAll('span').forEach((span, spanIndex) => {
        if (keys[spanIndex]) span.textContent = t(keys[spanIndex]);
      });
    });
  }
}

function translateBuffon(key, options = {}) {
  return window.StrobeI18n.t(key, { ns: 'buffon', ...options });
}

export default App;

