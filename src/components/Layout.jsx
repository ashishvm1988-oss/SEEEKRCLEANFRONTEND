import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';

// Wraps every authenticated screen: redirects to /login if not signed in,
// and renders the persistent bottom tab bar around whichever page matched.
export default function Layout() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Outlet />
      <BottomNav />
    </div>
  );
}
