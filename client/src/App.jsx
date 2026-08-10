import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import LabPage from './pages/LabPage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import ToolsPage from './pages/ToolsPage';
import ActivityBuilder from './tools/activity-builder/ActivityBuilder';
import CameraSpeedTest from './tools/camera-speed-test/CameraSpeedTest';
import LinearSeperation from './tools/linear-seperation/LinearSeperation';
import LanguageSwitcher from './shared/components/LanguageSwitcher';

function Home() {
  const { t } = useTranslation(['common', 'menu', 'neural']);
  const entryCards = [
    {
      id: 'teacher',
      to: '/teacher',
      icon: '👨‍🏫',
      tone: 'indigo',
      title: 'Teacher Dashboard',
      description: 'Εκκίνηση εφαρμογών σε teacher mode και διαχείριση δραστηριοτήτων ανά app.',
      features: ['Λίστα εφαρμογών', 'Αποθήκευση και φόρτωση activities', 'Παρακολούθηση τάξης']
    },
    {
      id: 'student',
      to: '/client',
      icon: '🧑‍🎓',
      tone: 'orange',
      title: 'Student Launcher',
      description: 'Επιλογή app και γρήγορη μετάβαση στο student view μέσα από το SPA shell.',
      features: ['Launcher ανά app', 'Student routes στο React Router', 'Χωρίς server-rendered dashboards']
    },
    {
      id: 'tools',
      to: '/tools',
      icon: '🧰',
      tone: 'green',
      title: 'Tools',
      description: 'Εργαλεία για μάθημα και δοκιμές όπως activity builder και diagnostics.',
      features: ['Activity Builder', 'Camera Speed Test', 'Linear Seperation']
    }
  ];

  return (
    <section className="dashboard-page dashboard-page--entry">
      <div className="dashboard-shell">
        <header className="page-hero page-hero--compact">
          <div className="page-hero__logoRow">
            <img className="page-hero__logo" src="/icons/strobelogo.svg" alt="Strobe Logo" />
            <h1>{t('neural.homeTitle')}</h1>
          </div>
          <p className="page-hero__lead">{t('neural.homeSubtitle')}</p>
        </header>

        <div className="postit-grid role-grid">
          {entryCards.map((card) => (
            <Link key={card.id} to={card.to} className={`strobe-note strobe-note--${card.tone} dashboard-card-link`}>
              <span className="role-icon">{card.icon}</span>
              <div className="role-title">{card.title}</div>
              <div className="role-description">{card.description}</div>
              <ul className="role-features">
                {card.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        <section className="quick-links-panel">
          <h2>Quick Lab Links</h2>
          <div className="quick-links-grid">
            <Link to="/labs/buffon-needle/teacher">{t('neural.openBuffonTeacher')}</Link>
            <Link to="/labs/buffon-needle/student">{t('neural.openBuffonStudent')}</Link>
            <Link to="/labs/neural-lab/teacher">{t('neural.openTeacher')}</Link>
            <Link to="/labs/neural-lab/student">{t('neural.openStudent')}</Link>
            <Link to="/labs/fourier-lab/teacher">{t('neural.openFourierTeacher')}</Link>
            <Link to="/labs/fourier-lab/student">{t('neural.openFourierStudent')}</Link>
            <Link to="/labs/geometry-live/teacher">{t('neural.openGeometryTeacher')}</Link>
            <Link to="/labs/geometry-live/student">{t('neural.openGeometryStudent')}</Link>
          </div>
        </section>
      </div>
    </section>
  );
}

function App() {
  const { t } = useTranslation(['common', 'menu']);

  return (
    <div className="client-shell">
      <header className="client-topbar">
        <nav className="client-topbar-nav" aria-label="Main navigation">
          <Link className="client-home-link" to="/">{t('menu.home')}</Link>
          <Link className="client-nav-link" to="/teacher">Teacher</Link>
          <Link className="client-nav-link" to="/client">Student</Link>
          <Link className="client-nav-link" to="/tools">Tools</Link>
          <Link className="client-nav-link" to="/tools/activity-builder">Activity Builder</Link>
          <Link className="client-nav-link" to="/tools/camera-speed-test">Camera Speed Test</Link>
          <Link className="client-nav-link" to="/tools/linear-seperation">Linear Seperation</Link>
        </nav>
        <LanguageSwitcher />
      </header>
      <div className="client-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/client" element={<StudentPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/activity-builder" element={<ActivityBuilder />} />
          <Route path="/tools/camera-speed-test" element={<CameraSpeedTest />} />
          <Route path="/tools/linear-seperation" element={<LinearSeperation />} />
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
