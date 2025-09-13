import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
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
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reordered = [...routes];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    setRoutes(reordered);
    setDraggedIndex(null);
    updateRouteOrder(reordered);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">代理路由</h1>
        <div className="text-sm text-neutral-600">健康: {health}</div>
        <Button onClick={load}>刷新</Button>
      </div>
      <div className="text-sm text-neutral-600 bg-blue-50 p-3 rounded border">
        💡 <strong>排序提示:</strong> 拖拽路由条目来调整匹配优先级。越靠上的路由优先级越高。
      </div>
      <form onSubmit={createRoute} className="border rounded p-3 grid grid-cols-1 gap-2">
        <input className="border rounded px-3 py-2" placeholder="路径前缀，如 /api/test" value={path} onChange={(e) => setPath(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="目标地址，如 http://localhost:3001" value={target} onChange={(e) => setTarget(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requireAuth} onChange={(e) => setRequireAuth(e.target.checked)} /> 需要认证</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> 启用</label>
        <div>
          <Button type="submit">新增路由</Button>
        </div>
      </form>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <ul className="space-y-2">
        {routes.map((r, index) => (
          <li
            key={r.id}
            className={`border rounded p-3 flex items-center justify-between cursor-move transition-all ${
              draggedIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'
            }`}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-center gap-3">
              <div className="text-neutral-400 cursor-move">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 3h2v2H9V3zm4 0h2v2h-2V3zM9 7h2v2H9V7zm4 0h2v2h-2V7zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 15h2v2H9v-2zm4 0h2v2h-2v-2zM9 19h2v2H9v-2zm4 0h2v2h-2v-2z"/>
                </svg>
              </div>
              <div>
                <div className="font-mono text-sm flex items-center gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">#{r.order}</span>
                  {r.path} → {r.target}
                </div>
                <div className="text-xs text-neutral-600">{r.requireAuth ? '需认证' : '公开'} · {r.enabled ? '启用' : '禁用'}</div>
              </div>
            </div>
            <Button variant="outline" onClick={() => removeRoute(r.id)}>删除</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
