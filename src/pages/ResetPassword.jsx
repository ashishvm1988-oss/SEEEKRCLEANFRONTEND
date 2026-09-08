import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner, SuccessBanner } from '../components/Feedback';
import { PasswordField } from '../components/PasswordField';
import logoBlue from '../assets/logo-mark-blue.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // A visitor who opens this page directly (not from the emailed link) has
  // no token to work with — send them to request one instead of showing a
  // form that can only ever fail.
  if (!email || !token) {
    return (
      <div className="app-shell">
        <div className="screen" style={{ justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src={logoBlue} alt="Seeekr" style={{ height: 40, marginBottom: 10 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
              This reset link looks incomplete
            </div>
          </div>
          <ErrorBanner message="We couldn't find a reset token in this link. Request a new one below." />
          <Link to="/forgot-password" className="btn btn-primary btn-block">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(email, token, password);
      setDone(true);
      // Flag this navigation so the login page knows to warn about
      // autofill offering the old (now-invalid) saved password — the
      // #1 cause of "I just reset it but it still says wrong password".
      setTimeout(() => navigate('/login', { replace: true, state: { justReset: true } }), 2000);
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
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>Set a new password</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>{email}</p>
        </div>

        <ErrorBanner message={error} />

        {done ? (
          <SuccessBanner message="Password updated — taking you to log in…" />
        ) : (
          <form onSubmit={handleSubmit}>
            <PasswordField
              id="password"
              label="New password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
