import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorBanner, SuccessBanner } from '../components/Feedback';
import logoBlue from '../assets/logo-mark-blue.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.requestPasswordReset(email.trim());
      // Always show the same success state, whether or not the email was
      // actually registered — the backend responds identically either way
      // so this page can't be used to check if an email has an account.
      setSent(true);
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
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>Forgot password?</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Enter the email on your account and we'll send you a link to reset your password.
          </p>
        </div>

        <ErrorBanner message={error} />

        {sent ? (
          <SuccessBanner message="If an account exists for that email, we've sent a link to reset your password. Check your inbox (and spam folder) — the link expires in 30 minutes." />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
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
