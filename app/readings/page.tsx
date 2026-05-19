"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, CheckCircle2, Circle } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { Navbar } from "@/components/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

type ReadingItem = {
  id: string
  title: string
  category?: string
  completed: boolean
}

function ReadingSkeleton() {
  return (
    <div className="border rounded-xl p-5 flex flex-col gap-3">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-24 rounded-full" />
    </div>
  )
}

export default function ReadingsPage() {
  const router = useRouter()
  const { userId, username, isLoading } = useAuth()
  const [readings, setReadings] = useState<ReadingItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/")
    }
  }, [isLoading, username, router])

  useEffect(() => {
    if (isLoading || !userId) return
    let mounted = true
    const load = async () => {
      const token = localStorage.getItem("token")
      if (mounted) setFetching(true)
      try {
        const res = await fetch(`${API}/api/quiz/all`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        if (mounted) setReadings(data)
      } catch {
        if (mounted) setError("Gagal memuat daftar bacaan. Coba refresh halaman.")
      } finally {
        if (mounted) setFetching(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [isLoading, userId])

  if (isLoading || !username) return null

  const completed = readings.filter((r) => r.completed).length
  const total = readings.length

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bacaan</h1>
          {!fetching && total > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {completed} / {total} quiz selesai
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        )}

        {fetching ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => <ReadingSkeleton key={i} />)}
          </div>
        ) : readings.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <BookOpen className="size-10 opacity-30" />
            <p className="text-sm">Belum ada bacaan tersedia.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {readings.map((reading) => (
              <Link key={reading.id} href={`/readings/${reading.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base leading-snug">{reading.title}</CardTitle>
                      <span className="shrink-0 mt-0.5">
                        {reading.completed ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground/40" />
                        )}
                      </span>
                    </div>
                    {reading.category && (
                      <CardDescription>{reading.category}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        reading.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {reading.completed ? "Quiz Selesai" : "Belum Dikerjakan"}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
