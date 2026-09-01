import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';
import { initials } from '../utils/format';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const CREDENTIAL_TYPE_LABELS = {
  education: 'Education',
  experience: 'Work experience',
  certification: 'Certification',
  project: 'Past project',
};

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [provider, setProvider] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([api.getProvider(id), api.getPortfolio(id), api.getCredentials(id)])
      .then(([p, images, creds]) => {
        if (cancelled) return;
        setProvider(p);
        setPortfolio(images);
        setCredentials(creds);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <TopBar title="Provider" />
      <div className="screen">
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <Spinner />
        ) : !provider ? (
          <EmptyState glyph="🚫" title="Provider not found" />
        ) : (
          <>
            <div className="profile-hero">
              <div className="avatar">{initials(provider.username)}</div>
              <h2>{provider.username}</h2>
              <div className="sub">{provider.city || 'Location not set'}</div>
              {provider.average_rating && (
                <div className="rating-row">⭐ {provider.average_rating} · {provider.review_count} reviews</div>
              )}
            </div>

            <div className="action-row">
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/chat/${provider.id}`)}
                disabled={String(provider.id) === String(user?.id)}
              >
                💬 Message
              </button>
              {provider.contact && (
                <a className="btn btn-secondary" href={`tel:${provider.contact}`}>
                  📞 Call
                </a>
              )}
            </div>

            <div className="section-title">About</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: -6 }}>
              {provider.about || 'This provider hasn’t added a description yet.'}
            </p>

            {provider.services?.length > 0 && (
              <>
                <div className="section-title">Services</div>
                <div className="chip-row" style={{ marginBottom: 18 }}>
                  {provider.services.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
              </>
            )}

            <div className="section-title">Portfolio</div>
            {portfolio.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No portfolio images yet.</p>
            ) : (
              <div className="portfolio-grid">
                {portfolio.map((img) => (
                  <img
                    key={img.id}
                    src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${img.image_url}`}
                    alt={img.caption || 'Portfolio image'}
                  />
                ))}
              </div>
            )}

            {credentials.length > 0 && (
              <>
                <div className="section-title">Credentials &amp; experience</div>
                {credentials.map((c) => (
                  <div className="credential-card" key={c.id}>
                    <div className="credential-card-top">
                      <div>
                        <span className="credential-type-badge">
                          {CREDENTIAL_TYPE_LABELS[c.type] || c.type}
                        </span>
                        <h4>{c.title}</h4>
                        {c.organization && <p className="org">{c.organization}</p>}
                        {c.period && <p className="period">{c.period}</p>}
                      </div>
                    </div>
                    {c.description && <p className="desc">{c.description}</p>}
                    {c.proof_url && (
                      <a
                        className="proof-link"
                        href={`${API_BASE_URL}${c.proof_url}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View proof ↗
                      </a>
                    )}
                  </div>
                ))}
              </>
            )}

            <p className="disclosure-box">
              Seeekr connects you with independent service providers and does not employ or supervise them
              directly. Please use your own judgment when hiring — Seeekr is not liable for the quality,
              safety, or outcome of services booked through the app.
            </p>
          </>
        )}
      </div>
    </>
  );
}
