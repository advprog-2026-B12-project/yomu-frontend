"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetQuestions, adminCreateQuestion, adminDeleteQuestion, adminUpdateQuestion } from "../../api";
import { Question } from "../../types";
import { OptionManager } from "./OptionManager";

interface QuestionManagerProps {
  readingId: string;
}

export function QuestionManager({ readingId }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
    });
    adminGetQuestions(readingId)
      .then(setQuestions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [readingId]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleAdd = async () => {
    if (!questionText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await adminCreateQuestion(readingId, {
        questionText: questionText.trim(),
      });
      setQuestions((prev) => [...prev, created]);
      setQuestionText("");
      setExpanded((prev) => new Set([...prev, created.id]));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menambah pertanyaan");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    setError(null);
    try {
            const updated = await adminUpdateQuestion(id, { questionText: editText.trim() });
            setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      setEditingId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengupdate pertanyaan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menghapus pertanyaan");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 mt-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          Pertanyaan Kuis ({questions.length})
        </p>
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Belum ada pertanyaan. Tambahkan pertanyaan di bawah.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {idx + 1}
              </span>
              {editingId === q.id ? (
                <>
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 text-sm h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditSave(q.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                                    <Button variant="ghost" size="icon-sm" onClick={() => handleEditSave(q.id)} disabled={saving}>
                    <CheckIcon className="size-4 text-green-600" />
                  </Button>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)}>
                    <XIcon className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm font-medium">{q.questionText}</p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                                        onClick={() => { setEditingId(q.id); setEditText(q.questionText); }}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleExpand(q.id)}
                  >
                                        {expanded.has(q.id) ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(q.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </>
              )}
            </div>

            {expanded.has(q.id) && (
              <div className="px-4 pb-4">
                <OptionManager questionId={q.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add question form */}
      <div className="flex gap-2">
        <Input
          placeholder="Tulis pertanyaan baru..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={saving || !questionText.trim()}>
          <PlusIcon />
          Tambah
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}