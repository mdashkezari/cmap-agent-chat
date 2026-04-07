// API-facing types. These match the CMAP Agent FastAPI endpoints.

export type LlmConfig = {
  provider: "openai" | "anthropic" | string;
  model: string;
};

export type ChatOptions = {
  return_code?: boolean;
  max_tool_calls?: number | null;
};

export type ChatRequest = {
  user_id?: number;
  thread_id?: string | null;
  message: string;
  llm?: LlmConfig;
  options?: ChatOptions;
};

export type Artifact = {
  type?: "image" | "data" | "file" | string;
  url?: string;
  uri?: string;
  filename?: string;
  backend?: "local" | "s3" | string;
  content_type?: string;
  expires_in?: number;
  s3_bucket?: string;
  s3_key?: string;
  s3_uri?: string;
  size_bytes?: number;
};

export type UploadLimits = {
  max_bytes?: number;
  allowed_exts?: string[];
};

export type PresignedUpload = {
  method?: "PUT" | string;
  url: string;
  headers?: Record<string, string>;
  expires_in?: number;
};

export type UploadResponse = {
  status?: string;
  upload_id: string;
  thread_id?: string | null;
  upload: PresignedUpload;
  artifact: Artifact;
  limits?: UploadLimits;
};

export type PresignUploadRequest = {
  user_id?: number;
  filename: string;
  size_bytes: number;
  content_type?: string;
  thread_id?: string | null;
};

export type ToolTraceItem = {
  tool?: string;
  status?: "ok" | "error" | "cached" | string;
  arguments?: Record<string, any>;
  original_arguments?: Record<string, any>;
  arg_sanitized?: boolean;
  result_preview?: any;
  error?: any;
};

export type ChatResponse = {
  thread_id: string;
  assistant_message: string;
  code?: string | null;
  artifacts?: Artifact[];
  tool_trace?: ToolTraceItem[];
};

export type ThreadItem = {
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string | null;
  last_role?: string | null;
  summary?: string | null;
};

export type ThreadListResponse = {
  threads: ThreadItem[];
};

export type ThreadMessageItem = {
  message_id: number;
  role: string;
  content: string;
  created_at: string;
};

export type ThreadMessagesResponse = {
  thread_id: string;
  title?: string | null;
  messages: ThreadMessageItem[];
};
