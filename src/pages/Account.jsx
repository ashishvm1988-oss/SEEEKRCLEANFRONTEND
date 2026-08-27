import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, ErrorBanner } from '../components/Feedback';
import { initials, formatDate } from '../utils/format';

export default function Account() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState(user?.about || '');
  const [city, setCity] = useState(user?.city || '');
  const [contact, setContact] = useState(user?.contact || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(user?.role === 'provider');

  useEffect(() => {
    if (user?.role !== 'provider') return;
    let cancelled = false;
    api
      .getMySubscription()
      .then((s) => !cancelled && setSubscription(s))
      .catch(() => {})
      .finally(() => !cancelled && setSubLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.updateProfile({ about, city, contact });
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  return (
    <div className="screen">
      <div className="profile-hero">
        <div className="avatar">{initials(user.username)}</div>
        <h2>{user.username}</h2>
        <div className="sub">{user.email}</div>
        <span className="chip" style={{ marginTop: 4 }}>{user.role === 'provider' ? 'Service provider' : 'Customer'}</span>
      </div>

      {user.role === 'provider' && (
        <>
          <div className="section-title">Your plan</div>
          {subLoading ? (
            <Spinner />
          ) : subscription ? (
            <div className="plan-card">
              <span className="status-pill">{subscription.status}</span>
              <h4>₹{subscription.amount_inr} / month</h4>
              {subscription.status === 'trial' ? (
                <p>Free until {formatDate(subscription.trial_ends_at)}, then billing starts automatically.</p>
              ) : (
                <p>Next billing on {formatDate(subscription.next_billing_at) || 'TBD'}.</p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No subscription found.</p>
          )}
        </>
      )}

      <div className="section-title">Profile</div>
      <ErrorBanner message={error} />
      {editing ? (
        <form onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="acc-city">City</label>
            <input id="acc-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="acc-contact">Phone</label>
            <input id="acc-contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="acc-about">About</label>
            <textarea id="acc-about" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" type="button" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="menu-item" onClick={() => setEditing(true)}>
            <span>City</span>
            <span className="arrow">{user.city || 'Not set'} ›</span>
          </div>
          <div className="menu-item" onClick={() => setEditing(true)}>
            <span>Phone</span>
            <span className="arrow">{user.contact || 'Not set'} ›</span>
          </div>
          <div className="menu-item" onClick={() => setEditing(true)}>
            <span>About</span>
            <span className="arrow">{user.about ? 'Edit' : 'Add'} ›</span>
          </div>
        </>
      )}

      <button className="btn btn-secondary btn-block" onClick={handleLogout} style={{ marginTop: 28 }}>
        Log out
      </button>
    </div>
  );
}
