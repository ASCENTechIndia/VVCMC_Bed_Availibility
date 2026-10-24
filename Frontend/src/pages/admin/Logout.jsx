import { Link } from 'react-router-dom';

export default function Logout() {
  return (
    <div className="lgbox">
      <h1>You have been logged out</h1>
      <p className="sm">Your session has ended securely.</p>
      <Link className="btn full c" to="/admin/login">Login again</Link>
    </div>
  );
}
