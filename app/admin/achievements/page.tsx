"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trophy } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAllAchievements,
  createAchievement,
  triggerAchievementEvent,
} from "@/features/achievements/api";
import type { AchievementResponse, AchievementRequest, EventTriggerResponse } from "@/features/achievements/types";
import { ACHIEVEMENT_EVENT_TYPES } from "@/features/achievements/types";

function AchievementSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border p-5 flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM: AchievementRequest = {
  name: "",
  description: "",
  iconUrl: "",
  points: 0,
  milestone: 1,
  eventType: ACHIEVEMENT_EVENT_TYPES[0],
};

export default function AdminAchievementsPage() {
  const router = useRouter();
  const { username, role, isLoading } = useAuth();

  const [achievements, setAchievements] = useState<AchievementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AchievementRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [triggerUserId, setTriggerUserId] = useState("");
  const [triggerEventType, setTriggerEventType] = useState<string>(ACHIEVEMENT_EVENT_TYPES[0]);
  const [triggerResult, setTriggerResult] = useState<EventTriggerResponse | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !username) router.push("/");
    if (!isLoading && username && role !== "ADMIN") router.push("/dashboard");
  }, [isLoading, username, role, router]);

  useEffect(() => {
    fetchAllAchievements()
      .then(setAchievements)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.eventType) {
      setFormError("Nama, deskripsi, dan event type wajib diisi.");
      return;
    }
    if (form.points < 0 || form.milestone < 1) {
      setFormError("Poin tidak boleh negatif, milestone minimal 1.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createAchievement({
        name: form.name.trim(),
        description: form.description.trim(),
        iconUrl: form.iconUrl?.trim() || undefined,
        points: Number(form.points),
        milestone: Number(form.milestone),
        eventType: form.eventType,
      });
      setAchievements((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setOpen(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Gagal membuat achievement");
    } finally {
      setSaving(false);
    }
  };

  const handleTrigger = async () => {
    if (!triggerUserId.trim()) {
      setTriggerError("User ID wajib diisi.");
      return;
    }
    setTriggering(true);
    setTriggerError(null);
    setTriggerResult(null);
    try {
      const result = await triggerAchievementEvent(triggerUserId.trim(), triggerEventType);
      setTriggerResult(result);
    } catch (e: unknown) {
      setTriggerError(e instanceof Error ? e.message : "Gagal trigger event");
    } finally {
      setTriggering(false);
    }
  };

  if (isLoading || !username || role !== "ADMIN") return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kelola Achievement</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Buat achievement baru dengan event type dan milestone tertentu.
            </p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setFormError(null); setOpen(true); }}>
            <PlusIcon />
            Achievement Baru
          </Button>
        </div>

        <Separator />

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {loading ? (
          <AchievementSkeleton />
        ) : achievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <Trophy className="size-12 opacity-25" />
            <p className="text-sm">Belum ada achievement. Buat yang pertama!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {achievements.map((ach) => (
              <Card key={ach.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">{ach.name}</CardTitle>
                      <CardDescription className="mt-0.5">{ach.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
                        {ach.eventType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Milestone: {ach.milestone} · {ach.points} poin
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Trigger Achievement Event */}
        <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50/50 p-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-700">Trigger Achievement Event</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kirim event ke user tertentu untuk memicu progress achievement dan daily mission.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">User ID (UUID)</label>
                <input
                  type="text"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={triggerUserId}
                  onChange={(e) => setTriggerUserId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Event Type</label>
                <select
                  value={triggerEventType}
                  onChange={(e) => setTriggerEventType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {ACHIEVEMENT_EVENT_TYPES.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </div>
            </div>
            {triggerError && <p className="text-xs text-destructive">{triggerError}</p>}
            {triggerResult && (
              <div className="rounded-md bg-white border p-3 text-xs flex flex-col gap-1">
                <p className="font-medium text-green-700">Event berhasil dikirim</p>
                <p className="text-muted-foreground">
                  Achievement unlocked: {triggerResult.unlockedAchievements.length > 0
                    ? triggerResult.unlockedAchievements.map((a) => a.name).join(", ")
                    : "—"}
                </p>
                <p className="text-muted-foreground">
                  Daily mission selesai: {triggerResult.completedDailyMissions.length > 0
                    ? triggerResult.completedDailyMissions.join(", ")
                    : "—"}
                </p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleTrigger}
              disabled={triggering}
              className="self-start border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {triggering ? "Mengirim..." : "Kirim Event"}
            </Button>
          </div>
        </div>

        {/* Create Dialog */}
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setFormError(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Achievement Baru</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ach-name">Nama</Label>
                <Input
                  id="ach-name"
                  placeholder="Nama achievement..."
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ach-desc">Deskripsi</Label>
                <Textarea
                  id="ach-desc"
                  placeholder="Deskripsi achievement..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="min-h-20 resize-y"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ach-icon">Icon URL (opsional)</Label>
                <Input
                  id="ach-icon"
                  placeholder="https://..."
                  value={form.iconUrl ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ach-points">Poin</Label>
                  <Input
                    id="ach-points"
                    type="number"
                    min={0}
                    value={form.points}
                    onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ach-milestone">Milestone</Label>
                  <Input
                    id="ach-milestone"
                    type="number"
                    min={1}
                    value={form.milestone}
                    onChange={(e) => setForm((f) => ({ ...f, milestone: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ach-event">Event Type</Label>
                <select
                  id="ach-event"
                  value={form.eventType}
                  onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {ACHIEVEMENT_EVENT_TYPES.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
