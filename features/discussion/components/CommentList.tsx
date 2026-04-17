"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, createComment, fetchComments, replyToComment } from "../api";
import { Comment } from "../types";
import { CommentCard } from "./CommentCard";
import { CommentForm } from "./CommentForm";

interface CommentListProps {
  readingId: string;
}

function CommentSkeleton() {
  return (
    <div className="flex gap-4 p-6 border rounded-xl">
      <Skeleton className="size-8 rounded-full shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <MessageSquare className="size-10 opacity-30" />
      <p className="text-sm">Belum ada komentar. Jadilah yang pertama!</p>
    </div>
  );
}

export function CommentList({ readingId }: CommentListProps) {
  const router = useRouter();
  const { userId, username, isLoading: authLoading, logout } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isLoggedIn = Boolean(username);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComments(readingId);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat komentar.");
    } finally {
      setLoading(false);
    }
  }, [readingId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleUnauthorized = useCallback(() => {
    logout();
    router.push("/auth/login");
  }, [logout, router]);

  const handleCreate = useCallback(
    async (content: string) => {
      setSubmitting(true);
      try {
        await createComment(readingId, { content });
        await loadComments();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized();
        }
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [readingId, loadComments, handleUnauthorized],
  );

  const handleReply = useCallback(
    async (parentId: string, content: string) => {
      try {
        await replyToComment(readingId, parentId, { content });
        await loadComments();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized();
        }
        throw err;
      }
    },
    [readingId, loadComments, handleUnauthorized],
  );

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Tulis komentar baru" className="flex flex-col gap-2">
        {authLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isLoggedIn ? (
          <CommentForm submitting={submitting} onSubmit={handleCreate} />
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Kamu harus{" "}
            <Link className="text-primary underline" href="/auth/login">
              login
            </Link>{" "}
            dulu untuk menulis komentar.
          </div>
        )}
      </section>

      <section aria-label="Daftar komentar" className="flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center py-10">{error}</p>
        ) : comments.length === 0 ? (
          <EmptyState />
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={userId}
              depth={0}
              onReply={handleReply}
            />
          ))
        )}
      </section>
    </div>
  );
}
