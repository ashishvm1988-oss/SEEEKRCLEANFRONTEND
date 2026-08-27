import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';
import { initials } from '../utils/format';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const categoryId = searchParams.get('category_id') || '';
  const subCategoryId = searchParams.get('sub_category_id') || '';

  const [qInput, setQInput] = useState(q);
  const [cityInput, setCityInput] = useState(city);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setQInput(q);
    setCityInput(city);
  }, [q, city]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .searchProviders({ q, city, category_id: categoryId, sub_category_id: subCategoryId, limit: 20 })
      .then((res) => !cancelled && setResults(res.results))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, city, categoryId, subCategoryId]);

  function applyFilters(e) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (qInput.trim()) next.set('q', qInput.trim());
    else next.delete('q');
    if (cityInput.trim()) next.set('city', cityInput.trim());
    else next.delete('city');
    setSearchParams(next);
  }

  return (
    <div className="screen">
      <div className="section-title" style={{ marginTop: 4 }}>Search</div>

      <form onSubmit={applyFilters} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        <div className="search-bar">
          <span>🔍</span>
          <input placeholder="Service or provider name" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        </div>
        <div className="search-bar">
          <span>📍</span>
          <input placeholder="City" value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" type="submit">Search</button>
      </form>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : results.length === 0 ? (
        <EmptyState glyph="🧑‍🔧" title="No matches" subtitle="Try a different keyword, category, or city." />
      ) : (
        results.map((p) => (
          <div key={p.id} className="provider-card" onClick={() => navigate(`/provider/${p.id}`)}>
            <div className="avatar">{initials(p.username)}</div>
            <div className="info">
              <h3>{p.username}</h3>
              <p>{p.about || p.city || 'No description yet'}</p>
              {p.average_rating && <div className="rating-row">⭐ {p.average_rating} ({p.review_count})</div>}
              <div className="chip-row">
                {p.services.slice(0, 3).map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
