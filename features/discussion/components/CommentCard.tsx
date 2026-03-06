import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Comment } from "../types";

interface CommentCardProps {
  comment: Comment;
}

// Ambil 2 karakter pertama dari UUID sebagai fallback avatar
function getAvatarFallback(authorId: string): string {
  return authorId.slice(0, 2).toUpperCase();
}

// Tampilkan 8 karakter pertama UUID sebagai display name
function shortId(authorId: string): string {
  return authorId.slice(0, 8);
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CommentCard({ comment }: CommentCardProps) {
  return (
    <Card>
      <CardContent className="flex gap-4 pt-6">
        <Avatar>
          <AvatarFallback>{getAvatarFallback(comment.authorId)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm font-mono">
              {shortId(comment.authorId)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{comment.content}</p>
        </div>
      </CardContent>
    </Card>
  );
}
