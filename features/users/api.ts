const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type ApiError = Error & { status?: number };

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${BASE}/api/users/${userId}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ApiError = new Error(`Failed: ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}
