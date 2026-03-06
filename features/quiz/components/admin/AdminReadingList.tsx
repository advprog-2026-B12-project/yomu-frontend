"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon, BookOpenIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { adminGetReadings, adminCreateReading, adminDeleteReading } from "../../api";
import { Reading } from "../../types";
import { QuestionManager } from "./QuestionManager";

function ReadingSkeleton() {
    return (
        <div className="rounded-xl border p-6 flex flex-col gap-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
        </div>
    );
}

export function AdminReadingList() {
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create dialog state
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Expanded reading for question management
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        adminGetReadings()
            .then(setReadings)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) {
            setFormError("Judul dan konten tidak boleh kosong.");
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            const created = await adminCreateReading({ title: title.trim(), content: content.trim() });
            setReadings((prev) => [created, ...prev]);
            setTitle("");
            setContent("");
            setOpen(false);
        } catch (e: unknown) {
            setFormError(e instanceof Error ? e.message : "Gagal membuat bacaan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await adminDeleteReading(id);
            setReadings((prev) => prev.filter((r) => r.id !== id));
            if (expandedId === id) setExpandedId(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Gagal menghapus bacaan");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Bacaan</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kelola teks bacaan dan soal kuis untuk pelajar.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={(v) => { setOpen(v); setFormError(null); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusIcon />
                            Bacaan Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Tambah Bacaan Baru</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-2">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="title">Judul</Label>
                                <Input
                                    id="title"
                                    placeholder="Masukkan judul bacaan..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="content">Konten</Label>
                                <Textarea
                                    id="content"
                                    placeholder="Tulis teks bacaan di sini..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-48 resize-y"
                                />
                            </div>
                            {formError && (
                                <p className="text-sm text-destructive">{formError}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleCreate} disabled={saving}>
                                {saving ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Separator />

            {/* Error */}
            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* List */}
            {loading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => <ReadingSkeleton key={i} />)}
                </div>
            ) : readings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                    <BookOpenIcon className="size-12 opacity-25" />
                    <p className="text-sm">Belum ada bacaan. Buat bacaan pertama!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {readings.map((reading) => (
                        <Card key={reading.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                        <CardTitle className="text-base">{reading.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {reading.content}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setExpandedId(
                                                    expandedId === reading.id ? null : reading.id
                                                )
                                            }
                                        >
                                            {expandedId === reading.id ? (
                                                <>
                                                    <ChevronUpIcon />
                                                    Sembunyikan Kuis
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDownIcon />
                                                    Kelola Kuis
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(reading.id)}
                                        >
                                            <Trash2Icon />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            {expandedId === reading.id && (
                                <CardContent>
                                    <Separator className="mb-4" />
                                    <QuestionManager readingId={reading.id} />
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}