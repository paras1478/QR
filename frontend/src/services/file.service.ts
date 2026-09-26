import { api } from './api';
import { FileItem, FileWithShare, PaginatedResult, PublicFileMeta } from '../types';

export async function uploadFile(file: File, onProgress?: (pct: number) => void) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<{ success: true; data: FileWithShare }>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });
  return res.data.data;
}

export async function listFiles(page = 1, limit = 20) {
  const res = await api.get<{ success: true; data: PaginatedResult<FileItem> }>('/files', {
    params: { page, limit },
  });
  return res.data.data;
}

export async function searchFiles(q: string, page = 1, limit = 20) {
  const res = await api.get<{ success: true; data: PaginatedResult<FileItem> }>('/files/search', {
    params: { q, page, limit },
  });
  return res.data.data;
}

export async function getFile(id: string) {
  const res = await api.get<{ success: true; data: FileWithShare }>(`/files/${id}`);
  return res.data.data;
}

export async function deleteFile(id: string) {
  await api.delete(`/files/${id}`);
}

export async function regenerateShare(id: string) {
  const res = await api.post<{ success: true; data: FileWithShare }>(`/files/${id}/regenerate-share`);
  return res.data.data;
}

export async function setSharing(id: string, isPublic: boolean) {
  const res = await api.patch<{ success: true; data: { file: FileItem } }>(`/files/${id}/sharing`, { isPublic });
  return res.data.data.file;
}

export async function setDisplayName(id: string, displayName: string | null) {
  const res = await api.patch<{ success: true; data: { file: FileItem } }>(`/files/${id}/display-name`, {
    displayName,
  });
  return res.data.data.file;
}

export async function getPublicFile(shareId: string) {
  const res = await api.get<{ success: true; data: PublicFileMeta }>(`/share/${shareId}`);
  return res.data.data;
}

export function publicDownloadUrl(shareId: string) {
  return `${import.meta.env.VITE_API_URL}/share/${shareId}/download`;
}

export function publicPageDownloadUrl(shareId: string, pageNumber: number) {
  return `${import.meta.env.VITE_API_URL}/share/${shareId}/page/${pageNumber}`;
}
