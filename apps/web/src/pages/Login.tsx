import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { api } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Get the redirect URL from query params, default to profile page
  const getRedirectUrl = () => {
    const next = searchParams.get('next');
    if (next) {
      try {
        // Decode the URL and validate it's a relative path
        const decodedUrl = decodeURIComponent(next);
        if (decodedUrl.startsWith('/vibegate/')) {
          return decodedUrl;
        }
      } catch (e) {
        // Invalid URL encoding, ignore
      }
    }
    return '/vibegate/profile'; // Default redirect to profile
  };

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(getRedirectUrl());
    }
  }, [authLoading, isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      navigate(getRedirectUrl());
    } catch (e: any) {
      setError(e.message || '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">欢迎回来</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱和密码来访问您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            还没有账户？{' '}
            <Link
              to={`/vibegate/register${searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next')!)}` : ''}`}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              注册新账户
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
