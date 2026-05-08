"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers/AuthProvider"
import { Navbar } from "@/components/Navbar"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { username, role, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/")
    }
  }, [isLoading, username, router])

  useEffect(() => {
    if (!isLoading && username && role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [isLoading, username, role, router])

  if (isLoading || !username || role !== "ADMIN") return null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex flex-col items-center justify-center flex-1 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Panel manajemen admin akan ditampilkan di sini.</p>
        </div>
      </main>
    </div>
  )
}
