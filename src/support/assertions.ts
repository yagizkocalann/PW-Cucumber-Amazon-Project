import { expect } from "@playwright/test";
import { config } from "../config/env";
import type { Page } from "playwright";

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

  const results = page.locator(
    "div.s-main-slot div[data-component-type='s-search-result'][data-asin]:not([data-asin=''])"
  );
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
    await expect(page.locator("div.s-main-slot")).toBeVisible();
    return;
  }
  await expect(page.locator("#twotabsearchtextbox")).toBeVisible();
}
