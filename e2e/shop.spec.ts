import { expect, test } from "@playwright/test";

// pre-accept the consent banner so it never intercepts clicks
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "vc_consent", value: "declined", url: "http://localhost:3000" },
  ]);
});

test.describe("storefront critical path", () => {
  test("browse: home -> category -> filter -> product", async ({ page }) => {
    await page.goto("/nl");
    await expect(page.getByRole("heading", { name: "Jouw fiets, jouw stad" })).toBeVisible();

    // category via header nav
    await page.getByRole("navigation", { name: "Categorieën" }).getByText("Racefietsen").click();
    await expect(page.getByRole("heading", { name: "Racefietsen" })).toBeVisible();

    // facet filter: material carbon (state flows through the URL, so click
    // and assert on navigation rather than the checkbox itself)
    await page.getByLabel(/Carbon/).first().click();
    await expect(page).toHaveURL(/materiaal=carbon/);

    // open the first product card
    await page.locator("a[href*='/product/']").first().click();
    await expect(page.getByRole("button", { name: "In winkelwagen" })).toBeVisible();
  });

  test("search with typo finds products", async ({ page }) => {
    await page.goto("/nl/zoeken?q=racefits");
    await expect(page.getByRole("heading", { name: /Resultaten voor/ })).toBeVisible();
    await expect(page.locator("a[href*='/product/']").first()).toBeVisible();
  });

  test("full purchase: product -> cart -> checkout -> demo pay -> confirmation", async ({
    page,
  }) => {
    // product page with stock (seeded bestseller)
    await page.goto("/nl/product/vondel-stadsrijder-3");
    await page.getByRole("button", { name: "In winkelwagen" }).click();

    // mini-cart opens -> go to cart page
    await page.getByRole("link", { name: "Naar winkelwagen" }).click();
    await expect(page.getByRole("heading", { name: "Winkelwagen" })).toBeVisible();

    await page.getByRole("link", { name: "Afrekenen" }).click();
    await expect(page.getByRole("heading", { name: "Afrekenen" })).toBeVisible();

    // contact + address (postcode autofill kicks in)
    await page.getByLabel("E-mailadres *").fill("e2e@test.example");
    await page.getByLabel("Voornaam *").fill("Test");
    await page.getByLabel("Achternaam *").fill("Koper");
    await page.getByLabel("Postcode *").fill("1071AA");
    await page.getByLabel("Huisnummer *").fill("12");
    await expect(page.getByText("Adres automatisch ingevuld")).toBeVisible();

    // promo code
    await page.getByLabel("Kortingscode").fill("VONDEL10");
    await page.getByRole("button", { name: "Toepassen" }).click();
    await expect(page.getByText(/Korting toegepast/)).toBeVisible();

    await page.getByRole("button", { name: "Bestellen en betalen" }).click();

    // demo payment page
    await expect(page.getByRole("button", { name: "Betaal (demo-iDEAL)" })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Betaal (demo-iDEAL)" }).click();

    // confirmation (polling resolves to paid)
    await expect(page.getByRole("heading", { name: "Bedankt voor je bestelling!" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/VC-\d{4}-\d{5}/)).toBeVisible();
  });
});
