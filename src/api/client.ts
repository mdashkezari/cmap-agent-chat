import { CONFIG } from "../config";

export class ApiError extends Error {
  status: number;
  detail: string;
  payload: unknown;

  constructor(status: number, detail: string, payload: unknown) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.payload = payload;
  }
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

async function parsePayload(resp: Response): Promise<Json | null> {
  const text = await resp.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildHeaders(apiKey?: string, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    ...(extra ?? {})
  };
  if (apiKey && apiKey.length > 0) headers["X-API-Key"] = apiKey;
  return headers;
}

export function resolveUrl(path: string): string {
  const base = CONFIG.apiBaseUrl.replace(/\/$/, "");
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

export async function fetchJson<T>(
  path: string,
  init: RequestInit,
  opts?: {
    apiKey?: string;
    timeoutMs?: number;
  }
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs ?? 600_000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const resp = await fetch(resolveUrl(path), {
    ...init,
    headers: buildHeaders(opts?.apiKey, init.headers as Record<string, string> | undefined),
    signal: controller.signal
  }).finally(() => {
    window.clearTimeout(timeoutId);
  });

  const payload = await parsePayload(resp);

  if (!resp.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in (payload as any)
        ? String((payload as any).detail)
        : `HTTP ${resp.status}`;
    throw new ApiError(resp.status, detail, payload);
  }

  return payload as T;
}

export async function putBinary(
  url: string,
  body: Blob,
  opts?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
  }
): Promise<void> {
  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs ?? 600_000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "PUT",
      headers: opts?.headers,
      body,
      signal: controller.signal
    });
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (error instanceof TypeError) {
      throw new Error(
        "Failed to upload the attached file. The browser could not complete the presigned upload request. If the API returned an S3 upload URL, the bucket likely needs a CORS rule for this frontend origin."
      );
    }
    throw error;
  }

  window.clearTimeout(timeoutId);

  if (!resp.ok) {
    const payload = await parsePayload(resp);
    const detail = typeof payload === "string" && payload ? payload : `HTTP ${resp.status}`;
    throw new ApiError(resp.status, detail, payload);
  }
}
