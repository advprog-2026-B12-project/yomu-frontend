"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CommentList } from "@/features/discussion/components/CommentList";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Reading = {
  id: string;
  title: string;
};

interface DiscussionPageProps {
  params: Promise<{ readingId: string }>;
}

export default function DiscussionPage({ params }: DiscussionPageProps) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [readingId, setReadingId] = useState<string>("");

  useEffect(() => {
    params.then(({ readingId }) => {
      setReadingId(readingId);
      const token = localStorage.getItem("token");
      fetch(`${API}/api/readings/${readingId}`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.json();
        })
        .then((data: Reading) => setReading(data))
        .catch(() => setReading({ id: readingId, title: "Bacaan" }));
    });
  }, [params]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/readings/${readingId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Bacaan
        </Link>
        <h1 className="text-2xl font-bold">Diskusi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {reading ? reading.title : "Memuat judul bacaan..."}
        </p>
      </div>
      <CommentList readingId={readingId} />
    </main>
  );
}
