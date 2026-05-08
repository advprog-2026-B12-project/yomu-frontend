"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GoogleLogin } from "@react-oauth/google"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        const user = data.user
        if (!data.token || !user?.username) {
          setMessage("Login gagal: response tidak valid dari server.")
          return
        }
        login(data.token, {
          userId: String(user.userId ?? ""),
          username: user.username,
          displayName: user.displayName ?? user.username,
        })
        router.push("/dashboard")
      } else {
        setMessage("Login Gagal. Cek lagi username/password.")
      }
    } catch (error) {
      console.error(error)
      setMessage("API nggak nyambung atau server mati.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return
    setMessage("")

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL

      const response = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      })

      const data = await response.json()
      console.log("[Google SSO] Backend response:", data)

      if (response.ok && data.token) {
        const user = data.user
        if (!user?.username) {
          setMessage("Login Google gagal: response tidak mengandung data user.")
          return
        }
        login(data.token, {
          userId: String(user.userId ?? ""),
          username: user.username,
          displayName: user.displayName ?? user.username,
        })
        router.push("/dashboard")
        return
      }

      if (data.needsRegistration) {
        // New user — send to profile completion page
        sessionStorage.setItem(
          "sso_pending",
          JSON.stringify({ email: data.user.email, googleName: data.user.displayName ?? "" })
        )
        router.push("/auth/register/complete")
        return
      }

      setMessage("Login Google gagal. Coba lagi.")
    } catch (error) {
      console.error(error)
      setMessage("API nggak nyambung atau server mati.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Masukkan akun untuk lanjut.</CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username/Email</Label>
              <Input
                id="username"
                type="text"
                placeholder="username/email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <p className="text-sm font-medium text-center text-blue-600">{message}</p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading.." : "Masuk"}
            </Button>

            <div className="relative w-full flex items-center gap-2">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">atau</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setMessage("Login Google dibatalkan atau gagal.")}
                width="100%"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            <p className="text-sm text-center text-gray-600">
              Belum punya akun?{" "}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
