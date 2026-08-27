import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';
import { categoryIcon, initials } from '../utils/format';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([api.getCategories(), api.searchProviders({ city: user?.city, limit: 8 })])
      .then(([cats, res]) => {
        if (cancelled) return;
        setCategories(cats);
        setProviders(res.results);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.city]);

  function submitSearch(e) {
    e.preventDefault();
    navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  }

  return (
    <div className="screen">
      <div className="location-pill">📍 {user?.city || 'Location not set'}</div>

      <form className="search-bar" onSubmit={submitSearch} style={{ marginBottom: 20 }}>
        <span>🔍</span>
        <input
          placeholder="Search for a service or provider"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="section-title">Browse categories</div>
          <div className="category-grid">
            {categories.map((cat) => (
              <div key={cat.id} className="category-tile" onClick={() => navigate(`/category/${cat.id}`)}>
                <div className="swatch" style={{ background: cat.color || 'var(--accent)' }}>
                  {categoryIcon(cat.name)}
                </div>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>

          <div className="section-title">
            {user?.city ? `Providers near ${user.city}` : 'Recently listed providers'}
          </div>
          {providers.length === 0 ? (
            <EmptyState glyph="🧑‍🔧" title="No providers listed yet" subtitle="Check back soon, or try another city." />
          ) : (
            providers.map((p) => (
              <div key={p.id} className="provider-card" onClick={() => navigate(`/provider/${p.id}`)}>
                <div className="avatar">{initials(p.username)}</div>
                <div className="info">
                  <h3>{p.username}</h3>
                  <p>{p.about || (p.services[0] ? p.services.join(', ') : p.city)}</p>
                  {p.average_rating && (
                    <div className="rating-row">⭐ {p.average_rating} ({p.review_count})</div>
                  )}
                  <div className="chip-row">
                    {p.services.slice(0, 3).map((s) => (
                      <span key={s} className="chip">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
