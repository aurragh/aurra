import { test, expect } from "@playwright/test";

test.describe("Aurra production smoke tests", () => {
  test("landing page loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("#root")).toBeAttached();
  });

  test("Get Started CTA redirects to Google OAuth", async ({ page }) => {
    await page.goto("/");
    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().includes("accounts.google.com")),
      page.getByRole("link", { name: /get started/i }).first().click().catch(() => {}),
    ]);
    const url = decodeURIComponent(request.url());
    expect(url).toContain("client_id=");
    expect(url).toContain("/api/auth/google/callback");
  });

  test("unauthenticated /api/auth/user returns 401", async ({ request }) => {
    const res = await request.get("/api/auth/user");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Unauthorized");
  });

  test("/api/login redirects to Google with correct OAuth params", async ({ request }) => {
    const res = await request.get("/api/login", { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    const location = res.headers()["location"];
    expect(location).toContain("accounts.google.com");
    expect(location).toContain("scope=profile%20email");
  });

  test("404 for unknown routes still serves the SPA shell", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    // SPA should return 200 and render its own NotFound component
    expect(response?.status()).toBe(200);
  });
});
