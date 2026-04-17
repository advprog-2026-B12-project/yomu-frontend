type Reading = {
    id: string
    title: string
    content: string
}

async function getReadings(): Promise<Reading[]> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/readings`,
        { cache: "no-store" }
    )

    if (!res.ok) {
        throw new Error("Failed to fetch readings")
    }

    return res.json()
}

export default async function ReadingsPage() {
    const readings = await getReadings()

    return (
        <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Available Readings</h1>

            {readings.map((reading) => (
                <a
                    key={reading.id}
                    href={`/readings/${reading.id}`}
                    className="border p-4 rounded-xl hover:shadow transition"
                >
                    <h2 className="text-xl font-semibold">
                        {reading.title}
                    </h2>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {reading.content}
                    </p>
                </a>
            ))}
        </div>
    )
}