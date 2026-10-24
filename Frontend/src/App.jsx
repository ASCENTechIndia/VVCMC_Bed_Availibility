import { Navigate, Route, Routes } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout.jsx';
import AdminRoot from './layouts/AdminRoot.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import BedAvailability from './pages/public/BedAvailability.jsx';
import Login from './pages/admin/Login.jsx';
import Logout from './pages/admin/Logout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import SelectHospital from './pages/admin/SelectHospital.jsx';
import BedForm from './pages/admin/BedForm.jsx';
import HospitalList from './pages/admin/HospitalList.jsx';
import HospitalForm from './pages/admin/HospitalForm.jsx';
import UpdateHistory from './pages/admin/UpdateHistory.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public citizen page */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<BedAvailability />} />
      </Route>

      {/* Admin module */}
      <Route path="/admin" element={<AdminRoot />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="logout" element={<Logout />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="select-hospital" element={<SelectHospital />} />
          <Route path="bed-update" element={<BedForm mode="update" />} />
          <Route path="bed-capacity" element={<BedForm mode="capacity" />} />
          <Route path="hospitals" element={<HospitalList />} />
          <Route path="hospitals/add" element={<HospitalForm mode="add" />} />
          <Route path="hospitals/edit" element={<HospitalForm mode="edit" />} />
          <Route path="update-history" element={<UpdateHistory />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
