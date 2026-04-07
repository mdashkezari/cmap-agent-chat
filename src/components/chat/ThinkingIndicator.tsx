import { Spinner } from "../common/Spinner";

export function ThinkingIndicator() {
  return (
    <div style={{ alignSelf: "flex-start", maxWidth: "min(900px, 100%)" }}>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid #eee",
          background: "#fff"
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>CMAP</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Spinner size={14} />
          <div style={{ opacity: 0.85 }}>Thinking…</div>
        </div>
      </div>
    </div>
  );
}
