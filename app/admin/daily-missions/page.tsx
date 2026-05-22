"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon, PencilIcon, CalendarCheck } from "lucide-react";
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
  fetchAllDailyMissionsAdmin,
  createDailyMission,
  updateDailyMission,
  deleteDailyMission,
} from "@/features/achievements/api";
import type { DailyMission, DailyMissionRequest } from "@/features/achievements/types";
import { ACHIEVEMENT_EVENT_TYPES } from "@/features/achievements/types";

function MissionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border p-5 flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM: DailyMissionRequest = {
  name: "",
  description: "",
  milestone: 1,
  eventType: ACHIEVEMENT_EVENT_TYPES[0],
  isActive: true,
};

export default function AdminDailyMissionsPage() {
  const router = useRouter();
  const { username, role, isLoading } = useAuth();

  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<DailyMissionRequest>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyMission | null>(null);
  const [editForm, setEditForm] = useState<DailyMissionRequest>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !username) router.push("/");
    if (!isLoading && username && role !== "ADMIN") router.push("/dashboard");
  }, [isLoading, username, role, router]);

  useEffect(() => {
    fetchAllDailyMissionsAdmin()
      .then(setMissions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const validateForm = (form: DailyMissionRequest): string | null => {
    if (!form.name.trim() || !form.description.trim()) return "Nama dan deskripsi wajib diisi.";
    if (form.milestone < 1) return "Milestone minimal 1.";
    if (!form.eventType) return "Event type wajib dipilih.";
    return null;
  };

  const handleCreate = async () => {
    const err = validateForm(createForm);
    if (err) { setCreateError(err); return; }
    setSaving(true);
    setCreateError(null);
    try {
      const created = await createDailyMission({
        ...createForm,
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        milestone: Number(createForm.milestone),
      });
      setMissions((prev) => [created, ...prev]);
      setCreateForm(EMPTY_FORM);
      setCreateOpen(false);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Gagal membuat misi");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (mission: DailyMission) => {
    setEditTarget(mission);
    setEditForm({
      name: mission.name,
      description: mission.description,
      milestone: mission.milestone,
      eventType: mission.eventType,
      isActive: mission.isActive,
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    const err = validateForm(editForm);
    if (err) { setEditError(err); return; }
    setSaving(true);
    setEditError(null);
    try {
      const updated = await updateDailyMission(editTarget.id, {
        ...editForm,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        milestone: Number(editForm.milestone),
      });
      setMissions((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditOpen(false);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Gagal mengupdate misi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus misi harian ini?")) return;
    try {
      await deleteDailyMission(id);
      setMissions((prev) => prev.filter((m) => m.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menghapus misi");
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
            <h1 className="text-2xl font-bold tracking-tight">Kelola Daily Mission</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Buat, edit, dan hapus misi harian untuk pelajar.
            </p>
          </div>
          <Button onClick={() => { setCreateForm(EMPTY_FORM); setCreateError(null); setCreateOpen(true); }}>
            <PlusIcon />
            Misi Baru
          </Button>
        </div>

        <Separator />

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {loading ? (
          <MissionSkeleton />
        ) : missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <CalendarCheck className="size-12 opacity-25" />
            <p className="text-sm">Belum ada misi harian. Buat yang pertama!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {missions.map((mission) => (
              <Card key={mission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <CardTitle className="text-sm">{mission.name}</CardTitle>
                      <CardDescription>{mission.description}</CardDescription>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                          {mission.eventType}
                        </span>
                        <span className="text-xs text-muted-foreground">Milestone: {mission.milestone}</span>
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${mission.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {mission.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(mission)}>
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(mission.id)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); setCreateError(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Misi Harian Baru</DialogTitle>
            </DialogHeader>
            <MissionForm
              form={createForm}
              onChange={setCreateForm}
              error={createError}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); setEditError(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Misi Harian</DialogTitle>
            </DialogHeader>
            <MissionForm
              form={editForm}
              onChange={setEditForm}
              error={editError}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button onClick={handleUpdate} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function MissionForm({
  form,
  onChange,
  error,
}: {
  form: DailyMissionRequest;
  onChange: (f: DailyMissionRequest) => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="m-name">Nama</Label>
        <Input
          id="m-name"
          placeholder="Nama misi..."
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="m-desc">Deskripsi</Label>
        <Textarea
          id="m-desc"
          placeholder="Deskripsi misi..."
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className="min-h-20 resize-y"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-milestone">Milestone</Label>
          <Input
            id="m-milestone"
            type="number"
            min={1}
            value={form.milestone}
            onChange={(e) => onChange({ ...form, milestone: Number(e.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-event">Event Type</Label>
          <select
            id="m-event"
            value={form.eventType}
            onChange={(e) => onChange({ ...form, eventType: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ACHIEVEMENT_EVENT_TYPES.map((et) => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
          className="rounded"
        />
        Aktif
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
