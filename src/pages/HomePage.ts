import { BasePage } from "./BasePage";
import { config } from "../config/env";

export class HomePage extends BasePage {
  private searchInput = "#twotabsearchtextbox";
  private searchButton = "#nav-search-submit-button";
  private cookieActionSelectors = [
    "#sp-cc-rejectall-link",
    "input[name='reject']",
    "button:has-text(\"Reddet\")",
    "a:has-text(\"Reddet\")",
    "#sp-cc-accept",
    "input#sp-cc-accept",
    "input[name='accept']",
    "button[name='accept']",
    "button:has-text(\"Kabul et\")",
    "a:has-text(\"Kabul et\")",
    "button:has-text(\"Kişiselleştir\")",
    "a:has-text(\"Kişiselleştir\")"
  ];

  async visit() {
    if (!this.page.url().startsWith(config.baseUrl)) {
      await this.page.goto("/");
    }
    await this.acceptCookiesIfPresent();
  }

  async searchFor(term: string) {
    await this.page.fill(this.searchInput, term);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.click(this.searchButton)
    ]);
    await this.page.waitForSelector("div.s-main-slot", { timeout: 3000 });
  }

  async acceptCookiesIfPresent(timeoutMs = 3000) {
    const deadline = Date.now() + timeoutMs;
    const acceptSelectors = [
      "#sp-cc-accept",
      "input#sp-cc-accept",
      "input[name='accept']",
      "button[name='accept']",
      "button:has-text(\"Kabul et\")",
      "a:has-text(\"Kabul et\")"
    ];

    const tryClick = async (locator: ReturnType<typeof this.page.locator>) => {
      try {
        if (await locator.isVisible({ timeout: 500 })) {
          await locator.click();
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    while (Date.now() < deadline) {
      for (const selector of acceptSelectors) {
        const button = this.page.locator(selector).first();
        if (await tryClick(button)) {
          return;
        }
      }

      for (const frame of this.page.frames()) {
        if (frame === this.page.mainFrame()) {
          continue;
        }
        for (const selector of acceptSelectors) {
          const button = frame.locator(selector).first();
          if (await tryClick(button)) {
            return;
          }
        }
      }

      await this.page.waitForTimeout(250);
    }
  }
}
