import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../lib/utils';

export default function Logout() {
  const [status, setStatus] = useState<'logging-out' | 'success' | 'error'>('logging-out');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function performLogout() {
      try {
        await api('/auth/logout', { method: 'POST' });
        setStatus('success');

        // 延迟 1.5 秒后跳转到登录页面，让用户看到成功提示
        setTimeout(() => {
          window.location.assign('/vibegate/login');
        }, 1500);
      } catch (e: any) {
        console.error('Logout failed:', e);
        setStatus('error');
        setError(e.message || '登出失败');

        // 即使登出失败，也在3秒后强制跳转到登录页面
        setTimeout(() => {
          window.location.assign('/vibegate/login');
        }, 3000);
      }
    }

    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'logging-out' && (
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === 'logging-out' && '正在登出...'}
            {status === 'success' && '登出成功'}
            {status === 'error' && '登出遇到问题'}
          </CardTitle>
          <CardDescription>
            {status === 'logging-out' && '请稍候，正在安全地退出您的账户'}
            {status === 'success' && '您已成功退出登录，即将跳转到登录页面'}
            {status === 'error' && error ? `${error}，即将跳转到登录页面` : '即将跳转到登录页面'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <LogOut className="w-4 h-4" />
            <span>正在清理会话信息...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}