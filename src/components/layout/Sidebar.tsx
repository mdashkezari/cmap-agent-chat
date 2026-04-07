import type { ThreadMeta } from "../../storage";
import { Spinner } from "../common/Spinner";

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  apiKeyPresent,
  threads,
  activeThreadId,
  threadsLoading,
  threadLoadingId,
  onNewChat,
  onOpenExamples,
  onRefreshThreads,
  onSelectThread
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  apiKeyPresent: boolean;
  threads: ThreadMeta[];
  activeThreadId: string | null;
  threadsLoading: boolean;
  threadLoadingId: string | null;
  onNewChat: () => void;
  onOpenExamples: () => void;
  onRefreshThreads: () => void;
  onSelectThread: (t: ThreadMeta) => void;
}) {
  return (
    <aside
      style={{
        width: sidebarOpen ? 280 : 56,
        transition: "width 180ms ease",
        borderRight: "1px solid #eee",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 10px",
          borderBottom: "1px solid #eee"
        }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          style={{ padding: "8px 10px", borderRadius: 10 }}
        >
          ☰
        </button>

        {sidebarOpen ? <div style={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>Chats</div> : null}
      </div>

      <div style={{ padding: 10, borderBottom: sidebarOpen ? "1px solid #eee" : "none" }}>
        <button
          onClick={onNewChat}
          title="Start a new chat"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarOpen ? "flex-start" : "center",
            gap: 10
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
          {sidebarOpen ? <span>New chat</span> : null}
        </button>

        <button
          onClick={onOpenExamples}
          title="Open example prompts"
          style={{
            width: "100%",
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarOpen ? "flex-start" : "center",
            gap: 10
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>✦</span>
          {sidebarOpen ? <span>Examples</span> : null}
        </button>

        {sidebarOpen ? (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.75 }}>Recent</div>
            <button
              onClick={onRefreshThreads}
              disabled={threadsLoading || !apiKeyPresent}
              title={!apiKeyPresent ? "Set an API key to load threads" : "Refresh thread list"}
              style={{ padding: "6px 10px", fontSize: 12 }}
            >
              {threadsLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Spinner size={12} />
                  Loading
                </span>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        ) : null}
      </div>

      {sidebarOpen ? (
        <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
          {!apiKeyPresent ? (
            <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>Set an API key to load your threads.</div>
          ) : null}

          {threads.length === 0 && apiKeyPresent ? (
            <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>No chats yet. Start one with “New chat”.</div>
          ) : null}

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {threads.map((t) => {
              const active = t.thread_id === activeThreadId;
              const loading = threadLoadingId === t.thread_id;

              return (
                <button
                  key={t.thread_id}
                  onClick={() => onSelectThread(t)}
                  disabled={!apiKeyPresent || loading}
                  title={t.title}
                  style={{
                    textAlign: "left",
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: active ? "#eef2ff" : "#fff",
                    display: "grid",
                    gap: 4
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {t.title || "New chat"}
                    </div>
                    {loading ? <Spinner size={12} /> : null}
                  </div>
                  {t.updated_at ? <div style={{ fontSize: 11, opacity: 0.6 }}>{new Date(t.updated_at).toLocaleString()}</div> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // collapsed spacer so the bottom doesn't jump
        <div style={{ flex: 1 }} />
      )}
    </aside>
  );
}
