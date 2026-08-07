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
import LanguageSwitcher from './shared/components/LanguageSwitcher';

function Home() {
  const { t } = useTranslation(['common', 'menu', 'neural']);

  return (
    <div className="app-home">
      <h1>{t('neural.homeTitle')}</h1>
      <p>{t('neural.homeSubtitle')}</p>
      <div className="home-links">
        <Link to="/apps/buffon-needle/teacher">{t('neural.openBuffonTeacher')}</Link>
        <Link to="/apps/buffon-needle/student">{t('neural.openBuffonStudent')}</Link>
        <Link to="/apps/neural-lab/teacher">{t('neural.openTeacher')}</Link>
        <Link to="/apps/neural-lab/student">{t('neural.openStudent')}</Link>
        <Link to="/apps/fourier-lab/teacher">{t('neural.openFourierTeacher')}</Link>
        <Link to="/apps/fourier-lab/student">{t('neural.openFourierStudent')}</Link>
        <Link to="/apps/geometry-live/teacher">{t('neural.openGeometryTeacher')}</Link>
        <Link to="/apps/geometry-live/student">{t('neural.openGeometryStudent')}</Link>
      </div>
    </div>
  );
}

function App() {
  const { t } = useTranslation(['common', 'menu']);

  return (
    <div className="client-shell">
      <header className="client-topbar">
        <Link className="client-home-link" to="/">{t('menu.home')}</Link>
        <LanguageSwitcher />
      </header>
      <div className="client-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apps/buffon-needle/student" element={<BuffonStudentView />} />
          <Route path="/apps/buffon-needle/teacher" element={<BuffonTeacherView />} />
          <Route path="/apps/neural-lab/student" element={<NeuralStudentView />} />
          <Route path="/apps/neural-lab/teacher" element={<NeuralTeacherView />} />
          <Route path="/apps/fourier-lab/student" element={<FourierStudentView />} />
          <Route path="/apps/fourier-lab/teacher" element={<FourierTeacherView />} />
          <Route path="/apps/geometry-live/student" element={<GeometryStudentView />} />
          <Route path="/apps/geometry-live/teacher" element={<GeometryTeacherView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
