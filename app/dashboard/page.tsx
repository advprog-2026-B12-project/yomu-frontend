"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers/AuthProvider"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const router = useRouter()
  const { username, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/")
    }
  }, [isLoading, username, router])

  if (isLoading || !username) return null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex flex-col items-center justify-center flex-1 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Halo, <span className="text-blue-600">{username}</span>! 👋
          </h1>
          <Button
            variant="destructive"
            className="w-full"
            onClick={logout}
          >
            Keluar (Logout)
          </Button>
        </div>
      </main>
    </div>
  )
}