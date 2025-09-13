import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Pencil, Trash2, UserPlus, Shield, ShieldOff, RefreshCw } from 'lucide-react';
import { api } from '../lib/utils';

type User = {
  id: string;
  email: string;
  name?: string | null;
  isAdmin: boolean;
  createdAt?: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createIsAdmin, setCreateIsAdmin] = useState(false);

  async function loadUsers() {
    try {
      setError(null);
      const data = await api<{ users: User[] }>('/admin/users');
      setUsers(data.users);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openEditDialog(user: User) {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email);
    setEditIsAdmin(user.isAdmin);
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(user: User) {
    setDeleteUser(user);
    setIsDeleteDialogOpen(true);
  }

  function openCreateDialog() {
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateIsAdmin(false);
    setIsCreateDialogOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setError(null);
      await api(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName || null,
          email: editEmail,
          isAdmin: editIsAdmin
        })
      });
      await loadUsers();
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError(null);
      await api('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          name: createName || undefined,
          isAdmin: createIsAdmin
        })
      });
      await loadUsers();
      setIsCreateDialogOpen(false);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteUser) return;

    try {
      setError(null);
      await api(`/admin/users/${deleteUser.id}`, { method: 'DELETE' });
      await loadUsers();
      setIsDeleteDialogOpen(false);
      setDeleteUser(null);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">用户管理</CardTitle>
              <CardDescription>管理系统用户和权限</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openCreateDialog} size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                创建用户
              </Button>
              <Button onClick={loadUsers} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            用户列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>邮箱</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-mono text-sm">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{user.name || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
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
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">{formatDate(user.createdAt)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="space-y-2">
                <div className="text-lg">暂无用户</div>
                <div className="text-sm">等待用户注册或管理员创建</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户的基本信息和权限设置
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editEmail">邮箱</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName">姓名</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="可选"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsAdmin"
                checked={editIsAdmin}
                onChange={(e) => setEditIsAdmin(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="editIsAdmin" className="flex items-center gap-2">
                {editIsAdmin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                管理员权限
              </Label>
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

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新用户</DialogTitle>
            <DialogDescription>
              添加新用户到系统中
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="createEmail">邮箱 *</Label>
              <Input
                id="createEmail"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createPassword">密码 *</Label>
              <Input
                id="createPassword"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
                placeholder="至少6位字符"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createName">姓名</Label>
              <Input
                id="createName"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="可选"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createIsAdmin"
                checked={createIsAdmin}
                onChange={(e) => setCreateIsAdmin(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="createIsAdmin" className="flex items-center gap-2">
                {createIsAdmin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                管理员权限
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                <UserPlus className="w-4 h-4 mr-2" />
                创建用户
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除用户</DialogTitle>
            <DialogDescription>
              您确定要删除用户 <strong>{deleteUser?.email}</strong> 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

