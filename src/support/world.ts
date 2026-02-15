import { World, IWorldOptions } from "@cucumber/cucumber";
import type { BrowserContext, Page } from "playwright";

export class CustomWorld extends World {
  context?: BrowserContext;
  page?: Page;
  consoleErrors: string[] = [];
  httpErrors: string[] = [];
  lastProductTitle?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }
}
