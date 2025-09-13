import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { GripVertical, Trash2, Plus, RefreshCw, Shield, ShieldOff, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/utils';

type Route = { id: string; path: string; target: string; requireAuth: boolean; enabled: boolean; order: number };

export default function Admin() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [path, setPath] = useState('');
  const [target, setTarget] = useState('');
  const [requireAuth, setRequireAuth] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [health, setHealth] = useState<string>('unknown');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function load() {
    try {
      const data = await api<{ routes: Route[] }>(`/admin/routes`);
      // Sort by order, then by path length for display
      const sortedRoutes = data.routes.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return b.path.length - a.path.length;
      });
      setRoutes(sortedRoutes);
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  }

  useEffect(() => {
    load();
    fetch('/vibegate/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(() => setHealth('ok'))
      .catch(() => setHealth('error'));
  }, []);

  async function createRoute(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api('/admin/routes', { method: 'POST', body: JSON.stringify({ path, target, requireAuth, enabled }) });
      setPath('');
      setTarget('');
      setRequireAuth(false);
      setEnabled(true);
      await load();
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  }

  async function removeRoute(id: string) {
    setErr(null);
    try {
      await api(`/admin/routes/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  }

  async function updateRouteOrder(reorderedRoutes: Route[]) {
    setErr(null);
    try {
      const routeUpdates = reorderedRoutes.map((route, index) => ({
        id: route.id,
        order: index
      }));

      await api('/admin/routes/order', {
        method: 'PUT',
        body: JSON.stringify({ routes: routeUpdates })
      });

      await load();
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Store the index in dataTransfer for cross-browser compatibility
    e.dataTransfer.setData('text/plain', index.toString());
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }

  function handleDragEnter(e: React.DragEvent, index: number) {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    // Only clear dragOver if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...routes];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    // Update local state immediately for UI feedback
    setRoutes(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Update server with new order
    updateRouteOrder(reordered);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">代理路由管理</CardTitle>
              <CardDescription>管理API网关的代理路由配置</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
                health === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${health === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                健康状态: {health}
              </div>
              <Button onClick={load} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info Alert */}
      <Alert>
        <GripVertical className="h-4 w-4" />
        <AlertDescription>
          💡 <strong>排序提示:</strong> 拖拽路由卡片上的拖拽手柄来调整匹配优先级。越靠上的路由优先级越高。
        </AlertDescription>
      </Alert>

      {/* Add Route Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            新增代理路由
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createRoute} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="path">路径前缀</Label>
                <Input
                  id="path"
                  placeholder="如: /api/test"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">目标地址</Label>
                <Input
                  id="target"
                  placeholder="如: http://localhost:3001"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requireAuth"
                  checked={requireAuth}
                  onChange={(e) => setRequireAuth(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="requireAuth" className="flex items-center gap-2">
                  {requireAuth ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                  需要认证
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="enabled" className="flex items-center gap-2">
                  {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  启用路由
                </Label>
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              添加路由
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      {/* Routes List */}
      <div className="space-y-3">
        {routes.map((r, index) => (
          <Card
            key={r.id}
            className={`transition-all duration-200 cursor-move ${
              draggedIndex === index
                ? 'opacity-50 scale-95 shadow-lg border-blue-300'
                : dragOverIndex === index
                ? 'border-t-4 border-t-blue-500 shadow-md'
                : 'hover:shadow-md'
            }`}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="text-gray-400 cursor-move hover:text-gray-600 transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        #{r.order}
                      </span>
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {r.path}
                      </code>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">{r.target}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        {r.requireAuth ? (
                          <><Shield className="w-3 h-3" /> 需要认证</>
                        ) : (
                          <><ShieldOff className="w-3 h-3" /> 公开访问</>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {r.enabled ? (
                          <><Eye className="w-3 h-3" /> 已启用</>
                        ) : (
                          <><EyeOff className="w-3 h-3" /> 已禁用</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRoute(r.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {routes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <div className="space-y-2">
                <div className="text-lg">暂无代理路由</div>
                <div className="text-sm">点击上方"添加路由"按钮来创建第一个代理路由</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
