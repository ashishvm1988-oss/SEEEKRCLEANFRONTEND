import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/Feedback';
import logoBlue from '../assets/logo-mark-blue.png';

export default function Login() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (ready && user) return <Navigate to="/home" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="screen" style={{ justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logoBlue} alt="Seeekr" style={{ height: 40, marginBottom: 10 }} />
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent)' }}>Seeekr</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Find trusted service providers near you
          </p>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="identifier">Email or username</label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <p style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
              Forgot password?
            </Link>
          </p>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          New to Seeekr? <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 700 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
