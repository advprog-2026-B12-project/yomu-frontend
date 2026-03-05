import { CommentList } from "@/features/discussion/components/CommentList";

// Smoke test
const SMOKE_TEST_READING_ID = "c705ccab-f117-4813-90b6-fbcda0f58e9a";

interface DiscussionPageProps {
  params: Promise<{ readingId: string }>;
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { readingId } = await params;
  const targetReadingId = readingId ?? SMOKE_TEST_READING_ID;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Diskusi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reading #{targetReadingId}
        </p>
      </div>
      <CommentList readingId={targetReadingId} />
    </main>
  );
}

