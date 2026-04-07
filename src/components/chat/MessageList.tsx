import type { RefObject } from "react";
import type { ChatTurn } from "../../uiTypes";
import { ChatMessage } from "./ChatMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";

export function MessageList({
  turns,
  sending,
  copiedTurnId,
  onCopyCode,
  bottomRef
}: {
  turns: ChatTurn[];
  sending: boolean;
  copiedTurnId: string | null;
  onCopyCode: (code: string, turnId: string) => void;
  bottomRef: RefObject<HTMLDivElement>;
}) {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 900, margin: "0 auto" }}>
      {turns.map((t) => (
        <ChatMessage
          key={t.id}
          turn={t}
          copied={copiedTurnId === t.id}
          onCopy={() => onCopyCode(t.code ?? "", t.id)}
        />
      ))}

      {sending ? <ThinkingIndicator /> : null}

      <div ref={bottomRef} />
    </div>
  );
}
