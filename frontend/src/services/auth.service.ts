import { api, tokenStorage } from './api';
import { User } from '../types';

export async function registerRequest(name: string, email: string, password: string) {
  const res = await api.post<{ success: true; data: { user: User; token: string } }>('/auth/register', {
    name,
    email,
    password,
  });
  tokenStorage.set(res.data.data.token);
  return res.data.data.user;
}

export async function loginRequest(email: string, password: string) {
  const res = await api.post<{ success: true; data: { user: User; token: string } }>('/auth/login', {
    email,
    password,
  });
  tokenStorage.set(res.data.data.token);
  return res.data.data.user;
}

export async function logoutRequest() {
  try {
    await api.post('/auth/logout');
  } finally {
    tokenStorage.clear();
  }
}

export async function meRequest() {
  const res = await api.get<{ success: true; data: { user: User } }>('/auth/me');
  return res.data.data.user;
}

export async function forgotPasswordRequest(email: string) {
  const res = await api.post<{ success: true; data: { message: string } }>('/auth/forgot-password', { email });
  return res.data.data.message;
}

export async function resetPasswordRequest(token: string, password: string) {
  const res = await api.post<{ success: true; data: { message: string } }>('/auth/reset-password', {
    token,
    password,
  });
  return res.data.data.message;
}
