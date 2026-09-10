import { initials } from '../utils/format';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Shows a real photo when avatarUrl is set (a relative /public/... path from
// the API), otherwise falls back to the same initials-in-a-tile look every
// screen already used before photos existed. Sizing/shape all come from the
// existing .avatar / .profile-hero .avatar CSS — this only decides img vs text.
export function Avatar({ url, name, className = '' }) {
  const classes = `avatar ${className}`.trim();

  if (url) {
    return (
      <img
        className={`${classes} avatar-photo`}
        src={`${API_BASE_URL}${url}`}
        alt={name ? `${name}'s profile photo` : 'Profile photo'}
      />
    );
  }

  return <div className={classes}>{initials(name)}</div>;
}
