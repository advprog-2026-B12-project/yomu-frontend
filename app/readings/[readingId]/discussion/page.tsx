import { CommentList } from "@/features/discussion/components/CommentList";

interface DiscussionPageProps {
  params: Promise<{ readingId: string }>;
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { readingId } = await params;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Diskusi</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono break-all">
          Reading #{readingId}
        </p>
      </div>
      <CommentList readingId={readingId} />
    </main>
  );
}
