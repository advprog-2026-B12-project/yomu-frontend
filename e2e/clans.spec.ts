import { expect, test } from "@playwright/test"

const apiURL = process.env.NEXT_PUBLIC_API_URL
const testPassword = process.env.E2E_TEST_PASSWORD || "Password123!"
const emailPrefix =
  process.env.E2E_TEST_EMAIL?.split("@")[0] || `e2eclans${Date.now()}`
const emailDomain =
  process.env.E2E_TEST_EMAIL?.split("@")[1] || "example.com"
const uniqueId = `${emailPrefix}${Date.now()}`

const leaderUser = {
  displayName: `Leader ${uniqueId}`,
  username: `lead${uniqueId}`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32),
  email: `leader${uniqueId}@${emailDomain}`,
  password: testPassword,
}

const memberUser = {
  displayName: `Member ${uniqueId}`,
  username: `memb${uniqueId}`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32),
  email: `member${uniqueId}@${emailDomain}`,
  password: testPassword,
}

const testClanName = `Clan E2E ${Date.now()}`
const testClanDescription = "Clan untuk pengujian e2e otomatis."

let createdClanId: number | null = null

async function registerViaUi(
  page: import("@playwright/test").Page,
  user: { displayName: string; username: string; email: string; password: string },
) {
  await page.goto("/auth/register")
  await page.getByLabel("Display Name").fill(user.displayName)
  await page.getByLabel("Username").fill(user.username)
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Daftar Sekarang" }).click()
  await expect(page.getByText(/Akun berhasil/i)).toBeVisible()
}

async function loginViaUi(
  page: import("@playwright/test").Page,
  user: { email: string; password: string },
) {
  await page.goto("/auth/login")
  await page.getByLabel("Username/Email").fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Masuk" }).click()
  await expect(page).toHaveURL(/\/dashboard|\/admin-dashboard/)
}

test.describe("Clans pages - auth guard", () => {
  test("/clans redirect ke beranda jika belum login", async ({ page }) => {
    await page.goto("/clans")
    await expect(page).not.toHaveURL(/\/clans/)
  })

  test("/clans/create redirect ke beranda jika belum login", async ({ page }) => {
    await page.goto("/clans/create")
    await expect(page).not.toHaveURL(/\/clans\/create/)
  })

  test("/clans/leaderboard redirect ke beranda jika belum login", async ({ page }) => {
    await page.goto("/clans/leaderboard")
    await expect(page).not.toHaveURL(/\/clans\/leaderboard/)
  })

  test("/clans/[id] redirect ke beranda jika belum login", async ({ page }) => {
    await page.goto("/clans/1")
    await expect(page).not.toHaveURL(/\/clans\/1/)
  })
})

test.describe.serial("Clans frontend-backend flow", () => {
  test.skip(!apiURL, "NEXT_PUBLIC_API_URL is required for Clans integration E2E")

  test("register leader user untuk pengujian clan", async ({ page }) => {
    await registerViaUi(page, leaderUser)
  })

  test("register member user untuk pengujian join clan", async ({ page }) => {
    await registerViaUi(page, memberUser)
  })

  test("halaman /clans tampil dengan benar setelah login", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans")

    await expect(page).toHaveURL(/\/clans$/)
    await expect(page.locator("h1").filter({ hasText: "Clans" })).toBeVisible()
    await expect(page.getByText(/Bergabunglah dengan clan/i)).toBeVisible()
    await expect(page.getByRole("link", { name: /Buat Clan/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Leaderboard/i })).toBeVisible()
  })

  test("halaman /clans/create tampil dengan form yang benar", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/create")

    await expect(page).toHaveURL(/\/clans\/create/)
    await expect(page.getByRole("heading", { name: "Buat Clan" })).toBeVisible()
    await expect(page.getByText(/Kamu akan menjadi pemimpin/i)).toBeVisible()
    await expect(page.getByLabel("Nama Clan")).toBeVisible()
    await expect(page.getByLabel("Deskripsi")).toBeVisible()
    await expect(page.getByRole("button", { name: "Buat Clan" })).toBeVisible()
    await expect(page.getByRole("link", { name: /Kembali ke daftar clan/i })).toBeVisible()
  })

  test("link kembali di /clans/create mengarah ke /clans", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/create")
    await page.getByRole("link", { name: /Kembali ke daftar clan/i }).click()

    await expect(page).toHaveURL(/\/clans$/)
  })

  test("buat clan dengan nama kosong tidak bisa disubmit", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/create")

    await page.getByRole("button", { name: "Buat Clan" }).click()

    await expect(page).toHaveURL(/\/clans\/create/)
  })

  test("buat clan baru berhasil dan redirect ke daftar clan", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/create")

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/clans") && res.request().method() === "POST",
    )

    await page.getByLabel("Nama Clan").fill(testClanName)
    await page.getByLabel("Deskripsi").fill(testClanDescription)
    await page.getByRole("button", { name: "Buat Clan" }).click()

    const response = await responsePromise
    const created = await response.json()
    createdClanId = created.id

    await expect(page.getByText(/Clan berhasil dibuat/i)).toBeVisible()
    await expect(page).toHaveURL(/\/clans$/)
  })

  test("clan baru muncul di daftar clan dengan info lengkap", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans")

    await expect(page.getByText(testClanName)).toBeVisible()
    await expect(page.getByText(testClanDescription)).toBeVisible()
    await expect(page.getByText(/BRONZE/i).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /Lihat Detail/i }).first()).toBeVisible()
  })

  test("klik Lihat Detail membuka halaman detail clan", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans")

    await page.getByRole("link", { name: /Lihat Detail/i }).first().click()

    await expect(page).toHaveURL(/\/clans\/\d+/)
  })

  test("halaman detail clan tampil benar sebagai leader", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByRole("heading", { name: testClanName })).toBeVisible()
    await expect(page.getByText(/BRONZE/i).first()).toBeVisible()
    await expect(page.getByText(testClanDescription)).toBeVisible()
    await expect(page.getByRole("button", { name: /Hapus Clan/i })).toBeVisible()
    await expect(page.getByText(/Anggota/i)).toBeVisible()
    await expect(page.getByText(/LEADER/i)).toBeVisible()
  })

  test("tombol Request Join dan Keluar tidak tampil untuk leader clan sendiri", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByRole("button", { name: /Request Join/i })).not.toBeVisible()
    await expect(page.getByRole("button", { name: /^Keluar$/i })).not.toBeVisible()
  })

  test("tombol Request Join tampil untuk user non-anggota", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByRole("button", { name: /Request Join/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Hapus Clan/i })).not.toBeVisible()
    await expect(page.getByRole("button", { name: /^Keluar$/i })).not.toBeVisible()
  })

  test("user non-anggota berhasil mengirim request join", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Request Join/i }).click()

    await expect(page.getByText(/Permintaan bergabung berhasil/i)).toBeVisible()
  })

  test("leader melihat permintaan bergabung yang pending di halaman detail", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByText(/Permintaan Bergabung/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /Setujui/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Tolak/i })).toBeVisible()
  })

  test("leader berhasil menolak permintaan bergabung", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Tolak/i }).first().click()

    await expect(page.getByRole("button", { name: /Setujui/i })).not.toBeVisible({ timeout: 5000 })
  })

  test("member user bisa request join lagi setelah ditolak", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByRole("button", { name: /Request Join/i })).toBeVisible()
    await page.getByRole("button", { name: /Request Join/i }).click()

    await expect(page.getByText(/Permintaan bergabung berhasil/i)).toBeVisible()
  })

  test("leader berhasil menyetujui permintaan bergabung", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Setujui/i }).first().click()

    await expect(page.getByRole("button", { name: /Setujui/i })).not.toBeVisible({ timeout: 5000 })
  })

  test("member tampil di daftar anggota setelah disetujui", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByText(/Anggota \(2\)/i)).toBeVisible()
    await expect(page.getByText(/MEMBER/i)).toBeVisible()
  })

  test("halaman detail clan tampil benar untuk anggota biasa", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByRole("button", { name: /Keluar/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Hapus Clan/i })).not.toBeVisible()
    await expect(page.getByRole("button", { name: /Request Join/i })).not.toBeVisible()
  })

  test("dialog konfirmasi keluar clan muncul dengan konten yang benar", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Keluar/i }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Keluar dari Clan/i)).toBeVisible()
    await expect(dialog.getByText(/Apakah kamu yakin ingin keluar/i)).toBeVisible()
    await expect(dialog.getByRole("button", { name: /Batal/i })).toBeVisible()
    await expect(dialog.getByRole("button", { name: /Keluar/i })).toBeVisible()
  })

  test("batal keluar clan menutup dialog dan tetap di halaman", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Keluar/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    await page.getByRole("dialog").getByRole("button", { name: /Batal/i }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/clans/${createdClanId}`))
  })

  test("member berhasil keluar dari clan melalui dialog konfirmasi", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Keluar/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("dialog").getByRole("button", { name: /Keluar/i }).click()

    await expect(page).toHaveURL(/\/clans$/)
  })

  test("halaman leaderboard tampil dengan semua tab divisi", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await expect(page).toHaveURL(/\/clans\/leaderboard/)
    await expect(page.getByRole("heading", { name: /Leaderboard Liga/i })).toBeVisible()
    await expect(page.getByText(/Peringkat clan berdasarkan divisi/i)).toBeVisible()
    await expect(page.getByRole("button", { name: "Divisi Saya" })).toBeVisible()
    await expect(page.getByRole("button", { name: "BRONZE" })).toBeVisible()
    await expect(page.getByRole("button", { name: "SILVER" })).toBeVisible()
    await expect(page.getByRole("button", { name: "GOLD" })).toBeVisible()
    await expect(page.getByRole("button", { name: "DIAMOND" })).toBeVisible()
  })

  test("tab Divisi Saya aktif secara default di leaderboard", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await expect(page.getByRole("button", { name: "Divisi Saya" })).toHaveAttribute(
      "data-active",
      "true",
    )
  })

  test("tab leaderboard BRONZE bisa dipilih dan konten berubah", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("button", { name: "BRONZE" }).click()

    await expect(page.getByRole("button", { name: "BRONZE" })).toHaveAttribute("data-active", "true")
    await expect(page.getByText(/Divisi BRONZE/i)).toBeVisible()
  })

  test("tab leaderboard SILVER bisa dipilih dan konten berubah", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("button", { name: "SILVER" }).click()

    await expect(page.getByRole("button", { name: "SILVER" })).toHaveAttribute("data-active", "true")
    await expect(page.getByText(/Divisi SILVER/i)).toBeVisible()
  })

  test("tab leaderboard GOLD bisa dipilih dan konten berubah", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("button", { name: "GOLD" }).click()

    await expect(page.getByRole("button", { name: "GOLD" })).toHaveAttribute("data-active", "true")
    await expect(page.getByText(/Divisi GOLD/i)).toBeVisible()
  })

  test("tab leaderboard DIAMOND bisa dipilih dan konten berubah", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("button", { name: "DIAMOND" }).click()

    await expect(page.getByRole("button", { name: "DIAMOND" })).toHaveAttribute("data-active", "true")
    await expect(page.getByText(/Divisi DIAMOND/i)).toBeVisible()
  })

  test("tombol kembali di leaderboard mengarah ke /clans", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("link", { name: /Kembali ke Clans/i }).click()

    await expect(page).toHaveURL(/\/clans$/)
  })

  test("dialog konfirmasi hapus clan muncul dengan konten yang benar", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Hapus Clan/i }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Hapus Clan/i)).toBeVisible()
    await expect(dialog.getByText(/Apakah kamu yakin ingin menghapus/i)).toBeVisible()
    await expect(dialog.getByText(/tidak bisa dibatalkan/i)).toBeVisible()
    await expect(dialog.getByRole("button", { name: /Batal/i })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Hapus" })).toBeVisible()
  })

  test("batal hapus clan menutup dialog dan tetap di halaman", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Hapus Clan/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    await page.getByRole("dialog").getByRole("button", { name: /Batal/i }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/clans/${createdClanId}`))
  })

  test("hapus clan berhasil melalui dialog konfirmasi", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Hapus Clan/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("dialog").getByRole("button", { name: "Hapus" }).click()

    await expect(page).toHaveURL(/\/clans$/)
  })
})
