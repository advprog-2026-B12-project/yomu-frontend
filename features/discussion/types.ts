export type ReactionType =
  | "UPVOTE"
  | "DOWNVOTE"
  | "FIRE"
  | "THINKING"
  | "CLAP"
  | "SURPRISED"
  | "LOVE";

export type Comment = {
  id: string;
  readingId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  replies: Comment[];
  reactionCounts?: Partial<Record<ReactionType, number>>;
  myReaction?: ReactionType | null;
};

export type CommentRequest = {
  content: string;
};

export type ReactionRequest = {
  reactionType: ReactionType;
};

export type SortOption = "newest" | "most_upvoted";

export type PaginatedComments = {
  content: Comment[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
