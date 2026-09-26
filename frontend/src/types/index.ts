export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface FileItem {
  id: string;
  userId: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  shareId: string;
  displayName?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FileWithShare {
  file: FileItem;
  qrCode: string;
  shareUrl: string;
}

export interface PublicFileMeta {
  id: string;
  shareId: string;
  originalName: string;
  displayName?: string | null;
  mimeType: string;
  size: number;
  createdAt: string;
  pageCount: number | null;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
}
