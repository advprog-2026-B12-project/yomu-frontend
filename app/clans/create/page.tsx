"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClan } from "@/features/clans/api"

export default function CreateClanPage() {
  const router = useRouter()
  const { username, isLoading } = useAuth()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  if (isLoading) return null
  if (!username) {
    router.push("/")
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      await createClan({ name, description: description || undefined })
      setIsError(false)
      setMessage("Clan berhasil dibuat!")
      setTimeout(() => router.push("/clans"), 1200)
    } catch (err) {
      setIsError(true)
      setMessage(err instanceof Error ? err.message : "Gagal membuat clan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Buat Clan</CardTitle>
          <CardDescription className="text-center">
            Kamu akan menjadi pemimpin clan ini.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Clan</Label>
              <Input
                id="name"
                placeholder="Nama clan kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Ceritain sedikit tentang clan kamu (opsional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={3}
              />
            </div>

            {message && (
              <p className={`text-sm font-medium text-center ${isError ? "text-red-500" : "text-blue-600"}`}>
                {message}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Membuat..." : "Buat Clan"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              <Link href="/clans" className="text-blue-600 hover:underline">
                Kembali ke daftar clan
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
