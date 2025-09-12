import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = import.meta.env.VITE_API_BASE || '/vibegate/api';

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (res.status === 401) {
    window.location.assign('/vibegate/login');
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
