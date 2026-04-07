import { resolveUrl } from "../../api/client";
import type { Artifact } from "../../api/types";

function artifactUrl(a: Artifact): string {
  const raw = a.url ?? a.uri ?? "";
  if (!raw) return "";
  if (raw.startsWith("/")) return resolveUrl(raw);
  return raw;
}

function isImageArtifact(a: Artifact): boolean {
  const t = (a.type ?? "").toLowerCase();
  const ct = (a.content_type ?? "").toLowerCase();
  return t === "image" || ct.startsWith("image/");
}

function artifactLabel(a: Artifact): string {
  return a.filename ?? a.content_type ?? a.type ?? "artifact";
}

export function ArtifactsView({ artifacts }: { artifacts?: Artifact[] }) {
  if (!artifacts || artifacts.length === 0) return null;

  return (
    <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
      {artifacts.map((a, idx) => {
        const url = artifactUrl(a);
        if (!url) return null;

        if (isImageArtifact(a)) {
          return (
            <div key={idx} style={{ display: "grid", gap: 6 }}>
              <img
                src={url}
                alt={a.filename ?? "artifact"}
                style={{
                  maxWidth: "min(720px, 100%)",
                  borderRadius: 12,
                  border: "1px solid #eee"
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.75,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap"
                }}
              >
                <span>{artifactLabel(a)}</span>
                <a href={url} target="_blank" rel="noreferrer">
                  Open
                </a>
                <a href={url} target="_blank" rel="noreferrer" download={a.filename ?? undefined}>
                  Download
                </a>
                {a.expires_in ? <span>(expires in ~{a.expires_in}s)</span> : null}
              </div>
            </div>
          );
        }

        return (
          <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12 }}>{artifactLabel(a)}</span>
            <a href={url} target="_blank" rel="noreferrer" download={a.filename ?? undefined}>
              Download
            </a>
            {a.expires_in ? (
              <span style={{ fontSize: 12, opacity: 0.7 }}>(expires in ~{a.expires_in}s)</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
