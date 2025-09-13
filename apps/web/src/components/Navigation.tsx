import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { User, LogOut } from 'lucide-react';
import { api } from '../lib/utils';

type User = { id: string; email: string; name: string | null; isAdmin: boolean };

export default function Navigation() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  async function loadCurrentUser() {
    try {
      // Don't use the api function for auth check to avoid auto-redirect
      const res = await fetch('/vibegate/api/auth/me', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      // User not authenticated
      setCurrentUser(null);
    }
  }


  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <nav className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex gap-4 text-sm">
        <Link to="/vibegate/admin" className="text-gray-600 hover:text-gray-900">管理</Link>
        <Link to="/vibegate/admin/users" className="text-gray-600 hover:text-gray-900">用户</Link>
      </div>

      {currentUser && (
        <div className="flex items-center gap-4">
          <Link to="/vibegate/profile">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors cursor-pointer">
              <User className="w-4 h-4" />
              <span>{currentUser.name || currentUser.email}</span>
              {currentUser.isAdmin && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs">
                  Admin
                </span>
              )}
            </div>
          </Link>

          <Link to="/vibegate/logout">
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}