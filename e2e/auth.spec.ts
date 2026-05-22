import { expect, test } from "@playwright/test";

const apiURL = process.env.NEXT_PUBLIC_API_URL;
const testPassword = process.env.E2E_TEST_PASSWORD || "Password123!";
const emailPrefix =
  process.env.E2E_TEST_EMAIL?.split("@")[0] || `e2e${Date.now()}`;
const emailDomain = process.env.E2E_TEST_EMAIL?.split("@")[1] || "example.com";
const uniqueId = `${emailPrefix}${Date.now()}`;

const testUser = {
  displayName: `Yomu E2E ${uniqueId}`,
  username: `yomu${uniqueId}`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32),
  email: `${uniqueId}@${emailDomain}`,
  password: testPassword,
};

async function registerViaUi(page: import("@playwright/test").Page) {
  await page.goto("/auth/register");
  await page.getByLabel("Display Name").fill(testUser.displayName);
  await page.getByLabel("Username").fill(testUser.username);
  await page.getByLabel("Email").fill(testUser.email);
  await page.getByLabel("Password").fill(testUser.password);
  await page.getByRole("button", { name: "Daftar Sekarang" }).click();
}

async function loginViaUi(
  page: import("@playwright/test").Page,
  password = testUser.password,
) {
  await page.goto("/auth/login");
  await page.getByLabel("Username/Email").fill(testUser.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}

test.describe("Auth pages", () => {
  test("login page render", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page).toHaveURL(/\/auth\/login/);

    const loginForm = page.locator("form");
    await expect(loginForm.getByLabel("Username/Email")).toBeVisible();
    await expect(loginForm.getByLabel("Password")).toBeVisible();
    await expect(loginForm.getByRole("button", { name: /Masuk|Login/i })).toBeVisible();
  });

  test("register page render", async ({ page }) => {
    await page.goto("/auth/register");

    await expect(page).toHaveURL(/\/auth\/register/);

    const registerForm = page.locator("form");
    await expect(registerForm.getByLabel("Display Name")).toBeVisible();
    await expect(registerForm.getByLabel("Username")).toBeVisible();
    await expect(registerForm.getByLabel("Email")).toBeVisible();
    await expect(registerForm.getByLabel("Password")).toBeVisible();
    await expect(registerForm.getByRole("button", { name: /Daftar|Register/i })).toBeVisible();
  });
});

test.describe.serial("Auth frontend-backend flow", () => {
  test.skip(!apiURL, "NEXT_PUBLIC_API_URL is required for Auth integration E2E");

  test("register user berhasil dengan data unik", async ({ page }) => {
    await registerViaUi(page);

    await expect(page.getByText(/Akun berhasil/i)).toBeVisible();
  });

  test("register duplikat gagal", async ({ page }) => {
    await registerViaUi(page);

    await expect(page.getByText(/Pendaftaran gagal/i)).toBeVisible();
  });

  test("login berhasil dengan user valid", async ({ page }) => {
    await loginViaUi(page);

    await expect(page).toHaveURL(/\/dashboard|\/admin-dashboard/);
    await expect(page.locator("main h1").filter({ hasText: testUser.username })).toBeVisible();
  });

  test("login password salah gagal", async ({ page }) => {
    await loginViaUi(page, `${testUser.password}-wrong`);

    await expect(page.getByText(/Login Gagal/i)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("protected route redirect ke login jika belum login", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("logout jika tersedia", async ({ page }) => {
    await loginViaUi(page);
    await expect(page).toHaveURL(/\/dashboard|\/admin-dashboard/);

    const logoutButton = page.getByRole("button", { name: "Keluar (Logout)" });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
