const path = require("path");
const fs = require("fs");
const reporter = require("cucumber-html-reporter");

const reportsDir = path.join(process.cwd(), "reports");
const jsonFile = path.join(reportsDir, "cucumber-report.json");
const htmlFile = path.join(reportsDir, "cucumber-report.html");

if (!fs.existsSync(jsonFile)) {
  console.error(`Report JSON not found: ${jsonFile}`);
  process.exit(1);
}

const options = {
  theme: "bootstrap",
  jsonFile,
  output: htmlFile,
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: false,
  metadata: {
    "App": "amazon.com.tr",
    "Test Type": "E2E",
    "Framework": "Cucumber + Playwright"
  }
};

reporter.generate(options);
console.log(`HTML report generated: ${htmlFile}`);
if ((process.env.OPEN_REPORT ?? "false").toLowerCase() === "true") {
  const { execSync } = require("child_process");
  try {
    execSync(`open "${htmlFile}"`, { stdio: "ignore" });
  } catch {
    console.warn("Failed to open report automatically.");
  }
}
