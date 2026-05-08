import {
  Comment,
  CommentRequest,
  PaginatedComments,
  ReactionRequest,
  SortOption,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let message = `Request gagal (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      // ignore parse failure, fall back to default message
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export function fetchComments(
  readingId: string,
  page = 0,
  size = 20,
  sort: SortOption = "newest",
): Promise<Comment[]> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  return request<Comment[]>(
    `/api/v1/readings/${readingId}/comments?${params.toString()}`,
  );
}

export function createComment(
  readingId: string,
  body: CommentRequest,
): Promise<Comment> {
  return request<Comment>(`/api/v1/readings/${readingId}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function replyToComment(
  readingId: string,
  parentId: string,
  body: CommentRequest,
): Promise<Comment> {
  return request<Comment>(
    `/api/v1/readings/${readingId}/comments/${parentId}/replies`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export function updateComment(
  readingId: string,
  commentId: string,
  body: CommentRequest,
): Promise<Comment> {
  return request<Comment>(
    `/api/v1/readings/${readingId}/comments/${commentId}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );
}

export function deleteComment(
  readingId: string,
  commentId: string,
): Promise<void> {
  return request<void>(`/api/v1/readings/${readingId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function adminDeleteComment(commentId: string): Promise<void> {
  return request<void>(`/api/v1/admin/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function setReaction(
  commentId: string,
  body: ReactionRequest,
): Promise<void> {
  return request<void>(`/api/v1/comments/${commentId}/reactions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function removeReaction(commentId: string): Promise<void> {
  return request<void>(`/api/v1/comments/${commentId}/reactions`, {
    method: "DELETE",
  });
}
