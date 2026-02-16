import { BasePage } from "./BasePage";
import { config } from "../config/env";
import { homeSelectors } from "../selectors/home";

export class HomePage extends BasePage {
  private searchInput = homeSelectors.searchInput;
  private searchButton = homeSelectors.searchButton;

  async visit() {
    if (!this.page.url().startsWith(config.baseUrl)) {
      await this.page.goto("/");
    }
    await this.acceptCookiesIfPresent();
    await this.waitForReady();
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
    const acceptSelectors = homeSelectors.cookieAccept;
    const rejectSelectors = homeSelectors.cookieReject;

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
          console.log(`[COOKIE] Accepted via ${selector}`);
          return;
        }
      }

      for (const selector of rejectSelectors) {
        const button = this.page.locator(selector).first();
        if (await tryClick(button)) {
          console.log(`[COOKIE] Rejected via ${selector}`);
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
            console.log(`[COOKIE] Accepted via frame ${selector}`);
            return;
          }
        }
        for (const selector of rejectSelectors) {
          const button = frame.locator(selector).first();
          if (await tryClick(button)) {
            console.log(`[COOKIE] Rejected via frame ${selector}`);
            return;
          }
        }
      }

      await this.page.waitForTimeout(250);
    }
  }

  async waitForReady() {
    await this.page.waitForSelector(this.searchInput, { timeout: 15000 });
  }
}
