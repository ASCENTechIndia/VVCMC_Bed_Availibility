import { Outlet } from 'react-router-dom';
import useStyles from '../hooks/useStyles.js';

/** Login / logout screens use <body class="lg"> in the original CSS. */
export default function AuthLayout() {
  useStyles('', 'lg');
  return <Outlet />;
}
