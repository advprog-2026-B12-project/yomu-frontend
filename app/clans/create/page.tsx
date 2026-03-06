"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateClanPage() {
    const router = useRouter();

    // dummy userId untuk milestone
    const userId = 1;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const res = await fetch("/api/clans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, name, description }),
        });

        if (!res.ok) {
            const msg = await res.text();
            setError(`Create failed: ${msg}`);
            return;
        }

        router.push("/clans");
    }

    return (
        <main style={{ padding: 24 }}>
            <h1>Create Clan</h1>

            {error && (
                <div style={{ padding: 12, border: "1px solid #f00", marginBottom: 12 }}>
                    {error}
                </div>
            )}

            <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
                <input
                    placeholder="Clan name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <button type="submit">Create</button>
            </form>

            <div style={{ marginTop: 12 }}>
                <a href="/clans">Back</a>
            </div>
        </main>
    );
}