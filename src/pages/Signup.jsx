import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ErrorBanner } from '../components/Feedback';

export default function Signup() {
  const { user, ready, signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [city, setCity] = useState('');
  const [about, setAbout] = useState('');

  const [subcategories, setSubcategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== 'provider' || subcategories.length) return;
    setTagsLoading(true);
    api
      .getCategories()
      .then(async (cats) => {
        const all = await Promise.all(cats.map((c) => api.getSubcategories(c.id)));
        setSubcategories(all.flat());
      })
      .catch(() => setSubcategories([]))
      .finally(() => setTagsLoading(false));
  }, [role, subcategories.length]);

  if (ready && user) return <Navigate to="/home" replace />;

  function toggleTag(id) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (role === 'provider' && !selectedTags.length) {
      setError('Pick at least one service you offer.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
        contact: contact.trim() || undefined,
        city: city.trim() || undefined,
        about: about.trim() || undefined,
        sub_category_ids: role === 'provider' ? selectedTags : undefined,
      });
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="screen">
        <div style={{ textAlign: 'center', margin: '12px 0 24px' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>Create your account</div>
        </div>

        <div className="role-toggle">
          <button type="button" className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>
            I need a service
          </button>
          <button type="button" className={role === 'provider' ? 'active' : ''} onClick={() => setRole('provider')}>
            I provide a service
          </button>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bangalore" />
          </div>
          <div className="field">
            <label htmlFor="contact">Phone (optional)</label>
            <input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>

          {role === 'provider' && (
            <>
              <div className="field">
                <label htmlFor="about">About your work (optional)</label>
                <textarea
                  id="about"
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell customers what you do"
                />
              </div>

              <div className="field">
                <label>Services you offer</label>
                {tagsLoading ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading categories…</p>
                ) : (
                  <div className="tag-grid">
                    {subcategories.map((sc) => (
                      <span
                        key={sc.id}
                        className={`tag${selectedTags.includes(sc.id) ? ' selected' : ''}`}
                        onClick={() => toggleTag(sc.id)}
                      >
                        {sc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        {role === 'provider' && (
          <p className="disclosure-box">
            Providers get 6 months of listing free. After that, staying listed is ₹1,000/month — no charge until
            then, and no card required to sign up.
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
