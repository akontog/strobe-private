import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { t: tMenu } = useTranslation('menu');
  const { t: tNeural } = useTranslation('neural');
  const entryCards = [
    {
      id: 'teacher',
      to: '/teacher',
      icon: '👩‍🏫',
      tone: 'indigo',
      title: tMenu('teacherDashboard'),
      description: tMenu('teacherDescription'),
      features: [
        tMenu('teacherFeatureApps'),
        tMenu('teacherFeatureActivities'),
        tMenu('teacherFeatureClass')
      ]
    },
    {
      id: 'student',
      to: '/client',
      icon: '🧑‍🎓',
      tone: 'orange',
      title: tMenu('studentLauncher'),
      description: tMenu('studentDescription'),
      features: [
        tMenu('studentFeatureApps'),
        tMenu('studentFeatureRoutes'),
        tMenu('studentFeatureAccess')
      ]
    },
    {
      id: 'tools',
      to: '/tools',
      icon: '🧰',
      tone: 'green',
      title: tMenu('toolsCard'),
      description: tMenu('toolsDescription'),
      features: [
        tMenu('toolsFeatureBuilder'),
        tMenu('toolsFeatureCamera'),
        tMenu('toolsFeatureGeoGebra'),
        tMenu('toolsFeatureSeparation')
      ]
    }
  ];
  const quickLinks = [
    { to: '/labs/buffon-needle/teacher', label: tNeural('openBuffonTeacher') },
    { to: '/labs/buffon-needle/student', label: tNeural('openBuffonStudent') },
    { to: '/labs/neural-lab/teacher', label: tNeural('openTeacher') },
    { to: '/labs/neural-lab/student', label: tNeural('openStudent') },
    { to: '/labs/fourier-lab/teacher', label: tNeural('openFourierTeacher') },
    { to: '/labs/fourier-lab/student', label: tNeural('openFourierStudent') },
    { to: '/labs/geometry-live/teacher', label: tNeural('openGeometryTeacher') },
    { to: '/labs/geometry-live/student', label: tNeural('openGeometryStudent') }
  ];

  return (
    <section className="dashboard-page dashboard-page--entry">
      <div className="dashboard-shell">
        <header className="page-hero page-hero--compact">
          <div className="page-hero__logoRow">
            <img
              className="page-hero__logo"
              src="/icons/strobelogo.svg"
              alt="Strobe"
            />
            <h1>{tNeural('homeTitle')}</h1>
          </div>
          <p className="page-hero__lead">{tNeural('homeSubtitle')}</p>
        </header>

        <div className="postit-grid role-grid">
          {entryCards.map((card) => (
            <Link
              key={card.id}
              to={card.to}
              className={`strobe-note strobe-note--${card.tone} dashboard-card-link`}
            >
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
          <h2>{tMenu('quickLabLinks')}</h2>
          <div className="quick-links-grid">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
