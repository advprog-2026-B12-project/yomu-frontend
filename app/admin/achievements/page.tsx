"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trophy, PencilIcon, Trash2Icon } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  updateAchievement,
  deleteAchievement,
} from "@/features/achievements/api";
import type { AchievementResponse, AchievementRequest } from "@/features/achievements/types";
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

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AchievementResponse | null>(null);
  const [editForm, setEditForm] = useState<AchievementRequest>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);



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

  const handleOpenEdit = (ach: AchievementResponse) => {
    setEditTarget(ach);
    setEditForm({
      name: ach.name,
      description: ach.description,
      iconUrl: ach.iconUrl ?? "",
      points: ach.points,
      milestone: ach.milestone,
      eventType: ach.eventType,
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.description.trim() || !editForm.eventType) {
      setEditError("Nama, deskripsi, dan event type wajib diisi.");
      return;
    }
    if (editForm.points < 0 || editForm.milestone < 1) {
      setEditError("Poin tidak boleh negatif, milestone minimal 1.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const updated = await updateAchievement(editTarget.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        iconUrl: editForm.iconUrl?.trim() || undefined,
        points: Number(editForm.points),
        milestone: Number(editForm.milestone),
        eventType: editForm.eventType,
      });
      setAchievements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditOpen(false);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Gagal mengupdate achievement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus achievement ini?")) return;
    try {
      await deleteAchievement(id);
      setAchievements((prev) => prev.filter((a) => a.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menghapus achievement");
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
                    <div className="flex items-start gap-2 shrink-0">
                      <div className="flex flex-col items-end gap-1 text-right">
                        <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
                          {ach.eventType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Milestone: {ach.milestone} · {ach.points} poin
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(ach)}>
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(ach.id)}>
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}


        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); setEditError(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Achievement</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-ach-name">Nama</Label>
                <Input
                  id="edit-ach-name"
                  placeholder="Nama achievement..."
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-ach-desc">Deskripsi</Label>
                <Textarea
                  id="edit-ach-desc"
                  placeholder="Deskripsi achievement..."
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="min-h-20 resize-y"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-ach-icon">Icon URL (opsional)</Label>
                <Input
                  id="edit-ach-icon"
                  placeholder="https://..."
                  value={editForm.iconUrl ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, iconUrl: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-ach-points">Poin</Label>
                  <Input
                    id="edit-ach-points"
                    type="number"
                    min={0}
                    value={editForm.points}
                    onChange={(e) => setEditForm((f) => ({ ...f, points: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-ach-milestone">Milestone</Label>
                  <Input
                    id="edit-ach-milestone"
                    type="number"
                    min={1}
                    value={editForm.milestone}
                    onChange={(e) => setEditForm((f) => ({ ...f, milestone: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-ach-event">Event Type</Label>
                <select
                  id="edit-ach-event"
                  value={editForm.eventType}
                  onChange={(e) => setEditForm((f) => ({ ...f, eventType: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {ACHIEVEMENT_EVENT_TYPES.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
              </div>
              {editError && <p className="text-sm text-destructive">{editError}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button onClick={handleUpdate} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
