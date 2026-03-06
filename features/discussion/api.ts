import { Comment } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function fetchComments(readingId: string): Promise<Comment[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/readings/${readingId}/comments`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch comments: ${res.status}`);
  }

  return res.json();
}

