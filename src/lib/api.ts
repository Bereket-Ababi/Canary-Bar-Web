import type { MenuItem, RestaurantInfo, SessionUser } from '@/lib/types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export const api = {
  getMenu: () => request<MenuItem[]>('/menu'),
  getRestaurant: () => request<RestaurantInfo>('/restaurant'),
  getMe: () => request<{ user: SessionUser | null }>('/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  createMenuItem: (item: Partial<MenuItem>) =>
    request<MenuItem>('/menu', { method: 'POST', body: JSON.stringify(item) }),
  updateMenuItem: (id: string, item: Partial<MenuItem>) =>
    request<MenuItem>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteMenuItem: (id: string) =>
    request<{ ok: boolean }>(`/menu/${id}`, { method: 'DELETE' }),
  updateRestaurant: (info: Partial<RestaurantInfo>) =>
    request<RestaurantInfo>('/restaurant', { method: 'PUT', body: JSON.stringify(info) }),
  uploadImage: async (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return request<{ url: string }>('/upload', { method: 'POST', body: form });
  },
};
