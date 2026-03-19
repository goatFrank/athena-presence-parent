import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Planning from './components/Planning';
import Team from './components/Team';
import Profile from './components/Profile';
import OfficeMap from './components/OfficeMap';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import SuperadminTenants from './components/SuperadminTenants';
import SuperadminManageTenants from './components/SuperadminManageTenants';
import Departments from './components/Departments';
import Employees from './components/Employees';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/planning" element={
          <ProtectedRoute>
            <Planning />
          </ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute>
            <Team />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/office-map" element={
          <ProtectedRoute>
            <OfficeMap />
          </ProtectedRoute>
        } />
        <Route path="/departments" element={
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/tenants" element={
          <ProtectedRoute>
            <SuperadminTenants />
          </ProtectedRoute>
        } />
        <Route path="/superadmin/manage-tenants" element={
          <ProtectedRoute>
            <SuperadminManageTenants />
          </ProtectedRoute>
        } />
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Default redirect to landing or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
