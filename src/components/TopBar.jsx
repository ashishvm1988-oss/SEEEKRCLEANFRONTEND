import { useNavigate } from 'react-router-dom';

export default function TopBar({ title, onBack, back = true }) {
  const navigate = useNavigate();
  return (
    <header className="top-bar">
      {back && (
        <button className="back-btn" onClick={onBack || (() => navigate(-1))} aria-label="Go back">
          ←
        </button>
      )}
      <h1>{title}</h1>
    </header>
  );
}
