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

function clanLeaveButton(page: import("@playwright/test").Page) {
  return page.locator("main").getByRole("button", { name: /^Keluar$/i })
}

// ---------------------------------------------------------------------------
// Auth guard — semua route clans harus redirect jika belum login
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Frontend-backend flow — serial, membutuhkan NEXT_PUBLIC_API_URL
// ---------------------------------------------------------------------------
test.describe.serial("Clans frontend-backend flow", () => {
  test.skip(!apiURL, "NEXT_PUBLIC_API_URL is required for Clans integration E2E")

  // --- Setup users ---

  test("register leader user untuk pengujian clan", async ({ page }) => {
    await registerViaUi(page, leaderUser)
  })

  test("register member user untuk pengujian join clan", async ({ page }) => {
    await registerViaUi(page, memberUser)
  })

  // --- Halaman daftar clan (/clans) ---

  test("halaman /clans tampil dengan benar setelah login", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans")

    await expect(page).toHaveURL(/\/clans$/)
    await expect(page.locator("h1").filter({ hasText: "Clans" })).toBeVisible()
    await expect(page.getByText(/Bergabunglah dengan clan/i).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /Buat Clan/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Leaderboard/i })).toBeVisible()
  })

  // --- Halaman create clan (/clans/create) ---

  test("halaman /clans/create tampil dengan form yang benar", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/create")

    await expect(page).toHaveURL(/\/clans\/create/)
    // CardTitle bukan heading element, pakai getByText
    await expect(page.getByText("Buat Clan").first()).toBeVisible()
    await expect(page.getByText(/Kamu akan menjadi pemimpin/i).first()).toBeVisible()
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

    // Input punya required, HTML5 validation mencegah submit
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

  // --- Daftar clan setelah clan dibuat ---

  test("clan baru muncul di daftar clan dengan info lengkap", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans")

    await expect(page.getByText(testClanName).first()).toBeVisible()
    await expect(page.getByText(testClanDescription).first()).toBeVisible()
    await expect(page.getByText(/BRONZE/).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /Lihat Detail/i }).first()).toBeVisible()
  })

  test("klik Lihat Detail membuka halaman detail clan", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans")

    await page.getByRole("link", { name: /Lihat Detail/i }).first().click()

    await expect(page).toHaveURL(/\/clans\/\d+/)
  })

  // --- Detail clan sebagai leader ---

  test("halaman detail clan tampil benar sebagai leader", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    // Nama clan di CardTitle (div, bukan heading)
    await expect(page.getByText(testClanName).first()).toBeVisible()
    await expect(page.getByText(/BRONZE/).first()).toBeVisible()
    await expect(page.getByText(testClanDescription).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /Hapus Clan/i })).toBeVisible()
    // CardTitle "Anggota (N)" — pakai pola spesifik agar tidak bentrok dengan "N anggota"
    await expect(page.getByText(/Anggota \(\d+\)/).first()).toBeVisible()
    // Role badge teks "LEADER"
    await expect(page.getByText("LEADER").first()).toBeVisible()
  })

  test("tombol Request Join dan Keluar tidak tampil untuk leader clan sendiri", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByRole("button", { name: /Request Join/i })).not.toBeVisible()
    await expect(clanLeaveButton(page)).not.toBeVisible()
  })

  // --- Detail clan sebagai non-anggota (memberUser) ---

  test("tombol Request Join tampil untuk user non-anggota", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByRole("button", { name: /Request Join/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Hapus Clan/i })).not.toBeVisible()
    await expect(clanLeaveButton(page)).not.toBeVisible()
  })

  test("user non-anggota berhasil mengirim request join", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Request Join/i }).click()

    // Pesan sukses dari handleJoin(): "Permintaan bergabung terkirim! Tunggu persetujuan leader."
    await expect(page.getByText(/Permintaan bergabung terkirim/i)).toBeVisible()
  })

  // --- Leader mengelola join request ---

  test("leader melihat permintaan bergabung yang pending di halaman detail", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByText(/Permintaan Bergabung/i).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /Setujui/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Tolak/i })).toBeVisible()
  })

  test("leader berhasil menolak permintaan bergabung", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Tolak/i }).first().click()

    // Setelah ditolak, section join request menghilang
    await expect(page.getByRole("button", { name: /Setujui/i })).not.toBeVisible({ timeout: 5000 })
  })

  test("member user bisa request join lagi setelah ditolak", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByRole("button", { name: /Request Join/i })).toBeVisible()
    await page.getByRole("button", { name: /Request Join/i }).click()

    await expect(page.getByText(/Permintaan bergabung terkirim/i)).toBeVisible()
  })

  test("leader berhasil menyetujui permintaan bergabung", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Setujui/i }).first().click()

    // Setelah disetujui, section join request menghilang
    await expect(page.getByRole("button", { name: /Setujui/i })).not.toBeVisible({ timeout: 5000 })
  })

  test("member tampil di daftar anggota setelah disetujui", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(page.getByText(/Anggota \(2\)/).first()).toBeVisible()
    await expect(page.getByText("MEMBER").first()).toBeVisible()
  })

  // --- Detail clan sebagai member biasa ---

  test("halaman detail clan tampil benar untuk anggota biasa", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await expect(clanLeaveButton(page)).toBeVisible()
    await expect(page.getByRole("button", { name: /Hapus Clan/i })).not.toBeVisible()
    await expect(page.getByRole("button", { name: /Request Join/i })).not.toBeVisible()
  })

  // --- Dialog keluar clan ---

  test("dialog konfirmasi keluar clan muncul dengan konten yang benar", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await clanLeaveButton(page).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: "Keluar dari Clan" })).toBeVisible()
    await expect(dialog.getByText(/Apakah kamu yakin ingin keluar/i)).toBeVisible()
    await expect(dialog.getByRole("button", { name: /Batal/i })).toBeVisible()
    await expect(dialog.getByRole("button", { name: /Keluar/i })).toBeVisible()
  })

  test("batal keluar clan menutup dialog dan tetap di halaman", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await clanLeaveButton(page).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    await page.getByRole("dialog").getByRole("button", { name: /Batal/i }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/clans/${createdClanId}`))
  })

  test("member berhasil keluar dari clan melalui dialog konfirmasi", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, memberUser)
    await page.goto(`/clans/${createdClanId}`)

    await clanLeaveButton(page).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    // Scoped ke dialog supaya tidak ambigu dengan trigger button
    await page.getByRole("dialog").getByRole("button", { name: /Keluar/i }).click()

    await expect(page).toHaveURL(/\/clans$/)
  })

  // --- Leaderboard ---

  test("halaman leaderboard tampil dengan semua tab divisi", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await expect(page).toHaveURL(/\/clans\/leaderboard/)
    // <h1> asli, bukan CardTitle
    await expect(page.getByRole("heading", { name: /Leaderboard Liga/i })).toBeVisible()
    await expect(page.getByText(/Peringkat clan berdasarkan divisi/i).first()).toBeVisible()
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
    // CardTitle berubah jadi "Divisi BRONZE"
    await expect(page.getByText(/Divisi BRONZE/).first()).toBeVisible()
  })

  test("tab leaderboard SILVER bisa dipilih dan konten berubah", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("button", { name: "SILVER" }).click()

    await expect(page.getByRole("button", { name: "SILVER" })).toHaveAttribute("data-active", "true")
    await expect(page.getByText(/Divisi SILVER/).first()).toBeVisible()
  })

  test("tab leaderboard GOLD bisa dipilih dan konten berubah", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("button", { name: "GOLD" }).click()

    await expect(page.getByRole("button", { name: "GOLD" })).toHaveAttribute("data-active", "true")
    await expect(page.getByText(/Divisi GOLD/).first()).toBeVisible()
  })

  test("tab leaderboard DIAMOND bisa dipilih dan konten berubah", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("button", { name: "DIAMOND" }).click()

    await expect(page.getByRole("button", { name: "DIAMOND" })).toHaveAttribute("data-active", "true")
    await expect(page.getByText(/Divisi DIAMOND/).first()).toBeVisible()
  })

  test("tombol kembali di leaderboard mengarah ke /clans", async ({ page }) => {
    await loginViaUi(page, leaderUser)
    await page.goto("/clans/leaderboard")

    await page.getByRole("link", { name: /Kembali ke Clans/i }).click()

    await expect(page).toHaveURL(/\/clans$/)
  })

  // --- Dialog hapus clan ---

  test("dialog konfirmasi hapus clan muncul dengan konten yang benar", async ({ page }) => {
    if (!createdClanId) throw new Error("createdClanId belum tersedia")
    await loginViaUi(page, leaderUser)
    await page.goto(`/clans/${createdClanId}`)

    await page.getByRole("button", { name: /Hapus Clan/i }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: "Hapus Clan" })).toBeVisible()
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
