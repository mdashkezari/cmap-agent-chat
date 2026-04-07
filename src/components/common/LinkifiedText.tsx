import type { ReactNode } from "react";

export function renderContentWithLinks(content: string): ReactNode {
  // Replace raw URLs (especially long pre-signed S3 URLs) with compact hyperlinks.
  // We also avoid linkifying inside fenced code blocks (``` ... ```).
  const nodes: ReactNode[] = [];
  const chunks = content.split(/```/);

  const urlRe = /https?:\/\/[^\s<]+/g;
  let linkCounter = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Odd chunks are inside code fences.
    if (i % 2 === 1) {
      nodes.push("```" + chunk + "```");
      continue;
    }

    urlRe.lastIndex = 0;
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = urlRe.exec(chunk)) !== null) {
      const start = m.index;
      const rawMatch = m[0];
      const end = start + rawMatch.length;

      if (start > last) nodes.push(chunk.slice(last, start));

      // Trim trailing punctuation that commonly follows URLs in prose.
      let url = rawMatch;
      let suffix = "";
      const trailing = ".,;:!?)]}";

      while (url.length > 0 && trailing.includes(url[url.length - 1])) {
        suffix = url[url.length - 1] + suffix;
        url = url.slice(0, -1);
      }

      linkCounter += 1;
      const label = linkCounter === 1 ? "Link" : `Link ${linkCounter}`;

      nodes.push(
        <a
          key={`link-${i}-${start}-${linkCounter}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "underline" }}
        >
          {label}
        </a>
      );

      if (suffix) nodes.push(suffix);

      last = end;
    }

    if (last < chunk.length) nodes.push(chunk.slice(last));
  }

  return nodes;
}
