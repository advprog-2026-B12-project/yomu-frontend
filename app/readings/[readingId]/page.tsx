"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { useAchievement } from "@/app/providers/AchievementProvider"
import { Navbar } from "@/components/Navbar"
import { Skeleton } from "@/components/ui/skeleton"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

type Reading = {
  id: string
  title: string
  content: string
}

export default function ReadingPage({
  params,
}: {
  params: Promise<{ readingId: string }>
}) {
  const { readingId } = use(params)
  const { userId } = useAuth()
  const { triggerAndNotify } = useAchievement()

  const [reading, setReading] = useState<Reading | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch(`${API}/api/readings/${readingId}`, {
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
      .then((data: Reading) => {
        setReading(data)
        if (userId) void triggerAndNotify(userId, "READING_COMPLETED")
      })
      .catch(() => setError("Gagal memuat bacaan."))
  }, [readingId, userId, triggerAndNotify])

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto w-full px-6 py-8">
          <p className="text-sm text-destructive text-center">{error}</p>
        </main>
      </div>
    )
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
    )
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
      </main>
    </div>
  )
}
