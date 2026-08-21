// import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes } from 'react-router-dom';

export default function HomePage() {
  //const { t } = useTranslation(["common", "menu", "neural"]);
  const entryCards = [
    {
      id: "teacher",
      to: "/teacher",
      icon: "👨‍🏫",
      tone: "indigo",
      title: "Teacher Dashboard",
      description:
        "Εκκίνηση εφαρμογών σε teacher mode και διαχείριση δραστηριοτήτων ανά app.",
      features: [
        "Λίστα εφαρμογών",
        "Αποθήκευση και φόρτωση activities",
        "Παρακολούθηση τάξης",
      ],
    },
    {
      id: "student",
      to: "/client",
      icon: "🧑‍🎓",
      tone: "orange",
      title: "Student Launcher",
      description:
        "Επιλογή app και γρήγορη μετάβαση στο student view μέσα από το SPA shell.",
      features: [
        "Launcher ανά app",
        "Student routes στο React Router",
        "Χωρίς server-rendered dashboards",
      ],
    },
    {
      id: "tools",
      to: "/tools",
      icon: "🧰",
      tone: "green",
      title: "Tools",
      description:
        "Εργαλεία για μάθημα και δοκιμές όπως activity builder και diagnostics.",
      features: ["Activity Builder", "Camera Speed Test", "Linear Seperation"],
    },
  ];

  return (
    <section className="dashboard-page dashboard-page--entry">
      <div className="dashboard-shell">
        <header className="page-hero page-hero--compact">
          <div className="page-hero__logoRow">
            <img
              className="page-hero__logo"
              src="/icons/strobelogo.svg"
              alt="Strobe Logo"
            />
            <h1>
                {/*t("neural.homeTitle")*/}
                neural.homeTitle
            </h1>
          </div>
          <p className="page-hero__lead">
                {/*t("neural.homeSubtitle")*/}
            neural.homeSubtitle
            </p>
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
          <h2>Quick Lab Links</h2>
          <div className="quick-links-grid">
            <Link to="/labs/buffon-needle/teacher">
              {/*t("neural.openBuffonTeacher")*/}
            </Link>
            <Link to="/labs/buffon-needle/student">
              {/*t("neural.openBuffonStudent")*/}
              neural.openBuffonStudent
            </Link>
            <Link to="/labs/neural-lab/teacher">
                {/*t("neural.openTeacher")*/}
            </Link>
            <Link to="/labs/neural-lab/student">
                {/*t("neural.openStudent")*/}
            </Link>
            <Link to="/labs/fourier-lab/teacher">
                {/*t("neural.openFourierTeacher")*/}
            </Link>
            <Link to="/labs/fourier-lab/student">
                {/*t("neural.openFourierStudent")*/}
            </Link>
            <Link to="/labs/geometry-live/teacher">
                {/*t("neural.openGeometryTeacher")*/}
            </Link>
            <Link to="/labs/geometry-live/student">
                {/*t("neural.openGeometryStudent")*/}
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
