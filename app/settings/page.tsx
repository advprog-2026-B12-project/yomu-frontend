"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ALPHANUMERIC = /^[a-zA-Z0-9]*$/

export default function SettingsPage() {
  const router = useRouter()
  const { username, isLoading, logout } = useAuth()

  const [displayName, setDisplayName] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/")
    }
  }, [isLoading, username, router])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewUsername(val)
    setUsernameError(
      val && !ALPHANUMERIC.test(val)
        ? "Username hanya boleh mengandung huruf dan angka (tanpa spasi atau karakter khusus)."
        : ""
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameError) return

    setLoading(true)
    setMessage("")

    const token = localStorage.getItem("token")

    const body: Record<string, string> = {}
    if (displayName) body.displayName = displayName
    if (newUsername) body.username = newUsername
    if (oldPassword) body.oldPassword = oldPassword
    if (newPassword) body.newPassword = newPassword

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.status === 401) {
        logout()
        return
      }

      if (response.ok) {
        // Sync localStorage before navigating so AuthProvider reads the
        // correct values on the next mount.
        if (newUsername) localStorage.setItem("username", newUsername)
        if (displayName) localStorage.setItem("displayName", displayName)
        setIsError(false)
        setMessage("Profil berhasil diperbarui!")
        setOldPassword("")
        setNewPassword("")
        router.push("/")
      } else {
        setIsError(true)
        setMessage("Gagal memperbarui profil. Cek kembali data yang dimasukkan.")
      }
    } catch {
      setIsError(true)
      setMessage("API nggak nyambung atau server mati.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/users/account`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })

      if (response.ok) {
        logout()
        router.push("/auth/login")
      } else if (response.status === 401) {
        logout()
      } else {
        setIsError(true)
        setMessage("Gagal menghapus akun. Coba lagi.")
      }
    } catch {
      setIsError(true)
      setMessage("API nggak nyambung atau server mati.")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !username) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Pengaturan Profil</CardTitle>
          <CardDescription className="text-center">
            Kosongkan field yang tidak ingin diubah.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder={username}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newUsername">Username</Label>
              <Input
                id="newUsername"
                type="text"
                placeholder={username}
                value={newUsername}
                onChange={handleUsernameChange}
              />
              {usernameError && (
                <p className="text-xs text-red-500">{usernameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="oldPassword">Password Lama</Label>
              <Input
                id="oldPassword"
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {message && (
              <p className={`text-sm font-medium text-center ${isError ? "text-red-500" : "text-blue-600"}`}>
                {message}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !!usernameError}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={loading}
              onClick={handleDeleteAccount}
            >
              Hapus Akun
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
