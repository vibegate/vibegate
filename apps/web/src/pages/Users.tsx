import { useEffect, useState } from 'react';
import { api } from '../lib/utils';

type User = { id: string; email: string; name?: string | null; createdAt?: string };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<{ users: User[] }>(`/admin/users`)
      .then((d) => setUsers(d.users))
      .catch((e: any) => setErr(e.message || String(e)));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">用户列表</h1>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-sm">{u.email}</div>
              <div className="text-xs text-neutral-600">{u.name || '-'}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

