import type { Artifact } from "../api/types";

export type CmapFileHintPayload = {
  source_artifact: Artifact;
  columns?: string[];
  instructions?: string;
};

const OPEN_TAG = "[CMAP_FILE]";
const CLOSE_TAG = "[/CMAP_FILE]";
const BLOCK_RE = /\n*\[CMAP_FILE\]\s*([\s\S]*?)\s*\[\/CMAP_FILE\]\n*/g;

export function sanitizeArtifactForHint(artifact: Artifact): Artifact {
  const next: Artifact = {
    type: artifact.type ?? "file",
    filename: artifact.filename,
    backend: artifact.backend,
    content_type: artifact.content_type,
    url: artifact.url,
    uri: artifact.uri,
    expires_in: artifact.expires_in,
    s3_bucket: artifact.s3_bucket,
    s3_key: artifact.s3_key,
    s3_uri: artifact.s3_uri,
    size_bytes: artifact.size_bytes
  };

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value != null && value !== "")) as Artifact;
}

export function buildCmapFileHintBlock(payload: CmapFileHintPayload): string {
  return `${OPEN_TAG}\n${JSON.stringify(payload, null, 2)}\n${CLOSE_TAG}`;
}

export function appendCmapFileHint(message: string, payload: CmapFileHintPayload): string {
  const base = message.trim();
  const block = buildCmapFileHintBlock(payload);
  return base.length > 0 ? `${base}\n\n${block}` : block;
}

export function stripCmapFileHints(content: string): string {
  return content.replace(BLOCK_RE, "\n").trim();
}

export function extractCmapFileHintPayloads(content: string): CmapFileHintPayload[] {
  const items: CmapFileHintPayload[] = [];
  let match: RegExpExecArray | null;

  BLOCK_RE.lastIndex = 0;
  while ((match = BLOCK_RE.exec(content)) !== null) {
    const inner = match[1]?.trim();
    if (!inner) continue;
    try {
      const parsed = JSON.parse(inner) as CmapFileHintPayload;
      if (parsed && typeof parsed === "object" && parsed.source_artifact) {
        items.push(parsed);
      }
    } catch {
      // Ignore malformed blocks so the rest of the message still renders.
    }
  }

  return items;
}

export function extractArtifactsFromCmapFileHints(content: string): Artifact[] {
  return extractCmapFileHintPayloads(content)
    .map((item) => item.source_artifact)
    .filter((artifact): artifact is Artifact => Boolean(artifact && typeof artifact === "object"));
}
