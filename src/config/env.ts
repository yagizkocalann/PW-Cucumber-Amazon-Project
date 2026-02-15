import dotenv from "dotenv";

dotenv.config();

const baseUrl = process.env.BASE_URL ?? "https://www.amazon.com.tr";
const headless = (process.env.HEADLESS ?? "false").toLowerCase() !== "false";
const browserName = (process.env.BROWSER ?? "chromium").toLowerCase();
const defaultTimeout = Number(process.env.DEFAULT_TIMEOUT ?? 30000);

export const config = {
  baseUrl,
  headless,
  browserName,
  defaultTimeout
};
