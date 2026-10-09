import React from 'react';
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

function App() {
  const { t } = useTranslation(['common', 'menu']);
  const location = useLocation();
  const pathname = String(location?.pathname || '').toLowerCase();
  const isTeacherContext = pathname === '/teacher' || pathname.endsWith('/teacher') || pathname.startsWith('/teacher/');

  return (
    <div className="client-shell">
      <header className="client-topbar">
        <nav className="client-topbar-nav" aria-label={t('mainNavigation', { ns: 'menu' })}>
          <Link className="client-home-link" to="/">{t('home')}</Link>
          <Link className="client-nav-link" to="/teacher">{t('teacher')}</Link>
          <Link className="client-nav-link" to="/client">{t('student')}</Link>
          <Link className="client-nav-link" to="/tools">{t('tools', { ns: 'menu' })}</Link>
          <Link className="client-nav-link" to="/tools/activity-builder">{t('activityBuilder', { ns: 'menu' })}</Link>
          <Link className="client-nav-link" to="/tools/camera-speed-test">{t('cameraSpeedTest', { ns: 'menu' })}</Link>
          <Link className="client-nav-link" to="/tools/geogebra-collab">{t('geoGebraCollab', { ns: 'menu' })}</Link>
          <Link className="client-nav-link" to="/tools/geogebra-monitor">{t('geoGebraMonitor', { ns: 'menu' })}</Link>
          <Link className="client-nav-link" to="/tools/console">{t('console', { ns: 'menu' })}</Link>
          <Link className="client-nav-link" to="/tools/linear-separation">{t('linearSeparation', { ns: 'menu' })}</Link>
        </nav>
        <div className="client-topbar-controls">
          <StudentIdentityControl roleLabel={isTeacherContext ? t('teacher') : t('student')} />
          <LanguageSwitcher />
        </div>
      </header>
      <div className="client-content">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/client" element={<StudentPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/activity-builder" element={<ActivityBuilder />} />
          <Route path="/tools/camera-speed-test" element={<CameraSpeedTest />} />
          <Route path="/tools/geogebra-collab" element={<GeoGebraCollabTool />} />
          <Route path="/tools/geogebra-collab-test" element={<GeoGebraCollabTestTool />} />
          <Route path="/tools/geogebra-monitor" element={<GeogebraMonitorTool />} />
          <Route path="/tools/console" element={<ConsoleTool />} />
          <Route path="/tools/linear-seperation" element={<LinearSeparation />} />
          <Route path="/apps-launcher" element={<AppsLauncherPage />} />
          <Route path="/labs/buffon-needle/student" element={<BuffonStudentView />} />
          <Route path="/labs/buffon-needle/teacher" element={<BuffonTeacherView />} />
          <Route path="/labs/neural-lab/student" element={<NeuralStudentView />} />
          <Route path="/labs/neural-lab/teacher" element={<NeuralTeacherView />} />
          <Route path="/labs/primes-lab/student" element={<PrimesStudentView />} />
          <Route path="/labs/primes-lab/teacher" element={<PrimesTeacherView />} />
          <Route path="/labs/polynomial-lab/student" element={<PolynomialStudentView />} />
          <Route path="/labs/polynomial-lab/teacher" element={<PolynomialTeacherView />} />
          <Route path="/labs/linear-systems-lab/student" element={<LinearSystemsStudentView />} />
          <Route path="/labs/linear-systems-lab/teacher" element={<LinearSystemsTeacherView />} />
          <Route path="/labs/identities-lab/student" element={<IdentitiesStudentView />} />
          <Route path="/labs/identities-lab/teacher" element={<IdentitiesTeacherView />} />
          <Route path="/labs/geometry-live/student" element={<GeometryStudentView />} />
          <Route path="/labs/geometry-live/teacher" element={<GeometryTeacherView />} />
          <Route path="/labs/:slug/teacher" element={<LabPage role="teacher" />} />
          <Route path="/labs/:slug/student" element={<LabPage role="student" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

