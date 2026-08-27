import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/home', icon: '🏠', label: 'Home' },
  { to: '/search', icon: '🔍', label: 'Search' },
  { to: '/chat', icon: '💬', label: 'Chat' },
  { to: '/account', icon: '👤', label: 'Account' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
