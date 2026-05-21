"use client"

import { useCallback, useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, Shield, Crown, UserPlus, LogOut, Trash2, Check, X } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  getClan,
  getClanMembers,
  getPendingJoinRequests,
  requestToJoinClan,
  approveJoinRequest,
  rejectJoinRequest,
  leaveClan,
  deleteClan,
} from "@/features/clans/api"
import type { Clan, ClanMember, ClanJoinRequest } from "@/features/clans/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

async function fetchDisplayName(userId: string): Promise<string> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const res = await fetch(`${API_BASE}/api/users/${userId}`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: "no-store",
    })
    if (!res.ok) return userId.slice(0, 8)
    const data = await res.json()
    return data.displayName ?? data.username ?? userId.slice(0, 8)
  } catch {
    return userId.slice(0, 8)
  }
}

const DIVISION_COLORS: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-800",
  SILVER: "bg-gray-100 text-gray-700",
  GOLD: "bg-yellow-100 text-yellow-800",
  DIAMOND: "bg-blue-100 text-blue-700",
}


export default function ClanDetailPage({
  params,
}: {
  params: Promise<{ clanId: string }>
}) {
  const { clanId } = use(params)
  const numericClanId = Number(clanId)

  const router = useRouter()
  const { userId, username, isLoading } = useAuth()

  const [clan, setClan] = useState<Clan | null>(null)
  const [members, setMembers] = useState<ClanMember[]>([])
  const [memberNames, setMemberNames] = useState<Record<string, string>>({})
  const [joinRequests, setJoinRequests] = useState<ClanJoinRequest[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState("")
  const [isActionError, setIsActionError] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const myMembership = members.find((m) => m.userId === userId)
  const isLeader = myMembership?.role === "LEADER"
  const isMember = Boolean(myMembership)

  const load = useCallback(async () => {
    setFetching(true)
    setError("")
    try {
      const [clanData, memberData] = await Promise.all([
        getClan(numericClanId),
        getClanMembers(numericClanId),
      ])
      setClan(clanData)
      setMembers(memberData)

      const nameEntries = await Promise.all(
        memberData.map(async (m) => [m.userId, await fetchDisplayName(m.userId)] as const)
      )
      setMemberNames(Object.fromEntries(nameEntries))

      if (memberData.find((m) => m.role === "LEADER" && m.userId === userId)) {
        const requests = await getPendingJoinRequests(numericClanId).catch(() => [])
        const pending = requests.filter((r) => r.status === "PENDING")
        setJoinRequests(pending)

        const extraEntries = await Promise.all(
          pending
            .filter((r) => !nameEntries.some(([id]) => id === r.userId))
            .map(async (r) => [r.userId, await fetchDisplayName(r.userId)] as const)
        )
        if (extraEntries.length > 0) {
          setMemberNames((prev) => ({ ...prev, ...Object.fromEntries(extraEntries) }))
        }
      }
    } catch {
      setError("Gagal memuat data clan. Coba refresh halaman.")
    } finally {
      setFetching(false)
    }
  }, [numericClanId, userId])

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/")
      return
    }
    if (!isLoading) load()
  }, [isLoading, username, router, load])

  async function handleJoin() {
    setActionLoading(true)
    setActionMsg("")
    try {
      await requestToJoinClan(numericClanId)
      setIsActionError(false)
      setActionMsg("Permintaan bergabung terkirim! Tunggu persetujuan leader.")
    } catch (err) {
      setIsActionError(true)
      setActionMsg(err instanceof Error ? err.message : "Gagal mengirim permintaan.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleLeave() {
    setActionLoading(true)
    try {
      await leaveClan()
      router.push("/clans")
    } catch (err) {
      setIsActionError(true)
      setActionMsg(err instanceof Error ? err.message : "Gagal keluar dari clan.")
      setLeaveDialogOpen(false)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    try {
      await deleteClan(numericClanId)
      router.push("/clans")
    } catch (err) {
      setIsActionError(true)
      setActionMsg(err instanceof Error ? err.message : "Gagal menghapus clan.")
      setDeleteDialogOpen(false)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleApprove(requestId: number) {
    setActionLoading(true)
    try {
      await approveJoinRequest(requestId)
      await load()
      setIsActionError(false)
      setActionMsg("Permintaan disetujui.")
    } catch (err) {
      setIsActionError(true)
      setActionMsg(err instanceof Error ? err.message : "Gagal menyetujui permintaan.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(requestId: number) {
    setActionLoading(true)
    try {
      await rejectJoinRequest(requestId)
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
      setIsActionError(false)
      setActionMsg("Permintaan ditolak.")
    } catch (err) {
      setIsActionError(true)
      setActionMsg(err instanceof Error ? err.message : "Gagal menolak permintaan.")
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading || !username) return null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
            <Link href="/clans">
              <ArrowLeft className="size-4 mr-1.5" />
              Kembali
            </Link>
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center py-4">{error}</p>
          )}

          {actionMsg && (
            <p className={`text-sm font-medium text-center mb-4 ${isActionError ? "text-red-500" : "text-blue-600"}`}>
              {actionMsg}
            </p>
          )}
        </div>

        {fetching ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : clan ? (
          <>
            {/* Clan Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-xl">{clan.name}</CardTitle>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          DIVISION_COLORS[clan.division] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {clan.division}
                      </span>
                    </div>
                    <CardDescription className="mt-2">
                      {clan.description || "Tidak ada deskripsi."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" />
                    {clan.memberCount} anggota
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="size-4" />
                    {clan.division}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!isMember && (
                    <Button
                      size="sm"
                      onClick={handleJoin}
                      disabled={actionLoading}
                    >
                      <UserPlus className="size-4 mr-1.5" />
                      Request Join
                    </Button>
                  )}
                  {isMember && !isLeader && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLeaveDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      <LogOut className="size-4 mr-1.5" />
                      Keluar
                    </Button>
                  )}
                  {isLeader && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={actionLoading}
                    >
                      <Trash2 className="size-4 mr-1.5" />
                      Hapus Clan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Join Requests (leader only) */}
            {isLeader && joinRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Permintaan Bergabung</CardTitle>
                  <CardDescription>
                    {joinRequests.length} permintaan menunggu persetujuanmu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {joinRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-3 border rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {(memberNames[req.userId] ?? req.userId).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{memberNames[req.userId] ?? req.userId.slice(0, 8)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading}
                          className="gap-1"
                        >
                          <Check className="size-3" />
                          Setujui
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading}
                          className="gap-1"
                        >
                          <X className="size-3" />
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Anggota ({members.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada anggota.
                  </p>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {(memberNames[member.userId] ?? member.userId).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {memberNames[member.userId] ?? member.userId.slice(0, 8)}
                            {member.userId === userId && (
                              <span className="ml-1 text-xs text-muted-foreground">(Kamu)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium flex items-center gap-1 ${
                          member.role === "LEADER" ? "text-amber-600" : "text-muted-foreground"
                        }`}
                      >
                        {member.role === "LEADER" && <Crown className="size-3" />}
                        {member.role}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

        {/* Leave Dialog */}
        <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keluar dari Clan</DialogTitle>
              <DialogDescription>
                Apakah kamu yakin ingin keluar dari clan ini? Kamu bisa bergabung kembali nanti.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLeaveDialogOpen(false)} disabled={actionLoading}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleLeave} disabled={actionLoading}>
                {actionLoading ? "Memproses..." : "Keluar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Clan</DialogTitle>
              <DialogDescription>
                Apakah kamu yakin ingin menghapus clan ini? Tindakan ini tidak bisa dibatalkan dan semua anggota akan dikeluarkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? "Menghapus..." : "Hapus"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
