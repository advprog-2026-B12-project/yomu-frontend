import { expect, test, type APIRequestContext } from "@playwright/test"

const apiURL = process.env.NEXT_PUBLIC_API_URL
const testPassword = process.env.E2E_TEST_PASSWORD || "Password123!"
const emailPrefix =
  process.env.E2E_TEST_EMAIL?.split("@")[0] || `e2edisc${Date.now()}`
const emailDomain =
  process.env.E2E_TEST_EMAIL?.split("@")[1] || "example.com"
const uniqueId = `${emailPrefix}${Date.now()}`

const discUser = {
  displayName: `Disc User ${uniqueId}`,
  username: `disc${uniqueId}`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32),
  email: `disc${uniqueId}@${emailDomain}`,
  password: testPassword,
}

let authToken = ""
let userId = ""
let readingId = "00000000-0000-0000-0000-000000000001"
let commentId = ""
let replyId = ""

function api(path: string) {
  if (!apiURL) throw new Error("NEXT_PUBLIC_API_URL is required")
  return `${apiURL}${path}`
}

function authHeaders() {
  return { Authorization: `Bearer ${authToken}` }
}

async function registerViaApi(request: APIRequestContext) {
  const response = await request.post(api("/api/auth/register"), {
    data: discUser,
  })
  expect(response.status()).toBe(201)
}

async function loginViaApi(request: APIRequestContext) {
  const response = await request.post(api("/api/auth/login"), {
    data: {
      username: discUser.email,
      password: discUser.password,
    },
  })
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  authToken = body.token
  userId = String(body.user.userId)
}

test.describe("Discussion API - auth guard", () => {
  test.skip(!apiURL, "NEXT_PUBLIC_API_URL is required")

  test("POST comment ditolak jika belum login", async ({ request }) => {
    const response = await request.post(api(`/api/v1/readings/${readingId}/comments`), {
      data: { content: "Test" }
    })
    expect([401, 403]).toContain(response.status())
  })
})

test.describe.serial("Discussion backend functional flow", () => {
  test.skip(!apiURL, "NEXT_PUBLIC_API_URL is required")

  test("register dan login user", async ({ request }) => {
    await registerViaApi(request)
    await loginViaApi(request)
  })

  test("GET readings untuk mendapat readingId (jika ada)", async ({ request }) => {
    const response = await request.get(api("/api/quiz/all"), { headers: authHeaders() })
    if (response.ok()) {
      const readings = await response.json()
      if (readings.length > 0) {
        readingId = readings[0].id
      }
    }
  })

  test("POST /api/v1/readings/{id}/comments membuat komentar baru", async ({ request }) => {
    const response = await request.post(api(`/api/v1/readings/${readingId}/comments`), {
      headers: authHeaders(),
      data: { content: "Ini komentar test e2e" }
    })
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.content).toBe("Ini komentar test e2e")
    expect(body.id).toBeTruthy()
    commentId = body.id
  })

  test("GET /api/v1/readings/{id}/comments memuat komentar", async ({ request }) => {
    const response = await request.get(api(`/api/v1/readings/${readingId}/comments?page=0&size=10`), {
      headers: authHeaders()
    })
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.content.length).toBeGreaterThan(0)
    const found = body.content.find((c: any) => c.id === commentId)
    expect(found).toBeTruthy()
  })

  test("POST /api/v1/readings/{id}/comments/{parentId}/replies membuat balasan", async ({ request }) => {
    const response = await request.post(api(`/api/v1/readings/${readingId}/comments/${commentId}/replies`), {
      headers: authHeaders(),
      data: { content: "Ini balasan test e2e" }
    })
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.content).toBe("Ini balasan test e2e")
    expect(body.id).toBeTruthy()
    replyId = body.id
  })

  test("PUT /api/v1/readings/{id}/comments/{commentId} mengupdate komentar", async ({ request }) => {
    const response = await request.put(api(`/api/v1/readings/${readingId}/comments/${commentId}`), {
      headers: authHeaders(),
      data: { content: "Komentar telah diupdate" }
    })
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.content).toBe("Komentar telah diupdate")
  })

  test("POST /api/v1/comments/{commentId}/reactions menambahkan reaksi", async ({ request }) => {
    const response = await request.post(api(`/api/v1/comments/${commentId}/reactions`), {
      headers: authHeaders(),
      data: { reactionType: "UPVOTE" }
    })
    expect(response.ok()).toBeTruthy()
  })

  test("DELETE /api/v1/comments/{commentId}/reactions menghapus reaksi", async ({ request }) => {
    const response = await request.delete(api(`/api/v1/comments/${commentId}/reactions`), {
      headers: authHeaders()
    })
    expect(response.ok()).toBeTruthy()
  })

  test("DELETE /api/v1/readings/{id}/comments/{commentId} menghapus komentar", async ({ request }) => {
    const response = await request.delete(api(`/api/v1/readings/${readingId}/comments/${commentId}`), {
      headers: authHeaders()
    })
    expect(response.ok()).toBeTruthy()
  })
})
