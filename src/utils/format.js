// Small display helpers shared across screens.

const CATEGORY_ICONS = {
  'Design & Art': '🎨',
  'Events & Entertainment': '🎉',
  'Business & Consulting': '💼',
  'Health & Wellbeing': '🧘',
  'Personal Services': '💇',
  'Pet Services': '🐾',
  'Upcoming Entrepreneurs': '🚀',
  'Lessons & LifeSkills': '📚',
};

export function categoryIcon(name) {
  return CATEGORY_ICONS[name] || (name ? name[0].toUpperCase() : '?');
}

export function initials(name = '') {
  const parts = name.trim().split(/[\s_]+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// '14:30' -> '2:30 PM'. Used for schedule/booking slot times, which the API
// always sends as 24-hour 'HH:MM' strings.
export function formatTime12h(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
