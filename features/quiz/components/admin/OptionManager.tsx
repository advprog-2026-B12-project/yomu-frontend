"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon, CheckCircle2Icon, CircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    adminGetOptions,
    adminCreateOption,
    adminDeleteOption,
} from "../../api";
import { Option } from "../../types";

interface OptionManagerProps {
    questionId: string;
}

export function OptionManager({ questionId }: OptionManagerProps) {
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [optionText, setOptionText] = useState("");
    const [isCorrect, setIsCorrect] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        adminGetOptions(questionId)
            .then(setOptions)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [questionId]);

    const handleAdd = async () => {
        if (!optionText.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const created = await adminCreateOption(questionId, {
                optionText: optionText.trim(),
                isCorrect,
            });
            setOptions((prev) => [...prev, created]);
            setOptionText("");
            setIsCorrect(false);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Gagal menambah opsi");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await adminDeleteOption(id);
            setOptions((prev) => prev.filter((o) => o.id !== id));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Gagal menghapus opsi");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-2 mt-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 mt-3 pl-4 border-l-2 border-muted">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Opsi Jawaban
            </p>

            {options.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Belum ada opsi.</p>
            )}

            <div className="flex flex-col gap-2">
                {options.map((opt) => (
                    <div
                        key={opt.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
            <span className="flex items-center gap-2">
              {opt.isCorrect ? (
                  <CheckCircle2Icon className="size-4 text-green-500 shrink-0" />
              ) : (
                  <CircleIcon className="size-4 text-muted-foreground shrink-0" />
              )}
                {opt.optionText}
            </span>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(opt.id)}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2Icon />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Add option form */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input
                        placeholder="Teks opsi jawaban..."
                        value={optionText}
                        onChange={(e) => setOptionText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        className="text-sm"
                    />
                    <Button
                        size="sm"
                        onClick={handleAdd}
                        disabled={saving || !optionText.trim()}
                    >
                        <PlusIcon />
                        Tambah
                    </Button>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={isCorrect}
                        onChange={(e) => setIsCorrect(e.target.checked)}
                        className="rounded"
                    />
                    Tandai sebagai jawaban benar
                </label>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}