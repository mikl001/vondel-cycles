import { expect, test } from "@playwright/test";

const ORIGIN = "http://localhost:3000";
const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

test.describe("API security guards", () => {
  test("abandoned-cart cron rejects requests without the bearer secret", async ({
    request,
  }) => {
    expect((await request.get("/api/cron/abandoned-carts")).status()).toBe(401);
    const wrong = await request.get("/api/cron/abandoned-carts", {
      headers: { authorization: "Bearer nope" },
    });
    expect(wrong.status()).toBe(401);
  });

  test("same-origin guard blocks a cross-origin cart mutation (CSRF)", async ({
    request,
  }) => {
    const res = await request.post("/api/cart/items", {
      headers: { Origin: "https://evil.example", "content-type": "application/json" },
      data: { variantId: ZERO_UUID, quantity: 1 },
    });
    expect(res.status()).toBe(403);
  });

  test("demo payment endpoint 404s for an unknown order/token", async ({ request }) => {
    const res = await request.post("/api/payments/mock", {
      headers: { Origin: ORIGIN, "content-type": "application/json" },
      data: { orderId: ZERO_UUID, token: ZERO_UUID, outcome: "paid" },
    });
    expect(res.status()).toBe(404);
  });

  test("invoice 404s for an unknown order/token", async ({ request }) => {
    const res = await request.get(
      `/api/invoices/${ZERO_UUID}?token=${ZERO_UUID}`,
    );
    expect(res.status()).toBe(404);
  });

  test("admin CSV export is forbidden without an admin session", async ({ request }) => {
    expect((await request.get("/api/admin/products/csv")).status()).toBe(403);
  });
});

test.describe("admin CSV import bounds", () => {
  test.use({ locale: "en-GB" });

  test("rejects a malformed header and an oversized body", async ({ page }) => {
    // log in as the seeded admin so the request carries the admin session
    await page.context().addCookies([
      { name: "vc_consent", value: "declined", url: ORIGIN },
    ]);
    await page.goto("/nl/login");
    await page.getByLabel("E-mailadres").first().fill("admin@vondelcycles.example");
    await page.getByLabel("Wachtwoord").fill("admin-demo-123");
    await page.getByRole("button", { name: "Inloggen" }).click();
    await expect(page.getByText(/Welkom terug/)).toBeVisible({ timeout: 20_000 });

    const badHeader = await page.request.post("/api/admin/products/csv", {
      headers: { Origin: ORIGIN, "content-type": "text/csv" },
      data: "not,a,valid,header\n",
    });
    expect(badHeader.status()).toBe(400);

    const oversized = await page.request.post("/api/admin/products/csv", {
      headers: { Origin: ORIGIN, "content-type": "text/csv" },
      data: "sku," + "x".repeat(1_000_001),
    });
    expect(oversized.status()).toBe(413);
  });
});
