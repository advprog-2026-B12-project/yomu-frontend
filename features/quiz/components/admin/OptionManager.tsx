"use client";

import { useEffect, useState, useCallback } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetOptions, adminCreateOption, adminDeleteOption, adminUpdateOption } from "../../api";
import { Option } from "../../types";
import { ConfirmDialog } from "./ConfirmDialog";

interface OptionManagerProps {
    questionId: string;
}

export function OptionManager({ questionId }: OptionManagerProps) {
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [optionText, setOptionText] = useState("");
    const [newOptionCorrect, setNewOptionCorrect] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const isOptionCorrect = (opt: Option) => opt.correct;

    const load = useCallback(() => {
        setLoading(true);

        adminGetOptions(questionId)
            .then(setOptions)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, [questionId]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        load();
    }, [load]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleAdd = async () => {
        if (!optionText.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const created = await adminCreateOption(questionId, {
                optionText: optionText.trim(),
                correct: newOptionCorrect,
            });
            setOptions((prev) => [...prev, created]);
            setOptionText("");
            setNewOptionCorrect(false);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Gagal menambah opsi");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminDeleteOption(deleteTarget);
            setOptions((prev) => prev.filter((o) => o.id !== deleteTarget));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Gagal menghapus opsi");
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleSetCorrect = async (targetOpt: Option) => {
        setOptions((prev) =>
            prev.map((opt) => ({
                ...opt,
                correct: opt.id === targetOpt.id,
            }))
        );

        try {
            await Promise.all(
                options.map((opt) =>
                    adminUpdateOption(opt.id, {
                        optionText: opt.optionText,
                        correct: opt.id === targetOpt.id,
                    })
                )
            );
        } catch (e: unknown) {
            load();
            setError(e instanceof Error ? e.message : "Gagal mengubah jawaban benar");
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
                Opsi Jawaban — klik radio button untuk tandai jawaban benar
            </p>

            {options.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Belum ada opsi.</p>
            )}

            <div className="flex flex-col gap-2">
                {options.map((opt) => {
                    const correct = isOptionCorrect(opt);
                    return (
                        <div
                            key={opt.id}
                            className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                correct ? "border-blue-400 bg-blue-50" : "border-border"
                            }`}
                        >
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="radio"
                                    name={`correct-${questionId}`}
                                    checked={correct}
                                    onChange={() => handleSetCorrect(opt)}
                                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                                />
                                <span className={correct ? "font-medium text-blue-700" : ""}>
                                    {opt.optionText}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteTarget(opt.id)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2Icon className="size-4" />
                            </Button>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input
                        placeholder="Teks opsi jawaban..."
                        value={optionText}
                        onChange={(e) => setOptionText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        className="text-sm"
                    />
                    <Button size="sm" onClick={handleAdd} disabled={saving || !optionText.trim()}>
                        <PlusIcon />
                        Tambah
                    </Button>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={newOptionCorrect}
                        onChange={(e) => setNewOptionCorrect(e.target.checked)}
                        className="rounded"
                    />
                    Tandai sebagai jawaban benar
                </label>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Opsi?"
                description="Opsi ini akan dihapus permanen."
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}