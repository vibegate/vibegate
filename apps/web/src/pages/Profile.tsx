import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { User, Edit3, Shield, ShieldOff, Mail, Calendar, Settings } from 'lucide-react';
import { api } from '../lib/utils';

type UserProfile = {
  id: string;
  email: string;
  name?: string | null;
  isAdmin: boolean;
  createdAt?: string;
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  async function loadProfile() {
    try {
      setError(null);
      setIsLoading(true);
      const data = await api<{ user: UserProfile }>('/auth/profile');
      setUser(data.user);
      setEditName(data.user.name || '');
      setEditEmail(data.user.email);
    } catch (e: any) {
      setError(e.message || '获取用户信息失败');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function openEditDialog() {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email);
      setIsEditDialogOpen(true);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setError(null);
      setSuccess(null);
      await api(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName || null,
          email: editEmail,
          isAdmin: user.isAdmin
        })
      });
      await loadProfile();
      setIsEditDialogOpen(false);
      setSuccess('个人信息更新成功');
    } catch (e: any) {
      setError(e.message || '更新失败');
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-lg">加载中...</div>
          <div className="text-sm text-gray-500 mt-2">正在获取用户信息</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {error || '无法加载用户信息'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="w-6 h-6" />
                  个人资料
                </CardTitle>
                <CardDescription>查看和管理您的个人信息</CardDescription>
              </div>
              <div className="flex gap-2">
                {user.isAdmin && (
                  <Button
                    onClick={() => navigate('/vibegate/admin')}
                    size="sm"
                    variant="outline"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    管理后台
                  </Button>
                )}
                <Button onClick={openEditDialog} size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  编辑资料
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4" />
                邮箱地址
              </Label>
              <div className="text-sm font-mono bg-gray-50 p-3 rounded-md border">
                {user.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4" />
                用户昵称
              </Label>
              <div className="text-sm bg-gray-50 p-3 rounded-md border">
                {user.name || '未设置'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                {user.isAdmin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                账户权限
              </Label>
              <div className="flex items-center gap-2">
                {user.isAdmin ? (
                  <>
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">管理员</span>
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">普通用户</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                注册时间
              </Label>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                {formatDate(user.createdAt)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑个人资料</DialogTitle>
            <DialogDescription>
              更新您的基本信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editEmail">邮箱地址</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName">用户昵称</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入您的昵称（可选）"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                保存更改
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}