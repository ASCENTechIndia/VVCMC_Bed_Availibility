import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';

const LOGO = 'https://vvcmc.in/wp-content/uploads/2025/01/VVCMC-New-Logo-Marathi-2048x224-1.png';

export default function Login() {
  const { login } = useData();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    // Demo only: replace with a real API call. Any non-empty credentials work here.
    if (!username.trim() || !password) {
      setError('Invalid username or password.');
      return;
    }
    login();
    navigate('/admin/dashboard');
  };

  return (
    <div className="lgbox">
      <img src={LOGO} alt="VVCMC" />
      <h1>Admin Login</h1>
      <p className="sm">Hospital Bed Dashboard - Department users only</p>
      {error && <div className="alert err">{error}</div>}
      <form onSubmit={onSubmit} autoComplete="off">
        <label htmlFor="u">Username</label>
        <input type="text" id="u" name="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        <label htmlFor="p">Password</label>
        <input type="password" id="p" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn full" type="submit">Login</button>
      </form>
      <p className="sm c"><Link to="/admin/login">Forgot password?</Link></p>
    </div>
  );
}
