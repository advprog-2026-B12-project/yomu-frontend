"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers/AuthProvider"

export default function HomePage() {
  const router = useRouter()
  const { username, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    router.replace(username ? "/dashboard" : "/auth/login")
  }, [isLoading, username, router])

  return null
}
