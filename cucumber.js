module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    require: ["src/steps/**/*.ts", "src/support/**/*.ts"],
    requireModule: ["ts-node/register"],
    format: ["progress-bar", "json:reports/cucumber-report.json"],
    formatOptions: {
      snippetInterface: "async-await"
    }
  }
};
