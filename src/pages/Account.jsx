import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, ErrorBanner } from '../components/Feedback';
import { initials, formatDate } from '../utils/format';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const CREDENTIAL_TYPES = [
  { value: 'education', label: 'Education' },
  { value: 'experience', label: 'Work experience' },
  { value: 'certification', label: 'Certification' },
  { value: 'project', label: 'Past project' },
];

function credentialTypeLabel(type) {
  return CREDENTIAL_TYPES.find((t) => t.value === type)?.label || type;
}

// Providers manage their own portfolio photos here. The upload/delete
// endpoints already existed on the backend but had never been wired to any
// screen — this is that missing screen.
function PortfolioSection({ userId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getPortfolio(userId)
      .then((imgs) => !cancelled && setImages(imgs))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const newImage = await api.uploadPortfolioImage(file);
      setImages((prev) => [newImage, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    // Optimistic removal — the delete is scoped server-side to images this
    // provider owns, so this can't fail in a way that leaves the UI wrong.
    const previous = images;
    setImages((prev) => prev.filter((img) => img.id !== id));
    try {
      await api.deletePortfolioImage(id);
    } catch (err) {
      setImages(previous);
      setError(err.message);
    }
  }

  return (
    <>
      <div className="section-title">Portfolio photos</div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>
        Shown on your public profile so customers can see your work before they message you.
      </p>
      <ErrorBanner message={error} />
      {loading ? (
        <Spinner />
      ) : (
        <div className="portfolio-grid">
          {images.map((img) => (
            <div className="portfolio-tile" key={img.id}>
              <img src={`${API_BASE_URL}${img.image_url}`} alt={img.caption || 'Portfolio image'} />
              <button
                type="button"
                className="remove-btn"
                aria-label="Remove photo"
                onClick={() => handleDelete(img.id)}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="portfolio-add-tile"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span className="plus">{uploading ? '…' : '+'}</span>
            <span>{uploading ? 'Uploading' : 'Add photo'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </div>
      )}
    </>
  );
}

// Lets a provider list verifiable background — degrees, past employers,
// certifications, projects — with an optional photo/PDF of the proof
// document, so a profile can show it's a real, qualified provider rather
// than someone who just signed up.
function CredentialsSection() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();

  const [type, setType] = useState('education');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [period, setPeriod] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getCredentials(user.id)
      .then((rows) => !cancelled && setCredentials(rows))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  function resetForm() {
    setType('education');
    setTitle('');
    setOrganization('');
    setPeriod('');
    setDescription('');
    setFile(null);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give this credential a title.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const newCredential = await api.addCredential({
        type,
        title: title.trim(),
        organization: organization.trim(),
        period: period.trim(),
        description: description.trim(),
        file,
      });
      setCredentials((prev) => [newCredential, ...prev]);
      resetForm();
      setAdding(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    const previous = credentials;
    setCredentials((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.deleteCredential(id);
    } catch (err) {
      setCredentials(previous);
      setError(err.message);
    }
  }

  return (
    <>
      <div className="section-title">Credentials &amp; experience</div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>
        Add your education, past work, certifications, or projects — with proof if you have it — so
        customers know you're a real, qualified provider.
      </p>
      <ErrorBanner message={error} />

      {loading ? (
        <Spinner />
      ) : (
        <>
          {credentials.map((c) => (
            <div className="credential-card" key={c.id}>
              <div className="credential-card-top">
                <div>
                  <span className="credential-type-badge">{credentialTypeLabel(c.type)}</span>
                  <h4>{c.title}</h4>
                  {c.organization && <p className="org">{c.organization}</p>}
                  {c.period && <p className="period">{c.period}</p>}
                </div>
                <button type="button" className="remove-link" onClick={() => handleDelete(c.id)}>
                  Remove
                </button>
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

          {adding ? (
            <form className="credential-form" onSubmit={handleAdd}>
              <div className="field">
                <label htmlFor="cred-type">Type</label>
                <select id="cred-type" value={type} onChange={(e) => setType(e.target.value)}>
                  {CREDENTIAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cred-title">Title</label>
                <input
                  id="cred-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. B.Arch, Interior Design"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="cred-org">Institution / organization</label>
                <input
                  id="cred-org"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Anna University, or ABC Builders Pvt Ltd"
                />
              </div>
              <div className="field">
                <label htmlFor="cred-period">Year(s)</label>
                <input
                  id="cred-period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g. 2018 - 2022, or 2023"
                />
              </div>
              <div className="field">
                <label htmlFor="cred-desc">Details (optional)</label>
                <textarea
                  id="cred-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="cred-file">Proof (optional — photo or PDF)</label>
                <input
                  id="cred-file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    resetForm();
                    setAdding(false);
                    setError('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving…' : 'Add credential'}
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="credential-add-toggle" onClick={() => setAdding(true)}>
              + Add a credential
            </button>
          )}
        </>
      )}
    </>
  );
}

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
          <PortfolioSection userId={user.id} />
          <CredentialsSection />
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
