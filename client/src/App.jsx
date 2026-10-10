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

function App() {
  const { t } = useTranslation(['common', 'menu']);
  const { t: tNav } = useTranslation('navigation');
  const location = useLocation();
  const pathname = String(location?.pathname || '').toLowerCase();
  const [role, setRole] = useState('student');
  const [authReady, setAuthReady] = useState(false);
  const [teacherUsername, setTeacherUsername] = useState('');
  const [activeMenu, setActiveMenu] = useState('');
  const [serverConnected, setServerConnected] = useState(false);

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
    if (pathname.startsWith('/tools/')) {
      setActiveMenu(pathname.includes('camera-speed-test') || pathname.includes('/console') ? 'system' : 'tools');
    } else if (pathname.startsWith('/labs/')) {
      setActiveMenu('labs');
    } else {
      setActiveMenu('');
    }
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
      { label: tNav('items.console'), path: '/tools/console' }
    ] },
    tools: { label: tNav('tools'), items: [
      { label: tNav('items.separation'), path: '/tools/linear-separation' },
      { label: tNav('items.monitor'), path: '/tools/geogebra-monitor' },
      { label: tNav('items.builder'), path: '/tools/activity-builder' }
    ] }
  };
  const visibleMenu = activeMenu === 'labs' || role === 'teacher' ? menuGroups[activeMenu] : null;

  return (
    <div className="client-shell">
      <header className="client-topbar">
        <Link className="client-home-link" to="/" aria-label="Strobe"><img src="/icons/strobelogo.svg" alt="Strobe" /></Link>
        <div className="client-topbar-main">
          <nav className="client-section-nav" aria-label={tNav('sectionNavigation')}>
            {Object.entries(menuGroups).map(([key, group]) => {
              const hiddenForStudent = role !== 'teacher' && key !== 'labs';
              return (
                <button key={key} type="button" className={`client-section-button ${activeMenu === key ? 'active' : ''} ${hiddenForStudent ? 'is-menu-hidden' : ''}`} onClick={() => setActiveMenu((current) => current === key ? '' : key)} onMouseEnter={() => { if (!hiddenForStudent) setActiveMenu(key); }} aria-expanded={activeMenu === key} aria-hidden={hiddenForStudent} tabIndex={hiddenForStudent ? -1 : 0} disabled={hiddenForStudent}>{group.label}</button>
              );
            })}
          </nav>
        </div>
        <div className="client-topbar-controls">
          <StudentIdentityControl
            roleLabel={role === 'teacher' ? t('teacher') : t('student')}
            roleControl={<RoleAccessControl role={role} username={teacherUsername} connected={serverConnected} onLogin={loginTeacher} onRoleChange={changeRole} labels={{ teacher: t('teacher'), student: t('student'), username: t('username'), password: tNav('password'), login: tNav('login'), connected: tNav('connected'), disconnected: tNav('disconnected') }} />}
          />
          <LanguageSwitcher />
        </div>
      {visibleMenu ? (
        <nav className="client-submenu" aria-label={visibleMenu.label} onMouseLeave={() => setActiveMenu('')}>
          {visibleMenu.items.map((item) => (
            <Link key={item.path} className="client-submenu__item" to={item.path.startsWith('/labs/') ? `${item.path}/${role === 'teacher' ? 'teacher' : 'student'}` : item.path}>{item.label}</Link>
          ))}
        </nav>
      ) : null}
      </header>
      <div className="client-content">
        <Routes>
          <Route index element={<HomePage />} />
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
        </Routes>
      </div>
    </div>
  );
}

export default App;
