export type Comment = {
  id: string;
  readingId: string;
  authorId: string;
  parent: Comment | null;
  content: string;
  deleted: boolean;
  deletedBy: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
