import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Logout from './pages/Logout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages without navigation */}
        <Route path="/vibegate/login" element={<Login />} />
        <Route path="/vibegate/register" element={<Register />} />
        <Route path="/vibegate/logout" element={<Logout />} />
        <Route path="/vibegate/profile" element={<Profile />} />

        {/* Admin pages with navigation layout */}
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <div className="max-w-5xl mx-auto p-6">
              <Routes>
                <Route path="/vibegate/admin" element={<Admin />} />
                <Route path="/vibegate/admin/users" element={<Users />} />
                <Route path="*" element={<Navigate to="/vibegate/login" replace />} />
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
