"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  adminDeleteComment,
  createComment,
  deleteComment,
  fetchComments,
  removeReaction,
  replyToComment,
  setReaction,
  updateComment,
} from "../api";
import { Comment, ReactionType, SortOption } from "../types";
import { CommentCard } from "./CommentCard";
import { CommentForm } from "./CommentForm";

interface CommentListProps {
  readingId: string;
}

const PAGE_SIZE = 20;

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
  const { userId, username, role, isLoading: authLoading, logout } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const isLoggedIn = Boolean(username);
  const isAdmin = role === "ADMIN";

  const loadComments = useCallback(
    async (targetPage = 0, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchComments(
          readingId,
          targetPage,
          PAGE_SIZE,
          sort,
        );
        setComments((prev) => (append ? [...prev, ...data] : data));
        setHasMore(data.length === PAGE_SIZE);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat komentar.");
      } finally {
        setLoading(false);
      }
    },
    [readingId, sort],
  );

  useEffect(() => {
    loadComments(0, false);
  }, [loadComments]);

  const handleUnauthorized = useCallback(() => {
    logout();
    router.push("/auth/login");
  }, [logout, router]);

  const withAuth = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized();
        }
        throw err;
      }
    },
    [handleUnauthorized],
  );

  const handleCreate = useCallback(
    async (content: string) => {
      setSubmitting(true);
      try {
        await withAuth(() => createComment(readingId, { content }));
        await loadComments(0, false);
      } finally {
        setSubmitting(false);
      }
    },
    [readingId, loadComments, withAuth],
  );

  const handleReply = useCallback(
    async (parentId: string, content: string) => {
      await withAuth(() => replyToComment(readingId, parentId, { content }));
      await loadComments(0, false);
    },
    [readingId, loadComments, withAuth],
  );

  const handleEdit = useCallback(
    async (commentId: string, content: string) => {
      await withAuth(() => updateComment(readingId, commentId, { content }));
      await loadComments(0, false);
    },
    [readingId, loadComments, withAuth],
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      const target = comments.find((c) => c.id === commentId);
      const isOwn = target?.authorId === userId;
      if (isOwn) {
        await withAuth(() => deleteComment(readingId, commentId));
      } else if (isAdmin) {
        await withAuth(() => adminDeleteComment(commentId));
      }
      await loadComments(0, false);
    },
    [readingId, comments, userId, isAdmin, loadComments, withAuth],
  );

  const handleReact = useCallback(
    async (commentId: string, reactionType: ReactionType | null) => {
      if (reactionType) {
        await withAuth(() => setReaction(commentId, { reactionType }));
      } else {
        await withAuth(() => removeReaction(commentId));
      }
      // Optimistically update local state so UI feels snappy
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          const old = c.myReaction;
          const nextCounts: Partial<Record<ReactionType, number>> = {
            ...(c.reactionCounts ?? {}),
          };
          if (old) {
            nextCounts[old] = Math.max((nextCounts[old] ?? 0) - 1, 0);
          }
          if (reactionType) {
            nextCounts[reactionType] = (nextCounts[reactionType] ?? 0) + 1;
          }
          return { ...c, myReaction: reactionType, reactionCounts: nextCounts };
        }),
      );
    },
    [withAuth],
  );

  const handleSortChange = (next: SortOption) => {
    setSort(next);
  };

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

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Urutkan:</span>
        <Button
          type="button"
          size="xs"
          variant={sort === "newest" ? "secondary" : "ghost"}
          onClick={() => handleSortChange("newest")}
          aria-label="Urutkan komentar terbaru"
        >
          Terbaru
        </Button>
        <Button
          type="button"
          size="xs"
          variant={sort === "most_upvoted" ? "secondary" : "ghost"}
          onClick={() => handleSortChange("most_upvoted")}
          aria-label="Urutkan komentar paling banyak upvote"
        >
          Paling Populer
        </Button>
      </div>

      <section aria-label="Daftar komentar" className="flex flex-col gap-4">
        {loading && comments.length === 0 ? (
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
          <>
            <div className="flex flex-col gap-4">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUserId={userId}
                  isAdmin={isAdmin}
                  depth={0}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReact={handleReact}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadComments(page + 1, true)}
                  disabled={loading}
                  aria-label="Muat lebih banyak komentar"
                >
                  {loading ? "Memuat..." : "Muat lebih banyak"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
