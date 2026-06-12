import { expect, test } from "@playwright/test";

const uniqueEmail = `e2e-${Date.now()}@test.example`;

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "vc_consent", value: "declined", url: "http://localhost:3000" },
  ]);
});

test.describe("auth + account", () => {
  test("register, see account, log out", async ({ page }) => {
    await page.goto("/nl/registreren");
    await page.getByLabel("Naam").fill("E2E Tester");
    await page.getByLabel("E-mailadres").fill(uniqueEmail);
    await page.getByLabel("Wachtwoord").fill("e2e-password-123");
    await page.getByRole("button", { name: "Account aanmaken" }).click();

    await expect(page.getByText(/Welkom terug/)).toBeVisible({ timeout: 20_000 });

    // address book CRUD
    await page.getByRole("link", { name: "Adressen" }).click();
    await page.getByRole("button", { name: /Adres toevoegen/ }).click();
    await page.getByLabel("Voornaam *").fill("E2E");
    await page.getByLabel("Achternaam *").fill("Tester");
    await page.getByLabel("Postcode *").fill("1012 AB");
    await page.getByLabel("Huisnummer *").fill("1");
    await page.getByLabel("Straat *").fill("Teststraat");
    await page.getByLabel("Plaats *").fill("Amsterdam");
    await page.getByRole("button", { name: "Opslaan" }).click();
    await expect(page.getByText("Teststraat 1")).toBeVisible();

    await page.getByRole("button", { name: "Uitloggen" }).click();
    await expect(page).toHaveURL(/\/nl$/);
  });
});

test.describe("admin back-office", () => {
  test.use({ locale: "en-GB" });

  test("admin can log in, see dashboard and toggle a product", async ({ page }) => {
    await page.goto("/nl/login");
    await page.getByLabel("E-mailadres").first().fill("admin@vondelcycles.example");
    await page.getByLabel("Wachtwoord").fill("admin-demo-123");
    await page.getByRole("button", { name: "Inloggen" }).click();
    await expect(page.getByText(/Welkom terug/)).toBeVisible({ timeout: 20_000 });

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Revenue (14d)")).toBeVisible();

    // products: toggle the first product status and back
    await page.goto("/admin/products");
    const statusButton = page.locator("tbody button[title^='Click to make']").first();
    const before = await statusButton.innerText();
    await statusButton.click();
    await expect(page.locator("tbody button[title^='Click to make']").first()).not.toHaveText(
      before,
      { timeout: 10_000 },
    );
    // restore
    await page.locator("tbody button[title^='Click to make']").first().click();
    await expect(page.locator("tbody button[title^='Click to make']").first()).toHaveText(before, {
      timeout: 10_000,
    });

    // the toggles are audited
    await page.goto("/admin/audit");
    await expect(page.getByText("product.status").first()).toBeVisible();
  });
});
