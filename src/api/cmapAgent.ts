import { ApiError, fetchJson, putBinary } from "./client";
import type {
  ChatRequest,
  ChatResponse,
  PresignUploadRequest,
  ThreadListResponse,
  ThreadMessagesResponse,
  UploadResponse
} from "./types";

export { ApiError };

export async function postChat(req: ChatRequest, apiKey?: string): Promise<ChatResponse> {
  return fetchJson<ChatResponse>(
    "/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req)
    },
    { apiKey }
  );
}

export async function getThreads(apiKey?: string, limit: number = 50, offset: number = 0): Promise<ThreadListResponse> {
  const qs = `?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`;
  return fetchJson<ThreadListResponse>(
    `/threads${qs}`,
    {
      method: "GET"
    },
    { apiKey }
  );
}

export async function getThreadMessages(
  threadId: string,
  apiKey?: string,
  limit: number = 200,
  offset: number = 0
): Promise<ThreadMessagesResponse> {
  const qs = `?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`;
  return fetchJson<ThreadMessagesResponse>(
    `/threads/${encodeURIComponent(threadId)}/messages${qs}`,
    {
      method: "GET"
    },
    { apiKey }
  );
}

export async function presignUpload(req: PresignUploadRequest, apiKey?: string): Promise<UploadResponse> {
  return fetchJson<UploadResponse>(
    "/files/presign_upload",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req)
    },
    { apiKey, timeoutMs: 60_000 }
  );
}

export async function uploadFileToPresignedUrl(file: File, upload: UploadResponse["upload"]): Promise<void> {
  await putBinary(upload.url, file, {
    headers: upload.headers ?? {},
    timeoutMs: 600_000
  });
}
