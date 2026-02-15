import { After, AfterAll, AfterStep, Before, BeforeAll, setDefaultTimeout, Status } from "@cucumber/cucumber";
import { chromium, firefox, webkit, Browser } from "playwright";
import fs from "fs";
import path from "path";
import { config } from "../config/env";
import { CustomWorld } from "./world";
import { HomePage } from "../pages/HomePage";
import {
  assertBasicPageState,
  assertMainContentVisible,
  assertNoErrorSentinels,
  assertSearchResultsNotEmpty
} from "./assertions";

setDefaultTimeout(config.defaultTimeout);

let browser: Browser;

function getBrowser() {
  switch (config.browserName) {
    case "firefox":
      return firefox;
    case "webkit":
      return webkit;
    case "chromium":
    default:
      return chromium;
  }
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 120);
}

BeforeAll(async () => {
  const browserType = getBrowser();
  browser = await browserType.launch({ headless: config.headless });
});

AfterAll(async () => {
  await browser?.close();
});

Before(async function (this: CustomWorld) {
  this.context = await browser.newContext({
    baseURL: config.baseUrl,
    viewport: { width: 2560, height: 1440 },
    screen: { width: 2560, height: 1440 }
  });
  this.page = await this.context.newPage();
  this.consoleErrors = [];
  this.httpErrors = [];
  this.page.on("console", msg => {
    if (msg.type() === "error") {
      this.consoleErrors.push(msg.text());
    }
  });
  this.page.on("response", response => {
    if (response.status() >= 400) {
      this.httpErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  const home = new HomePage(this.page);
  await home.visit();
});

AfterStep(async function (this: CustomWorld, scenario) {
  const stepSanityEnabled = (process.env.SANITY_STEP_CONTENT ?? "true").toLowerCase() !== "false";
  if (!stepSanityEnabled) return;
  if (scenario.result?.status === Status.FAILED) return;
  if (!this.page) return;
  await assertMainContentVisible(this.page);
});

After(async function (this: CustomWorld, scenario) {
  const sanityEnabled = (process.env.SANITY_CHECKS ?? "true").toLowerCase() !== "false";
  const searchSanityEnabled = (process.env.SANITY_SEARCH_RESULTS ?? "true").toLowerCase() !== "false";
  const sentinelSanityEnabled = (process.env.SANITY_SENTINELS ?? "false").toLowerCase() === "true";
  const failOnConsole = (process.env.FAIL_ON_CONSOLE_ERROR ?? "false").toLowerCase() === "true";
  const failOnHttp = (process.env.FAIL_ON_HTTP_ERROR ?? "false").toLowerCase() === "true";

  if (scenario.result?.status === Status.FAILED && this.page) {
    console.log(`[FAIL] Scenario: ${scenario.pickle.name}`);
    console.log(`[FAIL] URL: ${this.page.url()}`);
  }

  if (sanityEnabled && scenario.result?.status !== Status.FAILED && this.page) {
    await assertBasicPageState(this.page);
    if (searchSanityEnabled) {
      await assertSearchResultsNotEmpty(this.page);
    }
    if (sentinelSanityEnabled) {
      await assertNoErrorSentinels(this.page);
    }
  }

  if (scenario.result?.status !== Status.FAILED) {
    if (failOnConsole && this.consoleErrors.length) {
      throw new Error(`Console errors:\n${this.consoleErrors.join("\n")}`);
    }
    if (failOnHttp && this.httpErrors.length) {
      throw new Error(`HTTP errors:\n${this.httpErrors.join("\n")}`);
    }
  }

  if (scenario.result?.status === Status.FAILED && this.page) {
    const dir = path.join("artifacts", "screenshots");
    fs.mkdirSync(dir, { recursive: true });
    const name = safeFileName(scenario.pickle.name);
    const filePath = path.join(dir, `${Date.now()}-${name}.png`);
    await this.page.screenshot({ path: filePath, fullPage: true });
    console.log(`[FAIL] Screenshot: ${filePath}`);
    if (this.consoleErrors.length) {
      console.log(`Console errors:\n${this.consoleErrors.join("\n")}`);
    }
    if (this.httpErrors.length) {
      console.log(`HTTP errors:\n${this.httpErrors.join("\n")}`);
    }
  }

  await this.page?.close();
  await this.context?.close();
});
