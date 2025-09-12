import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { api } from '../lib/utils';

type Route = { id: string; path: string; target: string; requireAuth: boolean; enabled: boolean };

export default function Admin() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [path, setPath] = useState('');
  const [target, setTarget] = useState('');
  const [requireAuth, setRequireAuth] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [health, setHealth] = useState<string>('unknown');

  async function load() {
    try {
      const data = await api<{ routes: Route[] }>(`/admin/routes`);
      setRoutes(data.routes);
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

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">代理路由</h1>
        <div className="text-sm text-neutral-600">健康: {health}</div>
        <Button onClick={load}>刷新</Button>
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
        {routes.map((r) => (
          <li key={r.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-sm">{r.path} → {r.target}</div>
              <div className="text-xs text-neutral-600">{r.requireAuth ? '需认证' : '公开'} · {r.enabled ? '启用' : '禁用'}</div>
            </div>
            <Button variant="outline" onClick={() => removeRoute(r.id)}>删除</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
