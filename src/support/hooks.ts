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
  assertSearchResultsNotEmpty,
  assertCartHasItems,
  assertSearchResultHasPrice,
  assertPageLoadWithin
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

function timestamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
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
  this.lastFailureCaptured = false;
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

AfterStep(async function (this: CustomWorld, step) {
  const stepSanityEnabled = (process.env.SANITY_STEP_CONTENT ?? "true").toLowerCase() !== "false";
  if (!stepSanityEnabled) return;
  if (step.result?.status === Status.FAILED) {
    if (!this.page || this.lastFailureCaptured) return;
    const scenarioName = step.pickle?.name ?? "unknown-scenario";
    const stepName = step.pickleStep?.text ?? "unknown-step";
    const dir = path.join("artifacts", "screenshots");
    fs.mkdirSync(dir, { recursive: true });
    const logDir = path.join("artifacts", "logs");
    fs.mkdirSync(logDir, { recursive: true });
    const stamp = timestamp();
    const fileBase = `${stamp}-${safeFileName(scenarioName)}-${safeFileName(stepName)}`;
    const filePath = path.join(dir, `${fileBase}.png`);
    await this.page.screenshot({ path: filePath, fullPage: true });
    console.log(`[FAIL] Screenshot: ${filePath}`);
    if (this.consoleErrors.length) {
      const consolePath = path.join(logDir, `${fileBase}-console.log`);
      fs.writeFileSync(consolePath, this.consoleErrors.join("\n"), "utf-8");
      console.log(`[FAIL] Console log: ${consolePath}`);
    }
    if (this.httpErrors.length) {
      const httpPath = path.join(logDir, `${fileBase}-http.log`);
      fs.writeFileSync(httpPath, this.httpErrors.join("\n"), "utf-8");
      console.log(`[FAIL] HTTP log: ${httpPath}`);
    }
    this.lastFailureCaptured = true;
    return;
  }
  if (!this.page) return;
  await assertMainContentVisible(this.page);
});

After(async function (this: CustomWorld, scenario) {
  const sanityEnabled = (process.env.SANITY_CHECKS ?? "true").toLowerCase() !== "false";
  const searchSanityEnabled = (process.env.SANITY_SEARCH_RESULTS ?? "true").toLowerCase() !== "false";
  const sentinelSanityEnabled = (process.env.SANITY_SENTINELS ?? "false").toLowerCase() === "true";
  const failOnConsole = (process.env.FAIL_ON_CONSOLE_ERROR ?? "false").toLowerCase() === "true";
  const failOnHttp = (process.env.FAIL_ON_HTTP_ERROR ?? "false").toLowerCase() === "true";
  const perfEnabled = (process.env.SANITY_PERF ?? "true").toLowerCase() !== "false";
  const perfBudgetMs = Number(process.env.PERF_BUDGET_MS ?? 8000);

  if (scenario.result?.status === Status.FAILED && this.page) {
    console.log(`[FAIL] Scenario: ${scenario.pickle.name}`);
    console.log(`[FAIL] URL: ${this.page.url()}`);
  }

  if (sanityEnabled && scenario.result?.status !== Status.FAILED && this.page) {
    await assertBasicPageState(this.page);
    if (searchSanityEnabled) {
      await assertSearchResultsNotEmpty(this.page);
      await assertSearchResultHasPrice(this.page);
      await assertCartHasItems(this.page);
    }
    if (sentinelSanityEnabled) {
      await assertNoErrorSentinels(this.page);
    }
    if (perfEnabled && !Number.isNaN(perfBudgetMs)) {
      await assertPageLoadWithin(this.page, perfBudgetMs);
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

  if (scenario.result?.status === Status.FAILED && this.page && !this.lastFailureCaptured) {
    const dir = path.join("artifacts", "screenshots");
    fs.mkdirSync(dir, { recursive: true });
    const name = safeFileName(scenario.pickle.name);
    const filePath = path.join(dir, `${timestamp()}-${name}-unknown-step.png`);
    await this.page.screenshot({ path: filePath, fullPage: true });
    console.log(`[FAIL] Screenshot: ${filePath}`);
  }

  await this.page?.close();
  await this.context?.close();
});
