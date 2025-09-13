import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Pencil, Trash2, Shield, Plus, RefreshCw, Key } from 'lucide-react';
import { api } from '../lib/utils';

type Role = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
};

// Common permissions list
const AVAILABLE_PERMISSIONS = [
  { value: 'read:users', label: '查看用户' },
  { value: 'write:users', label: '编辑用户' },
  { value: 'delete:users', label: '删除用户' },
  { value: 'read:routes', label: '查看路由' },
  { value: 'write:routes', label: '编辑路由' },
  { value: 'delete:routes', label: '删除路由' },
  { value: 'read:roles', label: '查看角色' },
  { value: 'write:roles', label: '编辑角色' },
  { value: 'delete:roles', label: '删除角色' },
  { value: 'manage:system', label: '系统管理' },
];

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[]
  });

  async function loadRoles() {
    try {
      setError(null);
      setIsLoading(true);
      const data = await api<{ roles: Role[] }>('/admin/roles');
      setRoles(data.roles);
    } catch (e: any) {
      setError(e.message || '获取角色列表失败');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  function openCreateDialog() {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: []
    });
    setIsCreateDialogOpen(true);
  }

  function openEditDialog(role: Role) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(role: Role) {
    setDeleteRole(role);
    setIsDeleteDialogOpen(true);
  }

  function togglePermission(permission: string) {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await api('/admin/roles', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      await loadRoles();
      setIsCreateDialogOpen(false);
      setSuccess('角色创建成功');
    } catch (e: any) {
      setError(e.message || '创建角色失败');
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;
    setError(null);
    setSuccess(null);

    try {
      await api(`/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions
        })
      });
      await loadRoles();
      setIsEditDialogOpen(false);
      setEditingRole(null);
      setSuccess('角色更新成功');
    } catch (e: any) {
      setError(e.message || '更新角色失败');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteRole) return;
    setError(null);
    setSuccess(null);

    try {
      await api(`/admin/roles/${deleteRole.id}`, { method: 'DELETE' });
      await loadRoles();
      setIsDeleteDialogOpen(false);
      setDeleteRole(null);
      setSuccess('角色删除成功');
    } catch (e: any) {
      setError(e.message || '删除角色失败');
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6" />
                角色管理
              </CardTitle>
              <CardDescription>管理系统角色和权限配置</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                创建角色
              </Button>
              <Button onClick={loadRoles} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
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

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>角色列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead>显示名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="font-mono text-sm">{role.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{role.displayName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{role.description || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.length > 0 ? (
                        role.permissions.slice(0, 3).map(perm => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">无权限</span>
                      )}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">{formatDate(role.createdAt)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(role)}
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

          {roles.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="space-y-2">
                <Shield className="w-12 h-12 mx-auto text-gray-300" />
                <div className="text-lg">暂无角色</div>
                <div className="text-sm">点击"创建角色"按钮添加第一个角色</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建新角色</DialogTitle>
            <DialogDescription>定义角色名称、描述和权限配置</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">角色名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="例如: editor, viewer"
                  pattern="^[a-z0-9_-]+$"
                  title="只能使用小写字母、数字、下划线和连字符"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">显示名称 *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  placeholder="例如: 编辑员, 查看者"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="角色的职责和权限说明"
              />
            </div>
            <div className="space-y-2">
              <Label>权限配置</Label>
              <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <label key={perm.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.value)}
                      onChange={() => togglePermission(perm.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      <Key className="w-3 h-3 inline mr-1" />
                      {perm.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                创建角色
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
            <DialogDescription>修改角色信息和权限配置</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>角色名称</Label>
                <Input value={formData.name} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDisplayName">显示名称 *</Label>
                <Input
                  id="editDisplayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">描述</Label>
              <Input
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="角色的职责和权限说明"
              />
            </div>
            <div className="space-y-2">
              <Label>权限配置</Label>
              <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <label key={perm.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.value)}
                      onChange={() => togglePermission(perm.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      <Key className="w-3 h-3 inline mr-1" />
                      {perm.label}
                    </span>
                  </label>
                ))}
              </div>
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

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除角色</DialogTitle>
            <DialogDescription>
              您确定要删除角色 <strong>{deleteRole?.displayName}</strong> ({deleteRole?.name}) 吗？
              此操作不可撤销。
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