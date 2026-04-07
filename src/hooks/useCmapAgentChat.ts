import { useCallback, useState } from "react";
import { ApiError, getThreadMessages, getThreads, postChat, presignUpload, uploadFileToPresignedUrl } from "../api/cmapAgent";
import { CONFIG } from "../config";
import { loadThreads, saveThreads, type ThreadMeta } from "../storage";
import type { Artifact, ChatRequest } from "../api/types";
import type { ChatTurn } from "../uiTypes";
import { appendCmapFileHint, extractArtifactsFromCmapFileHints, sanitizeArtifactForHint } from "../utils/cmapFileHint";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildChatRequest(message: string, threadId: string | null): ChatRequest {
  return {
    user_id: 0,
    thread_id: threadId,
    message,
    llm: {
      provider: CONFIG.defaultProvider,
      model: CONFIG.defaultModel
    },
    options: {
      return_code: CONFIG.returnCode,
      max_tool_calls: CONFIG.maxToolCalls
    }
  };
}

function isoOrEmpty(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  try {
    return new Date(v).toISOString();
  } catch {
    return String(v);
  }
}

function formatErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return `HTTP ${e.status}: ${e.detail}`;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function isSupportedUploadFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".parquet");
}

function buildLocalAttachmentArtifact(file: File): Artifact {
  return {
    type: "file",
    filename: file.name,
    content_type: file.type || undefined,
    size_bytes: file.size
  };
}

function guessContentType(file: File): string {
  if (file.type && file.type.trim().length > 0) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".parquet")) return "application/octet-stream";
  return "application/octet-stream";
}

export function useCmapAgentChat(opts: {
  apiKey: string;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  const { apiKey, sidebarOpen } = opts;

  const [threads, setThreads] = useState<ThreadMeta[]>(loadThreads());
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadLoadingId, setThreadLoadingId] = useState<string | null>(null);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const refreshThreads = useCallback(async () => {
    if (!apiKey) return;

    setThreadsLoading(true);
    try {
      const resp = await getThreads(apiKey, 50, 0);
      const items: ThreadMeta[] = (resp.threads ?? []).map((t: any) => ({
        thread_id: String(t.thread_id),
        title: String(t.title ?? "New chat"),
        updated_at: isoOrEmpty(t.updated_at)
      }));

      items.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
      setThreads(items);
      saveThreads(items);
    } catch (e) {
      if (sidebarOpen) {
        setError(formatErrorMessage(e, "Failed to load threads"));
      }
    } finally {
      setThreadsLoading(false);
    }
  }, [apiKey, sidebarOpen]);

  const onNewChat = useCallback(() => {
    setThreadId(null);
    setTurns([]);
    setDraft("");
    setError(null);
    setAttachedFile(null);
  }, []);

  const attachFile = useCallback((file: File) => {
    if (!isSupportedUploadFile(file)) {
      setError("Only .csv and .parquet files are supported for source-file colocalization.");
      return false;
    }
    setError(null);
    setAttachedFile(file);
    return true;
  }, []);

  const removeAttachedFile = useCallback(() => {
    setAttachedFile(null);
    setError(null);
  }, []);

  const onSelectThread = useCallback(
    async (t: ThreadMeta) => {
      if (!apiKey) return;

      setError(null);
      setDraft("");
      setSending(false);
      setAttachedFile(null);
      setThreadLoadingId(t.thread_id);

      try {
        const resp = await getThreadMessages(t.thread_id, apiKey, 200, 0);

        const msgs = [...(resp.messages ?? [])].sort((a: any, b: any) => {
          const at = String(a.created_at ?? "");
          const bt = String(b.created_at ?? "");

          if (at && bt && at !== bt) return at.localeCompare(bt);

          const aid = Number(a.message_id ?? 0);
          const bid = Number(b.message_id ?? 0);
          return aid - bid;
        });

        const loadedTurns: ChatTurn[] = msgs.map((m: any) => ({
          id: String(m.message_id ?? uid()),
          role: String(m.role ?? "").toLowerCase() === "user" ? "user" : "assistant",
          content: String(m.content ?? ""),
          attachments:
            String(m.role ?? "").toLowerCase() === "user"
              ? extractArtifactsFromCmapFileHints(String(m.content ?? ""))
              : []
        }));

        setThreadId(String((resp as any).thread_id ?? t.thread_id));
        setTurns(loadedTurns);
      } catch (e: any) {
        setError(formatErrorMessage(e, "Failed to load thread"));
      } finally {
        setThreadLoadingId(null);
      }
    },
    [apiKey]
  );

  const onSend = useCallback(async () => {
    const msg = draft.trim();
    if (!msg) return;

    const fileToUpload = attachedFile;
    const uploadThreadId = threadId ?? null;
    const chatThreadId = threadId ?? null;
    const optimisticAttachment = fileToUpload ? [buildLocalAttachmentArtifact(fileToUpload)] : [];

    setError(null);
    setDraft("");

    const userTurn: ChatTurn = { id: uid(), role: "user", content: msg, attachments: optimisticAttachment };
    setTurns((prev: ChatTurn[]) => [...prev, userTurn]);

    setSending(true);
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

    try {
      let wireMsg = msg;

      if (fileToUpload) {
        const presignResp = await presignUpload(
          {
            user_id: 0,
            filename: fileToUpload.name,
            size_bytes: fileToUpload.size,
            content_type: guessContentType(fileToUpload),
            thread_id: uploadThreadId
          },
          apiKey
        );

        await uploadFileToPresignedUrl(fileToUpload, presignResp.upload);

        const uploadedArtifact = sanitizeArtifactForHint({
          ...presignResp.artifact,
          size_bytes: presignResp.artifact.size_bytes ?? fileToUpload.size,
          content_type: presignResp.artifact.content_type ?? guessContentType(fileToUpload),
          filename: presignResp.artifact.filename ?? fileToUpload.name,
          type: presignResp.artifact.type ?? "file"
        });

        wireMsg = appendCmapFileHint(msg, {
          source_artifact: uploadedArtifact,
          instructions:
            "If the user requests colocalization, use this exact source_artifact object with cmap.colocalize. Do not convert it to a string path. If the user explicitly says to use an existing CMAP table as the source dataset instead, follow the user's instruction."
        });

        setTurns((prev: ChatTurn[]) =>
          prev.map((turn: ChatTurn) =>
            turn.id === userTurn.id
              ? {
                  ...turn,
                  attachments: [uploadedArtifact]
                }
              : turn
          )
        );
      }

      const req = buildChatRequest(wireMsg, chatThreadId);
      const resp = await postChat(req, apiKey);
      const finishedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
      setThreadId(resp.thread_id);
      setAttachedFile(null);

      const assistantTurn: ChatTurn = {
        id: uid(),
        role: "assistant",
        content: resp.assistant_message,
        artifacts: resp.artifacts ?? [],
        code: resp.code ?? null,
        toolTrace: resp.tool_trace ?? [],
        elapsedMs: Math.max(0, Math.round(finishedAt - startedAt))
      };
      setTurns((prev: ChatTurn[]) => [...prev, assistantTurn]);

      await refreshThreads();
    } catch (e: any) {
      const message = formatErrorMessage(e, "Request failed");
      setError(message);

      const assistantTurn: ChatTurn = {
        id: uid(),
        role: "assistant",
        content:
          "Sorry—your request failed. " +
          (message.includes("401") || message.toLowerCase().includes("api key")
            ? "Make sure we set a valid API key in the header."
            : message.toLowerCase().includes("cors") || message.toLowerCase().includes("presigned upload")
              ? "The attached file could not be uploaded from the browser. This usually means the artifact bucket still needs a CORS rule for this frontend origin."
              : "Please try again."),
        artifacts: [],
        code: null,
        elapsedMs: null,
        toolTrace: []
      };
      setTurns((prev: ChatTurn[]) => [...prev, assistantTurn]);
    } finally {
      setSending(false);
    }
  }, [apiKey, attachedFile, draft, refreshThreads, threadId]);

  const clearThreads = useCallback(() => {
    setThreads([]);
    saveThreads([]);
    setThreadId(null);
    setTurns([]);
    setDraft("");
    setError(null);
    setAttachedFile(null);
  }, []);

  return {
    threads,
    setThreads,
    threadsLoading,
    threadLoadingId,
    refreshThreads,

    threadId,
    turns,
    draft,
    setDraft,
    sending,
    error,
    attachedFile,

    onNewChat,
    onSelectThread,
    onSend,
    attachFile,
    removeAttachedFile,
    clearThreads
  };
}
