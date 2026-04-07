export function EmptyState() {
  return (
    <div
      style={{ padding: "12px 0 24px" }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", opacity: 0.9 }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Start a new chat</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, display: "grid", gap: 10 }}>
          <div>
            Get an API key at{" "}
            <a
              href="https://simonscmap.org"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline" }}
            >
              simonscmap.org
            </a>{" "}
            › Documentation › API Key, paste it above, and click <b>Save</b>.
          </div>
          <div>Then start your conversation in the message box below.</div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "28px auto 0", opacity: 0.9 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, opacity: 0.85 }}>
          Use CMAP agent to:
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 14,
            lineHeight: 1.9,
            opacity: 0.85,
            textAlign: "left"
          }}
        >
          <li>Discover datasets and variables by topic, region, and time.</li>
          <li>Download subsets by time and location.</li>
          <li>Integrate (co-localize) datasets, and generate maps and plots.</li>
        </ul>
      </div>
    </div>
  );
}
