"use client";

import { useEffect, useState } from "react";

type Clan = {
    id: number;
    name: string;
    description?: string;
    leaderUserId: number;
};

export default function ClansPage() {
    const [clans, setClans] = useState<Clan[]>([]);
    const [error, setError] = useState<string | null>(null);

    // dummy userId untuk milestone
    const userId = 2;

    async function load() {
        const res = await fetch("/api/clans", { cache: "no-store" });
        if (!res.ok) {
            setError(`Failed to load clans: ${res.status}`);
            return;
        }
        setError(null);
        setClans(await res.json());
    }

    async function joinClan(clanId: number) {
        setError(null);
        const res = await fetch(`/api/clans/${clanId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
            const msg = await res.text();
            setError(`Join failed: ${msg}`);
            return;
        }

        alert("Joined clan!");
        await load();
    }

    useEffect(() => {
        let mounted = true;

        fetch("/api/clans", { cache: "no-store" })
            .then(async (res) => {
                if (!mounted) return;

                if (!res.ok) {
                    setError(`Failed to load clans: ${res.status}`);
                    return;
                }

                const data = await res.json();
                if (!mounted) return;

                setError(null);
                setClans(data);
            });

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <main style={{ padding: 24 }}>
            <h1>Clans</h1>
            <p>Milestone 25% - Modul 4</p>

            <div style={{ margin: "12px 0" }}>
                <a href="/clans/create">Create new clan</a>
            </div>

            {error && (
                <div style={{ padding: 12, border: "1px solid #f00", marginBottom: 12 }}>
                    {error}
                </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
                {clans.map((c) => (
                    <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ opacity: 0.8 }}>{c.description ?? "-"}</div>
                        <div style={{ fontSize: 12, marginTop: 6 }}>Leader: {c.leaderUserId}</div>

                        <button style={{ marginTop: 10 }} onClick={() => joinClan(c.id)}>
                            Join
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
}
