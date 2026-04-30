"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  submitting: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (content: string) => Promise<void>;
}

export function CommentForm({
  submitting,
  disabled,
  placeholder = "Tulis komentar...",
  onSubmit,
}: CommentFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const trimmed = value.trim();
  const sendDisabled = submitting || disabled || trimmed.length === 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (trimmed.length === 0) {
      setError("Komentar tidak boleh kosong.");
      return;
    }
    setError(null);
    try {
      await onSubmit(trimmed);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim komentar.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        aria-label="Tulis komentar baru"
        disabled={submitting || disabled}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={sendDisabled}>
          {submitting ? "Mengirim..." : "Kirim"}
        </Button>
      </div>
    </form>
  );
}
