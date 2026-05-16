"use client"

import Link from "next/link"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { username, role, logout } = useAuth()

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-blue-600">
          Dashboard
        </Link>
        {role === "ADMIN" && (
          <Link href="/admin-dashboard" className="text-sm font-medium text-blue-600 hover:underline">
            Admin Dashboard
          </Link>
        )}
        <Link href="/achievements" className="text-sm font-medium text-gray-700 hover:text-blue-600">
          Achievements
        </Link>
        <Link href="/settings" className="text-sm font-medium text-gray-700 hover:text-blue-600">
          Pengaturan
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{username}</span>
        <Button variant="outline" size="sm" onClick={logout}>
          Keluar
        </Button>
      </div>
    </nav>
  )
}
