import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_BASE = import.meta.env.VITE_API_BASE || '/vibegate/api';

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};

  // Copy existing headers
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, init.headers);
    }
  }

  // Only set Content-Type for requests with body
  if (init?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...init,
  });
  if (res.status === 401) {
    // Redirect to login with current page as next parameter
    const currentPath = window.location.pathname + window.location.search;
    const loginUrl = `/vibegate/login?next=${encodeURIComponent(currentPath)}`;
    window.location.assign(loginUrl);
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
