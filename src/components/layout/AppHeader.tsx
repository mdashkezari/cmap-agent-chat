export function AppHeader({
  apiKey,
  setApiKey,
  masked,
  saved,
  onSave,
  onClear
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  masked: string;
  saved: boolean;
  onSave: () => void;
  onClear: () => void;
}) {
  return (
    <header style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <span>Simons CMAP Agent</span>
            <a href="/build-info.json" target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 500 }}>
              build
            </a>
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2, lineHeight: 1.2 }}>Under Active Development</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>API key</label>
            <input
              className="cmap-input"
              type="password"
              placeholder="Paste CMAP API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ width: 320, maxWidth: "45vw" }}
            />
            <button className="cmap-btn" onClick={onSave} title="Save API key in this browser">
              {saved ? "Saved" : "Save"}
            </button>
            <button className="cmap-btn cmap-btn-secondary" onClick={onClear} title="Clear API key from this browser">
              Clear
            </button>
            {apiKey ? (
              <span style={{ fontSize: 12, opacity: 0.55 }} title={apiKey}>
                ({masked})
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
