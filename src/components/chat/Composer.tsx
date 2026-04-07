import type { RefObject } from "react";
import { Spinner } from "../common/Spinner";

function formatBytes(size?: number): string | null {
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function Composer({
  draft,
  setDraft,
  sending,
  onSend,
  composerRef,
  attachedFile,
  onRemoveAttachedFile
}: {
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  onSend: () => void;
  composerRef: RefObject<HTMLTextAreaElement>;
  attachedFile: File | null;
  onRemoveAttachedFile: () => void;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {attachedFile ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              borderRadius: 9999,
              padding: "8px 12px",
              fontSize: 13,
              maxWidth: "100%"
            }}
            title={attachedFile.name}
          >
            <span aria-hidden="true">📎</span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 320
              }}
            >
              {attachedFile.name}
            </span>
            {formatBytes(attachedFile.size) ? <span style={{ opacity: 0.7 }}>{formatBytes(attachedFile.size)}</span> : null}
            <button
              type="button"
              onClick={onRemoveAttachedFile}
              disabled={sending}
              style={{ padding: "4px 8px", fontSize: 12 }}
              aria-label="Remove attached file"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          ref={composerRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message CMAP…"
          rows={3}
          style={{ flex: 1, resize: "vertical" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!sending) onSend();
            }
          }}
        />
        <button onClick={onSend} disabled={sending || draft.trim().length === 0}>
          {sending ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Spinner size={14} />
              Sending…
            </span>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </div>
  );
}
