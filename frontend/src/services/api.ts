import axios from 'axios';

const TOKEN_STORAGE_KEY = 'qrfs_auth_token';

// The auth cookie alone is unreliable across the Render deployment: the
// frontend and backend are on different registrable domains (different
// *.onrender.com subdomains), making it a third-party cookie that some
// browsers' cross-site cookie restrictions can silently drop. A Bearer
// token kept in localStorage and attached explicitly sidesteps that
// entirely. The cookie is still set/sent for same-site local dev.
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore (e.g. storage disabled)
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === 'string') return message;
  }
  return fallback;
}
