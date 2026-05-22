"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function Navbar() {
  const { username, role, logout } = useAuth();

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-gray-700 hover:text-blue-600"
        >
          Dashboard
        </Link>
        <Link
          href="/readings"
          className="text-sm font-medium text-gray-700 hover:text-blue-600"
        >
          Readings
        </Link>
        <Link
          href="/clans"
          className="text-sm font-medium text-gray-700 hover:text-blue-600"
        >
          Clans
        </Link>
        <Link
          href="/clans/leaderboard"
          className="text-sm font-medium text-gray-700 hover:text-blue-600"
        >
          Liga
        </Link>
        <Link
          href="/achievements"
          className="text-sm font-medium text-gray-700 hover:text-blue-600"
        >
          Achievements
        </Link>
        {role === "ADMIN" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 outline-none">
                Admin <ChevronDown className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/admin-dashboard">Admin Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/readings">Kelola Bacaan & Kuis</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/achievements">Kelola Achievement</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/daily-missions">Kelola Daily Mission</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Link
          href="/settings"
          className="text-sm font-medium text-gray-700 hover:text-blue-600"
        >
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
  );
}
