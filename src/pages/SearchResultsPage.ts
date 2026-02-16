import { BasePage } from "./BasePage";
import { searchSelectors } from "../selectors/search";
import { retry } from "../support/retry";

export class SearchResultsPage extends BasePage {
  private resultsContainer = searchSelectors.resultsContainer;
  private resultItems = searchSelectors.resultItems;
  private resultTitles = `${searchSelectors.resultItems} ${searchSelectors.resultTitle}`;

  async waitForResults() {
    await this.waitForReady();
  }

  private async getResultItems() {
    const heading = this.page.getByRole("heading", { name: /sonu(c|ç)lar/i }).first();
    if (await heading.count()) {
      const section = heading.locator(
        "xpath=ancestor::div[contains(@class,'s-main-slot')][1]"
      );
      if (await section.count()) {
        const sectionItems = section.locator(
          "div[data-component-type='s-search-result'][data-asin]:not([data-asin=''])"
        );
        if (await sectionItems.count()) {
          return sectionItems;
        }
      }
      const afterItems = heading.locator(
        "xpath=following::div[@data-component-type='s-search-result' and string-length(@data-asin)>0]"
      );
      if (await afterItems.count()) {
        return afterItems;
      }
    }
    return this.page.locator(this.resultItems);
  }

  private normalize(text: string) {
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

  async getFirstMatchingTitle(expected: string): Promise<string> {
    await this.waitForResults();
    const expectedNormalized = this.normalize(expected);
    const root = expectedNormalized.includes("kulakl") ? "kulakl" : expectedNormalized;

    const items = await this.getResultItems();
    const titles = items.locator("h2 span");
    const titleCount = await titles.count();
    for (let i = 0; i < titleCount; i++) {
      const text = (await titles.nth(i).innerText()).trim();
      if (!text) continue;
      const normalized = this.normalize(text);
      if (normalized.includes(root)) {
        return text;
      }
    }

    const itemCount = await items.count();
    for (let i = 0; i < itemCount; i++) {
      const text = (await items.nth(i).innerText()).trim();
      if (!text) continue;
      const normalized = this.normalize(text);
      if (normalized.includes(root)) {
        const title = (await items.nth(i).locator("h2 a span").first().innerText()).trim();
        return title || text;
      }
    }
    throw new Error("No matching result title found.");
  }

  async findAnyMatchingTitle(expectedA: string, expectedB: string): Promise<string | null> {
    await this.waitForResults();
    const a = this.normalize(expectedA);
    const b = this.normalize(expectedB);
    const roots = [
      a.includes("kulakl") ? "kulakl" : a,
      b.includes("kulakl") ? "kulakl" : b
    ];

    const items = await this.getResultItems();
    const titles = items.locator("h2 span");
    const titleCount = await titles.count();
    for (let i = 0; i < titleCount; i++) {
      const text = (await titles.nth(i).innerText()).trim();
      if (!text) continue;
      const normalized = this.normalize(text);
      if (roots.some(root => normalized.includes(root))) {
        return text;
      }
    }
    return null;
  }

  async getSampleTitles(limit = 5): Promise<string[]> {
    await this.waitForResults();
    const items = await this.getResultItems();
    const titles = items.locator("h2 span");
    const count = Math.min(await titles.count(), limit);
    const samples: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await titles.nth(i).innerText()).trim();
      if (text) samples.push(text);
    }
    return samples;
  }

  async openFirstResultAndGetTitle(): Promise<string> {
    await this.waitForResults();
    const items = await this.getResultItems();
    const itemCount = await items.count();
    let link = items.first().locator("h2 a").first();
    let title = "";
    let href: string | null = null;

    for (let i = 0; i < itemCount; i++) {
      const item = items.nth(i);
      const h2 = item.locator("h2").first();
      const aria = (await h2.getAttribute("aria-label")) ?? "";
      const isSponsored = aria.toLowerCase().includes("sponsorlu");
      const candidate = item.locator("h2 a").first();
      const candidateHref = (await candidate.getAttribute("href")) ?? "";
      if (isSponsored) continue;
      if (!candidateHref.includes("/dp/") && !candidateHref.includes("/gp/") && !candidateHref.includes("/product/")) {
        continue;
      }
      link = candidate;
      href = candidateHref;
      title = (await candidate.locator("span").first().innerText()).trim();
      break;
    }

    if (!title) {
      await link.waitFor({ state: "visible", timeout: 15000 });
      title = (await link.locator("span").first().innerText()).trim();
      href = href ?? (await link.getAttribute("href"));
    }
    if (href) {
      const absolute = href.startsWith("http") ? href : new URL(href, this.page.url()).toString();
      await retry(
        () => this.page.goto(absolute, { waitUntil: "domcontentloaded", timeout: 20000 }),
        { label: "goto product", retries: 2, delayMs: 700 }
      );
      await this.page.waitForSelector("#productTitle", { timeout: 20000 });
    } else {
      await retry(
        async () => {
          await Promise.all([
            this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }),
            link.click({ timeout: 10000 })
          ]);
        },
        { label: "click product", retries: 2, delayMs: 700 }
      );
    }
    return title;
  }

  async openFirstResultWithTitleContaining(keyword: string): Promise<string> {
    await this.waitForResults();
    const h2 = this.page
      .locator(`div.s-main-slot h2[aria-label*="${keyword}"]`)
      .first();

    await h2.waitFor({ state: "visible", timeout: 15000 });
    const titleText = (await h2.locator("span").first().innerText()).trim();
    const link = h2.locator("xpath=ancestor::a[1]");
    const href = await link.getAttribute("href");
    if (href) {
      const absolute = href.startsWith("http") ? href : new URL(href, this.page.url()).toString();
      await retry(
        () => this.page.goto(absolute, { waitUntil: "domcontentloaded", timeout: 20000 }),
        { label: "goto product", retries: 2, delayMs: 700 }
      );
      await this.page.waitForSelector("#productTitle", { timeout: 20000 });
      return titleText;
    }

    await retry(
      async () => {
        await Promise.all([
          this.page.waitForURL(/\/dp\//, { timeout: 20000 }),
          link.click({ timeout: 10000 })
        ]);
      },
      { label: "click product", retries: 2, delayMs: 700 }
    );
    await this.page.waitForSelector("#productTitle", { timeout: 20000 });
    return titleText;
  }

  async openNthResultWithTitleContaining(keyword: string, index: number): Promise<string> {
    await this.waitForResults();
    if (index < 1) {
      throw new Error(`Index must be >= 1. Received: ${index}`);
    }
    const h2List = this.page.locator(`div.s-main-slot h2[aria-label*="${keyword}"]`);
    const count = await h2List.count();
    if (count < index) {
      throw new Error(`Only ${count} results matched "${keyword}", cannot select ${index}.`);
    }
    const h2 = h2List.nth(index - 1);
    await h2.waitFor({ state: "visible", timeout: 15000 });
    const titleText = (await h2.locator("span").first().innerText()).trim();
    const link = h2.locator("xpath=ancestor::a[1]");
    const href = await link.getAttribute("href");
    if (href) {
      const absolute = href.startsWith("http") ? href : new URL(href, this.page.url()).toString();
      await retry(
        () => this.page.goto(absolute, { waitUntil: "domcontentloaded", timeout: 20000 }),
        { label: "goto product", retries: 2, delayMs: 700 }
      );
      await this.page.waitForSelector("#productTitle", { timeout: 20000 });
      return titleText;
    }
    await retry(
      async () => {
        await Promise.all([
          this.page.waitForURL(/\/dp\//, { timeout: 20000 }),
          link.click({ timeout: 10000 })
        ]);
      },
      { label: "click product", retries: 2, delayMs: 700 }
    );
    await this.page.waitForSelector("#productTitle", { timeout: 20000 });
    return titleText;
  }

  async waitForReady() {
    await this.page.waitForSelector(this.resultsContainer, { timeout: 15000 });
    await this.page.waitForSelector(this.resultItems, { timeout: 15000 });
  }
}
