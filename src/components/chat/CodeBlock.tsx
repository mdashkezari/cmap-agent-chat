export function CodeBlock({
  code,
  copied,
  onCopy
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  if (!code || code.trim().length === 0) return null;

  return (
    <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Code (Python)</div>
        <button
          onClick={onCopy}
          style={{ fontSize: 12, padding: "6px 10px" }}
          title="Copy code to clipboard"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 12,
          borderRadius: 12,
          background: "#0b1020",
          color: "#e6e6e6",
          overflow: "auto",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        {code}
      </pre>
    </div>
  );
}
