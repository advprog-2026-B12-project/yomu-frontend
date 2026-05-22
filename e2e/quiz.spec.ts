import { expect, test, type APIRequestContext } from "@playwright/test"

const apiURL = process.env.NEXT_PUBLIC_API_URL
const testPassword = process.env.E2E_TEST_PASSWORD || "Password123!"
const emailPrefix =
  process.env.E2E_TEST_EMAIL?.split("@")[0] || `e2equiz${Date.now()}`
const emailDomain =
  process.env.E2E_TEST_EMAIL?.split("@")[1] || "example.com"
const uniqueId = `${emailPrefix}${Date.now()}`

const quizUser = {
  displayName: `Quiz User ${uniqueId}`,
  username: `quiz${uniqueId}`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32),
  email: `quiz${uniqueId}@${emailDomain}`,
  password: testPassword,
}

type ReadingItem = {
  id: string
  title: string
  category?: string
  completed: boolean
}

type QuizOption = {
  id: string
  optionText: string
}

type QuizQuestion = {
  id: string
  questionText: string
  options: QuizOption[]
}

type QuizResponse = {
  id: string
  title: string
  category?: string
  questions: QuizQuestion[]
}

let authToken = ""
let userId = ""
let selectedReading: ReadingItem | null = null
let loadedQuiz: QuizResponse | null = null

function api(path: string) {
  if (!apiURL) throw new Error("NEXT_PUBLIC_API_URL is required")
  return `${apiURL}${path}`
}

function authHeaders() {
  return { Authorization: `Bearer ${authToken}` }
}

async function registerViaApi(request: APIRequestContext) {
  const response = await request.post(api("/api/auth/register"), {
    data: quizUser,
  })

  expect(response.status()).toBe(201)
}

async function loginViaApi(request: APIRequestContext) {
  const response = await request.post(api("/api/auth/login"), {
    data: {
      username: quizUser.email,
      password: quizUser.password,
    },
  })

  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  authToken = body.token
  userId = String(body.user.userId)

  expect(authToken).toBeTruthy()
  expect(userId).toBeTruthy()
}

// ---------------------------------------------------------------------------
// Auth guard - endpoint quiz/readings harus menolak request tanpa token
// ---------------------------------------------------------------------------
test.describe("Quiz backend API - auth guard", () => {
  test.skip(!apiURL, "NEXT_PUBLIC_API_URL is required for Quiz integration E2E")

  test("GET /api/quiz/all ditolak jika belum login", async ({ request }) => {
    const response = await request.get(api("/api/quiz/all"))

    expect([401, 403]).toContain(response.status())
  })

  test("GET /api/readings/{id} ditolak jika belum login", async ({ request }) => {
    const response = await request.get(
      api("/api/readings/00000000-0000-0000-0000-000000000001"),
    )

    expect([401, 403]).toContain(response.status())
  })

  test("POST /api/quiz/submit ditolak jika belum login", async ({ request }) => {
    const response = await request.post(api("/api/quiz/submit"), {
      data: {
        readingId: "00000000-0000-0000-0000-000000000001",
        answers: {},
      },
    })

    expect([401, 403]).toContain(response.status())
  })
})

// ---------------------------------------------------------------------------
// Frontend-backend flow - serial, membutuhkan data reading dari QuizSeeder
// ---------------------------------------------------------------------------
test.describe.serial("Quiz backend functional flow", () => {
  test.skip(!apiURL, "NEXT_PUBLIC_API_URL is required for Quiz integration E2E")

  test("register dan login user quiz", async ({ request }) => {
    await registerViaApi(request)
    await loginViaApi(request)
  })

  test("GET /api/quiz/all mengembalikan daftar bacaan belum selesai", async ({ request }) => {
    const response = await request.get(api("/api/quiz/all"), {
      headers: authHeaders(),
    })

    expect(response.ok()).toBeTruthy()
    const readings = (await response.json()) as ReadingItem[]

    expect(readings.length).toBeGreaterThan(0)
    selectedReading = readings[0]

    expect(selectedReading.id).toBeTruthy()
    expect(selectedReading.title).toBeTruthy()
    expect(selectedReading.completed).toBe(false)
  })

  test("GET /api/quiz/{readingId} gagal jika bacaan belum dibuka", async ({ request }) => {
    if (!selectedReading) throw new Error("selectedReading belum tersedia")

    const response = await request.get(api(`/api/quiz/${selectedReading.id}`), {
      headers: authHeaders(),
    })
    const body = await response.json()

    expect(response.status()).toBe(409)
    expect(body.error).toMatch(/Reading must be opened/i)
  })

  test("GET /api/readings/{id} membuka bacaan dan mengembalikan konten", async ({ request }) => {
    if (!selectedReading) throw new Error("selectedReading belum tersedia")

    const response = await request.get(api(`/api/readings/${selectedReading.id}`), {
      headers: authHeaders(),
    })
    const body = await response.json()

    expect(response.ok()).toBeTruthy()
    expect(body.id).toBe(selectedReading.id)
    expect(body.title).toBe(selectedReading.title)
    expect(body.content).toBeTruthy()
  })

  test("GET /api/quiz/{readingId} memulai quiz tanpa membocorkan jawaban benar", async ({ request }) => {
    if (!selectedReading) throw new Error("selectedReading belum tersedia")

    const response = await request.get(api(`/api/quiz/${selectedReading.id}`), {
      headers: authHeaders(),
    })

    expect(response.ok()).toBeTruthy()
    loadedQuiz = (await response.json()) as QuizResponse

    expect(loadedQuiz.id).toBe(selectedReading.id)
    expect(loadedQuiz.title).toBe(selectedReading.title)
    expect(loadedQuiz).not.toHaveProperty("content")
    expect(loadedQuiz.questions.length).toBeGreaterThan(0)

    for (const question of loadedQuiz.questions) {
      expect(question.questionText).toBeTruthy()
      expect(question.options.length).toBeGreaterThan(0)

      for (const option of question.options) {
        expect(option.optionText).toBeTruthy()
        expect(option).not.toHaveProperty("isCorrect")
      }
    }
  })

  test("GET /api/readings/{id} gagal setelah quiz sudah dimulai", async ({ request }) => {
    if (!selectedReading) throw new Error("selectedReading belum tersedia")

    const response = await request.get(api(`/api/readings/${selectedReading.id}`), {
      headers: authHeaders(),
    })
    const body = await response.json()

    expect(response.status()).toBe(409)
    expect(body.error).toMatch(/Quiz already started/i)
  })

  test("POST /api/quiz/submit menyimpan attempt dan mengembalikan skor", async ({ request }) => {
    if (!loadedQuiz) throw new Error("loadedQuiz belum tersedia")

    const answers = Object.fromEntries(
      loadedQuiz.questions.map((question) => [question.id, question.options[0].id]),
    )

    const response = await request.post(api("/api/quiz/submit"), {
      headers: authHeaders(),
      data: {
        userId,
        readingId: loadedQuiz.id,
        answers,
      },
    })
    const result = await response.json()

    expect(response.ok()).toBeTruthy()
    expect(result.total).toBe(loadedQuiz.questions.length)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(result.total)
  })

  test("GET /api/quiz/status/{readingId} menjadi completed setelah submit", async ({ request }) => {
    if (!selectedReading) throw new Error("selectedReading belum tersedia")

    const response = await request.get(api(`/api/quiz/status/${selectedReading.id}`), {
      headers: authHeaders(),
    })
    const body = await response.json()

    expect(response.ok()).toBeTruthy()
    expect(body.completed).toBe(true)
  })

  test("GET /api/quiz/all menandai bacaan selesai setelah quiz submit", async ({ request }) => {
    if (!selectedReading) throw new Error("selectedReading belum tersedia")

    const response = await request.get(api("/api/quiz/all"), {
      headers: authHeaders(),
    })
    const readings = (await response.json()) as ReadingItem[]
    const updated = readings.find((reading) => reading.id === selectedReading?.id)

    expect(response.ok()).toBeTruthy()
    expect(updated).toBeTruthy()
    expect(updated?.completed).toBe(true)
  })

  test("POST /api/quiz/submit kedua kali ditolak", async ({ request }) => {
    if (!loadedQuiz) throw new Error("loadedQuiz belum tersedia")

    const response = await request.post(api("/api/quiz/submit"), {
      headers: authHeaders(),
      data: {
        userId,
        readingId: loadedQuiz.id,
        answers: {},
      },
    })
    const body = await response.json()

    expect(response.status()).toBe(409)
    expect(body.error).toMatch(/Quiz already completed/i)
  })
})
