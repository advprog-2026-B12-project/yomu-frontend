import {
    Reading,
    Question,
    Option,
    ReadingRequest,
    QuestionRequest,
    OptionRequest,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    if (res.status === 204) return undefined as T;
    return res.json();
}

// ── Admin: Readings ─────────────────────────────────────────────────────────

export const adminGetReadings = (): Promise<Reading[]> =>
    request("/api/admin/readings");

export const adminCreateReading = (body: ReadingRequest): Promise<Reading> =>
    request("/api/admin/readings", {
        method: "POST",
        body: JSON.stringify(body),
    });

export const adminDeleteReading = (id: string): Promise<void> =>
    request(`/api/admin/readings/${id}`, { method: "DELETE" });

// ── Admin: Questions ────────────────────────────────────────────────────────

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

// ── Admin: Options ──────────────────────────────────────────────────────────

export const adminGetOptions = (questionId: string): Promise<Option[]> =>
    request(`/api/admin/options/question/${questionId}`);

export const adminCreateOption = (
    questionId: string,
    body: OptionRequest
): Promise<Option> =>
    request(`/api/admin/options/${questionId}`, {
        method: "POST",
        body: JSON.stringify(body),
    });

export const adminDeleteOption = (optionId: string): Promise<void> =>
    request(`/api/admin/options/${optionId}`, { method: "DELETE" });