const pendingRequests = new Map<string, Promise<unknown>>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRequestKey(url: string, options: RequestInit | undefined): string {
  const method = (options?.method ?? "GET").toUpperCase();
  const body = options?.body ? String(options.body) : "";
  return `${method}:${url}:${body}`;
}

export async function fetchJson<T>(url: string, options: RequestInit & { timeoutMs?: number; retryCount?: number; retryDelayMs?: number; dedupeKey?: string } = {}): Promise<T> {
  const {
    timeoutMs = 6000,
    retryCount = 1,
    retryDelayMs = 400,
    dedupeKey,
    ...requestInit
  } = options;

  const key = dedupeKey ?? getRequestKey(url, requestInit);
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const requestPromise = (async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...requestInit,
          signal: controller.signal,
        });

        if (!response.ok) {
          const status = response.status;
          if (status >= 500 && attempt < retryCount) {
            lastError = new Error(`Upstream error ${status}`);
            await delay(retryDelayMs * (attempt + 1));
            continue;
          }

          throw Object.assign(new Error(`Upstream request failed with ${status}`), { status });
        }

        return (await response.json()) as T;
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        const status = typeof err === "object" && err !== null && "status" in err ? Number((err as { status?: number }).status) : undefined;
        if ((isAbort || (status !== undefined && status >= 500)) && attempt < retryCount) {
          lastError = err;
          await delay(retryDelayMs * (attempt + 1));
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError ?? new Error("Upstream request failed");
  })();

  pendingRequests.set(key, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(key);
  }
}
