export type FrontendConfig = {
  apiBaseUrl: string;
  defaultProvider: string;
  defaultModel: string;
  maxToolCalls: number;
  returnCode: boolean;
};

function mustGetEnv(name: string, fallback?: string): string {
  const v = (import.meta as any).env?.[name] as string | undefined;
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

export const CONFIG: FrontendConfig = {
  apiBaseUrl: mustGetEnv("VITE_API_BASE_URL", "https://agent.simonscmap.ai"),
  defaultProvider: mustGetEnv("VITE_LLM_PROVIDER", "openai"),
  defaultModel: mustGetEnv("VITE_LLM_MODEL", "gpt-4.1-mini"),
  maxToolCalls: Number(mustGetEnv("VITE_MAX_TOOL_CALLS", "8")),
  returnCode: (mustGetEnv("VITE_RETURN_CODE", "true").toLowerCase() === "true")
};
