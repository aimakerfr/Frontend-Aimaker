/**
 * Home App - Public landing page
 * COMPLETELY DECOUPLED - Doesn't know about other apps
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@core/auth/useAuth';
import './HomeApp.css';

export default function HomeApp() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      {/* Header */}
      <header className="header">
        <nav className="nav-container">
          <div className="nav-content">
            <div className="nav-logo">
              <div className="logo-icon">
                <span>AI</span>
              </div>
              <span className="logo-text">
                AiMaker<span className="logo-accent">.Method</span>
              </span>
            </div>

            <div className="nav-menu">
              <a href="#vision" className="nav-menu-link">Vision</a>
              <a href="#methode" className="nav-menu-link">Méthode</a>
              <a href="#plan" className="nav-menu-link">Plan d'Action</a>
            </div>

            <div className="nav-actions">
              {isAuthenticated ? (
                <>
                  <span className="user-greeting">Hola, {user?.name}</span>
                  <Link to="/dashboard" className="btn-primary">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="nav-link">
                    Iniciar Sesión
                  </Link>
                  <Link to="/auth/register" className="btn-primary">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">⚡</span>
            <span className="badge-text">Nuevo : Intégration Native Gemini</span>
          </div>

          <h1 className="hero-title">
            {isAuthenticated ? (
              <>
                Bienvenido de nuevo,
                <br />
                <span className="hero-title-accent">{user?.name}!</span>
              </>
            ) : (
              <>
                Pilotez l'IA como un
                <br />
                <span className="hero-title-accent">Directeur Stratégique</span>
              </>
            )}
          </h1>

          <p className="hero-description">
            L'IA n'est pas votre remplaçant, c'est votre apprenti de génie.
            <br />
            Apprenez à lui imposer une discipline pour multiplier votre impact.
          </p>

          <div className="hero-buttons">
            <Link to={isAuthenticated ? "/dashboard" : "/auth/register"} className="btn-hero-primary">
              <span>{isAuthenticated ? 'Continuar mi Parcours' : 'Commencer le Parcours'}</span>
              <span className="btn-arrow">→</span>
            </Link>
            <button className="btn-hero-secondary">
              Voir la Démonstration
            </button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="container">
          <div className="problem-grid">
            <div className="problem-content">
              <h2 className="section-title">
                Cessez d'utiliser l'IA au hasard
              </h2>
              <p className="section-description">
                La plupart des utilisateurs subissent l'IA. Ils obtiennent des résultats lisses, génériques et souvent incohérents sur le long terme.
              </p>

              <div className="problem-list">
                <div className="problem-item">
                  <span className="problem-icon success">✓</span>
                  <div>
                    <h3 className="problem-title">L'Expérience Idéale</h3>
                    <ul className="problem-details">
                      <li>• Un partenaire qui connaît vos nuances</li>
                      <li>• Une production alignée sur vos valeurs</li>
                      <li>• Una mémoire contextuelle parfaite</li>
                    </ul>
                  </div>
                </div>

                <div className="problem-item">
                  <span className="problem-icon warning">⚠</span>
                  <div>
                    <h3 className="problem-title">L'Écueil Classique</h3>
                    <div className="problem-details">
                      <p><strong>Dérive :</strong> L'IA oublie les instructions après 5 messages.</p>
                      <p><strong>Lissage :</strong> Style impersonnel et répétitif.</p>
                      <p><strong>Coût :</strong> Perte de temps à ré-expliquer sans cesse.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="solution-card">
              <div className="solution-content">
                <div className="solution-icon">
                  <span>🧩</span>
                </div>
                <h3 className="solution-title">
                  La solution est structurelle
                </h3>
                <p className="solution-description">
                  Le problème n'est pas la technologie, c'est l'absence de protocole. <strong>AiMaker</strong> est le système d'exploitation de votre collaboration avec l'IA.
                </p>
              </div>

              <button className="solution-button">
                Maîtrisez la méthode, libérez la puissance.
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section id="methode" className="pillars-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title-white">Trois Piliers Stratégiques</h2>
            <p className="section-description-white">
              Nous avons synthétisé des centaines d'heures de recherche en trois principes
              <br />
              d'action radicaux.
            </p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon indigo">
                <span>👥</span>
              </div>
              <h3 className="pillar-title">Profilage Identitaire</h3>
              <p className="pillar-description">
                Transformez une boîte noire en un collaborateur identifié avec une mission claire et une doctrine propre.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon purple">
                <span>⚡</span>
              </div>
              <h3 className="pillar-title">Verrouillage Conceptuel</h3>
              <p className="pillar-description">
                Empêchez l'hallucination et la dérive en ancrant vos définitions dans la mémoire à long terme de l'IA.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon pink">
                <span>🧩</span>
              </div>
              <h3 className="pillar-title">Flux Atomique</h3>
              <p className="pillar-description">
                Définissez la page blanche en travaillant par blocs autonomes assemblés par votre supervision stratégique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="plan" className="roadmap-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Workflow Opérationnel</span>
            <h2 className="section-title">Votre Roadmap en 5 Étapes</h2>
          </div>

          <div className="roadmap-grid">
            <div className="roadmap-steps">
              {[
                { num: 1, title: 'Profiler', subtitle: "La Charte d'Identité", icon: '👥' },
                { num: 2, title: 'Verrouiller', subtitle: 'Ancrage Conceptuel', icon: '⚡' },
                { num: 3, title: 'Structurer', subtitle: 'Ré-Agencement', icon: '🧩' },
                { num: 4, title: 'Co-créer', subtitle: 'Maîtrisez Bloc par Bloc', icon: '💬' },
                { num: 5, title: 'Déployer', subtitle: 'Ecosystème de Contenu', icon: '🚀' }
              ].map((step, index) => (
                <div key={index} className={`roadmap-step ${index === 0 ? 'active' : ''}`}>
                  <div className="step-number">{step.num}</div>
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-subtitle">{step.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="roadmap-detail">
              <div className="detail-header">
                <div className="detail-icon">
                  <span>👥</span>
                </div>
                <div>
                  <h3 className="detail-title">Étape 1</h3>
                  <p className="detail-subtitle">Profiler</p>
                </div>
              </div>

              <p className="detail-quote">
                "Ne laissez pas l'IA être générique. Définissez son rôle, sa mission, son jargon et ses principes fondamentaux."
              </p>

              <div className="detail-actions">
                <div className="actions-header">
                  <span className="actions-icon">⚡</span>
                  <span className="actions-title">Actions de terrain</span>
                </div>
                <ul className="actions-list">
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Définir l'identité & les valeurs</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Établir le corpus doctrinal</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Lister la terminologie interdite/obligatoire</span>
                  </li>
                </ul>
              </div>

              <button className="detail-button">
                <span>Élaborer avec l'Assistant Profiler</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">
                  <span>AI</span>
                </div>
                <span className="footer-logo-text">AiMaker</span>
              </div>
              <p className="footer-description">
                Pionnier de la méthodologie de collaboration Homme-IA. Nous transformons les capacités technologiques en avantages stratégiques.
              </p>
            </div>

            <div className="footer-links">
              <h3 className="footer-title">Ressources</h3>
              <ul className="footer-list">
                <li><a href="#">Framework Complet</a></li>
                <li><a href="#">Études d'Impact</a></li>
                <li><a href="#">Webinaires Privés</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h3 className="footer-title">Accès</h3>
              <ul className="footer-list">
                <li><a href="mailto:contact@aimaker.com">contact@aimaker.com</a></li>
                <li className="footer-location">Bogota • Paris</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 AiMaker. Protocole de collaboration stratégique v3.1</p>
            <div className="footer-legal">
              <a href="#">Mentions Légales</a>
              <a href="#">Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
