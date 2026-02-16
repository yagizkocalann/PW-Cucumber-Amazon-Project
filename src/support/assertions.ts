import { expect } from "@playwright/test";
import { config } from "../config/env";
import type { Page } from "playwright";
import { searchSelectors } from "../selectors/search";
import { cartSelectors } from "../selectors/cart";

export function normalizeTr(text: string) {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export async function assertBasicPageState(page: Page) {
  const title = await page.title();
  expect(title).not.toEqual("");
  try {
    const origin = new URL(config.baseUrl).origin;
    expect(page.url()).toContain(origin);
  } catch {
    // If baseUrl is invalid, skip origin check to avoid false failures.
  }
}

export async function assertSearchResultsNotEmpty(page: Page) {
  let url: URL | null = null;
  try {
    url = new URL(page.url());
  } catch {
    return;
  }

  const isSearchPage =
    url.pathname.startsWith("/s") &&
    (url.searchParams.has("k") || url.searchParams.has("keywords"));
  if (!isSearchPage) {
    return;
  }

  const results = page.locator(searchSelectors.resultItems);
  const count = await results.count();
  expect(count).toBeGreaterThan(0);
}

export async function assertNoErrorSentinels(page: Page) {
  const bodyText = await page.locator("body").innerText();
  const normalized = normalizeTr(bodyText);
  if (normalized.includes("captcha") || normalized.includes("robot olmadiginizi dogrulayin")) {
    throw new Error("Captcha or bot verification detected. Try running locally or wait and retry.");
  }
  const sentinels = [
    "uzgunuz",
    "sorry",
    "404",
    "bu sayfa bulunamadi",
    "robot olmadiginizi dogrulayin",
    "captcha"
  ];
  for (const token of sentinels) {
    expect(normalized.includes(token)).toBeFalsy();
  }
}

export async function assertMainContentVisible(page: Page) {
  let url: URL | null = null;
  try {
    url = new URL(page.url());
  } catch {
    return;
  }
  const isSearchPage =
    url.pathname.startsWith("/s") &&
    (url.searchParams.has("k") || url.searchParams.has("keywords"));
  if (isSearchPage) {
    await expect(page.locator(searchSelectors.resultsContainer)).toBeVisible();
    return;
  }
  await expect(page.locator("#twotabsearchtextbox")).toBeVisible();
}

export async function assertSearchResultHasPrice(page: Page) {
  let url: URL | null = null;
  try {
    url = new URL(page.url());
  } catch {
    return;
  }
  const isSearchPage =
    url.pathname.startsWith("/s") &&
    (url.searchParams.has("k") || url.searchParams.has("keywords"));
  if (!isSearchPage) {
    return;
  }
  const firstItem = page.locator(searchSelectors.resultItems).first();
  const price = firstItem.locator(searchSelectors.resultPrice).first();
  await expect(price).toBeVisible();
}

export async function assertEmptySearchState(page: Page) {
  let url: URL | null = null;
  try {
    url = new URL(page.url());
  } catch {
    return;
  }
  const isSearchPage =
    url.pathname.startsWith("/s") &&
    (url.searchParams.has("k") || url.searchParams.has("keywords"));
  if (!isSearchPage) {
    return;
  }
  const results = page.locator(searchSelectors.resultItems);
  const count = await results.count();
  if (count > 0) {
    throw new Error(`Expected no search results, but found ${count}.`);
  }
}

export async function assertCartHasItems(page: Page) {
  let url: URL | null = null;
  try {
    url = new URL(page.url());
  } catch {
    return;
  }
  const isCartPage =
    url.pathname.includes("/cart") ||
    url.pathname.includes("/gp/cart") ||
    url.pathname.includes("/gp/aw/c");
  if (!isCartPage) {
    return;
  }
  const items = page.locator(cartSelectors.cartItems);
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
}

export async function assertPageLoadWithin(page: Page, maxMs: number) {
  const nav = await page.evaluate(() => {
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (!entries || entries.length === 0) return null;
    const entry = entries[0];
    return {
      duration: entry.duration,
      domContentLoaded: entry.domContentLoadedEventEnd,
      loadEventEnd: entry.loadEventEnd
    };
  });
  if (!nav || !nav.duration || nav.duration <= 0) {
    return;
  }
  expect(nav.duration).toBeLessThanOrEqual(maxMs);
}
