import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import BuffonStudentView from './labs/buffon-needle/StudentView';
import BuffonTeacherView from './labs/buffon-needle/TeacherView';
import NeuralStudentView from './labs/neural-lab/StudentView';
import NeuralTeacherView from './labs/neural-lab/TeacherView';
import GeometryStudentView from './labs/geometry-live/StudentView';
import GeometryTeacherView from './labs/geometry-live/TeacherView';
import PrimesStudentView from './labs/primes-lab/StudentView';
import PrimesTeacherView from './labs/primes-lab/TeacherView';
import PolynomialStudentView from './labs/polynomial-lab/StudentView';
import PolynomialTeacherView from './labs/polynomial-lab/TeacherView';
import LinearSystemsStudentView from './labs/linear-systems-lab/StudentView';
import LinearSystemsTeacherView from './labs/linear-systems-lab/TeacherView';
import IdentitiesStudentView from './labs/identities-lab/StudentView';
import IdentitiesTeacherView from './labs/identities-lab/TeacherView';
import AppsLauncherPage from './pages/AppsLauncherPage';
import HomePage from './pages/HomePage';
import LabPage from './pages/LabPage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import ToolsPage from './pages/ToolsPage';
import StudentScoresPage from './pages/StudentScoresPage';
import InstructionsPage from './pages/InstructionsPage';
import ActivityBuilder from './tools/activity-builder/ActivityBuilder';
import CameraSpeedTest from './tools/camera-speed-test/CameraSpeedTest';
import GeoGebraCollabTool from './tools/geogebra-collab/GeoGebraCollabTool';
import GeoGebraCollabTestTool from './tools/geogebra-collab-test/GeoGebraCollabTestTool';
import GeogebraMonitorTool from './tools/geogebra-monitor/GeogebraMonitorTool';
import LinearSeparation from './tools/linear-separation/LinearSeparation';
import ConsoleTool from './tools/console/ConsoleTool';
import StudentIdentityControl from './shared/components/identity/StudentIdentityControl';
import LanguageSwitcher from './shared/components/identity/LanguageSwitcher';
import RoleAccessControl from './shared/components/identity/RoleAccessControl';
import { SessionLogProvider } from './shared/components/activities/SessionLogContext';
import { SettingsAccordion, ChatAccordion, CommonSessionSettings } from './shared/components';

function App() {
  const { t } = useTranslation(['common', 'menu']);
  const { t: tNav } = useTranslation('navigation');
  const location = useLocation();
  const pathname = String(location?.pathname || '').toLowerCase();
  const currentLabSlug = pathname.match(/^\/labs\/([^/]+)/)?.[1] || '';
  const labHasOwnSettings = ['polynomial-lab', 'linear-systems-lab', 'neural-lab', 'identities-lab'].includes(currentLabSlug);
  const labHasInlineChat = ['polynomial-lab', 'neural-lab', 'buffon-needle'].includes(currentLabSlug);
  const [role, setRole] = useState('student');
  const [authReady, setAuthReady] = useState(false);
  const [teacherUsername, setTeacherUsername] = useState('');
  const [activeMenu, setActiveMenu] = useState('');
  const [clickedMenu, setClickedMenu] = useState('');
  const [serverConnected, setServerConnected] = useState(false);
  const [teacherSession, setTeacherSession] = useState(null);
  const [teacherSessionBusy, setTeacherSessionBusy] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session').then((response) => response.json()).then((session) => {
      setRole(session.role === 'teacher' ? 'teacher' : 'student');
      setTeacherUsername(session.username || '');
      setAuthReady(true);
    }).catch(() => {
      setRole('student');
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    let active = true;
    async function checkServer() {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (active) setServerConnected(false);
        return;
      }
      try {
        const response = await fetch('/health', { cache: 'no-store' });
        if (active) setServerConnected(response.ok);
      } catch {
        if (active) setServerConnected(false);
      }
    }
    checkServer();
    const timer = window.setInterval(checkServer, 30000);
    window.addEventListener('online', checkServer);
    window.addEventListener('offline', checkServer);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('online', checkServer);
      window.removeEventListener('offline', checkServer);
    };
  }, []);

  useEffect(() => {
    setClickedMenu('');
    setActiveMenu('');
  }, [pathname]);

  async function loginTeacher(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();
      if (!response.ok) return { error: tNav('loginFailed') };
      setRole('teacher');
      setTeacherUsername(result.username);
      return { ok: true };
    } catch {
      return { error: tNav('loginFailed') };
    }
  }

  async function changeRole(nextRole) {
    if (nextRole === 'student') {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      setRole('student');
      setTeacherUsername('');
    }
  }

  async function toggleTeacherSession() {
    setTeacherSessionBusy(true);
    try {
      const labMatch = pathname.match(/^\/labs\/([^/]+)\//);
      const app = labMatch ? labMatch[1] : 'geometry-live';
      const endpoint = teacherSession
        ? `/teacher/sessions/${encodeURIComponent(teacherSession.sessionId)}/end`
        : '/teacher/sessions';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(!teacherSession ? { body: JSON.stringify({ app }) } : {})
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Η ενέργεια συνεδρίας απέτυχε.');
      setTeacherSession(teacherSession ? null : payload);
    } catch (sessionError) {
      window.alert(sessionError.message || 'Η ενέργεια συνεδρίας απέτυχε.');
    } finally {
      setTeacherSessionBusy(false);
    }
  }

  const teacherOnly = (element) => authReady
    ? (role === 'teacher' ? element : <Navigate to="/client" replace />)
    : null;
  const menuGroups = {
    labs: { label: tNav('labs'), items: [
      { label: tNav('items.buffon'), path: '/labs/buffon-needle' },
      { label: tNav('items.identities'), path: '/labs/identities-lab' },
      { label: tNav('items.neural'), path: '/labs/neural-lab' },
      { label: tNav('items.polynomial'), path: '/labs/polynomial-lab' },
      { label: tNav('items.primes'), path: '/labs/primes-lab' },
      { label: tNav('items.geogebra'), path: '/tools/geogebra-collab' }
    ] },
    system: { label: tNav('system'), items: [
      { label: tNav('items.camera'), path: '/tools/camera-speed-test' },
      { label: tNav('items.console'), path: '/tools/console' },
      { label: tNav('items.scores'), path: '/tools/student-scores' }
    ] },
    tools: { label: tNav('tools'), items: [
      { label: tNav('items.separation'), path: '/tools/linear-separation' },
      { label: tNav('items.monitor'), path: '/tools/geogebra-monitor' },
      { label: tNav('items.builder'), path: '/tools/activity-builder' }
    ] },
    help: { label: tNav('help'), items: [
      { label: tNav('items.instructions'), path: '/instructions' }
    ] }
  };
  const clickedMenuGroup = clickedMenu === 'labs' || clickedMenu === 'help' || role === 'teacher' ? menuGroups[clickedMenu] : null;

  return (
    <SessionLogProvider app={pathname.match(/^\/labs\/([^/]+)/)?.[1]} role={role} sessionId={teacherSession?.sessionId}>
    <div className="client-shell">
      <header className="client-topbar" onMouseLeave={() => setActiveMenu('')}>
        <Link className="client-home-link" to="/" aria-label="Strobe"><img src="/icons/strobelogo.svg" alt="Strobe" /></Link>
        <div className="client-topbar-main">
          <nav className="client-section-nav" aria-label={tNav('sectionNavigation')} onMouseLeave={() => setActiveMenu('')}>
            {Object.entries(menuGroups).map(([key, group]) => {
              const hiddenForStudent = role !== 'teacher' && key !== 'labs' && key !== 'help';
              return (
                <div
                  key={key}
                  className={`client-section-nav-item ${hiddenForStudent ? 'is-menu-hidden' : ''}`}
                  onMouseEnter={() => { if (!hiddenForStudent) setActiveMenu(key); }}
                >
                  <button
                    type="button"
                    className={`client-section-button ${activeMenu === key ? 'active' : ''}`}
                    onClick={() => {
                      setClickedMenu(key);
                      setActiveMenu(key);
                    }}
                    aria-expanded={activeMenu === key}
                    aria-haspopup="true"
                    tabIndex={hiddenForStudent ? -1 : 0}
                    disabled={hiddenForStudent}
                  >
                    {group.label}
                  </button>
                  {activeMenu === key && !hiddenForStudent ? (
                    <nav className="client-submenu" aria-label={group.label}>
                      {group.items.map((item) => (
                        <Link
                          key={item.path}
                          className="client-submenu__item"
                          to={item.path.startsWith('/labs/') ? `${item.path}/${role === 'teacher' ? 'teacher' : 'student'}` : item.path}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="client-topbar-controls">
          <StudentIdentityControl
            roleLabel={role === 'teacher' ? t('teacher') : t('student')}
            hideIdentityFields={role === 'teacher'}
            roleControl={<RoleAccessControl role={role} username={teacherUsername} connected={serverConnected} onLogin={loginTeacher} onRoleChange={changeRole} labels={{ teacher: t('teacher'), student: t('student'), username: t('username'), password: tNav('password'), login: tNav('login'), connected: tNav('connected'), disconnected: tNav('disconnected') }} />}
          />
          <LanguageSwitcher sessionControl={role === 'teacher' ? (
            <button type="button" className="locale-session-button" onClick={toggleTeacherSession} disabled={teacherSessionBusy}>
              {teacherSessionBusy ? '…' : teacherSession ? t('common:endSession') : t('common:startSession')}
            </button>
          ) : null} />
        </div>
      </header>
      <div className="client-content">
        {pathname.startsWith('/labs/') && role === 'teacher' && !labHasOwnSettings ? <SettingsAccordion><CommonSessionSettings /></SettingsAccordion> : null}
        {clickedMenuGroup ? (
          <section className="client-menu-cards" aria-label={clickedMenuGroup.label}>
            <div className="postit-grid">
              {clickedMenuGroup.items.map((item, index) => {
                const to = item.path.startsWith('/labs/')
                  ? `${item.path}/${role === 'teacher' ? 'teacher' : 'student'}`
                  : item.path;
                const colors = ['blue', 'violet', 'orange', 'green', 'amber', 'indigo'];
                return (
                  <Link
                    key={item.path}
                    className={`strobe-note strobe-note--${colors[index % colors.length]} client-menu-card`}
                    to={to}
                  >
                    <span className="app-title">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
        {!clickedMenuGroup ? <Routes>
          <Route index element={<HomePage />} />
          <Route path="/instructions" element={<InstructionsPage />} />
          <Route path="/teacher" element={teacherOnly(<TeacherPage />)} />
          <Route path="/client" element={<StudentPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/tools" element={teacherOnly(<ToolsPage />)} />
          <Route path="/tools/activity-builder" element={teacherOnly(<ActivityBuilder />)} />
          <Route path="/tools/camera-speed-test" element={teacherOnly(<CameraSpeedTest />)} />
          <Route path="/tools/geogebra-collab" element={<GeoGebraCollabTool />} />
          <Route path="/tools/geogebra-collab-test" element={teacherOnly(<GeoGebraCollabTestTool />)} />
          <Route path="/tools/geogebra-monitor" element={teacherOnly(<GeogebraMonitorTool />)} />
          <Route path="/tools/console" element={teacherOnly(<ConsoleTool />)} />
          <Route path="/tools/student-scores" element={teacherOnly(<StudentScoresPage />)} />
          <Route path="/tools/linear-separation" element={teacherOnly(<LinearSeparation />)} />
          <Route path="/tools/linear-seperation" element={teacherOnly(<LinearSeparation />)} />
          <Route path="/apps-launcher" element={<AppsLauncherPage />} />
          <Route path="/labs/buffon-needle/student" element={<BuffonStudentView />} />
          <Route path="/labs/buffon-needle/teacher" element={teacherOnly(<BuffonTeacherView />)} />
          <Route path="/labs/neural-lab/student" element={<NeuralStudentView />} />
          <Route path="/labs/neural-lab/teacher" element={teacherOnly(<NeuralTeacherView />)} />
          <Route path="/labs/primes-lab/student" element={<PrimesStudentView />} />
          <Route path="/labs/primes-lab/teacher" element={teacherOnly(<PrimesTeacherView />)} />
          <Route path="/labs/polynomial-lab/student" element={<PolynomialStudentView />} />
          <Route path="/labs/polynomial-lab/teacher" element={teacherOnly(<PolynomialTeacherView />)} />
          <Route path="/labs/linear-systems-lab/student" element={<LinearSystemsStudentView />} />
          <Route path="/labs/linear-systems-lab/teacher" element={teacherOnly(<LinearSystemsTeacherView />)} />
          <Route path="/labs/identities-lab/student" element={<IdentitiesStudentView />} />
          <Route path="/labs/identities-lab/teacher" element={teacherOnly(<IdentitiesTeacherView />)} />
          <Route path="/labs/geometry-live/student" element={<GeometryStudentView />} />
          <Route path="/labs/geometry-live/teacher" element={teacherOnly(<GeometryTeacherView />)} />
          <Route path="/labs/:slug/teacher" element={teacherOnly(<LabPage role="teacher" />)} />
          <Route path="/labs/:slug/student" element={<LabPage role="student" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes> : null}
        {pathname.startsWith('/labs/') && !labHasInlineChat ? <ChatAccordion /> : null}
      </div>
    </div>
    </SessionLogProvider>
  );
}

export default App;
