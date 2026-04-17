type Reading = {
    id: string
    title: string
    content: string
}

async function getReading(id: string): Promise<Reading> {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/readings/${id}`

    console.log("FETCHING:", url)

    const res = await fetch(url, {
        cache: "no-store"
    })

    console.log("STATUS:", res.status)

    if (!res.ok) {
        const text = await res.text()
        console.error("ERROR BODY:", text)
        throw new Error("Failed to fetch reading")
    }

    return res.json()
}

export default async function ReadingPage({
                                              params,
                                          }: {
    params: Promise<{ readingId: string }>
}) {
    const { readingId } = await params

    const reading = await getReading(readingId)

    return (
        <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">
                {reading.title}
            </h1>

            <p className="whitespace-pre-line text-muted-foreground">
                {reading.content}
            </p>

            <div className="flex gap-4 mt-4">
                <a
                    href={`/readings/${reading.id}/discussion`}
                    className="bg-gray-200 px-4 py-2 rounded-lg"
                >
                    Go to Discussion
                </a>

                <a
                    href={`/readings/${reading.id}/quiz`}
                    className="bg-black text-white px-4 py-2 rounded-lg"
                >
                    Go to Quiz
                </a>
            </div>
        </div>
    )
}