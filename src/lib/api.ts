const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set (check .env)');
}

export class ApiError extends Error {
  status: number;
  /** The raw JSON error body, when the server sent one — lets callers read
   * extra fields (e.g. `mayNeedPasswordSetup`) beyond the message. */
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** www.printlaserstitch.com currently resolves to two Vercel edge IPs, and
 * one of them is intermittently unreachable from some networks — the
 * connection just hangs at the TCP level. A JS-level AbortController doesn't
 * reliably cut that short (the hang happens below fetch's own abort
 * plumbing), so race the fetch against a plain timer instead: whichever
 * settles first wins, regardless of what the underlying connection is doing. */
const REQUEST_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ApiError('This is taking too long — please check your connection and try again.', 0));
    }, REQUEST_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err instanceof Error ? new ApiError(err.message, 0) : err);
      },
    );
  });
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await withTimeout(
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    }),
    `${options.method ?? 'GET'} ${path}`,
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data && typeof data === 'object' && 'error' in data
      ? String((data as { error?: unknown }).error)
      : undefined) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export const api = {
  // GETs are safe to retry — one extra attempt on a network-level failure
  // (status 0: timeout or connection error) gives the flaky-IP case above a
  // real chance to land on the working address instead.
  get: async <T>(path: string, headers?: HeadersInit): Promise<T> => {
    try {
      return await request<T>(path, { headers });
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        return request<T>(path, { headers });
      }
      throw err;
    }
  },
  post: <T>(path: string, body?: unknown, headers?: HeadersInit) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),
};
