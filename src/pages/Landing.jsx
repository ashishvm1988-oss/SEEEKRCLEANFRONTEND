import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoBlue from '../assets/logo-mark-blue.png';
import logoWhite from '../assets/logo-mark-white.png';
import { categoryIcon } from '../utils/format';

// Public marketing page shown at "/". People who land here don't know what
// Seeekr is yet, so this explains it before ever asking for a login —
// signed-in users skip straight past it to /home.
const CATEGORIES = [
  'Design & Art',
  'Events & Entertainment',
  'Business & Consulting',
  'Health & Wellbeing',
  'Personal Services',
  'Pet Services',
];

export default function Landing() {
  const { user, ready } = useAuth();
  if (ready && user) return <Navigate to="/home" replace />;

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <img src={logoBlue} alt="" className="landing-brand-mark" />
            <span>Seeekr</span>
          </div>
          <Link to="/login" className="btn btn-secondary btn-sm">
            Log in
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <span className="landing-eyebrow">Now live in Chennai &amp; Bangalore</span>
            <h1>
              Find the right person for the job. <span>Every time.</span>
            </h1>
            <p className="landing-sub">
              Seeekr is a peer-to-peer platform that connects customers directly with local service
              providers — photographers, tutors, designers, event planners, and more — so you can find,
              message, and hire someone you trust without the middleman.
            </p>
            <div className="landing-cta-row">
              <Link to="/signup" className="btn btn-primary">
                Get started — it's free
              </Link>
              <Link to="/login" className="btn btn-secondary">
                I already have an account
              </Link>
            </div>
          </div>
          <div className="landing-hero-art">
            <img src={logoWhite} alt="" className="landing-hero-mark" />
          </div>
        </section>

        <section className="landing-categories">
          <p className="landing-section-label">Browse services across categories like</p>
          <div className="landing-chip-row">
            {CATEGORIES.map((c) => (
              <span key={c} className="landing-chip">
                <span aria-hidden="true">{categoryIcon(c)}</span> {c}
              </span>
            ))}
          </div>
        </section>

        <section className="landing-split">
          <div className="landing-card">
            <span className="landing-card-tag">For customers</span>
            <h2>Post what you need, hear back fast</h2>
            <p>
              Search or browse by category, see real ratings from other customers, and message
              providers directly to compare quotes before you decide.
            </p>
          </div>
          <div className="landing-card">
            <span className="landing-card-tag">For service providers</span>
            <h2>Get discovered by people nearby</h2>
            <p>
              Build a profile, showcase your portfolio, and start getting messages from customers
              searching for exactly what you offer — free to list to start.
            </p>
          </div>
        </section>

        <section className="landing-final-cta">
          <h2>Ready to get started?</h2>
          <p>Creating an account takes less than a minute.</p>
          <Link to="/signup" className="btn btn-primary">
            Create your free account
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Seeekr</span>
        <div className="landing-footer-links">
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
