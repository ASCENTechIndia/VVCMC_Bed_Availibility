import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';

const LOGO = 'https://vvcmc.in/wp-content/uploads/2025/01/VVCMC-New-Logo-Marathi-2048x224-1.png';

const MENU = [
  { to: '/admin/dashboard', label: 'Dashboard', match: ['/admin/dashboard'] },
  {
    to: '/admin/select-hospital',
    label: 'Update Bed Status',
    match: ['/admin/select-hospital', '/admin/bed-update', '/admin/bed-capacity'],
  },
  {
    to: '/admin/hospitals',
    label: 'Hospital Master',
    match: ['/admin/hospitals'],
  },
  { to: '/admin/update-history', label: 'Update History', match: ['/admin/update-history'] },
];

export default function AdminLayout() {
  const { isAdmin, logout } = useData();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const doLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/admin/logout');
  };

  return (
    <>
      <header className="ah">
        <Link to="/admin/dashboard">
          <img src={LOGO} alt="VVCMC" />
        </Link>
        <div className="who">
          Hospital Bed Dashboard - Admin Panel
          <br />
          <small>
            Logged in as: Admin User (Super Admin) |{' '}
            <a href="/admin/logout" onClick={doLogout}>Logout</a>
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
          <a href="/admin/logout" className="out" onClick={doLogout}>Logout</a>
        </aside>
        <main className="mn">
          <Outlet />
        </main>
      </div>
      <footer className="ft">© Vasai Virar City Municipal Corporation. All Rights Reserved.</footer>
    </>
  );
}
