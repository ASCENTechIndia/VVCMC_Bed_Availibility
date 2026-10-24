import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';

const LOGO = 'https://vvcmc.in/wp-content/uploads/2025/01/VVCMC-New-Logo-Marathi-2048x224-1.png';

export default function Login() {
  const { isAdmin, login } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // If already logged in, redirect to intended target or admin dashboard
  if (isAdmin) {
    const destination = location.state?.from || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Demo authentication: any non-empty credentials log in
    if (!username.trim() || !password) {
      setError('Invalid username or password. Please provide both credentials.');
      return;
    }
    login();
    const destination = location.state?.from || '/dashboard';
    navigate(destination, { replace: true });
  };

  return (
    <div className="lgbox">
      <img src={LOGO} alt="VVCMC" />
      <h1>Admin Login</h1>
      <p className="sm">Hospital Bed Dashboard - Department users only</p>
      {error && <div className="alert err">{error}</div>}
      {info && <div className="alert info">{info}</div>}
      <form onSubmit={onSubmit} autoComplete="off">
        <label htmlFor="u">Username</label>
        <input
          type="text"
          id="u"
          name="username"
          required
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="p">Password</label>
        <input
          type="password"
          id="p"
          name="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn full" type="submit">Login</button>
      </form>
      <p className="sm c">
        <a
          href="#forgot"
          onClick={(e) => {
            e.preventDefault();
            setInfo('For password reset assistance, please contact the VVCMC IT Administrator.');
          }}
        >
          Forgot password?
        </a>
      </p>
      <p className="sm c" style={{ marginTop: '12px' }}>
        <Link to="/citizendashboard">← Citizen Bed Availability Dashboard</Link>
      </p>
    </div>
  );
}
