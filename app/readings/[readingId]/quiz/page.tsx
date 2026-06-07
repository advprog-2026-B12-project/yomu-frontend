"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Navbar } from "@/components/Navbar"
import { useAuth } from "@/app/providers/AuthProvider"
import { useAchievement } from "@/app/providers/AchievementProvider"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

type Option = {
  id: string
  optionText: string
}

type Question = {
  id: string
  questionText: string
  options: Option[]
}

type Reading = {
  id: string
  title: string
  questions: Question[]
}

async function getQuiz(readingId: string): Promise<Reading> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const res = await fetch(`${API}/api/quiz/${readingId}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error("Failed to fetch quiz")
  return res.json()
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ readingId: string }>
}) {
  const { readingId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId, username, isLoading } = useAuth()
  const { triggerAndNotify } = useAchievement()

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/auth/login")
    }
  }, [isLoading, username, router])

  const [reading, setReading] = useState<Reading | null>(null)
  const [loadError, setLoadError] = useState("")
  const autostart = searchParams.get("autostart") === "true"
  const [started, setStarted] = useState(autostart)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (autostart && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`quiz_draft_${readingId}`)
        if (raw) {
          const { answers: saved, savedAt } = JSON.parse(raw)
          const fresh = Date.now() - savedAt < 24 * 60 * 60 * 1000
          if (fresh && saved) return saved
          else localStorage.removeItem(`quiz_draft_${readingId}`)
        }
      } catch {}
    }
    return {}
  })
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [cachedResult, setCachedResult] = useState<{ score: number; total: number } | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    getQuiz(readingId)
      .then(setReading)
      .catch(() => setLoadError("Gagal memuat quiz."))
  }, [readingId])

  useEffect(() => {
    if (!userId) {
      if (!isLoading) setCheckingStatus(false)
      return
    }
    const token = localStorage.getItem("token")
    fetch(`${API}/api/quiz/status/${readingId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        setAlreadyCompleted(data.completed)
        if (data.completed) {
          if (data.score !== undefined && data.total !== undefined) {
            setCachedResult({ score: data.score, total: data.total })
            localStorage.setItem(
              `quiz_result_${readingId}`,
              JSON.stringify({ score: data.score, total: data.total })
            )
          } else {
            const cached = localStorage.getItem(`quiz_result_${readingId}`)
            if (cached) setCachedResult(JSON.parse(cached))
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false))
  }, [readingId, userId, isLoading])

  function handleSelect(questionId: string, optionId: string) {
    if (submitted) return
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: optionId }
      localStorage.setItem(`quiz_draft_${readingId}`, JSON.stringify({ answers: next, savedAt: Date.now() }))
      return next
    })
  }

  async function handleSubmit() {
    if (!reading) return
    const token = localStorage.getItem("token")

    setSubmitting(true)
    setSubmitError("")

    try {
      const res = await fetch(`${API}/api/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          readingId: reading.id,
          answers,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        if (res.status === 409) {
          const cached = localStorage.getItem(`quiz_result_${readingId}`)
          if (cached) setCachedResult(JSON.parse(cached))
          setAlreadyCompleted(true)
          return
        }
        throw new Error(text || "Gagal submit quiz")
      }

      const result = await res.json()
      setScore(result.score)
      setSubmitted(true)
      localStorage.setItem(
        `quiz_result_${readingId}`,
        JSON.stringify({ score: result.score, total: reading.questions.length })
      )
      localStorage.removeItem(`quiz_draft_${readingId}`)

      if (userId) {
        void triggerAndNotify(userId, "QUIZ_FINISHED")
        if (result.score === reading.questions.length && reading.questions.length > 0) {
          void triggerAndNotify(userId, "PERFECT_QUIZ_SCORE")
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal submit quiz.")
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || !username) return null

  if (loadError) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-4 py-8">
          <p className="text-sm text-destructive text-center">{loadError}</p>
        </main>
      </div>
    )
  }

  if (!reading || checkingStatus) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </main>
      </div>
    )
  }

  if (alreadyCompleted) {
    const cachedTotal = cachedResult?.total ?? 0
    const cachedScore = cachedResult?.score
    const cachedPct =
      cachedScore !== undefined && cachedTotal > 0
        ? Math.round((cachedScore / cachedTotal) * 100)
        : null

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
          <Link href="/readings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900">
            <ArrowLeft className="size-4" />
            Kembali ke Bacaan
          </Link>
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 flex flex-col items-center gap-4">
            <CheckCircle2 className="size-14 text-green-500" />
            <p className="text-lg font-bold text-green-800">Quiz Sudah Selesai</p>
            {cachedPct !== null && cachedScore !== undefined ? (
              <div className="text-center">
                <p className="text-3xl font-bold text-green-700">{cachedScore} / {cachedTotal}</p>
                <p className="text-sm text-green-600 mt-1">{cachedPct}% benar</p>
              </div>
            ) : null}
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
    )
  }

  if (!started) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{reading.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {reading.questions.length} pertanyaan menanti kamu. Pastikan sudah membaca materinya!
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setStarted(true)}>Mulai Quiz</Button>
                <Button variant="outline" asChild>
                  <Link href={`/readings/${readingId}`}>
                    <ArrowLeft className="size-4 mr-1.5" />
                    Kembali
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (submitted) {
    const total = reading.questions.length
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
          <Link href="/readings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900">
            <ArrowLeft className="size-4" />
            Kembali ke Bacaan
          </Link>
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 flex flex-col items-center gap-4">
            <CheckCircle2 className="size-14 text-green-500" />
            <p className="text-lg font-bold text-green-800">Quiz Sudah Selesai</p>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-700">{score} / {total}</p>
              <p className="text-sm text-green-600 mt-1">{percentage}% benar</p>
            </div>
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
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Quiz: {reading.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {Object.keys(answers).length} / {reading.questions.length} pertanyaan dijawab
          </p>
        </div>

        {reading.questions.map((q, index) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold leading-relaxed">
                {index + 1}. {q.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {q.options.map((o) => {
                const isSelected = answers[q.id] === o.id
                return (
                  <label
                    key={o.id}
                    className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={isSelected}
                      onChange={() => handleSelect(q.id, o.id)}
                      className="shrink-0"
                    />
                    <span className="text-sm">{o.optionText}</span>
                  </label>
                )
              })}
            </CardContent>
          </Card>
        ))}

        {submitError && (
          <p className="text-sm text-destructive text-center">{submitError}</p>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={
              submitting ||
              Object.keys(answers).length < reading.questions.length
            }
          >
            {submitting ? "Mengirim..." : "Submit Jawaban"}
          </Button>
          <p className="text-xs text-muted-foreground self-center">
            {reading.questions.length - Object.keys(answers).length > 0
              ? `Masih ada ${reading.questions.length - Object.keys(answers).length} pertanyaan belum dijawab`
              : "Semua pertanyaan sudah dijawab!"}
          </p>
        </div>
      </main>
    </div>
  )
}
