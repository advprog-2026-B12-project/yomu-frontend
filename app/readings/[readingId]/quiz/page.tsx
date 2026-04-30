"use client"

import { useEffect, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers/AuthProvider"

type Option = {
    id: string
    optionText: string
    correct: boolean
}

type Question = {
    id: string
    questionText: string
    options: Option[]
}

type Reading = {
    id: string
    title: string
    content: string
    questions: Question[]
}

type QuizSubmitRequest = {
    userId: string
    readingId: string
    answers: {
        questionId: string
        optionId: string
    }[]
}

async function getQuiz(readingId: string): Promise<Reading> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/quiz/${readingId}`,
        { cache: "no-store" }
    )

    if (!res.ok) {
        throw new Error("Failed to fetch quiz")
    }

    return res.json()
}

export default function QuizPage({
                                     params,
                                 }: {
    params: Promise<{ readingId: string }>
}) {
    const { readingId } = use(params)
    const { userId } = useAuth()
    const [reading, setReading] = useState<Reading | null>(null)
    const [started, setStarted] = useState(false)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    useEffect(() => {
        getQuiz(readingId).then(setReading)
    }, [readingId])

    if (!reading) return <p>Loading...</p>

    function handleSelect(questionId: string, optionId: string) {
        if (submitted) return

        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }))
    }

    async function handleSubmit() {
        if (!reading) return

        const formattedAnswers = Object.entries(answers).map(
            ([questionId, optionId]) => ({
                questionId,
                optionId,
            })
        )

        const payload: QuizSubmitRequest = {
            userId: userId,
            readingId: reading.id,
            answers: formattedAnswers,
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/quiz/submit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            )

            if (!res.ok) {
                const text = await res.text()
                console.error("BACKEND ERROR:", text)
                throw new Error("Failed to submit quiz")
            }

            const result = await res.json()

            setScore(result.score)
            setSubmitted(true)

            console.log("BACKEND_RESULT", result)
        } catch (err) {
            console.error(err)
            alert("Submission failed")
        }
    }

    if (!started) {
        return (
            <div className="max-w-2xl mx-auto p-6 flex flex-col gap-8">
                <h1 className="text-2xl font-bold mx-auto">{reading.title}</h1>

                <Button onClick={() => setStarted(true)}>
                    Start Quiz
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
            <h2 className="text-xl font-semibold">Quiz</h2>

            {reading.questions.map((q, index) => (
                <div key={q.id} className="border p-4 rounded-xl">
                    <p className="font-medium mb-3">
                        {index + 1}. {q.questionText}
                    </p>

                    <div className="flex flex-col gap-2">
                        {q.options.map((o) => {
                            const isSelected = answers[q.id] === o.id

                            return (
                                <label
                                    key={o.id}
                                    className={`border p-2 rounded cursor-pointer ${
                                        isSelected
                                            ? "bg-primary/10 border-primary"
                                            : ""
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={q.id}
                                        checked={isSelected}
                                        onChange={() =>
                                            handleSelect(q.id, o.id)
                                        }
                                        className="mr-2"
                                    />
                                    {o.optionText}
                                </label>
                            )
                        })}
                    </div>
                </div>
            ))}

            {!submitted ? (
                <Button onClick={handleSubmit}>
                    Submit
                </Button>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 border rounded-xl w-full text-center">
                        <p className="font-semibold">
                            Score: {score} / {reading.questions.length}
                        </p>
                    </div>

                    <a
                        href={`/readings/${reading.id}`}
                        className="bg-gray-200 px-4 py-2 rounded-lg w-full text-center"
                    >
                        Back to Reading
                    </a>
                </div>
            )}
        </div>
    )
}