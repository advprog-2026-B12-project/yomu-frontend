"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyFormProps {
  submitting: boolean;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
}

export function ReplyForm({ submitting, onSubmit, onCancel }: ReplyFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const trimmed = value.trim();
  const disabled = submitting || trimmed.length === 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (trimmed.length === 0) {
      setError("Balasan tidak boleh kosong.");
      return;
    }
    setError(null);
    try {
      await onSubmit(trimmed);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim balasan.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        placeholder="Tulis balasan..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        aria-label="Tulis balasan komentar"
        disabled={submitting}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={disabled}>
          {submitting ? "Mengirim..." : "Kirim"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
