"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Comment } from "../types";
import { formatAbsoluteTime, formatRelativeTime } from "../utils";
import { ReplyForm } from "./ReplyForm";

interface CommentCardProps {
  comment: Comment;
  currentUserId: string;
  depth: number;
  onReply: (parentId: string, content: string) => Promise<void>;
}

const MAX_INDENT_DEPTH = 5;

function getAvatarFallback(authorId: string): string {
  return authorId.slice(0, 2).toUpperCase();
}

function shortId(authorId: string): string {
  return authorId.slice(0, 8);
}

export function CommentCard({
  comment,
  currentUserId,
  depth,
  onReply,
}: CommentCardProps) {
  const [replying, setReplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => setReplying((v) => !v)}
                aria-label={`Balas komentar ${shortId(comment.authorId)}`}
              >
                {replying ? "Tutup" : "Balas"}
              </Button>
              {isOwn && (
                <>
                  <Button type="button" size="xs" variant="ghost" disabled>
                    Edit
                  </Button>
                  <Button type="button" size="xs" variant="ghost" disabled>
                    Hapus
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
