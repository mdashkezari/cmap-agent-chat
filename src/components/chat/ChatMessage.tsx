import { useMemo, useState } from "react";
import type { ToolTraceItem, Artifact } from "../../api/types";
import type { ChatTurn } from "../../uiTypes";
import { stripCmapFileHints } from "../../utils/cmapFileHint";
import { renderContentWithLinks } from "../common/LinkifiedText";
import { MarkdownContent } from "../common/MarkdownContent";
import { ArtifactsView } from "./ArtifactsView";
import { CodeBlock } from "./CodeBlock";

function formatBytes(size?: number): string | null {
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function attachmentLabel(a: Artifact): string {
  return a.filename ?? a.s3_key?.split("/").pop() ?? "Attached file";
}

function formatDuration(ms?: number | null): string | null {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return null;
  if (ms < 1000) return `${ms}ms`;

  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(totalSeconds >= 10 ? 0 : 1)}s`;
  }

  const totalWholeSeconds = Math.round(totalSeconds);
  const minutes = Math.floor(totalWholeSeconds / 60);
  const seconds = totalWholeSeconds % 60;
  return `${minutes} min ${seconds} sec`;
}

function summarizeTrace(trace: ToolTraceItem[]) {
  const count = trace.length;
  const errors = trace.filter((item) => String(item.status ?? "").toLowerCase() === "error").length;
  return { count, errors };
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

function shortPreview(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    const text = JSON.stringify(value);
    return text.length > 240 ? `${text.slice(0, 237)}...` : text;
  } catch {
    return String(value);
  }
}

function ToolTracePanel({ trace }: { trace: ToolTraceItem[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (trace.length === 0) return null;

  const copyAll = async () => {
    try {
      const text = prettyJson(trace);
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "true");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 10,
        borderTop: "1px solid #eef2f7",
        paddingTop: 10,
        display: "grid",
        gap: 8
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => {
            void copyAll();
          }}
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 9999,
            padding: "4px 9px",
            fontSize: 12,
            opacity: 0.8
          }}
          aria-label="Copy full tool trace"
          title="Copy full tool trace"
        >
          {copied ? "Copied" : "Copy trace"}
        </button>
      </div>
      {trace.map((item, idx) => {
        const status = String(item.status ?? "ok").toLowerCase();
        const isError = status === "error";
        const preview = shortPreview(item.result_preview ?? item.error);
        const isExpanded = expandedIndex === idx;

        return (
          <div
            key={`${item.tool ?? "tool"}-${idx}`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "#f8fafc",
              overflow: "hidden"
            }}
          >
            <button
              type="button"
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 0,
                background: "transparent",
                textAlign: "left",
                padding: "10px 12px",
                display: "grid",
                gap: 4,
                fontWeight: 500
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>{isError ? "⚠" : "✓"}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.tool ?? "Tool"}</span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    textTransform: "capitalize"
                  }}
                >
                  {status}
                </span>
              </div>
              {preview ? (
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    opacity: 0.68,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word"
                  }}
                >
                  {preview}
                </div>
              ) : null}
            </button>

            {isExpanded ? (
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  padding: 12,
                  display: "grid",
                  gap: 10,
                  background: "#fff"
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.8 }}>Arguments</div>
                  <pre
                    style={{
                      margin: 0,
                      padding: 10,
                      fontSize: 12,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      background: "#f8fafc",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    {prettyJson(item.arguments ?? {})}
                  </pre>
                </div>

                {item.error ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.8 }}>Error</div>
                    <pre
                      style={{
                        margin: 0,
                        padding: 10,
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        background: "#fff7ed",
                        borderRadius: 10,
                        border: "1px solid #fed7aa"
                      }}
                    >
                      {prettyJson(item.error)}
                    </pre>
                  </div>
                ) : null}

                {item.result_preview !== undefined ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.8 }}>Result preview</div>
                    <pre
                      style={{
                        margin: 0,
                        padding: 10,
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        background: "#f8fafc",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb"
                      }}
                    >
                      {prettyJson(item.result_preview)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AttachmentChips({ attachments }: { attachments?: Artifact[] }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {attachments.map((attachment, idx) => (
        <div
          key={`${attachment.filename ?? attachment.s3_key ?? attachment.url ?? idx}-${idx}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
            borderRadius: 9999,
            padding: "6px 10px",
            fontSize: 12,
            maxWidth: "100%"
          }}
          title={attachmentLabel(attachment)}
        >
          <span aria-hidden="true">📎</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 260
            }}
          >
            {attachmentLabel(attachment)}
          </span>
          {formatBytes(attachment.size_bytes) ? <span style={{ opacity: 0.65 }}>{formatBytes(attachment.size_bytes)}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function ChatMessage({
  turn,
  copied,
  onCopy
}: {
  turn: ChatTurn;
  copied: boolean;
  onCopy: () => void;
}) {
  const [traceOpen, setTraceOpen] = useState(false);
  const renderedContent = turn.role === "user" ? stripCmapFileHints(turn.content) : turn.content;
  const trace = turn.toolTrace ?? [];
  const { count, errors } = useMemo(() => summarizeTrace(trace), [trace]);
  const durationLabel = formatDuration(turn.elapsedMs);
  const showFooter = turn.role === "assistant" && (count > 0 || Boolean(durationLabel));

  return (
    <div
      style={{
        alignSelf: turn.role === "user" ? "flex-end" : "flex-start",
        maxWidth: "min(900px, 100%)"
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid #eee",
          background: turn.role === "user" ? "#f8fafc" : "#fff"
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>{turn.role === "user" ? "You" : "CMAP"}</div>
        {renderedContent ? (
          turn.role === "assistant" ? (
            <MarkdownContent content={renderedContent} />
          ) : (
            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
                overflowWrap: "anywhere",
                wordBreak: "break-word"
              }}
            >
              {renderContentWithLinks(renderedContent)}
            </div>
          )
        ) : null}

        {turn.role === "user" ? <AttachmentChips attachments={turn.attachments} /> : null}
        {turn.role === "assistant" ? <ArtifactsView artifacts={turn.artifacts} /> : null}

        {turn.role === "assistant" && turn.code != null && turn.code.trim().length > 0 ? (
          <CodeBlock code={turn.code} copied={copied} onCopy={onCopy} />
        ) : null}

        {showFooter ? (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
                fontSize: 12,
                opacity: 0.72
              }}
            >
              {count > 0 ? (
                <button
                  type="button"
                  onClick={() => setTraceOpen((v) => !v)}
                  style={{
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    fontSize: 12,
                    fontWeight: 500,
                    opacity: 0.82
                  }}
                  aria-expanded={traceOpen}
                  aria-label={traceOpen ? "Hide tool trace" : "Show tool trace"}
                >
                  {errors > 0 ? `Tools (${count}, ${errors} error${errors === 1 ? "" : "s"})` : `Tools (${count})`}
                </button>
              ) : null}
              {durationLabel ? <span>{durationLabel}</span> : null}
            </div>

            {traceOpen ? <ToolTracePanel trace={trace} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
