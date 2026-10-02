import { expect, test, type Page } from "@playwright/test";

const currencies = [
  { code: "EUR", name: "Euro", symbol: "€", precision: 2 },
  { code: "JPY", name: "Yen", symbol: "¥", precision: 0 },
  { code: "PLN", name: "Zloty", symbol: "zł", precision: 2 },
  { code: "USD", name: "US Dollar", symbol: "$", precision: 2 },
];

const RATES: Record<string, number> = {
  "USD:EUR": 0.9,
  "EUR:USD": 1.1,
  "USD:PLN": 4,
  "JPY:EUR": 0.006,
};

async function mockApi(page: Page) {
  const convertRequests: Record<string, string>[] = [];

  await page.route("**/api/currencies", (route) => route.fulfill({ json: currencies }));
  await page.route("**/api/convert?*", (route) => {
    const params = Object.fromEntries(new URL(route.request().url()).searchParams);
    convertRequests.push(params);
    const { from, to, amount } = params as Record<string, string>;
    const value = Number(amount) * (RATES[`${from}:${to}`] ?? 1);
    return route.fulfill({
      json: { from, to, amount: Number(amount), value, timestamp: 1_790_000_000 },
    });
  });

  return { convertRequests };
}

function converter(page: Page) {
  return {
    amount: page.getByRole("textbox", { name: "Amount", exact: true }),
    converted: page.getByRole("textbox", { name: "Converted amount" }),
    from: page.getByRole("combobox", { name: "From" }),
    to: page.getByRole("combobox", { name: "To" }),
    result: page.getByTestId("conversion-result"),
    swap: page.getByRole("button", { name: "Swap currencies" }),
  };
}

// Every test gets a fresh browser context, so localStorage starts empty.

test("converts the default amount on load", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  const ui = converter(page);

  await expect(ui.result).toHaveText("0.90 Euro");
  await expect(page.getByText("1 US Dollar equals")).toBeVisible();
  await expect(ui.converted).toHaveValue("0.90");
  await expect(ui.from).toHaveValue("USD - US Dollar");
  await expect(ui.to).toHaveValue("EUR - Euro");
});

test("converts while typing with a single debounced request", async ({ page }) => {
  const api = await mockApi(page);
  await page.goto("/");
  const ui = converter(page);
  await expect(ui.result).toHaveText("0.90 Euro");

  await ui.amount.fill("");
  await ui.amount.pressSequentially("1250", { delay: 50 });

  await expect(ui.result).toHaveText("1,125.00 Euro");
  await expect(ui.converted).toHaveValue("1,125.00");
  expect(api.convertRequests.map((r) => r.amount)).not.toContain("12");
});

test("clearing the amount shows a hint and no loading state", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  const ui = converter(page);
  await expect(ui.result).toBeVisible();

  await ui.amount.fill("");
  await page.waitForTimeout(600); // past the debounce

  await expect(page.getByText(/Enter an amount greater than 0 to convert/)).toBeVisible();
  await expect(ui.converted).toHaveValue("");
  await expect(page.locator(".mantine-Loader-root")).toHaveCount(0);
});

test("searches currencies by name and swaps them", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  const ui = converter(page);
  await expect(ui.result).toBeVisible();

  await ui.to.click();
  await ui.to.fill("zlo");
  await page.getByRole("option", { name: "PLN - Zloty" }).click();
  await expect(ui.result).toHaveText("4.00 Zloty");

  await ui.swap.click();
  await expect(ui.from).toHaveValue("PLN - Zloty");
  await expect(ui.to).toHaveValue("USD - US Dollar");
});

test("keeps the amount within the precision of the selected currency", async ({ page }) => {
  const api = await mockApi(page);
  await page.goto("/");
  const ui = converter(page);
  await expect(ui.result).toBeVisible();

  await ui.amount.fill("1.55");
  await ui.from.click();
  await page.getByRole("option", { name: "JPY - Yen" }).click();

  await expect(ui.amount).toHaveValue("2");
  await expect(page.getByText("2 Yen equals")).toBeVisible();
  expect(api.convertRequests.filter((r) => r.from === "JPY").map((r) => r.amount)).toEqual(["2"]);
});

test("remembers the selected pair after a reload", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  const ui = converter(page);
  await expect(ui.result).toBeVisible();
  await ui.swap.click();
  await expect(ui.from).toHaveValue("EUR - Euro");

  await page.reload();

  await expect(ui.from).toHaveValue("EUR - Euro");
  await expect(ui.to).toHaveValue("USD - US Dollar");
});

test("shows API errors and recovers on retry", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/convert?*", (route) =>
    route.fulfill({ status: 429, json: { error: { message: "Rate limit reached." } } }),
  );
  await page.goto("/");

  const alert = page.getByRole("alert", { name: "Conversion failed" });
  await expect(alert).toContainText("Rate limit reached.");

  await page.unroute("**/api/convert?*");
  await mockApi(page);
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(converter(page).result).toHaveText("0.90 Euro");
});
