import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { SearchResultsPage } from "../pages/SearchResultsPage";
import { ProductPage } from "../pages/ProductPage";
import { CartPage } from "../pages/CartPage";
import { CustomWorld } from "../support/world";
import { normalizeTr } from "../support/assertions";

function getPage(world: CustomWorld) {
  if (!world.page) {
    throw new Error("Page is not initialized. Did the Before hook run?");
  }
  return world.page;
}

Given("Amazon ana sayfasindayim", async function (this: CustomWorld) {
  const page = getPage(this);
  const home = new HomePage(page);
  await home.visit();
});

When("{string} icin arama yaparim", async function (this: CustomWorld, term: string) {
  const page = getPage(this);
  const home = new HomePage(page);
  await home.searchFor(term);
});

Then("arama sonuclarinda ilk urun basligi {string} veya {string} kelimesini icermelidir", async function (this: CustomWorld, expectedA: string, expectedB: string) {
  const page = getPage(this);
  const results = new SearchResultsPage(page);
  const matched = await results.findAnyMatchingTitle(expectedA, expectedB);
  if (!matched) {
    const samples = await results.getSampleTitles(5);
    throw new Error(
      `No result title contained "${expectedA}" or "${expectedB}". Sample titles: ${samples.join(" | ")}`
    );
  }
  const normalized = normalizeTr(matched);
  const a = normalizeTr(expectedA);
  const b = normalizeTr(expectedB);
  await expect(normalized.includes(a) || normalized.includes(b)).toBeTruthy();
});

When("arama sonucundaki ilk urune tiklarim", async function (this: CustomWorld) {
  const page = getPage(this);
  const results = new SearchResultsPage(page);
  this.lastProductTitle = await results.openFirstResultAndGetTitle();
});

When("arama sonucunda {string} iceren ilk urune tiklarim", async function (this: CustomWorld, keyword: string) {
  const page = getPage(this);
  const results = new SearchResultsPage(page);
  this.lastProductTitle = await results.openFirstResultWithTitleContaining(keyword);
});

When(
  "arama sonucunda {string} iceren {int}. urune tiklarim",
  async function (this: CustomWorld, keyword: string, index: number) {
    const page = getPage(this);
    const results = new SearchResultsPage(page);
    this.lastProductTitle = await results.openNthResultWithTitleContaining(keyword, index);
  }
);

When("urunu sepete eklerim", async function (this: CustomWorld) {
  const page = getPage(this);
  const product = new ProductPage(page);
  const title = await product.getTitle();
  if (!this.lastProductTitle) {
    this.lastProductTitle = title;
  }
  await product.addToCart();
});

Then("sepetime gidip ayni urunun eklendigini gorurum", async function (this: CustomWorld) {
  const page = getPage(this);
  const cart = new CartPage(page);
  await cart.gotoCart();
  if (!this.lastProductTitle) {
    throw new Error("No product title captured before checking cart.");
  }
  const found = await cart.hasProductTitle(this.lastProductTitle);
  await expect(found).toBeTruthy();
});
