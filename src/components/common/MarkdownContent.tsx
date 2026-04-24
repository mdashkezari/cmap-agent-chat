import { Children, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders assistant message content as Markdown with GitHub-flavored extensions
// (tables, task lists, strikethrough, autolinks). Raw HTML in the source is
// intentionally not rendered, which prevents injection from model output.
//
// Bare URLs (where the visible link text equals the href) are collapsed to
// "Link" / "Link 2" / "Link 3" within each message. Markdown links written
// with an explicit label keep that label, so a deliberately authored
// "[Dataset docs](https://...)" still reads as "Dataset docs".
//
// Styling is intentionally restrained to match the rest of the chat UI:
// - paragraph and list spacing is compact,
// - headings stay close to body weight,
// - inline code and fenced code share a consistent monospace look,
// - links open in a new tab and are visually understated.
function flattenChildrenToString(children: ReactNode): string {
  let out = "";
  Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      out += String(child);
    }
  });
  return out;
}

export function MarkdownContent({ content }: { content: string }): ReactNode {
  if (!content) return null;

  // Per-message link counter. Re-created on each render of this component
  // (which is one assistant message), so numbering restarts per message.
  let bareLinkCounter = 0;

  return (
    <div className="cmap-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...rest }) {
            const label = flattenChildrenToString(children).trim();
            const isHttpUrl = typeof href === "string" && /^https?:\/\//i.test(href);
            const isBareUrl = isHttpUrl && label === href;

            if (isBareUrl) {
              bareLinkCounter += 1;
              const collapsed = bareLinkCounter === 1 ? "Link" : `Link ${bareLinkCounter}`;
              return (
                <a href={href} target="_blank" rel="noreferrer" title={href} {...rest}>
                  {collapsed}
                </a>
              );
            }

            return (
              <a href={href} target="_blank" rel="noreferrer" {...rest}>
                {children}
              </a>
            );
          },
          // Tables get a thin wrapper so wide tables can scroll horizontally
          // without breaking the message bubble layout.
          table({ children }) {
            return (
              <div className="cmap-md-table-wrap">
                <table>{children}</table>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
