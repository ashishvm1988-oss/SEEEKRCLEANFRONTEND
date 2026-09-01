export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="error-banner">{message}</div>;
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return <div className="success-banner">{message}</div>;
}

export function EmptyState({ glyph = '🔎', title, subtitle }) {
  return (
    <div className="empty-state">
      <div className="glyph">{glyph}</div>
      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      {subtitle && <div>{subtitle}</div>}
    </div>
  );
}
