"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Trophy, Star, CalendarCheck, RotateCcw } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

const ADMIN_MENUS = [
  {
    href: "/admin/readings",
    icon: BookOpen,
    title: "Kelola Bacaan & Kuis",
    description: "Tambah, edit, dan hapus teks bacaan beserta soal kuisnya.",
  },
  {
    href: "/admin/achievements",
    icon: Star,
    title: "Kelola Achievement",
    description: "Buat achievement baru dengan event type dan milestone tertentu.",
  },
  {
    href: "/admin/daily-missions",
    icon: CalendarCheck,
    title: "Kelola Daily Mission",
    description: "Buat, edit, dan hapus misi harian untuk pelajar.",
  },
]

export default function AdminDashboardPage() {
  const router = useRouter()
  const { username, role, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !username) router.push("/")
  }, [isLoading, username, router])

  useEffect(() => {
    if (!isLoading && username && role !== "ADMIN") router.push("/dashboard")
  }, [isLoading, username, role, router])

  async function handleSeasonReset() {
    if (!window.confirm("Yakin ingin reset season liga? Semua data divisi akan direset.")) return
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API}/api/league/season/reset`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) alert("Season reset berhasil!")
      else alert("Gagal reset season.")
    } catch {
      alert("API tidak bisa dihubungi.")
    }
  }

  if (isLoading || !username || role !== "ADMIN") return null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang, {username}. Pilih menu di bawah untuk mengelola konten.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ADMIN_MENUS.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="size-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-sm">{title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Season Reset */}
          <Card className="sm:col-span-2 border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100">
                  <RotateCcw className="size-4 text-orange-600" />
                </div>
                <CardTitle className="text-sm">Reset Season Liga</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <CardDescription>
                Reset semua divisi clan ke BRONZE dan mulai season baru. Tindakan ini tidak bisa dibatalkan.
              </CardDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeasonReset}
                className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Trophy className="size-4 mr-1.5" />
                Reset Season
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
