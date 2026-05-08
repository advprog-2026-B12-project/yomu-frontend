"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ALPHANUMERIC = /^[a-zA-Z0-9]*$/

export default function CompleteRegistrationPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem("sso_pending")
    if (!raw) {
      router.replace("/auth/login")
      return
    }

    try {
      const { email, googleName } = JSON.parse(raw) as { email: string; googleName: string }
      setEmail(email)
      setDisplayName(googleName)
    } catch {
      router.replace("/auth/login")
      return
    }

    setIsReady(true)
  }, [router])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setUsername(val)
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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL

      const payload = { displayName, username, email, password }
      console.log("[SSO Complete Registration] Payload:", payload)

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        sessionStorage.removeItem("sso_pending")
        const data = await response.json().catch(() => null)
        if (data?.token && data?.user?.username) {
          login(data.token, {
            userId: String(data.user.userId ?? ""),
            username: data.user.username,
            displayName: data.user.displayName ?? data.user.username,
            role: data.user.role ?? "PELAJAR",
          })
          router.push(data.user.role === "ADMIN" ? "/admin-dashboard" : "/dashboard")
        } else {
          setIsError(false)
          setMessage("Akun berhasil dibuat! Mengarahkan ke halaman login...")
          setTimeout(() => router.push("/auth/login"), 2000)
        }
      } else {
        const data = await response.json().catch(() => null)
        setIsError(true)
        setMessage(
          data?.message ?? "Pendaftaran gagal. Kemungkinan username/email sudah dipakai."
        )
      }
    } catch {
      setIsError(true)
      setMessage("API nggak nyambung atau server mati.")
    } finally {
      setLoading(false)
    }
  }

  if (!isReady) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Lengkapi Profil</CardTitle>
          <CardDescription className="text-center">
            Satu langkah lagi untuk menyelesaikan pendaftaran via Google.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Nama tampilan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="username (huruf & angka)"
                value={username}
                onChange={handleUsernameChange}
                required
              />
              {usernameError && (
                <p className="text-xs text-red-500">{usernameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <p className={`text-sm font-medium text-center ${isError ? "text-red-500" : "text-blue-600"}`}>
                {message}
              </p>
            )}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !!usernameError}
            >
              {loading ? "Mendaftar..." : "Selesaikan Pendaftaran"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
