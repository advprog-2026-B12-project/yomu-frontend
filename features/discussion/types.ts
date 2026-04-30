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
};

export type CommentRequest = {
  content: string;
};
