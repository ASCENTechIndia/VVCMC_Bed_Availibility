import { Outlet } from 'react-router-dom';
import useStyles from '../hooks/useStyles.js';
import adminCss from '../styles/admin.css?inline';

/** Injects the admin stylesheet for every /admin/* route. */
export default function AdminRoot() {
  useStyles(adminCss);
  return <Outlet />;
}
