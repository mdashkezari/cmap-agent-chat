import type { Artifact, ToolTraceItem } from "./api/types";

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifacts?: Artifact[];
  attachments?: Artifact[];
  code?: string | null;
  toolTrace?: ToolTraceItem[];
  elapsedMs?: number | null;
};
