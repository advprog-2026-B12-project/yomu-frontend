type Reading = {
    id: string
    title: string
    content: string
}

async function getReading(id: string): Promise<Reading> {
    const res = await fetch(`http://localhost:8080/api/admin/readings/${id}`, {
        cache: "no-store"
    })

    if (!res.ok) {
        throw new Error("Failed to fetch reading")
    }

    return res.json()
}

export default async function ReadingPage({
                                              params
                                          }: {
    params: { readingId: string }
}) {
    const reading = await getReading(params.readingId)

    return (
        <div>
            <h1>{reading.title}</h1>

            <p>{reading.content}</p>

            <br />

            <a href={`/readings/${reading.id}/discussion`}>
                Go to Discussion
            </a>
        </div>
    )
}