import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "@/test/http";
import { renderWithProviders } from "@/test/render";
import type { Currency } from "../api/contracts";
import { CurrencyConverter } from "./CurrencyConverter";

const currencies: Currency[] = [
  { code: "EUR", name: "Euro", symbol: "€", precision: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", precision: 0 },
  { code: "USD", name: "US Dollar", symbol: "$", precision: 2 },
];

const RATES: Record<string, number> = {
  "USD:EUR": 0.9,
  "EUR:USD": 1.1,
  "USD:JPY": 150,
  "JPY:EUR": 0.006,
};

const fetchMock = vi.fn<typeof fetch>();

function mockApi({ convertError }: { convertError?: string } = {}) {
  fetchMock.mockImplementation(async (input) => {
    const url = new URL(String(input), "http://localhost");
    if (url.pathname === "/api/currencies") return jsonResponse(currencies);
    if (url.pathname === "/api/convert") {
      if (convertError) return jsonResponse({ error: { message: convertError } }, 429);
      const { from, to, amount } = Object.fromEntries(url.searchParams) as Record<string, string>;
      const value = Number(amount) * RATES[`${from}:${to}`]!;
      return jsonResponse({ from, to, amount: Number(amount), value, timestamp: 1_700_000_000 });
    }
    return jsonResponse({ error: { message: "Not found" } }, 404);
  });
}

function convertCalls() {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), "http://localhost"))
    .filter((url) => url.pathname === "/api/convert")
    .map((url) => Object.fromEntries(url.searchParams));
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("CurrencyConverter", () => {
  it("populates both selects from the API and converts the default amount", async () => {
    mockApi();
    renderWithProviders(<CurrencyConverter />);

    expect(await screen.findByTestId("conversion-result")).toHaveTextContent("0.90 Euro");
    expect(screen.getByLabelText("From", { selector: "input" })).toHaveValue("USD - US Dollar");
    expect(screen.getByLabelText("To", { selector: "input" })).toHaveValue("EUR - Euro");
    expect(screen.getByRole("textbox", { name: "Converted amount" })).toHaveValue("0.90");
    expect(screen.getByText(/1 USD = 0.9 EUR/)).toBeInTheDocument();
  });

  it("converts the typed amount after the user stops typing", async () => {
    mockApi();
    const user = userEvent.setup();
    renderWithProviders(<CurrencyConverter />);
    await screen.findByTestId("conversion-result");

    const amount = screen.getByRole("textbox", { name: "Amount" });
    await user.clear(amount);
    await user.type(amount, "250");

    await waitFor(() =>
      expect(screen.getByTestId("conversion-result")).toHaveTextContent("225.00 Euro"),
    );
    // Debounced: intermediate values ("2", "25") never reach the API.
    expect(convertCalls().map((c) => c.amount)).toEqual(["1", "250"]);
  });

  it("swaps the currencies", async () => {
    mockApi();
    const user = userEvent.setup();
    renderWithProviders(<CurrencyConverter />);
    await screen.findByTestId("conversion-result");

    await user.click(screen.getByRole("button", { name: "Swap currencies" }));

    expect(screen.getByLabelText("From", { selector: "input" })).toHaveValue("EUR - Euro");
    expect(screen.getByLabelText("To", { selector: "input" })).toHaveValue("USD - US Dollar");
    await waitFor(() =>
      expect(screen.getByTestId("conversion-result")).toHaveTextContent("1.10 US Dollar"),
    );
  });

  it("selects a currency from the searchable list", async () => {
    mockApi();
    const user = userEvent.setup();
    renderWithProviders(<CurrencyConverter />);
    await screen.findByTestId("conversion-result");

    await user.click(screen.getByLabelText("To", { selector: "input" }));
    await user.click(await screen.findByRole("option", { name: "JPY - Japanese Yen" }));

    await waitFor(() =>
      expect(screen.getByTestId("conversion-result")).toHaveTextContent("150 Japanese Yen"),
    );
  });

  it("returns to the idle state (no loading indicator) when the amount is cleared", async () => {
    mockApi();
    const user = userEvent.setup();
    renderWithProviders(<CurrencyConverter />);
    await screen.findByTestId("conversion-result");

    await user.clear(screen.getByRole("textbox", { name: "Amount" }));
    // Let the debounce settle: the state must stay idle, not "refreshing".
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(screen.getByText(/Enter an amount greater than 0 to convert/)).toBeInTheDocument();
    expect(screen.queryByTestId("conversion-result")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Converted amount" })).toHaveValue("");
    expect(document.querySelector("[aria-busy='true']")).toBeNull();
    expect(document.querySelector(".mantine-Loader-root")).toBeNull();
  });

  it("swaps instead of selecting the same currency on both sides", async () => {
    mockApi();
    const user = userEvent.setup();
    renderWithProviders(<CurrencyConverter />);
    await screen.findByTestId("conversion-result");

    await user.click(screen.getByLabelText("To", { selector: "input" }));
    await user.click(await screen.findByRole("option", { name: "USD - US Dollar" }));

    expect(screen.getByLabelText("From", { selector: "input" })).toHaveValue("EUR - Euro");
    expect(screen.getByLabelText("To", { selector: "input" })).toHaveValue("USD - US Dollar");
  });

  it("rounds the amount to the precision of the newly selected currency", async () => {
    mockApi();
    const user = userEvent.setup();
    renderWithProviders(<CurrencyConverter />);
    await screen.findByTestId("conversion-result");

    const amount = screen.getByRole("textbox", { name: "Amount" });
    await user.clear(amount);
    await user.type(amount, "1.55");
    await user.click(screen.getByLabelText("From", { selector: "input" }));
    await user.click(await screen.findByRole("option", { name: "JPY - Japanese Yen" }));

    expect(amount).toHaveValue("2");
    await waitFor(() =>
      expect(screen.getByTestId("conversion-result")).toHaveTextContent("0.01 Euro"),
    );
    // What is shown is what gets converted: no request for 1.55 JPY.
    expect(convertCalls().filter((c) => c.from === "JPY")).toEqual([
      { from: "JPY", to: "EUR", amount: "2" },
    ]);
  });

  it("asks for a positive amount instead of calling the API", async () => {
    mockApi();
    const user = userEvent.setup();
    renderWithProviders(<CurrencyConverter />);
    await screen.findByTestId("conversion-result");

    await user.clear(screen.getByRole("textbox", { name: "Amount" }));
    await user.type(screen.getByRole("textbox", { name: "Amount" }), "0");

    expect(await screen.findByText("Enter an amount greater than 0")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Converted amount" })).toHaveValue("");
    expect(convertCalls()).toHaveLength(1);
  });

  it("shows conversion errors with a retry action", async () => {
    mockApi({ convertError: "Rate limit reached." });
    renderWithProviders(<CurrencyConverter />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Rate limit reached.");

    mockApi();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("conversion-result")).toHaveTextContent("0.90 Euro");
  });

  it("shows an error when currencies cannot be loaded", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: "Service down" } }, 502));
    renderWithProviders(<CurrencyConverter />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Service down");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
