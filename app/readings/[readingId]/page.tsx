"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, MessageSquare, BookOpen } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useAchievement } from "@/app/providers/AchievementProvider";
import { Navbar } from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Reading = {
  id: string;
  title: string;
  content: string;
};

export default function ReadingPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const { readingId } = use(params);
  const router = useRouter();
  const { userId } = useAuth();
  const { triggerAndNotify } = useAchievement();

  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/readings/${readingId}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Error ${res.status}`);
        }
        return res.json();
      })
      .then((data: Reading) => {
        setReading(data);
        if (userId) void triggerAndNotify(userId, "READING_COMPLETED");
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Gagal memuat bacaan."
        const lower = msg.toLowerCase()
        if (lower.includes("already completed")) {
          setQuizCompleted(true)
          const cached = localStorage.getItem(`quiz_result_${readingId}`)
          if (cached) setQuizScore(JSON.parse(cached))
        } else if (lower.includes("already started")) {
          setQuizStarted(true)
        } else {
          setError(msg)
        }
      });
  }, [readingId, userId, triggerAndNotify]);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    fetch(`${API}/api/quiz/status/${readingId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        setQuizCompleted(data.completed);
        if (data.completed) {
          if (data.score !== undefined && data.total !== undefined) {
            setQuizScore({ score: data.score, total: data.total });
            localStorage.setItem(
              `quiz_result_${readingId}`,
              JSON.stringify({ score: data.score, total: data.total })
            );
          } else {
            const cached = localStorage.getItem(`quiz_result_${readingId}`);
            if (cached) setQuizScore(JSON.parse(cached));
          }
        }
      })
      .catch(() => {});
  }, [readingId, userId]);

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-6 py-8">
          <p className="text-sm text-destructive text-center">{error}</p>
        </main>
      </div>
    );
  }

  if (!reading && quizStarted) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
          <div>
            <Link
              href="/readings"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Bacaan
            </Link>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 flex flex-col items-center gap-4">
            <BookOpen className="size-14 text-yellow-500" />
            <p className="text-lg font-semibold text-yellow-800">Quiz Sedang Berjalan</p>
            <p className="text-sm text-yellow-700 text-center">
              Kamu sudah memulai quiz ini. Lanjutkan untuk menyelesaikannya!
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Link
                href={`/readings/${readingId}/quiz?autostart=true`}
                className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <BookOpen className="size-4" />
                Lanjutkan Quiz
              </Link>
              <Link
                href={`/readings/${readingId}/discussion`}
                className="inline-flex items-center gap-1.5 bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                <MessageSquare className="size-4" />
                Buka Discussion
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!reading && quizCompleted) {
    const pct = quizScore
      ? Math.round((quizScore.score / quizScore.total) * 100)
      : null

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
          <div>
            <Link
              href="/readings"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Bacaan
            </Link>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 flex flex-col items-center gap-4">
            <CheckCircle2 className="size-14 text-green-500" />
            <p className="text-lg font-semibold text-green-800">Quiz Sudah Selesai</p>
            {quizScore && pct !== null && (
              <div className="text-center">
                <p className="text-3xl font-bold text-green-700">
                  {quizScore.score} / {quizScore.total}
                </p>
                <p className="text-sm text-green-600 mt-1">{pct}% benar</p>
              </div>
            )}
            <div className="flex gap-3 flex-wrap justify-center">
              <Link
                href={`/readings/${readingId}/discussion`}
                className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <MessageSquare className="size-4" />
                Buka Discussion
              </Link>
              <Link
                href="/readings"
                className="inline-flex items-center gap-1.5 bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Kembali ke Bacaan
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        <div>
          <Link
            href="/readings"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Bacaan
          </Link>
          <h1 className="text-3xl font-bold">{reading.title}</h1>
        </div>

        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
          {reading.content}
        </p>

        {quizCompleted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-500 shrink-0" />
              <span className="font-semibold text-green-700">Quiz Selesai</span>
              {quizScore && (
                <span className="ml-auto text-sm font-medium text-green-700">
                  {quizScore.score} / {quizScore.total}&nbsp;
                  ({Math.round((quizScore.score / quizScore.total) * 100)}%)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                href={`/readings/${reading.id}/discussion`}
                className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <MessageSquare className="size-4" />
                Buka Discussion
              </Link>
              <Link
                href={`/readings/${reading.id}/quiz`}
                className="inline-flex items-center gap-1.5 bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                <BookOpen className="size-4" />
                Lihat Hasil Quiz
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 mt-4">
            <Link
              href={`/readings/${reading.id}/discussion`}
              className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Go to Discussion
            </Link>
            <Link
              href={`/readings/${reading.id}/quiz`}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Go to Quiz
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
