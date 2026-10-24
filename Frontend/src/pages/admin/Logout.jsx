import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';

export default function Logout() {
  const { logout } = useData();

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
