type RetryOptions = {
  retries?: number;
  delayMs?: number;
  label?: string;
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 2;
  const delayMs = options.delayMs ?? 500;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(delayMs);
      }
    }
  }
  const label = options.label ? ` (${options.label})` : "";
  throw new Error(`Retry failed${label}: ${String(lastError)}`);
}
