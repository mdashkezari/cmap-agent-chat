import React, { useEffect, useMemo } from "react";
import type { ExampleItem } from "../types";

type Props = {
  open: boolean;
  examples: ExampleItem[];
  onClose: () => void;
  onPick: (ex: ExampleItem) => void;
};

function groupByCategory(examples: ExampleItem[]): Array<{ category: string; items: ExampleItem[] }> {
  const map = new Map<string, ExampleItem[]>();
  for (const ex of examples) {
    const cat = (ex.category ?? "Examples").trim() || "Examples";
    const arr = map.get(cat) ?? [];
    arr.push(ex);
    map.set(cat, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, items]) => ({ category, items }));
}

export function ExamplesModal({ open, examples, onClose, onPick }: Props) {
  const grouped = useMemo(() => groupByCategory(examples), [examples]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="cmap-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Examples"
      onMouseDown={e => {
        // close when clicking outside the modal
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cmap-modal">
        <div className="cmap-modal-header">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Examples</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Click an example to paste it into the message box.
            </div>
          </div>
          <button onClick={onClose} aria-label="Close examples">
            Close
          </button>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
          {grouped.map(group => (
            <div key={group.category} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 750, fontSize: 14 }}>{group.category}</div>
              <div className="cmap-examples-grid">
                {group.items.map(ex => (
                  <div
                    key={ex.id}
                    className="cmap-example-card"
                    onClick={() => onPick(ex)}
                    title="Click to use"
                  >
                    <div style={{ fontWeight: 750, marginBottom: 4 }}>{ex.title}</div>
                    {ex.description ? (
                      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>{ex.description}</div>
                    ) : null}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(ex.tags ?? []).slice(0, 4).map(tag => (
                        <span key={tag} className="cmap-pill">
                          {tag}
                        </span>
                      ))}

                      {(ex.expected_artifacts ?? []).length ? (
                        <span className="cmap-pill">
                          returns: {(ex.expected_artifacts ?? []).join(", ")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
