import { BrowserRouter, Route, Routes, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Users from './pages/Users';

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <nav className="flex gap-4 text-sm">
          <Link to="/vibegate/login">登录</Link>
          <Link to="/vibegate/register">注册</Link>
          <Link to="/vibegate/admin">管理</Link>
          <Link to="/vibegate/admin/users">用户</Link>
        </nav>
        <Routes>
          <Route path="/vibegate/login" element={<Login />} />
          <Route path="/vibegate/register" element={<Register />} />
          <Route path="/vibegate/admin" element={<Admin />} />
          <Route path="/vibegate/admin/users" element={<Users />} />
          <Route path="*" element={<Navigate to="/vibegate/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
