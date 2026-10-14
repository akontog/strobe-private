import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import BuffonStudentView from './workshops/buffon-needle/StudentView';
import BuffonTeacherView from './workshops/buffon-needle/TeacherView';
import NeuralStudentView from './workshops/neural/StudentView';
import NeuralTeacherView from './workshops/neural/TeacherView';
import GeometryStudentView from './workshops/geometry-live/StudentView';
import GeometryTeacherView from './workshops/geometry-live/TeacherView';
import PrimesStudentView from './workshops/primes/StudentView';
import PrimesTeacherView from './workshops/primes/TeacherView';
import PolynomialStudentView from './workshops/polynomial/StudentView';
import PolynomialTeacherView from './workshops/polynomial/TeacherView';
import LinearSystemsStudentView from './workshops/linear-systems/StudentView';
import LinearSystemsTeacherView from './workshops/linear-systems/TeacherView';
import IdentitiesStudentView from './workshops/identities/StudentView';
import IdentitiesTeacherView from './workshops/identities/TeacherView';
import AppsLauncherPage from './pages/AppsLauncherPage';
import HomePage from './pages/HomePage';
import LabPage from './pages/LabPage';
import StudentWaitingPage from './pages/StudentWaitingPage';
import TeacherPage from './pages/TeacherPage';
import ToolsPage from './pages/ToolsPage';
import InstructionsPage from './pages/InstructionsPage';
import ActivityBuilder from './tools/activity-builder/ActivityBuilder';
import CameraSpeedTest from './system/camera-speed-test/CameraSpeedTest';
import GeoGebraCollabTool from './workshops/geogebra-collab/GeoGebraCollabTool';
import GeogebraMonitorTool from './tools/geogebra-monitor/GeogebraMonitorTool';
import LinearSeparation from './tools/linear-separation/LinearSeparation';
import ConsoleTool from './system/console/ConsoleTool';
import StudentIdentityControl from './shared/components/identity/StudentIdentityControl';
import LanguageSwitcher from './shared/components/identity/LanguageSwitcher';
import RoleAccessControl from './shared/components/identity/RoleAccessControl';
import { SessionLogProvider } from './shared/components/activities/SessionLogContext';
import { SettingsAccordion, ChatAccordion, CommonSessionSettings } from './shared/components';

function App() {
  const { t } = useTranslation(['common', 'menu']);
  const { t: tNav } = useTranslation('navigation');
  const location = useLocation();
  const navigate = useNavigate();
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
  const [classroomLab, setClassroomLab] = useState('');
  const [classroomSelectionLoaded, setClassroomSelectionLoaded] = useState(false);

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
    if (!authReady || role !== 'teacher') return undefined;
    const teacherLab = pathname.match(/^\/labs\/([^/]+)\/teacher$/)?.[1]
      || (pathname === '/tools/geogebra-collab' ? 'geogebra-collab' : '');
    const publishSelection = () => fetch('/teacher/classroom/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: teacherLab || null })
      }).catch(() => {});
    publishSelection();
    if (!teacherLab) return undefined;
    const timer = window.setInterval(publishSelection, 5000);
    return () => window.clearInterval(timer);
  }, [authReady, pathname, role]);

  useEffect(() => {
    if (!authReady || role !== 'student') return undefined;
    let cancelled = false;
    let requestInFlight = false;

    const refreshClassroomSelection = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch('/client/classroom/selection', { cache: 'no-store' });
        const payload = response.ok ? await response.json() : null;
        if (!cancelled && payload) {
          setClassroomLab(typeof payload.app === 'string' ? payload.app : '');
          setClassroomSelectionLoaded(true);
        }
      } catch {
        // Continue polling until the teacher's selection is available.
      } finally {
        requestInFlight = false;
      }
    };

    refreshClassroomSelection();
    const timer = window.setInterval(refreshClassroomSelection, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [authReady, role]);

  useEffect(() => {
    if (!authReady || role !== 'student' || !classroomSelectionLoaded) return;
    const labRoute = pathname.match(/^\/labs\/([^/]+)\/(?:student|teacher)$/)?.[1] || '';
    if (classroomLab) {
      const target = classroomLab === 'geogebra-collab'
        ? '/tools/geogebra-collab'
        : `/labs/${classroomLab}/student`;
      if (pathname !== target) navigate(target, { replace: true });
      return;
    }
    if (labRoute || pathname === '/client' || pathname === '/student' || pathname === '/tools/geogebra-collab') {
      navigate('/', { replace: true });
    }
  }, [authReady, classroomLab, classroomSelectionLoaded, navigate, pathname, role]);

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

  useEffect(() => {
    const handleSessionEnded = () => setTeacherSession(null);
    window.addEventListener('strobe:session-ended', handleSessionEnded);
    return () => window.removeEventListener('strobe:session-ended', handleSessionEnded);
  }, []);

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
      await fetch('/teacher/classroom/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: null })
      }).catch(() => {});
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
      if (teacherSession) {
        window.dispatchEvent(new CustomEvent('strobe:session-ended', {
          detail: { sessionId: teacherSession.sessionId }
        }));
      }
    } catch (sessionError) {
      window.alert(sessionError.message || 'Η ενέργεια συνεδρίας απέτυχε.');
    } finally {
      setTeacherSessionBusy(false);
    }
  }

  const teacherOnly = (element) => authReady
    ? (role === 'teacher' ? element : <Navigate to="/client" replace />)
    : null;
  const studentLabOnly = (slug, element) => {
    if (!authReady) return null;
    if (role !== 'student') return element;
    if (!classroomSelectionLoaded) return null;
    if (classroomLab === slug) return element;
    return classroomLab
      ? <Navigate to={classroomLab === 'geogebra-collab' ? '/tools/geogebra-collab' : `/labs/${classroomLab}/student`} replace />
      : <Navigate to="/" replace />;
  };
  const studentToolOnly = (selection, element) => {
    if (!authReady) return null;
    if (role !== 'student') return element;
    if (!classroomSelectionLoaded) return null;
    if (classroomLab === selection) return element;
    return classroomLab
      ? <Navigate to={classroomLab === 'geogebra-collab' ? '/tools/geogebra-collab' : `/labs/${classroomLab}/student`} replace />
      : <Navigate to="/" replace />;
  };
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
  const clickedMenuGroup = role === 'teacher' ? menuGroups[clickedMenu] : null;

  return (
    <SessionLogProvider app={pathname.match(/^\/labs\/([^/]+)/)?.[1]} role={role} sessionId={teacherSession?.sessionId}>
    <div className="client-shell">
      <header className="client-topbar" onMouseLeave={() => setActiveMenu('')}>
        <Link className="client-home-link" to="/" aria-label="Strobe"><img src="/icons/strobelogo.svg" alt="Strobe" /></Link>
        <div className="client-topbar-main">
          <nav className="client-section-nav" aria-label={tNav('sectionNavigation')} onMouseLeave={() => setActiveMenu('')}>
            {Object.entries(menuGroups).map(([key, group]) => {
              if (role !== 'teacher') return null;
              return (
                <div
                  key={key}
                  className="client-section-nav-item"
                  onMouseEnter={() => setActiveMenu(key)}
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
                  >
                    {group.label}
                  </button>
                  {activeMenu === key ? (
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
          <Route index element={role === 'student' ? <StudentWaitingPage /> : <HomePage />} />
          <Route path="/instructions" element={<InstructionsPage />} />
          <Route path="/teacher" element={teacherOnly(<TeacherPage />)} />
          <Route path="/client" element={<StudentWaitingPage />} />
          <Route path="/student" element={<StudentWaitingPage />} />
          <Route path="/tools" element={teacherOnly(<ToolsPage />)} />
          <Route path="/tools/activity-builder" element={teacherOnly(<ActivityBuilder />)} />
          <Route path="/tools/camera-speed-test" element={teacherOnly(<CameraSpeedTest />)} />
          <Route path="/tools/geogebra-collab" element={studentToolOnly('geogebra-collab', <GeoGebraCollabTool />)} />
          <Route path="/tools/geogebra-monitor" element={teacherOnly(<GeogebraMonitorTool />)} />
          <Route path="/tools/console" element={teacherOnly(<ConsoleTool />)} />
          <Route path="/tools/linear-separation" element={teacherOnly(<LinearSeparation />)} />
          <Route path="/tools/linear-seperation" element={teacherOnly(<LinearSeparation />)} />
          <Route path="/apps-launcher" element={teacherOnly(<AppsLauncherPage />)} />
          <Route path="/labs/buffon-needle/student" element={studentLabOnly('buffon-needle', <BuffonStudentView />)} />
          <Route path="/labs/buffon-needle/teacher" element={teacherOnly(<BuffonTeacherView />)} />
          <Route path="/labs/neural-lab/student" element={studentLabOnly('neural-lab', <NeuralStudentView />)} />
          <Route path="/labs/neural-lab/teacher" element={teacherOnly(<NeuralTeacherView />)} />
          <Route path="/labs/primes-lab/student" element={studentLabOnly('primes-lab', <PrimesStudentView />)} />
          <Route path="/labs/primes-lab/teacher" element={teacherOnly(<PrimesTeacherView />)} />
          <Route path="/labs/polynomial-lab/student" element={studentLabOnly('polynomial-lab', <PolynomialStudentView />)} />
          <Route path="/labs/polynomial-lab/teacher" element={teacherOnly(<PolynomialTeacherView />)} />
          <Route path="/labs/linear-systems-lab/student" element={studentLabOnly('linear-systems-lab', <LinearSystemsStudentView />)} />
          <Route path="/labs/linear-systems-lab/teacher" element={teacherOnly(<LinearSystemsTeacherView />)} />
          <Route path="/labs/identities-lab/student" element={studentLabOnly('identities-lab', <IdentitiesStudentView />)} />
          <Route path="/labs/identities-lab/teacher" element={teacherOnly(<IdentitiesTeacherView />)} />
          <Route path="/labs/geometry-live/student" element={studentLabOnly('geometry-live', <GeometryStudentView />)} />
          <Route path="/labs/geometry-live/teacher" element={teacherOnly(<GeometryTeacherView />)} />
          <Route path="/labs/:slug/teacher" element={teacherOnly(<LabPage role="teacher" />)} />
          <Route path="/labs/:slug/student" element={studentLabOnly(currentLabSlug, <LabPage role="student" />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes> : null}
        {pathname.startsWith('/labs/') && !labHasInlineChat ? <ChatAccordion /> : null}
      </div>
    </div>
    </SessionLogProvider>
  );
}

export default App;
