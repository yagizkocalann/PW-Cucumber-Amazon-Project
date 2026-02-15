import { BasePage } from "./BasePage";

export class ProductPage extends BasePage {
  private addToCartButton = "#add-to-cart-button, input#add-to-cart-button";
  private productTitle = "#productTitle";
  private optionSelects =
    "select[name*='dropdown_selected'], select[name*='dropdown'], select#native_dropdown_selected_size_name, select#native_dropdown_selected_color_name";
  private optionButtons =
    "ul li[role='listitem'] input[type='submit'], ul li[role='listitem'] button";

  async getTitle(): Promise<string> {
    await this.page.waitForSelector(this.productTitle, { timeout: 15000 });
    const text = await this.page.locator(this.productTitle).first().innerText();
    return text.trim();
  }

  async selectFirstAvailableOptionIfNeeded() {
    const selects = this.page.locator(this.optionSelects);
    const selectCount = await selects.count();
    if (selectCount > 0) {
      for (let i = 0; i < selectCount; i++) {
        const select = selects.nth(i);
        try {
          const options = await select.locator("option").all();
          if (options.length > 1) {
            await select.selectOption({ index: 1 });
          }
        } catch {
          // Some selects are not interactable; skip.
        }
      }
    }

    const buttons = this.page.locator(this.optionButtons);
    const buttonCount = await buttons.count();
    if (buttonCount > 0) {
      for (let i = 0; i < buttonCount; i++) {
        const btn = buttons.nth(i);
        try {
          if (await btn.isVisible({ timeout: 500 })) {
            await btn.click();
            return;
          }
        } catch {
          // Ignore and continue.
        }
      }
    }
  }

  async addToCart() {
    await this.selectFirstAvailableOptionIfNeeded();
    await this.page.waitForSelector(this.addToCartButton, { timeout: 15000 });
    await this.page.click(this.addToCartButton);
  }
}
