"use client";

import { useEffect, useState } from "react";

type Message = {
  id: number;
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ke Backend Spring Boot
    fetch("http://localhost:8080/api/test")
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal connect ke backend:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Integration Test</h1>

      <div className="border p-6 rounded-lg shadow-lg bg-white text-black">
        <h2 className="text-xl font-semibold mb-4">Data from Database:</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {messages.length > 0 ? (
              messages.map((msg) => (
                <li key={msg.id} className="mb-2 p-2 bg-green-100 rounded">
                  ID: {msg.id} - <strong>{msg.content}</strong>
                </li>
              ))
            ) : (
              <p className="text-red-500">Data kosong / Gagal konek</p>
            )}
          </ul>
        )}
      </div>
    </main>
  );
}
