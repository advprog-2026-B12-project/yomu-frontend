"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Comment, ReactionType } from "../types";
import { formatAbsoluteTime, formatRelativeTime } from "../utils";
import { ReplyForm } from "./ReplyForm";

interface CommentCardProps {
  comment: Comment;
  currentUserId: string;
  isAdmin: boolean;
  depth: number;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReact: (
    commentId: string,
    reactionType: ReactionType | null,
  ) => Promise<void>;
}

const MAX_INDENT_DEPTH = 5;

const REACTION_MAP: Record<ReactionType, string> = {
  UPVOTE: "👍",
  DOWNVOTE: "👎",
  FIRE: "🔥",
  THINKING: "🤔",
  CLAP: "👏",
  SURPRISED: "😮",
  LOVE: "❤️",
};

const REACTION_TYPES: ReactionType[] = [
  "UPVOTE",
  "DOWNVOTE",
  "FIRE",
  "THINKING",
  "CLAP",
  "SURPRISED",
  "LOVE",
];

function getAvatarFallback(authorId: string): string {
  return authorId.slice(0, 2).toUpperCase();
}

function shortId(authorId: string): string {
  return authorId.slice(0, 8);
}

export function CommentCard({
  comment,
  currentUserId,
  isAdmin,
  depth,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: CommentCardProps) {
  const [replying, setReplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwn = Boolean(currentUserId) && comment.authorId === currentUserId;
  const indentDepth = Math.min(depth, MAX_INDENT_DEPTH);

  async function handleSubmitReply(content: string) {
    setSubmitting(true);
    try {
      await onReply(comment.id, content);
      setReplying(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit() {
    const trimmed = editValue.trim();
    if (trimmed.length === 0) {
      setEditError("Komentar tidak boleh kosong.");
      return;
    }
    if (trimmed === comment.content) {
      setEditing(false);
      setEditError(null);
      return;
    }
    setSubmitting(true);
    setEditError(null);
    try {
      await onEdit(comment.id, trimmed);
      setEditing(false);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Gagal menyimpan perubahan.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(comment.id);
      setDeleteOpen(false);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Gagal menghapus komentar.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleReactionClick(type: ReactionType) {
    const next = comment.myReaction === type ? null : type;
    await onReact(comment.id, next);
  }

  return (
    <div
      className="flex flex-col gap-3"
      style={
        indentDepth > 0 ? { marginLeft: `${indentDepth * 1.25}rem` } : undefined
      }
    >
      <Card>
        <CardContent className="flex gap-4 pt-6">
          <Avatar>
            <AvatarFallback>
              {getAvatarFallback(comment.authorId)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm font-mono">
                {shortId(comment.authorId)}
                {isOwn && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (Kamu)
                  </span>
                )}
              </span>
              <span
                className="text-xs text-muted-foreground"
                title={formatAbsoluteTime(comment.createdAt)}
              >
                {formatRelativeTime(comment.createdAt)}
              </span>
              {comment.editedAt && (
                <span
                  className="text-xs italic text-muted-foreground"
                  title={`Diedit ${formatAbsoluteTime(comment.editedAt)}`}
                >
                  (diedit)
                </span>
              )}
            </div>

            {editing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={3}
                  aria-label="Edit komentar"
                  disabled={submitting}
                />
                {editError && (
                  <p className="text-xs text-destructive">{editError}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitting || editValue.trim().length === 0}
                    onClick={handleSaveEdit}
                  >
                    {submitting ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={submitting}
                    onClick={() => {
                      setEditing(false);
                      setEditValue(comment.content);
                      setEditError(null);
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1 pt-1">
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => setReplying((v) => !v)}
                aria-label={`Balas komentar ${shortId(comment.authorId)}`}
              >
                {replying ? "Tutup" : "Balas"}
              </Button>
              {isOwn && !editing && (
                <>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    Hapus
                  </Button>
                </>
              )}
              {isAdmin && !isOwn && (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Hapus (Admin)
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 pt-1">
              {REACTION_TYPES.map((type) => {
                const count = comment.reactionCounts?.[type] ?? 0;
                const active = comment.myReaction === type;
                return (
                  <Button
                    key={type}
                    type="button"
                    size="xs"
                    variant={active ? "secondary" : "ghost"}
                    className="gap-1"
                    onClick={() => handleReactionClick(type)}
                    aria-label={
                      active
                        ? `Batalkan reaksi ${REACTION_MAP[type]}`
                        : `Beri reaksi ${REACTION_MAP[type]}`
                    }
                    aria-pressed={active}
                    title={type}
                  >
                    <span>{REACTION_MAP[type]}</span>
                    {count > 0 && (
                      <span className="text-xs tabular-nums">{count}</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Komentar</DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin menghapus komentar ini? Tindakan ini tidak
              bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {replying && (
        <div className="pl-4">
          <ReplyForm
            submitting={submitting}
            onCancel={() => setReplying(false)}
            onSubmit={handleSubmitReply}
          />
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="flex flex-col gap-3">
          {comment.replies.map((child) => (
            <CommentCard
              key={child.id}
              comment={child}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
