import { api } from './api';
import { User } from '../types';

export async function registerRequest(name: string, email: string, password: string) {
  const res = await api.post<{ success: true; data: { user: User } }>('/auth/register', { name, email, password });
  return res.data.data.user;
}

export async function loginRequest(email: string, password: string) {
  const res = await api.post<{ success: true; data: { user: User } }>('/auth/login', { email, password });
  return res.data.data.user;
}

export async function logoutRequest() {
  await api.post('/auth/logout');
}

export async function meRequest() {
  const res = await api.get<{ success: true; data: { user: User } }>('/auth/me');
  return res.data.data.user;
}
