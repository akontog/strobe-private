import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import WorkshopView from './workshops/WorkshopView';
import AppsLauncherPage from './pages/AppsLauncherPage';
import HomePage from './pages/HomePage';
import StudentWaitingPage from './pages/StudentWaitingPage';
import TeacherPage from './pages/TeacherPage';
import ToolsPage from './pages/ToolsPage';
import InstructionsPage from './pages/InstructionsPage';
import ActivityRunner from './workshops/activities/ActivityRunner';
import CameraSpeedTest from './system/camera-speed-test/CameraSpeedTest';
import GeoGebraCollabTool from './tools/geogebra-collab/GeoGebraCollabTool';
import AlgebraTilesCollabTool from './tools/algebra-tiles-collab/AlgebraTilesCollabTool';
import NumberLineCollabTool from './tools/number-line-collab/NumberLineCollabTool';
import VennCollabTool from './tools/venn-collab/VennCollabTool';
import OptionsGridCollabTool from './tools/options-grid-collab/OptionsGridCollabTool';
import PlacementBoardCollabTool from './tools/placement-board-collab/PlacementBoardCollabTool';
import InputGridCollabTool from './tools/input-grid-collab/InputGridCollabTool';
import VisionCollabTool from './tools/vision-collab/VisionCollabTool';
import LinearSeparation from './tools/linear-separation/LinearSeparation';
import ConsoleTool from './system/console/ConsoleTool';
import StudentIdentityControl from './shared/components/menu/StudentIdentityControl';
import LanguageSwitcher from './shared/components/menu/LanguageSwitcher';
import RoleAccessControl from './shared/components/menu/RoleAccessControl';
import { SessionLogProvider } from './shared/components/activities/SessionLogContext';
import { SettingsAccordion, ChatAccordion, CommonSessionSettings, StudentQrAccordion } from './shared/components';
import { getAppSlug, getWorkshopPath } from './shared/utils/workshopPaths';

const SESSION_ENABLED_APPS = new Set([
  'activity-runner',
  'geogebra-collab',
  'options-grid-collab',
  'placement-board-collab',
  'input-grid-collab',
  'vision-collab',
  'buffon-needle',
  'neural-lab',
  'primes-lab',
  'polynomial-lab',
  'equations-lab',
  'factorization-lab',
  'probabilities-lab',
  'linear-systems-lab',
  'identities-lab'
]);

function App() {
  const { t } = useTranslation(['common', 'menu']);
  const { t: tNav } = useTranslation('navigation');
  const { t: tInterface } = useTranslation('interface');
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = String(location?.pathname || '').toLowerCase();
  const routePath = pathname.replace(/\/+$/, '') || '/';
  const currentWorkshopSlug = pathname.match(/^\/workshops\/([^/]+)/)?.[1] || '';
  const currentLabSlug = getAppSlug(currentWorkshopSlug);
  const currentSessionApp = routePath.startsWith('/workshops/activities/')
    ? 'activity-runner'
    : ['/tools/geogebra-collab', '/tools/algebra-tiles-collab', '/tools/number-line-collab', '/tools/venn-collab'].includes(routePath) ? 'geogebra-collab'
      : routePath === '/tools/options-grid-collab' ? 'options-grid-collab'
      : routePath === '/tools/placement-board-collab' ? 'placement-board-collab'
      : routePath === '/tools/input-grid-collab' ? 'input-grid-collab'
      : routePath === '/tools/vision-collab' ? 'vision-collab' : currentLabSlug;
  const labHasOwnSettings = pathname.startsWith('/workshops/activities/') || ['polynomial-lab', 'linear-systems-lab', 'neural-lab', 'identities-lab', 'equations-lab', 'factorization-lab', 'probabilities-lab', 'buffon-needle', 'primes-lab'].includes(currentLabSlug);
  const labHasInlineChat = ['polynomial-lab', 'neural-lab', 'buffon-needle'].includes(currentLabSlug);
  const [role, setRole] = useState('student');
  const [roles, setRoles] = useState([]);
  const [authReady, setAuthReady] = useState(false);
  const [teacherUsername, setTeacherUsername] = useState('');
  const [activeMenu, setActiveMenu] = useState('');
  const [clickedMenu, setClickedMenu] = useState('');
  const [serverConnected, setServerConnected] = useState(false);
  const [teacherSession, setTeacherSession] = useState(null);
  const [teacherSessionBusy, setTeacherSessionBusy] = useState(false);
  const [clearActivityOnStart, setClearActivityOnStart] = useState(true);
  const [classroomLab, setClassroomLab] = useState('');
  const [classroomRoomId, setClassroomRoomId] = useState('');
  const [classroomActivity, setClassroomActivity] = useState(null);
  const [classroomSelectionLoaded, setClassroomSelectionLoaded] = useState(false);
  const hasTeacherAccess = ['teacher', 'admin'].includes(role) && roles.includes('teacher');
  const hasAdminAccess = role === 'admin' && roles.includes('admin');
  const appRole = hasTeacherAccess ? 'teacher' : 'student';

  useEffect(() => {
    fetch('/api/auth/session').then((response) => response.json()).then((session) => {
      setRole(['teacher', 'admin'].includes(session.role) ? session.role : 'student');
      setRoles(Array.isArray(session.roles) ? session.roles : []);
      setTeacherUsername(session.username || '');
      setAuthReady(true);
    }).catch(() => {
      setRole('student');
      setRoles([]);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady || !hasTeacherAccess) return undefined;
    const teacherLab = routePath === '/workshops/activities/teacher'
      ? 'activity-runner'
      : getAppSlug(pathname.match(/^\/workshops\/([^/]+)\/teacher$/)?.[1] || '')
      || (routePath === '/tools/geogebra-collab' ? 'geogebra-collab' : '')
      || (routePath === '/tools/algebra-tiles-collab' ? 'algebra-tiles-collab' : '')
      || (routePath === '/tools/number-line-collab' ? 'number-line-collab' : '')
      || (routePath === '/tools/options-grid-collab' ? 'options-grid-collab' : '')
      || (routePath === '/tools/placement-board-collab' ? 'placement-board-collab' : '')
      || (routePath === '/tools/input-grid-collab' ? 'input-grid-collab' : '')
      || (routePath === '/tools/vision-collab' ? 'vision-collab' : '');
    const activeTeacherLab = routePath === '/tools/venn-collab' ? 'geogebra-collab' : teacherLab;
    const preserveSelection = [
      '/instructions',
      '/teacher',
      '/apps-launcher',
      '/tools',
      '/tools/camera-speed-test',
      '/tools/console',
      '/tools/linear-separation',
      '/tools/linear-seperation'
    ].includes(routePath);
    if (!teacherLab && preserveSelection) {
      const preserveClassroomSelection = () => fetch('/teacher/classroom/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preserve: true })
      }).catch(() => {});
      preserveClassroomSelection();
      const timer = window.setInterval(preserveClassroomSelection, 5000);
      return () => window.clearInterval(timer);
    }
    const roomId = ['geogebra-collab', 'algebra-tiles-collab', 'number-line-collab', 'options-grid-collab', 'placement-board-collab', 'input-grid-collab'].includes(activeTeacherLab)
      ? new URLSearchParams(location.search).get('room') || (routePath === '/tools/venn-collab' ? 'venn-default' : ({
        'geogebra-collab': 'geogebra-default',
        'algebra-tiles-collab': 'algebra-tiles-default',
        'number-line-collab': 'number-line-default',
        'options-grid-collab': 'options-grid-default',
        'placement-board-collab': 'placement-board-default',
        'input-grid-collab': 'input-grid-default'
      }[activeTeacherLab]))
      : '';
    const publishSelection = () => fetch('/teacher/classroom/selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: activeTeacherLab || null, roomId })
      }).catch(() => {});
    publishSelection();
    if (!activeTeacherLab) return undefined;
    const timer = window.setInterval(publishSelection, 5000);
    return () => window.clearInterval(timer);
  }, [authReady, hasTeacherAccess, location.search, pathname, routePath]);

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
          setClassroomRoomId(typeof payload.roomId === 'string' ? payload.roomId : '');
          setClassroomActivity(payload.activity && typeof payload.activity === 'object' ? payload.activity : null);
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
    const labRoute = pathname.match(/^\/workshops\/([^/]+)\/(?:student|teacher)$/)?.[1] || '';
    if (classroomLab) {
      const target = classroomLab === 'geogebra-collab'
        ? `${classroomRoomId.startsWith('venn-') ? '/tools/venn-collab' : '/tools/geogebra-collab'}?room=${encodeURIComponent(classroomRoomId || 'geogebra-default')}`
        : classroomLab === 'algebra-tiles-collab'
          ? `/tools/algebra-tiles-collab?room=${encodeURIComponent(classroomRoomId || 'algebra-tiles-default')}`
          : classroomLab === 'number-line-collab'
            ? `/tools/number-line-collab?room=${encodeURIComponent(classroomRoomId || 'number-line-default')}`
          : classroomLab === 'options-grid-collab'
            ? `/tools/options-grid-collab?room=${encodeURIComponent(classroomRoomId || 'options-grid-default')}`
          : classroomLab === 'placement-board-collab'
            ? `/tools/placement-board-collab?room=${encodeURIComponent(classroomRoomId || 'placement-board-default')}`
          : classroomLab === 'input-grid-collab'
            ? `/tools/input-grid-collab?room=${encodeURIComponent(classroomRoomId || 'input-grid-default')}`
          : classroomLab === 'vision-collab'
            ? '/tools/vision-collab'
          : classroomLab === 'activity-runner'
          ? '/workshops/activities/student'
        : getWorkshopPath(classroomLab, 'student');
      if (`${pathname}${location.search}` !== target) navigate(target, { replace: true });
      return;
    }
    if (labRoute || pathname === '/client' || pathname === '/student' || pathname === '/tools/geogebra-collab' || pathname === '/tools/algebra-tiles-collab' || pathname === '/tools/number-line-collab' || pathname === '/tools/venn-collab' || pathname === '/tools/options-grid-collab' || pathname === '/tools/placement-board-collab' || pathname === '/tools/input-grid-collab' || pathname === '/tools/vision-collab') {
      navigate('/', { replace: true });
    }
  }, [authReady, classroomLab, classroomRoomId, classroomSelectionLoaded, location.search, navigate, pathname, role]);

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

  async function loginTeacher(username, password, requestedRole = 'teacher') {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: requestedRole })
      });
      const result = await response.json();
      if (!response.ok) return { error: tNav('loginFailed') };
      setRole(result.role === 'admin' ? 'admin' : 'teacher');
      setRoles(Array.isArray(result.roles) ? result.roles : ['teacher']);
      setTeacherUsername(result.username);
      navigate('/');
      return { ok: true };
    } catch {
      return { error: tNav('loginFailed') };
    }
  }

  async function changeRole(nextRole) {
    if (nextRole === 'student') {
      if (hasTeacherAccess) {
        await fetch('/teacher/classroom/selection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app: null })
        }).catch(() => {});
      }
      await fetch('/api/auth/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'student' })
      }).catch(() => {});
      setRole('student');
      setRoles([]);
      setTeacherUsername('');
      navigate('/');
      return;
    }
    const response = await fetch('/api/auth/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole })
    });
    const result = await response.json();
    if (!response.ok) return;
    setRole(result.role);
    setRoles(Array.isArray(result.roles) ? result.roles : []);
    setTeacherUsername(result.username || '');
  }

  async function toggleTeacherSession() {
    setTeacherSessionBusy(true);
    try {
      const app = currentSessionApp || null;
      if (!teacherSession && clearActivityOnStart) {
        const resetTasks = [];
        window.dispatchEvent(new CustomEvent('strobe:session-starting', {
          detail: {
            clear: true,
            waitUntil: (task) => resetTasks.push(Promise.resolve(task))
          }
        }));
        await Promise.all(resetTasks);
      }
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
    ? (hasTeacherAccess ? element : <Navigate to="/client" replace />)
    : null;
  const adminOnly = (element) => authReady
    ? (hasAdminAccess ? element : <Navigate to={hasTeacherAccess ? '/' : '/client'} replace />)
    : null;
  const studentLabOnly = (slug, element) => {
    if (!authReady) return null;
    if (hasTeacherAccess) {
      const teacherPath = slug === 'activity-runner'
        ? '/workshops/activities/teacher'
        : getWorkshopPath(slug, 'teacher');
      return <Navigate to={teacherPath} replace />;
    }
    if (!classroomSelectionLoaded) return null;
    if (classroomLab === slug) return element;
    return classroomLab
      ? <Navigate to={classroomLab === 'geogebra-collab'
        ? `${classroomRoomId.startsWith('venn-') ? '/tools/venn-collab' : '/tools/geogebra-collab'}?room=${encodeURIComponent(classroomRoomId || 'geogebra-default')}`
        : classroomLab === 'algebra-tiles-collab'
          ? `/tools/algebra-tiles-collab?room=${encodeURIComponent(classroomRoomId || 'algebra-tiles-default')}`
          : classroomLab === 'number-line-collab'
            ? `/tools/number-line-collab?room=${encodeURIComponent(classroomRoomId || 'number-line-default')}`
          : classroomLab === 'options-grid-collab'
            ? `/tools/options-grid-collab?room=${encodeURIComponent(classroomRoomId || 'options-grid-default')}`
          : classroomLab === 'placement-board-collab'
            ? `/tools/placement-board-collab?room=${encodeURIComponent(classroomRoomId || 'placement-board-default')}`
          : classroomLab === 'input-grid-collab'
            ? `/tools/input-grid-collab?room=${encodeURIComponent(classroomRoomId || 'input-grid-default')}`
          : classroomLab === 'vision-collab'
            ? '/tools/vision-collab'
          : getWorkshopPath(classroomLab, 'student')} replace />
      : <Navigate to="/" replace />;
  };
  const studentToolOnly = (selection, element) => {
    if (!authReady) return null;
    if (hasTeacherAccess) return element;
    if (!classroomSelectionLoaded) return null;
    if (classroomLab === selection) return element;
    return classroomLab
      ? <Navigate to={classroomLab === 'geogebra-collab'
        ? `${classroomRoomId.startsWith('venn-') ? '/tools/venn-collab' : '/tools/geogebra-collab'}?room=${encodeURIComponent(classroomRoomId || 'geogebra-default')}`
        : classroomLab === 'algebra-tiles-collab'
          ? `/tools/algebra-tiles-collab?room=${encodeURIComponent(classroomRoomId || 'algebra-tiles-default')}`
          : classroomLab === 'number-line-collab'
            ? `/tools/number-line-collab?room=${encodeURIComponent(classroomRoomId || 'number-line-default')}`
          : classroomLab === 'options-grid-collab'
            ? `/tools/options-grid-collab?room=${encodeURIComponent(classroomRoomId || 'options-grid-default')}`
          : classroomLab === 'placement-board-collab'
            ? `/tools/placement-board-collab?room=${encodeURIComponent(classroomRoomId || 'placement-board-default')}`
          : classroomLab === 'input-grid-collab'
            ? `/tools/input-grid-collab?room=${encodeURIComponent(classroomRoomId || 'input-grid-default')}`
            : classroomLab === 'vision-collab'
              ? '/tools/vision-collab'
          : getWorkshopPath(classroomLab, 'student')} replace />
      : <Navigate to="/" replace />;
  };
  const menuGroups = {
    labs: { label: tNav('labs'), items: [
      { label: tNav('items.buffon'), path: '/workshops/buffon-needle' },
      { label: tNav('items.identities'), path: '/workshops/identities-lab' },
      { label: tNav('items.equations'), path: '/workshops/equations-lab' },
      { label: tNav('items.factorization'), path: '/workshops/factorization-lab' },
      { label: tNav('items.probabilities'), path: '/workshops/probabilities-lab' },
      { label: tNav('items.linearSystems'), path: '/workshops/linear-systems' },
      { label: tNav('items.neural'), path: '/workshops/neural-lab' },
      { label: tNav('items.polynomial'), path: '/workshops/polynomials' },
      { label: tNav('items.primes'), path: '/workshops/primes-lab' }
    ] },
    system: { label: tNav('system'), items: [
      { label: tNav('items.camera'), path: '/tools/camera-speed-test' },
      { label: tNav('items.console'), path: '/tools/console' },
    ] },
    activities: { label: tNav('activities'), items: [
      { label: tNav('items.inputGrid'), path: '/tools/input-grid-collab' },
      { label: tNav('items.optionsGrid'), path: '/tools/options-grid-collab' },
      { label: tNav('items.placementBoard'), path: '/tools/placement-board-collab' },
      { label: tNav('items.venn'), path: '/tools/venn-collab' },
      { label: tNav('items.algebraTiles'), path: '/tools/algebra-tiles-collab' },
      { label: tNav('items.numberLine'), path: '/tools/number-line-collab' },
      { label: tNav('items.geogebra'), path: '/tools/geogebra-collab' },
      { label: tNav('items.vision'), path: '/tools/vision-collab' }
    ] },
    tools: { label: tNav('tools'), items: [
      { label: tNav('items.separation'), path: '/tools/linear-separation' },
    ] },
    help: { label: tNav('help'), items: [
      { label: tNav('items.instructions'), path: '/instructions' }
    ] }
  };
  const clickedMenuGroup = hasTeacherAccess && (clickedMenu !== 'system' || hasAdminAccess)
    ? menuGroups[clickedMenu]
    : null;

  return (
    <SessionLogProvider app={currentSessionApp} role={appRole} sessionId={teacherSession?.sessionId}>
    <div className="client-shell">
      <header className="client-topbar" onMouseLeave={() => setActiveMenu('')}>
        <Link className="client-home-link" to="/" aria-label="Strobe"><img src="/icons/strobelogo.svg" alt="Strobe" /></Link>
        <div className="client-topbar-main">
          <nav className="client-section-nav" aria-label={tNav('sectionNavigation')} onMouseLeave={() => setActiveMenu('')}>
            {Object.entries(menuGroups).map(([key, group]) => {
              if (!hasTeacherAccess || (key === 'system' && !hasAdminAccess)) return null;
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
                          to={item.path.startsWith('/workshops/') ? `${item.path}/${hasTeacherAccess ? 'teacher' : 'student'}` : item.path}
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
            roleLabel={hasAdminAccess ? t('admin') : hasTeacherAccess ? t('teacher') : t('student')}
            hideIdentityFields={hasTeacherAccess}
            roleControl={<RoleAccessControl role={role} roles={roles} username={teacherUsername} connected={serverConnected} onLogin={loginTeacher} onRoleChange={changeRole} labels={{ admin: t('admin'), teacher: t('teacher'), student: t('student'), username: t('username'), password: tNav('password'), login: tNav('login'), connected: tNav('connected'), disconnected: tNav('disconnected') }} />}
          />
          <LanguageSwitcher sessionControl={hasTeacherAccess ? (
            <div className="locale-session-controls">
              {!teacherSession ? (
                <label className="locale-session-clear-option" title={t('common:clearActivityOnStart')}>
                  <input
                    type="checkbox"
                    checked={clearActivityOnStart}
                    onChange={(event) => setClearActivityOnStart(event.target.checked)}
                    disabled={teacherSessionBusy}
                    aria-label={t('common:clearActivityOnStart')}
                  />
                </label>
              ) : null}
              <button
                type="button"
                className="locale-session-button"
                onClick={toggleTeacherSession}
                disabled={teacherSessionBusy || (!teacherSession && !SESSION_ENABLED_APPS.has(currentSessionApp))}
              >
                {teacherSessionBusy ? '…' : teacherSession ? t('common:endSession') : t('common:startSession')}
              </button>
            </div>
          ) : null} />
        </div>
      </header>
      <div className={pathname.startsWith('/workshops/') ? 'client-content workshop-content' : 'client-content'}>
        {pathname.startsWith('/workshops/') && hasTeacherAccess && !labHasOwnSettings ? <SettingsAccordion><CommonSessionSettings /></SettingsAccordion> : null}
        {clickedMenuGroup ? (
          <section className="client-menu-cards" aria-label={clickedMenuGroup.label}>
            <div className="postit-grid">
              {clickedMenuGroup.items.map((item, index) => {
                const to = item.path.startsWith('/workshops/')
                  ? `${item.path}/${hasTeacherAccess ? 'teacher' : 'student'}`
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
          <Route path="/tools/camera-speed-test" element={adminOnly(<CameraSpeedTest />)} />
          <Route path="/tools/geogebra-collab" element={studentToolOnly('geogebra-collab', <GeoGebraCollabTool canSelectRoom={hasTeacherAccess} />)} />
          <Route path="/tools/algebra-tiles-collab" element={studentToolOnly('algebra-tiles-collab', <AlgebraTilesCollabTool role={appRole} />)} />
          <Route path="/tools/number-line-collab" element={studentToolOnly('number-line-collab', <NumberLineCollabTool role={appRole} />)} />
          <Route path="/tools/venn-collab" element={studentToolOnly('geogebra-collab', <VennCollabTool role={appRole} />)} />
          <Route path="/tools/options-grid-collab" element={studentToolOnly('options-grid-collab', <OptionsGridCollabTool role={appRole} />)} />
          <Route path="/tools/placement-board-collab" element={studentToolOnly('placement-board-collab', <PlacementBoardCollabTool role={appRole} />)} />
          <Route path="/tools/input-grid-collab" element={studentToolOnly('input-grid-collab', <InputGridCollabTool role={appRole} />)} />
          <Route path="/tools/vision-collab" element={studentToolOnly('vision-collab', <VisionCollabTool role={appRole} />)} />
          <Route path="/tools/console" element={adminOnly(<ConsoleTool />)} />
          <Route path="/tools/linear-separation" element={teacherOnly(<LinearSeparation />)} />
          <Route path="/tools/linear-seperation" element={teacherOnly(<LinearSeparation />)} />
          <Route path="/apps-launcher" element={teacherOnly(<AppsLauncherPage />)} />
          <Route path="/workshops/:slug" element={<Navigate to={getWorkshopPath(getAppSlug(currentWorkshopSlug), hasTeacherAccess ? 'teacher' : 'student')} replace />} />
          <Route path="/workshops/activities/teacher" element={teacherOnly(<ActivityRunner role="teacher" />)} />
          <Route path="/workshops/activities/student" element={studentLabOnly('activity-runner', <ActivityRunner role="student" activity={classroomActivity} />)} />
          <Route path="/workshops/:slug/teacher" element={teacherOnly(<WorkshopView slug={currentWorkshopSlug} role="teacher" />)} />
          <Route path="/workshops/:slug/student" element={studentLabOnly(currentLabSlug, <WorkshopView slug={currentWorkshopSlug} role="student" />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes> : null}
        {pathname.startsWith('/workshops/') && !labHasInlineChat ? <ChatAccordion /> : null}
        {!clickedMenuGroup && hasTeacherAccess && pathname.startsWith('/workshops/') ? (
          <StudentQrAccordion
            title={tInterface('studentConnection')}
            alt={tInterface('studentQrAlt')}
          />
        ) : null}
      </div>
    </div>
    </SessionLogProvider>
  );
}

export default App;
