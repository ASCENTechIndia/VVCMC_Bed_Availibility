import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { API_BASE_URL } from '../../services/apiService.js';
import { getHostname, getIpAddress, getMacAddress, getSource } from '../../utils/device.js';

const LOGO = 'https://vvcmc.in/wp-content/uploads/2025/01/VVCMC-New-Logo-Marathi-2048x224-1.png';

export default function Login() {
  const { isAuthenticated, sessionExpired, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('MMCDTU');
  const [password, setPassword] = useState('MMCDTU');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(() => {
    return location.state?.expired || sessionExpired
      ? 'Your session has expired after 15 minutes of inactivity. Please login again.'
      : '';
  });

  useEffect(() => {
    if (location.state?.expired || sessionExpired) {
      setInfo('Your session has expired after 15 minutes of inactivity. Please login again.');
    }
  }, [location.state, sessionExpired]);

  if (isAuthenticated) {
    const destination = location.state?.from || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!username.trim() || !password) {
      setError('Please provide both User ID and password.');
      return;
    }

    try {
      setLoading(true);

      const [ipaddr, macaddr] = await Promise.all([
        getIpAddress(),
        Promise.resolve(getMacAddress()),
      ]);

      const payload = {
        userId: username.trim(),
        password,
        macaddr,
        ipaddr,
        source: getSource(),
        hostname: getHostname(),
      };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      let res = null;
      try {
        res = await response.json();
      } catch (err) {
        console.error('Error parsing login response JSON:', err);
      }

      if (!response.ok || !res?.success) {
        throw new Error(res?.message || `Login failed (Status: ${response.status})`);
      }

      const rawUser = res?.data?.user || { userId: username.trim() };
      const ulbdValue =
        rawUser.ulbd ||
        rawUser.ulbId ||
        rawUser.orgId ||
        rawUser.out_OrgId ||
        rawUser.OUT_ORGID;

      const userData = {
        ...rawUser,
        ulbd: ulbdValue,
        ulbId: ulbdValue,
      };
      const authToken = res?.data?.token || '';

      login(userData, authToken);

      const destination = location.state?.from || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lgbox">
      <img src={LOGO} alt="VVCMC" />
      <h1>Admin Login</h1>
      <p className="sm">Hospital Bed Dashboard - Department users only</p>
      {error && <div className="alert err">{error}</div>}
      {info && <div className="alert info">{info}</div>}
      <form onSubmit={onSubmit} autoComplete="off">
        <label htmlFor="u">User ID / Username</label>
        <input
          type="text"
          id="u"
          name="username"
          required
          autoFocus
          disabled={loading}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="p">Password</label>
        <input
          type="password"
          id="p"
          name="password"
          required
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn full" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
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
