import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';

import BuffonStudentView from './labs/buffon-needle/StudentView';
import BuffonTeacherView from './labs/buffon-needle/TeacherView';
import NeuralStudentView from './labs/neural-lab/StudentView';
import NeuralTeacherView from './labs/neural-lab/TeacherView';
import FourierStudentView from './labs/fourier-lab/StudentView';
import FourierTeacherView from './labs/fourier-lab/TeacherView';
import GeometryStudentView from './labs/geometry-live/StudentView';
import GeometryTeacherView from './labs/geometry-live/TeacherView';
import PrimesStudentView from './labs/primes-lab/StudentView';
import PrimesTeacherView from './labs/primes-lab/TeacherView';
import AppsLauncherPage from './pages/AppsLauncherPage';
import HomePage from './pages/HomePage';
import LabPage from './pages/LabPage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import ToolsPage from './pages/ToolsPage';
import ActivityBuilder from './tools/activity-builder/ActivityBuilder';
import CameraSpeedTest from './tools/camera-speed-test/CameraSpeedTest';
import LinearSeparation from './tools/linear-separation/LinearSeparation';
import LanguageSwitcher from './shared/components/LanguageSwitcher';

function App() {
  // const { t } = useTranslation(['common', 'menu']);

  return (
    <div className="client-shell">
      <header className="client-topbar">
        <nav className="client-topbar-nav" aria-label="Main navigation">
          <Link className="client-home-link" to="/">{/*t('menu.home')*/}menu.home</Link>
          <Link className="client-nav-link" to="/teacher">Teacher</Link>
          <Link className="client-nav-link" to="/client">Student</Link>
          <Link className="client-nav-link" to="/tools">Tools</Link>
          <Link className="client-nav-link" to="/tools/activity-builder">Activity Builder</Link>
          <Link className="client-nav-link" to="/tools/camera-speed-test">Camera Speed Test</Link>
          <Link className="client-nav-link" to="/tools/linear-separation">Linear Separation</Link>
        </nav>
        <LanguageSwitcher />
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
          <Route path="/tools/linear-seperation" element={<LinearSeparation />} />
          <Route path="/apps-launcher" element={<AppsLauncherPage />} />
          <Route path="/labs/buffon-needle/student" element={<BuffonStudentView />} />
          <Route path="/labs/buffon-needle/teacher" element={<BuffonTeacherView />} />
          <Route path="/labs/neural-lab/student" element={<NeuralStudentView />} />
          <Route path="/labs/neural-lab/teacher" element={<NeuralTeacherView />} />
          <Route path="/labs/primes-lab/student" element={<PrimesStudentView />} />
          <Route path="/labs/primes-lab/teacher" element={<PrimesTeacherView />} />
          <Route path="/labs/fourier-lab/student" element={<FourierStudentView />} />
          <Route path="/labs/fourier-lab/teacher" element={<FourierTeacherView />} />
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
