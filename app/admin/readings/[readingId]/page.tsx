import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { QuestionManager } from "@/features/quiz/components/admin/QuestionManager"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

type Reading = { id: string; title: string; content: string }

async function getReading(id: string): Promise<Reading> {
  const res = await fetch(`${API}/api/admin/readings/${id}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch reading")
  return res.json()
}

export default async function AdminReadingDetailPage({
  params,
}: {
  params: Promise<{ readingId: string }>
}) {
  const { readingId } = await params
  const reading = await getReading(readingId)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <Link
          href="/admin/readings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Daftar Bacaan
        </Link>
        <h1 className="text-2xl font-bold">{reading.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {reading.content}
        </p>
      </div>

      <div className="border-t pt-6">
        <QuestionManager readingId={reading.id} />
      </div>
    </main>
  )
}
