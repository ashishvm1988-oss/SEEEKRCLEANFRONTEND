import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';
import { Avatar } from '../components/Avatar';
import { categoryIcon, formatDate, formatTime12h } from '../utils/format';

// Providers land here too, but "browse categories to find someone" is a
// customer-only need in the sense that a provider has no use for shopping
// the catalog they're listed in themselves — except that, per Ashish and
// his co-founders (Oct 12), providers are still customers of OTHER
// categories (a personal trainer still needs an accountant), so category
// browsing stays, just demoted below their own bookings rather than being
// the first thing they see. This is their landing view: booking requests
// (with accept/decline right here, not buried in Account), upcoming
// bookings, and a compact "Categories near you" grid — a short preview with
// a "View all" expand, reusing the same category-grid/tile styling the
// customer Home already uses, rather than a new component.
function ProviderDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null); // null = loading
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState(null); // null = loading
  const [showAllCategories, setShowAllCategories] = useState(false);

  const CATEGORY_PREVIEW_COUNT = 8;

  function loadBookings() {
    return api
      .getMyBookings()
      .then(setBookings)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  async function handleRespond(id, action) {
    setActingId(id);
    setError('');
    try {
      await api.respondToBooking(id, action);
      await loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  const pending = bookings?.as_provider.filter((b) => b.status === 'pending') || [];
  const upcoming = bookings?.as_provider.filter((b) => b.status === 'confirmed') || [];

  return (
    <>
      <div className="section-title">Booking requests</div>
      <ErrorBanner message={error} />
      {bookings === null ? (
        <Spinner />
      ) : pending.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No new requests right now.</p>
      ) : (
        pending.map((b) => (
          <div className="booking-card" key={b.id}>
            <div className="booking-card-top">
              <div>
                <strong>{b.other_user?.username || 'Customer'}</strong>
                <p className="booking-when">
                  {formatDate(b.booking_date)} · {formatTime12h(b.start_time)}
                </p>
              </div>
              <span className="status-pill status-pending">Pending</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={actingId === b.id}
                onClick={() => handleRespond(b.id, 'decline')}
              >
                Decline
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={actingId === b.id}
                onClick={() => handleRespond(b.id, 'confirm')}
              >
                {actingId === b.id ? '…' : 'Accept'}
              </button>
            </div>
          </div>
        ))
      )}

      {upcoming.length > 0 && (
        <>
          <div className="section-title">Upcoming bookings</div>
          {upcoming.slice(0, 3).map((b) => (
            <div className="booking-card booking-card-muted" key={b.id}>
              <div className="booking-card-top">
                <div>
                  <strong>{b.other_user?.username || 'Customer'}</strong>
                  <p className="booking-when">
                    {formatDate(b.booking_date)} · {formatTime12h(b.start_time)}
                  </p>
                </div>
                <span className="status-pill status-confirmed">Confirmed</span>
              </div>
            </div>
          ))}
        </>
      )}

      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => navigate('/account')}
        style={{ marginBottom: 24 }}
      >
        Manage all bookings
      </button>

      <div className="section-title">Categories near you</div>
      {categories === null ? (
        <Spinner />
      ) : categories.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No categories to show yet.</p>
      ) : (
        <>
          <div className="category-grid">
            {(showAllCategories ? categories : categories.slice(0, CATEGORY_PREVIEW_COUNT)).map((cat) => (
              <div
                key={cat.id}
                className="category-tile"
                onClick={() => navigate(`/search?category_id=${cat.id}`)}
              >
                <div className="swatch" style={{ background: cat.color || 'var(--accent)' }}>
                  {categoryIcon(cat.name)}
                </div>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
          {!showAllCategories && categories.length > CATEGORY_PREVIEW_COUNT && (
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => setShowAllCategories(true)}
            >
              View all {categories.length} categories
            </button>
          )}
        </>
      )}
    </>
  );
}

function CustomerHome({ user }) {
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
    <>
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
              <div
                key={cat.id}
                className="category-tile"
                onClick={() => navigate(`/search?category_id=${cat.id}`)}
              >
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
                <Avatar url={p.avatar_url} name={p.username} />
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
    </>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="screen">
      <div className="location-pill">📍 {user?.city || 'Location not set'}</div>

      {user?.role === 'provider' ? <ProviderDashboard /> : <CustomerHome user={user} />}
    </div>
  );
}
