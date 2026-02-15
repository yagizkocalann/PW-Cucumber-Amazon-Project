import { BasePage } from "./BasePage";

export class SearchResultsPage extends BasePage {
  private resultsContainer = "div.s-main-slot";
  private resultItems =
    "div.s-main-slot div[data-component-type='s-search-result'][data-asin]:not([data-asin=''])";
  private resultTitles =
    "div.s-main-slot div[data-component-type='s-search-result'][data-asin]:not([data-asin='']) h2 span";

  async waitForResults() {
    await this.page.waitForSelector(this.resultsContainer, { timeout: 15000 });
    await this.page.waitForSelector(this.resultItems, { timeout: 15000 });
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
}
