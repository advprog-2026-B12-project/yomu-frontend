"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchComments } from "../api";
import { Comment } from "../types";
import { CommentCard } from "./CommentCard";

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
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <MessageSquare className="size-10 opacity-30" />
      <p className="text-sm">Belum ada komentar. Jadilah yang pertama!</p>
    </div>
  );
}

export function CommentList({ readingId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchComments(readingId)
      .then(setComments)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [readingId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive text-center py-10">{error}</p>
    );
  }

  if (comments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

