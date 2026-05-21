"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { QuestionManager } from "@/features/quiz/components/admin/QuestionManager"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

type Reading = { id: string; title: string; content: string }

export default function AdminReadingDetailPage({
  params,
}: {
  params: Promise<{ readingId: string }>
}) {
  const { readingId } = use(params)
  const [reading, setReading] = useState<Reading | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch(`${API}/api/admin/readings/${readingId}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
      .then(setReading)
      .catch(() => setError("Gagal memuat bacaan."))
  }, [readingId])

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-destructive">{error}</p>
      </main>
    )
  }

  if (!reading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <Link
          href="/admin/readings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Daftar Bacaan
        </Link>
        <h1 className="text-2xl font-bold">{reading.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {reading.content}
        </p>
      </div>

      <div className="border-t pt-6">
        <QuestionManager readingId={reading.id} />
      </div>
    </main>
  )
}
