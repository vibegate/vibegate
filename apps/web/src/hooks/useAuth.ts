import { useState, useEffect } from 'react';

export type User = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  roles?: Array<{
    id: string;
    name: string;
    displayName: string;
    permissions: string[];
  }>;
  permissions?: string[];
};

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    refresh: loadCurrentUser
  };
}