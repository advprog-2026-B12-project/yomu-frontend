import {
    Reading,
    Question,
    Option,
    ReadingRequest,
    QuestionRequest,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function authHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        cache: "no-store",
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
            ...(init?.headers ?? {}),
        },
    });

    if (res.status === 204) return undefined as T;
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
}

// Admin: Readings

export const adminGetReadings = (): Promise<Reading[]> =>
    request("/api/admin/readings");

export const adminCreateReading = (body: ReadingRequest): Promise<Reading> =>
    request("/api/admin/readings", {
        method: "POST",
        body: JSON.stringify(body),
    });

export const adminDeleteReading = (id: string): Promise<void> =>
    request(`/api/admin/readings/${id}`, { method: "DELETE" });

// Admin: Questions

export const adminGetQuestions = (readingId: string): Promise<Question[]> =>
    request(`/api/admin/questions/reading/${readingId}`);

export const adminCreateQuestion = (
    readingId: string,
    body: QuestionRequest
): Promise<Question> =>
    request(`/api/admin/questions/${readingId}`, {
        method: "POST",
        body: JSON.stringify(body),
    });

export const adminDeleteQuestion = (questionId: string): Promise<void> =>
    request(`/api/admin/questions/${questionId}`, { method: "DELETE" });

// Admin: Options

export const adminGetOptions = (questionId: string): Promise<Option[]> =>
    request(`/api/admin/options/question/${questionId}`);

export const adminCreateOption = (
    questionId: string,
    body: { optionText: string; correct: boolean }
): Promise<Option> =>
    request(`/api/admin/options/${questionId}`, {
        method: "POST",
        body: JSON.stringify(body),
    });

export const adminUpdateOption = (
    optionId: string,
    body: { optionText: string; correct: boolean }
): Promise<Option> =>
    request(`/api/admin/options/${optionId}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });

export const adminDeleteOption = (optionId: string): Promise<void> =>
    request(`/api/admin/options/${optionId}`, { method: "DELETE" });