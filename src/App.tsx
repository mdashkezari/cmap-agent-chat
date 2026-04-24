import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import { loadExamplesDismissed, saveExamplesDismissed, type ThreadMeta } from "./storage";
import type { ExampleItem } from "./types";

import examplesDataRaw from "./data/examples.json";

import { AppHeader } from "./components/layout/AppHeader";
import { Sidebar } from "./components/layout/Sidebar";
import { ExamplesModal } from "./components/ExamplesModal";

import { EmptyState } from "./components/chat/EmptyState";
import { MessageList } from "./components/chat/MessageList";
import { Composer } from "./components/chat/Composer";

import { useApiKey } from "./hooks/useApiKey";
import { useCmapAgentChat } from "./hooks/useCmapAgentChat";

export default function App() {
  const {
    apiKey,
    setApiKey,
    masked,
    saved: apiKeySaved,
    persist: persistApiKey,
    clear: clearApiKey
  } = useApiKey();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const {
    threadId,
    turns,
    sending,
    draft,
    setDraft,
    error,
    threads,
    threadsLoading,
    threadLoadingId,
    refreshThreads,
    clearThreads,
    attachedFile,
    attachFile,
    removeAttachedFile,
    onNewChat,
    onSelectThread,
    onSend
  } = useCmapAgentChat({ apiKey, sidebarOpen });

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);

  async function copyToClipboard(text: string, turnId?: string) {
    try {
      await navigator.clipboard.writeText(text);
      if (turnId) {
        setCopiedTurnId(turnId);
        window.setTimeout(() => setCopiedTurnId(null), 900);
      }
    } catch {
      // ignore
    }
  }

  const [examplesOpen, setExamplesOpen] = useState<boolean>(() => !loadExamplesDismissed());

  const examples: ExampleItem[] = useMemo(() => {
    const raw: any = examplesDataRaw as any;
    const list = Array.isArray(raw) ? raw : raw?.examples;
    return (Array.isArray(list) ? list : []) as ExampleItem[];
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length, threadId, sending]);

  function openExamples() {
    setExamplesOpen(true);
  }

  function closeExamples() {
    setExamplesOpen(false);
    saveExamplesDismissed(true);
  }

  function onPickExample(ex: ExampleItem) {
    if (!threadId) onNewChat();
    setDraft(ex.prompt);
    setExamplesOpen(false);
    composerRef.current?.focus();
  }

  function handleSaveApiKey() {
    persistApiKey();
    refreshThreads();
  }

  function handleClearApiKey() {
    clearApiKey();
    clearThreads();
    onNewChat();
  }

  function handleDragOver(e: DragEvent<HTMLElement>) {
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: DragEvent<HTMLElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragActive(false);
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    setDragActive(false);
    attachFile(e.dataTransfer.files[0]);
    composerRef.current?.focus();
  }

  const apiKeyPresent = Boolean(apiKey && apiKey.trim());

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <ExamplesModal open={examplesOpen} onClose={closeExamples} examples={examples} onPick={onPickExample} />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        apiKeyPresent={apiKeyPresent}
        threads={threads}
        activeThreadId={threadId}
        threadsLoading={threadsLoading}
        threadLoadingId={threadLoadingId}
        onNewChat={() => {
          onNewChat();
          composerRef.current?.focus();
        }}
        onOpenExamples={openExamples}
        onRefreshThreads={refreshThreads}
        onSelectThread={(t: ThreadMeta) => {
          onSelectThread(t);
          composerRef.current?.focus();
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          background: "#f3f4f6",
          position: "relative"
        }}
      >
        <div style={{ background: "white" }}>
          <AppHeader
            apiKey={apiKey}
            setApiKey={setApiKey}
            masked={masked}
            saved={apiKeySaved}
            onSave={handleSaveApiKey}
            onClear={handleClearApiKey}
          />
        </div>

        <main
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragActive ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 20,
                background: "rgba(15, 23, 42, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none"
              }}
            >
              <div
                style={{
                  border: "2px dashed #2563eb",
                  background: "rgba(255,255,255,0.96)",
                  color: "#0f172a",
                  borderRadius: 18,
                  padding: "24px 28px",
                  boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
                  fontWeight: 600,
                  textAlign: "center"
                }}
              >
                Drop a CSV or Parquet file to use as the colocalization source dataset
              </div>
            </div>
          ) : null}

          {turns.length === 0 ? (
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "16px 16px 0" }}>
              <EmptyState />
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "16px 16px 0" }}>
              <MessageList
                turns={turns}
                sending={sending}
                copiedTurnId={copiedTurnId}
                onCopyCode={copyToClipboard}
                bottomRef={bottomRef}
              />
            </div>
          )}

          <div style={{ borderTop: "1px solid #eee", padding: "12px 16px", background: "white" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 10 }}>
              {error ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "#b91c1c",
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    padding: "10px 12px",
                    borderRadius: 8
                  }}
                >
                  {error}
                </div>
              ) : null}

              <Composer
                draft={draft}
                setDraft={setDraft}
                sending={sending}
                onSend={onSend}
                composerRef={composerRef}
                attachedFile={attachedFile}
                onRemoveAttachedFile={removeAttachedFile}
              />

              <div style={{ fontSize: 12, opacity: 0.6 }}>Tip: Click Examples in the sidebar to insert a prompt template.</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
