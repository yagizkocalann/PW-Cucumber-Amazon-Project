import { BasePage } from "./BasePage";
import { normalizeTr } from "../support/assertions";

export class CartPage extends BasePage {
  private cartItemTitles =
    "span.sc-product-title, span.a-truncate-cut, span.a-truncate-full, div.sc-list-item-content span.a-truncate-cut";

  async gotoCart() {
    await this.page.goto("/gp/cart/view.html");
  }

  async hasProductTitle(title: string): Promise<boolean> {
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
}
