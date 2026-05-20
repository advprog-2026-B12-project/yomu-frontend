"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle } from "lucide-react"
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
  correct: boolean
}

type Question = {
  id: string
  questionText: string
  options: Option[]
}

type Reading = {
  id: string
  title: string
  content: string
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
  const { userId, username } = useAuth()
  const { triggerAndNotify } = useAchievement()

  const [reading, setReading] = useState<Reading | null>(null)
  const [loadError, setLoadError] = useState("")
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  useEffect(() => {
    getQuiz(readingId)
      .then(setReading)
      .catch(() => setLoadError("Gagal memuat quiz."))
  }, [readingId])

  useEffect(() => {
    if (!userId) return
    const token = localStorage.getItem("token")
    fetch(`${API}/api/quiz/status/${readingId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setAlreadyCompleted(data.completed))
      .catch(() => {})
  }, [readingId, userId])

  function handleSelect(questionId: string, optionId: string) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  async function handleSubmit() {
    if (!reading) return
    const token = localStorage.getItem("token")
    const formattedAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }))

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
          answers: formattedAnswers,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        if (res.status === 409) {
          setAlreadyCompleted(true)
          return
        }
        throw new Error(text || "Gagal submit quiz")
      }

      const result = await res.json()
      setScore(result.score)
      setSubmitted(true)

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

  if (!reading) {
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
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <CheckCircle className="size-12 text-green-500" />
              <p className="text-lg font-semibold">Quiz sudah dikerjakan</p>
              <p className="text-sm text-muted-foreground">
                Kamu sudah menyelesaikan quiz ini sebelumnya.
              </p>
              <Button asChild variant="outline">
                <Link href={`/readings/${readingId}`}>
                  <ArrowLeft className="size-4 mr-1.5" />
                  Kembali ke Reading
                </Link>
              </Button>
            </CardContent>
          </Card>
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
              {!username && (
                <p className="text-sm text-amber-600">
                  Kamu harus{" "}
                  <Link href="/auth/login" className="underline">login</Link>{" "}
                  untuk menyimpan hasil quiz.
                </p>
              )}
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
        <main className="max-w-2xl mx-auto w-full px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center gap-6 py-12">
              <CheckCircle className="size-14 text-green-500" />
              <div className="text-center">
                <p className="text-2xl font-bold">{score} / {total}</p>
                <p className="text-sm text-muted-foreground mt-1">{percentage}% benar</p>
              </div>
              <p className="text-sm text-center text-muted-foreground max-w-xs">
                {percentage >= 80
                  ? "Luar biasa! Kamu sangat menguasai materi ini."
                  : percentage >= 60
                  ? "Bagus! Terus belajar untuk hasil yang lebih baik."
                  : "Jangan menyerah, coba baca ulang materinya!"}
              </p>
              <Button asChild variant="outline">
                <Link href={`/readings/${readingId}`}>
                  <ArrowLeft className="size-4 mr-1.5" />
                  Kembali ke Reading
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/readings/${readingId}`}>
              <ArrowLeft className="size-4 mr-1.5" />
              Kembali
            </Link>
          </Button>
          <h1 className="text-xl font-bold mt-3">Quiz: {reading.title}</h1>
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
