import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { api } from '../lib/utils';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      console.log('Attempting registration with:', { email, name: name || undefined });
      const result = await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name: name || undefined }) });
      console.log('Registration successful:', result);
      navigate('/vibegate/admin');
    } catch (e: any) {
      console.error('Registration failed:', e);
      setMsg(`注册失败: ${e.message || e}`);
    }
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-semibold">注册</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="昵称（可选）" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full">注册</Button>
      </form>
      {msg && <p className="text-sm text-neutral-600 dark:text-neutral-300">{msg}</p>}
    </div>
  );
}
