import { BasePage } from "./BasePage";
import { normalizeTr } from "../support/assertions";
import { cartSelectors } from "../selectors/cart";

export class CartPage extends BasePage {
  private cartItemTitles = cartSelectors.cartItemTitles;
  private cartItems = cartSelectors.cartItems;

  async gotoCart() {
    await this.page.goto("/gp/cart/view.html");
    await this.waitForReady();
  }

  async hasProductTitle(title: string): Promise<boolean> {
    await this.waitForReady();
    const normalizedExpected = normalizeTr(title);
    const titles = this.page.locator(this.cartItemTitles);
    const count = await titles.count();
    for (let i = 0; i < count; i++) {
      const text = (await titles.nth(i).innerText()).trim();
      if (!text) continue;
      if (normalizeTr(text).includes(normalizedExpected)) {
        return true;
      }
    }
    return false;
  }

  async waitForReady() {
    await this.page.waitForSelector(this.cartItems, { timeout: 15000 });
  }
}
