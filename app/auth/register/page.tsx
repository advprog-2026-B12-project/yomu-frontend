"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [usernameError, setUsernameError] = useState("")

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const ALPHANUMERIC = /^[a-zA-Z0-9]*$/

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setUsername(val)
    setUsernameError(
      val && !ALPHANUMERIC.test(val)
        ? "Username hanya boleh mengandung huruf dan angka (tanpa spasi atau karakter khusus)."
        : ""
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault() 
    setLoading(true)

    if (usernameError) {
      setLoading(false)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          displayName: displayName,
          username: username, 
          email: email, 
          password: password 
        }),
      })

      if (response.ok) {
        setMessage("Akun berhasil dibikin! pindah ke halaman Login...")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else {
        setMessage("Pendaftaran gagal. Kemungkinan Username/Email udah dipakai.")
      }
    } catch (error) {
      console.error(error)
      setMessage("API nggak nyambung atau server mati.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Daftar</CardTitle>
          <CardDescription className="text-center">Bikin akun baru.</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input 
                id="displayName" 
                type="text" 
                placeholder="Display Name" 
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
                placeholder="username"
                value={username}
                onChange={handleUsernameChange}
                required
              />
              {usernameError && (
                <p className="text-xs text-red-500">{usernameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="test@gmail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <p className="text-sm font-medium text-center text-blue-600">
                {message}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading.." : "Daftar Sekarang"}
            </Button>
            
            <p className="text-sm text-center text-gray-600">
              Udah punya akun?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Login di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}