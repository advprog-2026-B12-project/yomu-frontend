"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Shield, PlusCircle, Trophy } from "lucide-react"
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
import { getClans } from "@/features/clans/api"
import type { Clan } from "@/features/clans/types"

const DIVISION_COLORS: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-800",
  SILVER: "bg-gray-100 text-gray-700",
  GOLD: "bg-yellow-100 text-yellow-800",
  DIAMOND: "bg-blue-100 text-blue-700",
}

function ClanSkeleton() {
  return (
    <div className="border rounded-xl p-5 flex flex-col gap-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2 mt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}

export default function ClansPage() {
  const router = useRouter()
  const { username, isLoading } = useAuth()
  const [clans, setClans] = useState<Clan[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/")
    }
  }, [isLoading, username, router])

  useEffect(() => {
    if (isLoading) return
    let mounted = true
    const load = async () => {
      if (mounted) setFetching(true)
      try {
        const data = await getClans()
        if (mounted) setClans(data)
      } catch {
        if (mounted) setError("Gagal memuat daftar clan. Coba refresh halaman.")
      } finally {
        if (mounted) setFetching(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [isLoading])

  if (isLoading || !username) return null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clans</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bergabunglah dengan clan dan bersaing di liga!
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/clans/leaderboard">
                <Trophy className="size-4 mr-1.5" />
                Leaderboard
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/clans/create">
                <PlusCircle className="size-4 mr-1.5" />
                Buat Clan
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        )}

        {fetching ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => <ClanSkeleton key={i} />)}
          </div>
        ) : clans.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Shield className="size-10 opacity-30" />
            <p className="text-sm">Belum ada clan yang tersedia.</p>
            <Button asChild size="sm">
              <Link href="/clans/create">Buat yang pertama!</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {clans.map((clan) => (
              <Card key={clan.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{clan.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {clan.description || "Tidak ada deskripsi."}
                      </CardDescription>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        DIVISION_COLORS[clan.division] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {clan.division}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="size-3.5" />
                    {clan.memberCount} anggota
                  </span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/clans/${clan.id}`}>Lihat Detail</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
