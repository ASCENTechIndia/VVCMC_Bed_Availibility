import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Logout() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="lgbox">
      <h1>You have been logged out</h1>
      <p className="sm">Your session has ended securely.</p>
      <Link className="btn full c" to="/login">Login again</Link>
    </div>
  );
}
