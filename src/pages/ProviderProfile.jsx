import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';
import { Avatar } from '../components/Avatar';
import { Lightbox } from '../components/Lightbox';
import { formatTime12h } from '../utils/format';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const CREDENTIAL_TYPE_LABELS = {
  education: 'Education',
  experience: 'Work experience',
  certification: 'Certification',
  project: 'Past project',
};

function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateLabel(dateStr) {
  const today = toLocalDateStr(new Date());
  const tomorrow = toLocalDateStr(new Date(Date.now() + 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// A provider's booking grid, shown on their public profile. Only renders
// once we know the provider has actually set up working hours — most
// providers won't have, right after this feature ships, so staying silent
// (rather than showing an empty state) keeps their profile looking normal.
// Booking a slot doesn't confirm it outright — it creates a 'pending'
// request the provider accepts or declines from their own Account page.
function ScheduleSection({ providerId, loggedIn, onRequireLogin }) {
  const [availability, setAvailability] = useState(null); // null = still loading
  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slotsData, setSlotsData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bookingStart, setBookingStart] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getAvailability(providerId)
      .then((rows) => {
        if (cancelled) return;
        setAvailability(rows);
        if (!rows.length) return;
        const availableDows = new Set(rows.map((r) => r.day_of_week));
        const dates = [];
        for (let i = 0; dates.length < 7 && i < 28; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          if (availableDows.has(d.getDay())) dates.push(toLocalDateStr(d));
        }
        setDateList(dates);
        setSelectedDate(dates[0] || null);
      })
      .catch(() => !cancelled && setAvailability([]));
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    api
      .getMyBookings()
      .then((d) => !cancelled && setMyBookings(d.as_customer.filter((b) => b.other_user?.id === Number(providerId))))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [providerId, loggedIn]);

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setSlotsLoading(true);
    api
      .getSlots(providerId, selectedDate)
      .then((d) => !cancelled && setSlotsData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [providerId, selectedDate]);

  if (!availability?.length) return null;

  async function handleBook(slot) {
    if (!loggedIn) {
      onRequireLogin();
      return;
    }
    setError('');
    setBookingStart(slot.start_time);
    try {
      const booking = await api.bookSlot(providerId, selectedDate, slot.start_time);
      setMyBookings((prev) => [...prev, booking]);
      setNotice('Request sent — the provider will confirm shortly.');
      setSlotsData((prev) => ({
        ...prev,
        slots: prev.slots.map((s) =>
          s.start_time === slot.start_time ? { ...s, status: 'unavailable' } : s
        ),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBookingStart(null);
    }
  }

  const myBookingByStart = new Map(
    myBookings
      .filter((b) => b.booking_date === selectedDate && ['pending', 'confirmed'].includes(b.status))
      .map((b) => [b.start_time, b.status])
  );

  return (
    <>
      <div className="section-title">Book an appointment</div>
      <ErrorBanner message={error} />
      {notice && <p className="schedule-notice">{notice}</p>}

      <div className="schedule-date-strip">
        {dateList.map((d) => (
          <button
            type="button"
            key={d}
            className={`schedule-date-pill${d === selectedDate ? ' active' : ''}`}
            onClick={() => {
              setSelectedDate(d);
              setNotice('');
            }}
          >
            {dateLabel(d)}
          </button>
        ))}
      </div>

      {slotsLoading || !slotsData ? (
        <Spinner />
      ) : (
        <div className="schedule-slot-grid">
          {slotsData.slots.map((slot) => {
            const mine = myBookingByStart.get(slot.start_time);
            let cls = 'schedule-slot';
            let label = formatTime12h(slot.start_time);
            let disabled = true;
            if (mine === 'confirmed') {
              cls += ' schedule-slot-mine-confirmed';
              label = `${label} · Booked`;
            } else if (mine === 'pending') {
              cls += ' schedule-slot-mine-pending';
              label = `${label} · Requested`;
            } else if (slot.status === 'available') {
              cls += ' schedule-slot-available';
              disabled = bookingStart === slot.start_time;
            } else if (slot.status === 'past') {
              cls += ' schedule-slot-past';
            } else {
              cls += ' schedule-slot-taken';
            }
            return (
              <button
                type="button"
                key={slot.start_time}
                className={cls}
                disabled={disabled}
                onClick={() => handleBook(slot)}
              >
                {bookingStart === slot.start_time ? '…' : label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [provider, setProvider] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

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
              <Avatar url={provider.avatar_url} name={provider.username} />
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

            {String(provider.id) !== String(user?.id) && (
              <ScheduleSection
                providerId={provider.id}
                loggedIn={!!user}
                onRequireLogin={() => navigate('/login')}
              />
            )}

            <div className="section-title">Portfolio</div>
            {portfolio.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No portfolio images yet.</p>
            ) : (
              <div className="portfolio-grid">
                {portfolio.map((img, i) => (
                  <img
                    key={img.id}
                    src={`${API_BASE_URL}${img.image_url}`}
                    alt={img.caption || 'Portfolio image'}
                    onClick={() => setLightboxIndex(i)}
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

            <Lightbox
              images={portfolio.map((img) => ({
                src: `${API_BASE_URL}${img.image_url}`,
                alt: img.caption || 'Portfolio image',
              }))}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNavigate={setLightboxIndex}
            />
          </>
        )}
      </div>
    </>
  );
}
