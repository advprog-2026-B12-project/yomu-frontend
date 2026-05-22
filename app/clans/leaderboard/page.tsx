"use client";

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trophy, Medal } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getLeaderboardByDivision, getMyLeaderboard } from "@/features/clans/api"
import type { LeaderboardEntry } from "@/features/clans/types"

const DIVISIONS = ["BRONZE", "SILVER", "GOLD", "DIAMOND"] as const
type Division = (typeof DIVISIONS)[number]

const DIVISION_STYLES: Record<Division, { tab: string; badge: string }> = {
  BRONZE: {
    tab: "data-[active=true]:border-amber-700 data-[active=true]:text-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  SILVER: {
    tab: "data-[active=true]:border-gray-500 data-[active=true]:text-gray-700",
    badge: "bg-gray-100 text-gray-700",
  },
  GOLD: {
    tab: "data-[active=true]:border-yellow-500 data-[active=true]:text-yellow-700",
    badge: "bg-yellow-100 text-yellow-800",
  },
  DIAMOND: {
    tab: "data-[active=true]:border-blue-500 data-[active=true]:text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
}

const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border rounded-xl px-4 py-3">
          <Skeleton className="size-7 rounded-full shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { username, isLoading } = useAuth()

  const [tab, setTab] = useState<Division | "MY">("MY")
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setFetching(true)
    setError("")
    try {
      if (tab === "MY") {
        const data = await getMyLeaderboard()
        setEntries(data)
      } else {
        const data = await getLeaderboardByDivision(tab)
        setEntries(data)
      }
    } catch (err) {
      const status = (err as { status?: number }).status
      if (tab === "MY" && (status === 400 || status === 404)) {
        setError("Kamu belum bergabung dengan clan manapun.")
      } else {
        setError("Gagal memuat leaderboard. Coba refresh halaman.")
      }
      setEntries([])
    } finally {
      setFetching(false)
    }
  }, [tab])

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/")
      return
    }
    if (!isLoading) {
      queueMicrotask(() => {
        load();
      });
    }
  }, [isLoading, username, router, load]);

  if (isLoading || !username) return null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href="/clans">
              <ArrowLeft className="size-4 mr-1.5" />
              Kembali ke Clans
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Trophy className="size-6 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard Liga</h1>
              <p className="text-sm text-muted-foreground">Peringkat clan berdasarkan divisi</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto pb-0">
          <button
            onClick={() => setTab("MY")}
            data-active={tab === "MY"}
            className="px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent data-[active=true]:border-blue-600 data-[active=true]:text-blue-600 whitespace-nowrap transition-colors"
          >
            Divisi Saya
          </button>
          {DIVISIONS.map((div) => (
            <button
              key={div}
              onClick={() => setTab(div)}
              data-active={tab === div}
              className={`px-4 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent whitespace-nowrap transition-colors ${DIVISION_STYLES[div].tab}`}
            >
              {div}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="size-4" />
              {tab === "MY" ? "Divisi Kamu" : `Divisi ${tab}`}
            </CardTitle>
            <CardDescription>
              {entries.length} clan terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <LeaderboardSkeleton />
            ) : error ? (
              <p className="text-sm text-destructive text-center py-8">{error}</p>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Trophy className="size-8 opacity-30" />
                <p className="text-sm">Belum ada data leaderboard.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <div
                    key={entry.clanId}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                      entry.rank <= 3 ? "bg-gray-50" : ""
                    }`}
                  >
                    <span className="w-7 text-center font-bold shrink-0">
                      {RANK_ICONS[entry.rank] ?? (
                        <span className="text-sm text-muted-foreground">#{entry.rank}</span>
                      )}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{entry.clanName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.memberCount} anggota
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {entry.activeModifiers?.length > 0 && (
                        <div className="flex gap-1">
                          {entry.activeModifiers.map((mod) => {
                            const isDebuff = /penalty|debuff/i.test(mod)
                            return (
                              <span
                                key={mod}
                                title={mod}
                                className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                                  isDebuff
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {isDebuff ? "▼" : "▲"} {mod}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          DIVISION_STYLES[entry.division as Division]?.badge ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {entry.division}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-gray-900">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
