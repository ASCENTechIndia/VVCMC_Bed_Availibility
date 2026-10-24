import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LOGO = 'https://vvcmc.in/wp-content/uploads/2025/01/VVCMC-New-Logo-Marathi-2048x224-1.png';

const MENU = [
  { to: '/dashboard', label: 'Dashboard', match: ['/dashboard'] },
  {
    to: '/select-hospital',
    label: 'Update Bed Status',
    match: ['/select-hospital', '/bed-update', '/bed-capacity'],
  },
  {
    to: '/hospitals',
    label: 'Hospital Master',
    match: ['/hospitals'],
  },
  { to: '/update-history', label: 'Update History', match: ['/update-history'] },
];

export default function AdminLayout() {
  const { isAuthenticated, sessionExpired, user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: pathname, expired: sessionExpired }} />;
  }

  const doLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/logout');
  };

  return (
    <>
      <header className="ah">
        <Link to="/dashboard">
          <img src={LOGO} alt="VVCMC" />
        </Link>
        <div className="who">
          Hospital Bed Dashboard - Admin Panel
          <br />
          <small>
            Logged in as: {user?.userFullName || user?.userId || 'Admin User'} |{' '}
            <a href="/logout" onClick={doLogout}>Logout</a>
          </small>
        </div>
      </header>
      <div className="lay">
        <aside className="sb">
          {MENU.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className={m.match.some((p) => pathname.startsWith(p)) ? 'on' : undefined}
            >
              {m.label}
            </Link>
          ))}
          <a href="/logout" className="out" onClick={doLogout}>Logout</a>
        </aside>
        <main className="mn">
          <Outlet />
        </main>
      </div>
      <footer className="ft">© Vasai Virar City Municipal Corporation. All Rights Reserved.</footer>
    </>
  );
}
