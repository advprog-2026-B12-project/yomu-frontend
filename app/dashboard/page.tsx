"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    
    if (!storedUsername) {
      console.log("Balik ke login!")
      router.push("/")
    } else {
      setUsername(storedUsername)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("username")
    
    console.log("Sesi dihapus, balik ke login!")
    router.push("/")
  }

  if (!username) return null 

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Halo, <span className="text-blue-600">{username}</span>! 👋
        </h1>
        
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          Keluar (Logout)
        </Button>
      </div>
    </div>
  )
}